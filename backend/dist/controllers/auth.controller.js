"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const Employer_1 = require("../models/Employer");
const auth_middleware_1 = require("../middleware/auth.middleware");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const userSerializer_1 = require("../utils/userSerializer");
const securityHelpers_1 = require("../utils/securityHelpers");
const isDatabaseReady = () => mongoose_1.default.connection.readyState === 1;
const isDatabaseError = (error) => {
    const name = String(error?.name || '');
    return (name === 'MongoNetworkError' ||
        name === 'MongooseServerSelectionError' ||
        name === 'MongoServerSelectionError' ||
        name === 'MongoTimeoutError');
};
const register = async (req, res) => {
    try {
        if (!isDatabaseReady()) {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        // Security check: Public registration must never allow administrator access
        if (req.body?.role === 'admin') {
            (0, response_1.sendError)(res, 'Public administrator registration is strictly forbidden.', 403);
            return;
        }
        const parseResult = validators_1.registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Validation failed', 400);
            return;
        }
        const { name, email, password, role } = parseResult.data;
        const normalizedEmail = email.toLowerCase().trim();
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
            emailVerified: false,
            lastLogin: new Date(),
            seekerProfile: assignedRole === 'seeker' ? (0, securityHelpers_1.createEmptySeekerProfile)() : undefined,
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
        (0, securityHelpers_1.recordSecurityActivity)(newUser, 'Account created', req);
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
        const rememberMe = Boolean(req.body?.rememberMe);
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        user.lastLogin = new Date();
        user.profileCompletion = (0, userSerializer_1.calculateProfileCompletion)(user);
        (0, securityHelpers_1.recordSecurityActivity)(user, 'Password sign-in', req);
        await user.save();
        const token = (0, auth_middleware_1.generateToken)(user, rememberMe);
        (0, auth_middleware_1.setAuthCookie)(res, token, rememberMe);
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
