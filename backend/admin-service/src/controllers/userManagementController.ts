import { Request, Response } from 'express';
import { userManagementService } from '../services/userManagementService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class UserManagementController {
  /**
   * Get all users with advanced filtering
   */
  async getUsers(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '50',
        role,
        verificationStatus,
        isPremium,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        registeredAfter,
        registeredBefore,
        lastActiveAfter,
        lastActiveBefore,
      } = req.query;

      const users = await userManagementService.getUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        role: role as string,
        verificationStatus: verificationStatus as string,
        isPremium: isPremium === 'true',
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        registeredAfter: registeredAfter ? new Date(registeredAfter as string) : undefined,
        registeredBefore: registeredBefore ? new Date(registeredBefore as string) : undefined,
        lastActiveAfter: lastActiveAfter ? new Date(lastActiveAfter as string) : undefined,
        lastActiveBefore: lastActiveBefore ? new Date(lastActiveBefore as string) : undefined,
      });

      return sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
      console.error('Error fetching users:', error);
      return sendError(res, 'Failed to fetch users', 500);
    }
  }

  /**
   * Get user detailed profile
   */
  async getUserProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const profile = await userManagementService.getUserProfile(id);

      if (!profile) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, profile, 'User profile retrieved successfully');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return sendError(res, 'Failed to fetch user profile', 500);
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = '1', limit = '50', startDate, endDate } = req.query;

      const activity = await userManagementService.getUserActivity({
        userId: id,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, activity, 'User activity retrieved successfully');
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return sendError(res, 'Failed to fetch user activity', 500);
    }
  }

  /**
   * Update user status (suspend/activate)
   */
  async updateUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const adminId = req.user?.id;

      const result = await userManagementService.updateUserStatus({
        userId: id,
        status,
        reason,
        adminId: adminId!,
      });

      return sendSuccess(res, result, 'User status updated successfully');
    } catch (error) {
      console.error('Error updating user status:', error);
      return sendError(res, 'Failed to update user status', 500);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await userManagementService.getUserStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, stats, 'User statistics retrieved successfully');
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return sendError(res, 'Failed to fetch user statistics', 500);
    }
  }

  /**
   * Get inactive users
   */
  async getInactiveUsers(req: Request, res: Response) {
    try {
      const { days = '30', page = '1', limit = '50' } = req.query;

      const inactive = await userManagementService.getInactiveUsers({
        days: parseInt(days as string),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      return sendSuccess(res, inactive, 'Inactive users retrieved successfully');
    } catch (error) {
      console.error('Error fetching inactive users:', error);
      return sendError(res, 'Failed to fetch inactive users', 500);
    }
  }

  /**
   * Bulk user operations
   */
  async bulkUserOperation(req: Request, res: Response) {
    try {
      const { userIds, operation, data } = req.body;
      const adminId = req.user?.id;

      const result = await userManagementService.bulkUserOperation({
        userIds,
        operation,
        data,
        adminId: adminId!,
      });

      return sendSuccess(res, result, 'Bulk operation completed successfully');
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      return sendError(res, 'Failed to perform bulk operation', 500);
    }
  }

  /**
   * Get user cohort analysis
   */
  async getCohortAnalysis(req: Request, res: Response) {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;

      const analysis = await userManagementService.getCohortAnalysis({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        groupBy: groupBy as 'week' | 'month',
      });

      return sendSuccess(res, analysis, 'Cohort analysis retrieved successfully');
    } catch (error) {
      console.error('Error fetching cohort analysis:', error);
      return sendError(res, 'Failed to fetch cohort analysis', 500);
    }
  }
}

export const userManagementController = new UserManagementController();