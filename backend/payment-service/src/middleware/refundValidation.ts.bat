import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, PaymentStatus, RentalStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Validation schemas
const refundRequestSchema = z.object({
  paymentId: z.string().cuid(),
  reason: z.string().min(10, 'Refund reason must be at least 10 characters'),
  refundType: z.enum(['FULL', 'PARTIAL']),
  partialAmount: z.number().positive().optional(),
});

const adminRefundApprovalSchema = z.object({
  paymentId: z.string().cuid(),
  approved: z.boolean(),
  adminNotes: z.string().optional(),
});

const checkRefundStatusSchema = z.object({
  paymentId: z.string().cuid(),
});

/**
 * Middleware to validate refund requests from renters
 */
export const validateRefundRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = refundRequestSchema.parse(req.body);

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: {
        rental: {
          include: {
            property: true,
            unit: true,
            renter: true,
          },
        },
        user: true,
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
      return;
    }

    // Check if user is the payer
    if (payment.userId !== req.user?.id) {
      res.status(403).json({
        success: false,
        error: 'You can only request refunds for your own payments',
      });
      return;
    }

    // Check if payment is in HELD status
    if (payment.status !== PaymentStatus.HELD) {
      res.status(400).json({
        success: false,
        error: `Cannot refund payment with status: ${payment.status}. Only held payments can be refunded.`,
      });
      return;
    }

    // Check if payment type is RENT
    if (payment.paymentType !== 'RENT') {
      res.status(400).json({
        success: false,
        error: 'Only rent payments can be refunded through this endpoint',
      });
      return;
    }

    // Check if rental exists and is in correct status
    if (!payment.rental) {
      res.status(400).json({
        success: false,
        error: 'No rental associated with this payment',
      });
      return;
    }

    if (payment.rental.status !== RentalStatus.PENDING_CONFIRMATION) {
      res.status(400).json({
        success: false,
        error: 'Refunds can only be requested during the confirmation period',
      });
      return;
    }

    // Check if confirmation period is still active
    if (
      payment.rental.confirmationDeadline &&
      new Date() > payment.rental.confirmationDeadline
    ) {
      res.status(400).json({
        success: false,
        error: 'Confirmation period has expired. Refund window closed.',
      });
      return;
    }

    // Validate partial refund amount if applicable
    if (validatedData.refundType === 'PARTIAL') {
      if (!validatedData.partialAmount) {
        res.status(400).json({
          success: false,
          error: 'Partial amount is required for partial refunds',
        });
        return;
      }

      const maxRefundableAmount =
        Number(payment.amount) - Number(payment.platformFee || 0);

      if (validatedData.partialAmount > maxRefundableAmount) {
        res.status(400).json({
          success: false,
          error: `Partial refund amount cannot exceed ${maxRefundableAmount} (payment amount minus non-refundable platform fee)`,
        });
        return;
      }
    }

    // Attach validated data and payment to request
    req.validatedData = validatedData;
    req.payment = payment;

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
 * Middleware to validate admin refund approval/rejection
 */
export const validateAdminRefundApproval = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Only admins can approve or reject refunds',
      });
      return;
    }

    // Validate request body
    const validatedData = adminRefundApprovalSchema.parse(req.body);

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: {
        rental: {
          include: {
            property: true,
            unit: true,
            renter: true,
          },
        },
        user: true,
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
      return;
    }

    // Check if payment is in HELD status
    if (payment.status !== PaymentStatus.HELD) {
      res.status(400).json({
        success: false,
        error: `Cannot process refund for payment with status: ${payment.status}`,
      });
      return;
    }

    // Attach validated data and payment to request
    req.validatedData = validatedData;
    req.payment = payment;

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
 * Middleware to validate refund status check
 */
export const validateCheckRefundStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request params
    const validatedData = checkRefundStatusSchema.parse(req.params);

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: {
        rental: {
          include: {
            property: true,
            unit: true,
            renter: true,
          },
        },
        user: true,
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
      return;
    }

    // Check if user has access to this payment
    const isPaymentOwner = payment.userId === req.user?.id;
    const isPropertyOwner = payment.rental?.property.ownerId === req.user?.id;
    const isAgent = payment.rental?.property.agentId === req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isPaymentOwner && !isPropertyOwner && !isAgent && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'You do not have access to this payment information',
      });
      return;
    }

    // Attach validated data and payment to request
    req.validatedData = validatedData;
    req.payment = payment;

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
 * Middleware to check if refund is still eligible (within confirmation period)
 */
export const checkRefundEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payment = req.payment;

    if (!payment) {
      res.status(400).json({
        success: false,
        error: 'Payment data not found in request',
      });
      return;
    }

    if (!payment.rental) {
      res.status(400).json({
        success: false,
        error: 'No rental associated with this payment',
      });
      return;
    }

    // Check if confirmation period is still active
    if (
      payment.rental.confirmationDeadline &&
      new Date() > payment.rental.confirmationDeadline
    ) {
      res.status(400).json({
        success: false,
        error: 'Refund window has closed. Confirmation period expired.',
        confirmationDeadline: payment.rental.confirmationDeadline,
      });
      return;
    }

    // Check if rental has already been confirmed
    if (payment.rental.isConfirmed) {
      res.status(400).json({
        success: false,
        error: 'Cannot refund a confirmed rental',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to calculate refundable amount (excluding platform fees)
 */
export const calculateRefundableAmount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payment = req.payment;

    if (!payment) {
      res.status(400).json({
        success: false,
        error: 'Payment data not found in request',
      });
      return;
    }

    // Calculate refundable amount (total - platform fee)
    const totalAmount = Number(payment.amount);
    const platformFee = Number(payment.platformFee || 0);
    const refundableAmount = totalAmount - platformFee;

    // Attach refund calculation to request
    req.refundCalculation = {
      totalAmount,
      platformFee,
      refundableAmount,
      nonRefundableAmount: platformFee,
    };

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
      payment?: any;
      refundCalculation?: {
        totalAmount: number;
        platformFee: number;
        refundableAmount: number;
        nonRefundableAmount: number;
      };
      user?: {
        id: string;
        role: string;
        email: string;
      };
    }
  }
}