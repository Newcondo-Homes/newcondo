// backend/payment-service/src/services/lockingService.ts
import { PrismaClient } from '@newcondo/db';
import { Redis } from 'ioredis';
import { addMinutes, isPast } from 'date-fns';

interface PropertyLockData {
  propertyId: string;
  unitId?: string;
  userId: string;
  expiresAt: Date;
  paymentIntentId?: string;
}

interface LockResult {
  success: boolean;
  lockId?: string;
  expiresAt?: Date;
  remainingTime?: number;
  error?: string;
}

interface ExtendLockResult {
  success: boolean;
  newExpiresAt?: Date;
  error?: string;
}

export class LockingService {
  private prisma: PrismaClient;
  private redis: Redis;
  private readonly LOCK_DURATION_MINUTES = 30; // 30 minutes lock duration
  private readonly LOCK_KEY_PREFIX = 'property_lock:';
  private readonly USER_LOCK_PREFIX = 'user_locks:';

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Acquire a lock on a property/unit for payment processing
   */
  async acquireLock(data: {
    propertyId: string;
    unitId?: string;
    userId: string;
    paymentIntentId?: string;
  }): Promise<LockResult> {
    const { propertyId, unitId, userId, paymentIntentId } = data;
    const lockKey = this.getLockKey(propertyId, unitId);
    const userLockKey = this.getUserLockKey(userId);
    const expiresAt = addMinutes(new Date(), this.LOCK_DURATION_MINUTES);

    try {
      // Check if property/unit is already locked
      const existingLock = await this.redis.get(lockKey);
      if (existingLock) {
        const lockData: PropertyLockData = JSON.parse(existingLock);
        
        // If locked by same user, extend the lock
        if (lockData.userId === userId) {
          return this.extendLock(propertyId, unitId, userId);
        }
        
        // Check if lock has expired
        if (!isPast(new Date(lockData.expiresAt))) {
          return {
            success: false,
            error: 'Property is currently locked by another user'
          };
        }
      }

      // Check if user has too many active locks (prevent abuse)
      const userLocks = await this.getUserActiveLocks(userId);
      if (userLocks.length >= 3) {
        return {
          success: false,
          error: 'User has reached maximum concurrent locks limit'
        };
      }

      // Create lock data
      const lockData: PropertyLockData = {
        propertyId,
        unitId,
        userId,
        expiresAt,
        paymentIntentId
      };

      // Set the lock in Redis with expiration
      const lockDurationSeconds = this.LOCK_DURATION_MINUTES * 60;
      await this.redis.setex(lockKey, lockDurationSeconds, JSON.stringify(lockData));

      // Add to user's active locks
      await this.redis.sadd(userLockKey, lockKey);
      await this.redis.expire(userLockKey, lockDurationSeconds);

      // Update database lock status
      if (unitId) {
        await this.prisma.propertyUnit.update({
          where: { id: unitId },
          data: {
            isPaymentLocked: true,
            paymentLockExpiry: expiresAt
          }
        });
      } else {
        await this.prisma.property.update({
          where: { id: propertyId },
          data: {
            isPaymentLocked: true,
            paymentLockExpiry: expiresAt
          }
        });
      }

      return {
        success: true,
        lockId: lockKey,
        expiresAt,
        remainingTime: this.LOCK_DURATION_MINUTES * 60 * 1000 // milliseconds
      };

    } catch (error) {
      console.error('Error acquiring lock:', error);
      return {
        success: false,
        error: 'Failed to acquire lock'
      };
    }
  }

  /**
   * Release a lock on a property/unit
   */
  async releaseLock(propertyId: string, unitId?: string, userId?: string): Promise<boolean> {
    const lockKey = this.getLockKey(propertyId, unitId);

    try {
      const existingLock = await this.redis.get(lockKey);
      if (!existingLock) {
        return true; // Lock doesn't exist, consider as released
      }

      const lockData: PropertyLockData = JSON.parse(existingLock);

      // If userId provided, verify ownership
      if (userId && lockData.userId !== userId) {
        return false;
      }

      // Remove from Redis
      await this.redis.del(lockKey);

      // Remove from user's active locks
      if (lockData.userId) {
        const userLockKey = this.getUserLockKey(lockData.userId);
        await this.redis.srem(userLockKey, lockKey);
      }

      // Update database lock status
      if (unitId) {
        await this.prisma.propertyUnit.update({
          where: { id: unitId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null
          }
        });
      } else {
        await this.prisma.property.update({
          where: { id: propertyId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null
          }
        });
      }

      return true;

    } catch (error) {
      console.error('Error releasing lock:', error);
      return false;
    }
  }

