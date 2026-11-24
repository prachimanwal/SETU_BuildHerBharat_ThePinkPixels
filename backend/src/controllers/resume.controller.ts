import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Resume } from '../models/Resume';
import { UploadedResumeFile } from '../models/UploadedResumeFile';
import { Portfolio } from '../models/Portfolio';
import { AssessmentResult } from '../models/AssessmentResult';
import { sendSuccess, sendError } from '../utils/response';
import {
  extractRawTextFromResumeBuffer,
  parseStructuredResumeText,
  createEmptyExtractedResumeData,
  validateResumeFileSignature,
  ResumeFileCorruptedError
} from '../services/resumeParser.service';
import { recordUserProgressSnapshot } from '../services/progressSnapshot.service';
import {
  generateResumePdfBuffer,
  generateResumeDocxBuffer
} from '../services/resumeExport.service';
import { generateCaneCompletion } from '../services/caneAI.service';
import { getProfileCompletionDetails, serializeUser } from '../utils/userSerializer';

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'SETU_Resume';

export const getResumes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const [resumes, uploadedFiles] = await Promise.all([
      Resume.find({ userId: req.user._id }).sort({ isDefault: -1, updatedAt: -1 }),
      UploadedResumeFile.find({ userId: req.user._id })
        .select('-fileData -extractedText')
        .sort({ updatedAt: -1 })
    ]);

    sendSuccess(res, 'Resumes retrieved successfully', {
      resumes,
      uploadedFiles
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch resumes', 500);
  }
};

export const getResumePrefill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const [projects, attempts] = await Promise.all([
      Portfolio.find({ userId: req.user._id }).sort({ featured: -1, createdAt: -1 }),
      AssessmentResult.find({ userId: req.user._id, passed: true }).sort({ percentage: -1 })
    ]);

    const bestScoreByDomain = new Map<string, number>();
    attempts.forEach((att) => {
      const key = (att.domain || '').toLowerCase();
      if (!bestScoreByDomain.has(key) || att.percentage > bestScoreByDomain.get(key)!) {
        bestScoreByDomain.set(key, att.percentage);
      }
    });

    const sp = req.user.seekerProfile || {};
    const education = (Array.isArray(sp.education) ? sp.education : []).map((e) => {
      let scoreStr = '';
      if (e.scoreType === 'Percentage' && typeof e.percentage === 'number') {
        scoreStr = `${e.percentage}%`;
      } else if (e.scoreType === 'CGPA' && typeof e.cgpa === 'number') {
        scoreStr = `${e.cgpa}/${e.cgpaScale || 10} CGPA`;
      } else if (e.scoreType === 'Grade' && e.grade) {
        scoreStr = `Grade ${e.grade}`;
      }
      return {
        qualification: e.level || '',
        institution: e.institution || e.schoolName || '',
        degree: e.degree || e.classCompleted || e.level || '',
        specialization: e.specialization || e.stream || '',
        startYear: '',
        graduationYear: e.graduationYear || e.expectedGraduationYear || '',
        score: scoreStr
      };
    });

    const detailedSkills =
      Array.isArray(sp.detailedSkills) && sp.detailedSkills.length > 0
        ? sp.detailedSkills.map((s) => {
            const verified = Boolean(s.verified || s.source === 'assessment_verified');
            const matchedScore = bestScoreByDomain.get(s.name.toLowerCase()) ?? null;
            return {
              name: s.name,
              category: s.category || 'General',
              verified: verified || matchedScore !== null,
              assessmentScore: matchedScore
            };
          })
        : (Array.isArray(sp.skills) ? sp.skills : []).map((name) => ({
            name,
            category: 'General',
            verified: bestScoreByDomain.has(name.toLowerCase()),
            assessmentScore: bestScoreByDomain.get(name.toLowerCase()) ?? null
          }));

    const mappedProjects = projects.map((p) => ({
      title: p.title,
      description: p.description,
      technologies:
        Array.isArray(p.technologies) && p.technologies.length > 0 ? p.technologies : p.skills || [],
      projectType: p.projectType || 'Individual',
      role: p.role || '',
      duration: p.duration || '',
      skillsDemonstrated: p.skills || [],
      projectLink: p.workSampleUrl || '',
      githubLink: p.githubUrl || '',
      attachmentLink: p.documentUrl || ''
    }));

    const mappedExp = (Array.isArray(sp.experience) ? sp.experience : []).map((ex) => ({
      jobTitle: ex.jobTitle,
      companyName: ex.organization,
      employmentType: ex.employmentType || 'Full-time',
      startDate: ex.startDate || '',
      endDate: ex.endDate || '',
      isCurrent: Boolean(ex.isCurrent),
      responsibilities: ex.responsibilities || '',
      achievements: ex.achievements || ''
    }));

    sendSuccess(res, 'Resume prefill data generated from SETU profile', {
      versionName: `${req.user.name || 'My'} Resume`,
      template: mappedExp.length === 0 ? 'student_fresher' : 'ats_professional',
      personalInfo: {
        fullName: req.user.name || '',
        email: req.user.email || '',
        phone: sp.phone || '',
        city: sp.location?.city || '',
        state: sp.location?.state || '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: sp.resumeUrl || ''
      },
      careerObjective: {
        targetRole: (sp.careerGoalsList || [])[0] || sp.headline || '',
        interests: (sp.interests || []).join(', '),
        strongestSkills: detailedSkills.slice(0, 4).map((s) => s.name).join(', '),
        summary: sp.bio || ''
      },
      education,
      skills: detailedSkills,
      hasProjects: mappedProjects.length > 0,
      projects: mappedProjects,
      hasWorkExperience: mappedExp.length > 0,
      workExperience: mappedExp,
      certifications: [],
      awards: [],
      volunteering: []
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to prefill resume', 500);
  }
};

