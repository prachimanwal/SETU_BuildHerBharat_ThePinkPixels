import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getProfileCompletion
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/profile/completion', authenticate, getProfileCompletion);

export default router;
