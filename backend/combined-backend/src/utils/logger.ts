import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

/**
 * Unified logging utility for combined-app
 * Provides structured logging across all services
 */

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define production log format (without colors)
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: logLevels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? productionFormat : logFormat,
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: productionFormat,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: productionFormat,
    }),
  ],
});

/**
 * Service-specific logger factory
 * @param serviceName - Name of the service
 * @returns Winston logger instance with service context
 */
const createServiceLogger = (serviceName: string) => {
  return {
    error: (message: string, meta?: any) => {
      logger.error(`[${serviceName.toUpperCase()}] ${message}`, meta);
    },
    warn: (message: string, meta?: any) => {
      logger.warn(`[${serviceName.toUpperCase()}] ${message}`, meta);
    },
    info: (message: string, meta?: any) => {
      logger.info(`[${serviceName.toUpperCase()}] ${message}`, meta);
    },
    http: (message: string, meta?: any) => {
      logger.http(`[${serviceName.toUpperCase()}] ${message}`, meta);
    },
    debug: (message: string, meta?: any) => {
      logger.debug(`[${serviceName.toUpperCase()}] ${message}`, meta);
    },
  };
};

/**
 * Request logging middleware
 * @param serviceName - Name of the service handling the request
 */
const requestLogger = (serviceName: string) => {
  const serviceLogger = createServiceLogger(serviceName);
  
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    // Log request
    serviceLogger.http(`${req.method} ${req.url} - Request started`, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    });
    
    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      serviceLogger.http(
        `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`,
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userId: req.user?.id,
        }
      );
    });
    
    next();
  };
};

/**
 * Error logging utility
 * @param error - Error object
 * @param context - Additional context information
 * @param serviceName - Name of the service where error occurred
 */
const logError = (error: Error, context: any = {}, serviceName: string = 'COMBINED') => {
  const serviceLogger = createServiceLogger(serviceName);
  
  serviceLogger.error(`Error: ${error.message}`, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Database operation logging
 * @param operation - Database operation name
 * @param table - Database table/collection name
 * @param duration - Operation duration
 * @param serviceName - Service performing the operation
 */
const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  serviceName: string
) => {
  const serviceLogger = createServiceLogger(serviceName);
  
  serviceLogger.debug(`DB ${operation} on ${table} - ${duration}ms`, {
    operation,
    table,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  });
};

/**
 * API call logging
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param statusCode - Response status code
 * @param duration - Request duration
 * @param serviceName - Service making the API call
 */
const logApiCall = (
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  serviceName: string
) => {
  const serviceLogger = createServiceLogger(serviceName);
  
  serviceLogger.info(`API ${method} ${endpoint} - ${statusCode} - ${duration}ms`, {
    endpoint,
    method,
    statusCode,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Performance monitoring utility
 * @param operationName - Name of the operation being measured
 * @param serviceName - Service performing the operation
 */
const createPerformanceTimer = (operationName: string, serviceName: string) => {
  const start = Date.now();
  const serviceLogger = createServiceLogger(serviceName);
  
  return {
    end: (additionalInfo?: any) => {
      const duration = Date.now() - start;
      serviceLogger.debug(`Performance: ${operationName} completed in ${duration}ms`, {
        operation: operationName,
        duration: `${duration}ms`,
        ...additionalInfo,
        timestamp: new Date().toISOString(),
      });
      return duration;
    },
  };
};

/**
 * Security event logging
 * @param event - Security event type
 * @param details - Event details
 * @param severity - Event severity (low, medium, high, critical)
 * @param serviceName - Service where event occurred
 */
 const logSecurityEvent = (
  event: string,
  details: any,
  severity: 'low' | 'medium' | 'high' | 'critical',
  serviceName: string
) => {
  const serviceLogger = createServiceLogger(serviceName);
  
  const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 
                   severity === 'medium' ? 'warn' : 'info';
  
  serviceLogger[logMethod](`Security Event: ${event}`, {
    event,
    severity,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;
export {
  logger,
  createServiceLogger,
  requestLogger,
  logError,
  logDatabaseOperation,
  logApiCall,
  createPerformanceTimer,
  logSecurityEvent,
};