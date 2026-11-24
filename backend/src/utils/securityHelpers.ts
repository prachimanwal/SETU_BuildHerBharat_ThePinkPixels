import crypto from 'node:crypto';
import { Request } from 'express';
import { IUser } from '../models/User';
import { ENV } from '../config/env';

export const createEmptySeekerProfile = () => ({
  headline: '',
  phone: '',
  location: { city: '', state: '', isRural: false },
  languages: [] as string[],
  educationLevel: '',
  qualifications: [] as Array<{ title: string; institute?: string; year?: string }>,
  skills: [] as string[],
  experienceLevel: '',
  careerGoals: '',
  interests: [] as string[],
  preferredWorkMode: 'any' as const,
  resumeUrl: '',
  isCareerRestart: false
});

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must include at least one number.' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one special character (e.g. !@#$%).'
    };
  }
  return { valid: true };
};

export const sha256Hex = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

export const hmacOtpHex = (email: string, otp: string): string =>
  crypto
    .createHmac('sha256', ENV.OTP_PEPPER)
    .update(`${email.toLowerCase().trim()}:${otp.trim()}`)
    .digest('hex');

export const timingSafeHexEqual = (a: string, b: string): boolean => {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length === 0 || bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return (req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 64);
};

export const recordSecurityActivity = (user: IUser, action: string, req: Request): void => {
  const ua = String(req.headers['user-agent'] || '').slice(0, 140);
  const ipAddress = getClientIp(req);
  const existing = Array.isArray(user.securityActivity) ? [...user.securityActivity] : [];
  existing.unshift({
    action,
    timestamp: new Date(),
    ipAddress,
    userAgent: ua
  });
  user.securityActivity = existing.slice(0, 20);
};

// Sliding-window in-memory rate limiter for auth sensitivity (IP and email keyed)
const rateBuckets = new Map<string, number[]>();

export const checkSlidingRateLimit = (
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } => {
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (rateBuckets.get(key) || []).filter((ts) => ts > cutoff);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateBuckets.set(key, timestamps);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  rateBuckets.set(key, timestamps);
  return { allowed: true, retryAfterSeconds: 0 };
};

export const clearAuthRateLimitsForTests = (): void => {
  rateBuckets.clear();
};

export const isDbReady = (readyState: number): boolean => readyState === 1;

export const isDbConnectionError = (error: any): boolean => {
  const name = String(error?.name || '');
  return (
    name === 'MongoNetworkError' ||
    name === 'MongooseServerSelectionError' ||
    name === 'MongoServerSelectionError' ||
    name === 'MongoTimeoutError'
  );
};