export const createResume = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const existingCount = await Resume.countDocuments({ userId: req.user._id });
    const shouldBeDefault = req.body?.isDefault === true || existingCount === 0;

    if (shouldBeDefault) {
      await Resume.updateMany({ userId: req.user._id }, { $set: { isDefault: false } });
    }

    const resume = new Resume({
      ...req.body,
      userId: req.user._id,
      isDefault: shouldBeDefault,
      versionName: String(req.body?.versionName || `Resume v${existingCount + 1}`).trim()
    });

    await resume.save();
    void recordUserProgressSnapshot(req.user._id);
    sendSuccess(res, 'Resume saved successfully', resume, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create resume', 500);
  }
};

export const updateResume = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      sendError(res, 'Resume not found', 404);
      return;
    }
    if (resume.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied. You can only modify your own resumes.', 403);
      return;
    }

    if (req.body?.isDefault === true) {
      await Resume.updateMany(
        { userId: req.user._id, _id: { $ne: resume._id } },
        { $set: { isDefault: false } }
      );
    }

    const updatableFields = [
      'versionName',
      'template',
      'isDefault',
      'status',
      'shareWithEmployers',
      'sectionOrder',
      'personalInfo',
      'careerObjective',
      'education',
      'skills',
      'hasProjects',
      'projects',
      'hasWorkExperience',
      'workExperience',
      'certifications',
      'awards',
      'volunteering'
    ];

    for (const key of updatableFields) {
      if (req.body[key] !== undefined) {
        (resume as any)[key] = req.body[key];
      }
    }

    await resume.save();
    sendSuccess(res, 'Resume updated successfully', resume);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update resume', 500);
  }
};

