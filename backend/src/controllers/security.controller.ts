import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ENV } from '../config/env';
import { User, ThemePreference } from '../models/User';
import { AuthToken } from '../models/AuthToken';
import { LoginOtp } from '../models/LoginOtp';
import {
  AuthenticatedRequest,
  clearAuthCookie,
  generateToken,
  setAuthCookie
} from '../middleware/auth.middleware';
import { sendError, sendSuccess } from '../utils/response';
import { calculateProfileCompletion, serializeUser } from '../utils/userSerializer';
import {
  EmailNotConfiguredError,
  isEmailServiceConfigured,
  sendEmailVerificationEmail,
  sendLoginOtpEmail,
  sendPasswordChangedEmail,
  sendPasswordResetEmail
} from '../services/email.service';
import {
  checkSlidingRateLimit,
  createEmptySeekerProfile,
  getClientIp,
  hmacOtpHex,
  isDbConnectionError,
  isDbReady,
  recordSecurityActivity,
  sha256Hex,
  timingSafeHexEqual,
  validatePasswordStrength
} from '../utils/securityHelpers';

const EMAIL_SCHEMA = z.string().trim().email('Please enter a valid email address.');

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const VERIFY_EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_MAX_ATTEMPTS = 5;

const GENERIC_FORGOT_MSG =
  'If an account exists with this email address, you will receive password reset instructions shortly.';
const GENERIC_OTP_SENT_MSG =
  'If an account is registered with this email address, a 6-digit verification code has been sent.';

// ==================== 1. FORGOT PASSWORD ====================

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbReady(mongoose.connection.readyState)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }

    const emailParse = EMAIL_SCHEMA.safeParse(req.body?.email);
    if (!emailParse.success) {
      sendError(res, emailParse.error.errors[0]?.message || 'Please enter a valid email address.', 400);
      return;
    }

    const email = emailParse.data.toLowerCase().trim();
    const ip = getClientIp(req);

    // Rate limit per IP and per email (5 requests per 15 minutes)
    const ipLimit = checkSlidingRateLimit(`fp:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      sendError(
        res,
        `Too many password reset requests. Please try again in ${ipLimit.retryAfterSeconds} seconds.`,
        429
      );
      return;
    }

    const emailLimit = checkSlidingRateLimit(`fp:email:${email}`, 5, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      sendError(
        res,
        `Please wait ${emailLimit.retryAfterSeconds} seconds before requesting another reset link.`,
        429
      );
      return;
    }

    if (!isEmailServiceConfigured()) {
      sendError(
        res,
        'Password reset email delivery is not configured yet on this server. Please contact the administrator or use another sign-in method.',
        503
      );
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Anti-enumeration: identical 200 message without creating tokens or sending mail
      sendSuccess(res, GENERIC_FORGOT_MSG, { sent: true });
      return;
    }

    // Invalidate any prior unused reset tokens for this user
    await AuthToken.updateMany(
      { userId: user._id, type: 'password_reset', usedAt: null },
      { $set: { usedAt: new Date() } }
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    const authToken = new AuthToken({
      userId: user._id,
      email,
      type: 'password_reset',
      tokenHash,
      usedAt: null,
      expiresAt
    });
    await authToken.save();

    const resetUrl = `${ENV.CLIENT_URL.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail({
        to: email,
        name: user.name,
        resetUrl,
        expiresMinutes: 15
      });
    } catch (mailErr: any) {
      // Never leave an orphaned active token if email delivery failed
      await AuthToken.deleteOne({ _id: authToken._id }).catch(() => undefined);
      if (mailErr instanceof EmailNotConfiguredError) {
        sendError(
          res,
          'Password reset email delivery is not configured on this server yet.',
          503
        );
        return;
      }
      console.error('[ForgotPassword] Email delivery failed:', mailErr?.message || '');
      sendError(
        res,
        'We could not deliver the password reset email right now. Please try again in a few moments.',
        502
      );
      return;
    }

    recordSecurityActivity(user, 'Password reset email requested', req);
    await user.save();

    sendSuccess(res, GENERIC_FORGOT_MSG, { sent: true, expiresInMinutes: 15 });
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }
    sendError(res, 'Unable to process password reset request right now.', 500);
  }
};

