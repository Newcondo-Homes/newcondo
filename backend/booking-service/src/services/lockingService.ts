import { PrismaClient, Property, PropertyUnit } from '@newcondo/db';
import { Redis } from 'ioredis';
import { 
  PropertyLock, 
  LockAcquisitionResult, 
  LockReleaseResult,
  LockStatus 
} from '../types/locking';

export class LockingService {
  private prisma: PrismaClient;
  private redis: Redis;
  private readonly LOCK_TTL = 900; // 15 minutes in seconds
  private readonly LOCK_PREFIX = 'property:lock:';

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Acquire a distributed lock for a property or unit
   */
  async acquireLock(
    userId: string,
    propertyId: string,
    unitId?: string
  ): Promise<LockAcquisitionResult> {
    const lockKey = this.getLockKey(propertyId, unitId);
    const lockValue = this.generateLockValue(userId);
    const startTime = Date.now();

    try {
      // Try to acquire Redis lock using SET NX EX
      const acquired = await this.redis.set(
        lockKey,
        lockValue,
        'EX',
        this.LOCK_TTL,
        'NX'
      );

      if (!acquired) {
        // Lock already held by someone else
        const currentHolder = await this.redis.get(lockKey);
        const ttl = await this.redis.ttl(lockKey);

        return {
          success: false,
          lockId: null,
          expiresAt: null,
          message: 'Property is currently locked by another user',
          currentHolder: currentHolder || undefined,
          remainingTTL: ttl > 0 ? ttl : undefined
        };
      }

      // Update database lock status
      const expiresAt = new Date(Date.now() + this.LOCK_TTL * 1000);
      
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

      const duration = Date.now() - startTime;

      // Log successful lock acquisition
      await this.logLockAttempt(
        userId,
        propertyId,
        unitId,
        true,
        duration,
        'SUCCESS'
      );

      return {
        success: true,
        lockId: lockValue,
        expiresAt,
        message: 'Lock acquired successfully',
        lockDuration: duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      await this.logLockAttempt(
        userId,
        propertyId,
        unitId,
        false,
        duration,
        'ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw new Error(`Failed to acquire lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Release a lock held by a user
   */
  async releaseLock(
    userId: string,
    propertyId: string,
    unitId?: string,
    lockId?: string
  ): Promise<LockReleaseResult> {
    const lockKey = this.getLockKey(propertyId, unitId);

    try {
      // Verify lock ownership if lockId provided
      if (lockId) {
        const currentLock = await this.redis.get(lockKey);
        if (currentLock !== lockId) {
          return {
            success: false,
            message: 'Lock not owned by this user or already released'
          };
        }
      }

      // Release Redis lock
      await this.redis.del(lockKey);

      // Update database
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

      return {
        success: true,
        message: 'Lock released successfully'
      };

    } catch (error) {
      throw new Error(`Failed to release lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a property/unit is currently locked
   */
  async checkLockStatus(
    propertyId: string,
    unitId?: string
  ): Promise<LockStatus> {
    const lockKey = this.getLockKey(propertyId, unitId);

    try {
      const lockValue = await this.redis.get(lockKey);
      const ttl = await this.redis.ttl(lockKey);

      if (!lockValue || ttl <= 0) {
        return {
          isLocked: false,
          lockedBy: null,
          expiresAt: null,
          remainingSeconds: 0
        };
      }

      const userId = this.extractUserIdFromLockValue(lockValue);
      const expiresAt = new Date(Date.now() + ttl * 1000);

      return {
        isLocked: true,
        lockedBy: userId,
        expiresAt,
        remainingSeconds: ttl
      };

    } catch (error) {
      throw new Error(`Failed to check lock status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extend an existing lock
   */
  async extendLock(
    userId: string,
    propertyId: string,
    unitId?: string,
    lockId?: string,
    additionalSeconds: number = 300
  ): Promise<LockAcquisitionResult> {
    const lockKey = this.getLockKey(propertyId, unitId);

    try {
      // Verify ownership
      const currentLock = await this.redis.get(lockKey);
      if (!currentLock || (lockId && currentLock !== lockId)) {
        return {
          success: false,
          lockId: null,
          expiresAt: null,
          message: 'Cannot extend lock: not owned by this user'
        };
      }

      // Extend TTL
      const currentTTL = await this.redis.ttl(lockKey);
      const newTTL = currentTTL + additionalSeconds;
      await this.redis.expire(lockKey, newTTL);

      // Update database
      const expiresAt = new Date(Date.now() + newTTL * 1000);
      
      if (unitId) {
        await this.prisma.propertyUnit.update({
          where: { id: unitId },
          data: { paymentLockExpiry: expiresAt }
        });
      } else {
        await this.prisma.property.update({
          where: { id: propertyId },
          data: { paymentLockExpiry: expiresAt }
        });
      }

      return {
        success: true,
        lockId: currentLock,
        expiresAt,
        message: `Lock extended by ${additionalSeconds} seconds`
      };

    } catch (error) {
      throw new Error(`Failed to extend lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired locks (should be run periodically)
   */
  async cleanupExpiredLocks(): Promise<number> {
    try {
      const now = new Date();
      
      // Clean up expired property locks
      const expiredProperties = await this.prisma.property.updateMany({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: {
            lt: now
          }
        },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null
        }
      });

      // Clean up expired unit locks
      const expiredUnits = await this.prisma.propertyUnit.updateMany({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: {
            lt: now
          }
        },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null
        }
      });

      const totalCleaned = expiredProperties.count + expiredUnits.count;
      
      if (totalCleaned > 0) {
        console.log(`Cleaned up ${totalCleaned} expired locks`);
      }

      return totalCleaned;

    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
      throw error;
    }
  }

  /**
   * Force release all locks for a user (admin function)
   */
  async forceReleaseUserLocks(userId: string): Promise<number> {
    try {
      // Find all Redis locks held by user
      const pattern = `${this.LOCK_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      let releasedCount = 0;
      for (const key of keys) {
        const lockValue = await this.redis.get(key);
        if (lockValue && this.extractUserIdFromLockValue(lockValue) === userId) {
          await this.redis.del(key);
          releasedCount++;
        }
      }

      // Update database
      await this.prisma.property.updateMany({
        where: { isPaymentLocked: true },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null
        }
      });

      await this.prisma.propertyUnit.updateMany({
        where: { isPaymentLocked: true },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null
        }
      });

      return releasedCount;

    } catch (error) {
      throw new Error(`Failed to force release locks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private getLockKey(propertyId: string, unitId?: string): string {
    return unitId 
      ? `${this.LOCK_PREFIX}${propertyId}:unit:${unitId}`
      : `${this.LOCK_PREFIX}${propertyId}`;
  }

  private generateLockValue(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${userId}:${timestamp}:${random}`;
  }

  private extractUserIdFromLockValue(lockValue: string): string {
    return lockValue.split(':')[0];
  }

  private async logLockAttempt(
    userId: string,
    propertyId: string,
    unitId: string | undefined,
    acquired: boolean,
    duration: number,
    status: string,
    failureReason?: string
  ): Promise<void> {
    try {
      await this.prisma.paymentAttemptLog.create({
        data: {
          userId,
          propertyId,
          unitId,
          amount: 0, // Not applicable for lock attempts
          status,
          failureReason,
          lockAcquired: acquired,
          lockDuration: duration
        }
      });
    } catch (error) {
      console.error('Failed to log lock attempt:', error);
      // Don't throw - logging failure shouldn't break the lock operation
    }
  }
}