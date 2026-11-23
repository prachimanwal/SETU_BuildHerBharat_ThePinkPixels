import { Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  Employer,
  IEmployer,
  isEmployerVerified,
  formatVerificationLabel
} from '../models/Employer';
import { CompanyVerificationDocument } from '../models/CompanyVerificationDocument';
import { HiringPreference } from '../models/HiringPreference';
import { Opportunity } from '../models/Opportunity';
import { Application } from '../models/Application';
import { Interview } from '../models/Interview';
import { RecruitmentNotification } from '../models/RecruitmentNotification';
import { User } from '../models/User';
import { Portfolio } from '../models/Portfolio';
import { Resume } from '../models/Resume';
import { UploadedResumeFile } from '../models/UploadedResumeFile';
import { sendSuccess, sendError } from '../utils/response';
import { hiringPreferenceSchema, interviewSchema } from '../utils/validators';

const ALLOWED_DOC_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
]);

const MAX_LOGO_BYTES = 1.5 * 1024 * 1024; // 1.5 MB base64 cap

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Ensures an Employer document exists for the authenticated employer user
 * without deleting or overwriting any existing records.
 */
export async function ensureEmployerRecord(user: any): Promise<IEmployer> {
  let employer = await Employer.findOne({ userId: user._id });
  if (!employer) {
    employer = await Employer.create({
      userId: user._id,
      companyName: user.employerProfile?.companyName || user.name || 'My Company',
      publicName: user.employerProfile?.companyName || user.name || 'My Company',
      industry: user.employerProfile?.industry || 'General',
      website: user.employerProfile?.website || '',
      companySize: user.employerProfile?.companySize || '1-10',
      description: user.employerProfile?.description || '',
      officialEmail: user.email || '',
      verificationStatus: user.employerProfile?.verificationStatus || 'pending',
      adminReviewNotes: user.employerProfile?.adminReviewNotes || '',
      verifiedAt: user.employerProfile?.verifiedAt
    });
  }
  return employer;
}

/**
 * Recomputes onboarding step completion and percentage from real MongoDB state.
 */
async function recalculateOnboarding(employer: IEmployer): Promise<IEmployer> {
  const [docsCount, prefCount] = await Promise.all([
    CompanyVerificationDocument.countDocuments({ employerId: employer.userId, isCurrent: true }),
    HiringPreference.countDocuments({ employerId: employer.userId })
  ]);

  const companyInfoDone = Boolean(
    (employer.registeredName || employer.companyName || '').trim() &&
      (employer.industry || '').trim() &&
      (employer.description || '').trim().length >= 15 &&
      (employer.officialEmail || '').trim() &&
      (employer.headquartersLocation?.city || '').trim()
  );

  const rep = employer.representative;
  const representativeDone = Boolean(
    rep &&
      rep.fullName?.trim() &&
      rep.designation?.trim() &&
      rep.workEmail?.trim() &&
      rep.contactNumber?.trim() &&
      rep.authorizedToRecruit
  );

  const verificationDone =
    docsCount > 0 ||
    isEmployerVerified(employer.verificationStatus) ||
    Boolean(employer.verificationDocs?.docNumber?.trim());

  const hiringPrefsDone = prefCount > 0;

  const stepsCompletedCount = [
    companyInfoDone,
    representativeDone,
    verificationDone,
    hiringPrefsDone,
    Boolean(employer.onboardingCompleted)
  ].filter(Boolean).length;

  employer.onboardingSteps = {
    companyInfo: companyInfoDone,
    representative: representativeDone,
    verification: verificationDone,
    hiringPreferences: hiringPrefsDone,
    completed: Boolean(employer.onboardingCompleted)
  };
  employer.completionPercentage = Math.min(100, Math.round((stepsCompletedCount / 5) * 100));
  await employer.save();

  // Keep User.employerProfile synchronized
  await User.findByIdAndUpdate(employer.userId, {
    $set: {
      'employerProfile.companyName': employer.publicName || employer.companyName,
      'employerProfile.industry': employer.industry,
      'employerProfile.website': employer.website || '',
      'employerProfile.companySize': employer.companySize || '1-10',
      'employerProfile.description': employer.description || '',
      'employerProfile.verificationStatus': employer.verificationStatus,
      'employerProfile.onboardingCompleted': Boolean(employer.onboardingCompleted)
    }
  }).catch(() => {});

  return employer;
}

// ============================================================
// 1. COMPANY PROFILE & ONBOARDING
// ============================================================

export const getCompanyProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const employer = await ensureEmployerRecord(req.user);
    await recalculateOnboarding(employer);

    const [documents, hiringPreferences, jobStats] = await Promise.all([
      CompanyVerificationDocument.find({ employerId: req.user._id, isCurrent: true }).sort({
        createdAt: -1
      }),
      HiringPreference.find({ employerId: req.user._id }).sort({ createdAt: -1 }),
      Opportunity.find({ employerId: req.user._id }).select('status')
    ]);

    sendSuccess(res, 'Company profile retrieved', {
      company: employer,
      isVerified: isEmployerVerified(employer.verificationStatus),
      verificationLabel: formatVerificationLabel(employer.verificationStatus),
      documents,
      hiringPreferences,
      counts: {
        publishedJobs: jobStats.filter((j) => j.status === 'published').length,
        draftJobs: jobStats.filter((j) => j.status === 'draft').length,
        totalJobs: jobStats.length,
        documentsCount: documents.length,
        hiringPreferencesCount: hiringPreferences.length
      }
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve company profile', 500);
  }
};

