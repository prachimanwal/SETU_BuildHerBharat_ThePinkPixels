import { Router } from 'express';
import { register, login, logout, getMe, updateProfile } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);
router.put('/profile', authenticateUser, updateProfile);

export default router;

