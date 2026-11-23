import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Opportunity } from '../models/Opportunity';
import { Application } from '../models/Application';
import { Employer, isEmployerVerified, formatVerificationLabel } from '../models/Employer';
import { Interview } from '../models/Interview';
import { Portfolio } from '../models/Portfolio';
import { Resume } from '../models/Resume';
import { UploadedResumeFile } from '../models/UploadedResumeFile';
import { RecruitmentNotification } from '../models/RecruitmentNotification';
import { sendSuccess, sendError } from '../utils/response';
import { ensureEmployerRecord } from './employerPortal.controller';

export const getEmployerDashboard = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const employerId = req.user._id;

    const [employer, opportunities, applications, interviews] = await Promise.all([
      ensureEmployerRecord(req.user),
      Opportunity.find({ employerId }).sort({ createdAt: -1 }),
      Application.find({ employerId })
        .populate('opportunityId', 'title department')
        .populate('seekerId', 'name email avatar seekerProfile')
        .sort({ createdAt: -1 }),
      Interview.find({ employerId }).sort({ scheduledAt: 1 })
    ]);

    const publishedCount = opportunities.filter((o) => o.status === 'published').length;
    const draftCount = opportunities.filter((o) => o.status === 'draft').length;

    const statusCounts: Record<string, number> = {
      Applied: 0,
      'Under Review': 0,
      Shortlisted: 0,
      'Interview Scheduled': 0,
      'Interview Completed': 0,
      'Offer Sent': 0,
      Hired: 0,
      Selected: 0,
      Rejected: 0,
      Withdrawn: 0
    };

    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    sendSuccess(res, 'Employer dashboard stats retrieved', {
      verificationStatus: employer.verificationStatus,
      verificationLabel: formatVerificationLabel(employer.verificationStatus),
      isVerified: isEmployerVerified(employer.verificationStatus),
      onboardingCompleted: Boolean(employer.onboardingCompleted),
      completionPercentage: employer.completionPercentage || 0,
      stats: {
        totalOpportunities: opportunities.length,
        publishedCount,
        draftCount,
        totalApplicants: applications.length,
        shortlistedCount: statusCounts.Shortlisted,
        interviewsScheduledCount:
          interviews.filter((i) => i.status === 'Scheduled' || i.status === 'Rescheduled').length ||
          statusCounts['Interview Scheduled'],
        offersSentCount: statusCounts['Offer Sent'],
        hiredCount: statusCounts.Hired + statusCounts.Selected,
        statusCounts
      },
      recentOpportunities: opportunities.slice(0, 5),
      recentApplications: applications.slice(0, 5)
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch employer dashboard', 500);
  }
};

export const getEmployerApplicants = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { opportunityId, status } = req.query;
    const filter: any = { employerId: req.user._id };

    if (opportunityId && typeof opportunityId === 'string' && opportunityId !== 'all') {
      filter.opportunityId = opportunityId;
    }
    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('opportunityId', 'title department workMode stipendOrSalary location')
      .populate('seekerId', 'name email avatar profilePicture seekerProfile')
      .sort({ createdAt: -1 });

    // Enrich with real portfolio projects and resume availability
    const seekerIds = Array.from(
      new Set(
        applications
          .map((a: any) => a.seekerId?._id?.toString())
          .filter(Boolean)
      )
    );

    const [portfolios, builtResumes, uploadedResumes] = await Promise.all([
      Portfolio.find({ userId: { $in: seekerIds } }).select('userId title skills category workSampleUrl githubUrl'),
      Resume.find({ userId: { $in: seekerIds } }).select('userId title summary skills education experience projects updatedAt'),
      UploadedResumeFile.find({ userId: { $in: seekerIds } }).select('userId originalFilename extractedData createdAt')
    ]);

    const portfolioMap = new Map<string, any[]>();
    portfolios.forEach((p) => {
      const key = p.userId.toString();
      const arr = portfolioMap.get(key) || [];
      arr.push(p);
      portfolioMap.set(key, arr);
    });

    const builtResumeMap = new Map<string, any>();
    builtResumes.forEach((r) => builtResumeMap.set(r.userId.toString(), r));

    const uploadedResumeMap = new Map<string, any>();
    uploadedResumes.forEach((r) => {
      const key = r.userId.toString();
      if (!uploadedResumeMap.has(key)) uploadedResumeMap.set(key, r);
    });

    const enriched = applications.map((app: any) => {
      const obj = app.toObject();
      const uid = obj.seekerId?._id?.toString() || '';
      obj.candidatePortfolios = portfolioMap.get(uid) || [];
      obj.candidateResume = builtResumeMap.get(uid) || null;
      obj.candidateUploadedResume = uploadedResumeMap.get(uid) || null;
      return obj;
    });

    sendSuccess(res, 'Employer applicants retrieved', enriched);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch applicants', 500);
  }
};

