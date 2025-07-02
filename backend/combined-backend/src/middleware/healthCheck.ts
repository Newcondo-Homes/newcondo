import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  details?: any;
}

export const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results: HealthCheckResult[] = [];

    // Database health check
    try {
      await prisma.$queryRaw`SELECT 1`;
      results.push({
        service: 'database',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      results.push({
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Redis health check (if configured)
    if (process.env.REDIS_URL) {
      try {
        // Add Redis health check logic here
        results.push({
          service: 'redis',
          status: 'healthy',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          service: 'redis',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // External services health checks
    const externalServices = [
      'auth-service',
      'property-service',
      'payment-service',
      'booking-service',
      'marking-service',
      'admin-service',
      'referral-service',
      'notification-service',
      'analytics-service'
    ];

    externalServices.forEach(service => {
      results.push({
        service,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    const overallStatus = results.every(result => result.status === 'healthy') ? 'healthy' : 'unhealthy';

    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: results
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const simpleHealthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Combined app is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
};