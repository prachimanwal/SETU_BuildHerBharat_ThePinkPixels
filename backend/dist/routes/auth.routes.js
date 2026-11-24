"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const security_controller_1 = require("../controllers/security.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/logout', auth_controller_1.logout);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
// Password recovery & Email OTP authentication
router.post('/forgot-password', security_controller_1.forgotPassword);
router.post('/reset-password', security_controller_1.resetPassword);
router.post('/otp/request', security_controller_1.requestOtpLogin);
router.post('/otp/verify', security_controller_1.verifyOtpLogin);
// Google OAuth (real token verification; never demo fallback)
router.post('/google', security_controller_1.googleAuthSignIn);
// Account preferences & Security controls
router.get('/security', auth_middleware_1.authenticate, security_controller_1.getSecurityOverview);
router.put('/preferences', auth_middleware_1.authenticate, security_controller_1.updateAccountPreferences);
router.post('/change-password', auth_middleware_1.authenticate, security_controller_1.changePassword);
router.post('/sign-out-all', auth_middleware_1.authenticate, security_controller_1.signOutAllDevices);
router.post('/verify-email/request', auth_middleware_1.authenticate, security_controller_1.requestEmailVerification);
router.post('/verify-email/confirm', security_controller_1.confirmEmailVerification);
exports.default = router;
