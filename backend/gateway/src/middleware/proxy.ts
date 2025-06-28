// backend/gateway/src/middleware/proxy.ts
import { Request, Response, NextFunction } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { serviceConfig } from "../config";
import { logger } from "../utils/logger";
import { circuitBreakerManager } from "../utils/circuitBreaker";
import { v4 as uuidv4 } from "uuid";

interface ProxyRequest extends Request {
  correlationId?: string;
  startTime?: number;
}

// Enhanced proxy options with circuit breaker and logging
const createServiceProxy = (serviceName: string, serviceUrl: string) => {
  const circuitBreaker = circuitBreakerManager.getCircuitBreaker(serviceName);

  const proxyOptions: Options = {
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      // Remove the /api/{service} prefix
      const routePrefix = Object.keys(serviceConfig.routes).find((route) =>
        path.startsWith(route)
      );
      if (routePrefix) {
        return path.replace(routePrefix, "");
      }
      return path;
    },

    // Timeout configuration
    timeout:
      serviceConfig.services[serviceName as keyof typeof serviceConfig.services]
        ?.timeout || 10000,
    proxyTimeout:
      serviceConfig.services[serviceName as keyof typeof serviceConfig.services]
        ?.timeout || 10000,

    // Headers manipulation
    onProxyReq: (proxyReq, req: ProxyRequest, res) => {
      // Add correlation ID for request tracing
      if (!req.correlationId) {
        req.correlationId = uuidv4();
      }
      proxyReq.setHeader("X-Correlation-ID", req.correlationId);
      proxyReq.setHeader("X-Gateway-Service", serviceName);
      proxyReq.setHeader("X-Forwarded-For", req.ip);
      proxyReq.setHeader("X-Real-IP", req.ip);

      // Add user context if available
      if (req.user) {
        proxyReq.setHeader("X-User-ID", req.user.id);
        proxyReq.setHeader("X-User-Role", req.user.role);
      }

      req.startTime = Date.now();

      logger.debug(`Proxying request to ${serviceName}`, {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        service: serviceName,
        target: serviceUrl,
      });
    },

    onProxyRes: (proxyRes, req: ProxyRequest, res) => {
      const duration = req.startTime ? Date.now() - req.startTime : 0;

      // Add response headers
      proxyRes.headers["X-Gateway-Service"] = serviceName;
      proxyRes.headers["X-Correlation-ID"] = req.correlationId || "";
      proxyRes.headers["X-Response-Time"] = `${duration}ms`;

      logger.info(`Response from ${serviceName}`, {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        service: serviceName,
        statusCode: proxyRes.statusCode,
        duration: `${duration}ms`,
      });
    },

    onError: (err, req: ProxyRequest, res) => {
      const duration = req.startTime ? Date.now() - req.startTime : 0;

      logger.error(`Proxy error for ${serviceName}`, {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        service: serviceName,
        error: err.message,
        duration: `${duration}ms`,
      });

      // Handle different types of errors
      if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
        res.status(503).json({
          error: "Service Unavailable",
          message: `${serviceName} is currently unavailable`,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      } else if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT") {
        res.status(504).json({
          error: "Gateway Timeout",
          message: `Request to ${serviceName} timed out`,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(502).json({
          error: "Bad Gateway",
          message: `Error communicating with ${serviceName}`,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
        });
      }
    },
  };

  return createProxyMiddleware(proxyOptions);
};

// Circuit breaker wrapper for proxy middleware
export const createCircuitBreakerProxy = (
  serviceName: string,
  serviceUrl: string
) => {
  const proxy = createServiceProxy(serviceName, serviceUrl);
  const circuitBreaker = circuitBreakerManager.getCircuitBreaker(serviceName);

  return async (req: ProxyRequest, res: Response, next: NextFunction) => {
    try {
      await circuitBreaker.execute(async () => {
        return new Promise<void>((resolve, reject) => {
          const originalEnd = res.end;
          const originalWrite = res.write;
          let hasEnded = false;

          // Override res.end to capture when response is complete
          res.end = function (chunk?: any, encoding?: any) {
            if (!hasEnded) {
              hasEnded = true;
              if (res.statusCode >= 400) {
                reject(new Error(`HTTP ${res.statusCode}`));
              } else {
                resolve();
              }
            }
            return originalEnd.call(this, chunk, encoding);
          };

          // Override res.write to detect errors
          res.write = function (chunk: any, encoding?: any) {
            if (res.statusCode >= 400) {
              if (!hasEnded) {
                hasEnded = true;
                reject(new Error(`HTTP ${res.statusCode}`));
              }
            }
            return originalWrite.call(this, chunk, encoding);
          };

          proxy(req, res, (error) => {
            if (error && !hasEnded) {
              hasEnded = true;
              reject(error);
            }
          });
        });
      });
    } catch (error) {
      logger.error(`Circuit breaker prevented request to ${serviceName}`, {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
        circuitState: circuitBreaker.getState(),
      });

      res.status(503).json({
        error: "Service Unavailable",
        message: `${serviceName} is currently unavailable (Circuit breaker is open)`,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    }
  };
};

// Create proxy middlewares for all services
export const createServiceProxies = () => {
  const proxies: Record<string, any> = {};

  for (const [route, serviceName] of Object.entries(serviceConfig.routes)) {
    const serviceConfig_ =
      serviceConfig.services[
        serviceName as keyof typeof serviceConfig.services
      ];
    if (serviceConfig_) {
      proxies[route] = createCircuitBreakerProxy(
        serviceName,
        serviceConfig_.url
      );
      logger.info(
        `Created proxy for ${route} -> ${serviceName} (${serviceConfig_.url})`
      );
    }
  }

  return proxies;
};
