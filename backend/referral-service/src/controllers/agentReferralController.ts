// backend/referral-service/src/controllers/agentReferralController.ts

import { Request, Response } from 'express';
import { agentReferralService } from '../services/agentReferralService';
import { standardResponse } from '../../../shared/src/utils/response';

export class AgentReferralController {
  /**
   * Get agent referral dashboard data
   */
  async getReferralDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const dashboard = await agentReferralService.getReferralDashboard(userId);

      res.status(200).json(standardResponse.success(dashboard, 'Referral dashboard retrieved successfully'));
    } catch (error) {
      console.error('Get referral dashboard error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve referral dashboard'));
    }
  }

  /**
   * Get agent referral tracking for a specific property
   */
  async getPropertyReferralTracking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { propertyId } = req.params;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const tracking = await agentReferralService.getPropertyReferralTracking(propertyId, userId);

      if (!tracking) {
        res.status(404).json(standardResponse.error('Property not found or access denied', 404));
        return;
      }

      res.status(200).json(standardResponse.success(tracking, 'Property referral tracking retrieved successfully'));
    } catch (error) {
      console.error('Get property referral tracking error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve property referral tracking'));
    }
  }

  /**
   * Get referral analytics
   */
  async getReferralAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { startDate, endDate, propertyId } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const analytics = await agentReferralService.getReferralAnalytics(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        propertyId: propertyId as string | undefined,
      });

      res.status(200).json(standardResponse.success(analytics, 'Referral analytics retrieved successfully'));
    } catch (error) {
      console.error('Get referral analytics error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve referral analytics'));
    }
  }

  /**
   * Track referral link click
   */
  async trackReferralClick(req: Request, res: Response): Promise<void> {
    try {
      const { referralCode, propertyId } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      if (!referralCode || !propertyId) {
        res.status(400).json(standardResponse.error('Referral code and property ID are required', 400));
        return;
      }

      await agentReferralService.trackReferralClick({
        referralCode,
        propertyId,
        ipAddress,
        userAgent,
      });

      res.status(200).json(standardResponse.success(null, 'Referral click tracked successfully'));
    } catch (error) {
      console.error('Track referral click error:', error);
      res.status(500).json(standardResponse.error('Failed to track referral click'));
    }
  }

  /**
   * Track referral conversion (payment)
   */
  async trackReferralConversion(req: Request, res: Response): Promise<void> {
    try {
      const { referralCode, propertyId, paymentId, amount } = req.body;

      if (!referralCode || !propertyId || !paymentId || !amount) {
        res.status(400).json(standardResponse.error('Missing required fields', 400));
        return;
      }

      await agentReferralService.trackReferralConversion({
        referralCode,
        propertyId,
        paymentId,
        amount,
      });

      res.status(200).json(standardResponse.success(null, 'Referral conversion tracked successfully'));
    } catch (error) {
      console.error('Track referral conversion error:', error);
      res.status(500).json(standardResponse.error('Failed to track referral conversion'));
    }
  }

  /**
   * Get referral performance by property
   */
  async getReferralPerformanceByProperty(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, sortBy = 'conversions' } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const performance = await agentReferralService.getReferralPerformanceByProperty(userId, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as 'clicks' | 'conversions' | 'earnings',
      });

      res.status(200).json(standardResponse.success(performance, 'Referral performance retrieved successfully'));
    } catch (error) {
      console.error('Get referral performance error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve referral performance'));
    }
  }

  /**
   * Get top performing referrals
   */
  async getTopPerformingReferrals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { limit = 5 } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const topReferrals = await agentReferralService.getTopPerformingReferrals(userId, Number(limit));

      res.status(200).json(standardResponse.success(topReferrals, 'Top performing referrals retrieved successfully'));
    } catch (error) {
      console.error('Get top performing referrals error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve top performing referrals'));
    }
  }

  /**
   * Get referral earnings history
   */
  async getReferralEarningsHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const earnings = await agentReferralService.getReferralEarningsHistory(userId, {
        page: Number(page),
        limit: Number(limit),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json(standardResponse.success(earnings, 'Referral earnings history retrieved successfully'));
    } catch (error) {
      console.error('Get referral earnings history error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve referral earnings history'));
    }
  }
}

export const agentReferralController = new AgentReferralController();