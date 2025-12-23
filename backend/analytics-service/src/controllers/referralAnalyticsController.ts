// backend/analytics-service/src/controllers/referralAnalyticsController.ts

import { Request, Response } from 'express';
import { referralAnalyticsService } from '../services/referralAnalyticsService';

/**
 * Referral Analytics Controller
 * Handles admin-facing analytics for the referral system
 */
export class ReferralAnalyticsController {
  /**
   * Get overview of referral program performance
   */
  async getOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const overview = await referralAnalyticsService.getOverview({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      console.error('Error fetching referral overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch referral overview',
      });
    }
  }

  /**
   * Get referral conversion funnel analytics
   */
  async getConversionFunnel(req: Request, res: Response) {
    try {
      const { startDate, endDate, referralType } = req.query;

      const funnel = await referralAnalyticsService.getConversionFunnel({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        referralType: referralType as string,
      });

      res.json({
        success: true,
        data: funnel,
      });
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversion funnel',
      });
    }
  }

  /**
   * Get top referrers by various metrics
   */
  async getTopReferrers(req: Request, res: Response) {
    try {
      const { metric = 'conversions', limit = 10, period = '30d' } = req.query;

      const topReferrers = await referralAnalyticsService.getTopReferrers({
        metric: metric as 'conversions' | 'revenue' | 'referrals',
        limit: parseInt(limit as string),
        period: period as string,
      });

      res.json({
        success: true,
        data: topReferrers,
      });
    } catch (error) {
      console.error('Error fetching top referrers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top referrers',
      });
    }
  }

  /**
   * Get referral type breakdown
   */
  async getReferralTypeBreakdown(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const breakdown = await referralAnalyticsService.getReferralTypeBreakdown({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      console.error('Error fetching referral type breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch referral type breakdown',
      });
    }
  }

  /**
   * Get reward distribution analytics
   */
  async getRewardDistribution(req: Request, res: Response) {
    try {
      const { startDate, endDate, rewardType } = req.query;

      const distribution = await referralAnalyticsService.getRewardDistribution({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        rewardType: rewardType as string,
      });

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      console.error('Error fetching reward distribution:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reward distribution',
      });
    }
  }

  /**
   * Get referral timeline (daily/weekly/monthly trends)
   */
  async getReferralTimeline(req: Request, res: Response) {
    try {
      const { startDate, endDate, granularity = 'daily' } = req.query;

      const timeline = await referralAnalyticsService.getReferralTimeline({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        granularity: granularity as 'daily' | 'weekly' | 'monthly',
      });

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      console.error('Error fetching referral timeline:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch referral timeline',
      });
    }
  }

  /**
   * Get referral performance by user role
   */
  async getPerformanceByRole(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const performance = await referralAnalyticsService.getPerformanceByRole({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      console.error('Error fetching performance by role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch performance by role',
      });
    }
  }

  /**
   * Get ROI analysis for referral program
   */
  async getROIAnalysis(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const roi = await referralAnalyticsService.getROIAnalysis({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: roi,
      });
    } catch (error) {
      console.error('Error fetching ROI analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ROI analysis',
      });
    }
  }

  /**
   * Get viral coefficient (K-factor) metrics
   */
  async getViralCoefficient(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const viralMetrics = await referralAnalyticsService.getViralCoefficient({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: viralMetrics,
      });
    } catch (error) {
      console.error('Error fetching viral coefficient:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch viral coefficient',
      });
    }
  }

  /**
   * Export referral analytics report
   */
  async exportReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;

      const report = await referralAnalyticsService.exportReport({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        format: format as 'csv' | 'pdf' | 'json',
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
      });
    }
  }
}

export const referralAnalyticsController = new ReferralAnalyticsController();