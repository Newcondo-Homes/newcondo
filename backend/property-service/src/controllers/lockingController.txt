// backend/property-service/src/controllers/lockingController.ts

import { Request, Response, NextFunction } from 'express';
import { lockingService } from '../services/lockingService';
import { LOCK_REASONS } from '../../../shared/src/constants/lockDurations';
import { PaymentAttemptStatus } from '../../../shared/src/types/paymentQueue';

export class LockingController {
  /**
   * Acquire a payment lock for a property or unit
   */
  async acquireLock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, unitId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Property ID is required',
        });
        return;
      }

      // Check for existing active locks by this user
      const existingLock = await lockingService.getUserActiveLock(userId, propertyId, unitId);
      if (existingLock) {
        res.status(200).json({
          success: true,
          message: 'Lock already acquired',
          data: existingLock,
        });
        return;
      }

      // Attempt to acquire lock
      const result = await lockingService.acquirePaymentLock({
        propertyId,
        unitId,
        userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: LOCK_REASONS.LOCK_ACQUIRED,
          data: {
            lockId: result.lockId,
            expiresAt: result.expiresAt,
            propertyId,
            unitId,
          },
        });
      } else {
        // Lock acquisition failed
        const statusCode = result.reason === LOCK_REASONS.ALREADY_LOCKED ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: 'Lock Acquisition Failed',
          message: result.reason || 'Failed to acquire lock',
          data: {
            queuePosition: result.queuePosition,
            propertyId,
            unitId,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Release a payment lock
   */
  async releaseLock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lockId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      if (!lockId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Lock ID is required',
        });
        return;
      }

      const result = await lockingService.releasePaymentLock(lockId, userId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: LOCK_REASONS.LOCK_RELEASED,
          data: {
            lockId: result.lockId,
            releasedAt: result.releasedAt,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Lock Release Failed',
          message: result.reason || 'Failed to release lock',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extend an existing lock duration
   */
  async extendLock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lockId } = req.params;
      const { duration } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const result = await lockingService.extendLock(lockId, userId, duration);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Lock extended successfully',
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Lock Extension Failed',
          message: result.reason || 'Failed to extend lock',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get lock status for a property or unit
   */
  async getLockStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { unitId } = req.query;

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Property ID is required',
        });
        return;
      }

      const lockStatus = await lockingService.getLockStatus(propertyId, unitId as string);

      res.status(200).json({
        success: true,
        data: lockStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's active locks
   */
  async getUserLocks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const locks = await lockingService.getUserActiveLocks(userId);

      res.status(200).json({
        success: true,
        data: {
          locks,
          count: locks.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check for booking conflicts
   */
  async checkConflicts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, unitId } = req.query;
      const userId = req.user?.id;

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Property ID is required',
        });
        return;
      }

      const conflicts = await lockingService.detectBookingConflicts(
        propertyId as string,
        unitId as string,
        userId
      );

      res.status(200).json({
        success: true,
        data: {
          hasConflicts: conflicts.length > 0,
          conflicts,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment attempt logs
   */
  async getPaymentAttempts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, unitId, userId, status } = req.query;
      const requestingUserId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';

      // Only allow users to view their own attempts unless admin
      if (!isAdmin && userId && userId !== requestingUserId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only view your own payment attempts',
        });
        return;
      }

      const attempts = await lockingService.getPaymentAttempts({
        propertyId: propertyId as string,
        unitId: unitId as string,
        userId: (userId || requestingUserId) as string,
        status: status as PaymentAttemptStatus,
      });

      res.status(200).json({
        success: true,
        data: {
          attempts,
          count: attempts.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clean up expired locks (admin only)
   */
  async cleanupExpiredLocks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === 'ADMIN';

      if (!isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
        });
        return;
      }

      const result = await lockingService.cleanupExpiredLocks();

      res.status(200).json({
        success: true,
        message: 'Expired locks cleaned up successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const lockingController = new LockingController();