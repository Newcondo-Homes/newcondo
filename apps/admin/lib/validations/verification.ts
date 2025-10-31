/**
 * Verification Validation Schemas
 * Zod schemas for user and document verification operations
 */

import { z } from 'zod';

/**
 * Schema for approving user verification
 */
export const approveVerificationSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  documentIds: z.array(z.string().cuid()).optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

export type ApproveVerificationInput = z.infer<typeof approveVerificationSchema>;

/**
 * Schema for rejecting user verification
 */
export const rejectVerificationSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  documentIds: z.array(z.string().cuid()).optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

export type RejectVerificationInput = z.infer<typeof rejectVerificationSchema>;

/**
 * Schema for document approval
 */
export const approveDocumentSchema = z.object({
  documentId: z.string().cuid('Invalid document ID format'),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

export type ApproveDocumentInput = z.infer<typeof approveDocumentSchema>;

/**
 * Schema for document rejection
 */
export const rejectDocumentSchema = z.object({
  documentId: z.string().cuid('Invalid document ID format'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters'),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>;

/**
 * Schema for requesting additional documents
 */
export const requestAdditionalDocumentsSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  documentTypes: z.array(
    z.enum([
      'NIN',
      'BVN',
      'PASSPORT',
      'VOTERS_CARD',
      'DRIVERS_LICENSE',
      'SELFIE',
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'BUSINESS_REGISTRATION',
      'TAX_CERTIFICATE',
      'UTILITY_BILL',
      'BANK_STATEMENT',
      'OTHER',
    ])
  ).min(1, 'At least one document type must be specified'),
  message: z.string().min(20, 'Message must be at least 20 characters').max(1000, 'Message must not exceed 1000 characters'),
});

export type RequestAdditionalDocumentsInput = z.infer<typeof requestAdditionalDocumentsSchema>;

/**
 * Schema for bulk verification approval
 */
export const bulkApproveVerificationsSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1, 'At least one user ID must be provided').max(50, 'Cannot approve more than 50 users at once'),
});

export type BulkApproveVerificationsInput = z.infer<typeof bulkApproveVerificationsSchema>;

/**
 * Schema for verification filters
 */
export const verificationFiltersSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  role: z.enum(['OWNER', 'AGENT', 'RENTER', 'ADMIN']).optional(),
  documentType: z.enum([
    'NIN',
    'BVN',
    'PASSPORT',
    'VOTERS_CARD',
    'DRIVERS_LICENSE',
    'SELFIE',
    'OWNERSHIP_DOCUMENT',
    'CONSENT_DOCUMENT',
    'UNDERTAKING_DOCUMENT',
    'BUSINESS_REGISTRATION',
    'TAX_CERTIFICATE',
    'UTILITY_BILL',
    'BANK_STATEMENT',
    'OTHER',
  ]).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  search: z.string().max(100).optional(),
});

export type VerificationFiltersInput = z.infer<typeof verificationFiltersSchema>;

/**
 * Validation helper functions
 */
export const validateApproveVerification = (data: unknown) => {
  return approveVerificationSchema.parse(data);
};

export const validateRejectVerification = (data: unknown) => {
  return rejectVerificationSchema.parse(data);
};

export const validateApproveDocument = (data: unknown) => {
  return approveDocumentSchema.parse(data);
};

export const validateRejectDocument = (data: unknown) => {
  return rejectDocumentSchema.parse(data);
};

export const validateRequestAdditionalDocuments = (data: unknown) => {
  return requestAdditionalDocumentsSchema.parse(data);
};

export const validateBulkApproveVerifications = (data: unknown) => {
  return bulkApproveVerificationsSchema.parse(data);
};

export const validateVerificationFilters = (data: unknown) => {
  return verificationFiltersSchema.parse(data);
};