import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const paymentLockSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID'),
  unitId: z.string().cuid('Invalid unit ID').optional(),
  userId: z.string().cuid('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
});

const lockReleaseSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID').optional(),
  unitId: z.string().cuid('Invalid unit ID').optional(),
  lockId: z.string().min(1, 'Lock ID is required'),
});

/**
 * Validate payment lock request
 */
export const validateLockRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = paymentLockSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Validate lock release request
 */
export const validateLockRelease = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = lockReleaseSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Validate property/unit exists and is available
 */
export const validatePropertyAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { propertyId, unitId } = req.body;

    if (!propertyId && !unitId) {
      return res.status(400).json({
        success: false,
        error: 'Either propertyId or unitId is required',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to validate property availability',
    });
  }
};