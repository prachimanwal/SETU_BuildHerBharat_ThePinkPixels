import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, UserRole } from '../models/User';
import { Employer } from '../models/Employer';
import {
  AuthenticatedRequest,
  generateToken,
  setAuthCookie,
  clearAuthCookie
} from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { registerSchema, loginSchema } from '../utils/validators';
import { calculateProfileCompletion, serializeUser } from '../utils/userSerializer';
import { createEmptySeekerProfile, recordSecurityActivity } from '../utils/securityHelpers';

const isDatabaseReady = (): boolean => mongoose.connection.readyState === 1;

const isDatabaseError = (error: any): boolean => {
  const name = String(error?.name || '');
  return (
    name === 'MongoNetworkError' ||
    name === 'MongooseServerSelectionError' ||
    name === 'MongoServerSelectionError' ||
    name === 'MongoTimeoutError'
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDatabaseReady()) {
      sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
      return;
    }

    // Security check: Public registration must never allow administrator access
    if (req.body?.role === 'admin') {
      sendError(res, 'Public administrator registration is strictly forbidden.', 403);
      return;
    }

    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Validation failed', 400);
      return;
    }

    const { name, email, password, role } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      sendError(res, 'An account with this email address already exists.', 409);
      return;
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const assignedRole: UserRole = role === 'employer' ? 'employer' : 'seeker';

    const newUser = new User({
      name,
      fullName: name,
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      emailVerified: false,
      lastLogin: new Date(),
      seekerProfile: assignedRole === 'seeker' ? createEmptySeekerProfile() : undefined,
      employerProfile:
        assignedRole === 'employer'
          ? {
              companyName: name,
              industry: 'General',
              website: '',
              companySize: '1-10',
              description: '',
              verificationStatus: 'pending',
              verificationDocs: {
                docType: 'Registration / GSTIN',
                docNumber: '',
                notes: '',
                submittedAt: new Date()
              }
            }
          : undefined
    });

    newUser.profileCompletion = calculateProfileCompletion(newUser);
    recordSecurityActivity(newUser, 'Account created', req);
    await newUser.save();

    // If employer, synchronize with Employer collection
    if (assignedRole === 'employer') {
      await Employer.create({
        userId: newUser._id,
        companyName: name,
        industry: 'General',
        verificationStatus: 'pending',
        verificationDocs: {
          docType: 'Registration / GSTIN',
          docNumber: '',
          notes: '',
          submittedAt: new Date()
        }
      });
    }

    const token = generateToken(newUser);
    setAuthCookie(res, token);

    sendSuccess(
      res,
      'Account created successfully',
      { user: serializeUser(newUser), token },
      201
    );
  } catch (error: any) {
    if (isDatabaseError(error)) {
      sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
      return;
    }
    sendError(res, error.message || 'Server error during registration', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDatabaseReady()) {
      sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
      return;
    }

    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(
        res,
        parseResult.error.errors[0]?.message || 'Email and password are required',
        400
      );
      return;
    }

    const { email, password } = parseResult.data;
    const rememberMe = Boolean(req.body?.rememberMe);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    user.lastLogin = new Date();
    user.profileCompletion = calculateProfileCompletion(user);
    recordSecurityActivity(user, 'Password sign-in', req);
    await user.save();

    const token = generateToken(user, rememberMe);
    setAuthCookie(res, token, rememberMe);

    sendSuccess(res, 'Logged in successfully', {
      user: serializeUser(user),
      token
    });
  } catch (error: any) {
    if (isDatabaseError(error)) {
      sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
      return;
    }
    sendError(res, error.message || 'Server error during login', 500);
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  sendSuccess(res, 'Logged out successfully');
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  sendSuccess(res, 'Authenticated user profile retrieved', {
    user: serializeUser(req.user)
  });
};
