import { PrismaClient } from '@newcondo/db';
import { promisify } from 'util';
import * as os from 'os';

const prisma = new PrismaClient();

interface PerformanceMetricsParams {
  startDate?: Date;
  endDate?: Date;
  granularity: 'hour' | 'day' | 'week';
}

interface APIUsageParams {
  startDate?: Date;
  endDate?: Date;
  endpoint?: string;
}

interface ErrorRatesParams {
  startDate?: Date;
  endDate?: Date;
  groupBy: 'hour' | 'day';
}

interface UptimeStatsParams {
  startDate?: Date;
  endDate?: Date;
}

class PlatformMetricsService {
  /**
   * Get real-time platform metrics
   */
  async getRealTimeMetrics() {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      activeUsers,
      recentTransactions,
      recentListings,
      ongoingMarkingJobs,
      systemLoad,
    ] = await Promise.all([
      // Active users (last 15 minutes)
      prisma.eventLog.findMany({
        where: {
          timestamp: { gte: fifteenMinutesAgo },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Recent transactions (last hour)
      prisma.payment.count({
        where: {
          createdAt: { gte: oneHourAgo },
          status: 'SUCCESS',
        },
      }),

      // Recent listings (last hour)
      prisma.property.count({
        where: {
          createdAt: { gte: oneHourAgo },
        },
      }),

      // Ongoing marking jobs
      prisma.propertyMarkingJob.count({
        where: {
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
      }),

      // System load
      this.getSystemLoad(),
    ]);

    return {
      timestamp: now,
      activeUsers: activeUsers.length,
      recentTransactions,
      recentListings,
      ongoingMarkingJobs,
      systemLoad,
    };
  }

  /**
   * Get platform performance metrics
   */
  async getPerformanceMetrics(params: PerformanceMetricsParams) {
    const { startDate, endDate, granularity } = params;

    const dateRange = this.getDateRange(startDate, endDate);

    // Get API response times (from event logs or separate metrics table)
    const apiMetrics = await this.getAPIResponseTimes(dateRange.startDate, dateRange.endDate);

    // Get database query performance
    const dbMetrics = await this.getDatabaseQueryPerformance(dateRange.startDate, dateRange.endDate);

    // Group by granularity
    const groupedMetrics = this.groupMetricsByGranularity(
      [...apiMetrics, ...dbMetrics],
      granularity
    );

    return {
      metrics: groupedMetrics,
      summary: {
        averageResponseTime: this.calculateAverage(apiMetrics.map((m) => m.responseTime)),
        p95ResponseTime: this.calculatePercentile(apiMetrics.map((m) => m.responseTime), 95),
        p99ResponseTime: this.calculatePercentile(apiMetrics.map((m) => m.responseTime), 99),
      },
      dateRange: dateRange,
    };
  }

  /**
   * Get API usage statistics
   */
  async getAPIUsage(params: APIUsageParams) {
    const { startDate, endDate, endpoint } = params;

    const dateRange = this.getDateRange(startDate, endDate);

    const where: any = {
      timestamp: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    if (endpoint) {
      where.type = endpoint;
    }

    const [totalRequests, requestsByType, requestsByUser] = await Promise.all([
      prisma.eventLog.count({ where }),
      prisma.eventLog.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      prisma.eventLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalRequests,
      requestsByType: requestsByType.sort((a, b) => b._count - a._count),
      topUsers: requestsByUser
        .sort((a, b) => b._count - a._count)
        .slice(0, 10),
      dateRange: dateRange,
    };
  }

  /**
   * Get error rate metrics
   */
  async getErrorRates(params: ErrorRatesParams) {
    const { startDate, endDate, groupBy } = params;

    const dateRange = this.getDateRange(startDate, endDate);

    // Get failed payments
    const failedPayments = await prisma.payment.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: {
        createdAt: true,
        failureReason: true,
      },
    });

    // Get failed marking jobs
    const failedMarkingJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: 'CANCELLED',
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by time period
    const groupedErrors = this.groupErrorsByPeriod(
      [...failedPayments, ...failedMarkingJobs],
      groupBy
    );

    // Calculate error rates
    const totalRequests = await prisma.eventLog.count({
      where: {
        timestamp: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });

    const totalErrors = failedPayments.length + failedMarkingJobs.length;
    const errorRate = (totalErrors / totalRequests) * 100;

    return {
      errorRate,
      totalErrors,
      totalRequests,
      groupedErrors,
      errorsByReason: this.groupErrorsByReason(failedPayments),
      dateRange: dateRange,
    };
  }

  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics() {
    // Get database connection pool stats
    const poolStats = await this.getDatabasePoolStats();

    // Get table sizes
    const tableSizes = await this.getTableSizes();

    // Get slow queries (if available)
    const slowQueries = await this.getSlowQueries();

    return {
      poolStats,
      tableSizes,
      slowQueries,
      timestamp: new Date(),
    };
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    const services = [
      { name: 'property-service', port: 3001 },
      { name: 'payment-service', port: 3002 },
      { name: 'admin-service', port: 3003 },
      { name: 'marking-service', port: 3004 },
      { name: 'referral-service', port: 3005 },
      { name: 'notification-service', port: 3006 },
    ];

    const healthChecks = await Promise.all(
      services.map(async (service) => {
        try {
          const isHealthy = await this.checkServiceHealth(service.name, service.port);
          return {
            service: service.name,
            status: isHealthy ? 'healthy' : 'unhealthy',
            port: service.port,
          };
        } catch (error) {
          return {
            service: service.name,
            status: 'unreachable',
            port: service.port,
            error: (error as Error).message,
          };
        }
      })
    );

    const allHealthy = healthChecks.every((check) => check.status === 'healthy');

    return {
      overallStatus: allHealthy ? 'healthy' : 'degraded',
      services: healthChecks,
      timestamp: new Date(),
    };
  }

  /**
   * Get uptime statistics
   */
  async getUptimeStats(params: UptimeStatsParams) {
    const { startDate, endDate } = params;
    const dateRange = this.getDateRange(startDate, endDate);

    // Calculate uptime based on error logs and health checks
    // In production, this would come from a monitoring service

    const totalMinutes = Math.floor(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60)
    );

    // Get downtime incidents (simulated - replace with actual monitoring data)
    const downtimeMinutes = 0; // Would come from monitoring service

    const uptimePercentage = ((totalMinutes - downtimeMinutes) / totalMinutes) * 100;

    return {
      uptimePercentage,
      totalMinutes,
      downtimeMinutes,
      dateRange: dateRange,
    };
  }

  // Helper methods
  private getDateRange(startDate?: Date, endDate?: Date) {
    return {
      startDate: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: endDate || new Date(),
    };
  }

  private async getSystemLoad() {
    return {
      cpuUsage: os.loadavg()[0],
      memoryUsage: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      uptime: os.uptime(),
    };
  }

  private async getAPIResponseTimes(startDate: Date, endDate: Date) {
    // In production, this would come from APM or logging service
    // Simulated data for now
    return [];
  }

  private async getDatabaseQueryPerformance(startDate: Date, endDate: Date) {
    // In production, this would come from database monitoring
    return [];
  }

  private groupMetricsByGranularity(metrics: any[], granularity: string) {
    // Group metrics by time period
    return metrics;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private groupErrorsByPeriod(errors: any[], groupBy: string) {
    // Group errors by time period
    const grouped: any = {};

    errors.forEach((error) => {
      const date = new Date(error.createdAt);
      let key: string;

      if (groupBy === 'hour') {
        key = date.toISOString().substring(0, 13) + ':00:00';
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, count: 0 };
      }
      grouped[key].count++;
    });

    return Object.values(grouped);
  }

  private groupErrorsByReason(failures: any[]) {
    const grouped: { [key: string]: number } = {};

    failures.forEach((failure) => {
      const reason = failure.failureReason || 'Unknown';
      grouped[reason] = (grouped[reason] || 0) + 1;
    });

    return Object.entries(grouped).map(([reason, count]) => ({ reason, count }));
  }

  private async getDatabasePoolStats() {
    // Get connection pool statistics from Prisma
    // This would need to be implemented based on your database setup
    return {
      active: 0,
      idle: 0,
      waiting: 0,
    };
  }

  private async getTableSizes() {
    // Query to get table sizes (PostgreSQL specific)
    // This would use raw SQL
    return [];
  }

  private async getSlowQueries() {
    // Get slow query log
    return [];
  }

  private async checkServiceHealth(serviceName: string, port: number): Promise<boolean> {
    // In production, this would make HTTP health check requests
    // For now, return true
    return true;
  }
}

export const platformMetricsService = new PlatformMetricsService();