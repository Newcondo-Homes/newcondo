import { Response } from "express";
import { ApiResponse } from '../types'; 
import { HttpStatusCode } from '../types';

/**
 * Standard API response interface
 */
export interface ApiResponseForUtil<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
  statusCode: number;
}

/**
 * Error response interface with additional error details
 */
export interface ErrorResponse extends ApiResponseForUtil<null> {
  error?: {
    code?: string;
    details?: any;
    stack?: string;
  };
}

/**
 * Creates a standardized response object (without sending it)
 * @param success Whether the operation was successful
 * @param message Response message
 * @param data Response data (optional)
 * @param errorCode Error code for failed responses (optional)
 * @param errorDetails Additional error details (optional)
 */
export const standardResponse = <T = any>(
  success: boolean,
  message: string,
  data: T | null = null,
  errorCode?: string,
  errorDetails?: any
): ApiResponseForUtil<T> | ErrorResponse => {
  const response: ApiResponseForUtil<T> | ErrorResponse = {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode: success ? 200 : 400, // Default status codes
  }

  // Add error information if provided
  if (!success && (errorCode || errorDetails)) {
    ;(response as ErrorResponse).error = {
      ...(errorCode && { code: errorCode }),
      ...(errorDetails && { details: errorDetails })
    }
  }

  return response
}


/**
 * Sends a standardized JSON response
 * @param res Express response object
 * @param statusCode HTTP status code
 * @param message Response message
 * @param data Response data (optional)
 * @param error Additional error information (optional)
 */
export const sendResponse = <T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  error?: {
    code?: string;
    details?: any;
    stack?: string;
  }
): Response<ApiResponseForUtil<T> | ErrorResponse> => {
  const success = statusCode >= 200 && statusCode < 300;

  const response: ApiResponseForUtil<T> | ErrorResponse = {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode,
    ...(error && { error }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Sends a success response (200-299)
 */
export const sendSuccess = <T = any>(
  res: Response,
  message: string = "Success",
  data: T | null = null,
  statusCode: number = 200
): Response<ApiResponseForUtil<T>> => {
  return sendResponse(res, statusCode, message, data);
};

/**
 * Sends a created response (201)
 */
export const sendCreated = <T = any>(
  res: Response,
  message: string = "Resource created successfully",
  data: T | null = null
): Response<ApiResponseForUtil<T>> => {
  return sendResponse(res, 201, message, data);
};

/**
 * Sends a bad request response (400)
 */
export const sendBadRequest = (
  res: Response,
  message: string = "Bad request",
  details?: any
): Response<ErrorResponse> => {
  return sendResponse(res, 400, message, null, {
    code: "BAD_REQUEST",
    details,
  });
};

/**
 * Sends an unauthorized response (401)
 */
export const sendUnauthorized = (
  res: Response,
  message: string = "Unauthorized"
): Response<ErrorResponse> => {
  return sendResponse(res, 401, message, null, {
    code: "UNAUTHORIZED",
  });
};

/**
 * Sends a forbidden response (403)
 */
export const sendForbidden = (
  res: Response,
  message: string = "Forbidden"
): Response<ErrorResponse> => {
  return sendResponse(res, 403, message, null, {
    code: "FORBIDDEN",
  });
};

/**
 * Sends a not found response (404)
 */
export const sendNotFound = (
  res: Response,
  message: string = "Resource not found"
): Response<ErrorResponse> => {
  return sendResponse(res, 404, message, null, {
    code: "NOT_FOUND",
  });
};

/**
 * Sends a conflict response (409)
 */
export const sendConflict = (
  res: Response,
  message: string = "Conflict",
  details?: any
): Response<ErrorResponse> => {
  return sendResponse(res, 409, message, null, {
    code: "CONFLICT",
    details,
  });
};

/**
 * Sends a validation error response (422)
 */
export const sendValidationError = (
  res: Response,
  message: string = "Validation failed",
  validationErrors?: any
): Response<ErrorResponse> => {
  return sendResponse(res, 422, message, null, {
    code: "VALIDATION_ERROR",
    details: validationErrors,
  });
};

/**
 * Sends an internal server error response (500)
 */
export const sendInternalError = (
  res: Response,
  message: string = "Internal server error",
  error?: Error
): Response<ErrorResponse> => {
  const errorDetails: any = {
    code: "INTERNAL_ERROR",
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === "development" && error) {
    errorDetails.stack = error.stack;
    errorDetails.details = error.message;
  }

  return sendResponse(res, 500, message, null, errorDetails);
};

/**
 * Sends a rate limit exceeded response (429)
 */
export const sendRateLimitExceeded = (
  res: Response,
  message: string = "Rate limit exceeded"
): Response<ErrorResponse> => {
  return sendResponse(res, 429, message, null, {
    code: "RATE_LIMIT_EXCEEDED",
  });
};

/**
 * Sends a service unavailable response (503)
 */
export const sendServiceUnavailable = (
  res: Response,
  message: string = "Service temporarily unavailable"
): Response<ErrorResponse> => {
  return sendResponse(res, 503, message, null, {
    code: "SERVICE_UNAVAILABLE",
  });
};

/**
 * Handles paginated responses
 */
export const sendPaginatedResponse = <T = any>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = "Data retrieved successfully"
): Response<
  ApiResponseForUtil<{
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>
> => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return sendResponse(res, 200, message, {
    items: data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  });
};


/**
 * Sends a structured standard success API response
 */
export function successResponse<T = any>(
  res: Response,
  data: T,
  message = 'Operation successful',
  statusCode: number = HttpStatusCode.OK
): Response {
  const responseBody: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode
  };
  
  return res.status(statusCode).json(responseBody);
}

/**
 * Sends a structured standard error API response
 */
export function errorResponse(
  res: Response,
  message = 'An unexpected error occurred',
  statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
  errorCode?: string,
  details: any = null
): Response {
  const responseBody: ErrorResponse = {
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
    statusCode,
    error: {
      code: errorCode,
      details,
      // Optional: Add stack trace in development mode
      ...(process.env.NODE_ENV === 'development' && { stack: new Error().stack })
    }
  };

  return res.status(statusCode).json(responseBody);
}