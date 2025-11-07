import { Request, Response } from 'express';
import { revenueService } from '../services/revenueService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class RevenueController {
  /**
   * Get revenue overview
   */
  async getRevenueOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const overview = await revenueService.getRevenueOverview({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, overview, 'Revenue overview retrieved successfully');
    } catch (error) {
      console.error('Error fetching revenue overview:', error);
      return sendError(res, 'Failed to fetch revenue overview', 500);
    }
  }

  /**
   * Get revenue breakdown by category
   */
  async getRevenueBreakdown(req: Request, res: Response) {
    try {
      const { startDate, endDate, groupBy = 'category' } = req.query;

      const breakdown = await revenueService.getRevenueBreakdown({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        groupBy: groupBy as 'category' | 'source' | 'property',
      });

      return sendSuccess(res, breakdown, 'Revenue breakdown retrieved successfully');
    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
      return sendError(res, 'Failed to fetch revenue breakdown', 500);
    }
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(req: Request, res: Response) {
    try {
      const { startDate, endDate, interval = 'day' } = req.query;

      const trends = await revenueService.getRevenueTrends({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        interval: interval as 'day' | 'week' | 'month',
      });

      return sendSuccess(res, trends, 'Revenue trends retrieved successfully');
    } catch (error) {
      console.error('Error fetching revenue trends:', error);
      return sendError(res, 'Failed to fetch revenue trends', 500);
    }
  }

  /**
   * Get commission analytics
   */
  async getCommissionAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate, agentId } = req.query;

      const analytics = await revenueService.getCommissionAnalytics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        agentId: agentId as string,
      });

      return sendSuccess(res, analytics, 'Commission analytics retrieved successfully');
    } catch (error) {
      console.error('Error fetching commission analytics:', error);
      return sendError(res, 'Failed to fetch commission analytics', 500);
    }
  }

  /**
   * Get virtual account balances
   */
  async getVirtualAccountBalances(req: Request, res: Response) {
    try {
      const { userType, minBalance, maxBalance } = req.query;

      const balances = await revenueService.getVirtualAccountBalances({
        userType: userType as string,
        minBalance: minBalance ? parseFloat(minBalance as string) : undefined,
        maxBalance: maxBalance ? parseFloat(maxBalance as string) : undefined,
      });

      return sendSuccess(res, balances, 'Virtual account balances retrieved successfully');
    } catch (error) {
      console.error('Error fetching virtual account balances:', error);
      return sendError(res, 'Failed to fetch virtual account balances', 500);
    }
  }

  /**
   * Get revenue forecasting
   */
  async getRevenueForecasting(req: Request, res: Response) {
    try {
      const { forecastPeriod = '30', method = 'linear' } = req.query;

      const forecast = await revenueService.getRevenueForecasting({
        forecastPeriod: parseInt(forecastPeriod as string),
        method: method as 'linear' | 'exponential' | 'moving_average',
      });

      return sendSuccess(res, forecast, 'Revenue forecast retrieved successfully');
    } catch (error) {
      console.error('Error fetching revenue forecast:', error);
      return sendError(res, 'Failed to fetch revenue forecast', 500);
    }
  }

  /**
   * Get marking service revenue
   */
  async getMarkingServiceRevenue(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const revenue = await revenueService.getMarkingServiceRevenue({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, revenue, 'Marking service revenue retrieved successfully');
    } catch (error) {
      console.error('Error fetching marking service revenue:', error);
      return sendError(res, 'Failed to fetch marking service revenue', 500);
    }
  }

  /**
   * Get premium subscription revenue
   */
  async getPremiumRevenue(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const revenue = await revenueService.getPremiumRevenue({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, revenue, 'Premium revenue retrieved successfully');
    } catch (error) {
      console.error('Error fetching premium revenue:', error);
      return sendError(res, 'Failed to fetch premium revenue', 500);
    }
  }

  /**
   * Export revenue report
   */
  async exportRevenueReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, format = 'pdf', reportType } = req.query;

      const report = await revenueService.exportRevenueReport({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        format: format as 'pdf' | 'excel' | 'csv',
        reportType: reportType as string,
      });

      res.setHeader('Content-Type', report.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      return res.send(report.data);
    } catch (error) {
      console.error('Error exporting revenue report:', error);
      return sendError(res, 'Failed to export revenue report', 500);
    }
  }
}

export const revenueController = new RevenueController();