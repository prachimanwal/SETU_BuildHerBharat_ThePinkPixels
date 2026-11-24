"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBuildHerAccess = exports.requireApprovedEmployer = exports.requireRole = exports.isEligibleForBuildHer = void 0;
const userSerializer_1 = require("../utils/userSerializer");
Object.defineProperty(exports, "isEligibleForBuildHer", { enumerable: true, get: function () { return userSerializer_1.isEligibleForBuildHer; } });
const response_1 = require("../utils/response");
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, response_1.sendError)(res, `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`, 403);
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireApprovedEmployer = (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Authentication required', 401);
        return;
    }
    if (req.user.role !== 'employer') {
        (0, response_1.sendError)(res, 'Access denied. Only employers can perform this action.', 403);
        return;
    }
    const status = req.user.employerProfile?.verificationStatus;
    if (status !== 'approved') {
        (0, response_1.sendError)(res, `Your employer account is currently ${status || 'pending'} verification. Publishing opportunities requires approval from SETU platform administration.`, 403);
        return;
    }
    next();
};
exports.requireApprovedEmployer = requireApprovedEmployer;
/**
 * Enforces strict Build Her eligibility from the authenticated MongoDB user profile.
 * Accessible exclusively to Job Seekers whose stored gender is Female.
 */
const requireBuildHerAccess = (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Authentication required', 401);
        return;
    }
    if (!(0, userSerializer_1.isEligibleForBuildHer)(req.user)) {
        (0, response_1.sendError)(res, 'Access denied. Build Her is exclusively available to eligible female job seekers.', 403);
        return;
    }
    next();
};
exports.requireBuildHerAccess = requireBuildHerAccess;
