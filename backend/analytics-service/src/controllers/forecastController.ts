import { Request, Response } from 'express';
import { ForecastService } from '../services/forecastService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class ForecastController {
  private forecastService: ForecastService;

  constructor() {
    this.forecastService = new ForecastService();
  }

  /**
   * Get revenue forecast
   */
  async getRevenueForecast(req: Request, res: Response): Promise<void> {
    try {
      const { horizon = '30d', confidenceLevel = 0.95 } = req.query;

      const forecast = await this.forecastService.getRevenueForecast(
        horizon as string,
        parseFloat(confidenceLevel as string)
      );

      sendSuccess(res, forecast, 'Revenue forecast generated successfully');
    } catch (error) {
      sendError(res, error, 'Failed to generate revenue forecast');
    }
  }

  /**
   * Get user growth forecast
   */
  async getUserGrowthForecast(req: Request, res: Response): Promise<void> {
    try {
      const { horizon = '90d', confidenceLevel = 0.95 } = req.query;

      const forecast = await this.forecastService.getUserGrowthForecast(
        horizon as string,
        parseFloat(confidenceLevel as string)
      );

      sendSuccess(res, forecast, 'User growth forecast generated successfully');
    } catch (error) {
      sendError(res, error, 'Failed to generate user growth forecast');
    }
  }

  /**
   * Get property listing forecast
   */
  async getPropertyForecast(req: Request, res: Response): Promise<void> {
    try {
      const { horizon = '30d', confidenceLevel = 0.95 } = req.query;

      const forecast = await this.forecastService.getPropertyForecast(
        horizon as string,
        parseFloat(confidenceLevel as string)
      );

      sendSuccess(res, forecast, 'Property forecast generated successfully');
    } catch (error) {
      sendError(res, error, 'Failed to generate property forecast');
    }
  }

  /**
   * Get demand forecast by location
   */
  async getDemandForecast(req: Request, res: Response): Promise<void> {
    try {
      const { location, horizon = '30d' } = req.query;

      if (!location) {
        return sendError(res, new Error('Location is required'), 'Location parameter is required', 400);
      }

      const forecast = await this.forecastService.getDemandForecast(
        location as string,
        horizon as string
      );

      sendSuccess(res, forecast, 'Demand forecast generated successfully');
    } catch (error) {
      sendError(res, error, 'Failed to generate demand forecast');
    }
  }

  /**
   * Get churn prediction
   */
  async getChurnPrediction(req: Request, res: Response): Promise<void> {
    try {
      const { userType, horizon = '30d' } = req.query;

      const prediction = await this.forecastService.getChurnPrediction(
        userType as string | undefined,
        horizon as string
      );

      sendSuccess(res, prediction, 'Churn prediction generated successfully');
    } catch (error) {
      sendError(res, error, 'Failed to generate churn prediction');
    }
  }

  /**
   * Get agent performance forecast
   */
  async getAgentPerformanceForecast(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, horizon = '30d' } = req.query;

      const forecast = await this.forecastService.getAgentPerformanceForecast(
        agentId as string | undefined,
        horizon as string
      );

      sendSuccess(res, forecast, 'Agent performance forecast generated successfully');
    } catch (error) {
      sendError(res, error, 'Failed to generate agent performance forecast');
    }
  }

  /**
   * Get custom metric forecast
   */
  async getCustomForecast(req: Request, res: Response): Promise<void> {
    try {
      const { metric, horizon = '30d', method = 'auto' } = req.body;

      if (!metric) {
        return sendError(res, new Error('Metric is required'), 'Metric parameter is required', 400);
      }

      const forecast = await this.forecastService.getCustomForecast(
        metric,
        horizon,
        method
      );

      sendSuccess(res, forecast, 'Custom forecast generated successfully');
    } catch (error) {
      sendError(res, error, 'Failed to generate custom forecast');
    }
  }

  /**
   * Get forecast accuracy metrics
   */
  async getForecastAccuracy(req: Request, res: Response): Promise<void> {
    try {
      const { metric, dateRange = '90d' } = req.query;

      const accuracy = await this.forecastService.getForecastAccuracy(
        metric as string,
        dateRange as string
      );

      sendSuccess(res, accuracy, 'Forecast accuracy retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to retrieve forecast accuracy');
    }
  }
}