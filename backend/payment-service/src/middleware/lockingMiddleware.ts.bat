// File: backend/payment-service/src/middleware/lockingMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@newcondo/db';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Lock duration constants
const PROPERTY_LOCK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const UNIT_LOCK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const MARKING_JOB_LOCK_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Redis lock keys
const PROPERTY_LOCK_KEY = (propertyId: string) => `property_lock:${propertyId}`;
const UNIT_LOCK_KEY = (unitId: string) => `unit_lock:${unitId}`;
const MARKING_JOB_LOCK_KEY = (jobId: string) => `marking_job_lock:${jobId}`;
const USER_PAYMENT_LOCK_KEY = (userId: string, resourceId: string) => `user_payment_lock:${userId}:${resourceId}`;

export interface LockContext {
  propertyId?: string;
  unitId?: string;
  markingJobId?: string;
  userId: string;
  paymentType: string;
}

// Property locking middleware
export const lockProperty = async (req: Request, res: Response, next: NextFunction) => {
  const { propertyId, unitId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required',
    });
  }

  try {
    if (unitId) {
      // Lock specific unit
      const lockAcquired = await acquireUnitLock(unitId, userId);
      if (!lockAcquired.success) {
        return res.status(409).json({
          success: false,
          message: lockAcquired.message,
          code: 'UNIT_LOCKED',
        });
      }
    } else if (propertyId) {
      // Lock entire property
      const lockAcquired = await acquirePropertyLock(propertyId, userId);
      if (!lockAcquired.success) {
        return res.status(409).json({
          success: false,
          message: lockAcquired.message,
          code: 'PROPERTY_LOCKED',
        });
      }
    }

    // Store lock info in request for cleanup
    req.lockInfo = {
      propertyId,
      unitId,
      userId,
    };

    next();
  } catch (error) {
    console.error('Property locking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to acquire property lock',
    });
  }
};

// Marking job locking middleware
export const lockMarkingJob = async (req: Request, res: Response, next: NextFunction) => {
  const { markingJobId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required',
    });
  }

  if (!markingJobId) {
    return next(); // Skip if no marking job ID
  }

  try {
    const lockAcquired = await acquireMarkingJobLock(markingJobId, userId);
    if (!lockAcquired.success) {
      return res.status(409).json({
        success: false,
        message: lockAcquired.message,
        code: 'MARKING_JOB_LOCKED',
      });
    }

    req.lockInfo = {
      ...req.lockInfo,
      markingJobId,
    };

    next();
  } catch (error) {
    console.error('Marking job locking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to acquire marking job lock',
    });
  }
};

// Generic payment locking middleware
export const lockPayment = async (req: Request, res: Response, next: NextFunction) => {
  const { propertyId, unitId, markingJobId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required',
    });
  }

  try {
    // Check for concurrent payment attempts by the same user
    const resourceId = unitId || propertyId || markingJobId;
    if (resourceId) {
      const userLockKey = USER_PAYMENT_LOCK_KEY(userId, resourceId);
      const userLockExists = await redis.get(userLockKey);
      
      if (userLockExists) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending payment for this resource',
          code: 'DUPLICATE_PAYMENT_ATTEMPT',
        });
      }

      // Set user payment lock
      await redis.setex(userLockKey, 600, userId); // 10 minutes
      req.lockInfo = {
        ...req.lockInfo,
        userLockKey,
      };
    }

    next();
  } catch (error) {
    console.error('Payment locking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to acquire payment lock',
    });
  }
};

// Lock cleanup middleware (for success/failure)
export const releaseLocks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cleanupLocks(req.lockInfo);
    next();
  } catch (error) {
    console.error('Lock cleanup error:', error);
    next(); // Continue even if cleanup fails
  }
};

// Property lock acquisition
async function acquirePropertyLock(propertyId: string, userId: string): Promise<{ success: boolean; message?: string }> {
  const lockKey = PROPERTY_LOCK_KEY(propertyId);
  
  // Check if property is already locked in Redis
  const existingLock = await redis.get(lockKey);
  if (existingLock && existingLock !== userId) {
    return {
      success: false,
      message: 'Property is currently being processed by another user',
    };
  }

  // Check database lock
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { 
      isPaymentLocked: true, 
      paymentLockExpiry: true,
      isAvailable: true,
      status: true,
    },
  });

  if (!property) {
    return {
      success: false,
      message: 'Property not found',
    };
  }

  if (!property.isAvailable) {
    return {
      success: false,
      message: 'Property is not available for rent',
    };
  }

  // Check if lock is still valid
  if (property.isPaymentLocked && property.paymentLockExpiry && property.paymentLockExpiry > new Date()) {
    return {
      success: false,
      message: 'Property is temporarily locked for another payment',
    };
  }

  // Acquire locks
  const lockExpiry = new Date(Date.now() + PROPERTY_LOCK_DURATION);
  
  // Set Redis lock
  await redis.setex(lockKey, Math.floor(PROPERTY_LOCK_DURATION / 1000), userId);
  
  // Set database lock
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      isPaymentLocked: true,
      paymentLockExpiry: lockExpiry,
    },
  });

  return { success: true };
}

