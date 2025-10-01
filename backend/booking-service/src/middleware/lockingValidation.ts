import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
export const acquireLockSchema = z.object({
  propertyId: z.string().cuid().optional(),
  unitId: z.string().cuid().optional(),
  ttl: z.number().int().positive().max(30 * 60 * 1000).optional(), // Max 30 minutes
  retryAttempts: z.number().int().positive().max(5).optional(),
  retryDelay: z.number().int().positive().max(1000).optional(),
}).refine(
  (data) => data.propertyId || data.unitId,
  {
    message: 'Either propertyId or unitId must be provided',
  }
);

export const releaseLockSchema = z.object({
  propertyId: z.string().cuid().optional(),
  unitId: z.string().cuid().optional(),
  lockId: z.string().min(1),
}).refine(
  (data) => data.propertyId || data.unitId,
  {
    message: 'Either propertyId or unitId must be provided',
  }
);

export const checkConflictSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional().nullable(),
  userId: z.string().cuid(),
  rentalPeriod: z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
  }).optional(),
});

export const extendLockSchema = z.object({
  key: z.string().min(1),
  lockId: z.string().min(1),
  additionalTtlMs: z.number().int().positive().max(15 * 60 * 1000), // Max 15 minutes extension
});

/**
 * Middleware to validate lock acquisition requests
 */
export const validateAcquireLock = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    acquireLockSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate lock release requests
 */
export const validateReleaseLock = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    releaseLockSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate conflict check requests
 */
export const validateConflictCheck = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = checkConflictSchema.parse(req.body);
    
    // Convert date strings to Date objects if needed
    if (data.rentalPeriod) {
      req.body.rentalPeriod = {
        startDate: new Date(data.rentalPeriod.startDate),
        endDate: new Date(data.rentalPeriod.endDate),
      };
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate lock extension requests
 */
export const validateExtendLock = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    extendLockSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate property/unit existence and authorization
 */
export const validateLockAuthorization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { propertyId, unitId } = req.body;
    const userId = req.user?.id; // Assumes auth middleware sets req.user

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Additional authorization checks can be added here
    // For example, checking if user has permission to lock this property/unit

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to add request metadata (IP, user agent)
 */
export const addRequestMetadata = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.body.metadata = {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    timestamp: new Date(),
  };
  next();
};

/**
 * Error handler for locking operations
 */
export const handleLockingErrors = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Locking operation error:', error);

  // Handle specific error types
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(409).json({
      success: false,
      message: 'Database conflict occurred',
      error: error.message,
    });
  }

  if (error.message.includes('Redis')) {
    return res.status(503).json({
      success: false,
      message: 'Locking service temporarily unavailable',
      error: 'Please try again shortly',
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: 'An error occurred during locking operation',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
};