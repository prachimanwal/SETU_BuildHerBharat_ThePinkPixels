import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import {
  forgotPassword,
  resetPassword,
  requestOtpLogin,
  verifyOtpLogin,
  googleAuthSignIn,
  getSecurityOverview,
  updateAccountPreferences,
  changePassword,
  signOutAllDevices,
  requestEmailVerification,
  confirmEmailVerification
} from '../controllers/security.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

// Password recovery & Email OTP authentication
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/otp/request', requestOtpLogin);
router.post('/otp/verify', verifyOtpLogin);

// Google OAuth (real token verification; never demo fallback)
router.post('/google', googleAuthSignIn);

// Account preferences & Security controls
router.get('/security', authenticate, getSecurityOverview);
router.put('/preferences', authenticate, updateAccountPreferences);
router.post('/change-password', authenticate, changePassword);
router.post('/sign-out-all', authenticate, signOutAllDevices);
router.post('/verify-email/request', authenticate, requestEmailVerification);
router.post('/verify-email/confirm', confirmEmailVerification);

export default router;
