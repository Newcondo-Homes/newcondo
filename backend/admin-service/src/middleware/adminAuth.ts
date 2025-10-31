// backend/admin-service/src/middleware/adminAuth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@newcondo/db';

interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      admin?: JWTPayload;
    }
  }
}

/**
 * Middleware to verify admin authentication
 * Checks JWT token and ensures user has ADMIN role
 */
export const verifyAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Check if user has ADMIN role
    if (decoded.role !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    // Attach admin info to request object
    req.admin = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Authentication token has expired'
      });
      return;
    }

    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional middleware to attach admin info without requiring authentication
 * Useful for public endpoints that want to know if an admin is logged in
 */
export const optionalAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const JWT_SECRET = process.env.JWT_SECRET;
      
      if (JWT_SECRET) {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        
        if (decoded.role === Role.ADMIN) {
          req.admin = decoded;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};