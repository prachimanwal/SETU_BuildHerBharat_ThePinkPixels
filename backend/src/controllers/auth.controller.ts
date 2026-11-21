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
import { registerSchema, loginSchema, googleAuthSchema } from '../utils/validators';
import {
  calculateProfileCompletion,
  isDemoEmail,
  isDemoUser,
  serializeUser
} from '../utils/userSerializer';
import {
  getActiveGoogleVerifier,
  GoogleAuthError
} from '../services/googleAuth.service';

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

const createEmptySeekerProfile = () => ({
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

    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Validation failed', 400);
      return;
    }

    const { name, email, password, role } = parseResult.data;

    // Security check: Public registration must never allow administrator access
    if (role === ('admin' as any)) {
      sendError(res, 'Public administrator registration is strictly forbidden.', 403);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDemoEmail(normalizedEmail)) {
      sendError(
        res,
        'This email domain is reserved for platform demonstration accounts. Please use your real email address.',
        400
      );
      return;
    }

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
      authProvider: 'local',
      emailVerified: false,
      isDemoAccount: false,
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
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    if (!user.passwordHash && user.authProvider === 'google') {
      sendError(
        res,
        'This account uses Google Sign-In. Please click "Continue with Google" to access your account.',
        401
      );
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    user.lastLogin = new Date();
    if (isDemoEmail(user.email) && !user.isDemoAccount) {
      user.isDemoAccount = true;
      user.authProvider = 'demo';
    }
    user.profileCompletion = calculateProfileCompletion(user);
    await user.save();

    const token = generateToken(user);
    setAuthCookie(res, token);

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

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate request payload — only accept Google's signed ID token credential
    const parseResult = googleAuthSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(
        res,
        parseResult.error.errors[0]?.message || 'A valid Google credential is required.',
        400
      );
      return;
    }

    // 2. Ensure MongoDB is connected before authenticating
    if (!isDatabaseReady()) {
      sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
      return;
    }

    const { credential } = parseResult.data;

    // 3. Cryptographically verify Google ID token via official google-auth-library
    const verifyToken = getActiveGoogleVerifier();
    const googleProfile = await verifyToken(credential);

    // 4. Never allow Google authentication to touch or sign into reserved demo accounts
    if (isDemoEmail(googleProfile.email)) {
      sendError(
        res,
        'Google Sign-In cannot be used with demonstration accounts. Please sign in with your real Google account.',
        403
      );
      return;
    }

    const now = new Date();
    let isNewUser = false;

    // 5. Primary lookup: stable Google subject identifier (sub)
    let user = await User.findOne({ googleId: googleProfile.googleId });

    if (user) {
      if (isDemoUser(user)) {
        sendError(
          res,
          'Google Sign-In cannot be linked to a demonstration account.',
          403
        );
        return;
      }

      // Preserve existing user name, completed profile, and role!
      user.emailVerified = true;
      user.lastLogin = now;

      // Refresh Google-hosted profile picture without overwriting custom uploaded/edited avatars
      const currentAvatar = (user.profilePicture || user.avatar || '').trim();
      const isGoogleHostedAvatar = currentAvatar.includes('googleusercontent.com');
      if (googleProfile.profilePicture && (!currentAvatar || isGoogleHostedAvatar)) {
        user.avatar = googleProfile.profilePicture;
        user.profilePicture = googleProfile.profilePicture;
      }

      user.profileCompletion = calculateProfileCompletion(user);
      await user.save();
    } else {
      // 6. Secondary lookup: existing email account (only after verified email ownership from Google)
      user = await User.findOne({ email: googleProfile.email });

      if (user) {
        if (isDemoUser(user)) {
          sendError(
            res,
            'Google Sign-In cannot be linked to a demonstration account.',
            403
          );
          return;
        }

        if (user.googleId && user.googleId !== googleProfile.googleId) {
          sendError(
            res,
            'This email address is already linked to a different Google account.',
            409
          );
          return;
        }

        // Security rule: never auto-link privileged admin accounts via external OAuth email matching
        if (user.role === 'admin') {
          sendError(
            res,
            'Administrator accounts must sign in using their administrator email and password.',
            403
          );
          return;
        }

        // Ownership verified via Google's signed email_verified=true claim
        user.googleId = googleProfile.googleId;
        user.emailVerified = true;
        user.lastLogin = now;

        // Preserve existing profile, name, role, and custom avatar
        const currentAvatar = (user.profilePicture || user.avatar || '').trim();
        if (!currentAvatar && googleProfile.profilePicture) {
          user.avatar = googleProfile.profilePicture;
          user.profilePicture = googleProfile.profilePicture;
        }

        user.profileCompletion = calculateProfileCompletion(user);
        await user.save();
      } else {
        // 7. Create a brand new Job Seeker user using ONLY verified Google profile data
        // Security rule: never automatically assign employer or administrator privileges
        isNewUser = true;
        const newUser = new User({
          googleId: googleProfile.googleId,
          name: googleProfile.fullName,
          fullName: googleProfile.fullName,
          email: googleProfile.email,
          avatar: googleProfile.profilePicture,
          profilePicture: googleProfile.profilePicture,
          authProvider: 'google',
          emailVerified: true,
          isDemoAccount: false,
          role: 'seeker',
          lastLogin: now,
          seekerProfile: createEmptySeekerProfile()
        });

        newUser.profileCompletion = calculateProfileCompletion(newUser);

        try {
          await newUser.save();
          user = newUser;
        } catch (saveErr: any) {
          // Handle race condition if user clicked twice concurrently
          if (saveErr?.code === 11000) {
            user = await User.findOne({
              $or: [{ googleId: googleProfile.googleId }, { email: googleProfile.email }]
            });
            if (!user) {
              throw saveErr;
            }
            isNewUser = false;
          } else {
            throw saveErr;
          }
        }
      }
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    sendSuccess(
      res,
      isNewUser
        ? 'Account created and signed in with Google successfully'
        : 'Signed in with Google successfully',
      {
        user: serializeUser(user),
        token,
        isNewUser
      }
    );
  } catch (error: any) {
    if (error instanceof GoogleAuthError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    if (isDatabaseError(error)) {
      sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
      return;
    }
    console.error('[Google Auth] Unexpected error:', error);
    sendError(
      res,
      'Google authentication failed due to a server error. Please try again.',
      500
    );
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
