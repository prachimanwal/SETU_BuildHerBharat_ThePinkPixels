"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.googleAuth = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const Employer_1 = require("../models/Employer");
const auth_middleware_1 = require("../middleware/auth.middleware");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const userSerializer_1 = require("../utils/userSerializer");
const googleAuth_service_1 = require("../services/googleAuth.service");
const isDatabaseReady = () => mongoose_1.default.connection.readyState === 1;
const isDatabaseError = (error) => {
    const name = String(error?.name || '');
    return (name === 'MongoNetworkError' ||
        name === 'MongooseServerSelectionError' ||
        name === 'MongoServerSelectionError' ||
        name === 'MongoTimeoutError');
};
const createEmptySeekerProfile = () => ({
    headline: '',
    phone: '',
    location: { city: '', state: '', isRural: false },
    languages: [],
    educationLevel: '',
    qualifications: [],
    skills: [],
    experienceLevel: '',
    careerGoals: '',
    interests: [],
    preferredWorkMode: 'any',
    resumeUrl: '',
    isCareerRestart: false
});
const register = async (req, res) => {
    try {
        if (!isDatabaseReady()) {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        const parseResult = validators_1.registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Validation failed', 400);
            return;
        }
        const { name, email, password, role } = parseResult.data;
        // Security check: Public registration must never allow administrator access
        if (role === 'admin') {
            (0, response_1.sendError)(res, 'Public administrator registration is strictly forbidden.', 403);
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        if ((0, userSerializer_1.isDemoEmail)(normalizedEmail)) {
            (0, response_1.sendError)(res, 'This email domain is reserved for platform demonstration accounts. Please use your real email address.', 400);
            return;
        }
        // Check if email already exists
        const existingUser = await User_1.User.findOne({ email: normalizedEmail });
        if (existingUser) {
            (0, response_1.sendError)(res, 'An account with this email address already exists.', 409);
            return;
        }
        // Hash password with bcrypt
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const assignedRole = role === 'employer' ? 'employer' : 'seeker';
        const newUser = new User_1.User({
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
            employerProfile: assignedRole === 'employer'
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
        newUser.profileCompletion = (0, userSerializer_1.calculateProfileCompletion)(newUser);
        await newUser.save();
        // If employer, synchronize with Employer collection
        if (assignedRole === 'employer') {
            await Employer_1.Employer.create({
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
        const token = (0, auth_middleware_1.generateToken)(newUser);
        (0, auth_middleware_1.setAuthCookie)(res, token);
        (0, response_1.sendSuccess)(res, 'Account created successfully', { user: (0, userSerializer_1.serializeUser)(newUser), token }, 201);
    }
    catch (error) {
        if (isDatabaseError(error)) {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        (0, response_1.sendError)(res, error.message || 'Server error during registration', 500);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        if (!isDatabaseReady()) {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        const parseResult = validators_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Email and password are required', 400);
            return;
        }
        const { email, password } = parseResult.data;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        if (!user.passwordHash && user.authProvider === 'google') {
            (0, response_1.sendError)(res, 'This account uses Google Sign-In. Please click "Continue with Google" to access your account.', 401);
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        user.lastLogin = new Date();
        if ((0, userSerializer_1.isDemoEmail)(user.email) && !user.isDemoAccount) {
            user.isDemoAccount = true;
            user.authProvider = 'demo';
        }
        user.profileCompletion = (0, userSerializer_1.calculateProfileCompletion)(user);
        await user.save();
        const token = (0, auth_middleware_1.generateToken)(user);
        (0, auth_middleware_1.setAuthCookie)(res, token);
        (0, response_1.sendSuccess)(res, 'Logged in successfully', {
            user: (0, userSerializer_1.serializeUser)(user),
            token
        });
    }
    catch (error) {
        if (isDatabaseError(error)) {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        (0, response_1.sendError)(res, error.message || 'Server error during login', 500);
    }
};
exports.login = login;
const googleAuth = async (req, res) => {
    try {
        // 1. Validate request payload — only accept Google's signed ID token credential
        const parseResult = validators_1.googleAuthSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'A valid Google credential is required.', 400);
            return;
        }
        // 2. Ensure MongoDB is connected before authenticating
        if (!isDatabaseReady()) {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        const { credential } = parseResult.data;
        // 3. Cryptographically verify Google ID token via official google-auth-library
        const verifyToken = (0, googleAuth_service_1.getActiveGoogleVerifier)();
        const googleProfile = await verifyToken(credential);
        // 4. Never allow Google authentication to touch or sign into reserved demo accounts
        if ((0, userSerializer_1.isDemoEmail)(googleProfile.email)) {
            (0, response_1.sendError)(res, 'Google Sign-In cannot be used with demonstration accounts. Please sign in with your real Google account.', 403);
            return;
        }
        const now = new Date();
        let isNewUser = false;
        // 5. Primary lookup: stable Google subject identifier (sub)
        let user = await User_1.User.findOne({ googleId: googleProfile.googleId });
        if (user) {
            if ((0, userSerializer_1.isDemoUser)(user)) {
                (0, response_1.sendError)(res, 'Google Sign-In cannot be linked to a demonstration account.', 403);
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
            user.profileCompletion = (0, userSerializer_1.calculateProfileCompletion)(user);
            await user.save();
        }
        else {
            // 6. Secondary lookup: existing email account (only after verified email ownership from Google)
            user = await User_1.User.findOne({ email: googleProfile.email });
            if (user) {
                if ((0, userSerializer_1.isDemoUser)(user)) {
                    (0, response_1.sendError)(res, 'Google Sign-In cannot be linked to a demonstration account.', 403);
                    return;
                }
                if (user.googleId && user.googleId !== googleProfile.googleId) {
                    (0, response_1.sendError)(res, 'This email address is already linked to a different Google account.', 409);
                    return;
                }
                // Security rule: never auto-link privileged admin accounts via external OAuth email matching
                if (user.role === 'admin') {
                    (0, response_1.sendError)(res, 'Administrator accounts must sign in using their administrator email and password.', 403);
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
                user.profileCompletion = (0, userSerializer_1.calculateProfileCompletion)(user);
                await user.save();
            }
            else {
                // 7. Create a brand new Job Seeker user using ONLY verified Google profile data
                // Security rule: never automatically assign employer or administrator privileges
                isNewUser = true;
                const newUser = new User_1.User({
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
                newUser.profileCompletion = (0, userSerializer_1.calculateProfileCompletion)(newUser);
                try {
                    await newUser.save();
                    user = newUser;
                }
                catch (saveErr) {
                    // Handle race condition if user clicked twice concurrently
                    if (saveErr?.code === 11000) {
                        user = await User_1.User.findOne({
                            $or: [{ googleId: googleProfile.googleId }, { email: googleProfile.email }]
                        });
                        if (!user) {
                            throw saveErr;
                        }
                        isNewUser = false;
                    }
                    else {
                        throw saveErr;
                    }
                }
            }
        }
        const token = (0, auth_middleware_1.generateToken)(user);
        (0, auth_middleware_1.setAuthCookie)(res, token);
        (0, response_1.sendSuccess)(res, isNewUser
            ? 'Account created and signed in with Google successfully'
            : 'Signed in with Google successfully', {
            user: (0, userSerializer_1.serializeUser)(user),
            token,
            isNewUser
        });
    }
    catch (error) {
        if (error instanceof googleAuth_service_1.GoogleAuthError) {
            (0, response_1.sendError)(res, error.message, error.statusCode);
            return;
        }
        if (isDatabaseError(error)) {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        console.error('[Google Auth] Unexpected error:', error);
        (0, response_1.sendError)(res, 'Google authentication failed due to a server error. Please try again.', 500);
    }
};
exports.googleAuth = googleAuth;
const logout = async (_req, res) => {
    (0, auth_middleware_1.clearAuthCookie)(res);
    (0, response_1.sendSuccess)(res, 'Logged out successfully');
};
exports.logout = logout;
const getMe = async (req, res) => {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Not authenticated', 401);
        return;
    }
    (0, response_1.sendSuccess)(res, 'Authenticated user profile retrieved', {
        user: (0, userSerializer_1.serializeUser)(req.user)
    });
};
exports.getMe = getMe;
