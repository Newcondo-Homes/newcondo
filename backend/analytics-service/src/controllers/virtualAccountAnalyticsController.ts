// File: backend/analytics-service/src/controllers/virtualAccountAnalyticsController.ts

import { Request, Response } from 'express';
import { VirtualAccountAnalyticsService } from '../services/virtualAccountAnalyticsService';
import { standardResponse } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/middleware/logger';

export class VirtualAccountAnalyticsController {
  private virtualAccountAnalyticsService: VirtualAccountAnalyticsService;

  constructor() {
    this.virtualAccountAnalyticsService = new VirtualAccountAnalyticsService();
  }

  // Get overview of all virtual accounts
  getVirtualAccountOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30d', timezone = 'Africa/Lagos' } = req.query;
      
      const overview = await this.virtualAccountAnalyticsService.getVirtualAccountOverview(
        period as string,
        timezone as string
      );

      res.json(standardResponse(true, 'Virtual account overview retrieved successfully', overview));
    } catch (error) {
      logger.error('Error getting virtual account overview:', error);
      res.status(500).json(standardResponse(false, 'Failed to get virtual account overview'));
    }
  };

  // Get balance analytics across all virtual accounts
  getBalanceAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30d', timezone = 'Africa/Lagos', groupBy = 'day' } = req.query;
      
      const analytics = await this.virtualAccountAnalyticsService.getBalanceAnalytics(
        period as string,
        timezone as string,
        groupBy as 'day' | 'week' | 'month'
      );

      res.json(standardResponse(true, 'Balance analytics retrieved successfully', analytics));
    } catch (error) {
      logger.error('Error getting balance analytics:', error);
      res.status(500).json(standardResponse(false, 'Failed to get balance analytics'));
    }
  };

  // Get transaction analytics for virtual accounts
  getTransactionAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30d', timezone = 'Africa/Lagos', groupBy = 'day' } = req.query;
      
      const analytics = await this.virtualAccountAnalyticsService.getTransactionAnalytics(
        period as string,
        timezone as string,
        groupBy as 'day' | 'week' | 'month'
      );

      res.json(standardResponse(true, 'Transaction analytics retrieved successfully', analytics));
    } catch (error) {
      logger.error('Error getting transaction analytics:', error);
      res.status(500).json(standardResponse(false, 'Failed to get transaction analytics'));
    }
  };

  // Get virtual account performance metrics
  getPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30d', timezone = 'Africa/Lagos' } = req.query;
      
      const metrics = await this.virtualAccountAnalyticsService.getPerformanceMetrics(
        period as string,
        timezone as string
      );

      res.json(standardResponse(true, 'Performance metrics retrieved successfully', metrics));
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      res.status(500).json(standardResponse(false, 'Failed to get performance metrics'));
    }
  };

  // Get top performing virtual accounts
  getTopPerformingAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        period = '30d', 
        timezone = 'Africa/Lagos',
        limit = 10,
        sortBy = 'totalTransactions'
      } = req.query;
      
      const accounts = await this.virtualAccountAnalyticsService.getTopPerformingAccounts(
        period as string,
        timezone as string,
        parseInt(limit as string),
        sortBy as 'totalTransactions' | 'totalAmount' | 'averageTransaction'
      );

      res.json(standardResponse(true, 'Top performing accounts retrieved successfully', accounts));
    } catch (error) {
      logger.error('Error getting top performing accounts:', error);
      res.status(500).json(standardResponse(false, 'Failed to get top performing accounts'));
    }
  };

  // Get virtual account distribution by user type
  getUserTypeDistribution = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30d', timezone = 'Africa/Lagos' } = req.query;
      
      const distribution = await this.virtualAccountAnalyticsService.getUserTypeDistribution(
        period as string,
        timezone as string
      );

      res.json(standardResponse(true, 'User type distribution retrieved successfully', distribution));
    } catch (error) {
      logger.error('Error getting user type distribution:', error);
      res.status(500).json(standardResponse(false, 'Failed to get user type distribution'));
    }
  };

  // Get virtual account activity trends
  getActivityTrends = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30d', timezone = 'Africa/Lagos', groupBy = 'day' } = req.query;
      
      const trends = await this.virtualAccountAnalyticsService.getActivityTrends(
        period as string,
        timezone as string,
        groupBy as 'day' | 'week' | 'month'
      );

      res.json(standardResponse(true, 'Activity trends retrieved successfully', trends));
    } catch (error) {
      logger.error('Error getting activity trends:', error);
      res.status(500).json(standardResponse(false, 'Failed to get activity trends'));
    }
  };

  // Get virtual account reconciliation report
  getReconciliationReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, timezone = 'Africa/Lagos' } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json(standardResponse(false, 'Start date and end date are required'));
        return;
      }

      const report = await this.virtualAccountAnalyticsService.getReconciliationReport(
        new Date(startDate as string),
        new Date(endDate as string),
        timezone as string
      );

      res.json(standardResponse(true, 'Reconciliation report generated successfully', report));
    } catch (error) {
      logger.error('Error generating reconciliation report:', error);
      res.status(500).json(standardResponse(false, 'Failed to generate reconciliation report'));
    }
  };

  // Get virtual account health metrics
  getHealthMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { timezone = 'Africa/Lagos' } = req.query;
      
      const healthMetrics = await this.virtualAccountAnalyticsService.getHealthMetrics(
        timezone as string
      );

      res.json(standardResponse(true, 'Health metrics retrieved successfully', healthMetrics));
    } catch (error) {
      logger.error('Error getting health metrics:', error);
      res.status(500).json(standardResponse(false, 'Failed to get health metrics'));
    }
  };

  // Get virtual account growth metrics
  getGrowthMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30d', timezone = 'Africa/Lagos', comparePeriod = true } = req.query;
      
      const growthMetrics = await this.virtualAccountAnalyticsService.getGrowthMetrics(
        period as string,
        timezone as string,
        comparePeriod === 'true'
      );

      res.json(standardResponse(true, 'Growth metrics retrieved successfully', growthMetrics));
    } catch (error) {
      logger.error('Error getting growth metrics:', error);
      res.status(500).json(standardResponse(false, 'Failed to get growth metrics'));
    }
  };

  // Export virtual account analytics data
  exportAnalyticsData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        format = 'csv',
        period = '30d', 
        timezone = 'Africa/Lagos',
        includeTransactions = false
      } = req.query;
      
      const exportData = await this.virtualAccountAnalyticsService.exportAnalyticsData(
        format as 'csv' | 'excel',
        period as string,
        timezone as string,
        includeTransactions === 'true'
      );

      // Set appropriate headers for file download
      const filename = `virtual-account-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      res.send(exportData);
    } catch (error) {
      logger.error('Error exporting analytics data:', error);
      res.status(500).json(standardResponse(false, 'Failed to export analytics data'));
    }
  };

  // Get specific virtual account analytics
  getAccountAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { period = '30d', timezone = 'Africa/Lagos' } = req.query;
      
      const analytics = await this.virtualAccountAnalyticsService.getAccountAnalytics(
        accountId,
        period as string,
        timezone as string
      );

      res.json(standardResponse(true, 'Account analytics retrieved successfully', analytics));
    } catch (error) {
      logger.error('Error getting account analytics:', error);
      res.status(500).json(standardResponse(false, 'Failed to get account analytics'));
    }
  };

  // Get virtual account alerts and anomalies
  getAlertsAndAnomalies = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        period = '7d', 
        timezone = 'Africa/Lagos',
        severity = 'all'
      } = req.query;
      
      const alerts = await this.virtualAccountAnalyticsService.getAlertsAndAnomalies(
        period as string,
        timezone as string,
        severity as 'low' | 'medium' | 'high' | 'critical' | 'all'
      );

      res.json(standardResponse(true, 'Alerts and anomalies retrieved successfully', alerts));
    } catch (error) {
      logger.error('Error getting alerts and anomalies:', error);
      res.status(500).json(standardResponse(false, 'Failed to get alerts and anomalies'));
    }
  };
}