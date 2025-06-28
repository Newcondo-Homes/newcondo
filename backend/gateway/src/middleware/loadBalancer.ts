/ backend/aaegtwy / src / middleware / loadBalancer.ts;
import { Request, Response, NextFunction } from "express";

interface ServiceInstance {
  url: string;
  isHealthy: boolean;
  lastHealthCheck: Date;
}

interface ServiceRegistry {
  [serviceName: string]: ServiceInstance[];
}

class LoadBalancer {
  private services: ServiceRegistry = {};
  private currentIndex: { [serviceName: string]: number } = {};

  constructor() {
    // Initialize health checks
    this.startHealthChecks();
  }

  registerService(serviceName: string, instances: string[]): void {
    this.services[serviceName] = instances.map((url) => ({
      url,
      isHealthy: true,
      lastHealthCheck: new Date(),
    }));
    this.currentIndex[serviceName] = 0;
  }

  getHealthyInstance(serviceName: string): ServiceInstance | null {
    const instances = this.services[serviceName];
    if (!instances || instances.length === 0) {
      return null;
    }

    const healthyInstances = instances.filter((instance) => instance.isHealthy);
    if (healthyInstances.length === 0) {
      return null;
    }

    // Round-robin load balancing
    const currentIdx = this.currentIndex[serviceName] || 0;
    const selectedInstance =
      healthyInstances[currentIdx % healthyInstances.length];

    this.currentIndex[serviceName] = (currentIdx + 1) % healthyInstances.length;

    return selectedInstance;
  }

  private async checkServiceHealth(
    instance: ServiceInstance
  ): Promise<boolean> {
    try {
      const response = await fetch(`${instance.url}/health`, {
        method: "GET",
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error(`Health check failed for ${instance.url}:`, error);
      return false;
    }
  }

  private async startHealthChecks(): Promise<void> {
    setInterval(async () => {
      for (const [serviceName, instances] of Object.entries(this.services)) {
        for (const instance of instances) {
          const isHealthy = await this.checkServiceHealth(instance);
          instance.isHealthy = isHealthy;
          instance.lastHealthCheck = new Date();

          if (!isHealthy) {
            console.warn(`Service instance ${instance.url} is unhealthy`);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

const loadBalancer = new LoadBalancer();

// Register service instances (in production, this would come from service discovery)
loadBalancer.registerService("auth", [
  process.env.AUTH_SERVICE_URL || "http://localhost:3001",
]);
loadBalancer.registerService("property", [
  process.env.PROPERTY_SERVICE_URL || "http://localhost:3002",
]);
loadBalancer.registerService("payment", [
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3003",
]);
loadBalancer.registerService("booking", [
  process.env.BOOKING_SERVICE_URL || "http://localhost:3004",
]);
loadBalancer.registerService("marking", [
  process.env.MARKING_SERVICE_URL || "http://localhost:3005",
]);
loadBalancer.registerService("admin", [
  process.env.ADMIN_SERVICE_URL || "http://localhost:3006",
]);
loadBalancer.registerService("referral", [
  process.env.REFERRAL_SERVICE_URL || "http://localhost:3007",
]);
loadBalancer.registerService("notification", [
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3008",
]);
loadBalancer.registerService("analytics", [
  process.env.ANALYTICS_SERVICE_URL || "http://localhost:3009",
]);

export const loadBalancerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add load balancer instance to request for use in route handlers
  (req as any).loadBalancer = loadBalancer;
  next();
};

export { loadBalancer };
