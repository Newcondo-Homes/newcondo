import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

// Validation schemas
const checkLockSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
});

const acquireLockSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
  userId: z.string().cuid(),
  lockDuration: z.number().min(300000).max(1800000).default(900000), // 5-30 minutes
});

const releaseLockSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
  userId: z.string().cuid(),
});

/**
 * Validate lock check request
 */
export const validateLockCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = checkLockSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
};

/**
 * Validate lock acquisition request
 */
export const validateLockAcquisition = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = acquireLockSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
};

/**
 * Validate lock release request
 */
export const validateLockRelease = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = releaseLockSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
};

/**
 * Check if property/unit exists and is available
 */
export const validatePropertyAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, unitId } = req.body;

    // Check if it's a unit or property rental
    if (unitId) {
      const unit = await prisma.propertyUnit.findUnique({
        where: { id: unitId },
        include: { property: true },
      });

      if (!unit) {
        res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
        return;
      }

      if (unit.propertyId !== propertyId) {
        res.status(400).json({
          success: false,
          error: 'Unit does not belong to specified property',
        });
        return;
      }

      if (!unit.isAvailable || unit.status !== 'AVAILABLE') {
        res.status(409).json({
          success: false,
          error: 'Unit is not available for booking',
        });
        return;
      }
    } else {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        res.status(404).json({
          success: false,
          error: 'Property not found',
        });
        return;
      }

      if (property.structure === 'MULTI_FAMILY') {
        res.status(400).json({
          success: false,
          error: 'Multi-family properties require unit selection',
        });
        return;
      }

      if (!property.isAvailable || property.status !== 'PUBLISHED') {
        res.status(409).json({
          success: false,
          error: 'Property is not available for booking',
        });
        return;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check for existing active locks
 */
export const checkExistingLock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, unitId, userId } = req.body;

    const now = new Date();

    if (unitId) {
      // Check unit lock
      const unit = await prisma.propertyUnit.findUnique({
        where: { id: unitId },
      });

      if (
        unit?.isPaymentLocked &&
        unit.paymentLockExpiry &&
        unit.paymentLockExpiry > now
      ) {
        // Check if lock is held by same user (allow re-locking)
        const existingAttempt = await prisma.paymentAttemptLog.findFirst({
          where: {
            unitId,
            userId,
            status: 'LOCKED',
            createdAt: {
              gte: new Date(Date.now() - 30 * 60 * 1000), // Within last 30 minutes
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!existingAttempt) {
          res.status(423).json({
            success: false,
            error: 'Unit is currently locked by another user',
            lockedUntil: unit.paymentLockExpiry,
          });
          return;
        }
      }
    } else {
      // Check property lock
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (
        property?.isPaymentLocked &&
        property.paymentLockExpiry &&
        property.paymentLockExpiry > now
      ) {
        // Check if lock is held by same user
        const existingAttempt = await prisma.paymentAttemptLog.findFirst({
          where: {
            propertyId,
            userId,
            status: 'LOCKED',
            unitId: null,
            createdAt: {
              gte: new Date(Date.now() - 30 * 60 * 1000),
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!existingAttempt) {
          res.status(423).json({
            success: false,
            error: 'Property is currently locked by another user',
            lockedUntil: property.paymentLockExpiry,
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate user owns the lock before releasing
 */
export const validateLockOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, unitId, userId } = req.body;

    const recentAttempt = await prisma.paymentAttemptLog.findFirst({
      where: {
        propertyId,
        unitId: unitId || null,
        userId,
        status: 'LOCKED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!recentAttempt) {
      res.status(403).json({
        success: false,
        error: 'No active lock found for this user',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};