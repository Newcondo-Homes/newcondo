// backend/property-service/src/middleware/propertyAccessControl.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, PropertyStatus, AdminApprovalStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if property can be edited based on status
 */
export const checkPropertyEditableStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const propertyId = req.params.propertyId || req.body.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required',
      });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        status: true,
        adminApprovalStatus: true,
        rentals: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Check if property has active rentals
    if (property.rentals.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit property with active rentals',
      });
    }

    // Allow editing if property is in draft or pending
    const editableStatuses: PropertyStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'UNAVAILABLE'];
    
    if (!editableStatuses.includes(property.status)) {
      return res.status(403).json({
        success: false,
        message: `Property cannot be edited in ${property.status} status`,
      });
    }

    next();
  } catch (error) {
    console.error('Property editable status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking property status',
    });
  }
};

/**
 * Middleware to check if property can be deleted
 */
export const checkPropertyDeletable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const propertyId = req.params.propertyId || req.body.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required',
      });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        rentals: {
          where: {
            status: {
              in: ['ACTIVE', 'PENDING_CONFIRMATION'],
            },
          },
        },
        payments: {
          where: {
            status: {
              in: ['PENDING', 'HELD'],
            },
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Cannot delete with active rentals
    if (property.rentals.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete property with active or pending rentals',
      });
    }

    // Cannot delete with pending payments
    if (property.payments && property.payments.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete property with pending payments',
      });
    }

    next();
  } catch (error) {
    console.error('Property deletable check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking if property can be deleted',
    });
  }
};

/**
 * Middleware to rate limit property updates
 */
export const rateLimitPropertyUpdates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const propertyId = req.params.propertyId || req.body.propertyId;

    if (!userId || !propertyId) {
      return next();
    }

    // Check recent updates (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentUpdates = await prisma.eventLog.count({
      where: {
        userId,
        type: 'PROPERTY_UPDATED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
        timestamp: {
          gte: fiveMinutesAgo,
        },
      },
    });

    // Allow max 10 updates per 5 minutes
    if (recentUpdates >= 10) {
      return res.status(429).json({
        success: false,
        message: 'Too many updates. Please try again in a few minutes',
      });
    }

    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Don't block request on rate limit error
    next();
  }
};

/**
 * Middleware to verify property is published for public operations
 */
export const verifyPropertyPublished = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const propertyId = req.params.propertyId || req.body.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required',
      });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        status: true,
        adminApprovalStatus: true,
        isAvailable: true,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    if (property.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        message: 'Property is not published',
      });
    }

    if (property.adminApprovalStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'Property has not been approved by admin',
      });
    }

    if (!property.isAvailable) {
      return res.status(403).json({
        success: false,
        message: 'Property is not available',
      });
    }

    next();
  } catch (error) {
    console.error('Property published check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying property status',
    });
  }
};

/**
 * Middleware to check if user has reached property listing limit
 */
export const checkPropertyListingLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        isPremium: true,
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Define listing limits
    const limits = {
      OWNER: user.isPremium ? 50 : 5,
      AGENT: user.isPremium ? 100 : 10,
      RENTER: 0,
      ADMIN: Infinity,
    };

    const userLimit = limits[user.role];
    const currentCount = user._count.properties;

    if (currentCount >= userLimit) {
      return res.status(403).json({
        success: false,
        message: `You have reached your property listing limit (${userLimit}). ${
          !user.isPremium ? 'Upgrade to premium for more listings.' : ''
        }`,
      });
    }

    next();
  } catch (error) {
    console.error('Property listing limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking listing limit',
    });
  }
};

/**
 * Middleware to log property access for analytics
 */
export const logPropertyAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const propertyId = req.params.propertyId || req.body.propertyId;
    const action = req.method;

    if (propertyId) {
      await prisma.eventLog.create({
        data: {
          userId: userId || undefined,
          type: 'PROPERTY_ACCESSED',
          metadata: {
            propertyId,
            action,
            path: req.path,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    }

    next();
  } catch (error) {
    console.error('Property access logging error:', error);
    // Don't block request on logging error
    next();
  }
};