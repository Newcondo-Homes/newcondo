import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

// Redis client for distributed locking
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export interface LockResult {
  success: boolean;
  lockId?: string;
  expiresAt?: Date;
  message?: string;
}

export interface LockOptions {
  ttl?: number; // Time to live in milliseconds (default: 15 minutes)
  retryAttempts?: number; // Number of retry attempts (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 100ms)
}

export class MutexService {
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private readonly DEFAULT_RETRY_DELAY = 100; // 100ms

  /**
   * Acquire a distributed lock using Redis
   */
  private async acquireRedisLock(
    key: string,
    lockId: string,
    ttlMs: number
  ): Promise<boolean> {
    try {
      // SET key value NX PX milliseconds
      // NX - Only set if key doesn't exist
      // PX - Set expiry in milliseconds
      const result = await redis.set(key, lockId, 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (error) {
      console.error('Redis lock acquisition error:', error);
      return false;
    }
  }

  /**
   * Release a distributed lock
   */
  private async releaseRedisLock(key: string, lockId: string): Promise<boolean> {
    try {
      // Lua script to ensure we only delete if we own the lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await redis.eval(script, 1, key, lockId);
      return result === 1;
    } catch (error) {
      console.error('Redis lock release error:', error);
      return false;
    }
  }

  /**
   * Generate a unique lock ID
   */
  private generateLockId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Acquire payment lock for a property
   */
  async acquirePropertyLock(
    propertyId: string,
    options: LockOptions = {}
  ): Promise<LockResult> {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const retryAttempts = options.retryAttempts || this.DEFAULT_RETRY_ATTEMPTS;
    const retryDelay = options.retryDelay || this.DEFAULT_RETRY_DELAY;

    const lockKey = `payment:lock:property:${propertyId}`;
    const lockId = this.generateLockId();
    const expiresAt = new Date(Date.now() + ttl);

    // Try to acquire Redis lock with retries
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      const acquired = await this.acquireRedisLock(lockKey, lockId, ttl);

      if (acquired) {
        // Update database
        try {
          await prisma.property.update({
            where: { id: propertyId },
            data: {
              isPaymentLocked: true,
              paymentLockExpiry: expiresAt,
            },
          });

          return {
            success: true,
            lockId,
            expiresAt,
            message: 'Lock acquired successfully',
          };
        } catch (dbError) {
          // Rollback Redis lock if DB update fails
          await this.releaseRedisLock(lockKey, lockId);
          return {
            success: false,
            message: 'Failed to update database lock status',
          };
        }
      }

      // Wait before retry
      if (attempt < retryAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    return {
      success: false,
      message: 'Failed to acquire lock after multiple attempts',
    };
  }

  /**
   * Acquire payment lock for a unit
   */
  async acquireUnitLock(
    unitId: string,
    options: LockOptions = {}
  ): Promise<LockResult> {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const retryAttempts = options.retryAttempts || this.DEFAULT_RETRY_ATTEMPTS;
    const retryDelay = options.retryDelay || this.DEFAULT_RETRY_DELAY;

    const lockKey = `payment:lock:unit:${unitId}`;
    const lockId = this.generateLockId();
    const expiresAt = new Date(Date.now() + ttl);

    // Try to acquire Redis lock with retries
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      const acquired = await this.acquireRedisLock(lockKey, lockId, ttl);

      if (acquired) {
        // Update database
        try {
          await prisma.propertyUnit.update({
            where: { id: unitId },
            data: {
              isPaymentLocked: true,
              paymentLockExpiry: expiresAt,
            },
          });

          return {
            success: true,
            lockId,
            expiresAt,
            message: 'Unit lock acquired successfully',
          };
        } catch (dbError) {
          // Rollback Redis lock if DB update fails
          await this.releaseRedisLock(lockKey, lockId);
          return {
            success: false,
            message: 'Failed to update database lock status',
          };
        }
      }

      // Wait before retry
      if (attempt < retryAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    return {
      success: false,
      message: 'Failed to acquire unit lock after multiple attempts',
    };
  }

  /**
   * Release payment lock for a property
   */
  async releasePropertyLock(propertyId: string, lockId: string): Promise<boolean> {
    const lockKey = `payment:lock:property:${propertyId}`;

    try {
      // Release Redis lock
      const redisReleased = await this.releaseRedisLock(lockKey, lockId);

      // Update database regardless of Redis result
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });

      return redisReleased;
    } catch (error) {
      console.error('Error releasing property lock:', error);
      return false;
    }
  }

  /**
   * Release payment lock for a unit
   */
  async releaseUnitLock(unitId: string, lockId: string): Promise<boolean> {
    const lockKey = `payment:lock:unit:${unitId}`;

    try {
      // Release Redis lock
      const redisReleased = await this.releaseRedisLock(lockKey, lockId);

      // Update database regardless of Redis result
      await prisma.propertyUnit.update({
        where: { id: unitId },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });

      return redisReleased;
    } catch (error) {
      console.error('Error releasing unit lock:', error);
      return false;
    }
  }

  /**
   * Extend an existing lock
   */
  async extendLock(
    key: string,
    lockId: string,
    additionalTtlMs: number
  ): Promise<boolean> {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;
      const result = await redis.eval(script, 1, key, lockId, additionalTtlMs);
      return result === 1;
    } catch (error) {
      console.error('Error extending lock:', error);
      return false;
    }
  }

  /**
   * Clean up expired locks in database
   */
  async cleanupExpiredLocks(): Promise<void> {
    const now = new Date();

    try {
      // Clean up expired property locks
      await prisma.property.updateMany({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: { lt: now },
        },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });

      // Clean up expired unit locks
      await prisma.propertyUnit.updateMany({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: { lt: now },
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
  }

  /**
   * Check if a lock exists
   */
  async isLocked(key: string): Promise<boolean> {
    try {
      const value = await redis.get(key);
      return value !== null;
    } catch (error) {
      console.error('Error checking lock status:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a lock
   */
  async getLockTTL(key: string): Promise<number> {
    try {
      const ttl = await redis.pttl(key);
      return ttl > 0 ? ttl : 0;
    } catch (error) {
      console.error('Error getting lock TTL:', error);
      return 0;
    }
  }
}

export const mutexService = new MutexService();

// Schedule cleanup job every 5 minutes
setInterval(() => {
  mutexService.cleanupExpiredLocks();
}, 5 * 60 * 1000);