"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seekerController_1 = require("../controllers/seekerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Publicly readable or seeker endpoints
router.get('/assessments', auth_1.authenticateUser, seekerController_1.getAssessments);
router.get('/assessments/:id', auth_1.authenticateUser, seekerController_1.getAssessmentById);
router.post('/assessments/submit', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.submitAssessment);
router.get('/assessments/my-attempts', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.getMyAssessmentAttempts);
router.get('/learning', auth_1.authenticateUser, seekerController_1.getLearningResources);
router.get('/learning/progress', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.getMyLearningProgress);
router.post('/learning/progress', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.updateLearningProgress);
router.get('/portfolio', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.getMyPortfolio);
router.post('/portfolio', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.createPortfolioProject);
router.put('/portfolio/:id', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.updatePortfolioProject);
router.delete('/portfolio/:id', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.deletePortfolioProject);
router.get('/saved-opportunities', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.getSavedOpportunities);
router.post('/saved-opportunities/toggle', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.toggleSaveOpportunity);
router.post('/applications/apply', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.applyDirect);
router.get('/applications', auth_1.authenticateUser, (0, auth_1.requireRole)('seeker'), seekerController_1.getMyApplications);
router.post('/report', auth_1.authenticateUser, seekerController_1.reportListing);
router.post('/support-ticket', seekerController_1.submitSupportTicket); // Supports both authenticated & confidential guest submissions
exports.default = router;
