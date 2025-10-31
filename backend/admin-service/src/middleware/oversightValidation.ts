// backend/admin-service/src/middleware/oversightValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { MarkingJobStatus, UrgencyLevel } from '@newcondo/db';

/**
 * Validation middleware for marking job oversight operations
 */

// Review marking job completion
export const validateMarkingJobReview = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid job ID format')
  }),
  body: z.object({
    approved: z.boolean(),
    qualityScore: z.number().min(1).max(5).optional(),
    feedback: z.string().min(10, 'Feedback must be at least 10 characters').optional(),
    requiresRework: z.boolean().optional(),
    reworkInstructions: z.string().optional()
  }).refine(
    (data) => {
      // If not approved, feedback is required
      if (!data.approved && !data.feedback) {
        return false;
      }
      // If requires rework, instructions are required
      if (data.requiresRework && !data.reworkInstructions) {
        return false;
      }
      return true;
    },
    {
      message: 'Feedback is required when rejecting, and rework instructions are required when requesting rework'
    }
  )
});

// Reassign marking job
export const validateMarkingJobReassignment = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid job ID format')
  }),
  body: z.object({
    newAgentId: z.string().cuid('Invalid agent ID format'),
    reason: z.string().min(10, 'Reason for reassignment must be at least 10 characters'),
    prioritize: z.boolean().optional()
  })
});

// Update job urgency
export const validateUrgencyUpdate = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid job ID format')
  }),
  body: z.object({
    urgencyLevel: z.nativeEnum(UrgencyLevel),
    reason: z.string().min(10, 'Reason for urgency change must be at least 10 characters')
  })
});

// Bulk job operations
export const validateBulkJobOperation = z.object({
  body: z.object({
    jobIds: z.array(z.string().cuid()).min(1, 'At least one job ID is required').max(50, 'Maximum 50 jobs per bulk operation'),
    operation: z.enum(['CANCEL', 'REASSIGN', 'UPDATE_URGENCY', 'EXTEND_DEADLINE']),
    operationData: z.record(z.any()).optional()
  })
});

// Agent performance review
export const validateAgentPerformanceQuery = z.object({
  query: z.object({
    agentId: z.string().cuid('Invalid agent ID format').optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    minJobs: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.enum(['completionRate', 'averageTime', 'qualityScore', 'totalJobs']).optional()
  })
});

// Marking job quality audit
export const validateQualityAudit = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid job ID format')
  }),
  body: z.object({
    boundaryAccuracy: z.number().min(0).max(10, 'Boundary accuracy must be between 0 and 10'),
    imageQuality: z.number().min(0).max(10, 'Image quality must be between 0 and 10'),
    completeness: z.number().min(0).max(10, 'Completeness must be between 0 and 10'),
    timeliness: z.number().min(0).max(10, 'Timeliness must be between 0 and 10'),
    notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
    actionRequired: z.enum(['NONE', 'MINOR_CORRECTION', 'MAJOR_REWORK', 'AGENT_WARNING', 'AGENT_SUSPENSION']).optional()
  })
});

// Dispute boundary marking
export const validateBoundaryDispute = z.object({
  body: z.object({
    jobId: z.string().cuid('Invalid job ID format'),
    disputeReason: z.string().min(20, 'Dispute reason must be at least 20 characters'),
    evidenceUrls: z.array(z.string().url()).optional(),
    suggestedResolution: z.string().optional()
  })
});

// Export time window validation
export const validateTimeWindowExtension = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid job ID format')
  }),
  body: z.object({
    extensionHours: z.number().min(1).max(24, 'Extension must be between 1 and 24 hours'),
    reason: z.string().min(10, 'Reason for extension must be at least 10 characters')
  })
});

// Agent suspension for marking violations
export const validateAgentSuspension = z.object({
  body: z.object({
    agentId: z.string().cuid('Invalid agent ID format'),
    suspensionDays: z.number().min(1).max(90, 'Suspension must be between 1 and 90 days'),
    reason: z.string().min(20, 'Suspension reason must be at least 20 characters'),
    affectedJobs: z.array(z.string().cuid()).optional(),
    permanentBan: z.boolean().optional()
  })
});

// Middleware wrapper to use with Express
export const validateOversight = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        params: req.params,
        query: req.query,
        body: req.body
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