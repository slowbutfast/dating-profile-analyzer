import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Extended Express Request with authenticated user data
 */
export interface AuthRequest extends Request {
  user?: DecodedIdToken & { uid: string };
}

/**
 * Middleware to verify Firebase ID token and attach user to request
 * Usage: app.use('/api/protected', verifyAuth, routes)
 */
export const verifyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header',
        code: 'MISSING_TOKEN',
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);

    // Attach decoded token (includes uid, email, etc.) to request
    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
    };

    next();
  } catch (error: any) {
    console.error('Auth verification failed:', error.message);

    // Distinguish between token errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Middleware to verify user owns the resource in question
 * Should be used after verifyAuth
 * Compares req.user.uid with a userId param or body field
 */
export const verifyOwnership = (userIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Check userId in params first, then body, then query
    const userId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];

    if (!userId) {
      return res.status(400).json({
        error: `Missing ${userIdField} in request`,
        code: 'MISSING_USER_ID',
      });
    }

    if (req.user.uid !== userId) {
      return res.status(403).json({
        error: 'Forbidden: You do not have access to this resource',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

/**
 * Optional middleware to check if user is authenticated
 * Does not throw error if not authenticated, but attaches user if token is valid
 * Useful for routes that work with or without authentication
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
    };

    next();
  } catch (error) {
    // Continue without user on auth failure
    next();
  }
};
