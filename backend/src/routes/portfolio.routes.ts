import { Router } from 'express';
import {
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio
} from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getPortfolio);
router.post('/', authenticate, createPortfolio);
router.put('/:id', authenticate, updatePortfolio);
router.delete('/:id', authenticate, deletePortfolio);

export default router;
