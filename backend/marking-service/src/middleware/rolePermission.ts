// backend/marking-service/src/middleware/rolePermission.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@newcondo/db';

const prisma = new PrismaClient();

interface RoleRequest extends Request {
  user?: {
    id: string;
    role: Role;
    email?: string;
  };
}

/**
 * Validates that user can request a marking job
 * Only OWNER and AGENT roles can request marking jobs
 */
export const canRequestMarkingJob = async (
  req: RoleRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Only property owners and agents can request marking jobs
    if (userRole !== 'OWNER' && userRole !== 'AGENT') {
      res.status(403).json({
        success: false,
        error: 'Only property owners and agents can request marking jobs',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Request marking permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate permissions'
    });
  }
};

/**
 * Validates that user can accept/perform marking jobs
 * Only AGENT and premium RENTER roles can perform marking
 */
export const canPerformMarkingJob = async (
  req: RoleRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Fetch user with premium status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        isPremium: true,
        premiumExpiresAt: true,
        isAvailableForMarking: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check if user is available for marking
    if (!user.isAvailableForMarking) {
      res.status(403).json({
        success: false,
        error: 'User is not available for marking jobs',
        code: 'NOT_AVAILABLE_FOR_MARKING'
      });
      return;
    }

    // Agents can always perform marking
    if (userRole === 'AGENT') {
      next();
      return;
    }

    // Renters must have active premium subscription
    if (userRole === 'RENTER') {
      if (!user.isPremium) {
        res.status(403).json({
          success: false,
          error: 'Premium subscription required to perform marking jobs',
          code: 'PREMIUM_REQUIRED'
        });
        return;
      }

      // Check if premium is still active
      if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
        res.status(403).json({
          success: false,
          error: 'Premium subscription has expired',
          code: 'PREMIUM_EXPIRED',
          data: {
            expiredAt: user.premiumExpiresAt
          }
        });
        return;
      }

      next();
      return;
    }

    // Other roles cannot perform marking
    res.status(403).json({
      success: false,
      error: 'Only agents and premium renters can perform marking jobs',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  } catch (error) {
    console.error('Perform marking permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate permissions'
    });
  }
};

/**
 * Validates that user owns the property they're requesting marking for
 */
export const canMarkOwnProperty = async (
  req: RoleRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { propertyId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!propertyId) {
      res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
      return;
    }

    // Fetch property to verify ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        agentId: true
      }
    });

    if (!property) {
      res.status(404).json({
        success: false,
        error: 'Property not found'
      });
      return;
    }

    // User must be either the owner or assigned agent
    if (property.ownerId !== userId && property.agentId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only request marking for your own properties',
        code: 'NOT_PROPERTY_OWNER'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Property ownership validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate property ownership'
    });
  }
};

/**
 * Validates admin permissions for marking oversight
 */
export const isAdmin = async (
  req: RoleRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_ONLY'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate admin permissions'
    });
  }
};

/**
 * Validates that user can confirm a completed marking job
 * Only the property owner who requested the job can confirm
 */
export const canConfirmMarkingJob = async (
  req: RoleRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { markingJobId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!markingJobId) {
      res.status(400).json({
        success: false,
        error: 'Marking job ID is required'
      });
      return;
    }

    // Fetch marking job
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      select: {
        id: true,
        requestedBy: true,
        status: true
      }
    });

    if (!markingJob) {
      res.status(404).json({
        success: false,
        error: 'Marking job not found'
      });
      return;
    }

    // Only the requester can confirm
    if (markingJob.requestedBy !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only the property owner who requested the marking can confirm it',
        code: 'NOT_JOB_REQUESTER'
      });
      return;
    }

    // Job must be completed to confirm
    if (markingJob.status !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: 'Marking job must be completed before confirmation',
        code: 'JOB_NOT_COMPLETED',
        data: {
          currentStatus: markingJob.status
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Confirm marking permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate confirmation permissions'
    });
  }
};

/**
 * Validates that user can cancel their own marking job
 */
export const canCancelMarkingJob = async (
  req: RoleRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { markingJobId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Fetch marking job
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      select: {
        id: true,
        requestedBy: true,
        status: true
      }
    });

    if (!markingJob) {
      res.status(404).json({
        success: false,
        error: 'Marking job not found'
      });
      return;
    }

    // Admin can cancel any job
    if (userRole === 'ADMIN') {
      next();
      return;
    }

    // User can only cancel their own jobs
    if (markingJob.requestedBy !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only cancel your own marking jobs',
        code: 'NOT_JOB_OWNER'
      });
      return;
    }

    // Cannot cancel completed jobs
    if (markingJob.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel completed marking jobs',
        code: 'JOB_COMPLETED'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Cancel marking permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate cancellation permissions'
    });
  }
};