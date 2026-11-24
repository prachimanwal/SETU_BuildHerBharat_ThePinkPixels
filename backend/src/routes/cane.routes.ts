import { Router } from 'express';
import {
  getCaneStatus,
  listConversations,
  createConversation,
  getConversationMessages,
  sendCaneMessage,
  regenerateLastResponse,
  submitMessageFeedback,
  deleteConversation,
  getCaneRoadmaps,
  saveCaneRoadmap,
  toggleRoadmapMilestone,
  deleteCaneRoadmap
} from '../controllers/cane.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole('seeker'));

router.get('/status', getCaneStatus);

// Conversations & Messages
router.get('/conversations', listConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversationMessages);
router.post('/conversations/:id/messages', sendCaneMessage);
router.post('/conversations/:id/regenerate', regenerateLastResponse);
router.delete('/conversations/:id', deleteConversation);
router.patch('/messages/:messageId/feedback', submitMessageFeedback);

// Saved Career Roadmaps
router.get('/roadmaps', getCaneRoadmaps);
router.post('/roadmaps', saveCaneRoadmap);
router.patch('/roadmaps/:id/milestone', toggleRoadmapMilestone);
router.delete('/roadmaps/:id', deleteCaneRoadmap);

export default router;
