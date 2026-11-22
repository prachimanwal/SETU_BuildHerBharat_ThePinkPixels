import { Router } from 'express';
import {
  getSchemes,
  getRecommendedSchemes,
  toggleSaveScheme,
  getSchemeById,
  createScheme,
  updateScheme,
  deleteScheme
} from '../controllers/scheme.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getSchemes);
router.get('/recommended', authenticate, getRecommendedSchemes);
router.post('/:id/save', authenticate, toggleSaveScheme);
router.get('/:id', optionalAuthenticate, getSchemeById);
router.post('/', authenticate, requireRole('admin'), createScheme);
router.put('/:id', authenticate, requireRole('admin'), updateScheme);
router.delete('/:id', authenticate, requireRole('admin'), deleteScheme);

export default router;