export const deleteResume = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      sendError(res, 'Resume not found', 404);
      return;
    }
    if (resume.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    const wasDefault = Boolean(resume.isDefault);
    await Resume.findByIdAndDelete(resume._id);

    let newDefaultId: string | null = null;
    if (wasDefault) {
      const nextDefault = await Resume.findOne({ userId: req.user._id }).sort({ updatedAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
        newDefaultId = nextDefault._id.toString();
      }
    }

    void recordUserProgressSnapshot(req.user._id);
    sendSuccess(res, 'Resume deleted successfully', {
      deletedId: resume._id.toString(),
      wasDefault,
      newDefaultId
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete resume', 500);
  }
};

export const downloadResumePdf = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      sendError(res, 'Resume not found', 404);
      return;
    }
    if (resume.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    const pdfBuffer = await generateResumePdfBuffer(resume);
    const filename = `${sanitizeFilename(resume.personalInfo?.fullName || resume.versionName)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to generate PDF resume', 500);
  }
};

export const downloadResumeDocx = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      sendError(res, 'Resume not found', 404);
      return;
    }
    if (resume.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    const docxBuffer = await generateResumeDocxBuffer(resume);
    const filename = `${sanitizeFilename(resume.personalInfo?.fullName || resume.versionName)}.docx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(docxBuffer);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to generate DOCX resume', 500);
  }
};

// ==================== RESUME UPLOAD & PARSING ====================

const INLINE_PARSE_WAIT_MS = 10_000;
const HARD_PARSE_CAP_MS = 25_000;

