import { Request, Response, NextFunction } from 'express';
import { PropertyPerformanceService } from '../services/propertyPerformanceService';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';

export class PropertyPerformanceController {
  private performanceService: PropertyPerformanceService;

  constructor() {
    this.performanceService = new PropertyPerformanceService();
  }

  /**
   * Get performance metrics for a specific property
   */
  getPropertyPerformance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const performance = await this.performanceService.getPropertyPerformance(
        propertyId,
        userId
      );

      res.status(200).json(
        successResponse(performance, 'Property performance retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get performance metrics for all properties owned by user
   */
  getAllPropertiesPerformance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { startDate, endDate, status } = req.query;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const performance = await this.performanceService.getAllPropertiesPerformance(
        userId,
        {
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          status: status as string | undefined,
        }
      );

      res.status(200).json(
        successResponse(performance, 'Properties performance retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get view analytics for a property
   */
  getPropertyViewAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;
      const { period } = req.query; // 'day', 'week', 'month', 'year'

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const viewAnalytics = await this.performanceService.getPropertyViewAnalytics(
        propertyId,
        userId,
        (period as string) || 'month'
      );

      res.status(200).json(
        successResponse(viewAnalytics, 'View analytics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get rental conversion rate for a property
   */
  getPropertyConversionRate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const conversionRate = await this.performanceService.getPropertyConversionRate(
        propertyId,
        userId
      );

      res.status(200).json(
        successResponse(conversionRate, 'Conversion rate retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get property comparison analytics
   */
  getPropertyComparison = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { propertyIds } = req.query; // Comma-separated property IDs

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      if (!propertyIds) {
        res.status(400).json(errorResponse('Property IDs required', 'MISSING_PROPERTY_IDS'));
        return;
      }

      const idsArray = (propertyIds as string).split(',');
      const comparison = await this.performanceService.getPropertyComparison(
        idsArray,
        userId
      );

      res.status(200).json(
        successResponse(comparison, 'Property comparison retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get best and worst performing properties
   */
  getPerformanceRanking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { metric, limit } = req.query; // metric: 'views', 'rentals', 'revenue'

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const ranking = await this.performanceService.getPerformanceRanking(
        userId,
        (metric as string) || 'views',
        parseInt(limit as string) || 10
      );

      res.status(200).json(
        successResponse(ranking, 'Performance ranking retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get property marketing effectiveness
   */
  getMarketingEffectiveness = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const effectiveness = await this.performanceService.getMarketingEffectiveness(
        propertyId,
        userId
      );

      res.status(200).json(
        successResponse(effectiveness, 'Marketing effectiveness retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get time-on-market analytics
   */
  getTimeOnMarketAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 'USER_NOT_AUTHENTICATED'));
        return;
      }

      const timeAnalytics = await this.performanceService.getTimeOnMarketAnalytics(
        propertyId,
        userId
      );

      res.status(200).json(
        successResponse(timeAnalytics, 'Time on market analytics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };
}