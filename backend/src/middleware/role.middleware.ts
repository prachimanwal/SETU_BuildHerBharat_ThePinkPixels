import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { UserRole } from '../models/User';
import { isEligibleForBuildHer } from '../utils/userSerializer';
import { sendError } from '../utils/response';

export { isEligibleForBuildHer };

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

/**
 * Enforces strict Build Her eligibility from the authenticated MongoDB user profile.
 * Accessible exclusively to Job Seekers whose stored gender is Female.
 */
export const requireBuildHerAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (!isEligibleForBuildHer(req.user)) {
    sendError(
      res,
      'Access denied. Build Her is exclusively available to eligible female job seekers.',
      403
    );
    return;
  }

  next();
};