export const updateCompanyProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const employer = await ensureEmployerRecord(req.user);
    const body = req.body || {};

    // Validate optional base64 logo
    if (typeof body.logoDataUrl === 'string' && body.logoDataUrl.trim()) {
      const trimmedLogo = body.logoDataUrl.trim();
      if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(trimmedLogo)) {
        sendError(res, 'Company logo must be a PNG, JPG, or WebP image.', 400);
        return;
      }
      if (trimmedLogo.length > MAX_LOGO_BYTES * 1.4) {
        sendError(res, 'Company logo must be smaller than 1.5 MB.', 400);
        return;
      }
      employer.logoDataUrl = trimmedLogo;
    } else if (body.logoDataUrl === '') {
      employer.logoDataUrl = '';
    }

    if (typeof body.registeredName === 'string') employer.registeredName = body.registeredName.trim();
    if (typeof body.publicName === 'string') {
      employer.publicName = body.publicName.trim();
      if (employer.publicName) employer.companyName = employer.publicName;
    }
    if (typeof body.companyName === 'string' && body.companyName.trim()) {
      employer.companyName = body.companyName.trim();
      if (!employer.publicName) employer.publicName = employer.companyName;
    }
    if (typeof body.industry === 'string') employer.industry = body.industry.trim();
    if (typeof body.businessCategory === 'string')
      employer.businessCategory = body.businessCategory.trim();
    if (typeof body.legalStructure === 'string') employer.legalStructure = body.legalStructure.trim();
    if (typeof body.description === 'string') employer.description = body.description.trim();
    if (body.yearEstablished !== undefined) {
      const yr =
        body.yearEstablished === '' || body.yearEstablished === null
          ? null
          : Number(body.yearEstablished);
      if (yr !== null && (!Number.isInteger(yr) || yr < 1800 || yr > new Date().getFullYear())) {
        sendError(res, 'Please enter a valid year established.', 400);
        return;
      }
      employer.yearEstablished = yr;
    }
    if (typeof body.companySize === 'string') employer.companySize = body.companySize.trim();
    if (typeof body.website === 'string') employer.website = body.website.trim();
    if (typeof body.linkedinUrl === 'string') employer.linkedinUrl = body.linkedinUrl.trim();
    if (typeof body.officialEmail === 'string') employer.officialEmail = body.officialEmail.trim();
    if (typeof body.contactNumber === 'string') employer.contactNumber = body.contactNumber.trim();

    if (body.headquartersLocation && typeof body.headquartersLocation === 'object') {
      employer.headquartersLocation = {
        city: String(body.headquartersLocation.city || '').trim(),
        state: String(body.headquartersLocation.state || '').trim(),
        address: String(body.headquartersLocation.address || '').trim()
      };
    }

    if (Array.isArray(body.officeAddresses)) {
      employer.officeAddresses = body.officeAddresses
        .map((a: any) => String(a || '').trim())
        .filter(Boolean);
    }
    if (Array.isArray(body.benefits)) {
      employer.benefits = body.benefits.map((b: any) => String(b || '').trim()).filter(Boolean);
    }
    if (typeof body.cultureDescription === 'string') {
      employer.cultureDescription = body.cultureDescription.trim();
    }
    if (Array.isArray(body.achievements)) {
      employer.achievements = body.achievements
        .map((a: any) => String(a || '').trim())
        .filter(Boolean);
    }
    if (Array.isArray(body.authorizedRecruiters)) {
      employer.authorizedRecruiters = body.authorizedRecruiters
        .filter((r: any) => r && r.name && r.email)
        .map((r: any) => ({
          name: String(r.name).trim(),
          email: String(r.email).trim().toLowerCase(),
          designation: String(r.designation || 'Recruiter').trim(),
          department: String(r.department || 'Human Resources').trim(),
          canPublishJobs: r.canPublishJobs !== false,
          addedAt: r.addedAt ? new Date(r.addedAt) : new Date()
        }));
    }

    if (body.representative && typeof body.representative === 'object') {
      employer.representative = {
        fullName: String(body.representative.fullName || '').trim(),
        designation: String(body.representative.designation || '').trim(),
        workEmail: String(body.representative.workEmail || '').trim(),
        contactNumber: String(body.representative.contactNumber || '').trim(),
        department: String(body.representative.department || '').trim(),
        relationshipToCompany: String(
          body.representative.relationshipToCompany || 'Authorized Representative'
        ).trim(),
        authorizedToRecruit: Boolean(body.representative.authorizedToRecruit)
      };
    }

    if (typeof body.isPublicProfileVisible === 'boolean') {
      employer.isPublicProfileVisible = body.isPublicProfileVisible;
    }

    await employer.save();
    await recalculateOnboarding(employer);

    sendSuccess(res, 'Company profile updated successfully', {
      company: employer,
      isVerified: isEmployerVerified(employer.verificationStatus),
      verificationLabel: formatVerificationLabel(employer.verificationStatus)
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update company profile', 500);
  }
};

export const completeCompanyOnboarding = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const employer = await ensureEmployerRecord(req.user);
    employer.onboardingCompleted = true;
    await employer.save();
    await recalculateOnboarding(employer);

    sendSuccess(res, 'Company onboarding completed and saved successfully', {
      company: employer,
      isVerified: isEmployerVerified(employer.verificationStatus),
      verificationLabel: formatVerificationLabel(employer.verificationStatus)
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to complete company onboarding', 500);
  }
};

/**
 * Public Company Profile visible to job seekers (shows ONLY approved public info;
 * NEVER exposes verification documents, private contact details, or internal notes).
 */
export const getPublicCompanyProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    if (!isValidObjectId(id)) {
      sendError(res, 'Invalid company identifier', 400);
      return;
    }

    // Support lookup by either Employer._id or Employer.userId
    const employer = await Employer.findOne({
      $or: [{ _id: id }, { userId: id }]
    });

    if (!employer) {
      sendError(res, 'Company profile not found', 404);
      return;
    }

    const isOwnerOrAdmin =
      req.user &&
      (req.user.role === 'admin' || req.user._id.toString() === employer.userId.toString());

    if (!employer.isPublicProfileVisible && !isOwnerOrAdmin) {
      sendError(res, 'This company profile is currently private.', 403);
      return;
    }

    const openJobs = await Opportunity.find({
      employerId: employer.userId,
      status: 'published',
      moderationStatus: 'clean'
    })
      .select(
        'title department workMode opportunityType location stipendOrSalary experienceRequired vacancies applicationDeadline requiredSkills isCareerRestart createdAt'
      )
      .sort({ createdAt: -1 });

    // Explicitly project ONLY public approved company details (NEVER verification docs or private emails/phones)
    sendSuccess(res, 'Public company profile retrieved', {
      company: {
        _id: employer._id,
        employerUserId: employer.userId,
        companyName: employer.publicName || employer.companyName,
        logoDataUrl: employer.logoDataUrl || '',
        industry: employer.industry,
        businessCategory: employer.businessCategory || '',
        description: employer.description || '',
        yearEstablished: employer.yearEstablished || null,
        companySize: employer.companySize || '',
        website: employer.website || '',
        linkedinUrl: employer.linkedinUrl || '',
        headquartersLocation: employer.headquartersLocation
          ? {
              city: employer.headquartersLocation.city,
              state: employer.headquartersLocation.state
            }
          : null,
        officeLocations: (employer.officeAddresses || []).slice(0, 6),
        benefits: employer.benefits || [],
        cultureDescription: employer.cultureDescription || '',
        achievements: employer.achievements || [],
        isVerified: isEmployerVerified(employer.verificationStatus),
        verificationBadge: isEmployerVerified(employer.verificationStatus)
          ? 'Verified SETU Employer'
          : 'Verification Pending'
      },
      openJobs
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to load public company profile', 500);
  }
};

// ============================================================
// 2. COMPANY VERIFICATION SYSTEM (SECURE DOCUMENT UPLOADS)
// ============================================================

export const getVerificationOverview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const employer = await ensureEmployerRecord(req.user);
    const documents = await CompanyVerificationDocument.find({
      employerId: req.user._id,
      isCurrent: true
    }).sort({ createdAt: -1 });

    sendSuccess(res, 'Verification status retrieved', {
      verificationStatus: employer.verificationStatus,
      verificationLabel: formatVerificationLabel(employer.verificationStatus),
      isVerified: isEmployerVerified(employer.verificationStatus),
      legalStructure: employer.legalStructure || 'Private Limited',
      adminReviewNotes: employer.adminReviewNotes || '',
      verifiedAt: employer.verifiedAt || null,
      auditTrail: (employer.verificationAuditTrail || []).slice().reverse(),
      documents
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to load verification overview', 500);
  }
};

