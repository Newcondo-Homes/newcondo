// backend/gateway/src/utils/responseTransformer.ts
import { Response } from 'express';
import { logger } from './logger';

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
  requestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: Record<string, any>;
}

export interface TransformOptions {
  includeRequestId?: boolean;
  includeMeta?: boolean;
  customCode?: string;
  customMessage?: string;
}

class ResponseTransformer {
  /**
   * Transform successful response
   */
  success<T>(
    res: Response,
    data: T,
    options: TransformOptions = {}
  ): Response<StandardResponse<T>> {
    const response: StandardResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      ...(options.customMessage && { message: options.customMessage }),
      ...(options.customCode && { code: options.customCode }),
      ...(options.includeRequestId && { requestId: res.locals.requestId }),
      ...(options.includeMeta && res.locals.meta && { meta: res.locals.meta })
    };

    return res.json(response);
  }

  /**
   * Transform error response
   */
  error(
    res: Response,
    error: string | Error,
    statusCode: number = 500,
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    const errorMessage = error instanceof Error ? error.message : error;
    
    const response: StandardResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      ...(options.customCode && { code: options.customCode }),
      ...(options.includeRequestId && { requestId: res.locals.requestId })
    };

    // Log error details
    logger.error('API Error Response:', {
      error: errorMessage,
      statusCode,
      requestId: res.locals.requestId,
      path: res.req?.path,
      method: res.req?.method
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Transform paginated response
   */
  paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    options: TransformOptions = {}
  ): Response<StandardResponse<T[]>> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    const response: StandardResponse<T[]> = {
      success: true,
      data,
      pagination: {
        ...pagination,
        totalPages
      },
      timestamp: new Date().toISOString(),
      ...(options.customMessage && { message: options.customMessage }),
      ...(options.includeRequestId && { requestId: res.locals.requestId }),
      ...(options.includeMeta && res.locals.meta && { meta: res.locals.meta })
    };

    return res.json(response);
  }

  /**
   * Transform validation error response
   */
  validationError(
    res: Response,
    errors: Array<{ field: string; message: string }>,
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    const response: StandardResponse = {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      meta: { validationErrors: errors },
      timestamp: new Date().toISOString(),
      ...(options.includeRequestId && { requestId: res.locals.requestId })
    };

    return res.status(422).json(response);
  }

  /**
   * Transform not found response
   */
  notFound(
    res: Response,
    resource: string = 'Resource',
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    const response: StandardResponse = {
      success: false,
      error: `${resource} not found`,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      ...(options.includeRequestId && { requestId: res.locals.requestId })
    };

    return res.status(404).json(response);
  }

  /**
   * Transform unauthorized response
   */
  unauthorized(
    res: Response,
    message: string = 'Authentication required',
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    const response: StandardResponse = {
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
      ...(options.includeRequestId && { requestId: res.locals.requestId })
    };

    return res.status(401).json(response);
  }

  /**
   * Transform forbidden response
   */
  forbidden(
    res: Response,
    message: string = 'Access denied',
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    const response: StandardResponse = {
      success: false,
      error: message,
      code: 'FORBIDDEN',
      timestamp: new Date().toISOString(),
      ...(options.includeRequestId && { requestId: res.locals.requestId })
    };

    return res.status(403).json(response);
  }

  /**
   * Transform rate limit response
   */
  rateLimitExceeded(
    res: Response,
    retryAfter?: number,
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    const response: StandardResponse = {
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      ...(retryAfter && { meta: { retryAfter } }),
      ...(options.includeRequestId && { requestId: res.locals.requestId })
    };

    if (retryAfter) {
      res.set('Retry-After', retryAfter.toString());
    }

    return res.status(429).json(response);
  }

  /**
   * Transform service unavailable response
   */
  serviceUnavailable(
    res: Response,
    service: string,
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    const response: StandardResponse = {
      success: false,
      error: `${service} service is currently unavailable`,
      code: 'SERVICE_UNAVAILABLE',
      timestamp: new Date().toISOString(),
      ...(options.includeRequestId && { requestId: res.locals.requestId })
    };

    return res.status(503).json(response);
  }

  /**
   * Transform maintenance mode response
   */
  maintenanceMode(
    res: Response,
    estimatedDowntime?: string,
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    const response: StandardResponse = {
      success: false,
      error: 'System is under maintenance',
      code: 'MAINTENANCE_MODE',
      timestamp: new Date().toISOString(),
      ...(estimatedDowntime && { meta: { estimatedDowntime } }),
      ...(options.includeRequestId && { requestId: res.locals.requestId })
    };

    return res.status(503).json(response);
  }

  /**
   * Transform response based on status code
   */
  transformByStatusCode(
    res: Response,
    data: any,
    statusCode: number,
    options: TransformOptions = {}
  ): Response<StandardResponse> {
    switch (statusCode) {
      case 200:
      case 201:
        return this.success(res, data, options);
      case 400:
        return this.error(res, data.error || 'Bad request', 400, options);
      case 401:
        return this.unauthorized(res, data.error, options);
      case 403:
        return this.forbidden(res, data.error, options);
      case 404:
        return this.notFound(res, data.resource, options);
      case 422:
        return this.validationError(res, data.errors || [], options);
      case 429:
        return this.rateLimitExceeded(res, data.retryAfter, options);
      case 503:
        return this.serviceUnavailable(res, data.service || 'Unknown', options);
      default:
        return this.error(res, data.error || 'Internal server error', statusCode, options);
    }
  }

  /**
   * Extract error details from service response
   */
  extractServiceError(error: any): { message: string; code?: string; statusCode: number } {
    if (error.response) {
      // Axios error with response
      return {
        message: error.response.data?.error || error.response.statusText || 'Service error',
        code: error.response.data?.code,
        statusCode: error.response.status
      };
    } else if (error.request) {
      // Axios error without response (network error)
      return {
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
        statusCode: 503
      };
    } else if (error.code === 'ECONNREFUSED') {
      return {
        message: 'Service connection refused',
        code: 'SERVICE_UNAVAILABLE',
        statusCode: 503
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        message: 'Service request timeout',
        code: 'SERVICE_TIMEOUT',
        statusCode: 504
      };
    } else {
      return {
        message: error.message || 'Internal server error',
        code: error.code,
        statusCode: 500
      };
    }
  }

  /**
   * Middleware to add response transformer to res.locals
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      res.locals.transformer = this;
      
      // Add helper methods directly to response object
      res.success = (data: any, options?: TransformOptions) => this.success(res, data, options);
      res.error = (error: any, statusCode?: number, options?: TransformOptions) => 
        this.error(res, error, statusCode, options);
      res.paginated = (data: any[], pagination: any, options?: TransformOptions) => 
        this.paginated(res, data, pagination, options);
      res.validationError = (errors: any[], options?: TransformOptions) => 
        this.validationError(res, errors, options);
      res.notFound = (resource?: string, options?: TransformOptions) => 
        this.notFound(res, resource, options);
      res.unauthorized = (message?: string, options?: TransformOptions) => 
        this.unauthorized(res, message, options);
      res.forbidden = (message?: string, options?: TransformOptions) => 
        this.forbidden(res, message, options);
      res.rateLimitExceeded = (retryAfter?: number, options?: TransformOptions) => 
        this.rateLimitExceeded(res, retryAfter, options);
      res.serviceUnavailable = (service: string, options?: TransformOptions) => 
        this.serviceUnavailable(res, service, options);

      next();
    };
  }
}

// Create singleton instance
export const responseTransformer = new ResponseTransformer();

// Export middleware
export const responseTransformerMiddleware = responseTransformer.middleware();

export default responseTransformer;