// ==================== 2. RESET PASSWORD ====================

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbReady(mongoose.connection.readyState)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }

    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!token) {
      sendError(res, 'Password reset link is missing or invalid.', 400);
      return;
    }

    if (password !== confirmPassword) {
      sendError(res, 'New password and confirmation password do not match.', 400);
      return;
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      sendError(res, strength.message || 'Password does not meet security requirements.', 400);
      return;
    }

    const tokenHash = sha256Hex(token);
    const tokenDoc = await AuthToken.findOne({
      tokenHash,
      type: 'password_reset'
    });

    if (!tokenDoc || tokenDoc.usedAt || new Date(tokenDoc.expiresAt).getTime() <= Date.now()) {
      sendError(
        res,
        'This password reset link is invalid, expired, or has already been used. Please request a new one.',
        400
      );
      return;
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      sendError(res, 'Associated account no longer exists.', 404);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    recordSecurityActivity(user, 'Password reset completed', req);
    await user.save();

    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // Also invalidate any remaining active login OTPs for this user
    await LoginOtp.updateMany(
      { userId: user._id, usedAt: null },
      { $set: { usedAt: new Date() } }
    ).catch(() => undefined);

    // Best-effort confirmation email
    if (isEmailServiceConfigured()) {
      void sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(() => undefined);
    }

    clearAuthCookie(res);
    sendSuccess(res, 'Your password has been reset successfully. Please sign in with your new password.');
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }
    sendError(res, 'Unable to reset password right now.', 500);
  }
};

// ==================== 3. EMAIL OTP LOGIN ====================