export const uploadVerificationDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      sendError(res, 'Please select a PDF, JPG, or PNG document to upload.', 400);
      return;
    }

    if (!ALLOWED_DOC_MIMES.has(file.mimetype)) {
      sendError(res, 'Unsupported file format. Allowed formats: PDF, JPG, PNG.', 400);
      return;
    }

    const documentType = String(req.body?.documentType || '').trim();
    if (!documentType) {
      sendError(res, 'Document type is required.', 400);
      return;
    }

    const documentNumber = String(req.body?.documentNumber || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const employer = await ensureEmployerRecord(req.user);

    const doc = await CompanyVerificationDocument.create({
      employerId: req.user._id,
      companyId: employer._id,
      documentType,
      documentNumber,
      notes,
      originalFilename: file.originalname,
      mimeType: file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype,
      sizeBytes: file.size,
      fileData: file.buffer,
      status: 'Under Review',
      isCurrent: true
    });

    // IMPORTANT: Never auto-verify when documents are uploaded!
    // Move to 'under_review' if not already approved/verified.
    if (!isEmployerVerified(employer.verificationStatus)) {
      employer.verificationStatus = 'under_review';
    }
    employer.verificationDocs = {
      docType: documentType,
      docNumber: documentNumber || file.originalname,
      notes,
      submittedAt: new Date()
    };
    employer.verificationAuditTrail = employer.verificationAuditTrail || [];
    employer.verificationAuditTrail.push({
      status: employer.verificationStatus,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: 'employer',
      notes: `Uploaded ${documentType} (${file.originalname}) for admin review.`,
      timestamp: new Date()
    });

    await employer.save();
    await recalculateOnboarding(employer);

    const safeDoc = await CompanyVerificationDocument.findById(doc._id);

    sendSuccess(
      res,
      'Document uploaded securely and submitted for SETU administrator verification.',
      {
        document: safeDoc,
        verificationStatus: employer.verificationStatus,
        verificationLabel: formatVerificationLabel(employer.verificationStatus)
      },
      201
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to upload verification document', 500);
  }
};

export const replaceVerificationDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const docId = String(req.params.docId || '');
    if (!isValidObjectId(docId)) {
      sendError(res, 'Invalid document ID', 400);
      return;
    }

    const existing = await CompanyVerificationDocument.findById(docId);
    if (!existing) {
      sendError(res, 'Verification document not found', 404);
      return;
    }

    if (existing.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied. You can only replace your own company documents.', 403);
      return;
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      sendError(res, 'Please select a replacement PDF, JPG, or PNG file.', 400);
      return;
    }
    if (!ALLOWED_DOC_MIMES.has(file.mimetype)) {
      sendError(res, 'Unsupported file format. Allowed formats: PDF, JPG, PNG.', 400);
      return;
    }

    existing.isCurrent = false;
    await existing.save();

    const employer = await ensureEmployerRecord(req.user);
    const replacement = await CompanyVerificationDocument.create({
      employerId: req.user._id,
      companyId: employer._id,
      documentType: String(req.body?.documentType || existing.documentType).trim(),
      documentNumber: String(req.body?.documentNumber ?? existing.documentNumber ?? '').trim(),
      notes: String(req.body?.notes ?? existing.notes ?? '').trim(),
      originalFilename: file.originalname,
      mimeType: file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype,
      sizeBytes: file.size,
      fileData: file.buffer,
      status: 'Under Review',
      replacedDocumentId: existing._id,
      isCurrent: true
    });

    if (!isEmployerVerified(employer.verificationStatus)) {
      employer.verificationStatus = 'under_review';
    }
    employer.verificationAuditTrail = employer.verificationAuditTrail || [];
    employer.verificationAuditTrail.push({
      status: employer.verificationStatus,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: 'employer',
      notes: `Replaced ${replacement.documentType} with ${file.originalname}.`,
      timestamp: new Date()
    });
    await employer.save();
    await recalculateOnboarding(employer);

    const safeDoc = await CompanyVerificationDocument.findById(replacement._id);
    sendSuccess(res, 'Document replaced and submitted for review.', {
      document: safeDoc,
      verificationStatus: employer.verificationStatus
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to replace verification document', 500);
  }
};

/**
 * RBAC-protected binary stream for verification documents.
 * Accessible ONLY to the owning employer or an authorized SETU administrator.
 */
export const streamVerificationDocumentFile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const docId = String(req.params.docId || '');
    if (!isValidObjectId(docId)) {
      sendError(res, 'Invalid document ID', 400);
      return;
    }

    const doc = await CompanyVerificationDocument.findById(docId).select('+fileData');
    if (!doc) {
      sendError(res, 'Verification document not found', 404);
      return;
    }

    const isOwner = doc.employerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      sendError(res, 'Access denied. Verification documents are strictly confidential.', 403);
      return;
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${doc.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(doc.fileData);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to stream document', 500);
  }
};

export const requestReverification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const employer = await ensureEmployerRecord(req.user);
    const docsCount = await CompanyVerificationDocument.countDocuments({
      employerId: req.user._id,
      isCurrent: true
    });

    if (docsCount === 0) {
      sendError(res, 'Please upload at least one valid business verification document first.', 400);
      return;
    }

    const note = String(req.body?.notes || 'Employer requested re-verification after updating documents.').trim();
    employer.verificationStatus = 'under_review';
    employer.verificationAuditTrail = employer.verificationAuditTrail || [];
    employer.verificationAuditTrail.push({
      status: 'under_review',
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: 'employer',
      notes: note,
      timestamp: new Date()
    });
    await employer.save();
    await recalculateOnboarding(employer);

    sendSuccess(res, 'Re-verification requested. SETU administrators will review your documents.', {
      verificationStatus: employer.verificationStatus,
      verificationLabel: formatVerificationLabel(employer.verificationStatus)
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to request re-verification', 500);
  }
};

// ============================================================
// 3. HIRING PREFERENCES CRUD (MULTIPLE PREFERENCES)
// ============================================================

export const getHiringPreferences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const prefs = await HiringPreference.find({ employerId: req.user._id }).sort({ createdAt: -1 });
    sendSuccess(res, 'Hiring preferences retrieved', prefs);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch hiring preferences', 500);
  }
};

export const createHiringPreference = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parsed = hiringPreferenceSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message || 'Invalid hiring preference fields', 400);
      return;
    }

    if (
      typeof parsed.data.minSalary === 'number' &&
      typeof parsed.data.maxSalary === 'number' &&
      parsed.data.minSalary > parsed.data.maxSalary
    ) {
      sendError(res, 'Minimum salary cannot exceed maximum salary.', 400);
      return;
    }

    const employer = await ensureEmployerRecord(req.user);
    const created = await HiringPreference.create({
      ...parsed.data,
      employerId: req.user._id,
      companyId: employer._id
    });

    await recalculateOnboarding(employer);

    sendSuccess(res, 'Hiring preference saved successfully', created, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create hiring preference', 500);
  }
};

export const updateHiringPreference = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = String(req.params.id || '');
    if (!isValidObjectId(id)) {
      sendError(res, 'Invalid hiring preference ID', 400);
      return;
    }

    const existing = await HiringPreference.findById(id);
    if (!existing) {
      sendError(res, 'Hiring preference not found', 404);
      return;
    }
    if (existing.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    const parsed = hiringPreferenceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message || 'Invalid fields', 400);
      return;
    }

    Object.assign(existing, parsed.data);
    await existing.save();

    sendSuccess(res, 'Hiring preference updated', existing);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update hiring preference', 500);
  }
};

export const deleteHiringPreference = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = String(req.params.id || '');
    if (!isValidObjectId(id)) {
      sendError(res, 'Invalid hiring preference ID', 400);
      return;
    }

    const existing = await HiringPreference.findById(id);
    if (!existing) {
      sendError(res, 'Hiring preference not found', 404);
      return;
    }
    if (existing.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    await HiringPreference.findByIdAndDelete(id);
    const employer = await ensureEmployerRecord(req.user);
    await recalculateOnboarding(employer);

    sendSuccess(res, 'Hiring preference deleted');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete hiring preference', 500);
  }
};

// ============================================================
// 4. CANDIDATE SEARCH & MATCHING (CONSENT & PRIVACY ENFORCED)
// ============================================================

