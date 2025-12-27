// backend/admin-service/src/controllers/referralAnalyticsController.ts

import { Request, Response } from 'express';
import { referralAdminService } from '../services/referralAdminService';

export class ReferralAnalyticsController {
  /**
   * Get referral conversion funnel
   */
  async getConversionFunnel(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const funnel = await referralAdminService.getConversionFunnel({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: funnel,
      });
    } catch (error: any) {
      console.error('Get conversion funnel error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get conversion funnel',
        error: error.message,
      });
    }
  }

  /**
   * Get referral trends over time
   */
  async getReferralTrends(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month', groupBy = 'day' } = req.query;

      const trends = await referralAdminService.getReferralTrends({
        period: period as string,
        groupBy: groupBy as string,
      });

      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      console.error('Get referral trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referral trends',
        error: error.message,
      });
    }
  }

  /**
   * Get reward distribution stats
   */
  async getRewardDistributionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await referralAdminService.getRewardDistributionStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get reward distribution stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reward stats',
        error: error.message,
      });
    }
  }

  /**
   * Get ROI analysis
   */
  async getROIAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month' } = req.query;

      const roi = await referralAdminService.getROIAnalysis(period as string);

      res.status(200).json({
        success: true,
        data: roi,
      });
    } catch (error: any) {
      console.error('Get ROI analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ROI analysis',
        error: error.message,
      });
    }
  }

  /**
   * Get geographic distribution
   */
  async getGeographicDistribution(req: Request, res: Response): Promise<void> {
    try {
      const distribution = await referralAdminService.getGeographicDistribution();

      res.status(200).json({
        success: true,
        data: distribution,
      });
    } catch (error: any) {
      console.error('Get geographic distribution error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get geographic distribution',
        error: error.message,
      });
    }
  }

  /**
   * Get referral channel performance
   */
  async getChannelPerformance(req: Request, res: Response): Promise<void> {
    try {
      const performance = await referralAdminService.getChannelPerformance();

      res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (error: any) {
      console.error('Get channel performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get channel performance',
        error: error.message,
      });
    }
  }

  /**
   * Get user cohort analysis
   */
  async getUserCohortAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { cohortType = 'monthly' } = req.query;

      const cohorts = await referralAdminService.getUserCohortAnalysis(
        cohortType as string
      );

      res.status(200).json({
        success: true,
        data: cohorts,
      });
    } catch (error: any) {
      console.error('Get cohort analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cohort analysis',
        error: error.message,
      });
    }
  }

  /**
   * Get lifetime value (LTV) by referral source
   */
  async getLTVBySource(req: Request, res: Response): Promise<void> {
    try {
      const ltv = await referralAdminService.getLTVByReferralSource();

      res.status(200).json({
        success: true,
        data: ltv,
      });
    } catch (error: any) {
      console.error('Get LTV by source error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get LTV analysis',
        error: error.message,
      });
    }
  }

  /**
   * Get reward redemption patterns
   */
  async getRedemptionPatterns(req: Request, res: Response): Promise<void> {
    try {
      const patterns = await referralAdminService.getRedemptionPatterns();

      res.status(200).json({
        success: true,
        data: patterns,
      });
    } catch (error: any) {
      console.error('Get redemption patterns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get redemption patterns',
        error: error.message,
      });
    }
  }

  /**
   * Get referral velocity (speed of referrals)
   */
  async getReferralVelocity(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;

      const velocity = await referralAdminService.getReferralVelocity(
        userId as string
      );

      res.status(200).json({
        success: true,
        data: velocity,
      });
    } catch (error: any) {
      console.error('Get referral velocity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referral velocity',
        error: error.message,
      });
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const predictions = await referralAdminService.getPredictiveAnalytics();

      res.status(200).json({
        success: true,
        data: predictions,
      });
    } catch (error: any) {
      console.error('Get predictive analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get predictive analytics',
        error: error.message,
      });
    }
  }
}

export const referralAnalyticsController = new ReferralAnalyticsController();