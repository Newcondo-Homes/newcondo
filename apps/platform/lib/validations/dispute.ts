import { z } from 'zod';

/**
 * Schema for creating a dispute
 */
export const createDisputeSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  reason: z.enum([
    'PROPERTY_NOT_AS_DESCRIBED',
    'PROPERTY_UNAVAILABLE',
    'SAFETY_CONCERNS',
    'MISLEADING_INFORMATION',
    'DUPLICATE_LISTING',
    'OTHER'
  ], {
    errorMap: () => ({ message: 'Please select a valid dispute reason' })
  }),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  evidenceUrls: z.array(z.string().url()).optional(),
  preferredResolution: z.enum(['FULL_REFUND', 'PARTIAL_REFUND', 'PROPERTY_REPLACEMENT']).optional()
});

/**
 * Schema for adding dispute comment
 */
export const addDisputeCommentSchema = z.object({
  disputeId: z.string().min(1, 'Dispute ID is required'),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must not exceed 500 characters')
});

/**
 * Schema for uploading dispute evidence
 */
export const uploadDisputeEvidenceSchema = z.object({
  disputeId: z.string().min(1, 'Dispute ID is required'),
  files: z.array(z.instanceof(File))
    .min(1, 'At least one file is required')
    .max(5, 'Maximum 5 files allowed')
});

/**
 * Schema for dispute query parameters
 */
export const disputeQuerySchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  status: z.enum(['pending', 'investigating', 'resolved', 'rejected']).optional()
});

/**
 * Schema for cancelling dispute
 */
export const cancelDisputeSchema = z.object({
  disputeId: z.string().min(1, 'Dispute ID is required'),
  reason: z.string().optional()
});

/**
 * Type exports
 */
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type AddDisputeCommentInput = z.infer<typeof addDisputeCommentSchema>;
export type UploadDisputeEvidenceInput = z.infer<typeof uploadDisputeEvidenceSchema>;
export type DisputeQueryInput = z.infer<typeof disputeQuerySchema>;
export type CancelDisputeInput = z.infer<typeof cancelDisputeSchema>;