export const scheduleInterview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { applicationId, date, time, mode, meetingLink, notes, interviewerName } = req.body;

    if (!applicationId || !date || !time) {
      sendError(res, 'applicationId, date, and time are required', 400);
      return;
    }

    const application = await Application.findById(applicationId).populate('opportunityId', 'title');
    if (!application) {
      sendError(res, 'Application not found', 404);
      return;
    }

    // Employer ownership check
    if (application.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied. You can only schedule interviews for your own postings.', 403);
      return;
    }

    const normalizedMode =
      mode === 'in_person' || mode === 'Offline'
        ? 'Offline'
        : mode === 'Telephone'
        ? 'Telephone'
        : 'Online';

    application.status = 'Interview Scheduled';
    application.interviewDetails = {
      date,
      time,
      mode: normalizedMode,
      meetingLink: meetingLink || '',
      notes: notes || ''
    };
    application.statusHistory = application.statusHistory || [];
    application.statusHistory.push({
      status: 'Interview Scheduled',
      updatedByRole: 'employer',
      note: `${normalizedMode} interview scheduled for ${date} at ${time}.`,
      timestamp: new Date()
    });

    await application.save();

    // Sync into dedicated Interview collection
    const employer = await ensureEmployerRecord(req.user);
    const parsedDt = new Date(`${date}T${/^\d{2}:\d{2}/.test(time) ? time : '10:00'}`);
    await Interview.create({
      employerId: req.user._id,
      companyId: employer._id,
      applicationId: application._id,
      opportunityId: (application.opportunityId as any)?._id || application.opportunityId,
      candidateId: application.seekerId,
      scheduledDate: date,
      scheduledTime: time,
      scheduledAt: Number.isNaN(parsedDt.getTime()) ? new Date() : parsedDt,
      mode: normalizedMode,
      meetingLinkOrLocation: meetingLink || '',
      interviewerName: interviewerName || req.user.name || 'Hiring Manager',
      notes: notes || '',
      status: 'Scheduled'
    }).catch(() => {});

    const oppTitle = (application.opportunityId as any)?.title || 'your applied role';
    await RecruitmentNotification.create({
      recipientId: application.seekerId,
      recipientRole: 'seeker',
      type: 'upcoming_interview',
      title: `Interview scheduled for ${oppTitle}`,
      message: `Your ${normalizedMode} interview is scheduled for ${date} at ${time}.`,
      link: '/applications',
      metadata: { applicationId: application._id }
    }).catch(() => {});

    sendSuccess(res, 'Interview scheduled successfully', application);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to schedule interview', 500);
  }
};

export const submitVerificationDocs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { docType, docNumber, notes } = req.body;

    if (!docType || !docNumber) {
      sendError(res, 'docType and docNumber are required', 400);
      return;
    }

    const user = req.user;
    if (!user.employerProfile) {
      user.employerProfile = {
        companyName: user.name,
        industry: 'General',
        verificationStatus: 'under_review'
      };
    }

    // Never auto-verify!
    if (!isEmployerVerified(user.employerProfile.verificationStatus)) {
      user.employerProfile.verificationStatus = 'under_review';
    }
    user.employerProfile.verificationDocs = {
      docType,
      docNumber,
      notes: notes || '',
      submittedAt: new Date()
    };

    await user.save();

    await Employer.findOneAndUpdate(
      { userId: user._id },
      {
        companyName: user.employerProfile.companyName || user.name,
        verificationStatus: user.employerProfile.verificationStatus,
        verificationDocs: user.employerProfile.verificationDocs,
        $push: {
          verificationAuditTrail: {
            status: user.employerProfile.verificationStatus,
            actorId: user._id,
            actorName: user.name,
            actorRole: 'employer',
            notes: `Submitted ${docType} (${docNumber}) for admin review.`,
            timestamp: new Date()
          }
        }
      },
      { upsert: true }
    );

    sendSuccess(
      res,
      'Verification details submitted successfully. Platform admin will review.',
      user.employerProfile
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to submit verification docs', 500);
  }
};
