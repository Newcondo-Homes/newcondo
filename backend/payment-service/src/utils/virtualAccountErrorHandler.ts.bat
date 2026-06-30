// backend/payment-service/src/utils/virtualAccountErrorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { virtualAccountLogger } from './virtualAccountLogger';
import { VirtualAccountError, FlutterwaveError } from '../types/virtualAccountTypes';

export class VirtualAccountErrorHandler {
  /**
   * Handle virtual account specific errors
   */
  static handleVirtualAccountError(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void {
    virtualAccountLogger.error('Virtual account error occurred', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      requestId: req.headers['x-request-id'],
      endpoint: req.originalUrl,
      method: req.method,
    });

    // Handle specific virtual account errors
    if (error instanceof VirtualAccountError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }

    // Handle Flutterwave API errors
    if (error instanceof FlutterwaveError) {
      return this.handleFlutterwaveError(error, req, res);
    }

    // Handle validation errors
    if (error.name === 'ValidationError' || error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues || error.details || error.message,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }

    // Handle database errors
    if (error.code && error.code.startsWith('P')) { // Prisma errors
      return this.handleDatabaseError(error, req, res);
    }

    // Handle network/timeout errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      virtualAccountLogger.error('Network error in virtual account operation', {
        error: error.message,
        code: error.code,
        userId: req.user?.id,
      });

      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'External service temporarily unavailable',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }

    // If not handled above, pass to next error handler
    next(error);
  }

  /**
   * Handle Flutterwave-specific errors
   */
  private static handleFlutterwaveError(
    error: FlutterwaveError,
    req: Request,
    res: Response
  ): Response {
    const statusCode = this.mapFlutterwaveErrorToStatusCode(error.code);

    virtualAccountLogger.error('Flutterwave API error', {
      error: error.message,
      code: error.code,
      statusCode,
      userId: req.user?.id,
      flutterwaveResponse: error.response,
    });

    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: this.getFlutterwaveErrorMessage(error.code),
        details: error.details,
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }

  /**
   * Handle database-specific errors
   */
  private static handleDatabaseError(
    error: any,
    req: Request,
    res: Response
  ): Response {
    let statusCode = 500;
    let code = 'DATABASE_ERROR';
    let message = 'Database operation failed';

    switch (error.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409;
        code = 'DUPLICATE_VIRTUAL_ACCOUNT';
        message = 'Virtual account already exists';
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        code = 'VIRTUAL_ACCOUNT_NOT_FOUND';
        message = 'Virtual account not found';
        break;
      case 'P2003': // Foreign key constraint violation
        statusCode = 400;
        code = 'INVALID_REFERENCE';
        message = 'Referenced record does not exist';
        break;
      case 'P2014': // Relation violation
        statusCode = 400;
        code = 'RELATION_VIOLATION';
        message = 'Cannot perform operation due to related records';
        break;
    }

    virtualAccountLogger.error('Database error in virtual account operation', {
      error: error.message,
      code: error.code,
      meta: error.meta,
      userId: req.user?.id,
    });

    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }

  /**
   * Map Flutterwave error codes to HTTP status codes
   */
  private static mapFlutterwaveErrorToStatusCode(errorCode: string): number {
    const errorCodeMap: Record<string, number> = {
      'ACCOUNT_CREATION_FAILED': 400,
      'ACCOUNT_ALREADY_EXISTS': 409,
      'INSUFFICIENT_FUNDS': 400,
      'INVALID_ACCOUNT': 400,
      'ACCOUNT_DISABLED': 403,
      'RATE_LIMIT_EXCEEDED': 429,
      'AUTHENTICATION_FAILED': 401,
      'AUTHORIZATION_FAILED': 403,
      'SERVICE_UNAVAILABLE': 503,
      'TIMEOUT': 408,
    };

    return errorCodeMap[errorCode] || 500;
  }

  /**
   * Get user-friendly error messages for Flutterwave errors
   */
  private static getFlutterwaveErrorMessage(errorCode: string): string {
    const messageMap: Record<string, string> = {
      'ACCOUNT_CREATION_FAILED': 'Failed to create virtual account. Please try again.',
      'ACCOUNT_ALREADY_EXISTS': 'Virtual account already exists for this user.',
      'INSUFFICIENT_FUNDS': 'Insufficient funds in virtual account.',
      'INVALID_ACCOUNT': 'Invalid virtual account details.',
      'ACCOUNT_DISABLED': 'Virtual account has been disabled.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later.',
      'AUTHENTICATION_FAILED': 'Authentication with payment provider failed.',
      'AUTHORIZATION_FAILED': 'Insufficient permissions for this operation.',
      'SERVICE_UNAVAILABLE': 'Payment service is temporarily unavailable.',
      'TIMEOUT': 'Request timed out. Please try again.',
    };

    return messageMap[errorCode] || 'An unexpected error occurred with the payment provider.';
  }

  /**
   * Create standardized virtual account error response
   */
  static createErrorResponse(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Async error wrapper for virtual account operations
   */
  static asyncErrorHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}

/**
 * Custom error classes for virtual accounts
 */
export class VirtualAccountError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'VirtualAccountError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class FlutterwaveError extends Error {
  public code: string;
  public statusCode: number;
  public response?: any;
  public details?: any;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    response?: any,
    details?: any
  ) {
    super(message);
    this.name = 'FlutterwaveError';
    this.code = code;
    this.statusCode = statusCode;
    this.response = response;
    this.details = details;
  }
}

/**
 * Predefined virtual account errors
 */
export const VirtualAccountErrors = {
  ACCOUNT_NOT_FOUND: (accountId?: string) => 
    new VirtualAccountError(
      'ACCOUNT_NOT_FOUND',
      'Virtual account not found',
      404,
      { accountId }
    ),

  ACCOUNT_CREATION_FAILED: (reason?: string) => 
    new VirtualAccountError(
      'ACCOUNT_CREATION_FAILED',
      'Failed to create virtual account',
      400,
      { reason }
    ),

  ACCOUNT_DISABLED: (accountId: string) => 
    new VirtualAccountError(
      'ACCOUNT_DISABLED',
      'Virtual account is disabled',
      403,
      { accountId }
    ),

  INSUFFICIENT_BALANCE: (available: number, required: number) => 
    new VirtualAccountError(
      'INSUFFICIENT_BALANCE',
      'Insufficient account balance',
      400,
      { available, required }
    ),

  INVALID_AMOUNT: (amount: number) => 
    new VirtualAccountError(
      'INVALID_AMOUNT',
      'Invalid transaction amount',
      400,
      { amount }
    ),

  TRANSFER_FAILED: (reason?: string) => 
    new VirtualAccountError(
      'TRANSFER_FAILED',
      'Virtual account transfer failed',
      400,
      { reason }
    ),

  DUPLICATE_ACCOUNT: (userId: string) => 
    new VirtualAccountError(
      'DUPLICATE_ACCOUNT',
      'User already has a virtual account',
      409,
      { userId }
    ),

  RECONCILIATION_FAILED: (reason?: string) => 
    new VirtualAccountError(
      'RECONCILIATION_FAILED',
      'Account reconciliation failed',
      500,
      { reason }
    ),
};