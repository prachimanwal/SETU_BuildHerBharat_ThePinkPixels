import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Employer, formatVerificationLabel, isEmployerVerified } from '../models/Employer';
import { CompanyVerificationDocument } from '../models/CompanyVerificationDocument';
import { Opportunity } from '../models/Opportunity';
import { Application } from '../models/Application';
import { Report } from '../models/Report';
import { RecruitmentNotification } from '../models/RecruitmentNotification';
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
        'employerProfile.verificationStatus': {
          $in: ['pending', 'under_review', 'additional_info_required']
        }
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

    const empIds = employers.map((e) => e._id);
    const [companyDocs, verDocs] = await Promise.all([
      Employer.find({ userId: { $in: empIds } }),
      CompanyVerificationDocument.find({ employerId: { $in: empIds }, isCurrent: true }).sort({
        createdAt: -1
      })
    ]);

    const companyMap = new Map<string, any>();
    companyDocs.forEach((c) => companyMap.set(c.userId.toString(), c));

    const docsMap = new Map<string, any[]>();
    verDocs.forEach((d) => {
      const uid = d.employerId.toString();
      const arr = docsMap.get(uid) || [];
      arr.push(d);
      docsMap.set(uid, arr);
    });

    const enriched = employers.map((u) => {
      const obj = u.toObject() as any;
      const uid = u._id.toString();
      obj.companyRecord = companyMap.get(uid) || null;
      obj.verificationDocuments = docsMap.get(uid) || [];
      return obj;
    });

    sendSuccess(res, 'Employers list retrieved', enriched);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch employers', 500);
  }
};

export const getEmployerDocumentsForAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid employer ID', 400);
      return;
    }

    const [company, documents] = await Promise.all([
      Employer.findOne({ userId: id }),
      CompanyVerificationDocument.find({ employerId: id, isCurrent: true }).sort({ createdAt: -1 })
    ]);

    sendSuccess(res, 'Employer verification documents retrieved', {
      company,
      documents
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch employer documents', 500);
  }
};

export const reviewVerificationDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const docId = String(req.params.docId || '');
    const { status, rejectionReason, adminNotes } = req.body || {};

    const validDocStatuses = [
      'Pending',
      'Under Review',
      'Verified',
      'Rejected',
      'Additional Information Required'
    ];

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      sendError(res, 'Invalid document ID', 400);
      return;
    }
    if (!status || !validDocStatuses.includes(status)) {
      sendError(res, `Invalid document status. Must be one of: ${validDocStatuses.join(', ')}`, 400);
      return;
    }

    const doc = await CompanyVerificationDocument.findById(docId);
    if (!doc) {
      sendError(res, 'Verification document not found', 404);
      return;
    }

    doc.status = status;
    doc.rejectionReason =
      status === 'Rejected' || status === 'Additional Information Required'
        ? String(rejectionReason || adminNotes || '').trim()
        : '';
    doc.adminNotes = String(adminNotes || rejectionReason || '').trim();
    doc.reviewedBy = req.user._id;
    doc.reviewedAt = new Date();
    await doc.save();

    await Employer.findOneAndUpdate(
      { userId: doc.employerId },
      {
        $push: {
          verificationAuditTrail: {
            status,
            actorId: req.user._id,
            actorName: req.user.name,
            actorRole: 'admin',
            notes: `Document "${doc.documentType}" marked as ${status}.${
              doc.adminNotes ? ` Feedback: ${doc.adminNotes}` : ''
            }`,
            timestamp: new Date()
          }
        }
      }
    );

    await RecruitmentNotification.create({
      recipientId: doc.employerId,
      recipientRole: 'employer',
      type: 'verification_update',
      title: `Verification document ${status}: ${doc.documentType}`,
      message:
        doc.adminNotes ||
        `SETU admin updated your "${doc.documentType}" status to ${status}.`,
      link: '/employer/verification',
      metadata: { documentId: doc._id, status }
    }).catch(() => {});

    sendSuccess(res, `Document status updated to "${status}"`, doc);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to review verification document', 500);
  }
};

export const updateEmployerVerification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes, adminReviewNotes } = req.body;

    const validStatuses = [
      'pending',
      'under_review',
      'approved',
      'verified',
      'rejected',
      'additional_info_required',
      'suspended'
    ];
    if (!status || !validStatuses.includes(status)) {
      sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      return;
    }

    const user = await User.findById(id);
    if (!user || user.role !== 'employer') {
      sendError(res, 'Employer account not found', 404);
      return;
    }

    // Normalize 'verified' -> 'approved' for full backwards compatibility while accepting both
    const storedStatus = status === 'verified' ? 'approved' : status;
    const reviewNote = String(notes || adminReviewNotes || '').trim();

    if (!user.employerProfile) {
      user.employerProfile = {
        companyName: user.name,
        industry: 'General',
        verificationStatus: storedStatus
      };
    } else {
      user.employerProfile.verificationStatus = storedStatus;
      if (reviewNote) user.employerProfile.adminReviewNotes = reviewNote;
      if (isEmployerVerified(storedStatus)) user.employerProfile.verifiedAt = new Date();
    }

    await user.save();

    const auditEntry = {
      status: storedStatus,
      actorId: req.user?._id,
      actorName: req.user?.name || 'SETU Administrator',
      actorRole: 'admin' as const,
      notes:
        reviewNote ||
        `Verification status updated to ${formatVerificationLabel(storedStatus)}.`,
      timestamp: new Date()
    };

    await Employer.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          verificationStatus: storedStatus,
          adminReviewNotes: reviewNote,
          ...(isEmployerVerified(storedStatus) ? { verifiedAt: new Date() } : {})
        },
        $push: {
          verificationAuditTrail: auditEntry
        }
      },
      { upsert: true }
    );

    // If employer approved, mark pending/under-review docs as Verified as well
    if (isEmployerVerified(storedStatus)) {
      await CompanyVerificationDocument.updateMany(
        { employerId: user._id, isCurrent: true, status: { $in: ['Pending', 'Under Review'] } },
        {
          $set: {
            status: 'Verified',
            reviewedBy: req.user?._id,
            reviewedAt: new Date()
          }
        }
      );
    }

    const label = formatVerificationLabel(storedStatus);
    await RecruitmentNotification.create({
      recipientId: user._id,
      recipientRole: 'employer',
      type: 'verification_update',
      title: `Company verification: ${label}`,
      message:
        reviewNote ||
        (isEmployerVerified(storedStatus)
          ? 'Congratulations! Your company is now verified and you can publish live job opportunities on SETU.'
          : `Your company verification status is now "${label}". Check Company Verification for details.`),
      link: '/employer/verification',
      metadata: { verificationStatus: storedStatus }
    }).catch(() => {});

    sendSuccess(res, `Employer verification status updated to "${label}"`, {
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
    const { action, resolutionNotes } = req.body;

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
