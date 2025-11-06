import { Request, Response } from 'express';
import { platformMetricsService } from '../services/platformMetricsService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class PlatformMetricsController {
  /**
   * Get real-time platform metrics
   */
  async getRealTimeMetrics(req: Request, res: Response) {
    try {
      const metrics = await platformMetricsService.getRealTimeMetrics();

      return sendSuccess(res, metrics, 'Real-time metrics retrieved successfully');
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      return sendError(res, 'Failed to fetch real-time metrics', 500);
    }
  }

  /**
   * Get platform performance metrics
   */
  async getPerformanceMetrics(req: Request, res: Response) {
    try {
      const { startDate, endDate, granularity = 'hour' } = req.query;

      const metrics = await platformMetricsService.getPerformanceMetrics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        granularity: granularity as 'hour' | 'day' | 'week',
      });

      return sendSuccess(res, metrics, 'Performance metrics retrieved successfully');
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return sendError(res, 'Failed to fetch performance metrics', 500);
    }
  }

  /**
   * Get API usage statistics
   */
  async getAPIUsage(req: Request, res: Response) {
    try {
      const { startDate, endDate, endpoint } = req.query;

      const usage = await platformMetricsService.getAPIUsage({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        endpoint: endpoint as string,
      });

      return sendSuccess(res, usage, 'API usage retrieved successfully');
    } catch (error) {
      console.error('Error fetching API usage:', error);
      return sendError(res, 'Failed to fetch API usage', 500);
    }
  }

  /**
   * Get error rate metrics
   */
  async getErrorRates(req: Request, res: Response) {
    try {
      const { startDate, endDate, groupBy = 'hour' } = req.query;

      const rates = await platformMetricsService.getErrorRates({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        groupBy: groupBy as 'hour' | 'day',
      });

      return sendSuccess(res, rates, 'Error rates retrieved successfully');
    } catch (error) {
      console.error('Error fetching error rates:', error);
      return sendError(res, 'Failed to fetch error rates', 500);
    }
  }

  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics(req: Request, res: Response) {
    try {
      const metrics = await platformMetricsService.getDatabaseMetrics();

      return sendSuccess(res, metrics, 'Database metrics retrieved successfully');
    } catch (error) {
      console.error('Error fetching database metrics:', error);
      return sendError(res, 'Failed to fetch database metrics', 500);
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(req: Request, res: Response) {
    try {
      const health = await platformMetricsService.getServiceHealth();

      return sendSuccess(res, health, 'Service health retrieved successfully');
    } catch (error) {
      console.error('Error fetching service health:', error);
      return sendError(res, 'Failed to fetch service health', 500);
    }
  }

  /**
   * Get uptime statistics
   */
  async getUptimeStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await platformMetricsService.getUptimeStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, stats, 'Uptime statistics retrieved successfully');
    } catch (error) {
      console.error('Error fetching uptime stats:', error);
      return sendError(res, 'Failed to fetch uptime statistics', 500);
    }
  }
}

export const platformMetricsController = new PlatformMetricsController();