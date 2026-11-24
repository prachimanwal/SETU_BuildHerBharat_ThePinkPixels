"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getApplicationById = exports.createApplication = exports.getApplications = exports.ALLOWED_APPLICATION_STATUSES = void 0;
const Application_1 = require("../models/Application");
const Opportunity_1 = require("../models/Opportunity");
const RecruitmentNotification_1 = require("../models/RecruitmentNotification");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const progressSnapshot_service_1 = require("../services/progressSnapshot.service");
exports.ALLOWED_APPLICATION_STATUSES = [
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
        const applications = req.user.role === 'seeker'
            ? await Application_1.Application.find(filter)
                .select('-recruiterNotes')
                .populate('opportunityId', 'title organisationName department workMode location stipendOrSalary')
                .populate('employerId', 'name employerProfile.companyName')
                .sort({ createdAt: -1 })
            : await Application_1.Application.find(filter)
                .populate('opportunityId', 'title organisationName department workMode location stipendOrSalary')
                .populate('employerId', 'name employerProfile.companyName')
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
        const { opportunityId, coverNote, screeningAnswers } = parseResult.data;
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
        void (0, progressSnapshot_service_1.recordUserProgressSnapshot)(req.user._id);
        // Notify employer about the new application (best-effort)
        await RecruitmentNotification_1.RecruitmentNotification.create({
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
        }).catch(() => { });
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
        const payload = application.toObject();
        if (isSeeker && !isEmployer && !isAdmin) {
            delete payload.recruiterNotes;
        }
        (0, response_1.sendSuccess)(res, 'Application details retrieved', payload);
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
        const { status, interviewDetails, recruiterNote, candidateMessage } = req.body;
        if (!status || !exports.ALLOWED_APPLICATION_STATUSES.includes(status)) {
            (0, response_1.sendError)(res, `Invalid status. Must be one of: ${exports.ALLOWED_APPLICATION_STATUSES.join(', ')}`, 400);
            return;
        }
        const application = await Application_1.Application.findById(id).populate('opportunityId', 'title');
        if (!application) {
            (0, response_1.sendError)(res, 'Application not found', 404);
            return;
        }
        const isEmployer = application.employerId.toString() === req.user._id.toString();
        const isSeeker = application.seekerId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        // Seekers may only withdraw their own application
        if (isSeeker && !isEmployer && !isAdmin) {
            if (status !== 'Withdrawn') {
                (0, response_1.sendError)(res, 'Job seekers can only withdraw their own application.', 403);
                return;
            }
        }
        else if (!isEmployer && !isAdmin) {
            (0, response_1.sendError)(res, 'Access denied. Only the employer can alter candidate status.', 403);
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
        void (0, progressSnapshot_service_1.recordUserProgressSnapshot)(application.seekerId);
        const oppTitle = application.opportunityId?.title || 'your applied role';
        if (isEmployer || isAdmin) {
            await RecruitmentNotification_1.RecruitmentNotification.create({
                recipientId: application.seekerId,
                recipientRole: 'seeker',
                type: status === 'Offer Sent' ? 'offer_response' : 'application_update',
                title: `Application status updated: ${status}`,
                message: (typeof candidateMessage === 'string' && candidateMessage.trim()) ||
                    `Your application for "${oppTitle}" is now marked as ${status}.`,
                link: '/applications',
                metadata: { applicationId: application._id, status }
            }).catch(() => { });
        }
        else if (isSeeker && status === 'Withdrawn') {
            await RecruitmentNotification_1.RecruitmentNotification.create({
                recipientId: application.employerId,
                recipientRole: 'employer',
                type: 'candidate_response',
                title: `Candidate withdrew application`,
                message: `A candidate has withdrawn their application for "${oppTitle}".`,
                link: '/employer/applications',
                metadata: { applicationId: application._id, status }
            }).catch(() => { });
        }
        (0, response_1.sendSuccess)(res, `Application status updated to "${status}"`, application);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update application status', 500);
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