export const requestOtpLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbReady(mongoose.connection.readyState)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }

    const emailParse = EMAIL_SCHEMA.safeParse(req.body?.email);
    if (!emailParse.success) {
      sendError(res, emailParse.error.errors[0]?.message || 'Please enter a valid email address.', 400);
      return;
    }

    const email = emailParse.data.toLowerCase().trim();
    const ip = getClientIp(req);

    const ipLimit = checkSlidingRateLimit(`otp:ip:${ip}`, 15, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      sendError(
        res,
        `Too many verification code requests. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
        429
      );
      return;
    }

    const emailLimit = checkSlidingRateLimit(`otp:email:${email}`, 6, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      sendError(
        res,
        `Too many verification codes requested for this email. Please wait ${emailLimit.retryAfterSeconds} seconds.`,
        429
      );
      return;
    }

    if (!isEmailServiceConfigured()) {
      sendError(
        res,
        'Verification email delivery is not configured on this server yet. Please sign in with your password or contact the administrator.',
        503
      );
      return;
    }

    // Check resend cooldown against most recent active OTP for this email
    const existingOtps = await LoginOtp.find({ email });
    const latestOtp = Array.isArray(existingOtps)
      ? existingOtps.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;

    if (latestOtp && !latestOtp.usedAt) {
      const elapsedMs = Date.now() - new Date(latestOtp.createdAt).getTime();
      if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000)
        );
        sendError(
          res,
          `Please wait ${retryAfterSeconds} seconds before requesting another verification code.`,
          429
        );
        return;
      }
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Strict security rule: NEVER auto-create an account during Email OTP sign-in, and do not leak membership
      sendSuccess(res, GENERIC_OTP_SENT_MSG, {
        expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
        cooldownSeconds: Math.floor(OTP_RESEND_COOLDOWN_MS / 1000)
      });
      return;
    }

    // Invalidate prior unused OTPs on resend
    await LoginOtp.updateMany(
      { userId: user._id, usedAt: null },
      { $set: { usedAt: new Date() } }
    );

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = hmacOtpHex(email, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const otpDoc = new LoginOtp({
      userId: user._id,
      email,
      otpHash,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      usedAt: null,
      expiresAt
    });
    await otpDoc.save();

    try {
      await sendLoginOtpEmail({
        to: email,
        name: user.name,
        otp,
        expiresMinutes: 5
      });
    } catch (mailErr: any) {
      await LoginOtp.deleteOne({ _id: otpDoc._id }).catch(() => undefined);
      if (mailErr instanceof EmailNotConfiguredError) {
        sendError(res, 'Verification email delivery is not configured yet.', 503);
        return;
      }
      console.error('[OtpRequest] Email delivery failed:', mailErr?.message || '');
      sendError(
        res,
        'We could not deliver your verification code right now. Please try again shortly.',
        502
      );
      return;
    }

    // Never expose OTP in response or logs
    sendSuccess(res, GENERIC_OTP_SENT_MSG, {
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      cooldownSeconds: Math.floor(OTP_RESEND_COOLDOWN_MS / 1000)
    });
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }
    sendError(res, 'Unable to send verification code right now.', 500);
  }
};

export const verifyOtpLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbReady(mongoose.connection.readyState)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }

    const emailParse = EMAIL_SCHEMA.safeParse(req.body?.email);
    if (!emailParse.success) {
      sendError(res, 'Please enter a valid registered email address.', 400);
      return;
    }
    const email = emailParse.data.toLowerCase().trim();
    const otp = String(req.body?.otp || '').replace(/\s+/g, '');
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!/^\d{6}$/.test(otp)) {
      sendError(res, 'Please enter a valid 6-digit verification code.', 400);
      return;
    }

    const activeOtps = await LoginOtp.find({ email, usedAt: null });
    const latestOtp = Array.isArray(activeOtps)
      ? activeOtps.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;

    if (!latestOtp || latestOtp.usedAt) {
      sendError(
        res,
        'No active verification code found. Please request a new code.',
        400
      );
      return;
    }

    if (new Date(latestOtp.expiresAt).getTime() <= Date.now()) {
      latestOtp.usedAt = new Date();
      await latestOtp.save();
      sendError(
        res,
        'Your verification code has expired. Please request a new code.',
        400
      );
      return;
    }

    if ((latestOtp.attempts || 0) >= (latestOtp.maxAttempts || OTP_MAX_ATTEMPTS)) {
      latestOtp.usedAt = new Date();
      await latestOtp.save();
      sendError(
        res,
        'Maximum verification attempts exceeded. Please request a new verification code.',
        429
      );
      return;
    }

    const candidateHash = hmacOtpHex(email, otp);
    const isMatch = timingSafeHexEqual(candidateHash, latestOtp.otpHash);

    if (!isMatch) {
      latestOtp.attempts = (latestOtp.attempts || 0) + 1;
      const maxAtt = latestOtp.maxAttempts || OTP_MAX_ATTEMPTS;
      const lockedOut = latestOtp.attempts >= maxAtt;
      if (lockedOut) {
        latestOtp.usedAt = new Date();
      }
      await latestOtp.save();

      if (lockedOut) {
        sendError(
          res,
          'Too many incorrect verification attempts. Please request a new verification code.',
          429
        );
      } else {
        const remaining = maxAtt - latestOtp.attempts;
        sendError(
          res,
          `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          400
        );
      }
      return;
    }

    const user = await User.findById(latestOtp.userId);
    if (!user) {
      sendError(res, 'No SETU account found for this email address.', 404);
      return;
    }

    // Consume OTP (single-use)
    latestOtp.usedAt = new Date();
    await latestOtp.save();

    user.emailVerified = true;
    user.lastLogin = new Date();
    user.profileCompletion = calculateProfileCompletion(user);
    recordSecurityActivity(user, 'Email OTP sign-in', req);
    await user.save();

    const token = generateToken(user, rememberMe);
    setAuthCookie(res, token, rememberMe);

    sendSuccess(res, 'Signed in successfully with Email OTP', {
      user: serializeUser(user),
      token
    });
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }
    sendError(res, 'Unable to verify code right now. Please try again.', 500);
  }
};

// ==================== 4. REAL VERIFIED GOOGLE OAUTH ====================

