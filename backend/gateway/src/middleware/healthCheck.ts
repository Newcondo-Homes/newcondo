// backend/gateway/src/middleware/healthCheck.ts
import { Request, Response } from "express";
import { config } from "../config/environment";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    [serviceName: string]: {
      status: "healthy" | "unhealthy" | "unknown";
      url: string;
      lastCheck?: string;
    };
  };
}

export const healthCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = Date.now();

  const services = {
    auth: { status: "unknown" as const, url: config.AUTH_SERVICE_URL },
    property: { status: "unknown" as const, url: config.PROPERTY_SERVICE_URL },
    payment: { status: "unknown" as const, url: config.PAYMENT_SERVICE_URL },
    booking: { status: "unknown" as const, url: config.BOOKING_SERVICE_URL },
    marking: { status: "unknown" as const, url: config.MARKING_SERVICE_URL },
    admin: { status: "unknown" as const, url: config.ADMIN_SERVICE_URL },
    referral: { status: "unknown" as const, url: config.REFERRAL_SERVICE_URL },
    notification: {
      status: "unknown" as const,
      url: config.NOTIFICATION_SERVICE_URL,
    },
    analytics: {
      status: "unknown" as const,
      url: config.ANALYTICS_SERVICE_URL,
    },
  };

  // Check each service health
  const healthChecks = Object.entries(services).map(
    async ([serviceName, serviceConfig]) => {
      try {
        const response = await fetch(`${serviceConfig.url}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        services[serviceName as keyof typeof services] = {
          ...serviceConfig,
          status: response.ok ? "healthy" : "unhealthy",
          lastCheck: new Date().toISOString(),
        };
      } catch (error) {
        services[serviceName as keyof typeof services] = {
          ...serviceConfig,
          status: "unhealthy",
          lastCheck: new Date().toISOString(),
        };
      }
    }
  );

  await Promise.allSettled(healthChecks);

  const allServicesHealthy = Object.values(services).every(
    (service) => service.status === "healthy"
  );

  const healthStatus: HealthStatus = {
    status: allServicesHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    services,
  };

  const statusCode = allServicesHealthy ? 200 : 503;
  res.status(statusCode).json(healthStatus);
};
