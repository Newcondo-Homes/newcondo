import { Request, Response } from 'express';
import { TrendsService } from '../services/trendsService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class TrendsController {
  private trendsService: TrendsService;

  constructor() {
    this.trendsService = new TrendsService();
  }

  /**
   * Get user growth trends
   */
  async getUserGrowthTrends(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '90d', interval = 'day' } = req.query;

      const trends = await this.trendsService.getUserGrowthTrends(
        dateRange as string,
        interval as 'day' | 'week' | 'month'
      );

      sendSuccess(res, trends, 'User growth trends retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch user growth trends');
    }
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '90d', interval = 'day', breakdown } = req.query;

      const trends = await this.trendsService.getRevenueTrends(
        dateRange as string,
        interval as 'day' | 'week' | 'month',
        breakdown as string | undefined
      );

      sendSuccess(res, trends, 'Revenue trends retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch revenue trends');
    }
  }

  /**
   * Get property listing trends
   */
  async getPropertyTrends(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '90d', interval = 'day' } = req.query;

      const trends = await this.trendsService.getPropertyTrends(
        dateRange as string,
        interval as 'day' | 'week' | 'month'
      );

      sendSuccess(res, trends, 'Property trends retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch property trends');
    }
  }

  /**
   * Get engagement trends
   */
  async getEngagementTrends(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '90d', interval = 'day' } = req.query;

      const trends = await this.trendsService.getEngagementTrends(
        dateRange as string,
        interval as 'day' | 'week' | 'month'
      );

      sendSuccess(res, trends, 'Engagement trends retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch engagement trends');
    }
  }

  /**
   * Get geographic trends
   */
  async getGeographicTrends(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d', groupBy = 'state' } = req.query;

      const trends = await this.trendsService.getGeographicTrends(
        dateRange as string,
        groupBy as 'state' | 'city'
      );

      sendSuccess(res, trends, 'Geographic trends retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch geographic trends');
    }
  }

  /**
   * Get property type trends
   */
  async getPropertyTypeTrends(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const trends = await this.trendsService.getPropertyTypeTrends(dateRange as string);

      sendSuccess(res, trends, 'Property type trends retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch property type trends');
    }
  }

  /**
   * Get payment method trends
   */
  async getPaymentMethodTrends(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const trends = await this.trendsService.getPaymentMethodTrends(dateRange as string);

      sendSuccess(res, trends, 'Payment method trends retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch payment method trends');
    }
  }

  /**
   * Get seasonal trends
   */
  async getSeasonalTrends(req: Request, res: Response): Promise<void> {
    try {
      const { metric = 'rentals', years = 2 } = req.query;

      const trends = await this.trendsService.getSeasonalTrends(
        metric as string,
        parseInt(years as string)
      );

      sendSuccess(res, trends, 'Seasonal trends retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch seasonal trends');
    }
  }

  /**
   * Get anomaly detection results
   */
  async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const { metric, dateRange = '90d', sensitivity = 'medium' } = req.query;

      const anomalies = await this.trendsService.detectAnomalies(
        metric as string,
        dateRange as string,
        sensitivity as 'low' | 'medium' | 'high'
      );

      sendSuccess(res, anomalies, 'Anomalies detected successfully');
    } catch (error) {
      sendError(res, error, 'Failed to detect anomalies');
    }
  }
}