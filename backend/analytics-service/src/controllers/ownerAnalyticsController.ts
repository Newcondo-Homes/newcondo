import { Request, Response, NextFunction } from 'express';
import { OwnerAnalyticsService } from '../services/ownerAnalyticsService';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';

export class OwnerAnalyticsController {
  private analyticsService: OwnerAnalyticsService;

  constructor() {
    this.analyticsService = new OwnerAnalyticsService();
  }

  /**
   * Get owner's portfolio overview
   */
  getPortfolioOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const overview = await this.analyticsService.getPortfolioOverview(userId);

      res.status(200).json(
        successResponse(overview, 'Portfolio overview retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get revenue analytics
   */
  getRevenueAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { startDate, endDate, groupBy } = req.query; // groupBy: 'day', 'week', 'month', 'year'

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const analytics = await this.analyticsService.getRevenueAnalytics(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        groupBy: (groupBy as string) || 'month',
      });

      res.status(200).json(
        successResponse(analytics, 'Revenue analytics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get commission earnings breakdown
   */
  getCommissionEarnings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const earnings = await this.analyticsService.getCommissionEarnings(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json(
        successResponse(earnings, 'Commission earnings retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get agent referral analytics (for agents)
   */
  getReferralAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const analytics = await this.analyticsService.getReferralAnalytics(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json(
        successResponse(analytics, 'Referral analytics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get occupancy rate analytics
   */
  getOccupancyAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { period } = req.query; // 'current', 'historical'

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const analytics = await this.analyticsService.getOccupancyAnalytics(
        userId,
        (period as string) || 'current'
      );

      res.status(200).json(
        successResponse(analytics, 'Occupancy analytics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get property performance trends
   */
  getPerformanceTrends = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { months } = req.query; // Number of months to analyze

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const trends = await this.analyticsService.getPerformanceTrends(
        userId,
        parseInt(months as string) || 6
      );

      res.status(200).json(
        successResponse(trends, 'Performance trends retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get financial summary
   */
  getFinancialSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const summary = await this.analyticsService.getFinancialSummary(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json(
        successResponse(summary, 'Financial summary retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get marking service analytics (for agents)
   */
  getMarkingServiceAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const analytics = await this.analyticsService.getMarkingServiceAnalytics(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json(
        successResponse(analytics, 'Marking service analytics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export analytics data
   */
  exportAnalyticsData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { format, startDate, endDate } = req.query; // format: 'csv', 'pdf', 'xlsx'

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const exportData = await this.analyticsService.exportAnalyticsData(userId, {
        format: (format as string) || 'csv',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json(
        successResponse(exportData, 'Analytics data exported successfully')
      );
    } catch (error) {
      next(error);
    }
  };
}