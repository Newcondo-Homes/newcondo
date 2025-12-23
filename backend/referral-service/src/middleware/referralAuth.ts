// backend/referral-service/src/middleware/referralAuth.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@newcondo/db';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

/**
 * Verify JWT token and attach user to request
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
        },
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: Role;
    };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      });
    }

    next(error);
  }
};

/**
 * Check if user is authorized to access referral data
 */
export const authorizeReferralAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { referralId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Get referral
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      select: {
        referrerId: true,
        referredId: true,
      },
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Referral not found',
        },
      });
    }

    // Check if user is referrer, referred, or admin
    const isAuthorized =
      referral.referrerId === userId ||
      referral.referredId === userId ||
      req.user?.role === Role.ADMIN;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this referral',
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is authorized to access reward data
 */
export const authorizeRewardAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rewardId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Get reward
    const reward = await prisma.referralReward.findUnique({
      where: { id: rewardId },
      select: {
        userId: true,
      },
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reward not found',
        },
      });
    }

    // Check if user owns reward or is admin
    const isAuthorized = reward.userId === userId || req.user?.role === Role.ADMIN;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this reward',
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== Role.ADMIN) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }

  next();
};

/**
 * Check if user can refer (based on role capabilities)
 */
export const canRefer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Import here to avoid circular dependency
    const qualificationService = (await import('../services/qualificationService')).default;
    
    const eligibility = await qualificationService.checkReferralEligibility(userId);

    if (!eligibility.isEligible) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INELIGIBLE_TO_REFER',
          message: 'You are not eligible to make referrals',
          details: {
            reasons: eligibility.reasons,
            requirements: eligibility.requirements,
          },
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - attach user if token exists, but don't fail
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: Role;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};