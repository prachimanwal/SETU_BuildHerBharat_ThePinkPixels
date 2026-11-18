"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScheme = exports.updateScheme = exports.createScheme = exports.updateSupportTicket = exports.getSupportTickets = exports.resolveReport = exports.getReports = exports.toggleOpportunityModeration = exports.getAllOpportunitiesAdmin = exports.updateEmployerVerification = exports.getEmployers = void 0;
const User_1 = require("../models/User");
const Opportunity_1 = require("../models/Opportunity");
const Report_1 = require("../models/Report");
const SupportTicket_1 = require("../models/SupportTicket");
const GovernmentScheme_1 = require("../models/GovernmentScheme");
// --- Employer Verification ---
const getEmployers = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { role: 'employer' };
        if (status) {
            filter['employerProfile.verificationStatus'] = status;
        }
        const employers = await User_1.User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
        res.json(employers);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch employers' });
    }
};
exports.getEmployers = getEmployers;
const updateEmployerVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminReviewNotes } = req.body;
        if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
            res.status(400).json({ error: 'Invalid verification status' });
            return;
        }
        const employer = await User_1.User.findOne({ _id: id, role: 'employer' });
        if (!employer) {
            res.status(404).json({ error: 'Employer not found' });
            return;
        }
        if (!employer.employerProfile) {
            employer.employerProfile = { verificationStatus: status };
        }
        else {
            employer.employerProfile.verificationStatus = status;
        }
        if (adminReviewNotes !== undefined) {
            employer.employerProfile.adminReviewNotes = adminReviewNotes;
        }
        if (status === 'approved') {
            employer.employerProfile.verifiedAt = new Date();
        }
        // If suspended or rejected, auto-hide all their active listings
        if (status === 'suspended' || status === 'rejected') {
            await Opportunity_1.Opportunity.updateMany({ employerId: employer._id, status: 'published' }, { status: 'hidden_by_admin' });
        }
        await employer.save();
        res.json({
            message: `Employer verification status updated to ${status}`,
            employer: {
                id: employer._id,
                name: employer.name,
                email: employer.email,
                employerProfile: employer.employerProfile
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to update employer verification' });
    }
};
exports.updateEmployerVerification = updateEmployerVerification;
// --- Opportunities Moderation ---
const getAllOpportunitiesAdmin = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        const opportunities = await Opportunity_1.Opportunity.find(filter)
            .populate('employerId', 'name email employerProfile')
            .sort({ createdAt: -1 });
        res.json(opportunities);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch opportunities for admin' });
    }
};
exports.getAllOpportunitiesAdmin = getAllOpportunitiesAdmin;
const toggleOpportunityModeration = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, action } = req.body; // status: 'hidden_by_admin' | 'published'
        const opp = await Opportunity_1.Opportunity.findById(id);
        if (!opp) {
            res.status(404).json({ error: 'Opportunity not found' });
            return;
        }
        if (status) {
            opp.status = status;
        }
        else if (action === 'hide') {
            opp.status = 'hidden_by_admin';
        }
        else if (action === 'unhide') {
            opp.status = 'published';
        }
        await opp.save();
        res.json({ message: `Opportunity status changed to ${opp.status}`, opportunity: opp });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to moderate opportunity' });
    }
};
exports.toggleOpportunityModeration = toggleOpportunityModeration;
// --- Reports Moderation ---
const getReports = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        const reports = await Report_1.Report.find(filter)
            .populate('reporterId', 'name email')
            .populate('opportunityId')
            .sort({ createdAt: -1 });
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch reports' });
    }
};
exports.getReports = getReports;
const resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, actionTaken } = req.body;
        const report = await Report_1.Report.findById(id);
        if (!report) {
            res.status(404).json({ error: 'Report not found' });
            return;
        }
        report.status = status || 'action_taken';
        if (adminNotes !== undefined)
            report.adminNotes = adminNotes;
        if (actionTaken !== undefined)
            report.actionTaken = actionTaken;
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();
        // If action taken is listing_hidden, hide the listing
        if (actionTaken === 'listing_hidden') {
            await Opportunity_1.Opportunity.findByIdAndUpdate(report.opportunityId, { status: 'hidden_by_admin' });
        }
        await report.save();
        res.json({ message: 'Report resolved successfully', report });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to resolve report' });
    }
};
exports.resolveReport = resolveReport;
// --- Support & Safety Tickets ---
const getSupportTickets = async (req, res) => {
    try {
        const { status, category } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (category)
            filter.category = category;
        const tickets = await SupportTicket_1.SupportTicket.find(filter).sort({ createdAt: -1 });
        res.json(tickets);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch support tickets' });
    }
};
exports.getSupportTickets = getSupportTickets;
const updateSupportTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const ticket = await SupportTicket_1.SupportTicket.findById(id);
        if (!ticket) {
            res.status(404).json({ error: 'Support ticket not found' });
            return;
        }
        if (status)
            ticket.status = status;
        if (adminNotes !== undefined)
            ticket.adminNotes = adminNotes;
        if (status === 'resolved')
            ticket.resolvedAt = new Date();
        await ticket.save();
        res.json({ message: 'Support ticket updated', ticket });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to update ticket' });
    }
};
exports.updateSupportTicket = updateSupportTicket;
// --- Government Schemes Management ---
const createScheme = async (req, res) => {
    try {
        const scheme = new GovernmentScheme_1.GovernmentScheme(req.body);
        await scheme.save();
        res.status(201).json({ message: 'Government scheme added', scheme });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to create scheme' });
    }
};
exports.createScheme = createScheme;
const updateScheme = async (req, res) => {
    try {
        const scheme = await GovernmentScheme_1.GovernmentScheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!scheme) {
            res.status(404).json({ error: 'Scheme not found' });
            return;
        }
        res.json({ message: 'Scheme updated', scheme });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to update scheme' });
    }
};
exports.updateScheme = updateScheme;
const deleteScheme = async (req, res) => {
    try {
        const result = await GovernmentScheme_1.GovernmentScheme.findByIdAndDelete(req.params.id);
        if (!result) {
            res.status(404).json({ error: 'Scheme not found' });
            return;
        }
        res.json({ message: 'Scheme deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to delete scheme' });
    }
};
exports.deleteScheme = deleteScheme;
