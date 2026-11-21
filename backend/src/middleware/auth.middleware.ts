import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { User, IUser } from '../models/User';
import { sendError } from '../utils/response';
import { isDemoUser } from '../utils/userSerializer';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  token?: string;
}

export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      authProvider: user.authProvider || 'local',
      isDemoAccount: isDemoUser(user)
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const setAuthCookie = (res: Response, token: string): void => {
  const isProduction = ENV.NODE_ENV === 'production';
  res.cookie('setu_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

export const clearAuthCookie = (res: Response): void => {
  const isProduction = ENV.NODE_ENV === 'production';
  res.clearCookie('setu_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
};

const extractRequestToken = (req: Request): string | undefined => {
  // Prefer HttpOnly cookie first, then Bearer header (supports both same-origin proxy & cross-origin Render)
  if (req.cookies && req.cookies.setu_token) {
    return req.cookies.setu_token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.split(' ')[1]?.trim();
    if (bearer) return bearer;
  }
  return undefined;
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractRequestToken(req);

    if (!token) {
      sendError(res, 'Authentication required. Please sign in.', 401);
      return;
    }

    let decoded: { id: string; email: string; role: string };
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
      };
    } catch (jwtErr: any) {
      clearAuthCookie(res);
      if (jwtErr?.name === 'TokenExpiredError') {
        sendError(res, 'Your authentication session has expired. Please sign in again.', 401);
        return;
      }
      sendError(res, 'Invalid authentication session. Please sign in again.', 401);
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
      return;
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      clearAuthCookie(res);
      sendError(res, 'Account not found or session has expired. Please sign in again.', 401);
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error: any) {
    if (
      error?.name === 'MongoNetworkError' ||
      error?.name === 'MongooseServerSelectionError'
    ) {
      sendError(
        res,
        'Database connection is currently unavailable. Please try again shortly.',
        503
      );
      return;
    }
    sendError(res, 'Invalid or expired authentication session.', 401);
  }
};

export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractRequestToken(req);

    if (token && mongoose.connection.readyState === 1) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
  } catch {
    // Ignore error for optional authentication
  }
  next();
};
