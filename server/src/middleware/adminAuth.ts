import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { generateFailureResponse } from '../utils/errorUtils';

// Extend Express Request type to include admin info
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        username: string;
        type: string;
      };
    }
  }
}

interface JwtPayload {
  id: number;
  username: string;
  type: string;
  iat?: number;
  exp?: number;
}

export const adminAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      generateFailureResponse('Authorization header is required', 401);
      return;
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      generateFailureResponse('Invalid authorization format. Use Bearer token', 401);
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token || token.trim().length === 0) {
      generateFailureResponse('Token is required', 401);
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        generateFailureResponse('Token has expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        generateFailureResponse('Invalid token', 401);
      } else {
        generateFailureResponse('Token verification failed', 401);
      }
      // This line should never be reached as generateFailureResponse throws
      return;
    }

    // Verify it's an admin token
    if (!decoded.type || decoded.type !== 'admin') {
      generateFailureResponse('Invalid token type. Admin token required', 401);
    }

    // Verify required fields
    if (!decoded.id || !decoded.username) {
      generateFailureResponse('Invalid token payload', 401);
    }

    // Attach admin info to request object
    req.admin = {
      id: decoded.id,
      username: decoded.username,
      type: decoded.type,
    };

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    next(error);
  }
};

