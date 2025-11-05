// backend/property-service/src/controllers/propertyAnalyticsController.ts

import { Request, Response } from 'express';
import propertyAnalyticsService from '../services/propertyAnalyticsService';

export class PropertyAnalyticsController {
  /**
   * Get comprehensive property performance metrics
   * GET /api/property-analytics/properties/:propertyId/performance
   */
  async getPropertyPerformance(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const metrics = await propertyAnalyticsService.getPropertyPerformance(propertyId, userId);

      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('Get property performance error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch property performance metrics',
      });
    }
  }

  /**
   * Get property comparison vs market
   * GET /api/property-analytics/properties/:propertyId/comparison
   */
  async getPropertyComparison(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;

      const comparison = await propertyAnalyticsService.getPropertyComparison(propertyId);

      return res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      console.error('Get property comparison error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch property comparison data',
      });
    }
  }

  /**
   * Get earnings analytics for user
   * GET /api/property-analytics/earnings
   */
  async getEarningsAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';

      const analytics = await propertyAnalyticsService.getEarningsAnalytics(userId, period);

      return res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      console.error('Get earnings analytics error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch earnings analytics',
      });
    }
  }

  /**
   * Get agent referral analytics
   * GET /api/property-analytics/agent/referrals
   */
  async getAgentReferralAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const analytics = await propertyAnalyticsService.getAgentReferralAnalytics(userId);

      return res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      console.error('Get agent referral analytics error:', error);
      return res.status(error.message.includes('not an agent') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch agent referral analytics',
      });
    }
  }

  /**
   * Get dashboard analytics
   * GET /api/property-analytics/dashboard
   */
  async getDashboardAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year') || 'month';

      const dashboard = await propertyAnalyticsService.getDashboardAnalytics(userId, period);

      return res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      console.error('Get dashboard analytics error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch dashboard analytics',
      });
    }
  }

  /**
   * Get property listing analytics
   * GET /api/property-analytics/properties/:propertyId/listing-analytics
   */
  async getPropertyListingAnalytics(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      // Note: This would need to be implemented in the service
      // For now, return a placeholder response
      return res.status(200).json({
        success: true,
        message: 'Property listing analytics endpoint',
        data: {
          propertyId,
          // Add actual analytics data here
        },
      });
    } catch (error: any) {
      console.error('Get property listing analytics error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch property listing analytics',
      });
    }
  }

  /**
   * Get multiple properties performance summary
   * POST /api/property-analytics/properties/bulk-performance
   */
  async getBulkPropertyPerformance(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { propertyIds } = req.body;

      if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Property IDs array is required',
        });
      }

      const performanceData = await Promise.all(
        propertyIds.map(async (propertyId) => {
          try {
            return await propertyAnalyticsService.getPropertyPerformance(propertyId, userId);
          } catch (error) {
            return {
              propertyId,
              error: 'Failed to fetch performance data',
            };
          }
        })
      );

      return res.status(200).json({
        success: true,
        data: performanceData,
      });
    } catch (error: any) {
      console.error('Get bulk property performance error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch bulk property performance',
      });
    }
  }

  /**
   * Export analytics report
   * GET /api/property-analytics/export
   */
  async exportAnalyticsReport(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { format, period, propertyIds } = req.query;

      // Validate format
      const validFormats = ['json', 'csv', 'pdf'];
      if (!format || !validFormats.includes(format as string)) {
        return res.status(400).json({
          success: false,
          message: 'Valid format is required (json, csv, or pdf)',
        });
      }

      // Get dashboard analytics
      const dashboard = await propertyAnalyticsService.getDashboardAnalytics(
        userId,
        (period as any) || 'month'
      );

      // For now, return JSON format
      // In production, implement CSV and PDF export
      if (format === 'json') {
        return res.status(200).json({
          success: true,
          data: dashboard,
          exportedAt: new Date(),
        });
      }

      return res.status(501).json({
        success: false,
        message: `${format.toUpperCase()} export not yet implemented`,
      });
    } catch (error: any) {
      console.error('Export analytics report error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to export analytics report',
      });
    }
  }

  /**
   * Get performance trends over time
   * GET /api/property-analytics/properties/:propertyId/trends
   */
  async getPropertyTrends(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;
      const { metric, period, startDate, endDate } = req.query;

      const validMetrics = ['views', 'revenue', 'occupancy', 'inquiries'];
      if (!metric || !validMetrics.includes(metric as string)) {
        return res.status(400).json({
          success: false,
          message: 'Valid metric is required (views, revenue, occupancy, inquiries)',
        });
      }

      // Get property performance which includes trends
      const performance = await propertyAnalyticsService.getPropertyPerformance(propertyId, userId);

      return res.status(200).json({
        success: true,
        data: {
          propertyId,
          metric,
          trends: performance.viewTrend, // Adjust based on requested metric
        },
      });
    } catch (error: any) {
      console.error('Get property trends error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch property trends',
      });
    }
  }
}

export default new PropertyAnalyticsController();