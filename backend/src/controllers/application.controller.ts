import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Application, ApplicationStatus } from '../models/Application';
import { Opportunity } from '../models/Opportunity';
import { RecruitmentNotification } from '../models/RecruitmentNotification';
import { sendSuccess, sendError } from '../utils/response';
import { applicationSchema } from '../utils/validators';

export const ALLOWED_APPLICATION_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Sent',
  'Hired',
  'Selected',
  'Rejected',
  'Withdrawn'
];

export const getApplications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const filter: any = {};
    if (req.user.role === 'seeker') {
      filter.seekerId = req.user._id;
    } else if (req.user.role === 'employer') {
      filter.employerId = req.user._id;
    }

    const applications =
      req.user.role === 'seeker'
        ? await Application.find(filter)
            .select('-recruiterNotes')
            .populate(
              'opportunityId',
              'title organisationName department workMode location stipendOrSalary'
            )
            .populate('employerId', 'name employerProfile.companyName')
            .sort({ createdAt: -1 })
        : await Application.find(filter)
            .populate(
              'opportunityId',
              'title organisationName department workMode location stipendOrSalary'
            )
            .populate('employerId', 'name employerProfile.companyName')
            .populate('seekerId', 'name email avatar seekerProfile')
            .sort({ createdAt: -1 });

    sendSuccess(res, 'Applications retrieved', applications);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch applications', 500);
  }
};

export const createApplication = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (req.user.role !== 'seeker') {
      sendError(res, 'Only job seekers can submit direct applications.', 403);
      return;
    }

    const parseResult = applicationSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
      return;
    }

    const { opportunityId, coverNote, screeningAnswers } = parseResult.data;

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      sendError(res, 'Target opportunity listing not found', 404);
      return;
    }

    if (opportunity.status !== 'published' || opportunity.moderationStatus === 'hidden') {
      sendError(res, 'This opportunity is not currently accepting applications.', 400);
      return;
    }

    // Check for duplicate application
    const existing = await Application.findOne({
      opportunityId: opportunity._id,
      seekerId: req.user._id
    });

    if (existing) {
      sendError(
        res,
        'You have already submitted an application for this opportunity. Track your status in Applications.',
        409
      );
      return;
    }

    const newApp = new Application({
      opportunityId: opportunity._id,
      seekerId: req.user._id,
      employerId: opportunity.employerId,
      status: 'Applied',
      coverNote,
      screeningAnswers: screeningAnswers || [],
      statusHistory: [
        {
          status: 'Applied',
          updatedByRole: 'seeker',
          note: 'Candidate submitted direct application via SETU.',
          timestamp: new Date()
        }
      ]
    });

    await newApp.save();

    // Notify employer about the new application (best-effort)
    await RecruitmentNotification.create({
      recipientId: opportunity.employerId,
      recipientRole: 'employer',
      type: 'new_application',
      title: `New application for ${opportunity.title}`,
      message: `${req.user.name} applied for "${opportunity.title}". Review their profile and resume in Applications.`,
      link: '/employer/applications',
      metadata: {
        applicationId: newApp._id,
        opportunityId: opportunity._id
      }
    }).catch(() => {});

    sendSuccess(
      res,
      'Application submitted successfully! Recruiter review initiated.',
      newApp,
      201
    );
  } catch (error: any) {
    if (error.code === 11000) {
      sendError(res, 'Duplicate application detected for this opportunity.', 409);
      return;
    }
    sendError(res, error.message || 'Failed to submit application', 500);
  }
};

export const getApplicationById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const application = await Application.findById(id)
      .populate('opportunityId')
      .populate('seekerId', 'name email avatar seekerProfile');

    if (!application) {
      sendError(res, 'Application not found', 404);
      return;
    }

    // Access authorization check
    const isSeeker = application.seekerId._id.toString() === req.user._id.toString();
    const isEmployer = application.employerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSeeker && !isEmployer && !isAdmin) {
      sendError(res, 'Access denied to this application record.', 403);
      return;
    }

    const payload = application.toObject();
    if (isSeeker && !isEmployer && !isAdmin) {
      delete payload.recruiterNotes;
    }

    sendSuccess(res, 'Application details retrieved', payload);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch application details', 500);
  }
};

export const updateApplicationStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const { status, interviewDetails, recruiterNote, candidateMessage } = req.body;

    if (!status || !ALLOWED_APPLICATION_STATUSES.includes(status)) {
      sendError(
        res,
        `Invalid status. Must be one of: ${ALLOWED_APPLICATION_STATUSES.join(', ')}`,
        400
      );
      return;
    }

    const application = await Application.findById(id).populate('opportunityId', 'title');
    if (!application) {
      sendError(res, 'Application not found', 404);
      return;
    }

    const isEmployer = application.employerId.toString() === req.user._id.toString();
    const isSeeker = application.seekerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Seekers may only withdraw their own application
    if (isSeeker && !isEmployer && !isAdmin) {
      if (status !== 'Withdrawn') {
        sendError(res, 'Job seekers can only withdraw their own application.', 403);
        return;
      }
    } else if (!isEmployer && !isAdmin) {
      sendError(res, 'Access denied. Only the employer can alter candidate status.', 403);
      return;
    }

    application.status = status;

    if (status === 'Offer Sent' && !application.offerSentAt) {
      application.offerSentAt = new Date();
    }
    if ((status === 'Hired' || status === 'Selected') && !application.hiredAt) {
      application.hiredAt = new Date();
    }

    if (interviewDetails && typeof interviewDetails === 'object') {
      application.interviewDetails = {
        ...application.interviewDetails,
        ...interviewDetails
      };
    }

    if (recruiterNote && typeof recruiterNote === 'string' && recruiterNote.trim() && (isEmployer || isAdmin)) {
      application.recruiterNotes = application.recruiterNotes || [];
      application.recruiterNotes.push({
        note: recruiterNote.trim(),
        authorName: req.user.name || 'Recruiter',
        createdAt: new Date()
      });
    }

    if (typeof candidateMessage === 'string' && (isEmployer || isAdmin)) {
      application.candidateUpdateMessage = candidateMessage.trim();
    }

    application.statusHistory = application.statusHistory || [];
    application.statusHistory.push({
      status,
      updatedByRole: req.user.role,
      note: typeof candidateMessage === 'string' ? candidateMessage.trim() : '',
      timestamp: new Date()
    });

    await application.save();

    const oppTitle = (application.opportunityId as any)?.title || 'your applied role';
    if (isEmployer || isAdmin) {
      await RecruitmentNotification.create({
        recipientId: application.seekerId,
        recipientRole: 'seeker',
        type: status === 'Offer Sent' ? 'offer_response' : 'application_update',
        title: `Application status updated: ${status}`,
        message:
          (typeof candidateMessage === 'string' && candidateMessage.trim()) ||
          `Your application for "${oppTitle}" is now marked as ${status}.`,
        link: '/applications',
        metadata: { applicationId: application._id, status }
      }).catch(() => {});
    } else if (isSeeker && status === 'Withdrawn') {
      await RecruitmentNotification.create({
        recipientId: application.employerId,
        recipientRole: 'employer',
        type: 'candidate_response',
        title: `Candidate withdrew application`,
        message: `A candidate has withdrawn their application for "${oppTitle}".`,
        link: '/employer/applications',
        metadata: { applicationId: application._id, status }
      }).catch(() => {});
    }

    sendSuccess(res, `Application status updated to "${status}"`, application);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update application status', 500);
  }
};