async function parseBufferWithCap(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<{ ok: true; text: string } | { ok: false; corrupted: boolean; error: string }> {
  let timer: NodeJS.Timeout | undefined;
  try {
    const text = await Promise.race<string>([
      extractRawTextFromResumeBuffer(buffer, mimeType, filename),
      new Promise<string>((_, reject) => {
        timer = setTimeout(() => reject(new Error('PARSE_TIMEOUT')), HARD_PARSE_CAP_MS);
      })
    ]);
    return { ok: true, text };
  } catch (err: any) {
    if (err instanceof ResumeFileCorruptedError) {
      return { ok: false, corrupted: true, error: err.message };
    }
    if (err?.message === 'PARSE_TIMEOUT') {
      return {
        ok: false,
        corrupted: false,
        error:
          'Automatic text extraction took too long for this document. Your file was uploaded safely—you can enter or review details manually.'
      };
    }
    return {
      ok: false,
      corrupted: true,
      error:
        'We could not parse this resume file. Please ensure it is a valid, unencrypted PDF or DOCX document and try again.'
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const uploadAndParseResume = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      sendError(res, 'Database connection is temporarily unavailable. Please try again shortly.', 503);
      return;
    }

    const idempotencyKey = String(req.headers['x-idempotency-key'] || '').trim().slice(0, 128);
    if (idempotencyKey) {
      const existingByKey = await UploadedResumeFile.findOne({
        userId: req.user._id,
        idempotencyKey
      });
      if (existingByKey) {
        sendSuccess(
          res,
          existingByKey.parseStatus === 'processing'
            ? 'Resume upload already received and currently parsing.'
            : 'Resume uploaded and parsed for your review.',
          {
            uploadId: existingByKey._id,
            versionNumber: existingByKey.versionNumber || 1,
            originalFilename: existingByKey.originalFilename,
            sizeBytes: existingByKey.sizeBytes,
            shareWithEmployers: existingByKey.shareWithEmployers,
            parseStatus: existingByKey.parseStatus || 'completed',
            extractedData: existingByKey.extractedData,
            parseWarning: existingByKey.parseWarning || '',
            parseError: existingByKey.parseError || '',
            createdAt: existingByKey.createdAt
          },
          existingByKey.parseStatus === 'processing' ? 202 : 201
        );
        return;
      }
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      sendError(res, 'Please select a PDF or DOCX resume file (max 5 MB).', 400);
      return;
    }

    if (!file.buffer || file.size === 0 || file.buffer.length === 0) {
      sendError(res, 'The uploaded file is empty. Please select a valid PDF or DOCX resume.', 400);
      return;
    }

    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream'
    ];
    const lowerName = (file.originalname || '').toLowerCase();
    const isAllowedExt = lowerName.endsWith('.pdf') || lowerName.endsWith('.docx');

    if (!isAllowedExt || !allowedMimes.includes(file.mimetype)) {
      sendError(res, 'Only PDF and DOCX files are supported.', 400);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      sendError(res, 'Resume file exceeds the 5 MB maximum size limit.', 400);
      return;
    }

    // Validate binary magic bytes synchronously BEFORE storing anything in MongoDB
    try {
      validateResumeFileSignature(file.buffer, file.mimetype, file.originalname);
    } catch (sigErr: any) {
      sendError(
        res,
        sigErr?.message || 'This file is not a valid PDF or DOCX document.',
        400
      );
      return;
    }

    const normalizedMime = lowerName.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

    // Preserve all existing uploaded resume versions and increment version number
    const existingCount = await UploadedResumeFile.countDocuments({ userId: req.user._id });
    const versionNumber = existingCount + 1;

    // Store private binary persistently inside MongoDB Atlas `resumeversions` collection (never ephemeral disk)
    const uploadedDoc = new UploadedResumeFile({
      userId: req.user._id,
      versionNumber,
      originalFilename: file.originalname,
      mimeType: normalizedMime,
      sizeBytes: file.size,
      fileData: file.buffer,
      extractedText: '',
      extractedData: createEmptyExtractedResumeData(),
      confirmedByUser: false,
      shareWithEmployers: false,
      parseStatus: 'processing',
      parseWarning: '',
      parseError: '',
      idempotencyKey
    });

    await uploadedDoc.save();

    // Start parsing; race against INLINE_PARSE_WAIT_MS so fast files return 201 immediately
    // while unusually heavy PDFs transition cleanly to 202 async status polling without timing out
    const parseTask = parseBufferWithCap(file.buffer, normalizedMime, file.originalname);
    const raceResult = await Promise.race([
      parseTask.then((r) => ({ finished: true as const, result: r })),
      new Promise<{ finished: false }>((resolve) =>
        setTimeout(() => resolve({ finished: false }), INLINE_PARSE_WAIT_MS)
      )
    ]);

    if (raceResult.finished) {
      const outcome = raceResult.result;
      if (!outcome.ok && outcome.corrupted) {
        // Delete unparseable corrupted doc so junk never pollutes user's version history
        await UploadedResumeFile.findByIdAndDelete(uploadedDoc._id).catch(() => {});
        sendError(res, outcome.error, 400);
        return;
      }

      const extractedText = outcome.ok ? outcome.text : '';
      const parseWarning = !outcome.ok
        ? outcome.error
        : !extractedText
        ? 'Your resume was uploaded securely, but no selectable text was found (it may be a scanned image). Please enter or verify your details below before saving.'
        : '';

      const extractedData = extractedText
        ? parseStructuredResumeText(extractedText)
        : createEmptyExtractedResumeData();

      uploadedDoc.extractedText = extractedText.slice(0, 25000);
      uploadedDoc.extractedData = extractedData;
      uploadedDoc.parseStatus = 'completed';
      uploadedDoc.parseWarning = parseWarning;
      await uploadedDoc.save();
      void recordUserProgressSnapshot(req.user._id);

      sendSuccess(
        res,
        'Resume uploaded and parsed for your review. No profile fields were overwritten yet.',
        {
          uploadId: uploadedDoc._id,
          versionNumber: uploadedDoc.versionNumber,
          originalFilename: uploadedDoc.originalFilename,
          sizeBytes: uploadedDoc.sizeBytes,
          shareWithEmployers: uploadedDoc.shareWithEmployers,
          parseStatus: 'completed',
          extractedData,
          parseWarning,
          createdAt: uploadedDoc.createdAt
        },
        201
      );
      return;
    }

    // Slow parse: complete safely in background and let frontend poll GET /api/resumes/upload/:id/status
    const userIdForSnapshot = req.user._id;
    parseTask
      .then(async (outcome) => {
        if (!outcome.ok && outcome.corrupted) {
          await UploadedResumeFile.findByIdAndUpdate(uploadedDoc._id, {
            $set: { parseStatus: 'failed', parseError: outcome.error }
          }).catch(() => {});
          return;
        }
        const extractedText = outcome.ok ? outcome.text : '';
        const parseWarning = !outcome.ok
          ? outcome.error
          : !extractedText
          ? 'No selectable text was found in this document. Please review or enter details manually.'
          : '';
        const extractedData = extractedText
          ? parseStructuredResumeText(extractedText)
          : createEmptyExtractedResumeData();

        await UploadedResumeFile.findByIdAndUpdate(uploadedDoc._id, {
          $set: {
            extractedText: extractedText.slice(0, 25000),
            extractedData,
            parseStatus: 'completed',
            parseWarning
          }
        }).catch(() => {});
        void recordUserProgressSnapshot(userIdForSnapshot);
      })
      .catch(() => {});

    sendSuccess(
      res,
      'Resume uploaded securely. Extracting details in background...',
      {
        uploadId: uploadedDoc._id,
        versionNumber: uploadedDoc.versionNumber,
        originalFilename: uploadedDoc.originalFilename,
        sizeBytes: uploadedDoc.sizeBytes,
        shareWithEmployers: uploadedDoc.shareWithEmployers,
        parseStatus: 'processing',
        createdAt: uploadedDoc.createdAt
      },
      202
    );
  } catch (error: any) {
    console.error('[Resume Upload] Unexpected error:', error?.name || 'Error', error?.message || '');
    sendError(
      res,
      'Could not upload and process your resume right now. Please try again shortly.',
      500
    );
  }
};

