import { Router } from 'express';
import {
  getLearningResources,
  getRecommendedLearning,
  completeLearning
} from '../controllers/learning.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getLearningResources);
router.get('/recommended', optionalAuthenticate, getRecommendedLearning);
router.post('/:id/complete', authenticate, completeLearning);

export default router;
