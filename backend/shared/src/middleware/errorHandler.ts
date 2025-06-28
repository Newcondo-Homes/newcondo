import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
  code?: string
}

export class CustomError extends Error implements AppError {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: string

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError)
    }

    this.name = this.constructor.name
  }
}

// Pre-defined error types for common scenarios
export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, true, 'VALIDATION_ERROR')
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR')
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT_ERROR')
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR')
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR')
  }
}

// Helper function to check if error is operational
const isOperationalError = (error: Error): boolean => {
  if (error instanceof CustomError) {
    return error.isOperational
  }
  return false
}

// Main error handler middleware
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error properties
  let statusCode = 500
  let message = 'Internal Server Error'
  let code = 'INTERNAL_SERVER_ERROR'
  let details: any = undefined

  // Handle custom errors
  if (err instanceof CustomError) {
    statusCode = err.statusCode
    message = err.message
    code = err.code || 'CUSTOM_ERROR'
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
    code = 'VALIDATION_ERROR'
    details = Object.values((err as any).errors).map((val: any) => val.message)
  }
  // Handle Mongoose duplicate key errors
  else if ((err as any).code === 11000) {
    statusCode = 409
    message = 'Duplicate field value entered'
    code = 'DUPLICATE_ERROR'
    const field = Object.keys((err as any).keyValue)[0]
    details = `${field} already exists`
  }
  // Handle Mongoose cast errors
  else if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid data format'
    code = 'CAST_ERROR'
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
    code = 'INVALID_TOKEN'
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
    code = 'TOKEN_EXPIRED'
  }
  // Handle Multer errors (file upload)
  else if (err.name === 'MulterError') {
    statusCode = 400
    message = 'File upload error'
    code = 'FILE_UPLOAD_ERROR'
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      message = 'File too large'
    }
  }

  // Log error details (but don't log operational errors in production)
  const shouldLog = !isOperationalError(err) || process.env.NODE_ENV === 'development'
  
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
    })
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      code,
      statusCode
    }
  }

  // Add additional details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack
    if (details) {
      errorResponse.error.details = details
    }
  }

  res.status(statusCode).json(errorResponse)
}

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}