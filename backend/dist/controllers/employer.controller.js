"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitVerificationDocs = exports.scheduleInterview = exports.getEmployerApplicants = exports.getEmployerDashboard = void 0;
const Opportunity_1 = require("../models/Opportunity");
const Application_1 = require("../models/Application");
const Employer_1 = require("../models/Employer");
const response_1 = require("../utils/response");
const getEmployerDashboard = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const employerId = req.user._id;
        const [opportunities, applications] = await Promise.all([
            Opportunity_1.Opportunity.find({ employerId }).sort({ createdAt: -1 }),
            Application_1.Application.find({ employerId })
                .populate('opportunityId', 'title')
                .populate('seekerId', 'name email avatar seekerProfile')
                .sort({ createdAt: -1 })
        ]);
        const publishedCount = opportunities.filter((o) => o.status === 'published').length;
        const draftCount = opportunities.filter((o) => o.status === 'draft').length;
        const statusCounts = {
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
        (0, response_1.sendSuccess)(res, 'Employer dashboard stats retrieved', {
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
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch employer dashboard', 500);
    }
};
exports.getEmployerDashboard = getEmployerDashboard;
const getEmployerApplicants = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { opportunityId } = req.query;
        const filter = { employerId: req.user._id };
        if (opportunityId && typeof opportunityId === 'string') {
            filter.opportunityId = opportunityId;
        }
        const applications = await Application_1.Application.find(filter)
            .populate('opportunityId', 'title workMode stipendOrSalary')
            .populate('seekerId', 'name email avatar seekerProfile')
            .sort({ createdAt: -1 });
        (0, response_1.sendSuccess)(res, 'Employer applicants retrieved', applications);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch applicants', 500);
    }
};
exports.getEmployerApplicants = getEmployerApplicants;
const scheduleInterview = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { applicationId, date, time, mode, meetingLink, notes } = req.body;
        if (!applicationId || !date || !time) {
            (0, response_1.sendError)(res, 'applicationId, date, and time are required', 400);
            return;
        }
        const application = await Application_1.Application.findById(applicationId);
        if (!application) {
            (0, response_1.sendError)(res, 'Application not found', 404);
            return;
        }
        // Employer ownership check
        if (application.employerId.toString() !== req.user._id.toString()) {
            (0, response_1.sendError)(res, 'Access denied. You can only schedule interviews for your own postings.', 403);
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
        (0, response_1.sendSuccess)(res, 'Interview scheduled successfully', application);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to schedule interview', 500);
    }
};
exports.scheduleInterview = scheduleInterview;
const submitVerificationDocs = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { docType, docNumber, notes } = req.body;
        if (!docType || !docNumber) {
            (0, response_1.sendError)(res, 'docType and docNumber are required', 400);
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
        await Employer_1.Employer.findOneAndUpdate({ userId: user._id }, {
            companyName: user.employerProfile.companyName || user.name,
            verificationStatus: 'pending',
            verificationDocs: user.employerProfile.verificationDocs
        }, { upsert: true });
        (0, response_1.sendSuccess)(res, 'Verification documents submitted successfully. Platform admin will review.', user.employerProfile);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to submit verification docs', 500);
    }
};
exports.submitVerificationDocs = submitVerificationDocs;
