import { Router } from 'express';
import {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getMatchedOpportunities,
  getSavedOpportunities,
  toggleSaveOpportunity
} from '../controllers/opportunity.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { requireRole, requireApprovedEmployer } from '../middleware/role.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getOpportunities);
router.get('/matched', authenticate, getMatchedOpportunities);
router.get('/recommended', authenticate, getMatchedOpportunities);
router.get('/saved', authenticate, getSavedOpportunities);
router.post('/:id/save', authenticate, toggleSaveOpportunity);
router.get('/:id', optionalAuthenticate, getOpportunityById);
router.post(
  '/',
  authenticate,
  requireRole('employer'),
  requireApprovedEmployer,
  createOpportunity
);
router.put('/:id', authenticate, requireRole('employer', 'admin'), updateOpportunity);
router.delete('/:id', authenticate, requireRole('employer', 'admin'), deleteOpportunity);

export default router;
