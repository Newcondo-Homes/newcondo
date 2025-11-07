import { Request, Response } from 'express';
import { systemHealthService } from '../services/systemHealthService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class SystemHealthController {
  /**
   * Get overall system health
   */
  async getSystemHealth(req: Request, res: Response) {
    try {
      const health = await systemHealthService.getSystemHealth();

      return sendSuccess(res, health, 'System health retrieved successfully');
    } catch (error) {
      console.error('Error fetching system health:', error);
      return sendError(res, 'Failed to fetch system health', 500);
    }
  }

  /**
   * Get service status for all microservices
   */
  async getServiceStatus(req: Request, res: Response) {
    try {
      const status = await systemHealthService.getServiceStatus();

      return sendSuccess(res, status, 'Service status retrieved successfully');
    } catch (error) {
      console.error('Error fetching service status:', error);
      return sendError(res, 'Failed to fetch service status', 500);
    }
  }

  /**
   * Get database health metrics
   */
  async getDatabaseHealth(req: Request, res: Response) {
    try {
      const health = await systemHealthService.getDatabaseHealth();

      return sendSuccess(res, health, 'Database health retrieved successfully');
    } catch (error) {
      console.error('Error fetching database health:', error);
      return sendError(res, 'Failed to fetch database health', 500);
    }
  }

  /**
   * Get API performance metrics
   */
  async getAPIPerformance(req: Request, res: Response) {
    try {
      const { startDate, endDate, service } = req.query;

      const performance = await systemHealthService.getAPIPerformance({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        service: service as string,
      });

      return sendSuccess(res, performance, 'API performance retrieved successfully');
    } catch (error) {
      console.error('Error fetching API performance:', error);
      return sendError(res, 'Failed to fetch API performance', 500);
    }
  }

  /**
   * Get error logs
   */
  async getErrorLogs(req: Request, res: Response) {
    try {
      const { page = '1', limit = '50', severity, service, startDate, endDate } = req.query;

      const logs = await systemHealthService.getErrorLogs({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        severity: severity as string,
        service: service as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, logs, 'Error logs retrieved successfully');
    } catch (error) {
      console.error('Error fetching error logs:', error);
      return sendError(res, 'Failed to fetch error logs', 500);
    }
  }

  /**
   * Get system resource usage
   */
  async getResourceUsage(req: Request, res: Response) {
    try {
      const usage = await systemHealthService.getResourceUsage();

      return sendSuccess(res, usage, 'Resource usage retrieved successfully');
    } catch (error) {
      console.error('Error fetching resource usage:', error);
      return sendError(res, 'Failed to fetch resource usage', 500);
    }
  }

  /**
   * Get uptime history
   */
  async getUptimeHistory(req: Request, res: Response) {
    try {
      const { days = '30', service } = req.query;

      const history = await systemHealthService.getUptimeHistory({
        days: parseInt(days as string),
        service: service as string,
      });

      return sendSuccess(res, history, 'Uptime history retrieved successfully');
    } catch (error) {
      console.error('Error fetching uptime history:', error);
      return sendError(res, 'Failed to fetch uptime history', 500);
    }
  }

  /**
   * Get third-party service health (Flutterwave, Google Maps, etc.)
   */
  async getThirdPartyHealth(req: Request, res: Response) {
    try {
      const health = await systemHealthService.getThirdPartyHealth();

      return sendSuccess(res, health, 'Third-party service health retrieved successfully');
    } catch (error) {
      console.error('Error fetching third-party health:', error);
      return sendError(res, 'Failed to fetch third-party service health', 500);
    }
  }

  /**
   * Get backup status
   */
  async getBackupStatus(req: Request, res: Response) {
    try {
      const status = await systemHealthService.getBackupStatus();

      return sendSuccess(res, status, 'Backup status retrieved successfully');
    } catch (error) {
      console.error('Error fetching backup status:', error);
      return sendError(res, 'Failed to fetch backup status', 500);
    }
  }

  /**
   * Trigger manual health check
   */
  async triggerHealthCheck(req: Request, res: Response) {
    try {
      const { service } = req.body;

      const result = await systemHealthService.triggerHealthCheck(service);

      return sendSuccess(res, result, 'Health check completed successfully');
    } catch (error) {
      console.error('Error triggering health check:', error);
      return sendError(res, 'Failed to trigger health check', 500);
    }
  }
}

export const systemHealthController = new SystemHealthController();