"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = exports.clearAuthCookie = exports.setAuthCookie = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const response_1 = require("../utils/response");
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role
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
const authenticate = async (req, res, next) => {
    try {
        let token;
        // 1. Check Bearer token in Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // 2. Fallback to HttpOnly cookie
        if (!token && req.cookies && req.cookies.setu_token) {
            token = req.cookies.setu_token;
        }
        if (!token) {
            (0, response_1.sendError)(res, 'Authentication required. Please log in.', 401);
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            (0, response_1.sendError)(res, 'Account not found or session has expired.', 401);
            return;
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (error) {
        (0, response_1.sendError)(res, 'Invalid or expired session token.', 401);
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = async (req, _res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.cookies && req.cookies.setu_token) {
            token = req.cookies.setu_token;
        }
        if (token) {
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
