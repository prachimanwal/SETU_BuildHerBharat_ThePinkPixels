"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApprovedEmployer = exports.requireRole = void 0;
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
