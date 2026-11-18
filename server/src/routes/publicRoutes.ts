import { Router } from 'express';
import {
  getPublicOpportunities,
  getOpportunityById,
  getPublicSchemes,
  getBuildHerResources
} from '../controllers/publicController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Uses optionalAuth so if a seeker is logged in, their skills/preferences are used for explainable ranking!
router.get('/opportunities', optionalAuth, getPublicOpportunities);
router.get('/opportunities/:id', optionalAuth, getOpportunityById);
router.get('/schemes', getPublicSchemes);
router.get('/build-her', getBuildHerResources);

export default router;
