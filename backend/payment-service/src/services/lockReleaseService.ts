import { PrismaClient, PropertyStructure } from '@newcondo/db';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface LockInfo {
  propertyId: string;
  unitId?: string;
  userId: string;
  acquiredAt: Date;
  expiresAt: Date;
}

interface ReleaseResult {
  success: boolean;
  message: string;
  lockInfo?: LockInfo;
}

export class LockReleaseService {
  private readonly LOCK_PREFIX = 'payment:lock:';
  private readonly LOCK_EXPIRY_SECONDS = 300; // 5 minutes

  /**
   * Release payment lock on failure or timeout
   */
  async releaseLock(
    propertyId: string,
    unitId?: string,
    reason?: string
  ): Promise<ReleaseResult> {
    try {
      const lockKey = this.getLockKey(propertyId, unitId);

      // Get lock info before releasing
      const lockData = await redis.get(lockKey);
      const lockInfo: LockInfo | undefined = lockData
        ? JSON.parse(lockData)
        : undefined;

      // Release Redis lock
      await redis.del(lockKey);

      // Release database lock
      await this.releaseDatabaseLock(propertyId, unitId);

      console.log(
        `Lock released for ${lockKey}${reason ? ` - Reason: ${reason}` : ''}`
      );

      return {
        success: true,
        message: 'Lock released successfully',
        lockInfo,
      };
    } catch (error) {
      console.error('Lock release error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Release database lock for property or unit
   */
  private async releaseDatabaseLock(
    propertyId: string,
    unitId?: string
  ): Promise<void> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { structure: true },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Handle multi-family unit lock
    if (property.structure === PropertyStructure.MULTI_FAMILY && unitId) {
      await prisma.propertyUnit.update({
        where: { id: unitId },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });
    } else {
      // Handle single unit property lock
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });
    }
  }

  /**
   * Force release expired locks
   */
  async releaseExpiredLocks(): Promise<number> {
    try {
      const now = new Date();
      let releasedCount = 0;

      // Release expired property locks
      const expiredProperties = await prisma.property.findMany({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: {
            lt: now,
          },
        },
        select: {
          id: true,
          paymentLockExpiry: true,
        },
      });

      for (const property of expiredProperties) {
        await this.releaseLock(property.id, undefined, 'Lock expired');
        releasedCount++;
      }

      // Release expired unit locks
      const expiredUnits = await prisma.propertyUnit.findMany({
        where: {
          isPaymentLocked: true,
          paymentLockExpiry: {
            lt: now,
          },
        },
        select: {
          id: true,
          propertyId: true,
          paymentLockExpiry: true,
        },
      });

      for (const unit of expiredUnits) {
        await this.releaseLock(unit.propertyId, unit.id, 'Lock expired');
        releasedCount++;
      }

      // Clean up Redis locks
      const redisKeys = await redis.keys(`${this.LOCK_PREFIX}*`);
      for (const key of redisKeys) {
        const lockData = await redis.get(key);
        if (lockData) {
          const lock: LockInfo = JSON.parse(lockData);
          if (new Date(lock.expiresAt) < now) {
            await redis.del(key);
            releasedCount++;
          }
        }
      }

      console.log(`Released ${releasedCount} expired locks`);
      return releasedCount;
    } catch (error) {
      console.error('Error releasing expired locks:', error);
      return 0;
    }
  }

  /**
   * Check if lock exists and is valid
   */
  async isLocked(propertyId: string, unitId?: string): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(propertyId, unitId);
      const lockData = await redis.get(lockKey);

      if (!lockData) {
        return false;
      }

      const lock: LockInfo = JSON.parse(lockData);
      const isExpired = new Date(lock.expiresAt) < new Date();

      if (isExpired) {
        await this.releaseLock(propertyId, unitId, 'Lock expired during check');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Lock check error:', error);
      return false;
    }
  }

  /**
   * Get lock information
   */
  async getLockInfo(
    propertyId: string,
    unitId?: string
  ): Promise<LockInfo | null> {
    try {
      const lockKey = this.getLockKey(propertyId, unitId);
      const lockData = await redis.get(lockKey);

      if (!lockData) {
        return null;
      }

      const lock: LockInfo = JSON.parse(lockData);
      const isExpired = new Date(lock.expiresAt) < new Date();

      if (isExpired) {
        await this.releaseLock(propertyId, unitId, 'Lock expired');
        return null;
      }

      return lock;
    } catch (error) {
      console.error('Get lock info error:', error);
      return null;
    }
  }

  /**
   * Extend lock expiry (for long-running payment processes)
   */
  async extendLock(
    propertyId: string,
    userId: string,
    unitId?: string,
    additionalSeconds: number = 300
  ): Promise<ReleaseResult> {
    try {
      const lockKey = this.getLockKey(propertyId, unitId);
      const lockData = await redis.get(lockKey);

      if (!lockData) {
        return {
          success: false,
          message: 'Lock not found',
        };
      }

      const lock: LockInfo = JSON.parse(lockData);

      // Verify lock ownership
      if (lock.userId !== userId) {
        return {
          success: false,
          message: 'Not authorized to extend this lock',
        };
      }

      // Extend expiry
      const newExpiresAt = new Date(
        Date.now() + additionalSeconds * 1000
      );
      lock.expiresAt = newExpiresAt;

      await redis.setex(
        lockKey,
        additionalSeconds,
        JSON.stringify(lock)
      );

      // Update database expiry
      const dbExpiresAt = new Date(Date.now() + additionalSeconds * 1000);
      if (unitId) {
        await prisma.propertyUnit.update({
          where: { id: unitId },
          data: { paymentLockExpiry: dbExpiresAt },
        });
      } else {
        await prisma.property.update({
          where: { id: propertyId },
          data: { paymentLockExpiry: dbExpiresAt },
        });
      }

      return {
        success: true,
        message: 'Lock extended successfully',
        lockInfo: lock,
      };
    } catch (error) {
      console.error('Lock extension error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Release all locks for a user (cleanup on logout/session end)
   */
  async releaseUserLocks(userId: string): Promise<number> {
    try {
      let releasedCount = 0;
      const redisKeys = await redis.keys(`${this.LOCK_PREFIX}*`);

      for (const key of redisKeys) {
        const lockData = await redis.get(key);
        if (lockData) {
          const lock: LockInfo = JSON.parse(lockData);
          if (lock.userId === userId) {
            await this.releaseLock(
              lock.propertyId,
              lock.unitId,
              'User session ended'
            );
            releasedCount++;
          }
        }
      }

      return releasedCount;
    } catch (error) {
      console.error('Error releasing user locks:', error);
      return 0;
    }
  }

  /**
   * Generate lock key for Redis
   */
  private getLockKey(propertyId: string, unitId?: string): string {
    return unitId
      ? `${this.LOCK_PREFIX}${propertyId}:${unitId}`
      : `${this.LOCK_PREFIX}${propertyId}`;
  }
}

export const lockReleaseService = new LockReleaseService();