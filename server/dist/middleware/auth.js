"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApprovedEmployer = exports.requireRole = exports.optionalAuth = exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id);
        if (!user) {
            res.status(401).json({ error: 'User not found or session expired' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired authentication session' });
    }
};
exports.authenticateUser = authenticateUser;
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
            const user = await User_1.User.findById(decoded.id);
            if (user) {
                req.user = user;
            }
        }
    }
    catch {
        // Ignore error for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: `Forbidden: This action requires one of the following roles: ${roles.join(', ')}`
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireApprovedEmployer = (req, res, next) => {
    if (!req.user || req.user.role !== 'employer') {
        res.status(403).json({ error: 'Access restricted to employers' });
        return;
    }
    const status = req.user.employerProfile?.verificationStatus;
    if (status !== 'approved') {
        res.status(403).json({
            error: `Your organisation is not approved yet (current status: ${status || 'pending'}). Publishing opportunities is disabled until verified by administrator.`
        });
        return;
    }
    next();
};
exports.requireApprovedEmployer = requireApprovedEmployer;
