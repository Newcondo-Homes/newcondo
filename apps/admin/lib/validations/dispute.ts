/**
 * Dispute Validation Schemas
 * Zod schemas for boundary dispute and conflict resolution operations
 */

import { z } from 'zod';

/**
 * Schema for resolving boundary dispute
 */
export const resolveDisputeSchema = z.object({
  disputeId: z.string().cuid('Invalid dispute ID format'),
  decision: z.enum(['CONFIRMED_DUPLICATE', 'NOT_DUPLICATE'], {
    errorMap: () => ({ message: 'Decision must be either CONFIRMED_DUPLICATE or NOT_DUPLICATE' }),
  }),
  resolution: z.string().min(20, 'Resolution must be at least 20 characters').max(2000, 'Resolution must not exceed 2000 characters'),
  actionsTaken: z.array(z.string()).optional(),
  notifyParties: z.boolean().optional().default(true),
});

export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

/**
 * Schema for adding dispute evidence
 */
export const addDisputeEvidenceSchema = z.object({
  disputeId: z.string().cuid('Invalid dispute ID format'),
  type: z.enum(['IMAGE', 'DOCUMENT', 'NOTE', 'COORDINATE_COMPARISON']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must not exceed 1000 characters'),
  fileUrl: z.string().url('Invalid file URL').optional(),
});

export type AddDisputeEvidenceInput = z.infer<typeof addDisputeEvidenceSchema>;

/**
 * Schema for comparing properties
 */
export const comparePropertiesSchema = z.object({
  property1Id: z.string().cuid('Invalid property 1 ID format'),
  property2Id: z.string().cuid('Invalid property 2 ID format'),
}).refine((data) => data.property1Id !== data.property2Id, {
  message: 'Cannot compare a property with itself',
  path: ['property2Id'],
});

export type ComparePropertiesInput = z.infer<typeof comparePropertiesSchema>;

/**
 * Schema for escalating dispute
 */
export const escalateDisputeSchema = z.object({
  disputeId: z.string().cuid('Invalid dispute ID format'),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(1000, 'Reason must not exceed 1000 characters'),
});

export type EscalateDisputeInput = z.infer<typeof escalateDisputeSchema>;

/**
 * Schema for requesting additional information
 */
export const requestAdditionalInfoSchema = z.object({
  disputeId: z.string().cuid('Invalid dispute ID format'),
  requestTo: z.enum(['ORIGINAL_OWNER', 'DUPLICATE_OWNER', 'BOTH']),
  message: z.string().min(20, 'Message must be at least 20 characters').max(1000, 'Message must not exceed 1000 characters'),
  requiredDocuments: z.array(z.string()).optional(),
});

export type RequestAdditionalInfoInput = z.infer<typeof requestAdditionalInfoSchema>;

/**
 * Schema for merging duplicate properties
 */
export const mergeDuplicatePropertiesSchema = z.object({
  primaryPropertyId: z.string().cuid('Invalid primary property ID format'),
  duplicatePropertyId: z.string().cuid('Invalid duplicate property ID format'),
  mergeStrategy: z.object({
    keepPrimaryDetails: z.boolean(),
    keepPrimaryImages: z.boolean(),
    notifyOwners: z.boolean().default(true),
  }),
}).refine((data) => data.primaryPropertyId !== data.duplicatePropertyId, {
  message: 'Cannot merge a property with itself',
  path: ['duplicatePropertyId'],
});

export type MergeDuplicatePropertiesInput = z.infer<typeof mergeDuplicatePropertiesSchema>;

/**
 * Schema for flagging property for review
 */
export const flagPropertySchema = z.object({
  propertyId: z.string().cuid('Invalid property ID format'),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(1000, 'Reason must not exceed 1000 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export type FlagPropertyInput = z.infer<typeof flagPropertySchema>;

/**
 * Schema for dispute filters
 */
export const disputeFiltersSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  status: z.enum(['PENDING', 'CONFIRMED_DUPLICATE', 'NOT_DUPLICATE', 'RESOLVED']).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  minSimilarity: z.number().min(0).max(100).optional(),
  sortBy: z.enum(['createdAt', 'similarity', 'priority']).optional(),
});

export type DisputeFiltersInput = z.infer<typeof disputeFiltersSchema>;

/**
 * Schema for marking as false positive
 */
export const markFalsePositiveSchema = z.object({
  duplicateId: z.string().cuid('Invalid duplicate ID format'),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(500, 'Reason must not exceed 500 characters'),
});

export type MarkFalsePositiveInput = z.infer<typeof markFalsePositiveSchema>;

/**
 * Validation helper functions
 */
export const validateResolveDispute = (data: unknown) => {
  return resolveDisputeSchema.parse(data);
};

export const validateAddDisputeEvidence = (data: unknown) => {
  return addDisputeEvidenceSchema.parse(data);
};

export const validateCompareProperties = (data: unknown) => {
  return comparePropertiesSchema.parse(data);
};

export const validateEscalateDispute = (data: unknown) => {
  return escalateDisputeSchema.parse(data);
};

export const validateRequestAdditionalInfo = (data: unknown) => {
  return requestAdditionalInfoSchema.parse(data);
};

export const validateMergeDuplicateProperties = (data: unknown) => {
  return mergeDuplicatePropertiesSchema.parse(data);
};

export const validateFlagProperty = (data: unknown) => {
  return flagPropertySchema.parse(data);
};

export const validateDisputeFilters = (data: unknown) => {
  return disputeFiltersSchema.parse(data);
};

export const validateMarkFalsePositive = (data: unknown) => {
  return markFalsePositiveSchema.parse(data);
};