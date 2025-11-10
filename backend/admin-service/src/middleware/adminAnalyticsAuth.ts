import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { PrismaClient, Role } from '@newcondo/db';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: Role;
  };
}

/**
 * Middleware to authenticate admin users for analytics endpoints
 * Verifies JWT token and checks for ADMIN role
 */
export const authenticateAdminAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JWTPayload;

    // Check if user exists and is an admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    if (user.role !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required for analytics.'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          error: 'Invalid authentication token'
        });
        return;
      }
      
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: 'Authentication token has expired'
        });
        return;
      }
    }

    console.error('Admin analytics authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to verify admin has specific permissions for sensitive analytics
 */
export const requireSuperAdminForSensitiveAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check if user has super admin flag (you can extend User model with isSuperAdmin)
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        role: true,
        email: true
      }
    });

    if (!user || user.role !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Super admin privileges required for this operation'
      });
      return;
    }

    // Additional check: You can add isSuperAdmin field to User model
    // For now, we'll allow all admins but log the access
    console.log(`Admin ${user.email} accessing sensitive analytics`);

    next();
  } catch (error) {
    console.error('Super admin verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Permission verification failed'
    });
  }
};

/**
 * Rate limiting middleware for analytics endpoints
 */
export const analyticsRateLimit = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Implement rate limiting logic
  // For now, we'll pass through
  // In production, use Redis-based rate limiting
  next();
};

/**
 * Log admin analytics access
 */
export const logAnalyticsAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      // Log the analytics access
      await prisma.eventLog.create({
        data: {
          userId: req.user.userId,
          type: 'ANALYTICS_ACCESS',
          metadata: {
            endpoint: req.path,
            method: req.method,
            query: req.query
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    }
    next();
  } catch (error) {
    console.error('Error logging analytics access:', error);
    // Don't block the request if logging fails
    next();
  }
};