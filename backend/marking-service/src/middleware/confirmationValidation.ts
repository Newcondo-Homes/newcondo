// backend/marking-service/src/middleware/confirmationValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@newcondo/db';

// Extend Express Request to include confirmation data (as defined at the end of the file)
declare global {
  namespace Express {
    interface Request {
      confirmationDeadline?: Date;
      shouldAutoConfirm?: boolean;
      user?: { id: string }; // Assuming user is added to req by an auth middleware
    }
  }
}


// Validation schemas
const confirmMarkingSchema = z.object({
  isApproved: z.boolean(),
  feedback: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(1000, 'Feedback must not exceed 1000 characters')
    .trim()
    .optional(),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5')
    .optional(),
  rejectionReason: z
    .string()
    .min(20, 'Rejection reason must be at least 20 characters')
    .max(1000, 'Rejection reason must not exceed 1000 characters')
    .trim()
    .optional(),
});

const requestRevisionSchema = z.object({
  revisionNotes: z
    .string()
    .min(20, 'Revision notes must be at least 20 characters')
    .max(1000, 'Revision notes must not exceed 1000 characters')
    .trim(),
  specificIssues: z
    .array(
      z.enum([
        'INCORRECT_BOUNDARY',
        'MISSING_IMAGES',
        'POOR_IMAGE_QUALITY',
        'WRONG_PROPERTY',
        'INCOMPLETE_MARKING',
        'OTHER',
      ])
    )
    .min(1, 'At least one specific issue must be selected'),
  additionalInstructions: z
    .string()
    .max(500, 'Additional instructions must not exceed 500 characters')
    .trim()
    .optional(),
});

const disputeMarkingSchema = z.object({
  disputeReason: z
    .string()
    .min(50, 'Dispute reason must be at least 50 characters')
    .max(2000, 'Dispute reason must not exceed 2000 characters')
    .trim(),
  disputeCategory: z.enum([
    'WRONG_PROPERTY',
    'BOUNDARY_INCORRECT',
    'FRAUD_SUSPECTED',
    'POOR_QUALITY',
    'NOT_COMPLETED',
    'OTHER',
  ]),
  supportingEvidence: z
    .array(z.string().url('Invalid evidence URL'))
    .max(10, 'Maximum 10 supporting evidence files')
    .optional(),
  requestRefund: z.boolean().default(false),
});

// Middleware functions

/**
 * Validates the request body for marking confirmation/rejection.
 */
export const validateConfirmMarking = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = confirmMarkingSchema.parse(req.body);
    
    // If rejecting, rejection reason is required
    if (!validated.isApproved && !validated.rejectionReason) {
      res.status(400).json({
        success: false,
        message: 'Rejection reason is required when not approving the marking',
      });
      return;
    }
    
    // If approving, rating is recommended
    if (validated.isApproved && !validated.rating) {
      // Default to 5 stars if not provided
      validated.rating = 5; 
    }
    
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

/**
 * Validates the request body for requesting a revision.
 */
export const validateRequestRevision = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = requestRevisionSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

/**
 * Validates the request body for disputing a marking.
 */
export const validateDisputeMarking = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = disputeMarkingSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

// Check if user is the property owner who requested the marking
export const validatePropertyOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        requestedBy: true,
        status: true,
        completedAt: true,
      },
    });
    
    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Marking job not found',
      });
      return;
    }
    
    if (job.requestedBy !== userId) {
      res.status(403).json({
        success: false,
        message: 'Only the property owner who requested this marking can confirm or reject it',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating property ownership:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating property ownership',
    });
  }
};

// Check if marking job is completed and pending confirmation
export const validateJobPendingConfirmation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        status: true,
        completedAt: true,
      },
    });
    
    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Marking job not found',
      });
      return;
    }
    
    if (job.status !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'This marking job has not been completed yet',
      });
      return;
    }
    
    if (!job.completedAt) {
      res.status(400).json({
        success: false,
        message: 'Invalid job state: completed but no completion date',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating job confirmation status:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating job confirmation status',
    });
  }
};

// Check if confirmation window is still open
export const validateConfirmationWindow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        completedAt: true,
        maxCompletionTime: true,
      },
    });
    
    if (!job || !job.completedAt) {
      res.status(404).json({
        success: false,
        message: 'Marking job not found or not completed',
      });
      return;
    }
    
    // Calculate confirmation deadline (3 days from completion)
    const CONFIRMATION_WINDOW_HOURS = 72; 
    const confirmationDeadline = new Date(
      job.completedAt.getTime() + CONFIRMATION_WINDOW_HOURS * 60 * 60 * 1000
    );
    
    const now = new Date();
    
    if (now > confirmationDeadline) {
      // Do NOT prevent the action here. Instead, set a flag for auto-confirmation
        // The checkAutoConfirmation middleware will handle setting req.shouldAutoConfirm = true
        // If a user *still* tries to confirm after the window, we might allow it 
        // if auto-confirmation hasn't been processed yet, or reject it for consistency.
        // For robustness, we will let the next check handle the expiry.
        // For this specific middleware, we'll assume the client is trying to action.
        
      res.status(400).json({
        success: false,
        message: 'Confirmation window has expired. The marking has been automatically approved or is pending auto-approval.',
      });
      return;
    }
    
    // Attach deadline to request for later use
    req.confirmationDeadline = confirmationDeadline;
    
    next();
  } catch (error) {
    console.error('Error validating confirmation window:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating confirmation window',
    });
  }
};

