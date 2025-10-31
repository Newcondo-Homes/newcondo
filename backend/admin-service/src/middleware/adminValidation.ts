// backend/admin-service/src/middleware/adminValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { 
  VerificationStatus, 
  AdminApprovalStatus, 
  DuplicateStatus,
  MarkingJobStatus,
  TicketStatus,
  TicketPriority 
} from '@newcondo/db';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }
      
      next(error);
    }
  };
};

// User verification schemas
export const verifyUserSchema = z.object({
  body: z.object({
    userId: z.string().cuid(),
    status: z.nativeEnum(VerificationStatus),
    rejectionReason: z.string().optional()
  })
});

export const getUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    role: z.string().optional(),
    verificationStatus: z.nativeEnum(VerificationStatus).optional(),
    search: z.string().optional()
  })
});

// Property approval schemas
export const approvePropertySchema = z.object({
  body: z.object({
    propertyId: z.string().cuid(),
    status: z.nativeEnum(AdminApprovalStatus),
    rejectionReason: z.string().optional()
  })
});

export const getPropertiesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.nativeEnum(AdminApprovalStatus).optional(),
    propertyType: z.string().optional(),
    search: z.string().optional()
  })
});

// Duplicate management schemas
export const resolveDuplicateSchema = z.object({
  body: z.object({
    duplicateId: z.string().cuid(),
    status: z.nativeEnum(DuplicateStatus),
    resolution: z.string().min(10, 'Resolution notes must be at least 10 characters')
  })
});

export const getDuplicatesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.nativeEnum(DuplicateStatus).optional()
  })
});

// Marking job oversight schemas
export const reviewMarkingJobSchema = z.object({
  body: z.object({
    jobId: z.string().cuid(),
    status: z.nativeEnum(MarkingJobStatus),
    notes: z.string().optional()
  })
});

export const getMarkingJobsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.nativeEnum(MarkingJobStatus).optional(),
    agentId: z.string().cuid().optional()
  })
});

// Support ticket schemas
export const resolveSupportTicketSchema = z.object({
  body: z.object({
    ticketId: z.string().cuid(),
    status: z.nativeEnum(TicketStatus),
    adminResponse: z.string().min(10, 'Response must be at least 10 characters')
  })
});

export const getSupportTicketsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    category: z.string().optional()
  })
});

// Analytics schemas
export const getAnalyticsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    metric: z.enum([
      'users',
      'properties',
      'payments',
      'markingJobs',
      'revenue'
    ]).optional()
  })
});

// Boundary dispute schemas
export const resolveBoundaryDisputeSchema = z.object({
  body: z.object({
    disputeId: z.string().cuid(),
    resolution: z.string().min(20, 'Resolution details must be at least 20 characters'),
    actionTaken: z.enum([
      'APPROVED_ORIGINAL',
      'APPROVED_DISPUTED',
      'REQUIRED_REMARKING',
      'MERGED_PROPERTIES',
      'OTHER'
    ])
  })
});

// Payment management schemas
export const refundPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().cuid(),
    reason: z.string().min(10, 'Refund reason must be at least 10 characters'),
    amount: z.number().positive().optional()
  })
});

export const getPaymentsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.string().optional(),
    paymentType: z.string().optional(),
    userId: z.string().cuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })
});