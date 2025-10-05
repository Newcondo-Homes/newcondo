import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, PaymentStatus, RentalStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Validation schemas
const confirmRentalSchema = z.object({
  rentalId: z.string().cuid(),
  confirmed: z.boolean(),
  notes: z.string().optional(),
});

const disputeRentalSchema = z.object({
  rentalId: z.string().cuid(),
  reason: z.string().min(10, 'Dispute reason must be at least 10 characters'),
  details: z.string().optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
});

const checkConfirmationStatusSchema = z.object({
  rentalId: z.string().cuid(),
});

/**
 * Middleware to validate rental confirmation requests
 */
export const validateConfirmRental = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = confirmRentalSchema.parse(req.body);

    // Check if rental exists
    const rental = await prisma.rental.findUnique({
      where: { id: validatedData.rentalId },
      include: {
        property: true,
        unit: true,
        renter: true,
        payments: {
          where: {
            paymentType: 'RENT',
            status: 'HELD',
          },
        },
      },
    });

    if (!rental) {
      res.status(404).json({
        success: false,
        error: 'Rental not found',
      });
      return;
    }

    // Check if user is the renter
    if (rental.renterId !== req.user?.id) {
      res.status(403).json({
        success: false,
        error: 'Only the renter can confirm or dispute this rental',
      });
      return;
    }

    // Check if rental is in PENDING_CONFIRMATION status
    if (rental.status !== RentalStatus.PENDING_CONFIRMATION) {
      res.status(400).json({
        success: false,
        error: 'Rental is not pending confirmation',
      });
      return;
    }

    // Check if already confirmed
    if (rental.isConfirmed) {
      res.status(400).json({
        success: false,
        error: 'Rental has already been confirmed',
      });
      return;
    }

    // Check if confirmation deadline has passed
    if (rental.confirmationDeadline && new Date() > rental.confirmationDeadline) {
      res.status(400).json({
        success: false,
        error: 'Confirmation period has expired. Payment has been automatically released.',
      });
      return;
    }

    // Check if there are held payments
    if (rental.payments.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No held payments found for this rental',
      });
      return;
    }

    // Attach validated data and rental to request
    req.validatedData = validatedData;
    req.rental = rental;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    next(error);
  }
};

/**
 * Middleware to validate rental dispute requests
 */
export const validateDisputeRental = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = disputeRentalSchema.parse(req.body);

    // Check if rental exists
    const rental = await prisma.rental.findUnique({
      where: { id: validatedData.rentalId },
      include: {
        property: true,
        unit: true,
        renter: true,
        payments: {
          where: {
            paymentType: 'RENT',
            status: 'HELD',
          },
        },
      },
    });

    if (!rental) {
      res.status(404).json({
        success: false,
        error: 'Rental not found',
      });
      return;
    }

    // Check if user is the renter
    if (rental.renterId !== req.user?.id) {
      res.status(403).json({
        success: false,
        error: 'Only the renter can dispute this rental',
      });
      return;
    }

    // Check if rental is in PENDING_CONFIRMATION status
    if (rental.status !== RentalStatus.PENDING_CONFIRMATION) {
      res.status(400).json({
        success: false,
        error: 'Rental is not pending confirmation',
      });
      return;
    }

    // Check if already confirmed
    if (rental.isConfirmed) {
      res.status(400).json({
        success: false,
        error: 'Cannot dispute a confirmed rental',
      });
      return;
    }

    // Check if confirmation deadline has passed
    if (rental.confirmationDeadline && new Date() > rental.confirmationDeadline) {
      res.status(400).json({
        success: false,
        error: 'Dispute period has expired. Payment has been automatically released.',
      });
      return;
    }

    // Check if there are held payments
    if (rental.payments.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No held payments found for this rental',
      });
      return;
    }

    // Attach validated data and rental to request
    req.validatedData = validatedData;
    req.rental = rental;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    next(error);
  }
};

/**
 * Middleware to validate confirmation status check requests
 */
export const validateCheckConfirmationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request params
    const validatedData = checkConfirmationStatusSchema.parse(req.params);

    // Check if rental exists
    const rental = await prisma.rental.findUnique({
      where: { id: validatedData.rentalId },
      include: {
        property: true,
        unit: true,
        renter: true,
        payments: {
          where: {
            paymentType: 'RENT',
          },
        },
      },
    });

    if (!rental) {
      res.status(404).json({
        success: false,
        error: 'Rental not found',
      });
      return;
    }

    // Check if user has access to this rental
    const isRenter = rental.renterId === req.user?.id;
    const isOwner = rental.property.ownerId === req.user?.id;
    const isAgent = rental.property.agentId === req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isRenter && !isOwner && !isAgent && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'You do not have access to this rental information',
      });
      return;
    }

    // Attach validated data and rental to request
    req.validatedData = validatedData;
    req.rental = rental;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    next(error);
  }
};

/**
 * Middleware to check if confirmation period is still active
 */
export const checkConfirmationPeriodActive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rental = req.rental;

    if (!rental) {
      res.status(400).json({
        success: false,
        error: 'Rental data not found in request',
      });
      return;
    }

    // Check if confirmation deadline exists and hasn't passed
    if (!rental.confirmationDeadline) {
      res.status(400).json({
        success: false,
        error: 'No confirmation deadline set for this rental',
      });
      return;
    }

    if (new Date() > rental.confirmationDeadline) {
      res.status(400).json({
        success: false,
        error: 'Confirmation period has expired',
        confirmationDeadline: rental.confirmationDeadline,
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      rental?: any;
      user?: {
        id: string;
        role: string;
        email: string;
      };
    }
  }
}