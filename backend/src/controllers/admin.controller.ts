import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Employer } from '../models/Employer';
import { Opportunity } from '../models/Opportunity';
import { Application } from '../models/Application';
import { Report } from '../models/Report';
import { sendSuccess, sendError } from '../utils/response';

export const getAdminStats = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalSeekers,
      totalEmployers,
      pendingEmployers,
      totalOpportunities,
      totalApplications,
      pendingReports
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seeker' }),
      User.countDocuments({ role: 'employer' }),
      User.countDocuments({
        role: 'employer',
        'employerProfile.verificationStatus': 'pending'
      }),
      Opportunity.countDocuments({ status: 'published' }),
      Application.countDocuments(),
      Report.countDocuments({ status: 'pending' })
    ]);

    sendSuccess(res, 'Administrator system metrics retrieved', {
      totalUsers,
      totalSeekers,
      totalEmployers,
      pendingEmployers,
      totalOpportunities,
      totalApplications,
      pendingReports
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch admin stats', 500);
  }
};

export const getEmployers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = { role: 'employer' };

    if (status && status !== 'all') {
      filter['employerProfile.verificationStatus'] = status;
    }

    const employers = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'Employers list retrieved', employers);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch employers', 500);
  }
};

export const updateEmployerVerification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];
    if (!status || !validStatuses.includes(status)) {
      sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      return;
    }

    const user = await User.findById(id);
    if (!user || user.role !== 'employer') {
      sendError(res, 'Employer account not found', 404);
      return;
    }

    if (!user.employerProfile) {
      user.employerProfile = {
        companyName: user.name,
        industry: 'General',
        verificationStatus: status
      };
    } else {
      user.employerProfile.verificationStatus = status;
      if (notes) user.employerProfile.adminReviewNotes = notes;
      if (status === 'approved') user.employerProfile.verifiedAt = new Date();
    }

    await user.save();

    await Employer.findOneAndUpdate(
      { userId: user._id },
      {
        verificationStatus: status,
        adminReviewNotes: notes || '',
        verifiedAt: status === 'approved' ? new Date() : undefined
      },
      { upsert: true }
    );

    sendSuccess(res, `Employer verification status updated to "${status}"`, {
      userId: user._id,
      employerProfile: user.employerProfile
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update employer verification', 500);
  }
};

export const getReports = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const reports = await Report.find()
      .populate('listingId', 'title organisationName status moderationStatus')
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'Community reports retrieved', reports);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch reports', 500);
  }
};

export const resolveReport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, resolutionNotes } = req.body; // action: 'dismiss' | 'hide_listing' | 'resolve'

    const report = await Report.findById(id);
    if (!report) {
      sendError(res, 'Report not found', 404);
      return;
    }

    if (action === 'hide_listing') {
      await Opportunity.findByIdAndUpdate(report.listingId, {
        moderationStatus: 'hidden',
        status: 'archived'
      });
      report.status = 'resolved';
    } else if (action === 'dismiss') {
      report.status = 'dismissed';
    } else {
      report.status = 'resolved';
    }

    if (resolutionNotes) {
      report.resolutionNotes = resolutionNotes;
    }

    await report.save();

    sendSuccess(res, 'Report resolution processed successfully', report);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to resolve report', 500);
  }
};

export const moderateListing = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { moderationStatus, status } = req.body;

    const opp = await Opportunity.findById(id);
    if (!opp) {
      sendError(res, 'Opportunity not found', 404);
      return;
    }

    if (moderationStatus) opp.moderationStatus = moderationStatus;
    if (status) opp.status = status;

    await opp.save();

    sendSuccess(res, 'Opportunity moderation status updated', opp);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to moderate opportunity', 500);
  }
};