export const googleAuthSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbReady(mongoose.connection.readyState)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }

    if (!ENV.GOOGLE_CLIENT_ID.trim()) {
      sendError(
        res,
        'Google Sign-In is not configured on this server. Please sign in with email/password or Email OTP.',
        503
      );
      return;
    }

    const credential = String(req.body?.credential || '').trim();
    const rememberMe = Boolean(req.body?.rememberMe);
    if (!credential) {
      sendError(res, 'Missing Google authentication credential.', 400);
      return;
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!verifyRes.ok) {
      sendError(res, 'Google sign-in token verification failed. Please try again.', 401);
      return;
    }

    const payload = (await verifyRes.json()) as {
      aud?: string;
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
    };

    const isEmailVerified =
      payload.email_verified === true || payload.email_verified === 'true';

    if (
      !payload.sub ||
      !payload.email ||
      !isEmailVerified ||
      payload.aud !== ENV.GOOGLE_CLIENT_ID.trim()
    ) {
      sendError(res, 'Unverified or invalid Google account token.', 401);
      return;
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        if (user.googleId && user.googleId !== payload.sub) {
          sendError(
            res,
            'This email is already associated with a different Google account.',
            409
          );
          return;
        }
        user.googleId = payload.sub;
        user.emailVerified = true;
        if (!user.profilePicture && payload.picture) {
          user.profilePicture = payload.picture;
          user.avatar = payload.picture;
        }
      } else {
        // Create new verified seeker account with unguessable password hash
        const randomSecret = crypto.randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(randomSecret, 10);
        const displayName = (payload.name || email.split('@')[0]).trim();
        user = new User({
          name: displayName,
          fullName: displayName,
          email,
          passwordHash,
          role: 'seeker',
          googleId: payload.sub,
          emailVerified: true,
          profilePicture: payload.picture || '',
          avatar: payload.picture || '',
          seekerProfile: createEmptySeekerProfile()
        });
      }
    }

    user.lastLogin = new Date();
    user.profileCompletion = calculateProfileCompletion(user);
    recordSecurityActivity(user, 'Google Sign-In', req);
    await user.save();

    const token = generateToken(user, rememberMe);
    setAuthCookie(res, token, rememberMe);

    sendSuccess(res, 'Signed in with Google successfully', {
      user: serializeUser(user),
      token
    });
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      sendError(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
      return;
    }
    sendError(res, 'Google sign-in failed. Please try again.', 500);
  }
};

// ==================== 5. ACCOUNT & SECURITY SETTINGS ====================

export const getSecurityOverview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    sendSuccess(res, 'Security overview retrieved', {
      account: serializeUser(req.user),
      emailVerified: Boolean(req.user.emailVerified),
      googleLinked: Boolean(req.user.googleId),
      themePreference: req.user.themePreference || 'system',
      notificationPreferences: {
        jobApplicationUpdates: req.user.notificationPreferences?.jobApplicationUpdates ?? true,
        interviewNotifications: req.user.notificationPreferences?.interviewNotifications ?? true,
        learningReminders: req.user.notificationPreferences?.learningReminders ?? true,
        accountSecurityAlerts: req.user.notificationPreferences?.accountSecurityAlerts ?? true
      },
      activeSession: {
        lastLogin: req.user.lastLogin || req.user.updatedAt,
        role: req.user.role
      },
      securityActivity: Array.isArray(req.user.securityActivity)
        ? req.user.securityActivity.slice(0, 15)
        : []
    });
  } catch {
    sendError(res, 'Failed to load account security details.', 500);
  }
};

export const updateAccountPreferences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      sendError(res, 'Account not found', 404);
      return;
    }

    const { themePreference, notificationPreferences } = req.body || {};

    if (themePreference !== undefined) {
      if (!['light', 'dark', 'system'].includes(themePreference)) {
        sendError(res, "Theme preference must be 'light', 'dark', or 'system'.", 400);
        return;
      }
      user.themePreference = themePreference as ThemePreference;
    }

    if (notificationPreferences && typeof notificationPreferences === 'object') {
      const curr = user.notificationPreferences || {
        jobApplicationUpdates: true,
        interviewNotifications: true,
        learningReminders: true,
        accountSecurityAlerts: true
      };
      user.notificationPreferences = {
        jobApplicationUpdates:
          typeof notificationPreferences.jobApplicationUpdates === 'boolean'
            ? notificationPreferences.jobApplicationUpdates
            : curr.jobApplicationUpdates,
        interviewNotifications:
          typeof notificationPreferences.interviewNotifications === 'boolean'
            ? notificationPreferences.interviewNotifications
            : curr.interviewNotifications,
        learningReminders:
          typeof notificationPreferences.learningReminders === 'boolean'
            ? notificationPreferences.learningReminders
            : curr.learningReminders,
        accountSecurityAlerts:
          typeof notificationPreferences.accountSecurityAlerts === 'boolean'
            ? notificationPreferences.accountSecurityAlerts
            : curr.accountSecurityAlerts
      };
    }

    await user.save();

    sendSuccess(res, 'Account preferences updated', {
      user: serializeUser(user)
    });
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      sendError(res, 'Database connection is currently unavailable.', 503);
      return;
    }
    sendError(res, 'Failed to update preferences.', 500);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!currentPassword) {
      sendError(res, 'Please enter your current password to verify your identity.', 400);
      return;
    }

    if (newPassword !== confirmPassword) {
      sendError(res, 'New password and confirmation password do not match.', 400);
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      sendError(res, strength.message || 'Password does not meet security requirements.', 400);
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      sendError(res, 'Account not found.', 404);
      return;
    }

    const matchesCurrent = await user.comparePassword(currentPassword);
    if (!matchesCurrent) {
      sendError(res, 'Current password is incorrect.', 401);
      return;
    }

    const sameAsOld = await user.comparePassword(newPassword);
    if (sameAsOld) {
      sendError(res, 'Please choose a new password different from your current password.', 400);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    recordSecurityActivity(user, 'Password changed', req);
    await user.save();

    // Rotate active session token for the user making this request so other sessions are invalidated
    const nextToken = generateToken(user);
    setAuthCookie(res, nextToken);

    if (isEmailServiceConfigured()) {
      void sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(() => undefined);
    }

    sendSuccess(res, 'Password changed successfully. Other active sessions have been signed out.', {
      user: serializeUser(user),
      token: nextToken
    });
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      sendError(res, 'Database connection is currently unavailable.', 503);
      return;
    }
    sendError(res, 'Unable to update password right now.', 500);
  }
};

