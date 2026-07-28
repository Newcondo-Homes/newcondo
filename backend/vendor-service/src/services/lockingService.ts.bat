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




// import { PrismaClient, PropertyUnit } from '@prisma/client';
// import { addMinutes } from 'date-fns';

// const prisma = new PrismaClient();

// export interface PropertyLock {
//   propertyId?: string;
//   unitId?: string;
//   userId: string;
//   lockDuration?: number; // minutes, default 15
// }

// export interface LockResult {
//   success: boolean;
//   lockExpiry?: Date;
//   message: string;
//   alreadyLocked?: boolean;
//   lockedBy?: string;
// }

// export class LockingService {
//   private static readonly DEFAULT_LOCK_DURATION = 15; // 15 minutes

//   /**
//    * Acquire a payment lock on a property or unit
//    */
//   static async acquirePaymentLock({
//     propertyId,
//     unitId,
//     userId,
//     lockDuration = this.DEFAULT_LOCK_DURATION
//   }: PropertyLock): Promise<LockResult> {
//     try {
//       const lockExpiry = addMinutes(new Date(), lockDuration);

//       if (unitId) {
//         // Lock specific unit
//         const unit = await prisma.propertyUnit.findUnique({
//           where: { id: unitId },
//           include: { property: true }
//         });

//         if (!unit) {
//           return {
//             success: false,
//             message: 'Unit not found'
//           };
//         }

//         // Check if unit is already locked and not expired
//         if (unit.isPaymentLocked && unit.paymentLockExpiry && unit.paymentLockExpiry > new Date()) {
//           return {
//             success: false,
//             message: 'Unit is currently locked for payment by another user',
//             alreadyLocked: true,
//             lockedBy: 'another user'
//           };
//         }

//         // Check if unit is available
//         if (!unit.isAvailable) {
//           return {
//             success: false,
//             message: 'Unit is not available for rent'
//           };
//         }

//         // Acquire lock
//         await prisma.propertyUnit.update({
//           where: { id: unitId },
//           data: {
//             isPaymentLocked: true,
//             paymentLockExpiry: lockExpiry
//           }
//         });

//         return {
//           success: true,
//           lockExpiry,
//           message: 'Unit payment lock acquired successfully'
//         };

//       } else if (propertyId) {
//         // Lock entire property (single unit properties)
//         const property = await prisma.property.findUnique({
//           where: { id: propertyId }
//         });

//         if (!property) {
//           return {
//             success: false,
//             message: 'Property not found'
//           };
//         }

//         // Check if property is already locked and not expired
//         if (property.isPaymentLocked && property.paymentLockExpiry && property.paymentLockExpiry > new Date()) {
//           return {
//             success: false,
//             message: 'Property is currently locked for payment by another user',
//             alreadyLocked: true,
//             lockedBy: 'another user'
//           };
//         }

//         // Check if property is available
//         if (!property.isAvailable) {
//           return {
//             success: false,
//             message: 'Property is not available for rent'
//           };
//         }

//         // Acquire lock
//         await prisma.property.update({
//           where: { id: propertyId },
//           data: {
//             isPaymentLocked: true,
//             paymentLockExpiry: lockExpiry
//           }
//         });

//         return {
//           success: true,
//           lockExpiry,
//           message: 'Property payment lock acquired successfully'
//         };
//       }

//       return {
//         success: false,
//         message: 'Either propertyId or unitId must be provided'
//       };

//     } catch (error) {
//       console.error('Error acquiring payment lock:', error);
//       return {
//         success: false,
//         message: 'Failed to acquire payment lock'
//       };
//     }
//   }

//   /**
//    * Release a payment lock on a property or unit
//    */
//   static async releasePaymentLock({
//     propertyId,
//     unitId,
//     userId
//   }: Omit<PropertyLock, 'lockDuration'>): Promise<LockResult> {
//     try {
//       if (unitId) {
//         // Release unit lock
//         await prisma.propertyUnit.update({
//           where: { id: unitId },
//           data: {
//             isPaymentLocked: false,
//             paymentLockExpiry: null
//           }
//         });

//         return {
//           success: true,
//           message: 'Unit payment lock released successfully'
//         };

//       } else if (propertyId) {
//         // Release property lock
//         await prisma.property.update({
//           where: { id: propertyId },
//           data: {
//             isPaymentLocked: false,
//             paymentLockExpiry: null
//           }
//         });

//         return {
//           success: true,
//           message: 'Property payment lock released successfully'
//         };
//       }

//       return {
//         success: false,
//         message: 'Either propertyId or unitId must be provided'
//       };

//     } catch (error) {
//       console.error('Error releasing payment lock:', error);
//       return {
//         success: false,
//         message: 'Failed to release payment lock'
//       };
//     }
//   }

//   /**
//    * Check if a property or unit is currently locked
//    */
//   static async isLocked({ propertyId, unitId }: Pick<PropertyLock, 'propertyId' | 'unitId'>): Promise<{
//     isLocked: boolean;
//     lockExpiry?: Date;
//     timeRemaining?: number; // minutes
//   }> {
//     try {
//       if (unitId) {
//         const unit = await prisma.propertyUnit.findUnique({
//           where: { id: unitId },
//           select: { isPaymentLocked: true, paymentLockExpiry: true }
//         });

//         if (!unit) {
//           return { isLocked: false };
//         }

//         const isLocked = unit.isPaymentLocked && 
//                         unit.paymentLockExpiry && 
//                         unit.paymentLockExpiry > new Date();

