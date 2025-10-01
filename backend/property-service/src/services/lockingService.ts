import { PrismaClient, PropertyStatus, UnitStatus } from '@newcondo/db';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface LockResult {
  success: boolean;
  lockId?: string;
  expiresAt?: Date;
  reason?: string;
}

interface ReleaseLockResult {
  success: boolean;
  reason?: string;
}

export class LockingService {
  private static LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private static LOCK_PREFIX = 'property_lock:';
  private static UNIT_LOCK_PREFIX = 'unit_lock:';

  /**
   * Acquire a lock on a property to prevent double booking
   */
  static async acquirePropertyLock(
    propertyId: string,
    userId: string,
    unitId?: string
  ): Promise<LockResult> {
    const lockKey = unitId 
      ? `${this.UNIT_LOCK_PREFIX}${unitId}` 
      : `${this.LOCK_PREFIX}${propertyId}`;
    
    const lockId = `${userId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + this.LOCK_DURATION_MS);

    try {
      // Check if property/unit is already locked in Redis
      const existingLock = await redis.get(lockKey);
      
      if (existingLock) {
        const lockData = JSON.parse(existingLock);
        
        // Check if the lock belongs to the same user
        if (lockData.userId === userId) {
          // Extend the existing lock
          await redis.setex(
            lockKey,
            Math.floor(this.LOCK_DURATION_MS / 1000),
            JSON.stringify({ userId, lockId, expiresAt: expiresAt.toISOString() })
          );
          
          return {
            success: true,
            lockId: lockData.lockId,
            expiresAt,
            reason: 'Lock extended for same user'
          };
        }
        
        return {
          success: false,
          reason: 'Property is currently locked by another user'
        };
      }

      // Check database lock status
      if (unitId) {
        const unit = await prisma.propertyUnit.findUnique({
          where: { id: unitId },
          select: { 
            isPaymentLocked: true, 
            paymentLockExpiry: true,
            isAvailable: true,
            status: true
          }
        });

        if (!unit) {
          return { success: false, reason: 'Unit not found' };
        }

        if (!unit.isAvailable || unit.status !== 'AVAILABLE') {
          return { success: false, reason: 'Unit is not available' };
        }

        if (unit.isPaymentLocked && unit.paymentLockExpiry && unit.paymentLockExpiry > new Date()) {
          return { success: false, reason: 'Unit is currently locked for payment' };
        }

        // Update database lock
        await prisma.propertyUnit.update({
          where: { id: unitId },
          data: {
            isPaymentLocked: true,
            paymentLockExpiry: expiresAt
          }
        });
      } else {
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { 
            isPaymentLocked: true, 
            paymentLockExpiry: true,
            isAvailable: true,
            status: true
          }
        });

        if (!property) {
          return { success: false, reason: 'Property not found' };
        }

        if (!property.isAvailable || property.status !== 'PUBLISHED') {
          return { success: false, reason: 'Property is not available' };
        }

        if (property.isPaymentLocked && property.paymentLockExpiry && property.paymentLockExpiry > new Date()) {
          return { success: false, reason: 'Property is currently locked for payment' };
        }

        // Update database lock
        await prisma.property.update({
          where: { id: propertyId },
          data: {
            isPaymentLocked: true,
            paymentLockExpiry: expiresAt
          }
        });
      }

      // Set Redis lock
      await redis.setex(
        lockKey,
        Math.floor(this.LOCK_DURATION_MS / 1000),
        JSON.stringify({ userId, lockId, expiresAt: expiresAt.toISOString() })
      );

      // Log the lock acquisition
      await prisma.paymentAttemptLog.create({
        data: {
          userId,
          propertyId,
          unitId,
          amount: 0, // Will be updated during actual payment
          status: 'LOCKED',
          lockAcquired: true,
          lockDuration: this.LOCK_DURATION_MS
        }
      });

      return {
        success: true,
        lockId,
        expiresAt,
        reason: 'Lock acquired successfully'
      };
    } catch (error) {
      console.error('Error acquiring property lock:', error);
      return {
        success: false,
        reason: 'Failed to acquire lock due to system error'
      };
    }
  }

  /**
   * Release a property lock
   */
  static async releasePropertyLock(
    propertyId: string,
    userId: string,
    lockId: string,
    unitId?: string
  ): Promise<ReleaseLockResult> {
    const lockKey = unitId 
      ? `${this.UNIT_LOCK_PREFIX}${unitId}` 
      : `${this.LOCK_PREFIX}${propertyId}`;

    try {
      // Check if lock exists and belongs to user
      const existingLock = await redis.get(lockKey);
      
      if (!existingLock) {
        return { success: true, reason: 'Lock already expired or does not exist' };
      }

      const lockData = JSON.parse(existingLock);
      
      if (lockData.userId !== userId || lockData.lockId !== lockId) {
        return { success: false, reason: 'Lock does not belong to this user' };
      }

      // Remove Redis lock
      await redis.del(lockKey);

      // Update database lock status
      if (unitId) {
        await prisma.propertyUnit.update({
          where: { id: unitId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null
          }
        });
      } else {
        await prisma.property.update({
          where: { id: propertyId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null
          }
        });
      }

      return { success: true, reason: 'Lock released successfully' };
    } catch (error) {
      console.error('Error releasing property lock:', error);
      return { success: false, reason: 'Failed to release lock' };
    }
  }

  /**
   * Check if a property is locked
   */
  static async isPropertyLocked(propertyId: string, unitId?: string): Promise<boolean> {
    const lockKey = unitId 
      ? `${this.UNIT_LOCK_PREFIX}${unitId}` 
      : `${this.LOCK_PREFIX}${propertyId}`;

    try {
      const lock = await redis.get(lockKey);
      
      if (lock) {
        const lockData = JSON.parse(lock);
        const expiresAt = new Date(lockData.expiresAt);
        
        if (expiresAt > new Date()) {
          return true;
        } else {
          // Lock expired, clean up
          await redis.del(lockKey);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking property lock:', error);
      return false;
    }
  }

  /**
   * Get lock information
   */
  static async getLockInfo(propertyId: string, unitId?: string) {
    const lockKey = unitId 
      ? `${this.UNIT_LOCK_PREFIX}${unitId}` 
      : `${this.LOCK_PREFIX}${propertyId}`;

    try {
      const lock = await redis.get(lockKey);
      
      if (!lock) {
        return null;
      }

      return JSON.parse(lock);
    } catch (error) {
      console.error('Error getting lock info:', error);
      return null;
    }
  }

  /**
   * Clean up expired locks (should be run periodically)
   */
  static async cleanupExpiredLocks(): Promise<number> {
    try {
      let cleanedCount = 0;

      // Clean up property locks
      const propertyKeys = await redis.keys(`${this.LOCK_PREFIX}*`);
      for (const key of propertyKeys) {
        const lock = await redis.get(key);
        if (lock) {
          const lockData = JSON.parse(lock);
          if (new Date(lockData.expiresAt) <= new Date()) {
            await redis.del(key);
            cleanedCount++;
          }
        }
      }

      // Clean up unit locks
      const unitKeys = await redis.keys(`${this.UNIT_LOCK_PREFIX}*`);
      for (const key of unitKeys) {
        const lock = await redis.get(key);
        if (lock) {
          const lockData = JSON.parse(lock);
          if (new Date(lockData.expiresAt) <= new Date()) {
            await redis.del(key);
            cleanedCount++;
          }
        }
      }

      // Clean up database locks
      await prisma.property.updateMany({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: {
            lte: new Date()
          }
        },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null
        }
      });

      await prisma.propertyUnit.updateMany({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: {
            lte: new Date()
          }
        },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null
        }
      });

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
      return 0;
    }
  }

  /**
   * Force release all locks for a user (admin function)
   */
  static async forceReleaseUserLocks(userId: string): Promise<number> {
    try {
      let releasedCount = 0;

      // Get all locks
      const allKeys = await redis.keys(`${this.LOCK_PREFIX}*`);
      const unitKeys = await redis.keys(`${this.UNIT_LOCK_PREFIX}*`);
      
      for (const key of [...allKeys, ...unitKeys]) {
        const lock = await redis.get(key);
        if (lock) {
          const lockData = JSON.parse(lock);
          if (lockData.userId === userId) {
            await redis.del(key);
            releasedCount++;
          }
        }
      }

      return releasedCount;
    } catch (error) {
      console.error('Error force releasing user locks:', error);
      return 0;
    }
  }
}