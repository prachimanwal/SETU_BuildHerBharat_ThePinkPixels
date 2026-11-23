"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitVerificationDocs = exports.scheduleInterview = exports.getEmployerApplicants = exports.getEmployerDashboard = void 0;
const Opportunity_1 = require("../models/Opportunity");
const Application_1 = require("../models/Application");
const Employer_1 = require("../models/Employer");
const Interview_1 = require("../models/Interview");
const Portfolio_1 = require("../models/Portfolio");
const Resume_1 = require("../models/Resume");
const UploadedResumeFile_1 = require("../models/UploadedResumeFile");
const RecruitmentNotification_1 = require("../models/RecruitmentNotification");
const response_1 = require("../utils/response");
const employerPortal_controller_1 = require("./employerPortal.controller");
const getEmployerDashboard = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const employerId = req.user._id;
        const [employer, opportunities, applications, interviews] = await Promise.all([
            (0, employerPortal_controller_1.ensureEmployerRecord)(req.user),
            Opportunity_1.Opportunity.find({ employerId }).sort({ createdAt: -1 }),
            Application_1.Application.find({ employerId })
                .populate('opportunityId', 'title department')
                .populate('seekerId', 'name email avatar seekerProfile')
                .sort({ createdAt: -1 }),
            Interview_1.Interview.find({ employerId }).sort({ scheduledAt: 1 })
        ]);
        const publishedCount = opportunities.filter((o) => o.status === 'published').length;
        const draftCount = opportunities.filter((o) => o.status === 'draft').length;
        const statusCounts = {
            Applied: 0,
            'Under Review': 0,
            Shortlisted: 0,
            'Interview Scheduled': 0,
            'Interview Completed': 0,
            'Offer Sent': 0,
            Hired: 0,
            Selected: 0,
            Rejected: 0,
            Withdrawn: 0
        };
        applications.forEach((app) => {
            if (statusCounts[app.status] !== undefined) {
                statusCounts[app.status]++;
            }
        });
        (0, response_1.sendSuccess)(res, 'Employer dashboard stats retrieved', {
            verificationStatus: employer.verificationStatus,
            verificationLabel: (0, Employer_1.formatVerificationLabel)(employer.verificationStatus),
            isVerified: (0, Employer_1.isEmployerVerified)(employer.verificationStatus),
            onboardingCompleted: Boolean(employer.onboardingCompleted),
            completionPercentage: employer.completionPercentage || 0,
            stats: {
                totalOpportunities: opportunities.length,
                publishedCount,
                draftCount,
                totalApplicants: applications.length,
                shortlistedCount: statusCounts.Shortlisted,
                interviewsScheduledCount: interviews.filter((i) => i.status === 'Scheduled' || i.status === 'Rescheduled').length ||
                    statusCounts['Interview Scheduled'],
                offersSentCount: statusCounts['Offer Sent'],
                hiredCount: statusCounts.Hired + statusCounts.Selected,
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
        const { opportunityId, status } = req.query;
        const filter = { employerId: req.user._id };
        if (opportunityId && typeof opportunityId === 'string' && opportunityId !== 'all') {
            filter.opportunityId = opportunityId;
        }
        if (status && typeof status === 'string' && status !== 'all') {
            filter.status = status;
        }
        const applications = await Application_1.Application.find(filter)
            .populate('opportunityId', 'title department workMode stipendOrSalary location')
            .populate('seekerId', 'name email avatar profilePicture seekerProfile')
            .sort({ createdAt: -1 });
        // Enrich with real portfolio projects and resume availability
        const seekerIds = Array.from(new Set(applications
            .map((a) => a.seekerId?._id?.toString())
            .filter(Boolean)));
        const [portfolios, builtResumes, uploadedResumes] = await Promise.all([
            Portfolio_1.Portfolio.find({ userId: { $in: seekerIds } }).select('userId title skills category workSampleUrl githubUrl'),
            Resume_1.Resume.find({ userId: { $in: seekerIds } }).select('userId title summary skills education experience projects updatedAt'),
            UploadedResumeFile_1.UploadedResumeFile.find({ userId: { $in: seekerIds } }).select('userId originalFilename extractedData createdAt')
        ]);
        const portfolioMap = new Map();
        portfolios.forEach((p) => {
            const key = p.userId.toString();
            const arr = portfolioMap.get(key) || [];
            arr.push(p);
            portfolioMap.set(key, arr);
        });
        const builtResumeMap = new Map();
        builtResumes.forEach((r) => builtResumeMap.set(r.userId.toString(), r));
        const uploadedResumeMap = new Map();
        uploadedResumes.forEach((r) => {
            const key = r.userId.toString();
            if (!uploadedResumeMap.has(key))
                uploadedResumeMap.set(key, r);
        });
        const enriched = applications.map((app) => {
            const obj = app.toObject();
            const uid = obj.seekerId?._id?.toString() || '';
            obj.candidatePortfolios = portfolioMap.get(uid) || [];
            obj.candidateResume = builtResumeMap.get(uid) || null;
            obj.candidateUploadedResume = uploadedResumeMap.get(uid) || null;
            return obj;
        });
        (0, response_1.sendSuccess)(res, 'Employer applicants retrieved', enriched);
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
        const { applicationId, date, time, mode, meetingLink, notes, interviewerName } = req.body;
        if (!applicationId || !date || !time) {
            (0, response_1.sendError)(res, 'applicationId, date, and time are required', 400);
            return;
        }
        const application = await Application_1.Application.findById(applicationId).populate('opportunityId', 'title');
        if (!application) {
            (0, response_1.sendError)(res, 'Application not found', 404);
            return;
        }
        // Employer ownership check
        if (application.employerId.toString() !== req.user._id.toString()) {
            (0, response_1.sendError)(res, 'Access denied. You can only schedule interviews for your own postings.', 403);
            return;
        }
        const normalizedMode = mode === 'in_person' || mode === 'Offline'
            ? 'Offline'
            : mode === 'Telephone'
                ? 'Telephone'
                : 'Online';
        application.status = 'Interview Scheduled';
        application.interviewDetails = {
            date,
            time,
            mode: normalizedMode,
            meetingLink: meetingLink || '',
            notes: notes || ''
        };
        application.statusHistory = application.statusHistory || [];
        application.statusHistory.push({
            status: 'Interview Scheduled',
            updatedByRole: 'employer',
            note: `${normalizedMode} interview scheduled for ${date} at ${time}.`,
            timestamp: new Date()
        });
        await application.save();
        // Sync into dedicated Interview collection
        const employer = await (0, employerPortal_controller_1.ensureEmployerRecord)(req.user);
        const parsedDt = new Date(`${date}T${/^\d{2}:\d{2}/.test(time) ? time : '10:00'}`);
        await Interview_1.Interview.create({
            employerId: req.user._id,
            companyId: employer._id,
            applicationId: application._id,
            opportunityId: application.opportunityId?._id || application.opportunityId,
            candidateId: application.seekerId,
            scheduledDate: date,
            scheduledTime: time,
            scheduledAt: Number.isNaN(parsedDt.getTime()) ? new Date() : parsedDt,
            mode: normalizedMode,
            meetingLinkOrLocation: meetingLink || '',
            interviewerName: interviewerName || req.user.name || 'Hiring Manager',
            notes: notes || '',
            status: 'Scheduled'
        }).catch(() => { });
        const oppTitle = application.opportunityId?.title || 'your applied role';
        await RecruitmentNotification_1.RecruitmentNotification.create({
            recipientId: application.seekerId,
            recipientRole: 'seeker',
            type: 'upcoming_interview',
            title: `Interview scheduled for ${oppTitle}`,
            message: `Your ${normalizedMode} interview is scheduled for ${date} at ${time}.`,
            link: '/applications',
            metadata: { applicationId: application._id }
        }).catch(() => { });
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
                verificationStatus: 'under_review'
            };
        }
        // Never auto-verify!
        if (!(0, Employer_1.isEmployerVerified)(user.employerProfile.verificationStatus)) {
            user.employerProfile.verificationStatus = 'under_review';
        }
        user.employerProfile.verificationDocs = {
            docType,
            docNumber,
            notes: notes || '',
            submittedAt: new Date()
        };
        await user.save();
        await Employer_1.Employer.findOneAndUpdate({ userId: user._id }, {
            companyName: user.employerProfile.companyName || user.name,
            verificationStatus: user.employerProfile.verificationStatus,
            verificationDocs: user.employerProfile.verificationDocs,
            $push: {
                verificationAuditTrail: {
                    status: user.employerProfile.verificationStatus,
                    actorId: user._id,
                    actorName: user.name,
                    actorRole: 'employer',
                    notes: `Submitted ${docType} (${docNumber}) for admin review.`,
                    timestamp: new Date()
                }
            }
        }, { upsert: true });
        (0, response_1.sendSuccess)(res, 'Verification details submitted successfully. Platform admin will review.', user.employerProfile);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to submit verification docs', 500);
    }
};
exports.submitVerificationDocs = submitVerificationDocs;