export const getUploadedResumeStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const upload = await UploadedResumeFile.findById(req.params.id).select(
      '-fileData -extractedText'
    );
    if (!upload) {
      sendError(res, 'Uploaded resume not found', 404);
      return;
    }
    if (upload.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    sendSuccess(res, 'Resume parse status retrieved', {
      uploadId: upload._id,
      versionNumber: upload.versionNumber || 1,
      originalFilename: upload.originalFilename,
      sizeBytes: upload.sizeBytes,
      shareWithEmployers: upload.shareWithEmployers,
      parseStatus: upload.parseStatus || 'completed',
      extractedData: upload.extractedData,
      parseWarning: upload.parseWarning || '',
      parseError: upload.parseError || '',
      createdAt: upload.createdAt
    });
  } catch (error: any) {
    sendError(res, 'Could not check resume status right now.', 500);
  }
};

export const confirmUploadedResumeData = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const upload = await UploadedResumeFile.findById(req.params.id);
    if (!upload) {
      sendError(res, 'Uploaded resume not found', 404);
      return;
    }
    if (upload.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    const confirmed = req.body?.extractedData || upload.extractedData || {};
    const sp = req.user.seekerProfile || ({} as any);

    // Merge confirmed skills without overwriting existing verified flags
    if (Array.isArray(confirmed.skills) && confirmed.skills.length > 0) {
      const existingDetailed = Array.isArray(sp.detailedSkills) ? [...sp.detailedSkills] : [];
      const existingFlat = Array.isArray(sp.skills) ? [...sp.skills] : [];

      for (const skName of confirmed.skills) {
        const clean = String(skName || '').trim();
        if (!clean) continue;
        if (!existingDetailed.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
          existingDetailed.push({
            name: clean,
            category: 'General',
            proficiency: 'Intermediate',
            verified: false,
            source: 'self_reported'
          });
        }
        if (!existingFlat.some((s) => s.toLowerCase() === clean.toLowerCase())) {
          existingFlat.push(clean);
        }
      }
      sp.detailedSkills = existingDetailed;
      sp.skills = existingFlat;
    }

    // Merge confirmed education entries if user approved them
    if (Array.isArray(confirmed.education) && confirmed.education.length > 0) {
      const existingEdu = Array.isArray(sp.education) ? [...sp.education] : [];
      for (const ed of confirmed.education) {
        if (!ed?.level && !ed?.degree) continue;
        const already = existingEdu.some(
          (ex) =>
            (ex.degree || '').toLowerCase() === String(ed.degree || '').toLowerCase() &&
            ex.level === (ed.level || 'Graduate')
        );
        if (!already) {
          existingEdu.push({
            level: ed.level || 'Graduate',
            degree: ed.degree || '',
            institution: ed.institution || '',
            graduationYear: ed.graduationYear || '',
            status: 'Completed'
          });
        }
      }
      sp.education = existingEdu;
    }

    // Merge confirmed career interests
    if (Array.isArray(confirmed.careerInterests) && confirmed.careerInterests.length > 0) {
      const existingInterests = Array.isArray(sp.interests) ? [...sp.interests] : [];
      for (const intr of confirmed.careerInterests) {
        const clean = String(intr || '').trim();
        if (clean && !existingInterests.includes(clean)) existingInterests.push(clean);
      }
      sp.interests = existingInterests;
    }

    // Merge confirmed work experience & internships (deduplicated)
    const existingExp = Array.isArray(sp.experience) ? [...sp.experience] : [];
    if (Array.isArray(confirmed.workExperience) && confirmed.workExperience.length > 0) {
      for (const exp of confirmed.workExperience) {
        if (!exp?.jobTitle) continue;
        const dup = existingExp.some(
          (e) =>
            e.jobTitle.toLowerCase() === String(exp.jobTitle).toLowerCase() &&
            e.organization.toLowerCase() === String(exp.organization || 'Organization').toLowerCase()
        );
        if (!dup) {
          existingExp.push({
            jobTitle: String(exp.jobTitle).trim(),
            organization: String(exp.organization || 'Organization').trim(),
            employmentType: 'Full-time'
          });
        }
      }
    }

    if (Array.isArray(confirmed.internships) && confirmed.internships.length > 0) {
      for (const intern of confirmed.internships) {
        if (!intern?.role) continue;
        const dup = existingExp.some(
          (e) =>
            e.jobTitle.toLowerCase() === String(intern.role).toLowerCase() &&
            e.organization.toLowerCase() === String(intern.organization || 'Organization').toLowerCase()
        );
        if (!dup) {
          existingExp.push({
            jobTitle: String(intern.role).trim(),
            organization: String(intern.organization || 'Organization').trim(),
            employmentType: 'Internship'
          });
        }
      }
    }

    if (existingExp.length > 0) {
      sp.experience = existingExp;
      sp.hasExperience = true;
    }

    // Merge confirmed certifications into profile qualifications without overwriting existing records
    if (Array.isArray(confirmed.certifications) && confirmed.certifications.length > 0) {
      const existingQuals = Array.isArray(sp.qualifications) ? [...sp.qualifications] : [];
      for (const cert of confirmed.certifications) {
        const clean = String(cert || '').trim();
        if (clean && !existingQuals.some((q) => q.title.toLowerCase() === clean.toLowerCase())) {
          existingQuals.push({ title: clean, institute: 'Certification', year: '' });
        }
      }
      sp.qualifications = existingQuals;
    }

    if (confirmed.phone && !sp.phone) {
      sp.phone = String(confirmed.phone).trim();
    }
    if (confirmed.fullName && (!req.user.name || req.user.name.trim().length < 2)) {
      req.user.name = String(confirmed.fullName).trim();
    }

    req.user.seekerProfile = sp;
    const completion = getProfileCompletionDetails(req.user);
    req.user.profileCompletion = completion.completionPercentage;
    await req.user.save();

    // Save confirmed projects into Portfolio if not already present
    if (Array.isArray(confirmed.projects) && confirmed.projects.length > 0) {
      for (const proj of confirmed.projects.slice(0, 4)) {
        if (!proj?.title) continue;
        const exists = await Portfolio.findOne({
          userId: req.user._id,
          title: proj.title
        });
        if (!exists) {
          await Portfolio.create({
            userId: req.user._id,
            title: proj.title,
            description: proj.description || proj.title,
            skills: (confirmed.skills || []).slice(0, 4),
            workSampleUrl: '',
            category: 'Resume Project',
            source: 'self_created',
            featured: false
          });
        }
      }
    }

    upload.extractedData = confirmed;
    upload.confirmedByUser = true;
    await upload.save();
    void recordUserProgressSnapshot(req.user._id);

    sendSuccess(res, 'Confirmed resume information saved to your SETU profile', {
      user: serializeUser(req.user),
      profileCompletionPercentage: completion.completionPercentage
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to save confirmed resume details', 500);
  }
};

export const downloadUploadedResume = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const upload = await UploadedResumeFile.findById(req.params.id).select('+fileData');
    if (!upload) {
      sendError(res, 'Uploaded resume file not found', 404);
      return;
    }
    if (upload.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied. Uploaded resumes are private.', 403);
      return;
    }

    res.setHeader('Content-Type', upload.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${sanitizeFilename(upload.originalFilename.replace(/\.(pdf|docx)$/i, ''))}${
        upload.originalFilename.toLowerCase().endsWith('.docx') ? '.docx' : '.pdf'
      }"`
    );
    res.send(upload.fileData);
  } catch (error: any) {
    console.error('[Resume Download] Error:', error?.message || '');
    sendError(res, 'Could not download your resume right now. Please try again.', 500);
  }
};

