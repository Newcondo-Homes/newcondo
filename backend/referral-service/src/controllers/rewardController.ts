// backend/referral-service/src/controllers/rewardController.ts

import { Request, Response, NextFunction } from 'express';
import rewardService from '../services/rewardService';
import { RewardFilters } from '../types';

export class RewardController {
  /**
   * Get user's reward balance
   * GET /api/rewards/balance
   */
  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const balance = await rewardService.getRewardBalance(userId);

      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's rewards
   * GET /api/rewards
   */
  async getRewards(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: RewardFilters = {
        status: req.query.status as any,
        rewardType: req.query.rewardType as any,
        isRedeemed: req.query.isRedeemed === 'true',
        isPaidOut: req.query.isPaidOut === 'true',
      };

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.expiringBefore) {
        filters.expiringBefore = new Date(req.query.expiringBefore as string);
      }

      const result = await rewardService.getRewards(userId, filters, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reward summary
   * GET /api/rewards/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const summary = await rewardService.getRewardSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Apply reward to transaction
   * POST /api/rewards/apply
   */
  async applyReward(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { rewardId, targetTransaction } = req.body;

      const result = await rewardService.applyReward({
        userId,
        rewardId,
        targetTransaction,
      });

      res.json({
        success: true,
        data: {
          message: 'Reward applied successfully',
          discountApplied: result.discountApplied,
          remainingReward: result.remainingReward,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Redeem reward (mark as redeemed)
   * POST /api/rewards/:rewardId/redeem
   */
  async redeemReward(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { rewardId } = req.params;

      // Get reward and mark as redeemed
      const result = await rewardService.applyReward({
        userId,
        rewardId,
        targetTransaction: {
          type: 'service',
          amount: 0,
          transactionId: 'manual-redemption',
        },
      });

      res.json({
        success: true,
        data: {
          message: 'Reward redeemed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expiring rewards
   * GET /api/rewards/expiring
   */
  async getExpiringRewards(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 7;

      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + days);

      const result = await rewardService.getRewards(
        userId,
        { expiringBefore: expiringDate },
        1,
        100
      );

      res.json({
        success: true,
        data: {
          rewards: result.rewards,
          count: result.rewards.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Approve reward
   * POST /api/rewards/:rewardId/approve
   */
  async approveReward(req: Request, res: Response, next: NextFunction) {
    try {
      const { rewardId } = req.params;

      await rewardService.approveReward(rewardId);

      res.json({
        success: true,
        data: {
          message: 'Reward approved successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Reject reward
   * POST /api/rewards/:rewardId/reject
   */
  async rejectReward(req: Request, res: Response, next: NextFunction) {
    try {
      const { rewardId } = req.params;
      const { reason } = req.body;

      await rewardService.rejectReward(rewardId, reason);

      res.json({
        success: true,
        data: {
          message: 'Reward rejected successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Process reward payout
   * POST /api/rewards/:rewardId/payout
   */
  async processRewardPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { rewardId } = req.params;
      const { payoutMethod, payoutReference } = req.body;

      await rewardService.processRewardPayout({
        rewardId,
        payoutMethod,
        payoutReference,
      });

      res.json({
        success: true,
        data: {
          message: 'Payout processed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RewardController();