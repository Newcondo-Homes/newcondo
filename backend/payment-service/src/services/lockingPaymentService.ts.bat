import { PrismaClient, Prisma } from '@prisma/client';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import {
  PropertyLock,
  LockAcquisitionResult,
  PaymentLockRequest,
  PaymentLockRelease,
  LockStatus,
  LockAttemptStatus,
  LockMetrics
} from '../types/lockingPayment';

const prisma = new PrismaClient();

export class LockingPaymentService {
  private redis: Redis;
  private readonly LOCK_PREFIX = 'payment:lock:';
  private readonly LOCK_METRICS_KEY = 'payment:lock:metrics';
  private readonly DEFAULT_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  /**
   * Attempt to acquire a payment lock for a property/unit
   */
  async acquireLock(request: PaymentLockRequest): Promise<LockAcquisitionResult> {
    const lockKey = this.getLockKey(request.propertyId, request.unitId);
    const lockId = uuidv4();
    const lockDuration = request.lockDuration || this.DEFAULT_LOCK_DURATION;
    const expiresAt = new Date(Date.now() + lockDuration);

    try {
      // Check current lock status
      const currentLockStatus = await this.getLockStatus(request.propertyId, request.unitId);

      if (currentLockStatus.isLocked) {
        // Log failed attempt
        await this.logAttempt({
          userId: request.userId,
          propertyId: request.propertyId,
          unitId: request.unitId,
          amount: request.amount,
          status: LockAttemptStatus.ALREADY_LOCKED,
          lockAcquired: false,
          failureReason: `Property already locked by user ${currentLockStatus.lockedBy}`
        });

        return {
          success: false,
          reason: 'Property is currently locked by another user',
          waitTime: currentLockStatus.timeRemaining
        };
      }

      // Try to acquire lock using Redis SET NX (set if not exists)
      const lockData: PropertyLock = {
        propertyId: request.propertyId,
        unitId: request.unitId,
        userId: request.userId,
        lockId,
        expiresAt,
        createdAt: new Date()
      };

      const lockSet = await this.redis.set(
        lockKey,
        JSON.stringify(lockData),
        'PX',
        lockDuration,
        'NX'
      );

      if (!lockSet) {
        await this.logAttempt({
          userId: request.userId,
          propertyId: request.propertyId,
          unitId: request.unitId,
          amount: request.amount,
          status: LockAttemptStatus.FAILED,
          lockAcquired: false,
          failureReason: 'Failed to acquire lock - race condition'
        });

        return {
          success: false,
          reason: 'Failed to acquire lock, please try again'
        };
      }

      // Update database lock status
      await this.updateDatabaseLock(request.propertyId, request.unitId, true, expiresAt);

      // Log successful lock acquisition
      await this.logAttempt({
        userId: request.userId,
        propertyId: request.propertyId,
        unitId: request.unitId,
        amount: request.amount,
        status: LockAttemptStatus.LOCKED,
        lockAcquired: true,
        lockDuration
      });

      // Update metrics
      await this.incrementMetric('successfulLocks');

      return {
        success: true,
        lockId
      };
    } catch (error) {
      console.error('Error acquiring payment lock:', error);
      
      await this.logAttempt({
        userId: request.userId,
        propertyId: request.propertyId,
        unitId: request.unitId,
        amount: request.amount,
        status: LockAttemptStatus.FAILED,
        lockAcquired: false,
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        reason: 'Internal error acquiring lock'
      };
    }
  }

  /**
   * Release a payment lock
   */
  async releaseLock(release: PaymentLockRelease): Promise<boolean> {
    const lockKey = this.getLockKey(release.propertyId, release.unitId);

    try {
      // Get current lock
      const lockData = await this.redis.get(lockKey);
      
      if (!lockData) {
        return true; // Lock already expired
      }

      const lock: PropertyLock = JSON.parse(lockData);

      // Verify lock ownership
      if (lock.lockId !== release.lockId || lock.userId !== release.userId) {
        console.warn('Attempted to release lock not owned by user', {
          lockId: release.lockId,
          userId: release.userId,
          actualLockId: lock.lockId,
          actualUserId: lock.userId
        });
        return false;
      }

      // Delete lock from Redis
      await this.redis.del(lockKey);

      // Update database
      await this.updateDatabaseLock(release.propertyId, release.unitId, false);

      // Log release
      await this.logAttempt({
        userId: release.userId,
        propertyId: release.propertyId,
        unitId: release.unitId,
        amount: new Prisma.Decimal(0),
        status: release.reason === 'SUCCESS' ? LockAttemptStatus.SUCCESS : LockAttemptStatus.FAILED,
        lockAcquired: false,
        failureReason: release.reason !== 'SUCCESS' ? release.reason : undefined
      });

      return true;
    } catch (error) {
      console.error('Error releasing payment lock:', error);
      return false;
    }
  }

  /**
   * Get current lock status for a property/unit
   */
  async getLockStatus(propertyId: string, unitId?: string): Promise<LockStatus> {
    const lockKey = this.getLockKey(propertyId, unitId);

    try {
      const lockData = await this.redis.get(lockKey);

      if (!lockData) {
        return { isLocked: false };
      }

      const lock: PropertyLock = JSON.parse(lockData);
      const now = Date.now();
      const expiresAt = new Date(lock.expiresAt).getTime();
      const timeRemaining = Math.max(0, expiresAt - now);

      if (timeRemaining === 0) {
        // Lock has expired, clean it up
        await this.redis.del(lockKey);
        return { isLocked: false };
      }

      return {
        isLocked: true,
        lockedBy: lock.userId,
        lockId: lock.lockId,
        expiresAt: lock.expiresAt,
        timeRemaining
      };
    } catch (error) {
      console.error('Error getting lock status:', error);
      return { isLocked: false };
    }
  }

  /**
   * Extend lock duration
   */
  async extendLock(
    lockId: string,
    propertyId: string,
    unitId: string | undefined,
    extensionMs: number
  ): Promise<boolean> {
    const lockKey = this.getLockKey(propertyId, unitId);

    try {
      const lockData = await this.redis.get(lockKey);
      
      if (!lockData) {
        return false;
      }

      const lock: PropertyLock = JSON.parse(lockData);

      if (lock.lockId !== lockId) {
        return false;
      }

      const newExpiresAt = new Date(Date.now() + extensionMs);
      lock.expiresAt = newExpiresAt;

      await this.redis.set(lockKey, JSON.stringify(lock), 'PX', extensionMs);
      await this.updateDatabaseLock(propertyId, unitId, true, newExpiresAt);

      return true;
    } catch (error) {
      console.error('Error extending lock:', error);
      return false;
    }
  }

  /**
   * Get lock metrics
   */
  async getMetrics(): Promise<LockMetrics> {
    try {
      const metrics = await this.redis.hgetall(this.LOCK_METRICS_KEY);
      
      return {
        totalAttempts: parseInt(metrics.totalAttempts || '0'),
        successfulLocks: parseInt(metrics.successfulLocks || '0'),
        failedLocks: parseInt(metrics.failedLocks || '0'),
        averageLockDuration: parseFloat(metrics.averageLockDuration || '0'),
        currentActiveLocks: await this.countActiveLocks()
      };
    } catch (error) {
      console.error('Error getting lock metrics:', error);
      return {
        totalAttempts: 0,
        successfulLocks: 0,
        failedLocks: 0,
        averageLockDuration: 0,
        currentActiveLocks: 0
      };
    }
  }

  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.LOCK_PREFIX}*`);
      let cleaned = 0;

      for (const key of keys) {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const lock: PropertyLock = JSON.parse(lockData);
          if (new Date(lock.expiresAt) < new Date()) {
            await this.redis.del(key);
            await this.updateDatabaseLock(lock.propertyId, lock.unitId, false);
            cleaned++;
          }
        }
      }

      return cleaned;
    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
      return 0;
    }
  }

  // Private helper methods

  private getLockKey(propertyId: string, unitId?: string): string {
    return `${this.LOCK_PREFIX}${propertyId}${unitId ? `:${unitId}` : ''}`;
  }

  private async updateDatabaseLock(
    propertyId: string,
    unitId: string | undefined,
    isLocked: boolean,
    expiresAt?: Date
  ): Promise<void> {
    try {
      if (unitId) {
        // Update unit lock
        await prisma.propertyUnit.update({
          where: { id: unitId },
          data: {
            isPaymentLocked: isLocked,
            paymentLockExpiry: expiresAt || null
          }
        });
      } else {
        // Update property lock
        await prisma.property.update({
          where: { id: propertyId },
          data: {
            isPaymentLocked: isLocked,
            paymentLockExpiry: expiresAt || null
          }
        });
      }
    } catch (error) {
      console.error('Error updating database lock:', error);
    }
  }

  private async logAttempt(data: {
    userId: string;
    propertyId: string;
    unitId?: string;
    amount: Prisma.Decimal;
    status: LockAttemptStatus;
    lockAcquired: boolean;
    lockDuration?: number;
    failureReason?: string;
  }): Promise<void> {
    try {
      await prisma.paymentAttemptLog.create({
        data: {
          userId: data.userId,
          propertyId: data.propertyId,
          unitId: data.unitId,
          amount: data.amount,
          status: data.status,
          lockAcquired: data.lockAcquired,
          lockDuration: data.lockDuration,
          failureReason: data.failureReason
        }
      });

      await this.incrementMetric('totalAttempts');
      if (!data.lockAcquired) {
        await this.incrementMetric('failedLocks');
      }
    } catch (error) {
      console.error('Error logging payment attempt:', error);
    }
  }

  private async incrementMetric(metric: string): Promise<void> {
    try {
      await this.redis.hincrby(this.LOCK_METRICS_KEY, metric, 1);
    } catch (error) {
      console.error('Error incrementing metric:', error);
    }
  }

  private async countActiveLocks(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.LOCK_PREFIX}*`);
      return keys.length;
    } catch (error) {
      console.error('Error counting active locks:', error);
      return 0;
    }
  }
}