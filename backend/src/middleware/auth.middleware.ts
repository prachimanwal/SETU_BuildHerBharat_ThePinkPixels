import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User, IUser } from '../models/User';
import { sendError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  token?: string;
}

export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role
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

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to HttpOnly cookie
    if (!token && req.cookies && req.cookies.setu_token) {
      token = req.cookies.setu_token;
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401);
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      sendError(res, 'Account not found or session has expired.', 401);
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error: any) {
    sendError(res, 'Invalid or expired session token.', 401);
  }
};

export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.setu_token) {
      token = req.cookies.setu_token;
    }

    if (token) {
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
