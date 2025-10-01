import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { LOCK_DURATIONS } from '../constants/lockDurations';

export interface LockInfo {
  lockId: string;
  userId: string;
  acquiredAt: number;
  expiresAt: number;
}

/**
 * Property Lock Manager using Redis for distributed locking
 */
export class PropertyLockManager {
  private static instance: PropertyLockManager;
  private redis: Redis;
  private readonly lockPrefix = 'lock:';

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  public static getInstance(): PropertyLockManager {
    if (!PropertyLockManager.instance) {
      PropertyLockManager.instance = new PropertyLockManager();
    }
    return PropertyLockManager.instance;
  }

  /**
   * Acquire a lock for a property or unit
   */
  async acquireLock(
    resourceKey: string,
    userId: string,
    ttl: number = LOCK_DURATIONS.PAYMENT_LOCK
  ): Promise<string | null> {
    const lockId = uuidv4();
    const lockKey = `${this.lockPrefix}${resourceKey}`;
    const now = Date.now();

    const lockInfo: LockInfo = {
      lockId,
      userId,
      acquiredAt: now,
      expiresAt: now + ttl,
    };

    // Use SET NX (set if not exists) with expiration
    const result = await this.redis.set(
      lockKey,
      JSON.stringify(lockInfo),
      'PX',
      ttl,
      'NX'
    );

    return result === 'OK' ? lockId : null;
  }

  /**
   * Release a lock
   */
  async releaseLock(resourceKey: string, lockId: string): Promise<boolean> {
    const lockKey = `${this.lockPrefix}${resourceKey}`;
    const lockData = await this.redis.get(lockKey);

    if (!lockData) {
      return false;
    }

    const lockInfo: LockInfo = JSON.parse(lockData);

    // Only allow the lock owner to release it
    if (lockInfo.lockId !== lockId) {
      return false;
    }

    await this.redis.del(lockKey);
    return true;
  }

  /**
   * Check if a resource is locked
   */
  async isLocked(resourceKey: string): Promise<boolean> {
    const lockKey = `${this.lockPrefix}${resourceKey}`;
    const exists = await this.redis.exists(lockKey);
    return exists === 1;
  }

  /**
   * Get lock information
   */
  async getLockInfo(resourceKey: string): Promise<LockInfo | null> {
    const lockKey = `${this.lockPrefix}${resourceKey}`;
    const lockData = await this.redis.get(lockKey);

    if (!lockData) {
      return null;
    }

    return JSON.parse(lockData);
  }

  /**
   * Extend lock duration
   */
  async extendLock(
    resourceKey: string,
    lockId: string,
    additionalTtl: number
  ): Promise<boolean> {
    const lockKey = `${this.lockPrefix}${resourceKey}`;
    const lockData = await this.redis.get(lockKey);

    if (!lockData) {
      return false;
    }

    const lockInfo: LockInfo = JSON.parse(lockData);

    // Verify lock ownership
    if (lockInfo.lockId !== lockId) {
      return false;
    }

    // Extend expiration
    lockInfo.expiresAt += additionalTtl;
    await this.redis.set(
      lockKey,
      JSON.stringify(lockInfo),
      'PX',
      lockInfo.expiresAt - Date.now()
    );

    return true;
  }

  /**
   * Force release a lock (admin function)
   */
  async forceReleaseLock(resourceKey: string): Promise<boolean> {
    const lockKey = `${this.lockPrefix}${resourceKey}`;
    const result = await this.redis.del(lockKey);
    return result === 1;
  }

  /**
   * Cleanup expired locks
   */
  async cleanupExpiredLocks(): Promise<number> {
    const pattern = `${this.lockPrefix}*`;
    const keys = await this.redis.keys(pattern);
    let cleanedCount = 0;

    for (const key of keys) {
      const lockData = await this.redis.get(key);
      if (!lockData) continue;

      const lockInfo: LockInfo = JSON.parse(lockData);
      if (Date.now() > lockInfo.expiresAt) {
        await this.redis.del(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get all active locks (admin function)
   */
  async getAllActiveLocks(): Promise<Map<string, LockInfo>> {
    const pattern = `${this.lockPrefix}*`;
    const keys = await this.redis.keys(pattern);
    const locks = new Map<string, LockInfo>();

    for (const key of keys) {
      const lockData = await this.redis.get(key);
      if (!lockData) continue;

      const resourceKey = key.replace(this.lockPrefix, '');
      locks.set(resourceKey, JSON.parse(lockData));
    }

    return locks;
  }
}