export const searchCandidates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const {
      q = '',
      skills = '',
      education = '',
      experience = '',
      role = '',
      location = '',
      employmentType = '',
      availability = '',
      hasPortfolio = ''
    } = req.query as Record<string, string>;

    // Only seekers who have NOT opted out of employer discoverability
    const seekers = await User.find({
      role: 'seeker',
      'seekerProfile.profileVisibility.discoverableByEmployers': { $ne: false }
    })
      .select('name avatar profilePicture seekerProfile createdAt')
      .sort({ updatedAt: -1 })
      .limit(150);

    const seekerIds = seekers.map((s) => s._id);

    const [portfolios, builtResumes, uploadedResumes, existingApps] = await Promise.all([
      Portfolio.find({ userId: { $in: seekerIds } }).select('userId title skills category'),
      Resume.find({ userId: { $in: seekerIds } }).select('userId title updatedAt'),
      UploadedResumeFile.find({ userId: { $in: seekerIds }, shareWithEmployers: true }).select(
        'userId originalFilename'
      ),
      Application.find({ employerId: req.user._id, seekerId: { $in: seekerIds } }).select(
        'seekerId status opportunityId'
      )
    ]);

    const portfolioMap = new Map<string, Array<{ _id: any; title: string; skills: string[] }>>();
    portfolios.forEach((p) => {
      const uid = p.userId.toString();
      const arr = portfolioMap.get(uid) || [];
      arr.push({ _id: p._id, title: p.title, skills: p.skills || [] });
      portfolioMap.set(uid, arr);
    });

    const sharedResumeSet = new Set<string>();
    uploadedResumes.forEach((r) => sharedResumeSet.add(r.userId.toString()));
    const builtResumeSet = new Set<string>();
    builtResumes.forEach((r) => builtResumeSet.add(r.userId.toString()));

    const appMap = new Map<string, any>();
    existingApps.forEach((a) => appMap.set(a.seekerId.toString(), a));

    const skillTokens = skills
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const qLower = q.trim().toLowerCase();
    const eduLower = education.trim().toLowerCase();
    const expLower = experience.trim().toLowerCase();
    const roleLower = role.trim().toLowerCase();
    const locLower = location.trim().toLowerCase();
    const empTypeLower = employmentType.trim().toLowerCase();
    const availLower = availability.trim().toLowerCase();

    const candidates = seekers
      .map((s) => {
        const sp = s.seekerProfile || {};
        const uid = s._id.toString();
        const combinedSkills = Array.from(
          new Set([
            ...(sp.skills || []),
            ...(sp.detailedSkills || []).map((ds) => ds.name)
          ])
        ).filter(Boolean);
        const verifiedSkills = (sp.detailedSkills || [])
          .filter((ds) => ds.verified || ds.source === 'assessment_verified')
          .map((ds) => ds.name);

        const userProjects = portfolioMap.get(uid) || [];
        const hasAppliedToEmployer = appMap.has(uid);
        const resumeShared =
          Boolean(sp.profileVisibility?.showResumeToEmployers) ||
          sharedResumeSet.has(uid) ||
          (hasAppliedToEmployer && (builtResumeSet.has(uid) || sharedResumeSet.has(uid)));

        const eduSummary =
          (sp.education || [])
            .map((e) => [e.level, e.degree, e.specialization].filter(Boolean).join(' '))
            .filter(Boolean)[0] ||
          sp.educationLevel ||
          'Not specified';

        const expSummary =
          sp.experience && sp.experience.length > 0
            ? `${sp.experience.length} role(s) — ${sp.experience[0].jobTitle} at ${sp.experience[0].organization}`
            : sp.experienceLevel || sp.employmentPreferences?.yearsOfExperience || 'Fresher / Entry-Level';

        const locString = [sp.location?.city, sp.location?.state].filter(Boolean).join(', ');
        const prefs = sp.employmentPreferences || {};

        // STRICT PRIVACY: Do NOT expose private email or phone in candidate search!
        return {
          _id: s._id,
          name: s.name,
          avatar: s.profilePicture || s.avatar || '',
          headline: sp.headline || sp.careerGoals || 'Job Seeker on SETU',
          skills: combinedSkills,
          verifiedSkills,
          educationSummary: eduSummary,
          experienceSummary: expSummary,
          location: locString || 'India',
          relevantProjects: userProjects.slice(0, 3),
          portfolioCount: userProjects.length,
          resumeAvailable: resumeShared || builtResumeSet.has(uid),
          resumeAuthorizedToView: resumeShared,
          jobPreferences: {
            jobTypes: prefs.jobTypes || [],
            workModes: prefs.workModes || (sp.preferredWorkMode ? [sp.preferredWorkMode] : []),
            preferredLocations: prefs.preferredLocations || [],
            availability: prefs.availability || 'Flexible',
            careerGoals: sp.careerGoalsList || (sp.careerGoals ? [sp.careerGoals] : [])
          },
          existingApplicationStatus: appMap.get(uid)?.status || null
        };
      })
      .filter((c) => {
        if (qLower) {
          const hay = `${c.name} ${c.headline} ${c.skills.join(' ')} ${c.educationSummary} ${
            c.experienceSummary
          } ${c.location} ${c.jobPreferences.careerGoals.join(' ')}`.toLowerCase();
          if (!hay.includes(qLower)) return false;
        }
        if (skillTokens.length > 0) {
          const candSkillsLower = c.skills.map((s) => s.toLowerCase());
          const matchesAll = skillTokens.every((tok) =>
            candSkillsLower.some((cs) => cs.includes(tok))
          );
          if (!matchesAll) return false;
        }
        if (eduLower && !c.educationSummary.toLowerCase().includes(eduLower)) return false;
        if (expLower && !c.experienceSummary.toLowerCase().includes(expLower)) return false;
        if (roleLower) {
          const roleHay = `${c.headline} ${c.jobPreferences.careerGoals.join(' ')} ${
            c.experienceSummary
          }`.toLowerCase();
          if (!roleHay.includes(roleLower)) return false;
        }
        if (locLower) {
          const locHay = `${c.location} ${c.jobPreferences.preferredLocations.join(' ')}`.toLowerCase();
          if (!locHay.includes(locLower)) return false;
        }
        if (empTypeLower) {
          const typesHay = `${c.jobPreferences.jobTypes.join(' ')} ${c.jobPreferences.workModes.join(
            ' '
          )}`.toLowerCase();
          if (!typesHay.includes(empTypeLower)) return false;
        }
        if (availLower && !c.jobPreferences.availability.toLowerCase().includes(availLower)) {
          return false;
        }
        if (hasPortfolio === 'true' && c.portfolioCount === 0) return false;
        return true;
      });

    sendSuccess(res, 'Consenting candidates retrieved', candidates);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to search candidates', 500);
  }
};

