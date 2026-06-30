// backend/payment-service/src/middleware/queueMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@newcondo/db';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Queue configuration constants
const QUEUE_TIMEOUT = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 100;
const QUEUE_CHECK_INTERVAL = 100; // 100ms

interface QueuePosition {
  position: number;
  estimatedWaitTime: number;
  queueSize: number;
}

interface PaymentQueueRequest extends Request {
  queuePosition?: QueuePosition;
  queueToken?: string;
}

/**
 * Middleware to manage payment queue for properties/units
 * Prevents race conditions and ensures orderly payment processing
 */
export const queueMiddleware = async (
  req: PaymentQueueRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, unitId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'Property ID is required',
      });
      return;
    }

    // Create unique queue key for property or unit
    const queueKey = unitId 
      ? `payment-queue:unit:${unitId}`
      : `payment-queue:property:${propertyId}`;

    // Generate unique token for this payment attempt
    const queueToken = `${userId}:${Date.now()}`;

    // Check current queue size
    const currentQueueSize = await redis.llen(queueKey);

    if (currentQueueSize >= MAX_QUEUE_SIZE) {
      res.status(503).json({
        success: false,
        message: 'Payment queue is full. Please try again later.',
        queueSize: currentQueueSize,
        maxQueueSize: MAX_QUEUE_SIZE,
      });
      return;
    }

    // Add user to queue
    await redis.rpush(queueKey, queueToken);
    await redis.expire(queueKey, 300); // Queue expires in 5 minutes

    // Get position in queue
    const queuePosition = await getQueuePosition(queueKey, queueToken);

    if (queuePosition === -1) {
      res.status(500).json({
        success: false,
        message: 'Failed to join payment queue',
      });
      return;
    }

    // If not first in queue, wait for turn
    if (queuePosition > 0) {
      const didGetTurn = await waitForTurn(
        queueKey, 
        queueToken, 
        queuePosition
      );

      if (!didGetTurn) {
        // Remove from queue if timeout
        await redis.lrem(queueKey, 1, queueToken);
        
        res.status(408).json({
          success: false,
          message: 'Queue timeout. Please try again.',
          reason: 'QUEUE_TIMEOUT',
        });
        return;
      }
    }

    // Check if property/unit is still available
    const isAvailable = await checkAvailability(propertyId, unitId);

    if (!isAvailable) {
      // Remove from queue
      await redis.lrem(queueKey, 1, queueToken);
      
      res.status(409).json({
        success: false,
        message: 'Property/unit is no longer available',
        reason: 'NO_LONGER_AVAILABLE',
      });
      return;
    }

    // Attach queue info to request
    req.queuePosition = {
      position: queuePosition,
      estimatedWaitTime: queuePosition * 5000, // 5 seconds per position
      queueSize: currentQueueSize + 1,
    };
    req.queueToken = queueToken;

    // Store queue key for cleanup
    res.locals.queueKey = queueKey;
    res.locals.queueToken = queueToken;

    next();
  } catch (error) {
    console.error('Queue middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Queue management error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get position in queue for a given token
 */
async function getQueuePosition(
  queueKey: string, 
  queueToken: string
): Promise<number> {
  const queue = await redis.lrange(queueKey, 0, -1);
  return queue.indexOf(queueToken);
}

/**
 * Wait for turn in queue with timeout
 */
async function waitForTurn(
  queueKey: string,
  queueToken: string,
  initialPosition: number
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < QUEUE_TIMEOUT) {
    const currentPosition = await getQueuePosition(queueKey, queueToken);

    // If position is 0, it's our turn
    if (currentPosition === 0) {
      return true;
    }

    // If we're no longer in queue (removed or error), fail
    if (currentPosition === -1) {
      return false;
    }

    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, QUEUE_CHECK_INTERVAL));
  }

  return false;
}

/**
 * Check if property/unit is still available
 */
async function checkAvailability(
  propertyId: string,
  unitId?: string
): Promise<boolean> {
  try {
    if (unitId) {
      // Check unit availability
      const unit = await prisma.propertyUnit.findUnique({
        where: { id: unitId },
        select: {
          isAvailable: true,
          isPaymentLocked: true,
          paymentLockExpiry: true,
        },
      });

      if (!unit) return false;

      // Check if lock has expired
      if (unit.isPaymentLocked && unit.paymentLockExpiry) {
        const isLockExpired = new Date(unit.paymentLockExpiry) < new Date();
        if (isLockExpired) {
          // Lock expired, unit is available
          return true;
        }
        return false;
      }

      return unit.isAvailable && !unit.isPaymentLocked;
    } else {
      // Check property availability
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          isAvailable: true,
          isPaymentLocked: true,
          paymentLockExpiry: true,
          structure: true,
        },
      });

      if (!property) return false;

      // Multi-family properties should specify unitId
      if (property.structure === 'MULTI_FAMILY') {
        return false;
      }

      // Check if lock has expired
      if (property.isPaymentLocked && property.paymentLockExpiry) {
        const isLockExpired = new Date(property.paymentLockExpiry) < new Date();
        if (isLockExpired) {
          return true;
        }
        return false;
      }

      return property.isAvailable && !property.isPaymentLocked;
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    return false;
  }
}

/**
 * Cleanup middleware to remove from queue after request completes
 */
export const cleanupQueueMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Store original end function
  const originalEnd = res.end;

  // Override end function
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    // Remove from queue
    const queueKey = res.locals.queueKey;
    const queueToken = res.locals.queueToken;

    if (queueKey && queueToken) {
      redis.lrem(queueKey, 1, queueToken).catch(err => {
        console.error('Error removing from queue:', err);
      });
    }

    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

/**
 * Get queue status for a property/unit
 */
export const getQueueStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId, unitId } = req.params;

    const queueKey = unitId 
      ? `payment-queue:unit:${unitId}`
      : `payment-queue:property:${propertyId}`;

    const queueSize = await redis.llen(queueKey);
    const queue = await redis.lrange(queueKey, 0, -1);

    res.json({
      success: true,
      data: {
        queueSize,
        estimatedWaitTime: queueSize * 5000, // 5 seconds per position
        isQueueActive: queueSize > 0,
        queue: queue.map((token, index) => ({
          position: index,
          token: token.split(':')[0], // Just show user ID part
        })),
      },
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Clear queue for a property/unit (admin only)
 */
export const clearQueue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId, unitId } = req.params;

    const queueKey = unitId 
      ? `payment-queue:unit:${unitId}`
      : `payment-queue:property:${propertyId}`;

    const deletedCount = await redis.del(queueKey);

    res.json({
      success: true,
      message: 'Queue cleared successfully',
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    console.error('Error clearing queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear queue',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export default {
  queueMiddleware,
  cleanupQueueMiddleware,
  getQueueStatus,
  clearQueue,
};