  /**
   * Extend an existing lock
   */
  async extendLock(propertyId: string, unitId?: string, userId?: string): Promise<ExtendLockResult> {
    const lockKey = this.getLockKey(propertyId, unitId);

    try {
      const existingLock = await this.redis.get(lockKey);
      if (!existingLock) {
        return {
          success: false,
          error: 'No active lock found'
        };
      }

      const lockData: PropertyLockData = JSON.parse(existingLock);

      // Verify ownership if userId provided
      if (userId && lockData.userId !== userId) {
        return {
          success: false,
          error: 'Lock belongs to different user'
        };
      }

      // Extend expiration
      const newExpiresAt = addMinutes(new Date(), this.LOCK_DURATION_MINUTES);
      lockData.expiresAt = newExpiresAt;

      const lockDurationSeconds = this.LOCK_DURATION_MINUTES * 60;
      await this.redis.setex(lockKey, lockDurationSeconds, JSON.stringify(lockData));

      // Update database
      if (unitId) {
        await this.prisma.propertyUnit.update({
          where: { id: unitId },
          data: { paymentLockExpiry: newExpiresAt }
        });
      } else {
        await this.prisma.property.update({
          where: { id: propertyId },
          data: { paymentLockExpiry: newExpiresAt }
        });
      }

      return {
        success: true,
        newExpiresAt
      };

    } catch (error) {
      console.error('Error extending lock:', error);
      return {
        success: false,
        error: 'Failed to extend lock'
      };
    }
  }

  /**
   * Check if property/unit is locked
   */
  async isLocked(propertyId: string, unitId?: string): Promise<{
    locked: boolean;
    lockData?: PropertyLockData;
    remainingTime?: number;
  }> {
    const lockKey = this.getLockKey(propertyId, unitId);

    try {
      const existingLock = await this.redis.get(lockKey);
      if (!existingLock) {
        return { locked: false };
      }

      const lockData: PropertyLockData = JSON.parse(existingLock);

      // Check if expired
      if (isPast(new Date(lockData.expiresAt))) {
        await this.releaseLock(propertyId, unitId);
        return { locked: false };
      }

      const remainingTime = new Date(lockData.expiresAt).getTime() - Date.now();

      return {
        locked: true,
        lockData,
        remainingTime
      };

    } catch (error) {
      console.error('Error checking lock status:', error);
      return { locked: false };
    }
  }

  /**
   * Get all active locks for a user
   */
  async getUserActiveLocks(userId: string): Promise<PropertyLockData[]> {
    const userLockKey = this.getUserLockKey(userId);

    try {
      const lockKeys = await this.redis.smembers(userLockKey);
      const locks: PropertyLockData[] = [];

      for (const lockKey of lockKeys) {
        const lockData = await this.redis.get(lockKey);
        if (lockData) {
          const parsed: PropertyLockData = JSON.parse(lockData);
          
          // Check if expired
          if (isPast(new Date(parsed.expiresAt))) {
            await this.redis.srem(userLockKey, lockKey);
            await this.redis.del(lockKey);
            continue;
          }

          locks.push(parsed);
        }
      }

      return locks;

    } catch (error) {
      console.error('Error getting user locks:', error);
      return [];
    }
  }

  /**
   * Release all expired locks (cleanup job)
   */
  async cleanupExpiredLocks(): Promise<number> {
    let cleanedCount = 0;

    try {
      // Get all lock keys
      const lockPattern = `${this.LOCK_KEY_PREFIX}*`;
      const lockKeys = await this.redis.keys(lockPattern);

      for (const lockKey of lockKeys) {
        const lockData = await this.redis.get(lockKey);
        if (lockData) {
          const parsed: PropertyLockData = JSON.parse(lockData);
          
          if (isPast(new Date(parsed.expiresAt))) {
            await this.releaseLock(parsed.propertyId, parsed.unitId);
            cleanedCount++;
          }
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired locks`);
      return cleanedCount;

    } catch (error) {
      console.error('Error during lock cleanup:', error);
      return 0;
    }
  }

  /**
   * Force release lock (admin function)
   */
  async forceReleaseLock(propertyId: string, unitId?: string): Promise<boolean> {
    return this.releaseLock(propertyId, unitId);
  }

  /**
   * Get lock statistics
   */
  async getLockStatistics(): Promise<{
    totalActiveLocks: number;
    locksByUser: Record<string, number>;
    expiringSoon: number; // locks expiring within 5 minutes
  }> {
    try {
      const lockPattern = `${this.LOCK_KEY_PREFIX}*`;
      const lockKeys = await this.redis.keys(lockPattern);
      
      const locksByUser: Record<string, number> = {};
      let expiringSoon = 0;
      const fiveMinutesFromNow = addMinutes(new Date(), 5);

      for (const lockKey of lockKeys) {
        const lockData = await this.redis.get(lockKey);
        if (lockData) {
          const parsed: PropertyLockData = JSON.parse(lockData);
          
          // Count by user
          locksByUser[parsed.userId] = (locksByUser[parsed.userId] || 0) + 1;
          
          // Count expiring soon
          if (new Date(parsed.expiresAt) <= fiveMinutesFromNow) {
            expiringSoon++;
          }
        }
      }

      return {
        totalActiveLocks: lockKeys.length,
        locksByUser,
        expiringSoon
      };

    } catch (error) {
      console.error('Error getting lock statistics:', error);
      return {
        totalActiveLocks: 0,
        locksByUser: {},
        expiringSoon: 0
      };
    }
  }

  private getLockKey(propertyId: string, unitId?: string): string {
    return `${this.LOCK_KEY_PREFIX}${propertyId}${unitId ? `:${unitId}` : ''}`;
  }

  private getUserLockKey(userId: string): string {
    return `${this.USER_LOCK_PREFIX}${userId}`;
  }
}

export default LockingService;