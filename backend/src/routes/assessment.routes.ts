import { Router } from 'express';
import {
  getAssessments,
  getAssessmentById,
  submitAssessment
} from '../controllers/assessment.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getAssessments);
router.get('/:id', optionalAuthenticate, getAssessmentById);
router.post('/:id/submit', authenticate, submitAssessment);

export default router;
