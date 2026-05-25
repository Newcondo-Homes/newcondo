"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginatedResponse = exports.sendServiceUnavailable = exports.sendRateLimitExceeded = exports.sendInternalError = exports.sendValidationError = exports.sendConflict = exports.sendNotFound = exports.sendForbidden = exports.sendUnauthorized = exports.sendBadRequest = exports.sendCreated = exports.sendSuccess = exports.sendResponse = exports.standardResponse = void 0;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
const types_1 = require("../types");
/**
 * Creates a standardized response object (without sending it)
 * @param success Whether the operation was successful
 * @param message Response message
 * @param data Response data (optional)
 * @param errorCode Error code for failed responses (optional)
 * @param errorDetails Additional error details (optional)
 */
const standardResponse = (success, message, data = null, errorCode, errorDetails) => {
    const response = {
        success,
        message,
        data,
        timestamp: new Date().toISOString(),
        statusCode: success ? 200 : 400, // Default status codes
    };
    // Add error information if provided
    if (!success && (errorCode || errorDetails)) {
        ;
        response.error = {
            ...(errorCode && { code: errorCode }),
            ...(errorDetails && { details: errorDetails })
        };
    }
    return response;
};
exports.standardResponse = standardResponse;
/**
 * Sends a standardized JSON response
 * @param res Express response object
 * @param statusCode HTTP status code
 * @param message Response message
 * @param data Response data (optional)
 * @param error Additional error information (optional)
 */
const sendResponse = (res, statusCode, message, data = null, error) => {
    const success = statusCode >= 200 && statusCode < 300;
    const response = {
        success,
        message,
        data,
        timestamp: new Date().toISOString(),
        statusCode,
        ...(error && { error }),
    };
    return res.status(statusCode).json(response);
};
exports.sendResponse = sendResponse;
/**
 * Sends a success response (200-299)
 */
const sendSuccess = (res, message = "Success", data = null, statusCode = 200) => {
    return (0, exports.sendResponse)(res, statusCode, message, data);
};
exports.sendSuccess = sendSuccess;
/**
 * Sends a created response (201)
 */
const sendCreated = (res, message = "Resource created successfully", data = null) => {
    return (0, exports.sendResponse)(res, 201, message, data);
};
exports.sendCreated = sendCreated;
/**
 * Sends a bad request response (400)
 */
const sendBadRequest = (res, message = "Bad request", details) => {
    return (0, exports.sendResponse)(res, 400, message, null, {
        code: "BAD_REQUEST",
        details,
    });
};
exports.sendBadRequest = sendBadRequest;
/**
 * Sends an unauthorized response (401)
 */
const sendUnauthorized = (res, message = "Unauthorized") => {
    return (0, exports.sendResponse)(res, 401, message, null, {
        code: "UNAUTHORIZED",
    });
};
exports.sendUnauthorized = sendUnauthorized;
/**
 * Sends a forbidden response (403)
 */
const sendForbidden = (res, message = "Forbidden") => {
    return (0, exports.sendResponse)(res, 403, message, null, {
        code: "FORBIDDEN",
    });
};
exports.sendForbidden = sendForbidden;
/**
 * Sends a not found response (404)
 */
const sendNotFound = (res, message = "Resource not found") => {
    return (0, exports.sendResponse)(res, 404, message, null, {
        code: "NOT_FOUND",
    });
};
exports.sendNotFound = sendNotFound;
/**
 * Sends a conflict response (409)
 */
const sendConflict = (res, message = "Conflict", details) => {
    return (0, exports.sendResponse)(res, 409, message, null, {
        code: "CONFLICT",
        details,
    });
};
exports.sendConflict = sendConflict;
/**
 * Sends a validation error response (422)
 */
const sendValidationError = (res, message = "Validation failed", validationErrors) => {
    return (0, exports.sendResponse)(res, 422, message, null, {
        code: "VALIDATION_ERROR",
        details: validationErrors,
    });
};
exports.sendValidationError = sendValidationError;
/**
 * Sends an internal server error response (500)
 */
const sendInternalError = (res, message = "Internal server error", error) => {
    const errorDetails = {
        code: "INTERNAL_ERROR",
    };
    // Only include stack trace in development
    if (process.env.NODE_ENV === "development" && error) {
        errorDetails.stack = error.stack;
        errorDetails.details = error.message;
    }
    return (0, exports.sendResponse)(res, 500, message, null, errorDetails);
};
exports.sendInternalError = sendInternalError;
/**
 * Sends a rate limit exceeded response (429)
 */
const sendRateLimitExceeded = (res, message = "Rate limit exceeded") => {
    return (0, exports.sendResponse)(res, 429, message, null, {
        code: "RATE_LIMIT_EXCEEDED",
    });
};
exports.sendRateLimitExceeded = sendRateLimitExceeded;
/**
 * Sends a service unavailable response (503)
 */
const sendServiceUnavailable = (res, message = "Service temporarily unavailable") => {
    return (0, exports.sendResponse)(res, 503, message, null, {
        code: "SERVICE_UNAVAILABLE",
    });
};
exports.sendServiceUnavailable = sendServiceUnavailable;
/**
 * Handles paginated responses
 */
const sendPaginatedResponse = (res, data, total, page, limit, message = "Data retrieved successfully") => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return (0, exports.sendResponse)(res, 200, message, {
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
exports.sendPaginatedResponse = sendPaginatedResponse;
/**
 * Sends a structured standard success API response
 */
function successResponse(res, data, message = 'Operation successful', statusCode = types_1.HttpStatusCode.OK) {
    const responseBody = {
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
function errorResponse(res, message = 'An unexpected error occurred', statusCode = types_1.HttpStatusCode.INTERNAL_SERVER_ERROR, errorCode, details = null) {
    const responseBody = {
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
//# sourceMappingURL=response.js.map