//         return {
//           isLocked: !!isLocked,
//           lockExpiry: unit.paymentLockExpiry || undefined,
//           timeRemaining: isLocked && unit.paymentLockExpiry ? 
//             Math.ceil((unit.paymentLockExpiry.getTime() - new Date().getTime()) / (1000 * 60)) : 
//             undefined
//         };

//       } else if (propertyId) {
//         const property = await prisma.property.findUnique({
//           where: { id: propertyId },
//           select: { isPaymentLocked: true, paymentLockExpiry: true }
//         });

//         if (!property) {
//           return { isLocked: false };
//         }

//         const isLocked = property.isPaymentLocked && 
//                         property.paymentLockExpiry && 
//                         property.paymentLockExpiry > new Date();

//         return {
//           isLocked: !!isLocked,
//           lockExpiry: property.paymentLockExpiry || undefined,
//           timeRemaining: isLocked && property.paymentLockExpiry ? 
//             Math.ceil((property.paymentLockExpiry.getTime() - new Date().getTime()) / (1000 * 60)) : 
//             undefined
//         };
//       }

//       return { isLocked: false };

//     } catch (error) {
//       console.error('Error checking lock status:', error);
//       return { isLocked: false };
//     }
//   }

//   /**
//    * Extend an existing payment lock
//    */
//   static async extendPaymentLock({
//     propertyId,
//     unitId,
//     userId,
//     additionalMinutes = 15
//   }: PropertyLock & { additionalMinutes?: number }): Promise<LockResult> {
//     try {
//       if (unitId) {
//         const unit = await prisma.propertyUnit.findUnique({
//           where: { id: unitId },
//           select: { isPaymentLocked: true, paymentLockExpiry: true }
//         });

//         if (!unit?.isPaymentLocked || !unit.paymentLockExpiry) {
//           return {
//             success: false,
//             message: 'No active payment lock found for this unit'
//           };
//         }

//         const newExpiry = addMinutes(unit.paymentLockExpiry, additionalMinutes);

//         await prisma.propertyUnit.update({
//           where: { id: unitId },
//           data: { paymentLockExpiry: newExpiry }
//         });

//         return {
//           success: true,
//           lockExpiry: newExpiry,
//           message: 'Unit payment lock extended successfully'
//         };

//       } else if (propertyId) {
//         const property = await prisma.property.findUnique({
//           where: { id: propertyId },
//           select: { isPaymentLocked: true, paymentLockExpiry: true }
//         });

//         if (!property?.isPaymentLocked || !property.paymentLockExpiry) {
//           return {
//             success: false,
//             message: 'No active payment lock found for this property'
//           };
//         }

//         const newExpiry = addMinutes(property.paymentLockExpiry, additionalMinutes);

//         await prisma.property.update({
//           where: { id: propertyId },
//           data: { paymentLockExpiry: newExpiry }
//         });

//         return {
//           success: true,
//           lockExpiry: newExpiry,
//           message: 'Property payment lock extended successfully'
//         };
//       }

//       return {
//         success: false,
//         message: 'Either propertyId or unitId must be provided'
//       };

//     } catch (error) {
//       console.error('Error extending payment lock:', error);
//       return {
//         success: false,
//         message: 'Failed to extend payment lock'
//       };
//     }
//   }

//   /**
//    * Clean up expired locks (should be run periodically)
//    */
//   static async cleanupExpiredLocks(): Promise<{
//     propertiesUnlocked: number;
//     unitsUnlocked: number;
//   }> {
//     try {
//       const now = new Date();

//       // Clean up expired property locks
//       const expiredProperties = await prisma.property.updateMany({
//         where: {
//           isPaymentLocked: true,
//           paymentLockExpiry: {
//             lte: now
//           }
//         },
//         data: {
//           isPaymentLocked: false,
//           paymentLockExpiry: null
//         }
//       });

//       // Clean up expired unit locks
//       const expiredUnits = await prisma.propertyUnit.updateMany({
//         where: {
//           isPaymentLocked: true,
//           paymentLockExpiry: {
//             lte: now
//           }
//         },
//         data: {
//           isPaymentLocked: false,
//           paymentLockExpiry: null
//         }
//       });

//       return {
//         propertiesUnlocked: expiredProperties.count,
//         unitsUnlocked: expiredUnits.count
//       };

//     } catch (error) {
//       console.error('Error cleaning up expired locks:', error);
//       return {
//         propertiesUnlocked: 0,
//         unitsUnlocked: 0
//       };
//     }
//   }

//   /**
//    * Force release all locks for a user (in case of emergency)
//    */
//   static async forceReleaseUserLocks(userId: string): Promise<{
//     success: boolean;
//     message: string;
//     propertiesUnlocked: number;
//     unitsUnlocked: number;
//   }> {
//     try {
//       // Note: This is a simplified version. In a real implementation,
//       // you might want to track which user has which locks
      
//       const result = await this.cleanupExpiredLocks();
      
//       return {
//         success: true,
//         message: 'All expired locks have been cleaned up',
//         propertiesUnlocked: result.propertiesUnlocked,
//         unitsUnlocked: result.unitsUnlocked
//       };

//     } catch (error) {
//       console.error('Error force releasing user locks:', error);
//       return {
//         success: false,
//         message: 'Failed to release user locks',
//         propertiesUnlocked: 0,
//         unitsUnlocked: 0
//       };
//     }
//   }
// }

// export default LockingService;