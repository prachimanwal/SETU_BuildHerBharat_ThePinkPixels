import { Router } from 'express';
import {
  getAssessments,
  getAssessmentById,
  submitAssessment,
  getMyAssessmentAttempts,
  getLearningResources,
  getMyLearningProgress,
  updateLearningProgress,
  getMyPortfolio,
  createPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
  getSavedOpportunities,
  toggleSaveOpportunity,
  applyDirect,
  getMyApplications,
  reportListing,
  submitSupportTicket
} from '../controllers/seekerController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

// Publicly readable or seeker endpoints
router.get('/assessments', authenticateUser, getAssessments);
router.get('/assessments/:id', authenticateUser, getAssessmentById);
router.post('/assessments/submit', authenticateUser, requireRole('seeker'), submitAssessment);
router.get('/assessments/my-attempts', authenticateUser, requireRole('seeker'), getMyAssessmentAttempts);

router.get('/learning', authenticateUser, getLearningResources);
router.get('/learning/progress', authenticateUser, requireRole('seeker'), getMyLearningProgress);
router.post('/learning/progress', authenticateUser, requireRole('seeker'), updateLearningProgress);

router.get('/portfolio', authenticateUser, requireRole('seeker'), getMyPortfolio);
router.post('/portfolio', authenticateUser, requireRole('seeker'), createPortfolioProject);
router.put('/portfolio/:id', authenticateUser, requireRole('seeker'), updatePortfolioProject);
router.delete('/portfolio/:id', authenticateUser, requireRole('seeker'), deletePortfolioProject);

router.get('/saved-opportunities', authenticateUser, requireRole('seeker'), getSavedOpportunities);
router.post('/saved-opportunities/toggle', authenticateUser, requireRole('seeker'), toggleSaveOpportunity);

router.post('/applications/apply', authenticateUser, requireRole('seeker'), applyDirect);
router.get('/applications', authenticateUser, requireRole('seeker'), getMyApplications);

router.post('/report', authenticateUser, reportListing);
router.post('/support-ticket', submitSupportTicket); // Supports both authenticated & confidential guest submissions

export default router;
