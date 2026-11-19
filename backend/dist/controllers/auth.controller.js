"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.googleAuth = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const Employer_1 = require("../models/Employer");
const auth_middleware_1 = require("../middleware/auth.middleware");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const register = async (req, res) => {
    try {
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
        const normalizedEmail = email.toLowerCase();
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
            email: normalizedEmail,
            passwordHash,
            role: assignedRole,
            seekerProfile: assignedRole === 'seeker'
                ? {
                    headline: 'SETU Member',
                    phone: '',
                    location: { city: '', state: '', isRural: false },
                    languages: ['Hindi', 'English'],
                    educationLevel: 'No formal degree',
                    qualifications: [],
                    skills: [],
                    experienceLevel: 'No previous experience / Fresher',
                    careerGoals: '',
                    interests: [],
                    preferredWorkMode: 'any',
                    resumeUrl: '',
                    isCareerRestart: false
                }
                : undefined,
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
        const safeUser = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar,
            seekerProfile: newUser.seekerProfile,
            employerProfile: newUser.employerProfile
        };
        (0, response_1.sendSuccess)(res, 'Account created successfully', { user: safeUser, token }, 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Server error during registration', 500);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const parseResult = validators_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Email and password are required', 400);
            return;
        }
        const { email, password } = parseResult.data;
        const normalizedEmail = email.toLowerCase();
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
        const token = (0, auth_middleware_1.generateToken)(user);
        (0, auth_middleware_1.setAuthCookie)(res, token);
        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            seekerProfile: user.seekerProfile,
            employerProfile: user.employerProfile
        };
        (0, response_1.sendSuccess)(res, 'Logged in successfully', { user: safeUser, token });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Server error during login', 500);
    }
};
exports.login = login;
const googleAuth = async (req, res) => {
    try {
        const parseResult = validators_1.googleAuthSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, 'Invalid Google credentials payload', 400);
            return;
        }
        const { credential, email: directEmail, name: directName, avatar: directAvatar, role } = parseResult.data;
        let email = directEmail;
        let name = directName;
        let avatar = directAvatar;
        // Parse Google JWT ID token if passed from Google Identity Services
        if (credential && typeof credential === 'string') {
            try {
                const parts = credential.split('.');
                if (parts.length === 3) {
                    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
                    const payload = JSON.parse(payloadJson);
                    if (payload.email)
                        email = payload.email;
                    if (payload.name)
                        name = payload.name;
                    if (payload.picture)
                        avatar = payload.picture;
                }
            }
            catch (err) {
                console.warn('[Google Auth] Failed to parse JWT payload:', err);
            }
        }
        if (!email) {
            (0, response_1.sendError)(res, 'A valid Google email is required to proceed.', 400);
            return;
        }
        const normalizedEmail = email.toLowerCase();
        let user = await User_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            const assignedRole = role === 'employer' ? 'employer' : 'seeker';
            const randomPassword = Math.random().toString(36).slice(-10) + 'A1!@';
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(randomPassword, salt);
            user = new User_1.User({
                name: name || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                passwordHash,
                role: assignedRole,
                avatar: avatar || '',
                seekerProfile: assignedRole === 'seeker'
                    ? {
                        headline: 'SETU Member',
                        phone: '',
                        location: { city: '', state: '', isRural: false },
                        languages: ['Hindi', 'English'],
                        educationLevel: 'Graduate',
                        qualifications: [],
                        skills: [],
                        experienceLevel: 'Fresher',
                        careerGoals: '',
                        interests: [],
                        preferredWorkMode: 'any',
                        resumeUrl: '',
                        isCareerRestart: false
                    }
                    : undefined,
                employerProfile: assignedRole === 'employer'
                    ? {
                        companyName: name || 'Enterprise Partner',
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
            await user.save();
            if (assignedRole === 'employer') {
                await Employer_1.Employer.create({
                    userId: user._id,
                    companyName: user.name,
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
        }
        else {
            if (avatar && !user.avatar) {
                user.avatar = avatar;
                await user.save();
            }
        }
        const token = (0, auth_middleware_1.generateToken)(user);
        (0, auth_middleware_1.setAuthCookie)(res, token);
        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            seekerProfile: user.seekerProfile,
            employerProfile: user.employerProfile
        };
        (0, response_1.sendSuccess)(res, 'Signed in with Google successfully', { user: safeUser, token });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Server error during Google authentication', 500);
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
    const safeUser = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        seekerProfile: req.user.seekerProfile,
        employerProfile: req.user.employerProfile
    };
    (0, response_1.sendSuccess)(res, 'Authenticated user profile retrieved', { user: safeUser });
};
exports.getMe = getMe;
