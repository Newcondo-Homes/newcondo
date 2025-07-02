// backend/combined-app/src/middleware/serviceRouting.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ServiceMetadata {
  name: string;
  version: string;
  endpoint: string;
  status: 'active' | 'inactive' | 'maintenance';
}

// Service registry for tracking which service handles which routes
const serviceRegistry: Map<string, ServiceMetadata> = new Map([
  ['auth', {
    name: 'Authentication Service',
    version: '1.0.0',
    endpoint: '/api/auth',
    status: 'active'
  }],
  ['properties', {
    name: 'Property Service',
    version: '1.0.0',
    endpoint: '/api/properties',
    status: 'active'
  }],
  ['payments', {
    name: 'Payment Service',
    version: '1.0.0',
    endpoint: '/api/payments',
    status: 'active'
  }],
  ['bookings', {
    name: 'Booking Service',
    version: '1.0.0',
    endpoint: '/api/bookings',
    status: 'active'
  }],
  ['marking', {
    name: 'Marking Service',
    version: '1.0.0',
    endpoint: '/api/marking',
    status: 'active'
  }],
  ['admin', {
    name: 'Admin Service',
    version: '1.0.0',
    endpoint: '/api/admin',
    status: 'active'
  }],
  ['referrals', {
    name: 'Referral Service',
    version: '1.0.0',
    endpoint: '/api/referrals',
    status: 'active'
  }],
  ['notifications', {
    name: 'Notification Service',
    version: '1.0.0',
    endpoint: '/api/notifications',
    status: 'active'
  }],
  ['analytics', {
    name: 'Analytics Service',
    version: '1.0.0',
    endpoint: '/api/analytics',
    status: 'active'
  }]
]);

// Middleware to add service context to requests
export const serviceContextMiddleware = (serviceName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const service = serviceRegistry.get(serviceName);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Service '${serviceName}' not found`,
        error: 'SERVICE_NOT_FOUND'
      });
    }

    if (service.status !== 'active') {
      return res.status(503).json({
        success: false,
        message: `Service '${serviceName}' is currently ${service.status}`,
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    // Add service context to request
    req.serviceContext = {
      serviceName,
      serviceMetadata: service,
      startTime: Date.now()
    };

    // Add service headers to response
    res.setHeader('X-Service-Name', service.name);
    res.setHeader('X-Service-Version', service.version);
    res.setHeader('X-Service-Endpoint', service.endpoint);

    logger.info(`Request routed to ${service.name}`, {
      serviceName,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    next();
  };
};

// Middleware to log service response times
export const serviceTimingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    if (req.serviceContext) {
      const duration = Date.now() - req.serviceContext.startTime;
      
      logger.info(`Service request completed`, {
        serviceName: req.serviceContext.serviceName,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: Buffer.byteLength(body)
      });

      // Add timing header
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Rate limiting per service
export const serviceRateLimit = (serviceName: string, maxRequests: number = 100, windowMs: number = 60000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${serviceName}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let requestData = requestCounts.get(key);
    
    if (!requestData || requestData.resetTime < windowStart) {
      requestData = { count: 1, resetTime: now + windowMs };
      requestCounts.set(key, requestData);
    } else {
      requestData.count++;
    }
    
    if (requestData.count > maxRequests) {
      logger.warn(`Rate limit exceeded for service ${serviceName}`, {
        serviceName,
        ip: req.ip,
        requestCount: requestData.count,
        maxRequests
      });
      
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded for ${serviceName} service`,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - requestData.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(requestData.resetTime / 1000));
    
    next();
  };
};

// Service health check middleware
export const serviceHealthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') {
    const services = Array.from(serviceRegistry.entries()).map(([key, service]) => ({
      name: key,
      ...service,
      healthy: service.status === 'active'
    }));
    
    const healthyServices = services.filter(s => s.healthy).length;
    const totalServices = services.length;
    
    return res.status(200).json({
      success: true,
      message: 'Combined app health check',
      data: {
        status: healthyServices === totalServices ? 'healthy' : 'degraded',
        services,
        summary: {
          total: totalServices,
          healthy: healthyServices,
          unhealthy: totalServices - healthyServices
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  }
  
  next();
};

// Get service registry
export const getServiceRegistry = (): Map<string, ServiceMetadata> => {
  return new Map(serviceRegistry);
};

// Update service status
export const updateServiceStatus = (serviceName: string, status: ServiceMetadata['status']): boolean => {
  const service = serviceRegistry.get(serviceName);
  if (service) {
    service.status = status;
    logger.info(`Service ${serviceName} status updated to ${status}`);
    return true;
  }
  return false;
};

// Service discovery endpoint
export const serviceDiscovery = (req: Request, res: Response) => {
  const services = Array.from(serviceRegistry.entries()).map(([key, service]) => ({
    id: key,
    ...service
  }));
  
  res.status(200).json({
    success: true,
    message: 'Available services',
    data: {
      services,
      count: services.length
    }
  });
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      serviceContext?: {
        serviceName: string;
        serviceMetadata: ServiceMetadata;
        startTime: number;
      };
    }
  }
}
