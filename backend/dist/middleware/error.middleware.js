"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const errorHandler = (err, _req, res, _next) => {
    console.error('[Error Middleware] Server error:', err);
    // 1. Zod Validation Error
    if (err instanceof zod_1.ZodError) {
        const firstMessage = err.errors[0]?.message || 'Validation failed';
        const fieldErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
        }));
        (0, response_1.sendError)(res, firstMessage, 400, fieldErrors);
        return;
    }
    // 2. Mongoose Duplicate Key Error (Code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        (0, response_1.sendError)(res, `An account or record with this ${field} already exists.`, 409);
        return;
    }
    // 3. Mongoose Cast Error (Invalid ObjectId)
    if (err.name === 'CastError') {
        (0, response_1.sendError)(res, `Invalid ID format for parameter: ${err.path}`, 400);
        return;
    }
    // 4. JWT Verification Errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        (0, response_1.sendError)(res, 'Session token is invalid or expired. Please sign in again.', 401);
        return;
    }
    // 5. Generic / Unhandled Error
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'An unexpected internal server error occurred. Please try again.';
    (0, response_1.sendError)(res, message, statusCode);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    (0, response_1.sendError)(res, `API endpoint not found: ${req.method} ${req.originalUrl}. Please verify the route path.`, 404);
};
exports.notFoundHandler = notFoundHandler;
