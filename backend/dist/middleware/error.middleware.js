"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const response_1 = require("../utils/response");
const errorHandler = (err, _req, res, _next) => {
    console.error('[Error Middleware] Server error:', err?.name || 'Error', err?.message || '');
    // 1. Express JSON body parser SyntaxError (never leak raw parser token traces to client)
    if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
        (0, response_1.sendError)(res, 'Invalid request payload format. Please check your input or file upload format and try again.', 400);
        return;
    }
    // 2. Payload too large
    if (err?.type === 'entity.too.large') {
        (0, response_1.sendError)(res, 'Request payload exceeds the maximum allowed size limit.', 413);
        return;
    }
    // 3. Multer File Upload Errors
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            (0, response_1.sendError)(res, 'Uploaded file exceeds the maximum allowed size limit (5 MB).', 400);
            return;
        }
        (0, response_1.sendError)(res, 'Could not process the uploaded file. Please verify the file and try again.', 400);
        return;
    }
    // 4. Zod Validation Error
    if (err instanceof zod_1.ZodError) {
        const firstMessage = err.errors[0]?.message || 'Validation failed';
        const fieldErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
        }));
        (0, response_1.sendError)(res, firstMessage, 400, fieldErrors);
        return;
    }
    // 5. Mongoose Database Connectivity Errors
    if (err?.name === 'MongoNetworkError' ||
        err?.name === 'MongooseServerSelectionError' ||
        err?.name === 'MongoServerSelectionError' ||
        err?.name === 'MongoTimeoutError') {
        (0, response_1.sendError)(res, 'Database connection is temporarily unavailable. Please try again in a moment.', 503);
        return;
    }
    // 6. Mongoose Duplicate Key Error (Code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        (0, response_1.sendError)(res, `An account or record with this ${field} already exists.`, 409);
        return;
    }
    // 7. Mongoose Cast Error (Invalid ObjectId)
    if (err.name === 'CastError') {
        (0, response_1.sendError)(res, `Invalid ID format for parameter: ${err.path}`, 400);
        return;
    }
    // 8. JWT Verification Errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        (0, response_1.sendError)(res, 'Session token is invalid or expired. Please sign in again.', 401);
        return;
    }
    // 9. Generic / Unhandled Error (never expose raw internal stack traces)
    const statusCode = err.statusCode || err.status || 500;
    const safeMessage = statusCode >= 500
        ? 'An unexpected server error occurred. Please try again shortly.'
        : err.message || 'Request could not be processed. Please try again.';
    (0, response_1.sendError)(res, safeMessage, statusCode);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    (0, response_1.sendError)(res, `API endpoint not found: ${req.method} ${req.originalUrl}. Please verify the route path.`, 404);
};
exports.notFoundHandler = notFoundHandler;
