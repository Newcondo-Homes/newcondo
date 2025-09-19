// backend/payment-service/src/utils/virtualAccountLogger.ts

import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Log levels for virtual account operations
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Custom format for virtual account logs
const virtualAccountFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Development format (more readable)
const developmentFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss' }),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

/**
 * Virtual Account Logger Configuration
 */
class VirtualAccountLogger {
  private logger: Logger;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

    this.logger = createLogger({
      level: logLevel,
      levels: LOG_LEVELS,
      format: isProduction ? virtualAccountFormat : developmentFormat,
      transports: this.createTransports(isProduction),
      exitOnError: false,
    });

    // Add colors for development
    if (!isProduction) {
      require('winston').addColors(LOG_COLORS);
    }
  }

  /**
   * Create transport configurations
   */
  private createTransports(isProduction: boolean): any[] {
    const transportsArray: any[] = [];

    // Console transport
    transportsArray.push(
      new transports.Console({
        handleExceptions: true,
        format: isProduction ? virtualAccountFormat : developmentFormat,
      })
    );

    if (isProduction) {
      // File transport for general logs
      transportsArray.push(
        new DailyRotateFile({
          filename: path.join(process.cwd(), 'logs/virtual-accounts/va-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
        })
      );

      // Error-specific transport
      transportsArray.push(
        new DailyRotateFile({
          filename: path.join(process.cwd(), 'logs/virtual-accounts/va-error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
        })
      );

      // Audit trail for critical operations
      transportsArray.push(
        new DailyRotateFile({
          filename: path.join(process.cwd(), 'logs/virtual-accounts/va-audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d', // Keep audit logs longer
          level: 'info',
          format: format.combine(
            format.timestamp(),
            format.json()
          ),
        })
      );
    }

    return transportsArray;
  }

  /**
   * Log virtual account creation
   */
  logAccountCreation(data: {
    userId: string;
    accountNumber: string;
    accountName: string;
    propertyId?: string;
    flutterwaveAccountId?: string;
    requestId?: string;
  }): void {
    this.logger.info('Virtual account created', {
      operation: 'ACCOUNT_CREATION',
      userId: data.userId,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      propertyId: data.propertyId,
      flutterwaveAccountId: data.flutterwaveAccountId,
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log balance updates
   */
  logBalanceUpdate(data: {
    accountId: string;
    userId: string;
    previousBalance: number;
    newBalance: number;
    amount: number;
    operation: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE';
    transactionId?: string;
    description?: string;
    requestId?: string;
  }): void {
    this.logger.info('Virtual account balance updated', {
      operation: 'BALANCE_UPDATE',
      accountId: data.accountId,
      userId: data.userId,
      previousBalance: data.previousBalance,
      newBalance: data.newBalance,
      amount: data.amount,
      balanceOperation: data.operation,
      transactionId: data.transactionId,
      description: data.description,
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log fund transfers
   */
  logFundTransfer(data: {
    fromAccountId: string;
    toAccountId?: string;
    userId: string;
    amount: number;
    currency: string;
    type: 'INTERNAL_TRANSFER' | 'EXTERNAL_TRANSFER' | 'WITHDRAWAL';
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    transactionId: string;
    description?: string;
    requestId?: string;
  }): void {
    this.logger.info('Virtual account fund transfer', {
      operation: 'FUND_TRANSFER',
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      transferType: data.type,
      status: data.status,
      transactionId: data.transactionId,
      description: data.description,
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log Flutterwave API interactions
   */
  logFlutterwaveOperation(data: {
    operation: string;
    endpoint: string;
    method: string;
    requestData?: any;
    responseData?: any;
    statusCode?: number;
    duration?: number;
    userId?: string;
    accountId?: string;
    requestId?: string;
    error?: any;
  }): void {
    const logLevel = data.error ? 'error' : 'info';
    
    this.logger[logLevel]('Flutterwave API operation', {
      operation: 'FLUTTERWAVE_API',
      apiOperation: data.operation,
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      duration: data.duration,
      userId: data.userId,
      accountId: data.accountId,
      requestId: data.requestId,
      requestData: this.sanitizeData(data.requestData),
      responseData: this.sanitizeData(data.responseData),
      error: data.error?.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log reconciliation operations
   */
  logReconciliation(data: {
    accountId: string;
    userId: string;
    recordedBalance: number;
    actualBalance: number;
    difference: number;
    status: 'MATCHED' | 'DISCREPANCY' | 'ERROR';
    transactionsChecked: number;
    period?: { from: Date; to: Date };
    requestId?: string;
  }): void {
    const logLevel = data.status === 'DISCREPANCY' ? 'warn' : 'info';
    
    this.logger[logLevel]('Virtual account reconciliation', {
      operation: 'RECONCILIATION',
      accountId: data.accountId,
      userId: data.userId,
      recordedBalance: data.recordedBalance,
      actualBalance: data.actualBalance,
      difference: data.difference,
      status: data.status,
      transactionsChecked: data.transactionsChecked,
      period: data.period,
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(data: {
    eventType: 'SUSPICIOUS_ACTIVITY' | 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'FRAUD_ATTEMPT';
    userId?: string;
    accountId?: string;
    ipAddress?: string;
    userAgent?: string;
    details: any;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    requestId?: string;
  }): void {
    this.logger.warn('Virtual account security event', {
      operation: 'SECURITY_EVENT',
      eventType: data.eventType,
      userId: data.userId,
      accountId: data.accountId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details,
      severity: data.severity,
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log errors with enhanced context
   */
  error(message: string, meta: any = {}): void {
    this.logger.error(message, {
      ...meta,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log warnings
   */
  warn(message: string, meta: any = {}): void {
    this.logger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log info messages
   */
  info(message: string, meta: any = {}): void {
    this.logger.info(message, {
      ...meta,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log debug messages
   */
  debug(message: string, meta: any = {}): void {
    this.logger.debug(message, {
      ...meta,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log HTTP requests
   */
  http(message: string, meta: any = {}): void {
    this.logger.http(message, {
      ...meta,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveKeys = [
      'password', 'secret', 'token', 'authorization', 'api_key',
      'credit_card', 'cvv', 'pin', 'otp', 'private_key'
    ];

    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      if (obj && typeof obj === 'object') {
        const result: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
          const lowercaseKey = key.toLowerCase();
          
          if (sensitiveKeys.some(sensitive => lowercaseKey.includes(sensitive))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeObject(value);
          }
        }
        
        return result;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Create child logger with additional context
   */
  child(context: any): Logger {
    return this.logger.child(context);
  }

  /**
   * Get logger instance for direct access
   */
  getInstance(): Logger {
    return this.logger;
  }
}

// Export singleton instance
export const virtualAccountLogger = new VirtualAccountLogger();

// Export class for custom instances if needed
export { VirtualAccountLogger };