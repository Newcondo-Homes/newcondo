// backend/admin-service/src/controllers/referralAdminController.ts

import { Request, Response } from 'express';
import { referralAdminService } from '../services/referralAdminService';
import { z } from 'zod';

// Validation schemas
const approveReferralSchema = z.object({
  referralId: z.string(),
  adminId: z.string(),
  notes: z.string().optional(),
});

const rejectReferralSchema = z.object({
  referralId: z.string(),
  adminId: z.string(),
  reason: z.string(),
});

const updateRewardStatusSchema = z.object({
  rewardId: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']),
  adminId: z.string(),
  notes: z.string().optional(),
});

export class ReferralAdminController {
  /**
   * Get all referrals with filters
   */
  async getAllReferrals(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        referralType,
        startDate,
        endDate,
        search,
      } = req.query;

      const referrals = await referralAdminService.getAllReferrals({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        referralType: referralType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: referrals,
      });
    } catch (error: any) {
      console.error('Get all referrals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referrals',
        error: error.message,
      });
    }
  }

  /**
   * Get referral details
   */
  async getReferralDetails(req: Request, res: Response): Promise<void> {
    try {
      const { referralId } = req.params;

      const referral = await referralAdminService.getReferralDetails(referralId);

      if (!referral) {
        res.status(404).json({
          success: false,
          message: 'Referral not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: referral,
      });
    } catch (error: any) {
      console.error('Get referral details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referral details',
        error: error.message,
      });
    }
  }

  /**
   * Approve referral manually
   */
  async approveReferral(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = approveReferralSchema.parse(req.body);

      await referralAdminService.approveReferral(validatedData);

      res.status(200).json({
        success: true,
        message: 'Referral approved successfully',
      });
    } catch (error: any) {
      console.error('Approve referral error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve referral',
      });
    }
  }

  /**
   * Reject referral
   */
  async rejectReferral(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = rejectReferralSchema.parse(req.body);

      await referralAdminService.rejectReferral(validatedData);

      res.status(200).json({
        success: true,
        message: 'Referral rejected successfully',
      });
    } catch (error: any) {
      console.error('Reject referral error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject referral',
      });
    }
  }

  /**
   * Get all rewards with filters
   */
  async getAllRewards(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        rewardType,
        userId,
        startDate,
        endDate,
      } = req.query;

      const rewards = await referralAdminService.getAllRewards({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        rewardType: rewardType as string,
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: rewards,
      });
    } catch (error: any) {
      console.error('Get all rewards error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get rewards',
        error: error.message,
      });
    }
  }

  /**
   * Update reward status
   */
  async updateRewardStatus(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateRewardStatusSchema.parse(req.body);

      await referralAdminService.updateRewardStatus(validatedData);

      res.status(200).json({
        success: true,
        message: 'Reward status updated successfully',
      });
    } catch (error: any) {
      console.error('Update reward status error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update reward status',
      });
    }
  }

  /**
   * Get referral system overview/stats
   */
  async getSystemOverview(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month' } = req.query;

      const overview = await referralAdminService.getSystemOverview(
        period as string
      );

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error: any) {
      console.error('Get system overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system overview',
        error: error.message,
      });
    }
  }

  /**
   * Get user referral activity
   */
  async getUserReferralActivity(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const activity = await referralAdminService.getUserReferralActivity(userId);

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error: any) {
      console.error('Get user referral activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user activity',
        error: error.message,
      });
    }
  }

  /**
   * Get top referrers
   */
  async getTopReferrers(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10, period = 'all' } = req.query;

      const topReferrers = await referralAdminService.getTopReferrers({
        limit: Number(limit),
        period: period as string,
      });

      res.status(200).json({
        success: true,
        data: topReferrers,
      });
    } catch (error: any) {
      console.error('Get top referrers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get top referrers',
        error: error.message,
      });
    }
  }

  /**
   * Get pending payouts
   */
  async getPendingPayouts(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;

      const payouts = await referralAdminService.getPendingPayouts({
        page: Number(page),
        limit: Number(limit),
      });

      res.status(200).json({
        success: true,
        data: payouts,
      });
    } catch (error: any) {
      console.error('Get pending payouts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending payouts',
        error: error.message,
      });
    }
  }

  /**
   * Manually trigger reward distribution
   */
  async triggerRewardDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { referralId } = req.params;
      const { adminId } = req.body;

      await referralAdminService.manuallyDistributeRewards({
        referralId,
        adminId,
      });

      res.status(200).json({
        success: true,
        message: 'Reward distribution triggered successfully',
      });
    } catch (error: any) {
      console.error('Trigger reward distribution error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to trigger reward distribution',
      });
    }
  }

  /**
   * Get suspicious referral activities
   */
  async getSuspiciousActivities(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;

      const activities = await referralAdminService.getSuspiciousActivities({
        page: Number(page),
        limit: Number(limit),
      });

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error: any) {
      console.error('Get suspicious activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suspicious activities',
        error: error.message,
      });
    }
  }

  /**
   * Ban user from referral program
   */
  async banUserFromReferralProgram(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { adminId, reason } = req.body;

      await referralAdminService.banUserFromReferralProgram({
        userId,
        adminId,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'User banned from referral program',
      });
    } catch (error: any) {
      console.error('Ban user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to ban user',
      });
    }
  }

  /**
   * Export referral data
   */
  async exportReferralData(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'csv', startDate, endDate } = req.query;

      const data = await referralAdminService.exportReferralData({
        format: format as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=referrals-${Date.now()}.${format}`);
      res.send(data);
    } catch (error: any) {
      console.error('Export referral data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data',
        error: error.message,
      });
    }
  }
}

export const referralAdminController = new ReferralAdminController();