export const signOutAllDevices = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      sendError(res, 'Account not found.', 404);
      return;
    }

    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    recordSecurityActivity(user, 'Signed out from all devices', req);
    await user.save();

    clearAuthCookie(res);
    sendSuccess(res, 'All active sessions have been signed out. Please sign in again.');
  } catch {
    sendError(res, 'Unable to sign out all sessions right now.', 500);
  }
};

export const requestEmailVerification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      sendError(res, 'Account not found.', 404);
      return;
    }

    if (user.emailVerified) {
      sendSuccess(res, 'Your email address is already verified.', { alreadyVerified: true });
      return;
    }

    if (!isEmailServiceConfigured()) {
      sendError(
        res,
        'Verification email delivery is not configured yet on this server.',
        503
      );
      return;
    }

    const emailLimit = checkSlidingRateLimit(`ve:user:${user._id.toString()}`, 3, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      sendError(
        res,
        `Please wait ${emailLimit.retryAfterSeconds} seconds before requesting another verification email.`,
        429
      );
      return;
    }

    await AuthToken.updateMany(
      { userId: user._id, type: 'email_verification', usedAt: null },
      { $set: { usedAt: new Date() } }
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256Hex(rawToken);
    const tokenDoc = new AuthToken({
      userId: user._id,
      email: user.email,
      type: 'email_verification',
      tokenHash,
      usedAt: null,
      expiresAt: new Date(Date.now() + VERIFY_EMAIL_TOKEN_TTL_MS)
    });
    await tokenDoc.save();

    const verifyUrl = `${ENV.CLIENT_URL.replace(/\/$/, '')}/verify-email?token=${rawToken}`;
    try {
      await sendEmailVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl
      });
    } catch (err: any) {
      await AuthToken.deleteOne({ _id: tokenDoc._id }).catch(() => undefined);
      sendError(
        res,
        err instanceof EmailNotConfiguredError
          ? 'Verification email delivery is not configured yet.'
          : 'Could not send verification email right now. Please try again shortly.',
        err instanceof EmailNotConfiguredError ? 503 : 502
      );
      return;
    }

    sendSuccess(res, 'Verification link sent to your registered email address.');
  } catch {
    sendError(res, 'Unable to send verification email right now.', 500);
  }
};

export const confirmEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbReady(mongoose.connection.readyState)) {
      sendError(res, 'Database connection is currently unavailable.', 503);
      return;
    }

    const token = String(req.body?.token || req.query?.token || '').trim();
    if (!token) {
      sendError(res, 'Verification link is missing or invalid.', 400);
      return;
    }

    const tokenDoc = await AuthToken.findOne({
      tokenHash: sha256Hex(token),
      type: 'email_verification'
    });

    if (!tokenDoc || tokenDoc.usedAt || new Date(tokenDoc.expiresAt).getTime() <= Date.now()) {
      sendError(res, 'This email verification link is invalid or has expired.', 400);
      return;
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      sendError(res, 'Account not found.', 404);
      return;
    }

    user.emailVerified = true;
    recordSecurityActivity(user, 'Email address verified', req);
    await user.save();

    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    sendSuccess(res, 'Your email address has been verified.', {
      user: serializeUser(user)
    });
  } catch {
    sendError(res, 'Unable to verify email address right now.', 500);
  }
};
