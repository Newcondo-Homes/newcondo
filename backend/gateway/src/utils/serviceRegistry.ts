// backend/gateway/src/utils/serviceRegistry.ts

import { logger } from './logger';
import { RedisClient } from '../config/redis';
import { ServiceInstance, ServiceRegistryConfig, HealthStatus } from '../types/gateway';

export class ServiceRegistry {
  private services: Map<string, ServiceInstance[]> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  private redis?: RedisClient;
  private config: ServiceRegistryConfig;

  constructor(config: ServiceRegistryConfig, redis?: RedisClient) {
    this.config = config;
    this.redis = redis;
    this.initializeServices();
  }

  private initializeServices(): void {
    // Initialize default services from config
    const defaultServices = {
      'auth-service': [
        {
          id: 'auth-1',
          name: 'auth-service',
          url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ],
      'property-service': [
        {
          id: 'property-1',
          name: 'property-service',
          url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3002',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ],
      'payment-service': [
        {
          id: 'payment-1',
          name: 'payment-service',
          url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ],
      'booking-service': [
        {
          id: 'booking-1',
          name: 'booking-service',
          url: process.env.BOOKING_SERVICE_URL || 'http://localhost:3004',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ],
      'admin-service': [
        {
          id: 'admin-1',
          name: 'admin-service',
          url: process.env.ADMIN_SERVICE_URL || 'http://localhost:3005',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ],
      'marking-service': [
        {
          id: 'marking-1',
          name: 'marking-service',
          url: process.env.MARKING_SERVICE_URL || 'http://localhost:3006',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ],
      'notification-service': [
        {
          id: 'notification-1',
          name: 'notification-service',
          url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ],
      'referral-service': [
        {
          id: 'referral-1',
          name: 'referral-service',
          url: process.env.REFERRAL_SERVICE_URL || 'http://localhost:3008',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ],
      'analytics-service': [
        {
          id: 'analytics-1',
          name: 'analytics-service',
          url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
          health: '/health',
          version: '1.0.0',
          status: 'healthy' as HealthStatus,
          lastHealthCheck: new Date(),
          metadata: {
            weight: 1,
            priority: 1
          }
        }
      ]
    };

    // Register default services
    Object.entries(defaultServices).forEach(([serviceName, instances]) => {
      this.services.set(serviceName, instances);
      this.startHealthChecks(serviceName);
    });

    logger.info('Service registry initialized with default services');
  }

  async register(service: Omit<ServiceInstance, 'id' | 'lastHealthCheck'>): Promise<void> {
    const serviceInstance: ServiceInstance = {
      ...service,
      id: `${service.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastHealthCheck: new Date()
    };

    const existingServices = this.services.get(service.name) || [];
    existingServices.push(serviceInstance);
    this.services.set(service.name, existingServices);

    // Store in Redis if available
    if (this.redis) {
      await this.redis.hset(
        `services:${service.name}`,
        serviceInstance.id,
        JSON.stringify(serviceInstance)
      );
    }

    // Start health checks for this service if not already running
    if (!this.healthChecks.has(service.name)) {
      this.startHealthChecks(service.name);
    }

    logger.info(`Service registered: ${service.name} (${serviceInstance.id})`);
  }

  async unregister(serviceName: string, instanceId: string): Promise<void> {
    const instances = this.services.get(serviceName);
    if (!instances) return;

    const filteredInstances = instances.filter(instance => instance.id !== instanceId);
    
    if (filteredInstances.length === 0) {
      this.services.delete(serviceName);
      this.stopHealthChecks(serviceName);
    } else {
      this.services.set(serviceName, filteredInstances);
    }

    // Remove from Redis if available
    if (this.redis) {
      await this.redis.hdel(`services:${serviceName}`, instanceId);
    }

    logger.info(`Service unregistered: ${serviceName} (${instanceId})`);
  }

  discover(serviceName: string): ServiceInstance[] {
    return this.services.get(serviceName)?.filter(instance => 
      instance.status === 'healthy'
    ) || [];
  }

  getAllServices(): Map<string, ServiceInstance[]> {
    return new Map(this.services);
  }

  getServiceInstance(serviceName: string, instanceId: string): ServiceInstance | undefined {
    const instances = this.services.get(serviceName);
    return instances?.find(instance => instance.id === instanceId);
  }

  private startHealthChecks(serviceName: string): void {
    if (this.healthChecks.has(serviceName)) return;

    const interval = setInterval(async () => {
      await this.performHealthCheck(serviceName);
    }, this.config.healthCheckInterval || 30000);

    this.healthChecks.set(serviceName, interval);
    logger.info(`Health checks started for service: ${serviceName}`);
  }

  private stopHealthChecks(serviceName: string): void {
    const interval = this.healthChecks.get(serviceName);
    if (interval) {
      clearInterval(interval);
      this.healthChecks.delete(serviceName);
      logger.info(`Health checks stopped for service: ${serviceName}`);
    }
  }

  private async performHealthCheck(serviceName: string): Promise<void> {
    const instances = this.services.get(serviceName);
    if (!instances) return;

    const healthCheckPromises = instances.map(async (instance) => {
      try {
        const response = await fetch(`${instance.url}${instance.health}`, {
          method: 'GET',
          timeout: this.config.healthCheckTimeout || 5000
        });

        const newStatus: HealthStatus = response.ok ? 'healthy' : 'unhealthy';
        
        if (instance.status !== newStatus) {
          logger.info(
            `Service ${serviceName} (${instance.id}) status changed: ${instance.status} -> ${newStatus}`
          );
        }

        instance.status = newStatus;
        instance.lastHealthCheck = new Date();

        // Update in Redis if available
        if (this.redis) {
          await this.redis.hset(
            `services:${serviceName}`,
            instance.id,
            JSON.stringify(instance)
          );
        }

      } catch (error) {
        logger.error(
          `Health check failed for ${serviceName} (${instance.id}):`,
          error
        );
        
        instance.status = 'unhealthy';
        instance.lastHealthCheck = new Date();

        // Update in Redis if available
        if (this.redis) {
          await this.redis.hset(
            `services:${serviceName}`,
            instance.id,
            JSON.stringify(instance)
          );
        }
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  async loadFromRedis(): Promise<void> {
    if (!this.redis) return;

    try {
      const serviceKeys = await this.redis.keys('services:*');
      
      for (const key of serviceKeys) {
        const serviceName = key.split(':')[1];
        const instances = await this.redis.hgetall(key);
        
        const serviceInstances: ServiceInstance[] = Object.values(instances)
          .map(instanceData => JSON.parse(instanceData as string));
        
        this.services.set(serviceName, serviceInstances);
        this.startHealthChecks(serviceName);
      }

      logger.info('Service registry loaded from Redis');
    } catch (error) {
      logger.error('Failed to load service registry from Redis:', error);
    }
  }

  async saveToRedis(): Promise<void> {
    if (!this.redis) return;

    try {
      for (const [serviceName, instances] of this.services.entries()) {
        for (const instance of instances) {
          await this.redis.hset(
            `services:${serviceName}`,
            instance.id,
            JSON.stringify(instance)
          );
        }
      }

      logger.info('Service registry saved to Redis');
    } catch (error) {
      logger.error('Failed to save service registry to Redis:', error);
    }
  }

  getHealthyInstances(serviceName: string): ServiceInstance[] {
    return this.discover(serviceName);
  }

  getServiceHealth(serviceName: string): {
    total: number;
    healthy: number;
    unhealthy: number;
    instances: ServiceInstance[];
  } {
    const instances = this.services.get(serviceName) || [];
    const healthy = instances.filter(i => i.status === 'healthy');
    const unhealthy = instances.filter(i => i.status === 'unhealthy');

    return {
      total: instances.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      instances
    };
  }

  shutdown(): void {
    // Stop all health checks
    for (const [serviceName] of this.healthChecks) {
      this.stopHealthChecks(serviceName);
    }

    logger.info('Service registry shutdown complete');
  }
}

export const createServiceRegistry = (
  config: ServiceRegistryConfig,
  redis?: RedisClient
): ServiceRegistry => {
  return new ServiceRegistry(config, redis);
};