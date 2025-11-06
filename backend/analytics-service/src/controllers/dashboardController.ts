import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const overview = await this.dashboardService.getOverview(dateRange as string);

      sendSuccess(res, overview, 'Dashboard overview retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch dashboard overview');
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.dashboardService.getRealTimeMetrics();

      sendSuccess(res, metrics, 'Real-time metrics retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch real-time metrics');
    }
  }

  /**
   * Get platform health status
   */
  async getPlatformHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.dashboardService.getPlatformHealth();

      sendSuccess(res, health, 'Platform health retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch platform health');
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '7d' } = req.query;

      const activity = await this.dashboardService.getUserActivity(dateRange as string);

      sendSuccess(res, activity, 'User activity retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch user activity');
    }
  }

  /**
   * Get property performance summary
   */
  async getPropertyPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const performance = await this.dashboardService.getPropertyPerformance(dateRange as string);

      sendSuccess(res, performance, 'Property performance retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch property performance');
    }
  }

  /**
   * Get revenue summary
   */
  async getRevenueSummary(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const revenue = await this.dashboardService.getRevenueSummary(dateRange as string);

      sendSuccess(res, revenue, 'Revenue summary retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch revenue summary');
    }
  }

  /**
   * Get agent performance summary
   */
  async getAgentPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d', limit = 10 } = req.query;

      const performance = await this.dashboardService.getAgentPerformance(
        dateRange as string,
        parseInt(limit as string)
      );

      sendSuccess(res, performance, 'Agent performance retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch agent performance');
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20 } = req.query;

      const activities = await this.dashboardService.getRecentActivity(
        parseInt(limit as string)
      );

      sendSuccess(res, activities, 'Recent activity retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch recent activity');
    }
  }

  /**
   * Get alert summary
   */
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await this.dashboardService.getAlerts();

      sendSuccess(res, alerts, 'Alerts retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch alerts');
    }
  }
}