export const getCandidateProfileForEmployer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const candidateId = String(req.params.candidateId || '');
    if (!isValidObjectId(candidateId)) {
      sendError(res, 'Invalid candidate ID', 400);
      return;
    }

    const candidate = await User.findOne({ _id: candidateId, role: 'seeker' }).select(
      'name email avatar profilePicture seekerProfile'
    );
    if (!candidate) {
      sendError(res, 'Candidate not found', 404);
      return;
    }

    const sp = candidate.seekerProfile || {};
    const existingApp = await Application.findOne({
      employerId: req.user._id,
      seekerId: candidate._id
    });

    if (sp.profileVisibility?.discoverableByEmployers === false && !existingApp) {
      sendError(res, 'This candidate has restricted profile discovery.', 403);
      return;
    }

    const [projects, builtResume, sharedUploaded] = await Promise.all([
      Portfolio.find({ userId: candidate._id }).sort({ featured: -1, createdAt: -1 }),
      Resume.findOne({ userId: candidate._id }).sort({ updatedAt: -1 }),
      UploadedResumeFile.findOne({ userId: candidate._id, shareWithEmployers: true }).sort({
        createdAt: -1
      })
    ]);

    const canSeeContact = Boolean(
      existingApp ||
        (sp.profileVisibility?.showContactAfterShortlist &&
          existingApp &&
          ['Shortlisted', 'Interview Scheduled', 'Offer Sent', 'Hired'].includes(
            (existingApp as any).status
          ))
    );

    const canViewResume = Boolean(
      existingApp || sp.profileVisibility?.showResumeToEmployers || sharedUploaded
    );

    sendSuccess(res, 'Candidate profile retrieved', {
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        avatar: candidate.profilePicture || candidate.avatar || '',
        headline: sp.headline || '',
        bio: sp.bio || '',
        location: sp.location || null,
        languages: sp.languages || [],
        education: sp.education || [],
        skills: sp.skills || [],
        detailedSkills: sp.detailedSkills || [],
        experience: sp.experience || [],
        interests: sp.interests || [],
        careerGoals: sp.careerGoals || '',
        careerGoalsList: sp.careerGoalsList || [],
        employmentPreferences: sp.employmentPreferences || {},
        // Contact info strictly gated by application/consent
        contactAuthorized: canSeeContact,
        email: canSeeContact ? candidate.email : null,
        phone: canSeeContact ? sp.phone || null : null
      },
      projects,
      resumeAuthorized: canViewResume,
      resumePreview: canViewResume ? builtResume || null : null,
      uploadedResumeMeta:
        canViewResume && sharedUploaded
          ? {
              _id: sharedUploaded._id,
              originalFilename: sharedUploaded.originalFilename,
              extractedData: sharedUploaded.extractedData
            }
          : null,
      existingApplication: existingApp
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve candidate profile', 500);
  }
};

export const inviteCandidateToApply = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const candidateId = String(req.params.candidateId || '');
    const { opportunityId, message } = req.body || {};

    if (!isValidObjectId(candidateId) || !isValidObjectId(String(opportunityId || ''))) {
      sendError(res, 'Valid candidateId and opportunityId are required.', 400);
      return;
    }

    const [candidate, opp, employer] = await Promise.all([
      User.findOne({ _id: candidateId, role: 'seeker' }),
      Opportunity.findById(opportunityId),
      ensureEmployerRecord(req.user)
    ]);

    if (!candidate) {
      sendError(res, 'Candidate not found', 404);
      return;
    }
    if (!opp || opp.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Job opportunity not found in your company postings.', 404);
      return;
    }
    if (opp.status !== 'published') {
      sendError(res, 'You can only invite candidates to published job opportunities.', 400);
      return;
    }

    const companyName = employer.publicName || employer.companyName || req.user.name;

    await RecruitmentNotification.create({
      recipientId: candidate._id,
      recipientRole: 'seeker',
      type: 'job_invitation',
      title: `${companyName} invited you to apply for ${opp.title}`,
      message:
        String(message || '').trim() ||
        `${companyName} reviewed your SETU profile and invited you to apply for "${opp.title}".`,
      link: '/opportunities',
      metadata: {
        opportunityId: opp._id,
        employerId: req.user._id,
        companyName
      }
    });

    sendSuccess(res, `Invitation sent to ${candidate.name} for "${opp.title}".`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to invite candidate', 500);
  }
};

export const shortlistCandidate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const candidateId = String(req.params.candidateId || '');
    const { opportunityId, note } = req.body || {};

    if (!isValidObjectId(candidateId) || !isValidObjectId(String(opportunityId || ''))) {
      sendError(res, 'Select a valid job vacancy to shortlist this candidate for.', 400);
      return;
    }

    const [candidate, opp] = await Promise.all([
      User.findOne({ _id: candidateId, role: 'seeker' }),
      Opportunity.findById(opportunityId)
    ]);

    if (!candidate) {
      sendError(res, 'Candidate not found', 404);
      return;
    }
    if (!opp || opp.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Job opportunity not found in your postings.', 404);
      return;
    }

    let app = await Application.findOne({
      opportunityId: opp._id,
      seekerId: candidate._id
    });

    if (app) {
      app.status = 'Shortlisted';
      if (note) {
        app.recruiterNotes = app.recruiterNotes || [];
        app.recruiterNotes.push({
          note: String(note).trim(),
          authorName: req.user.name,
          createdAt: new Date()
        });
      }
      app.statusHistory = app.statusHistory || [];
      app.statusHistory.push({
        status: 'Shortlisted',
        updatedByRole: 'employer',
        note: 'Shortlisted by employer.',
        timestamp: new Date()
      });
      await app.save();
    } else {
      app = await Application.create({
        opportunityId: opp._id,
        seekerId: candidate._id,
        employerId: req.user._id,
        status: 'Shortlisted',
        invitedByEmployer: true,
        recruiterNotes: note
          ? [{ note: String(note).trim(), authorName: req.user.name, createdAt: new Date() }]
          : [],
        statusHistory: [
          {
            status: 'Shortlisted',
            updatedByRole: 'employer',
            note: 'Shortlisted directly from Candidate Search.',
            timestamp: new Date()
          }
        ]
      });
    }

    await RecruitmentNotification.create({
      recipientId: candidate._id,
      recipientRole: 'seeker',
      type: 'application_update',
      title: `Shortlisted for ${opp.title}`,
      message: `You have been shortlisted for "${opp.title}" at ${opp.organisationName}.`,
      link: '/applications',
      metadata: { applicationId: app._id, opportunityId: opp._id }
    }).catch(() => {});

    sendSuccess(res, `${candidate.name} shortlisted for "${opp.title}".`, app);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to shortlist candidate', 500);
  }
};

// ============================================================
// 5. APPLICATION NOTES & ENRICHED APPLICANTS
// ============================================================

export const addRecruiterNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const appId = String(req.params.id || '');
    const note = String(req.body?.note || '').trim();
    if (!isValidObjectId(appId) || !note) {
      sendError(res, 'Valid application ID and note text are required.', 400);
      return;
    }

    const app = await Application.findById(appId);
    if (!app) {
      sendError(res, 'Application not found', 404);
      return;
    }
    if (app.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    app.recruiterNotes = app.recruiterNotes || [];
    app.recruiterNotes.push({
      note,
      authorName: req.user.name || 'Recruiter',
      createdAt: new Date()
    });
    await app.save();

    sendSuccess(res, 'Private recruiter note added', app.recruiterNotes);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to add recruiter note', 500);
  }
};

// ============================================================
// 6. INTERVIEW MANAGEMENT (CRUD + SYNC + NOTIFICATIONS)
// ============================================================

function combineInterviewDateTime(dateStr: string, timeStr: string): Date {
  const isoCandidate = `${dateStr}T${/^\d{2}:\d{2}/.test(timeStr) ? timeStr : '10:00'}`;
  const d = new Date(isoCandidate);
  if (!Number.isNaN(d.getTime())) return d;
  const fallback = new Date(`${dateStr} ${timeStr}`);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

export const getEmployerInterviews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { status, mode } = req.query as Record<string, string>;
    const filter: any = { employerId: req.user._id };
    if (status && status !== 'all') filter.status = status;
    if (mode && mode !== 'all') filter.mode = mode;

    const interviews = await Interview.find(filter)
      .populate('opportunityId', 'title department workMode location')
      .populate('candidateId', 'name email avatar seekerProfile.headline seekerProfile.skills')
      .populate('applicationId', 'status')
      .sort({ scheduledAt: 1 });

    sendSuccess(res, 'Interviews retrieved', interviews);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch interviews', 500);
  }
};

