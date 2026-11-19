import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Application, ApplicationStatus } from '../models/Application';
import { Opportunity } from '../models/Opportunity';
import { sendSuccess, sendError } from '../utils/response';
import { applicationSchema } from '../utils/validators';

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

    const applications = await Application.find(filter)
      .populate('opportunityId', 'title organisationName workMode location stipendOrSalary')
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

    const { opportunityId, coverNote } = parseResult.data;

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
      coverNote
    });

    await newApp.save();

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

    sendSuccess(res, 'Application details retrieved', application);
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
    const { status, interviewDetails } = req.body;

    const allowedStatuses: ApplicationStatus[] = [
      'Applied',
      'Under Review',
      'Shortlisted',
      'Interview Scheduled',
      'Selected',
      'Rejected'
    ];

    if (!status || !allowedStatuses.includes(status)) {
      sendError(res, `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`, 400);
      return;
    }

    const application = await Application.findById(id);
    if (!application) {
      sendError(res, 'Application not found', 404);
      return;
    }

    // Only owner employer or platform admin can alter application status
    const isEmployer = application.employerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isEmployer && !isAdmin) {
      sendError(res, 'Access denied. Only the employer can alter candidate status.', 403);
      return;
    }

    application.status = status;
    if (interviewDetails && typeof interviewDetails === 'object') {
      application.interviewDetails = {
        ...application.interviewDetails,
        ...interviewDetails
      };
    }

    await application.save();

    sendSuccess(res, `Application status updated to "${status}"`, application);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update application status', 500);
  }
};