// Check if payment is on hold for this job
export const validatePaymentOnHold = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    // Check if there's a payment associated with this job
    const payment = await prisma.payment.findFirst({
      where: {
        markingJobId: jobId,
        paymentType: 'PROPERTY_MARKING',
      },
      select: {
        status: true,
        isReleased: true,
        confirmationPeriodEnd: true,
      },
    });
    
    if (!payment) {
      res.status(400).json({
        success: false,
        message: 'No payment found for this marking job',
      });
      return;
    }
    
    if (payment.isReleased) {
      res.status(400).json({
        success: false,
        message: 'Payment has already been released. Confirmation is no longer possible',
      });
      return;
    }
    
    if (payment.status !== 'HELD') {
      res.status(400).json({
        success: false,
        message: `Payment is not on hold. Current status: ${payment.status}`,
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating payment status',
    });
  }
};

// Validate revision request limits
export const validateRevisionLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const MAX_REVISIONS = 2; // Maximum 2 revision requests per job
    
    // Placeholder implementation: Assume 'revisionCount' exists on the job record
    const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        select: {
            revisionCount: true // Placeholder field expected in schema
        }
    });

    // Check if job exists and has a revision count property (requires schema update)
    if (job && job.revisionCount !== undefined && job.revisionCount >= MAX_REVISIONS) {
        res.status(400).json({
            success: false,
            message: `Maximum revision limit of ${MAX_REVISIONS} reached for this job. Please approve or dispute.`,
        });
        return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating revision limit:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating revision limit',
    });
  }
};

// Check if dispute is allowed
export const validateCanDispute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        requestedBy: true,
        status: true,
        completedAt: true,
      },
    });
    
    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Marking job not found',
      });
      return;
    }
    
    if (job.requestedBy !== userId) {
      res.status(403).json({
        success: false,
        message: 'Only the property owner can dispute this marking',
      });
      return;
    }
    
    if (job.status !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Can only dispute completed marking jobs',
      });
      return;
    }
    
    // Check if dispute window is still open (7 days from completion)
    if (job.completedAt) {
      const DISPUTE_WINDOW_DAYS = 7;
      const disputeDeadline = new Date(
        job.completedAt.getTime() + DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000
      );
      
      if (new Date() > disputeDeadline) {
        res.status(400).json({
          success: false,
          message: 'Dispute window has closed. Disputes must be filed within 7 days of completion',
        });
        return;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error validating dispute eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating dispute eligibility',
    });
  }
};

// Validate rating value
export const validateRating = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { rating, isApproved } = req.body;
    
    // Rating is required when approving
    if (isApproved && !rating) {
      res.status(400).json({
        success: false,
        message: 'Rating is required when approving the marking',
      });
      return;
    }
    
    // Rating should not be provided when rejecting
    if (!isApproved && rating) {
      res.status(400).json({
        success: false,
        message: 'Rating should not be provided when rejecting the marking',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating rating',
    });
  }
};

// Validate confirmation data consistency
export const validateConfirmationConsistency = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { isApproved, feedback, rejectionReason } = req.body;
    
    // If approving, ensure no rejection reason provided
    if (isApproved && rejectionReason) {
      res.status(400).json({
        success: false,
        message: 'Cannot provide rejection reason when approving',
      });
      return;
    }
    
    // If rejecting, ensure rejection reason is provided
    if (!isApproved && !rejectionReason) {
      res.status(400).json({
        success: false,
        message: 'Rejection reason is required when not approving',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating confirmation consistency:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating confirmation consistency',
    });
  }
};

// Check auto-confirmation eligibility
export const checkAutoConfirmation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        completedAt: true,
        status: true,
      },
    });
    
    if (!job || !job.completedAt) {
      next();
      return;
    }
    
    // Check if auto-confirmation window has passed
    const CONFIRMATION_WINDOW_HOURS = 72; // 3 days
    const confirmationDeadline = new Date(
      job.completedAt.getTime() + CONFIRMATION_WINDOW_HOURS * 60 * 60 * 1000
    );
    
    if (new Date() > confirmationDeadline && job.status === 'COMPLETED') {
      // Marking should be auto-confirmed
      req.shouldAutoConfirm = true;
    }
    
    next();
  } catch (error) {
    console.error('Error checking auto-confirmation:', error);
    // Don't block the request on this check
    next();
  }
};

// Extend Express Request to include confirmation data
declare global {
  namespace Express {
    interface Request {
      confirmationDeadline?: Date;
      shouldAutoConfirm?: boolean;
      user?: { id: string }; // Assuming this is set by an upstream auth middleware
    }
  }
}