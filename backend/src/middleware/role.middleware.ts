import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { UserRole } from '../models/User';
import { sendError } from '../utils/response';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
};

export const requireApprovedEmployer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (req.user.role !== 'employer') {
    sendError(res, 'Access denied. Only employers can perform this action.', 403);
    return;
  }

  const status = req.user.employerProfile?.verificationStatus;
  if (status !== 'approved') {
    sendError(
      res,
      `Your employer account is currently ${status || 'pending'} verification. Publishing opportunities requires approval from SETU platform administration.`,
      403
    );
    return;
  }

  next();
};