export const createEmployerInterview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parsed = interviewSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message || 'Invalid interview details', 400);
      return;
    }

    const data = parsed.data;
    if (!isValidObjectId(data.opportunityId) || !isValidObjectId(data.candidateId)) {
      sendError(res, 'Valid job position and candidate are required.', 400);
      return;
    }

    const [opp, candidate, employer] = await Promise.all([
      Opportunity.findById(data.opportunityId),
      User.findOne({ _id: data.candidateId, role: 'seeker' }),
      ensureEmployerRecord(req.user)
    ]);

    if (!opp || opp.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Job posting not found under your company.', 404);
      return;
    }
    if (!candidate) {
      sendError(res, 'Candidate account not found.', 404);
      return;
    }

    // Find or sync linked Application
    let linkedApp = data.applicationId && isValidObjectId(data.applicationId)
      ? await Application.findById(data.applicationId)
      : await Application.findOne({ opportunityId: opp._id, seekerId: candidate._id });

    if (linkedApp && linkedApp.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied to this application.', 403);
      return;
    }

    const scheduledAt = combineInterviewDateTime(data.scheduledDate, data.scheduledTime);

    const interview = await Interview.create({
      employerId: req.user._id,
      companyId: employer._id,
      applicationId: linkedApp?._id,
      opportunityId: opp._id,
      candidateId: candidate._id,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      scheduledAt,
      durationMinutes: data.durationMinutes || 45,
      mode: data.mode,
      meetingLinkOrLocation: data.meetingLinkOrLocation || '',
      interviewerName: data.interviewerName,
      interviewerEmail: data.interviewerEmail || '',
      notes: data.notes || '',
      feedback: data.feedback || '',
      rating: typeof data.rating === 'number' ? data.rating : null,
      status: data.status || 'Scheduled'
    });

    if (linkedApp) {
      linkedApp.status = data.status === 'Completed' ? 'Interview Completed' : 'Interview Scheduled';
      linkedApp.interviewDetails = {
        date: data.scheduledDate,
        time: data.scheduledTime,
        mode: data.mode,
        meetingLink: data.meetingLinkOrLocation || '',
        notes: data.notes || ''
      };
      linkedApp.statusHistory = linkedApp.statusHistory || [];
      linkedApp.statusHistory.push({
        status: linkedApp.status,
        updatedByRole: 'employer',
        note: `${data.mode} interview scheduled for ${data.scheduledDate} at ${data.scheduledTime}.`,
        timestamp: new Date()
      });
      await linkedApp.save();
    }

    // Notify both candidate and employer
    await Promise.all([
      RecruitmentNotification.create({
        recipientId: candidate._id,
        recipientRole: 'seeker',
        type: 'upcoming_interview',
        title: `Interview scheduled for ${opp.title}`,
        message: `${employer.publicName || employer.companyName} scheduled an ${
          data.mode
        } interview on ${data.scheduledDate} at ${data.scheduledTime} with ${data.interviewerName}.`,
        link: '/applications',
        metadata: { interviewId: interview._id, opportunityId: opp._id }
      }),
      RecruitmentNotification.create({
        recipientId: req.user._id,
        recipientRole: 'employer',
        type: 'upcoming_interview',
        title: `Interview confirmed with ${candidate.name}`,
        message: `${data.mode} interview for "${opp.title}" on ${data.scheduledDate} at ${data.scheduledTime}.`,
        link: '/employer/interviews',
        metadata: { interviewId: interview._id, candidateId: candidate._id }
      })
    ]).catch(() => {});

    const populated = await Interview.findById(interview._id)
      .populate('opportunityId', 'title department workMode location')
      .populate('candidateId', 'name email avatar seekerProfile.headline');

    sendSuccess(res, 'Interview scheduled successfully', populated, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to schedule interview', 500);
  }
};

export const updateEmployerInterview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = String(req.params.id || '');
    if (!isValidObjectId(id)) {
      sendError(res, 'Invalid interview ID', 400);
      return;
    }

    const interview = await Interview.findById(id).populate('opportunityId', 'title');
    if (!interview) {
      sendError(res, 'Interview not found', 404);
      return;
    }
    if (interview.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    const body = req.body || {};
    const scheduleChanged =
      (body.scheduledDate && body.scheduledDate !== interview.scheduledDate) ||
      (body.scheduledTime && body.scheduledTime !== interview.scheduledTime) ||
      (body.mode && body.mode !== interview.mode) ||
      (body.meetingLinkOrLocation !== undefined &&
        body.meetingLinkOrLocation !== interview.meetingLinkOrLocation);

    if (body.scheduledDate) interview.scheduledDate = String(body.scheduledDate);
    if (body.scheduledTime) interview.scheduledTime = String(body.scheduledTime);
    if (body.scheduledDate || body.scheduledTime) {
      interview.scheduledAt = combineInterviewDateTime(
        interview.scheduledDate,
        interview.scheduledTime
      );
    }
    if (body.durationMinutes) interview.durationMinutes = Number(body.durationMinutes);
    if (body.mode && ['Online', 'Offline', 'Telephone'].includes(body.mode)) {
      interview.mode = body.mode;
    }
    if (body.meetingLinkOrLocation !== undefined) {
      interview.meetingLinkOrLocation = String(body.meetingLinkOrLocation).trim();
    }
    if (body.interviewerName) interview.interviewerName = String(body.interviewerName).trim();
    if (body.interviewerEmail !== undefined) {
      interview.interviewerEmail = String(body.interviewerEmail).trim();
    }
    if (body.notes !== undefined) interview.notes = String(body.notes).trim();
    if (body.feedback !== undefined) interview.feedback = String(body.feedback).trim();
    if (body.rating !== undefined) {
      interview.rating = body.rating === '' || body.rating === null ? null : Number(body.rating);
    }
    if (
      body.status &&
      ['Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'].includes(body.status)
    ) {
      interview.status = body.status;
    } else if (scheduleChanged && interview.status === 'Scheduled') {
      interview.status = 'Rescheduled';
    }

    await interview.save();

    // Sync linked application status
    if (interview.applicationId) {
      const app = await Application.findById(interview.applicationId);
      if (app) {
        if (interview.status === 'Completed') {
          app.status = 'Interview Completed';
        } else if (interview.status === 'Scheduled' || interview.status === 'Rescheduled') {
          app.status = 'Interview Scheduled';
          app.interviewDetails = {
            date: interview.scheduledDate,
            time: interview.scheduledTime,
            mode: interview.mode,
            meetingLink: interview.meetingLinkOrLocation,
            notes: interview.notes
          };
        }
        await app.save();
      }
    }

    const oppTitle = (interview.opportunityId as any)?.title || 'your interview';
    if (scheduleChanged || interview.status === 'Cancelled' || interview.status === 'Rescheduled') {
      const notifType =
        interview.status === 'Cancelled' ? 'interview_cancelled' : 'interview_update';
      const notifMsg =
        interview.status === 'Cancelled'
          ? `Your interview for "${oppTitle}" scheduled on ${interview.scheduledDate} was cancelled.`
          : `Interview details updated for "${oppTitle}": ${interview.mode} on ${interview.scheduledDate} at ${interview.scheduledTime}.`;

      await Promise.all([
        RecruitmentNotification.create({
          recipientId: interview.candidateId,
          recipientRole: 'seeker',
          type: notifType,
          title:
            interview.status === 'Cancelled'
              ? `Interview cancelled: ${oppTitle}`
              : `Interview updated: ${oppTitle}`,
          message: notifMsg,
          link: '/applications',
          metadata: { interviewId: interview._id }
        }),
        RecruitmentNotification.create({
          recipientId: req.user._id,
          recipientRole: 'employer',
          type: notifType,
          title:
            interview.status === 'Cancelled'
              ? `Interview cancelled: ${oppTitle}`
              : `Interview updated: ${oppTitle}`,
          message: notifMsg,
          link: '/employer/interviews',
          metadata: { interviewId: interview._id }
        })
      ]).catch(() => {});
    }

    const populated = await Interview.findById(interview._id)
      .populate('opportunityId', 'title department workMode location')
      .populate('candidateId', 'name email avatar seekerProfile.headline');

    sendSuccess(res, 'Interview updated successfully', populated);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update interview', 500);
  }
};

