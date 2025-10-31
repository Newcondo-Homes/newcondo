/**
 * Property Approval Validation Schemas
 * Zod schemas for property listing approval operations
 */

import { z } from 'zod';

/**
 * Schema for approving property listing
 */
export const approvePropertySchema = z.object({
  propertyId: z.string().cuid('Invalid property ID format'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  requireBoundaryUpdate: z.boolean().optional().default(false),
});

export type ApprovePropertyInput = z.infer<typeof approvePropertySchema>;

/**
 * Schema for rejecting property listing
 */
export const rejectPropertySchema = z.object({
  propertyId: z.string().cuid('Invalid property ID format'),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(1000, 'Reason must not exceed 1000 characters'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  specificIssues: z.array(
    z.enum([
      'INCOMPLETE_INFORMATION',
      'POOR_IMAGES',
      'MISSING_DOCUMENTS',
      'BOUNDARY_ISSUES',
      'DUPLICATE_LISTING',
      'INAPPROPRIATE_CONTENT',
      'PRICING_CONCERNS',
      'LOCATION_MISMATCH',
      'FAKE_LISTING',
      'OTHER',
    ])
  ).optional(),
});

export type RejectPropertyInput = z.infer<typeof rejectPropertySchema>;

/**
 * Schema for updating property status
 */
export const updatePropertyStatusSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID format'),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'RENTED', 'UNAVAILABLE']),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional(),
});

export type UpdatePropertyStatusInput = z.infer<typeof updatePropertyStatusSchema>;

/**
 * Schema for delisting property
 */
export const delistPropertySchema = z.object({
  propertyId: z.string().cuid('Invalid property ID format'),
  reason: z.string().min(20, 'Reason must be at least 20 characters').max(1000, 'Reason must not exceed 1000 characters'),
});

export type DelistPropertyInput = z.infer<typeof delistPropertySchema>;

/**
 * Schema for requesting property updates
 */
export const requestPropertyUpdatesSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID format'),
  requiredUpdates: z.array(
    z.enum([
      'IMPROVE_DESCRIPTION',
      'ADD_MORE_IMAGES',
      'UPDATE_BOUNDARY',
      'UPLOAD_DOCUMENTS',
      'VERIFY_LOCATION',
      'UPDATE_PRICING',
      'ADD_AMENITIES',
      'FIX_CONTACT_INFO',
      'OTHER',
    ])
  ).min(1, 'At least one update must be specified'),
  message: z.string().min(20, 'Message must be at least 20 characters').max(1000, 'Message must not exceed 1000 characters'),
});

export type RequestPropertyUpdatesInput = z.infer<typeof requestPropertyUpdatesSchema>;

/**
 * Schema for bulk property approval
 */
export const bulkApprovePropertiesSchema = z.object({
  propertyIds: z.array(z.string().cuid()).min(1, 'At least one property ID must be provided').max(20, 'Cannot approve more than 20 properties at once'),
});

export type BulkApprovePropertiesInput = z.infer<typeof bulkApprovePropertiesSchema>;

/**
 * Schema for property filters
 */
export const propertyFiltersSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'RENTED', 'UNAVAILABLE']).optional(),
  adminApprovalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE']).optional(),
  structure: z.enum(['SINGLE_UNIT', 'MULTI_FAMILY']).optional(),
  search: z.string().max(100).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  boundaryVerified: z.boolean().optional(),
});

export type PropertyFiltersInput = z.infer<typeof propertyFiltersSchema>;

/**
 * Schema for boundary validation
 */
export const validateBoundarySchema = z.object({
  propertyId: z.string().cuid('Invalid property ID format'),
});

export type ValidateBoundaryInput = z.infer<typeof validateBoundarySchema>;

/**
 * Validation helper functions
 */
export const validateApproveProperty = (data: unknown) => {
  return approvePropertySchema.parse(data);
};

export const validateRejectProperty = (data: unknown) => {
  return rejectPropertySchema.parse(data);
};

export const validateUpdatePropertyStatus = (data: unknown) => {
  return updatePropertyStatusSchema.parse(data);
};

export const validateDelistProperty = (data: unknown) => {
  return delistPropertySchema.parse(data);
};

export const validateRequestPropertyUpdates = (data: unknown) => {
  return requestPropertyUpdatesSchema.parse(data);
};

export const validateBulkApproveProperties = (data: unknown) => {
  return bulkApprovePropertiesSchema.parse(data);
};

export const validatePropertyFilters = (data: unknown) => {
  return propertyFiltersSchema.parse(data);
};

export const validateBoundary = (data: unknown) => {
  return validateBoundarySchema.parse(data);
};