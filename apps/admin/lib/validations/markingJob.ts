/**
 * Marking Job Validation Schemas
 * Zod schemas for property marking job oversight operations
 */

import { z } from 'zod';

/**
 * Schema for reassigning marking job
 */
export const reassignJobSchema = z.object({
  jobId: z.string().cuid('Invalid job ID format'),
  newAgentId: z.string().cuid('Invalid agent ID format').optional(),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(1000, 'Reason must not exceed 1000 characters'),
  notifyOldAgent: z.boolean().optional().default(true),
  notifyNewAgent: z.boolean().optional().default(true),
});

export type ReassignJobInput = z.infer<typeof reassignJobSchema>;

/**
 * Schema for cancelling marking job
 */
export const cancelMarkingJobSchema = z.object({
  jobId: z.string().cuid('Invalid job ID format'),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(1000, 'Reason must not exceed 1000 characters'),
  refund: z.boolean().default(true),
});

export type CancelMarkingJobInput = z.infer<typeof cancelMarkingJobSchema>;

/**
 * Schema for extending time slot
 */
export const extendTimeSlotSchema = z.object({
  jobId: z.string().cuid('Invalid job ID format'),
  additionalHours: z.number().int().min(1, 'Must extend by at least 1 hour').max(24, 'Cannot extend by more than 24 hours'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters'),
});

export type ExtendTimeSlotInput = z.infer<typeof extendTimeSlotSchema>;

/**
 * Schema for reviewing job quality
 */
export const reviewJobQualitySchema = z.object({
  jobId: z.string().cuid('Invalid job ID format'),
  rating: z.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  qualityScore: z.number().min(0, 'Quality score must be between 0 and 100').max(100, 'Quality score must be between 0 and 100'),
  issues: z.array(z.string()).default([]),
  approved: z.boolean(),
  feedback: z.string().min(20, 'Feedback must be at least 20 characters').max(2000, 'Feedback must not exceed 2000 characters'),
});

export type ReviewJobQualityInput = z.infer<typeof reviewJobQualitySchema>;

/**
 * Schema for manually completing job
 */
export const manuallyCompleteJobSchema = z.object({
  jobId: z.string().cuid('Invalid job ID format'),
  completionNotes: z.string().min(20, 'Completion notes must be at least 20 characters').max(2000, 'Completion notes must not exceed 2000 characters'),
  boundaryData: z.any().optional(),
});

export type ManuallyCompleteJobInput = z.infer<typeof manuallyCompleteJobSchema>;

/**
 * Schema for suspending agent
 */
export const suspendAgentSchema = z.object({
  agentId: z.string().cuid('Invalid agent ID format'),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(1000, 'Reason must not exceed 1000 characters'),
  duration: z.number().int().positive('Duration must be a positive number').optional(), // in days
});

export type SuspendAgentInput = z.infer<typeof suspendAgentSchema>;

/**
 * Schema for reactivating agent
 */
export const reactivateAgentSchema = z.object({
  agentId: z.string().cuid('Invalid agent ID format'),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

export type ReactivateAgentInput = z.infer<typeof reactivateAgentSchema>;

/**
 * Schema for broadcasting urgent job
 */
export const broadcastUrgentJobSchema = z.object({
  jobId: z.string().cuid('Invalid job ID format'),
  message: z.string().max(500, 'Message must not exceed 500 characters').optional(),
});

export type BroadcastUrgentJobInput = z.infer<typeof broadcastUrgentJobSchema>;

/**
 * Schema for marking job filters
 */
export const markingJobFiltersSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  agentId: z.string().cuid().optional(),
  requestedBy: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'urgencyLevel', 'completionTime']).optional(),
});

export type MarkingJobFiltersInput = z.infer<typeof markingJobFiltersSchema>;

/**
 * Schema for agent queue filters
 */
export const agentQueueFiltersSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  availableOnly: z.boolean().optional().default(false),
  sortBy: z.enum(['performance', 'completionRate', 'reliabilityScore']).optional(),
});

export type AgentQueueFiltersInput = z.infer<typeof agentQueueFiltersSchema>;

/**
 * Schema for agent performance query
 */
export const agentPerformanceQuerySchema = z.object({
  agentId: z.string().cuid('Invalid agent ID format'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type AgentPerformanceQueryInput = z.infer<typeof agentPerformanceQuerySchema>;

/**
 * Validation helper functions
 */
export const validateReassignJob = (data: unknown) => {
  return reassignJobSchema.parse(data);
};

export const validateCancelMarkingJob = (data: unknown) => {
  return cancelMarkingJobSchema.parse(data);
};

export const validateExtendTimeSlot = (data: unknown) => {
  return extendTimeSlotSchema.parse(data);
};

export const validateReviewJobQuality = (data: unknown) => {
  return reviewJobQualitySchema.parse(data);
};

export const validateManuallyCompleteJob = (data: unknown) => {
  return manuallyCompleteJobSchema.parse(data);
};

export const validateSuspendAgent = (data: unknown) => {
  return suspendAgentSchema.parse(data);
};

export const validateReactivateAgent = (data: unknown) => {
  return reactivateAgentSchema.parse(data);
};

export const validateBroadcastUrgentJob = (data: unknown) => {
  return broadcastUrgentJobSchema.parse(data);
};

export const validateMarkingJobFilters = (data: unknown) => {
  return markingJobFiltersSchema.parse(data);
};

export const validateAgentQueueFilters = (data: unknown) => {
  return agentQueueFiltersSchema.parse(data);
};

export const validateAgentPerformanceQuery = (data: unknown) => {
  return agentPerformanceQuerySchema.parse(data);
};