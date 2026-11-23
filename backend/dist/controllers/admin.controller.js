"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateListing = exports.resolveReport = exports.getReports = exports.updateEmployerVerification = exports.reviewVerificationDocument = exports.getEmployerDocumentsForAdmin = exports.getEmployers = exports.getAdminStats = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const Employer_1 = require("../models/Employer");
const CompanyVerificationDocument_1 = require("../models/CompanyVerificationDocument");
const Opportunity_1 = require("../models/Opportunity");
const Application_1 = require("../models/Application");
const Report_1 = require("../models/Report");
const RecruitmentNotification_1 = require("../models/RecruitmentNotification");
const response_1 = require("../utils/response");
const getAdminStats = async (_req, res) => {
    try {
        const [totalUsers, totalSeekers, totalEmployers, pendingEmployers, totalOpportunities, totalApplications, pendingReports] = await Promise.all([
            User_1.User.countDocuments(),
            User_1.User.countDocuments({ role: 'seeker' }),
            User_1.User.countDocuments({ role: 'employer' }),
            User_1.User.countDocuments({
                role: 'employer',
                'employerProfile.verificationStatus': {
                    $in: ['pending', 'under_review', 'additional_info_required']
                }
            }),
            Opportunity_1.Opportunity.countDocuments({ status: 'published' }),
            Application_1.Application.countDocuments(),
            Report_1.Report.countDocuments({ status: 'pending' })
        ]);
        (0, response_1.sendSuccess)(res, 'Administrator system metrics retrieved', {
            totalUsers,
            totalSeekers,
            totalEmployers,
            pendingEmployers,
            totalOpportunities,
            totalApplications,
            pendingReports
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch admin stats', 500);
    }
};
exports.getAdminStats = getAdminStats;
const getEmployers = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { role: 'employer' };
        if (status && status !== 'all') {
            filter['employerProfile.verificationStatus'] = status;
        }
        const employers = await User_1.User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 });
        const empIds = employers.map((e) => e._id);
        const [companyDocs, verDocs] = await Promise.all([
            Employer_1.Employer.find({ userId: { $in: empIds } }),
            CompanyVerificationDocument_1.CompanyVerificationDocument.find({ employerId: { $in: empIds }, isCurrent: true }).sort({
                createdAt: -1
            })
        ]);
        const companyMap = new Map();
        companyDocs.forEach((c) => companyMap.set(c.userId.toString(), c));
        const docsMap = new Map();
        verDocs.forEach((d) => {
            const uid = d.employerId.toString();
            const arr = docsMap.get(uid) || [];
            arr.push(d);
            docsMap.set(uid, arr);
        });
        const enriched = employers.map((u) => {
            const obj = u.toObject();
            const uid = u._id.toString();
            obj.companyRecord = companyMap.get(uid) || null;
            obj.verificationDocuments = docsMap.get(uid) || [];
            return obj;
        });
        (0, response_1.sendSuccess)(res, 'Employers list retrieved', enriched);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch employers', 500);
    }
};
exports.getEmployers = getEmployers;
const getEmployerDocumentsForAdmin = async (req, res) => {
    try {
        const id = String(req.params.id || '');
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            (0, response_1.sendError)(res, 'Invalid employer ID', 400);
            return;
        }
        const [company, documents] = await Promise.all([
            Employer_1.Employer.findOne({ userId: id }),
            CompanyVerificationDocument_1.CompanyVerificationDocument.find({ employerId: id, isCurrent: true }).sort({ createdAt: -1 })
        ]);
        (0, response_1.sendSuccess)(res, 'Employer verification documents retrieved', {
            company,
            documents
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch employer documents', 500);
    }
};
exports.getEmployerDocumentsForAdmin = getEmployerDocumentsForAdmin;
const reviewVerificationDocument = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
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
        if (!mongoose_1.default.Types.ObjectId.isValid(docId)) {
            (0, response_1.sendError)(res, 'Invalid document ID', 400);
            return;
        }
        if (!status || !validDocStatuses.includes(status)) {
            (0, response_1.sendError)(res, `Invalid document status. Must be one of: ${validDocStatuses.join(', ')}`, 400);
            return;
        }
        const doc = await CompanyVerificationDocument_1.CompanyVerificationDocument.findById(docId);
        if (!doc) {
            (0, response_1.sendError)(res, 'Verification document not found', 404);
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
        await Employer_1.Employer.findOneAndUpdate({ userId: doc.employerId }, {
            $push: {
                verificationAuditTrail: {
                    status,
                    actorId: req.user._id,
                    actorName: req.user.name,
                    actorRole: 'admin',
                    notes: `Document "${doc.documentType}" marked as ${status}.${doc.adminNotes ? ` Feedback: ${doc.adminNotes}` : ''}`,
                    timestamp: new Date()
                }
            }
        });
        await RecruitmentNotification_1.RecruitmentNotification.create({
            recipientId: doc.employerId,
            recipientRole: 'employer',
            type: 'verification_update',
            title: `Verification document ${status}: ${doc.documentType}`,
            message: doc.adminNotes ||
                `SETU admin updated your "${doc.documentType}" status to ${status}.`,
            link: '/employer/verification',
            metadata: { documentId: doc._id, status }
        }).catch(() => { });
        (0, response_1.sendSuccess)(res, `Document status updated to "${status}"`, doc);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to review verification document', 500);
    }
};
exports.reviewVerificationDocument = reviewVerificationDocument;
const updateEmployerVerification = async (req, res) => {
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
            (0, response_1.sendError)(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
            return;
        }
        const user = await User_1.User.findById(id);
        if (!user || user.role !== 'employer') {
            (0, response_1.sendError)(res, 'Employer account not found', 404);
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
        }
        else {
            user.employerProfile.verificationStatus = storedStatus;
            if (reviewNote)
                user.employerProfile.adminReviewNotes = reviewNote;
            if ((0, Employer_1.isEmployerVerified)(storedStatus))
                user.employerProfile.verifiedAt = new Date();
        }
        await user.save();
        const auditEntry = {
            status: storedStatus,
            actorId: req.user?._id,
            actorName: req.user?.name || 'SETU Administrator',
            actorRole: 'admin',
            notes: reviewNote ||
                `Verification status updated to ${(0, Employer_1.formatVerificationLabel)(storedStatus)}.`,
            timestamp: new Date()
        };
        await Employer_1.Employer.findOneAndUpdate({ userId: user._id }, {
            $set: {
                verificationStatus: storedStatus,
                adminReviewNotes: reviewNote,
                ...((0, Employer_1.isEmployerVerified)(storedStatus) ? { verifiedAt: new Date() } : {})
            },
            $push: {
                verificationAuditTrail: auditEntry
            }
        }, { upsert: true });
        // If employer approved, mark pending/under-review docs as Verified as well
        if ((0, Employer_1.isEmployerVerified)(storedStatus)) {
            await CompanyVerificationDocument_1.CompanyVerificationDocument.updateMany({ employerId: user._id, isCurrent: true, status: { $in: ['Pending', 'Under Review'] } }, {
                $set: {
                    status: 'Verified',
                    reviewedBy: req.user?._id,
                    reviewedAt: new Date()
                }
            });
        }
        const label = (0, Employer_1.formatVerificationLabel)(storedStatus);
        await RecruitmentNotification_1.RecruitmentNotification.create({
            recipientId: user._id,
            recipientRole: 'employer',
            type: 'verification_update',
            title: `Company verification: ${label}`,
            message: reviewNote ||
                ((0, Employer_1.isEmployerVerified)(storedStatus)
                    ? 'Congratulations! Your company is now verified and you can publish live job opportunities on SETU.'
                    : `Your company verification status is now "${label}". Check Company Verification for details.`),
            link: '/employer/verification',
            metadata: { verificationStatus: storedStatus }
        }).catch(() => { });
        (0, response_1.sendSuccess)(res, `Employer verification status updated to "${label}"`, {
            userId: user._id,
            employerProfile: user.employerProfile
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update employer verification', 500);
    }
};
exports.updateEmployerVerification = updateEmployerVerification;
const getReports = async (_req, res) => {
    try {
        const reports = await Report_1.Report.find()
            .populate('listingId', 'title organisationName status moderationStatus')
            .populate('reporterId', 'name email')
            .sort({ createdAt: -1 });
        (0, response_1.sendSuccess)(res, 'Community reports retrieved', reports);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch reports', 500);
    }
};
exports.getReports = getReports;
const resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, resolutionNotes } = req.body;
        const report = await Report_1.Report.findById(id);
        if (!report) {
            (0, response_1.sendError)(res, 'Report not found', 404);
            return;
        }
        if (action === 'hide_listing') {
            await Opportunity_1.Opportunity.findByIdAndUpdate(report.listingId, {
                moderationStatus: 'hidden',
                status: 'archived'
            });
            report.status = 'resolved';
        }
        else if (action === 'dismiss') {
            report.status = 'dismissed';
        }
        else {
            report.status = 'resolved';
        }
        if (resolutionNotes) {
            report.resolutionNotes = resolutionNotes;
        }
        await report.save();
        (0, response_1.sendSuccess)(res, 'Report resolution processed successfully', report);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to resolve report', 500);
    }
};
exports.resolveReport = resolveReport;
const moderateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { moderationStatus, status } = req.body;
        const opp = await Opportunity_1.Opportunity.findById(id);
        if (!opp) {
            (0, response_1.sendError)(res, 'Opportunity not found', 404);
            return;
        }
        if (moderationStatus)
            opp.moderationStatus = moderationStatus;
        if (status)
            opp.status = status;
        await opp.save();
        (0, response_1.sendSuccess)(res, 'Opportunity moderation status updated', opp);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to moderate opportunity', 500);
    }
};
exports.moderateListing = moderateListing;
