"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateListing = exports.resolveReport = exports.getReports = exports.updateEmployerVerification = exports.getEmployers = exports.getAdminStats = void 0;
const User_1 = require("../models/User");
const Employer_1 = require("../models/Employer");
const Opportunity_1 = require("../models/Opportunity");
const Application_1 = require("../models/Application");
const Report_1 = require("../models/Report");
const response_1 = require("../utils/response");
const getAdminStats = async (_req, res) => {
    try {
        const [totalUsers, totalSeekers, totalEmployers, pendingEmployers, totalOpportunities, totalApplications, pendingReports] = await Promise.all([
            User_1.User.countDocuments(),
            User_1.User.countDocuments({ role: 'seeker' }),
            User_1.User.countDocuments({ role: 'employer' }),
            User_1.User.countDocuments({
                role: 'employer',
                'employerProfile.verificationStatus': 'pending'
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
        (0, response_1.sendSuccess)(res, 'Employers list retrieved', employers);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch employers', 500);
    }
};
exports.getEmployers = getEmployers;
const updateEmployerVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];
        if (!status || !validStatuses.includes(status)) {
            (0, response_1.sendError)(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
            return;
        }
        const user = await User_1.User.findById(id);
        if (!user || user.role !== 'employer') {
            (0, response_1.sendError)(res, 'Employer account not found', 404);
            return;
        }
        if (!user.employerProfile) {
            user.employerProfile = {
                companyName: user.name,
                industry: 'General',
                verificationStatus: status
            };
        }
        else {
            user.employerProfile.verificationStatus = status;
            if (notes)
                user.employerProfile.adminReviewNotes = notes;
            if (status === 'approved')
                user.employerProfile.verifiedAt = new Date();
        }
        await user.save();
        await Employer_1.Employer.findOneAndUpdate({ userId: user._id }, {
            verificationStatus: status,
            adminReviewNotes: notes || '',
            verifiedAt: status === 'approved' ? new Date() : undefined
        }, { upsert: true });
        (0, response_1.sendSuccess)(res, `Employer verification status updated to "${status}"`, {
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
        const { action, resolutionNotes } = req.body; // action: 'dismiss' | 'hide_listing' | 'resolve'
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
