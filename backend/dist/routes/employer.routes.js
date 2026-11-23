"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const employer_controller_1 = require("../controllers/employer.controller");
const employerPortal_controller_1 = require("../controllers/employerPortal.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
// Strict in-memory upload middleware for secure verification documents (PDF, JPG, PNG; max 5MB)
const verificationUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Unsupported file format. Allowed formats: PDF, JPG, PNG.'));
        }
    }
});
// Dashboard & Analytics
router.get('/dashboard', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employer_controller_1.getEmployerDashboard);
router.get('/analytics', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.getEmployerAnalytics);
// Company Profile & Onboarding
router.get('/company', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.getCompanyProfile);
router.put('/company', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.updateCompanyProfile);
router.post('/company/complete-onboarding', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.completeCompanyOnboarding);
// Company Verification & Secure Document Uploads
router.get('/verification', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.getVerificationOverview);
router.put('/verification', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employer_controller_1.submitVerificationDocs);
router.get('/verification/documents', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.getVerificationOverview);
router.post('/verification/documents', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), verificationUpload.single('document'), employerPortal_controller_1.uploadVerificationDocument);
router.put('/verification/documents/:docId', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), verificationUpload.single('document'), employerPortal_controller_1.replaceVerificationDocument);
// Stream file: strictly owning employer OR admin (enforced in handler)
router.get('/verification/documents/:docId/file', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer', 'admin'), employerPortal_controller_1.streamVerificationDocumentFile);
router.post('/verification/request-review', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.requestReverification);
// Hiring Preferences (Multiple saved preferences)
router.get('/hiring-preferences', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.getHiringPreferences);
router.post('/hiring-preferences', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.createHiringPreference);
router.put('/hiring-preferences/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.updateHiringPreference);
router.delete('/hiring-preferences/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.deleteHiringPreference);
// Candidate Search & Matching (Consenting seekers only)
router.get('/candidates', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.searchCandidates);
router.get('/candidates/:candidateId', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.getCandidateProfileForEmployer);
router.post('/candidates/:candidateId/invite', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.inviteCandidateToApply);
router.post('/candidates/:candidateId/shortlist', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.shortlistCandidate);
// Applications & Private Recruiter Notes
router.get('/applicants', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employer_controller_1.getEmployerApplicants);
router.post('/applicants/:id/notes', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.addRecruiterNote);
// Interview Management
router.post('/interview', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employer_controller_1.scheduleInterview);
router.get('/interviews', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.getEmployerInterviews);
router.post('/interviews', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.createEmployerInterview);
router.put('/interviews/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.updateEmployerInterview);
router.delete('/interviews/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.deleteEmployerInterview);
// Notifications
router.get('/notifications', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.getEmployerNotifications);
router.patch('/notifications/read-all', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.markAllNotificationsRead);
router.patch('/notifications/:id/read', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.markNotificationRead);
// Settings
router.put('/settings', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('employer'), employerPortal_controller_1.updateEmployerSettings);
exports.default = router;
