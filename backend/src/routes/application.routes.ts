import { Router } from 'express';
import {
  getApplications,
  createApplication,
  getApplicationById,
  updateApplicationStatus
} from '../controllers/application.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getApplications);
router.post('/', authenticate, createApplication);
router.get('/:id', authenticate, getApplicationById);
router.put('/:id/status', authenticate, updateApplicationStatus);

export default router;
