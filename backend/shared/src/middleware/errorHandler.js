"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.InternalServerError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthorizationError = exports.AuthenticationError = exports.BadRequestError = exports.ValidationError = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, statusCode = 500, isOperational = true, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
        this.name = this.constructor.name;
    }
}
exports.CustomError = CustomError;
// Pre-defined error types for common scenarios
class ValidationError extends CustomError {
    constructor(message = 'Validation failed') {
        super(message, 400, true, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
/** Alias for ValidationError — use when a request has invalid/missing params */
class BadRequestError extends CustomError {
    constructor(message = 'Bad request') {
        super(message, 400, true, 'BAD_REQUEST_ERROR');
    }
}
exports.BadRequestError = BadRequestError;
class AuthenticationError extends CustomError {
    constructor(message = 'Authentication failed') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends CustomError {
    constructor(message = 'Access denied') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
/** Alias for AuthorizationError — maps to HTTP 403 Forbidden */
class ForbiddenError extends CustomError {
    constructor(message = 'Forbidden') {
        super(message, 403, true, 'FORBIDDEN_ERROR');
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends CustomError {
    constructor(message = 'Resource not found') {
        super(message, 404, true, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends CustomError {
    constructor(message = 'Resource conflict') {
        super(message, 409, true, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends CustomError {
    constructor(message = 'Too many requests') {
        super(message, 429, true, 'RATE_LIMIT_ERROR');
    }
}
exports.RateLimitError = RateLimitError;
class InternalServerError extends CustomError {
    constructor(message = 'Internal server error') {
        super(message, 500, false, 'INTERNAL_SERVER_ERROR');
    }
}
exports.InternalServerError = InternalServerError;
// Helper function to check if error is operational
const isOperationalError = (error) => {
    if (error instanceof CustomError) {
        return error.isOperational;
    }
    return false;
};
// Main error handler middleware
const errorHandler = (err, req, res, next) => {
    // Default error properties
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details = undefined;
    // Handle custom errors
    if (err instanceof CustomError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code || 'CUSTOM_ERROR';
    }
    // Handle Mongoose validation errors
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        code = 'VALIDATION_ERROR';
        details = Object.values(err.errors).map((val) => val.message);
    }
    // Handle Mongoose duplicate key errors
    else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value entered';
        code = 'DUPLICATE_ERROR';
        const field = Object.keys(err.keyValue)[0];
        details = `${field} already exists`;
    }
    // Handle Mongoose cast errors
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
        code = 'CAST_ERROR';
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }
    // Handle Multer errors (file upload)
    else if (err.name === 'MulterError') {
        statusCode = 400;
        message = 'File upload error';
        code = 'FILE_UPLOAD_ERROR';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        }
    }
    // Log error details (but don't log operational errors in production)
    const shouldLog = !isOperationalError(err) || process.env.NODE_ENV === 'development';
    if (shouldLog) {
        console.error('Error occurred:', {
            timestamp: new Date().toISOString(),
            message: err.message,
            stack: err.stack,
            statusCode,
            code,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.body,
            params: req.params,
            query: req.query
        });
    }
    // Send error response
    const errorResponse = {
        success: false,
        error: {
            message,
            code,
            statusCode
        }
    };
    // Add additional details in development mode
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
        if (details) {
            errorResponse.error.details = details;
        }
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Async error wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// 404 handler for unmatched routes
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map