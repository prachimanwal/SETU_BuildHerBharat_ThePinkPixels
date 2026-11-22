import { Router } from 'express';
import { getSeekerProgressAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/progress', authenticate, getSeekerProgressAnalytics);
router.get('/seeker/progress', authenticate, getSeekerProgressAnalytics);

export default router;
