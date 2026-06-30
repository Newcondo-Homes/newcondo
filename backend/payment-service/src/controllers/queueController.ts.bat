// backend/payment-service/src/controllers/queueController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@newcondo/db';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const queueStatusSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
});

const clearQueueSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
  reason: z.string().optional(),
});

/**
 * Get payment queue status for a property/unit
 * Shows current lock status and waiting users
 */
export const getQueueStatus = async (req: Request, res: Response) => {
  try {
    const { propertyId, unitId } = queueStatusSchema.parse(req.query);

    // Get current lock status from property or unit
    let lockStatus;
    if (unitId) {
      const unit = await prisma.propertyUnit.findUnique({
        where: { id: unitId },
        select: {
          isPaymentLocked: true,
          paymentLockExpiry: true,
        },
      });
      lockStatus = unit;
    } else {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          isPaymentLocked: true,
          paymentLockExpiry: true,
        },
      });
      lockStatus = property;
    }

    if (!lockStatus) {
      return res.status(404).json({
        success: false,
        message: unitId ? 'Unit not found' : 'Property not found',
      });
    }

    // Get recent payment attempts in queue (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const queuedAttempts = await prisma.paymentAttemptLog.findMany({
      where: {
        propertyId,
        unitId: unitId || null,
        status: { in: ['LOCKED', 'PENDING'] },
        createdAt: { gte: fiveMinutesAgo },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        lockDuration: true,
      },
      take: 10,
    });

    // Check if lock is expired
    const isLockExpired = lockStatus.paymentLockExpiry
      ? new Date() > lockStatus.paymentLockExpiry
      : true;

    return res.status(200).json({
      success: true,
      data: {
        isLocked: lockStatus.isPaymentLocked && !isLockExpired,
        lockExpiry: lockStatus.paymentLockExpiry,
        queueLength: queuedAttempts.length,
        queuedAttempts: queuedAttempts.map((attempt) => ({
          attemptId: attempt.id,
          userId: attempt.userId,
          status: attempt.status,
          timestamp: attempt.createdAt,
          lockDuration: attempt.lockDuration,
        })),
        estimatedWaitTime: queuedAttempts.length * 300, // 5 minutes per attempt
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors,
      });
    }

    console.error('Get queue status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get queue status',
    });
  }
};

/**
 * Get user's position in payment queue
 */
export const getUserQueuePosition = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { propertyId, unitId } = queueStatusSchema.parse(req.query);

    // Get all queued attempts for this property/unit
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const queuedAttempts = await prisma.paymentAttemptLog.findMany({
      where: {
        propertyId,
        unitId: unitId || null,
        status: { in: ['LOCKED', 'PENDING'] },
        createdAt: { gte: fiveMinutesAgo },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });

    // Find user's position
    const userPosition = queuedAttempts.findIndex((a) => a.userId === userId);
    const userAttempt = queuedAttempts.find((a) => a.userId === userId);

    if (userPosition === -1 || !userAttempt) {
      return res.status(200).json({
        success: true,
        data: {
          inQueue: false,
          position: null,
          estimatedWaitTime: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        inQueue: true,
        position: userPosition + 1,
        totalInQueue: queuedAttempts.length,
        estimatedWaitTime: userPosition * 300, // 5 minutes per position
        attemptId: userAttempt.id,
        timestamp: userAttempt.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors,
      });
    }

    console.error('Get user queue position error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get queue position',
    });
  }
};

/**
 * Clear expired locks and update queue
 * Admin or automated cleanup endpoint
 */
export const clearExpiredLocks = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Clear expired property locks
    const expiredProperties = await prisma.property.updateMany({
      where: {
        isPaymentLocked: true,
        paymentLockExpiry: { lt: now },
      },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    // Clear expired unit locks
    const expiredUnits = await prisma.propertyUnit.updateMany({
      where: {
        isPaymentLocked: true,
        paymentLockExpiry: { lt: now },
      },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    // Update stuck payment attempts
    await prisma.paymentAttemptLog.updateMany({
      where: {
        status: 'LOCKED',
        createdAt: { lt: new Date(now.getTime() - 10 * 60 * 1000) }, // 10 minutes old
      },
      data: {
        status: 'TIMEOUT',
        failureReason: 'Lock expired - automatic cleanup',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Expired locks cleared successfully',
      data: {
        propertiesCleared: expiredProperties.count,
        unitsCleared: expiredUnits.count,
      },
    });
  } catch (error) {
    console.error('Clear expired locks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear expired locks',
    });
  }
};

/**
 * Manually clear a specific payment lock (Admin only)
 */
export const clearPaymentLock = async (req: Request, res: Response) => {
  try {
    const { propertyId, unitId, reason } = clearQueueSchema.parse(req.body);

    if (unitId) {
      await prisma.propertyUnit.update({
        where: { id: unitId },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });
    } else {
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });
    }

    // Log the manual clear
    await prisma.paymentAttemptLog.create({
      data: {
        userId: req.user?.id || 'system',
        propertyId,
        unitId,
        amount: 0,
        status: 'FAILED',
        failureReason: `Manual lock clear by admin: ${reason || 'No reason provided'}`,
        lockAcquired: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Payment lock cleared successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors,
      });
    }

    console.error('Clear payment lock error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear payment lock',
    });
  }
};

/**
 * Get queue statistics (Admin dashboard)
 */
export const getQueueStatistics = async (req: Request, res: Response) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get statistics from payment attempt logs
    const [totalAttempts, lockedAttempts, successfulAttempts, failedAttempts, timeoutAttempts] =
      await Promise.all([
        prisma.paymentAttemptLog.count({
          where: { createdAt: { gte: oneDayAgo } },
        }),
        prisma.paymentAttemptLog.count({
          where: {
            createdAt: { gte: oneDayAgo },
            status: 'LOCKED',
          },
        }),
        prisma.paymentAttemptLog.count({
          where: {
            createdAt: { gte: oneDayAgo },
            status: 'SUCCESS',
          },
        }),
        prisma.paymentAttemptLog.count({
          where: {
            createdAt: { gte: oneDayAgo },
            status: 'FAILED',
          },
        }),
        prisma.paymentAttemptLog.count({
          where: {
            createdAt: { gte: oneDayAgo },
            status: 'TIMEOUT',
          },
        }),
      ]);

    // Get average lock duration
    const avgLockDuration = await prisma.paymentAttemptLog.aggregate({
      where: {
        createdAt: { gte: oneDayAgo },
        lockAcquired: true,
      },
      _avg: {
        lockDuration: true,
      },
    });

    // Get currently locked properties
    const [currentlyLockedProperties, currentlyLockedUnits] = await Promise.all([
      prisma.property.count({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: { gt: new Date() },
        },
      }),
      prisma.propertyUnit.count({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: { gt: new Date() },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        last24Hours: {
          totalAttempts,
          lockedAttempts,
          successfulAttempts,
          failedAttempts,
          timeoutAttempts,
          successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
          avgLockDurationMs: avgLockDuration._avg.lockDuration || 0,
        },
        currentStatus: {
          lockedProperties: currentlyLockedProperties,
          lockedUnits: currentlyLockedUnits,
          totalLocked: currentlyLockedProperties + currentlyLockedUnits,
        },
      },
    });
  } catch (error) {
    console.error('Get queue statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get queue statistics',
    });
  }
};