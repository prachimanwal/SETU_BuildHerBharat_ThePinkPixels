import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Middleware] Server error:', err?.name || 'Error', err?.message || '');

  // 1. Express JSON body parser SyntaxError (never leak raw parser token traces to client)
  if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && (err as any).status === 400)) {
    sendError(
      res,
      'Invalid request payload format. Please check your input or file upload format and try again.',
      400
    );
    return;
  }

  // 2. Payload too large
  if (err?.type === 'entity.too.large') {
    sendError(res, 'Request payload exceeds the maximum allowed size limit.', 413);
    return;
  }

  // 3. Multer File Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'Uploaded file exceeds the maximum allowed size limit (5 MB).', 400);
      return;
    }
    sendError(res, 'Could not process the uploaded file. Please verify the file and try again.', 400);
    return;
  }

  // 4. Zod Validation Error
  if (err instanceof ZodError) {
    const firstMessage = err.errors[0]?.message || 'Validation failed';
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    sendError(res, firstMessage, 400, fieldErrors);
    return;
  }

  // 5. Mongoose Database Connectivity Errors
  if (
    err?.name === 'MongoNetworkError' ||
    err?.name === 'MongooseServerSelectionError' ||
    err?.name === 'MongoServerSelectionError' ||
    err?.name === 'MongoTimeoutError'
  ) {
    sendError(
      res,
      'Database connection is temporarily unavailable. Please try again in a moment.',
      503
    );
    return;
  }

  // 6. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    sendError(res, `An account or record with this ${field} already exists.`, 409);
    return;
  }

  // 7. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, `Invalid ID format for parameter: ${err.path}`, 400);
    return;
  }

  // 8. JWT Verification Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    sendError(res, 'Session token is invalid or expired. Please sign in again.', 401);
    return;
  }

  // 9. Generic / Unhandled Error (never expose raw internal stack traces)
  const statusCode = err.statusCode || err.status || 500;
  const safeMessage =
    statusCode >= 500
      ? 'An unexpected server error occurred. Please try again shortly.'
      : err.message || 'Request could not be processed. Please try again.';

  sendError(res, safeMessage, statusCode);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    `API endpoint not found: ${req.method} ${req.originalUrl}. Please verify the route path.`,
    404
  );
};