export const toggleUploadedResumeSharing = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const upload = await UploadedResumeFile.findById(req.params.id);
    if (!upload) {
      sendError(res, 'Uploaded resume not found', 404);
      return;
    }
    if (upload.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    upload.shareWithEmployers = Boolean(req.body?.shareWithEmployers);
    await upload.save();

    sendSuccess(res, 'Resume sharing preference updated', {
      id: upload._id,
      shareWithEmployers: upload.shareWithEmployers
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update sharing preference', 500);
  }
};

export const deleteUploadedResume = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const upload = await UploadedResumeFile.findById(req.params.id);
    if (!upload) {
      sendError(res, 'Uploaded resume not found', 404);
      return;
    }
    if (upload.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    await UploadedResumeFile.findByIdAndDelete(upload._id);
    sendSuccess(res, 'Uploaded resume deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete uploaded resume', 500);
  }
};

// ==================== CANE RESUME & PROJECT IMPROVEMENT ====================

export const improveProjectDescription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const { title, description, technologies, role } = req.body || {};
    if (!title && !description) {
      sendError(res, 'Please provide a project title and draft description first.', 400);
      return;
    }

    const techList = Array.isArray(technologies)
      ? technologies.join(', ')
      : String(technologies || '');

    const systemPrompt =
      'You are CANE, SETU career assistant. Rewrite the user-provided project description into 2-3 crisp, professional, ATS-friendly resume sentences using strong action verbs. STRICT RULE: NEVER invent metrics, numbers, awards, employers, or features not present in the user input. Output ONLY the improved description text.';

    const llm = await generateCaneCompletion(systemPrompt, [
      {
        role: 'user',
        content: `Project Title: ${title || 'Project'}\nRole: ${role || 'Contributor'}\nTechnologies: ${
          techList || 'Not specified'
        }\nDraft Description: ${description || ''}`
      }
    ]);

    if (llm.configured && llm.content) {
      sendSuccess(res, 'Project description improved by CANE', {
        improvedDescription: llm.content,
        poweredBy: `${llm.provider} (${llm.model})`
      });
      return;
    }

    // Honest deterministic polish when live LLM key is not configured yet (zero fabricated claims!)
    const cleaned = String(description || '').trim().replace(/\s+/g, ' ');
    const rolePrefix = role ? `Served as ${role} on` : 'Built';
    const techSuffix = techList ? ` using ${techList}` : '';
    const polished = `${rolePrefix} ${title || 'this project'}${techSuffix}. ${
      cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    }${cleaned.endsWith('.') ? '' : '.'}`;

    sendSuccess(res, 'Project description formatted cleanly (live CANE AI key not configured)', {
      improvedDescription: polished,
      poweredBy: 'SETU Built-In Formatter (configure GEMINI_API_KEY or OPENAI_API_KEY for live CANE AI)'
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to improve project description', 500);
  }
};

