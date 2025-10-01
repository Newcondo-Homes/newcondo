import { Request, Response } from 'express';
import { lockingService } from '../services/lockingService';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { AppError } from '../../../shared/src/middleware/errorHandler';

export const lockingController = {
  /**
   * Acquire property/unit lock for booking
   */
  acquireLock: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { propertyId, unitId, duration } = req.body;

      const lock = await lockingService.acquireLock({
        userId,
        propertyId,
        unitId,
        duration: duration || 15, // Default 15 minutes
      });

      return successResponse(res, lock, 'Lock acquired successfully', 201);
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Check if property/unit is locked
   */
  checkLockStatus: async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const { unitId } = req.query;

      const lockStatus = await lockingService.checkLockStatus(
        propertyId,
        unitId as string | undefined
      );

      return successResponse(res, lockStatus, 'Lock status retrieved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Release property/unit lock
   */
  releaseLock: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { lockId } = req.params;

      await lockingService.releaseLock(lockId, userId);

      return successResponse(res, null, 'Lock released successfully');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Extend lock duration
   */
  extendLock: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { lockId } = req.params;
      const { additionalMinutes } = req.body;

      const updatedLock = await lockingService.extendLock(
        lockId,
        userId,
        additionalMinutes
      );

      return successResponse(res, updatedLock, 'Lock extended successfully');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Get user's active locks
   */
  getUserActiveLocks: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const locks = await lockingService.getUserActiveLocks(userId);

      return successResponse(res, locks, 'Active locks retrieved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Force release lock (Admin only)
   */
  forceReleaseLock: async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';

      if (!isAdmin) {
        throw new AppError('Admin access required', 403);
      }

      const { lockId } = req.params;
      const { reason } = req.body;

      await lockingService.forceReleaseLock(lockId, adminId!, reason);

      return successResponse(res, null, 'Lock force released');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Cleanup expired locks
   */
  cleanupExpiredLocks: async (req: Request, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      if (!isAdmin) {
        throw new AppError('Admin access required', 403);
      }

      const result = await lockingService.cleanupExpiredLocks();

      return successResponse(
        res,
        result,
        `Cleaned up ${result.cleanedCount} expired locks`
      );
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Get lock statistics (Admin)
   */
  getLockStatistics: async (req: Request, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      if (!isAdmin) {
        throw new AppError('Admin access required', 403);
      }

      const { startDate, endDate } = req.query;

      const stats = await lockingService.getLockStatistics(
        startDate as string,
        endDate as string
      );

      return successResponse(res, stats, 'Lock statistics retrieved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Get property lock history
   */
  getPropertyLockHistory: async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const { unitId, page = '1', limit = '20' } = req.query;

      const history = await lockingService.getPropertyLockHistory(
        propertyId,
        unitId as string | undefined,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return successResponse(res, history, 'Lock history retrieved');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Transfer lock to another user (for assisted booking)
   */
  transferLock: async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        throw new AppError('Unauthorized', 401);
      }

      const { lockId } = req.params;
      const { newUserId, reason } = req.body;

      const updatedLock = await lockingService.transferLock(
        lockId,
        currentUserId,
        newUserId,
        reason
      );

      return successResponse(res, updatedLock, 'Lock transferred successfully');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },

  /**
   * Validate lock before payment
   */
  validateLockForPayment: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { lockId } = req.params;

      const validation = await lockingService.validateLockForPayment(
        lockId,
        userId
      );

      return successResponse(res, validation, 'Lock validation completed');
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  },
};