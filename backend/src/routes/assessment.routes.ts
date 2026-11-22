import { Router } from 'express';
import {
  getAssessments,
  getRecommendedAssessments,
  getAssessmentHistory,
  getAssessmentById,
  submitAssessment
} from '../controllers/assessment.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getAssessments);
router.get('/recommended', authenticate, getRecommendedAssessments);
router.get('/history', authenticate, getAssessmentHistory);
router.get('/my-attempts', authenticate, getAssessmentHistory);
router.get('/:id', optionalAuthenticate, getAssessmentById);
router.post('/:id/submit', authenticate, submitAssessment);

export default router;