export const improveResumeWithCane = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const resumeData = req.body?.resume || {};
    const missingSections: string[] = [];
    const suggestions: string[] = [];

    if (!resumeData.personalInfo?.phone) missingSections.push('Phone number');
    if (!resumeData.personalInfo?.city) missingSections.push('City & State');
    if (!resumeData.careerObjective?.summary || resumeData.careerObjective.summary.trim().length < 40) {
      missingSections.push('Professional Summary (aim for 2–3 focused sentences)');
    }
    if (!Array.isArray(resumeData.education) || resumeData.education.length === 0) {
      missingSections.push('Educational Qualifications');
    }
    if (!Array.isArray(resumeData.skills) || resumeData.skills.length < 3) {
      missingSections.push('Skills (list at least 4–6 relevant skills)');
    }
    if (!resumeData.hasProjects || !Array.isArray(resumeData.projects) || resumeData.projects.length === 0) {
      suggestions.push('Add 1–2 practical projects or completed SETU assignments to demonstrate hands-on skills.');
    }
    if (
      Array.isArray(resumeData.skills) &&
      !resumeData.skills.some((s: any) => s.verified)
    ) {
      suggestions.push('Verify at least 1 skill via SETU Assessments so recruiters see verified proof alongside self-reported skills.');
    }
    if (!resumeData.personalInfo?.linkedinUrl && !resumeData.personalInfo?.githubUrl) {
      suggestions.push('Include a LinkedIn, GitHub, or portfolio link if you maintain one.');
    }

    const systemPrompt =
      'You are CANE, SETU AI Career Assistant. Review the structured resume JSON below and provide concise, actionable feedback covering: (1) Missing or weak sections, (2) Clarity & ATS readability tips, (3) Relevant truthful keywords for their target role, and (4) Grammar/formatting polish. STRICT RULE: Never fabricate qualifications, experience, or fake metrics.';

    const compactSummary = JSON.stringify({
      targetRole: resumeData.careerObjective?.targetRole,
      summary: resumeData.careerObjective?.summary,
      educationCount: resumeData.education?.length || 0,
      skills: (resumeData.skills || []).map((s: any) => `${s.name}${s.verified ? ' [Verified]' : ''}`),
      projects: (resumeData.projects || []).map((p: any) => ({
        title: p.title,
        descLen: (p.description || '').length
      })),
      hasWorkExperience: Boolean(resumeData.hasWorkExperience),
      certificationsCount: resumeData.certifications?.length || 0
    });

    const llm = await generateCaneCompletion(systemPrompt, [
      { role: 'user', content: `Please review my SETU resume:\n${compactSummary}` }
    ]);

    sendSuccess(res, 'Resume review generated', {
      missingSections,
      suggestions,
      aiFeedback: llm.configured && llm.content ? llm.content : null,
      aiConfigured: llm.configured,
      poweredBy:
        llm.configured && llm.content
          ? `${llm.provider} (${llm.model})`
          : 'SETU Built-In ATS Analyzer (set GEMINI_API_KEY or OPENAI_API_KEY on backend for live CANE AI feedback)'
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to review resume', 500);
  }
};
