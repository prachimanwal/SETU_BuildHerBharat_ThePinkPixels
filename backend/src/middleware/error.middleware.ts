import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Middleware] Server error:', err);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const firstMessage = err.errors[0]?.message || 'Validation failed';
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    sendError(res, firstMessage, 400, fieldErrors);
    return;
  }

  // 2. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    sendError(res, `An account or record with this ${field} already exists.`, 409);
    return;
  }

  // 3. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, `Invalid ID format for parameter: ${err.path}`, 400);
    return;
  }

  // 4. JWT Verification Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    sendError(res, 'Session token is invalid or expired. Please sign in again.', 401);
    return;
  }

  // 5. Generic / Unhandled Error
  const statusCode = err.statusCode || err.status || 500;
  const message =
    err.message || 'An unexpected internal server error occurred. Please try again.';

  sendError(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    `API endpoint not found: ${req.method} ${req.originalUrl}. Please verify the route path.`,
    404
  );
};
