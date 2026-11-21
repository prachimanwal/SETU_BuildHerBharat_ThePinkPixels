"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = exports.clearAuthCookie = exports.setAuthCookie = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const response_1 = require("../utils/response");
const userSerializer_1 = require("../utils/userSerializer");
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        authProvider: user.authProvider || 'local',
        isDemoAccount: (0, userSerializer_1.isDemoUser)(user)
    }, env_1.ENV.JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
const setAuthCookie = (res, token) => {
    const isProduction = env_1.ENV.NODE_ENV === 'production';
    res.cookie('setu_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
    });
};
exports.setAuthCookie = setAuthCookie;
const clearAuthCookie = (res) => {
    const isProduction = env_1.ENV.NODE_ENV === 'production';
    res.clearCookie('setu_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
    });
};
exports.clearAuthCookie = clearAuthCookie;
const extractRequestToken = (req) => {
    // Prefer HttpOnly cookie first, then Bearer header (supports both same-origin proxy & cross-origin Render)
    if (req.cookies && req.cookies.setu_token) {
        return req.cookies.setu_token;
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearer = authHeader.split(' ')[1]?.trim();
        if (bearer)
            return bearer;
    }
    return undefined;
};
const authenticate = async (req, res, next) => {
    try {
        const token = extractRequestToken(req);
        if (!token) {
            (0, response_1.sendError)(res, 'Authentication required. Please sign in.', 401);
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        }
        catch (jwtErr) {
            (0, exports.clearAuthCookie)(res);
            if (jwtErr?.name === 'TokenExpiredError') {
                (0, response_1.sendError)(res, 'Your authentication session has expired. Please sign in again.', 401);
                return;
            }
            (0, response_1.sendError)(res, 'Invalid authentication session. Please sign in again.', 401);
            return;
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        const user = await User_1.User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            (0, exports.clearAuthCookie)(res);
            (0, response_1.sendError)(res, 'Account not found or session has expired. Please sign in again.', 401);
            return;
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (error) {
        if (error?.name === 'MongoNetworkError' ||
            error?.name === 'MongooseServerSelectionError') {
            (0, response_1.sendError)(res, 'Database connection is currently unavailable. Please try again shortly.', 503);
            return;
        }
        (0, response_1.sendError)(res, 'Invalid or expired authentication session.', 401);
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = async (req, _res, next) => {
    try {
        const token = extractRequestToken(req);
        if (token && mongoose_1.default.connection.readyState === 1) {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
            const user = await User_1.User.findById(decoded.id).select('-passwordHash');
            if (user) {
                req.user = user;
                req.token = token;
            }
        }
    }
    catch {
        // Ignore error for optional authentication
    }
    next();
};
exports.optionalAuthenticate = optionalAuthenticate;