export const deleteEmployerInterview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = String(req.params.id || '');
    if (!isValidObjectId(id)) {
      sendError(res, 'Invalid interview ID', 400);
      return;
    }

    const interview = await Interview.findById(id);
    if (!interview) {
      sendError(res, 'Interview not found', 404);
      return;
    }
    if (interview.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    await Interview.findByIdAndDelete(id);
    sendSuccess(res, 'Interview removed successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete interview', 500);
  }
};

// ============================================================
// 7. REAL MONGODB RECRUITMENT ANALYTICS (ZERO FABRICATED DATA)
// ============================================================

export const getEmployerAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const employerId = req.user._id;
    const range = String(req.query.range || '30d');
    const customStart = req.query.startDate ? new Date(String(req.query.startDate)) : null;
    const customEnd = req.query.endDate ? new Date(String(req.query.endDate)) : null;

    let endDate = new Date();
    let startDate = new Date();
    if (range === '7d') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (range === '90d') {
      startDate.setDate(endDate.getDate() - 90);
    } else if (range === 'all') {
      startDate = new Date(2020, 0, 1);
    } else if (
      range === 'custom' &&
      customStart &&
      customEnd &&
      !Number.isNaN(customStart.getTime()) &&
      !Number.isNaN(customEnd.getTime())
    ) {
      startDate = customStart;
      endDate = new Date(customEnd.getTime());
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setDate(endDate.getDate() - 30);
    }

    const [employer, allJobs, allApps, allInterviews] = await Promise.all([
      ensureEmployerRecord(req.user),
      Opportunity.find({ employerId }).sort({ createdAt: -1 }),
      Application.find({ employerId })
        .populate('opportunityId', 'title department')
        .populate('seekerId', 'name seekerProfile.skills seekerProfile.detailedSkills')
        .sort({ createdAt: 1 }),
      Interview.find({ employerId }).sort({ scheduledAt: 1 })
    ]);

    const filteredApps = allApps.filter((a) => {
      const dt = new Date(a.createdAt);
      return dt >= startDate && dt <= endDate;
    });

    const filteredInterviews = allInterviews.filter((iv) => {
      const dt = new Date(iv.createdAt);
      return dt >= startDate && dt <= endDate;
    });

    // Core KPI Cards (real database totals)
    const publishedJobs = allJobs.filter((j) => j.status === 'published').length;
    const draftJobs = allJobs.filter((j) => j.status === 'draft').length;
    const closedJobs = allJobs.filter((j) => j.status === 'closed').length;
    const activeVacancies = allJobs
      .filter((j) => j.status === 'published')
      .reduce((acc, j) => acc + (j.vacancies || 1), 0);

    const totalApplications = filteredApps.length;
    const screeningCount = filteredApps.filter((a) => a.status === 'Under Review').length;
    const shortlistedCount = filteredApps.filter((a) => a.status === 'Shortlisted').length;
    const interviewsScheduledCount =
      filteredInterviews.filter((i) => i.status === 'Scheduled' || i.status === 'Rescheduled')
        .length ||
      filteredApps.filter((a) => a.status === 'Interview Scheduled').length;
    const interviewStageCount = filteredApps.filter(
      (a) => a.status === 'Interview Scheduled' || a.status === 'Interview Completed'
    ).length;
    const offersSentCount = filteredApps.filter((a) => a.status === 'Offer Sent').length;
    const hiredCount = filteredApps.filter(
      (a) => a.status === 'Hired' || a.status === 'Selected'
    ).length;

    // Graph 1: Applications received over time (grouped by YYYY-MM-DD)
    const dateCounts = new Map<string, number>();
    filteredApps.forEach((a) => {
      const dayKey = new Date(a.createdAt).toISOString().slice(0, 10);
      dateCounts.set(dayKey, (dateCounts.get(dayKey) || 0) + 1);
    });
    const applicationsOverTime = Array.from(dateCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Graph 2: Recruitment Funnel (Applied -> Screening -> Shortlisted -> Interview -> Offered -> Hired)
    const recruitmentFunnel = [
      { stage: 'Applied', count: filteredApps.length },
      {
        stage: 'Screening',
        count: filteredApps.filter((a) =>
          [
            'Under Review',
            'Shortlisted',
            'Interview Scheduled',
            'Interview Completed',
            'Offer Sent',
            'Hired',
            'Selected'
          ].includes(a.status)
        ).length
      },
      {
        stage: 'Shortlisted',
        count: filteredApps.filter((a) =>
          [
            'Shortlisted',
            'Interview Scheduled',
            'Interview Completed',
            'Offer Sent',
            'Hired',
            'Selected'
          ].includes(a.status)
        ).length
      },
      {
        stage: 'Interview',
        count: filteredApps.filter((a) =>
          ['Interview Scheduled', 'Interview Completed', 'Offer Sent', 'Hired', 'Selected'].includes(
            a.status
          )
        ).length
      },
      {
        stage: 'Offered',
        count: filteredApps.filter((a) =>
          ['Offer Sent', 'Hired', 'Selected'].includes(a.status)
        ).length
      },
      { stage: 'Hired', count: hiredCount }
    ];

    // Graph 3: Applications by Job Position
    const jobCountMap = new Map<string, { title: string; count: number; department: string }>();
    filteredApps.forEach((a) => {
      const opp: any = a.opportunityId;
      const key = opp?._id?.toString() || 'unknown';
      const title = opp?.title || 'Untitled Position';
      const dept = opp?.department || 'General';
      const entry = jobCountMap.get(key) || { title, count: 0, department: dept };
      entry.count++;
      jobCountMap.set(key, entry);
    });
    const applicationsByJob = Array.from(jobCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Graph 4: Hiring Progress by Month (YYYY-MM)
    const monthMap = new Map<string, { month: string; applications: number; interviews: number; hires: number }>();
    filteredApps.forEach((a) => {
      const mKey = new Date(a.createdAt).toISOString().slice(0, 7);
      const bucket = monthMap.get(mKey) || { month: mKey, applications: 0, interviews: 0, hires: 0 };
      bucket.applications++;
      if (['Interview Scheduled', 'Interview Completed', 'Offer Sent', 'Hired', 'Selected'].includes(a.status)) {
        bucket.interviews++;
      }
      if (a.status === 'Hired' || a.status === 'Selected') {
        bucket.hires++;
      }
      monthMap.set(mKey, bucket);
    });
    const hiringProgressByMonth = Array.from(monthMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // Graph 5: Candidate Skill Distribution (strictly from real applicant-provided skills)
    const skillFreq = new Map<string, number>();
    filteredApps.forEach((a) => {
      const sp = (a.seekerId as any)?.seekerProfile || {};
      const skills = new Set<string>([
        ...(Array.isArray(sp.skills) ? sp.skills : []),
        ...(Array.isArray(sp.detailedSkills) ? sp.detailedSkills.map((s: any) => s.name) : [])
      ]);
      skills.forEach((sk) => {
        const clean = String(sk || '').trim();
        if (clean) skillFreq.set(clean, (skillFreq.get(clean) || 0) + 1);
      });
    });
    const candidateSkillDistribution = Array.from(skillFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Department activity breakdown
    const deptMap = new Map<string, { department: string; jobs: number; applications: number; hires: number }>();
    allJobs.forEach((j) => {
      const dept = (j.department || 'General').trim();
      const row = deptMap.get(dept) || { department: dept, jobs: 0, applications: 0, hires: 0 };
      row.jobs++;
      deptMap.set(dept, row);
    });
    filteredApps.forEach((a) => {
      const dept = ((a.opportunityId as any)?.department || 'General').trim();
      const row = deptMap.get(dept) || { department: dept, jobs: 0, applications: 0, hires: 0 };
      row.applications++;
      if (a.status === 'Hired' || a.status === 'Selected') row.hires++;
      deptMap.set(dept, row);
    });
    const hiringByDepartment = Array.from(deptMap.values()).sort(
      (a, b) => b.applications - a.applications
    );

    // Conversion & Time-to-Hire metrics (real calculations; null when denominator is 0)
    const interviewReached = recruitmentFunnel[3].count;
    const offerReached = recruitmentFunnel[4].count;
    const interviewConversionRate =
      totalApplications > 0 ? Math.round((interviewReached / totalApplications) * 100) : null;
    const offerAcceptanceRate =
      offerReached > 0 ? Math.round((hiredCount / offerReached) * 100) : null;

    const hiredAppsWithDates = filteredApps.filter(
      (a) => (a.status === 'Hired' || a.status === 'Selected') && (a.hiredAt || a.updatedAt)
    );
    const avgTimeToHireDays =
      hiredAppsWithDates.length > 0
        ? Math.round(
            hiredAppsWithDates.reduce((acc, a) => {
              const endMs = new Date(a.hiredAt || a.updatedAt).getTime();
              const startMs = new Date(a.createdAt).getTime();
              return acc + Math.max(0, (endMs - startMs) / (1000 * 60 * 60 * 24));
            }, 0) / hiredAppsWithDates.length
          )
        : null;

    sendSuccess(res, 'Employer recruitment analytics retrieved', {
      range,
      dateWindow: { startDate, endDate },
      verificationStatus: employer.verificationStatus,
      verificationLabel: formatVerificationLabel(employer.verificationStatus),
      isVerified: isEmployerVerified(employer.verificationStatus),
      onboardingCompleted: Boolean(employer.onboardingCompleted),
      completionPercentage: employer.completionPercentage || 0,
      kpis: {
        publishedJobs,
        draftJobs,
        closedJobs,
        activeVacancies,
        totalApplications,
        screening: screeningCount,
        shortlisted: shortlistedCount,
        interviewsScheduled: interviewsScheduledCount,
        interviewStageCount,
        offersSent: offersSentCount,
        hired: hiredCount,
        interviewConversionRate,
        offerAcceptanceRate,
        avgTimeToHireDays
      },
      graphs: {
        applicationsOverTime,
        recruitmentFunnel,
        applicationsByJob,
        hiringProgressByMonth,
        candidateSkillDistribution,
        hiringByDepartment
      }
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to compute recruitment analytics', 500);
  }
};

// ============================================================
// 8. NOTIFICATIONS (WITH EXPIRING JOB REMINDERS)
// ============================================================

export const getEmployerNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // Auto-generate deduplicated job expiration reminders (within 7 days)
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const publishedJobs = await Opportunity.find({
      employerId: req.user._id,
      status: 'published',
      applicationDeadline: { $ne: '' }
    }).select('title applicationDeadline');

    for (const job of publishedJobs) {
      if (!job.applicationDeadline) continue;
      const dl = new Date(job.applicationDeadline);
      if (!Number.isNaN(dl.getTime()) && dl >= now && dl <= inSevenDays) {
        const dedupeKey = `job_expiring:${job._id.toString()}:${job.applicationDeadline}`;
        const exists = await RecruitmentNotification.findOne({
          recipientId: req.user._id,
          dedupeKey
        });
        if (!exists) {
          await RecruitmentNotification.create({
            recipientId: req.user._id,
            recipientRole: 'employer',
            type: 'job_expiring',
            title: `Job posting expiring soon: ${job.title}`,
            message: `"${job.title}" reaches its application deadline on ${job.applicationDeadline}. Extend or close it in Job Management.`,
            link: '/employer/jobs',
            dedupeKey,
            metadata: { opportunityId: job._id }
          }).catch(() => {});
        }
      }
    }

    const notifications = await RecruitmentNotification.find({
      recipientId: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    sendSuccess(res, 'Notifications retrieved', {
      unreadCount,
      notifications
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch notifications', 500);
  }
};

export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const id = String(req.params.id || '');
    if (!isValidObjectId(id)) {
      sendError(res, 'Invalid notification ID', 400);
      return;
    }

    const notif = await RecruitmentNotification.findOneAndUpdate(
      { _id: id, recipientId: req.user._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notif) {
      sendError(res, 'Notification not found', 404);
      return;
    }

    sendSuccess(res, 'Notification marked as read', notif);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update notification', 500);
  }
};

export const markAllNotificationsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    await RecruitmentNotification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    sendSuccess(res, 'All notifications marked as read');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update notifications', 500);
  }
};

// ============================================================
// 9. EMPLOYER SETTINGS
// ============================================================

export const updateEmployerSettings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const {
      name,
      isPublicProfileVisible,
      notificationPreferences,
      currentPassword,
      newPassword
    } = req.body || {};

    const employer = await ensureEmployerRecord(req.user);

    if (typeof name === 'string' && name.trim().length >= 2) {
      req.user.name = name.trim();
      req.user.fullName = name.trim();
    }

    if (typeof isPublicProfileVisible === 'boolean') {
      employer.isPublicProfileVisible = isPublicProfileVisible;
    }

    if (notificationPreferences && typeof notificationPreferences === 'object') {
      employer.notificationPreferences = {
        newApplications: notificationPreferences.newApplications !== false,
        candidateResponses: notificationPreferences.candidateResponses !== false,
        interviewReminders: notificationPreferences.interviewReminders !== false,
        verificationUpdates: notificationPreferences.verificationUpdates !== false,
        jobExpirationReminders: notificationPreferences.jobExpirationReminders !== false,
        offerResponses: notificationPreferences.offerResponses !== false
      };
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        sendError(res, 'New password must be at least 6 characters long.', 400);
        return;
      }
      if (!currentPassword) {
        sendError(res, 'Current password is required to set a new password.', 400);
        return;
      }
      const userWithPass = await User.findById(req.user._id);
      if (!userWithPass || !(await userWithPass.comparePassword(String(currentPassword)))) {
        sendError(res, 'Current password is incorrect.', 401);
        return;
      }
      const salt = await bcrypt.genSalt(10);
      req.user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await Promise.all([req.user.save(), employer.save()]);

    sendSuccess(res, 'Employer settings updated successfully', {
      name: req.user.name,
      isPublicProfileVisible: employer.isPublicProfileVisible,
      notificationPreferences: employer.notificationPreferences
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update settings', 500);
  }
};
