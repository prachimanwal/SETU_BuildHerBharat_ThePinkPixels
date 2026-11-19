"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, message, data, statusCode = 200) => {
    const payload = {
        success: true,
        message
    };
    if (data !== undefined) {
        payload.data = data;
    }
    return res.status(statusCode).json(payload);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 400, errors) => {
    const payload = {
        success: false,
        message
    };
    if (errors !== undefined) {
        payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
};
exports.sendError = sendError;
