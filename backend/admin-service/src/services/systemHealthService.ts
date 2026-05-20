// backend/admin-service/src/services/systemHealthService.ts
import { PrismaClient } from '@newcondo/db';
import { 
  SystemHealth, 
  ServiceStatus, 
  DatabaseHealth,
  ApiPerformance,
  ResourceUsage,
  SystemAlert
} from '../types/systemHealth';
import axios from 'axios';
import os from 'os';

const prisma = new PrismaClient();

//TODO: make sure the urls match for both development and production
export class SystemHealthService {
  private readonly services = [
    { name: 'admin-service', url: process.env.ADMIN_SERVICE_URL || 'http://localhost:4001' },
    { name: 'property-service', url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:4002' },
    { name: 'payment-service', url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4003' },
    { name: 'booking-service', url: process.env.BOOKING_SERVICE_URL || 'http://localhost:4004' },
    { name: 'marking-service', url: process.env.MARKING_SERVICE_URL || 'http://localhost:4005' },
    { name: 'notification-service', url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006' },
    { name: 'referral-service', url: process.env.REFERRAL_SERVICE_URL || 'http://localhost:4007' },
    { name: 'analytics-service', url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4008' }
  ];

  /**
   * Get comprehensive system health overview
   */
  async getSystemHealthOverview(): Promise<SystemHealth> {
    const [
      serviceStatuses,
      databaseHealth,
      apiPerformance,
      resourceUsage,
      activeAlerts
    ] = await Promise.all([
      this.checkAllServices(),
      this.checkDatabaseHealth(),
      this.getApiPerformanceMetrics(),
      this.getResourceUsage(),
      this.getActiveAlerts()
    ]);

    const healthScore = this.calculateHealthScore({
      serviceStatuses,
      databaseHealth,
      resourceUsage,
      activeAlerts
    });

    return {
      healthScore,
      status: this.getOverallStatus(healthScore),
      serviceStatuses,
      databaseHealth,
      apiPerformance,
      resourceUsage,
      activeAlerts: activeAlerts.length,
      lastChecked: new Date()
    };
  }

  /**
   * Check status of all microservices
   */
  async checkAllServices(): Promise<ServiceStatus[]> {
    const statusChecks = this.services.map(async (service) => {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${service.url}/health`, {
          timeout: 5000
        });
        const responseTime = Date.now() - startTime;

        return {
          name: service.name,
          status: 'healthy' as const,
          responseTime,
          uptime: response.data.uptime || 0,
          lastChecked: new Date(),
          version: response.data.version || '1.0.0',
          dependencies: response.data.dependencies || []
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'unhealthy' as const,
          responseTime: 0,
          uptime: 0,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Service unreachable',
          version: 'unknown',
          dependencies: []
        };
      }
    });

    return Promise.all(statusChecks);
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth(): Promise<DatabaseHealth> {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      const connectionTime = Date.now() - startTime;

      // Get database size
      const dbSize = await this.getDatabaseSize();

      // Get connection pool stats
      const poolStats = await this.getConnectionPoolStats();

      // Get slow queries
      const slowQueries = await this.getSlowQueries();

      return {
        status: 'healthy',
        connectionTime,
        poolActive: poolStats.active,
        poolIdle: poolStats.idle,
        poolTotal: poolStats.total,
        databaseSize: dbSize,
        slowQueries: slowQueries.length,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connectionTime: 0,
        poolActive: 0,
        poolIdle: 0,
        poolTotal: 0,
        databaseSize: '0 MB',
        slowQueries: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Database connection failed'
      };
    }
  }

  /**
   * Get API performance metrics
   */
  async getApiPerformanceMetrics(
    startDate?: Date, 
    endDate?: Date
  ): Promise<ApiPerformance> {
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endDate || new Date();

    // Get request logs from event logs
    const requests = await prisma.eventLog.findMany({
      where: {
        type: { in: ['API_REQUEST', 'API_ERROR'] },
        timestamp: { gte: start, lte: end }
      }
    });

    const totalRequests = requests.length;
    const errorRequests = requests.filter(r => r.type === 'API_ERROR').length;
    
    // Calculate response times from metadata
    const responseTimes = requests
      .filter(r => r.metadata && typeof r.metadata === 'object' && 'responseTime' in r.metadata)
      .map(r => (r.metadata as any).responseTime as number);

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);

    return {
      totalRequests,
      successfulRequests: totalRequests - errorRequests,
      failedRequests: errorRequests,
      errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond: totalRequests / ((end.getTime() - start.getTime()) / 1000),
      period: { startDate: start, endDate: end }
    };
  }

  /**
   * Get error logs
   */
  async getErrorLogs(limit: number = 100, startDate?: Date) {
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.eventLog.findMany({
      where: {
        type: { contains: 'ERROR' },
        timestamp: { gte: start }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  /**
   * Get resource usage metrics
   */
  async getResourceUsage(): Promise<ResourceUsage> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const cpuUsage = await this.getCpuUsage();

    return {
      memory: {
        total: this.formatBytes(totalMemory),
        used: this.formatBytes(usedMemory),
        free: this.formatBytes(freeMemory),
        usagePercentage: (usedMemory / totalMemory) * 100
      },
      cpu: {
        cores: os.cpus().length,
        usage: cpuUsage,
        loadAverage: os.loadavg()
      },
      disk: await this.getDiskUsage(),
      uptime: os.uptime()
    };
  }

  /**
   * Get queue status for marking jobs and notifications
   */
  async getQueueStatus() {
    const [markingQueue, notificationQueue] = await Promise.all([
      this.getMarkingJobQueueStatus(),
      this.getNotificationQueueStatus()
    ]);

    return {
      markingJobs: markingQueue,
      notifications: notificationQueue
    };
  }

  /**
   * Get external integration health
   */
  async getIntegrationHealth() {
    return {
      flutterwave: await this.checkFlutterwaveHealth(),
      googleMaps: await this.checkGoogleMapsHealth(),
      emailService: await this.checkEmailServiceHealth(),
      smsService: await this.checkSmsServiceHealth()
    };
  }

  /**
   * Get active system alerts
   */
  async getActiveAlerts(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    // Check for high error rates
    const recentErrors = await prisma.eventLog.count({
      where: {
        type: { contains: 'ERROR' },
        timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      }
    });

    if (recentErrors > 100) {
      alerts.push({
        id: 'high-error-rate',
        severity: 'critical',
        message: `High error rate detected: ${recentErrors} errors in the last hour`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Check for slow database queries
    const slowQueries = await this.getSlowQueries();
    if (slowQueries.length > 10) {
      alerts.push({
        id: 'slow-queries',
        severity: 'warning',
        message: `${slowQueries.length} slow database queries detected`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Check for pending marking jobs
    const pendingJobs = await prisma.propertyMarkingJob.count({
      where: {
        status: 'QUEUED',
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
      }
    });

    if (pendingJobs > 20) {
      alerts.push({
        id: 'pending-marking-jobs',
        severity: 'warning',
        message: `${pendingJobs} marking jobs pending for over 24 hours`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck() {
    const checks = {
      database: await this.checkDatabaseHealth(),
      services: await this.checkAllServices(),
      integrations: await this.getIntegrationHealth(),
      queues: await this.getQueueStatus()
    };

    const issues: string[] = [];

    if (checks.database.status === 'unhealthy') {
      issues.push('Database is unhealthy');
    }

    checks.services.forEach(service => {
      if (service.status === 'unhealthy') {
        issues.push(`${service.name} is unhealthy`);
      }
    });

    return {
      status: issues.length === 0 ? 'healthy' : 'unhealthy',
      checks,
      issues,
      timestamp: new Date()
    };
  }

  // Helper methods
  private calculateHealthScore(data: {
    serviceStatuses: ServiceStatus[];
    databaseHealth: DatabaseHealth;
    resourceUsage: ResourceUsage;
    activeAlerts: SystemAlert[];
  }): number {
    let score = 100;

    // Deduct for unhealthy services
    const unhealthyServices = data.serviceStatuses.filter(s => s.status === 'unhealthy').length;
    score -= unhealthyServices * 10;

    // Deduct for database issues
    if (data.databaseHealth.status === 'unhealthy') {
      score -= 20;
    }

    // Deduct for high resource usage
    if (data.resourceUsage.memory.usagePercentage > 90) {
      score -= 10;
    }
    if (data.resourceUsage.cpu.usage > 90) {
      score -= 10;
    }

    // Deduct for active alerts
    score -= data.activeAlerts.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  private getOverallStatus(healthScore: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (healthScore >= 80) return 'healthy';
    if (healthScore >= 50) return 'degraded';
    return 'unhealthy';
  }

  private async getDatabaseSize(): Promise<string> {
    try {
      const result = await prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) as size
      `;
      const bytes = Number(result[0].size);
      return this.formatBytes(bytes);
    } catch {
      return '0 MB';
    }
  }

  private async getConnectionPoolStats() {
    // This would need to be implemented based on your connection pool library
    return {
      active: 5,
      idle: 10,
      total: 15
    };
  }

  private async getSlowQueries() {
    // This would query PostgreSQL's pg_stat_statements if available
    return [];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();
      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure);
        const totalUsage = (endMeasure.user + endMeasure.system) / 1000000; // Convert to seconds
        const cpuPercent = (totalUsage / 0.1) * 100; // 100ms measurement period
        resolve(Math.min(100, cpuPercent));
      }, 100);
    });
  }