// Unit lock acquisition
async function acquireUnitLock(unitId: string, userId: string): Promise<{ success: boolean; message?: string }> {
  const lockKey = UNIT_LOCK_KEY(unitId);
  
  // Check Redis lock
  const existingLock = await redis.get(lockKey);
  if (existingLock && existingLock !== userId) {
    return {
      success: false,
      message: 'Unit is currently being processed by another user',
    };
  }

  // Check database lock
  const unit = await prisma.propertyUnit.findUnique({
    where: { id: unitId },
    select: { 
      isPaymentLocked: true, 
      paymentLockExpiry: true,
      isAvailable: true,
      status: true,
    },
  });

  if (!unit) {
    return {
      success: false,
      message: 'Unit not found',
    };
  }

  if (!unit.isAvailable || unit.status !== 'AVAILABLE') {
    return {
      success: false,
      message: 'Unit is not available for rent',
    };
  }

  // Check if lock is still valid
  if (unit.isPaymentLocked && unit.paymentLockExpiry && unit.paymentLockExpiry > new Date()) {
    return {
      success: false,
      message: 'Unit is temporarily locked for another payment',
    };
  }

  // Acquire locks
  const lockExpiry = new Date(Date.now() + UNIT_LOCK_DURATION);
  
  // Set Redis lock
  await redis.setex(lockKey, Math.floor(UNIT_LOCK_DURATION / 1000), userId);
  
  // Set database lock
  await prisma.propertyUnit.update({
    where: { id: unitId },
    data: {
      isPaymentLocked: true,
      paymentLockExpiry: lockExpiry,
    },
  });

  return { success: true };
}

// Marking job lock acquisition
async function acquireMarkingJobLock(markingJobId: string, userId: string): Promise<{ success: boolean; message?: string }> {
  const lockKey = MARKING_JOB_LOCK_KEY(markingJobId);
  
  // Check Redis lock
  const existingLock = await redis.get(lockKey);
  if (existingLock && existingLock !== userId) {
    return {
      success: false,
      message: 'Marking job is currently being processed',
    };
  }

  // Check marking job status
  const markingJob = await prisma.propertyMarkingJob.findUnique({
    where: { id: markingJobId },
    select: { 
      status: true,
      paymentStatus: true,
      requestedBy: true,
    },
  });

  if (!markingJob) {
    return {
      success: false,
      message: 'Marking job not found',
    };
  }

  if (markingJob.requestedBy !== userId) {
    return {
      success: false,
      message: 'Unauthorized access to marking job',
    };
  }

  if (markingJob.paymentStatus !== 'PENDING') {
    return {
      success: false,
      message: 'Marking job payment is not pending',
    };
  }

  // Set Redis lock
  await redis.setex(lockKey, Math.floor(MARKING_JOB_LOCK_DURATION / 1000), userId);

  return { success: true };
}

// Lock cleanup function
async function cleanupLocks(lockInfo?: any): Promise<void> {
  if (!lockInfo) return;

  const { propertyId, unitId, markingJobId, userId, userLockKey } = lockInfo;

  try {
    // Clean Redis locks
    const redisCleanup = [];
    if (propertyId) redisCleanup.push(redis.del(PROPERTY_LOCK_KEY(propertyId)));
    if (unitId) redisCleanup.push(redis.del(UNIT_LOCK_KEY(unitId)));
    if (markingJobId) redisCleanup.push(redis.del(MARKING_JOB_LOCK_KEY(markingJobId)));
    if (userLockKey) redisCleanup.push(redis.del(userLockKey));

    await Promise.all(redisCleanup);

    // Clean database locks
    const dbCleanup = [];
    if (propertyId) {
      dbCleanup.push(
        prisma.property.update({
          where: { id: propertyId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null,
          },
        })
      );
    }

    if (unitId) {
      dbCleanup.push(
        prisma.propertyUnit.update({
          where: { id: unitId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null,
          },
        })
      );
    }

    await Promise.all(dbCleanup);
  } catch (error) {
    console.error('Error cleaning up locks:', error);
  }
}

// Middleware to extend locks on successful payment
export const extendLocks = async (req: Request, res: Response, next: NextFunction) => {
  const { propertyId, unitId } = req.body;
  const extensionTime = 7 * 24 * 60 * 60 * 1000; // 7 days for confirmation period

  try {
    if (unitId) {
      await prisma.propertyUnit.update({
        where: { id: unitId },
        data: {
          paymentLockExpiry: new Date(Date.now() + extensionTime),
        },
      });
    } else if (propertyId) {
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          paymentLockExpiry: new Date(Date.now() + extensionTime),
        },
      });
    }

    next();
  } catch (error) {
    console.error('Error extending locks:', error);
    next(); // Continue even if extension fails
  }
};

// Cleanup expired locks (can be run as a cron job)
export const cleanupExpiredLocks = async (): Promise<void> => {
  try {
    const now = new Date();
    
    // Clean expired property locks
    await prisma.property.updateMany({
      where: {
        isPaymentLocked: true,
        paymentLockExpiry: {
          lte: now,
        },
      },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    // Clean expired unit locks
    await prisma.propertyUnit.updateMany({
      where: {
        isPaymentLocked: true,
        paymentLockExpiry: {
          lte: now,
        },
      },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    console.log('Expired locks cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up expired locks:', error);
  }
};

// Declare lock info in Express Request interface
declare global {
  namespace Express {
    interface Request {
      lockInfo?: {
        propertyId?: string;
        unitId?: string;
        markingJobId?: string;
        userId?: string;
        userLockKey?: string;
      };
    }
  }
}