import { Router } from 'express';
import {
  getSchemes,
  getSchemeById,
  createScheme,
  updateScheme,
  deleteScheme
} from '../controllers/scheme.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.get('/', getSchemes);
router.get('/:id', getSchemeById);
router.post('/', authenticate, requireRole('admin'), createScheme);
router.put('/:id', authenticate, requireRole('admin'), updateScheme);
router.delete('/:id', authenticate, requireRole('admin'), deleteScheme);

export default router;