  private async getDiskUsage() {
    // Platform-specific disk usage
    return {
      total: '100 GB',
      used: '45 GB',
      free: '55 GB',
      usagePercentage: 45
    };
  }

  private formatBytes(bytes: number): string {
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(2)} MB`;
  }

  private async getMarkingJobQueueStatus() {
    const [queued, inProgress, completed] = await Promise.all([
      prisma.propertyMarkingJob.count({ where: { status: 'QUEUED' } }),
      prisma.propertyMarkingJob.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.propertyMarkingJob.count({ where: { status: 'COMPLETED' } })
    ]);

    return { queued, inProgress, completed, total: queued + inProgress + completed };
  }

  private async getNotificationQueueStatus() {
    // This would query your notification queue (Redis, etc.)
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
  }

  private async checkFlutterwaveHealth() {
    try {
      // Ping Flutterwave API
      const response = await axios.get('https://api.flutterwave.com/v3/status', {
        timeout: 5000,
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
      });
      return { status: 'healthy', message: response.data.message };
    } catch {
      return { status: 'unhealthy', message: 'Unable to reach Flutterwave API' };
    }
  }

  private async checkGoogleMapsHealth() {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${process.env.GOOGLE_MAPS_API_KEY}`,
        { timeout: 5000 }
      );
      return { status: response.data.status === 'OK' ? 'healthy' : 'degraded' };
    } catch {
      return { status: 'unhealthy', message: 'Unable to reach Google Maps API' };
    }
  }

  private async checkEmailServiceHealth() {
    // Check your email service (Resend, SendGrid, etc.)
    return { status: 'healthy' as const };
  }

  private async checkSmsServiceHealth() {
    // Check your SMS service (Twilio, Termii, etc.)
    return { status: 'healthy' as const };
  }
}

export default new SystemHealthService();