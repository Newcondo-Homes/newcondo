import { Response } from "express";
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
export declare const standardResponse: <T = any>(success: boolean, message: string, data?: T | null, errorCode?: string, errorDetails?: any) => ApiResponseForUtil<T> | ErrorResponse;
/**
 * Sends a standardized JSON response
 * @param res Express response object
 * @param statusCode HTTP status code
 * @param message Response message
 * @param data Response data (optional)
 * @param error Additional error information (optional)
 */
export declare const sendResponse: <T = any>(res: Response, statusCode: number, message: string, data?: T | null, error?: {
    code?: string;
    details?: any;
    stack?: string;
}) => Response<ApiResponseForUtil<T> | ErrorResponse>;
/**
 * Sends a success response (200-299)
 */
export declare const sendSuccess: <T = any>(res: Response, message?: string, data?: T | null, statusCode?: number) => Response<ApiResponseForUtil<T>>;
/**
 * Sends a created response (201)
 */
export declare const sendCreated: <T = any>(res: Response, message?: string, data?: T | null) => Response<ApiResponseForUtil<T>>;
/**
 * Sends a bad request response (400)
 */
export declare const sendBadRequest: (res: Response, message?: string, details?: any) => Response<ErrorResponse>;
/**
 * Sends an unauthorized response (401)
 */
export declare const sendUnauthorized: (res: Response, message?: string) => Response<ErrorResponse>;
/**
 * Sends a forbidden response (403)
 */
export declare const sendForbidden: (res: Response, message?: string) => Response<ErrorResponse>;
/**
 * Sends a not found response (404)
 */
export declare const sendNotFound: (res: Response, message?: string) => Response<ErrorResponse>;
/**
 * Sends a conflict response (409)
 */
export declare const sendConflict: (res: Response, message?: string, details?: any) => Response<ErrorResponse>;
/**
 * Sends a validation error response (422)
 */
export declare const sendValidationError: (res: Response, message?: string, validationErrors?: any) => Response<ErrorResponse>;
/**
 * Sends an internal server error response (500)
 */
export declare const sendInternalError: (res: Response, message?: string, error?: Error) => Response<ErrorResponse>;
/**
 * Sends a rate limit exceeded response (429)
 */
export declare const sendRateLimitExceeded: (res: Response, message?: string) => Response<ErrorResponse>;
/**
 * Sends a service unavailable response (503)
 */
export declare const sendServiceUnavailable: (res: Response, message?: string) => Response<ErrorResponse>;
/**
 * Handles paginated responses
 */
export declare const sendPaginatedResponse: <T = any>(res: Response, data: T[], total: number, page: number, limit: number, message?: string) => Response<ApiResponseForUtil<{
    items: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}>>;
/**
 * Sends a structured standard success API response
 */
export declare function successResponse<T = any>(res: Response, data: T, message?: string, statusCode?: number): Response;
/**
 * Sends a structured standard error API response
 */
export declare function errorResponse(res: Response, message?: string, statusCode?: number, errorCode?: string, details?: any): Response;
//# sourceMappingURL=response.d.ts.map