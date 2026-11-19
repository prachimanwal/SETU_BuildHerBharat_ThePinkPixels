import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Opportunity } from '../models/Opportunity';
import { Application } from '../models/Application';
import { User } from '../models/User';
import { Employer } from '../models/Employer';
import { sendSuccess, sendError } from '../utils/response';

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

    const [opportunities, applications] = await Promise.all([
      Opportunity.find({ employerId }).sort({ createdAt: -1 }),
      Application.find({ employerId })
        .populate('opportunityId', 'title')
        .populate('seekerId', 'name email avatar seekerProfile')
        .sort({ createdAt: -1 })
    ]);

    const publishedCount = opportunities.filter((o) => o.status === 'published').length;
    const draftCount = opportunities.filter((o) => o.status === 'draft').length;

    const statusCounts: Record<string, number> = {
      Applied: 0,
      'Under Review': 0,
      Shortlisted: 0,
      'Interview Scheduled': 0,
      Selected: 0,
      Rejected: 0
    };

    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    sendSuccess(res, 'Employer dashboard stats retrieved', {
      verificationStatus: req.user.employerProfile?.verificationStatus || 'pending',
      stats: {
        totalOpportunities: opportunities.length,
        publishedCount,
        draftCount,
        totalApplicants: applications.length,
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

    const { opportunityId } = req.query;
    const filter: any = { employerId: req.user._id };

    if (opportunityId && typeof opportunityId === 'string') {
      filter.opportunityId = opportunityId;
    }

    const applications = await Application.find(filter)
      .populate('opportunityId', 'title workMode stipendOrSalary')
      .populate('seekerId', 'name email avatar seekerProfile')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'Employer applicants retrieved', applications);
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

    const { applicationId, date, time, mode, meetingLink, notes } = req.body;

    if (!applicationId || !date || !time) {
      sendError(res, 'applicationId, date, and time are required', 400);
      return;
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      sendError(res, 'Application not found', 404);
      return;
    }

    // Employer ownership check
    if (application.employerId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied. You can only schedule interviews for your own postings.', 403);
      return;
    }

    application.status = 'Interview Scheduled';
    application.interviewDetails = {
      date,
      time,
      mode: mode || 'online_call',
      meetingLink: meetingLink || '',
      notes: notes || ''
    };

    await application.save();

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
        verificationStatus: 'pending'
      };
    }

    user.employerProfile.verificationStatus = 'pending';
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
        verificationStatus: 'pending',
        verificationDocs: user.employerProfile.verificationDocs
      },
      { upsert: true }
    );

    sendSuccess(
      res,
      'Verification documents submitted successfully. Platform admin will review.',
      user.employerProfile
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to submit verification docs', 500);
  }
};
