import { Router } from 'express';
import {
  getLearningResources,
  getLearningResourceById,
  getRecommendedLearning,
  updateLearningProgress,
  completeLearning
} from '../controllers/learning.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getLearningResources);
router.get('/recommended', optionalAuthenticate, getRecommendedLearning);
router.get('/:id', optionalAuthenticate, getLearningResourceById);
router.put('/:id/progress', authenticate, updateLearningProgress);
router.post('/:id/complete', authenticate, completeLearning);

export default router;
