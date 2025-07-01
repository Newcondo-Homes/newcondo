// backend/gateway/src/utils/serviceDiscovery.ts
import { createLogger } from './logger';
import { config } from '../config';

const logger = createLogger('ServiceDiscovery');

export interface ServiceEndpoint {
  name: string;
  url: string;
  health: string;
  priority: number;
  lastChecked: number;
  isHealthy: boolean;
}

export interface ServiceConfig {
  [serviceName: string]: {
    endpoints: string[];
    healthPath: string;
    timeout: number;
    retries: number;
  };
}

class ServiceDiscovery {
  private services: Map<string, ServiceEndpoint[]> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.initializeServices();
    this.startHealthChecks();
  }

  /**
   * Initialize services from configuration
   */
  private initializeServices() {
    const serviceConfig: ServiceConfig = {
      'auth-service': {
        endpoints: [config.services.auth.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      },
      'property-service': {
        endpoints: [config.services.property.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      },
      'payment-service': {
        endpoints: [config.services.payment.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      },
      'booking-service': {
        endpoints: [config.services.booking.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      },
      'marking-service': {
        endpoints: [config.services.marking.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      },
      'admin-service': {
        endpoints: [config.services.admin.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      },
      'referral-service': {
        endpoints: [config.services.referral.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      },
      'notification-service': {
        endpoints: [config.services.notification.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      },
      'analytics-service': {
        endpoints: [config.services.analytics.url],
        healthPath: '/health',
        timeout: this.REQUEST_TIMEOUT,
        retries: 3
      }
    };

    // Initialize service endpoints
    Object.entries(serviceConfig).forEach(([serviceName, config]) => {
      const endpoints: ServiceEndpoint[] = config.endpoints.map((url, index) => ({
        name: serviceName,
        url,
        health: `${url}${config.healthPath}`,
        priority: index + 1,
        lastChecked: 0,
        isHealthy: true // Assume healthy initially
      }));

      this.services.set(serviceName, endpoints);
    });

    logger.info('Service discovery initialized', {
      services: Array.from(this.services.keys()),
      totalEndpoints: Array.from(this.services.values()).reduce((acc, endpoints) => acc + endpoints.length, 0)
    });
  }

  /**
   * Get healthy endpoint for a service
   */
  public getServiceEndpoint(serviceName: string): ServiceEndpoint | null {
    const endpoints = this.services.get(serviceName);
    if (!endpoints || endpoints.length === 0) {
      logger.warn('Service not found', { serviceName });
      return null;
    }

    // Get healthy endpoints sorted by priority
    const healthyEndpoints = endpoints
      .filter(endpoint => endpoint.isHealthy)
      .sort((a, b) => a.priority - b.priority);

    if (healthyEndpoints.length === 0) {
      logger.error('No healthy endpoints available', { serviceName });
      return null;
    }

    // Return the highest priority healthy endpoint
    return healthyEndpoints[0];
  }

  /**
   * Get all endpoints for a service
   */
  public getServiceEndpoints(serviceName: string): ServiceEndpoint[] {
    return this.services.get(serviceName) || [];
  }

  /**
   * Mark endpoint as unhealthy
   */
  public markUnhealthy(serviceName: string, endpointUrl: string) {
    const endpoints = this.services.get(serviceName);
    if (endpoints) {
      const endpoint = endpoints.find(e => e.url === endpointUrl);
      if (endpoint) {
        endpoint.isHealthy = false;
        endpoint.lastChecked = Date.now();
        logger.warn('Marked endpoint as unhealthy', { serviceName, endpointUrl });
      }
    }
  }

  /**
   * Mark endpoint as healthy
   */
  public markHealthy(serviceName: string, endpointUrl: string) {
    const endpoints = this.services.get(serviceName);
    if (endpoints) {
      const endpoint = endpoints.find(e => e.url === endpointUrl);
      if (endpoint) {
        endpoint.isHealthy = true;
        endpoint.lastChecked = Date.now();
        logger.info('Marked endpoint as healthy', { serviceName, endpointUrl });
      }
    }
  }

  /**
   * Perform health check on an endpoint
   */
  private async performHealthCheck(endpoint: ServiceEndpoint): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(endpoint.health, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Gateway-HealthCheck/1.0'
        }
      });

      clearTimeout(timeoutId);
      
      const isHealthy = response.ok && response.status === 200;
      endpoint.lastChecked = Date.now();
      
      return isHealthy;
    } catch (error) {
      logger.debug('Health check failed', {
        service: endpoint.name,
        url: endpoint.health,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      const allEndpoints = Array.from(this.services.values()).flat();
      
      const healthCheckPromises = allEndpoints.map(async (endpoint) => {
        const isHealthy = await this.performHealthCheck(endpoint);
        
        if (endpoint.isHealthy !== isHealthy) {
          if (isHealthy) {
            this.markHealthy(endpoint.name, endpoint.url);
          } else {
            this.markUnhealthy(endpoint.name, endpoint.url);
          }
        }
      });

      await Promise.allSettled(healthCheckPromises);
    }, this.HEALTH_CHECK_INTERVAL);

    logger.info('Health check monitoring started', {
      interval: this.HEALTH_CHECK_INTERVAL
    });
  }

  /**
   * Stop health checks
   */
  public stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health check monitoring stopped');
    }
  }

  /**
   * Get service health status
   */
  public getServiceHealth(): { [serviceName: string]: { total: number; healthy: number; unhealthy: number } } {
    const health: { [serviceName: string]: { total: number; healthy: number; unhealthy: number } } = {};

    this.services.forEach((endpoints, serviceName) => {
      const total = endpoints.length;
      const healthy = endpoints.filter(e => e.isHealthy).length;
      const unhealthy = total - healthy;

      health[serviceName] = { total, healthy, unhealthy };
    });

    return health;
  }

  /**
   * Force health check for a specific service
   */
  public async forceHealthCheck(serviceName: string): Promise<void> {
    const endpoints = this.services.get(serviceName);
    if (!endpoints) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const healthCheckPromises = endpoints.map(async (endpoint) => {
      const isHealthy = await this.performHealthCheck(endpoint);
      
      if (endpoint.isHealthy !== isHealthy) {
        if (isHealthy) {
          this.markHealthy(endpoint.name, endpoint.url);
        } else {
          this.markUnhealthy(endpoint.name, endpoint.url);
        }
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }
}

// Singleton instance
export const serviceDiscovery = new ServiceDiscovery();

// Graceful shutdown
process.on('SIGTERM', () => {
  serviceDiscovery.stopHealthChecks();
});

process.on('SIGINT', () => {
  serviceDiscovery.stopHealthChecks();
});