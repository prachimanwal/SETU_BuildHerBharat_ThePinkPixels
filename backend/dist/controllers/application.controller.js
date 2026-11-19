"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getApplicationById = exports.createApplication = exports.getApplications = void 0;
const Application_1 = require("../models/Application");
const Opportunity_1 = require("../models/Opportunity");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const getApplications = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const filter = {};
        if (req.user.role === 'seeker') {
            filter.seekerId = req.user._id;
        }
        else if (req.user.role === 'employer') {
            filter.employerId = req.user._id;
        }
        const applications = await Application_1.Application.find(filter)
            .populate('opportunityId', 'title organisationName workMode location stipendOrSalary')
            .populate('seekerId', 'name email avatar seekerProfile')
            .sort({ createdAt: -1 });
        (0, response_1.sendSuccess)(res, 'Applications retrieved', applications);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch applications', 500);
    }
};
exports.getApplications = getApplications;
const createApplication = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (req.user.role !== 'seeker') {
            (0, response_1.sendError)(res, 'Only job seekers can submit direct applications.', 403);
            return;
        }
        const parseResult = validators_1.applicationSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
            return;
        }
        const { opportunityId, coverNote } = parseResult.data;
        const opportunity = await Opportunity_1.Opportunity.findById(opportunityId);
        if (!opportunity) {
            (0, response_1.sendError)(res, 'Target opportunity listing not found', 404);
            return;
        }
        if (opportunity.status !== 'published' || opportunity.moderationStatus === 'hidden') {
            (0, response_1.sendError)(res, 'This opportunity is not currently accepting applications.', 400);
            return;
        }
        // Check for duplicate application
        const existing = await Application_1.Application.findOne({
            opportunityId: opportunity._id,
            seekerId: req.user._id
        });
        if (existing) {
            (0, response_1.sendError)(res, 'You have already submitted an application for this opportunity. Track your status in Applications.', 409);
            return;
        }
        const newApp = new Application_1.Application({
            opportunityId: opportunity._id,
            seekerId: req.user._id,
            employerId: opportunity.employerId,
            status: 'Applied',
            coverNote
        });
        await newApp.save();
        (0, response_1.sendSuccess)(res, 'Application submitted successfully! Recruiter review initiated.', newApp, 201);
    }
    catch (error) {
        if (error.code === 11000) {
            (0, response_1.sendError)(res, 'Duplicate application detected for this opportunity.', 409);
            return;
        }
        (0, response_1.sendError)(res, error.message || 'Failed to submit application', 500);
    }
};
exports.createApplication = createApplication;
const getApplicationById = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const application = await Application_1.Application.findById(id)
            .populate('opportunityId')
            .populate('seekerId', 'name email avatar seekerProfile');
        if (!application) {
            (0, response_1.sendError)(res, 'Application not found', 404);
            return;
        }
        // Access authorization check
        const isSeeker = application.seekerId._id.toString() === req.user._id.toString();
        const isEmployer = application.employerId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isSeeker && !isEmployer && !isAdmin) {
            (0, response_1.sendError)(res, 'Access denied to this application record.', 403);
            return;
        }
        (0, response_1.sendSuccess)(res, 'Application details retrieved', application);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch application details', 500);
    }
};
exports.getApplicationById = getApplicationById;
const updateApplicationStatus = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const { status, interviewDetails } = req.body;
        const allowedStatuses = [
            'Applied',
            'Under Review',
            'Shortlisted',
            'Interview Scheduled',
            'Selected',
            'Rejected'
        ];
        if (!status || !allowedStatuses.includes(status)) {
            (0, response_1.sendError)(res, `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`, 400);
            return;
        }
        const application = await Application_1.Application.findById(id);
        if (!application) {
            (0, response_1.sendError)(res, 'Application not found', 404);
            return;
        }
        // Only owner employer or platform admin can alter application status
        const isEmployer = application.employerId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isEmployer && !isAdmin) {
            (0, response_1.sendError)(res, 'Access denied. Only the employer can alter candidate status.', 403);
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
        (0, response_1.sendSuccess)(res, `Application status updated to "${status}"`, application);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update application status', 500);
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
