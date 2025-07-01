import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Extended Request interface to include context
export interface RequestWithContext extends Request {
  context: {
    requestId: string;
    startTime: number;
    userId?: string;
    userRole?: string;
    clientIp: string;
    userAgent: string;
    correlationId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Request Context Middleware
 * Adds contextual information to each request for tracking and logging
 */
export const requestContext = (
  req: RequestWithContext,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Generate unique request ID
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    
    // Extract correlation ID from headers (for distributed tracing)
    const correlationId = req.headers['x-correlation-id'] as string;
    
    // Extract session ID from headers or cookies
    const sessionId = req.headers['x-session-id'] as string || 
                     req.cookies?.sessionId;
    
    // Get client IP (considering proxy headers)
    const clientIp = getClientIp(req);
    
    // Get user agent
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Create request context
    req.context = {
      requestId,
      startTime: Date.now(),
      clientIp,
      userAgent,
      correlationId,
      sessionId,
      metadata: {}
    };
    
    // Set response headers for tracking
    res.setHeader('X-Request-ID', requestId);
    if (correlationId) {
      res.setHeader('X-Correlation-ID', correlationId);
    }
    
    // Log request start
    logger.info('Request started', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      clientIp,
      userAgent: userAgent.substring(0, 100), // Truncate long user agents
      correlationId,
      sessionId
    });
    
    // Add cleanup on response finish
    res.on('finish', () => {
      const duration = Date.now() - req.context.startTime;
      
      logger.info('Request completed', {
        requestId: req.context.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userId: req.context.userId,
        userRole: req.context.userRole
      });
    });
    
    next();
  } catch (error) {
    logger.error('Error in request context middleware', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    next(error);
  }
};

/**
 * Extract client IP address considering proxy headers
 */
function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  const xRealIp = req.headers['x-real-ip'] as string;
  const xClientIp = req.headers['x-client-ip'] as string;
  
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIp) {
    return xRealIp;
  }
  
  if (xClientIp) {
    return xClientIp;
  }
  
  // Fallback to connection remote address
  return req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection as any)?.socket?.remoteAddress || 
         'unknown';
}

/**
 * Middleware to add user context from authenticated requests
 */
export const addUserContext = (
  req: RequestWithContext,
  res: Response,
  next: NextFunction
): void => {
  try {
    // This assumes auth middleware has already run and added user info
    const user = (req as any).user;
    
    if (user) {
      req.context.userId = user.id || user.userId;
      req.context.userRole = user.role;
      req.context.metadata = {
        ...req.context.metadata,
        userType: user.userType,
        isVerified: user.isVerified,
        permissions: user.permissions
      };
    }
    
    next();
  } catch (error) {
    logger.error('Error in user context middleware', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.context?.requestId
    });
    next(error);
  }
};

/**
 * Middleware to add service-specific context
 */
export const addServiceContext = (serviceName: string) => {
  return (req: RequestWithContext, res: Response, next: NextFunction): void => {
    try {
      req.context.metadata = {
        ...req.context.metadata,
        targetService: serviceName,
        gatewayVersion: process.env.GATEWAY_VERSION || '1.0.0'
      };
      
      next();
    } catch (error) {
      logger.error('Error in service context middleware', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.context?.requestId,
        serviceName
      });
      next(error);
    }
  };
};

/**
 * Utility function to get request context from request object
 */
export const getRequestContext = (req: Request): RequestWithContext['context'] | null => {
  return (req as RequestWithContext).context || null;
};

/**
 * Utility function to update request metadata
 */
export const updateRequestMetadata = (
  req: RequestWithContext,
  metadata: Record<string, any>
): void => {
  if (req.context) {
    req.context.metadata = {
      ...req.context.metadata,
      ...metadata
    };
  }
};