/**
 * Admin Validations Index
 * Central export point for all validation schemas
 */

// Verification validations
export * from './verification';

// Property approval validations
export * from './propertyApproval';

// Dispute validations
export * from './dispute';

// Marking job validations
export * from './markingJob';

// Support validations
export * from './support';

// Common validation utilities
import { z } from 'zod';

/**
 * Common pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Common date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate'],
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Common search schema
 */
export const searchSchema = z.object({
  search: z.string().max(100, 'Search query must not exceed 100 characters').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchInput = z.infer<typeof searchSchema>;

/**
 * Combined filters schema
 */
export const filtersSchema = paginationSchema.merge(dateRangeSchema).merge(searchSchema);

export type FiltersInput = z.infer<typeof filtersSchema>;

/**
 * ID validation schema
 */
export const idSchema = z.string().cuid('Invalid ID format');

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Phone validation schema (Nigerian format)
 */
export const phoneSchema = z.string().regex(
  /^(\+234|0)[789][01]\d{8}$/,
  'Invalid Nigerian phone number format'
);

/**
 * URL validation schema
 */
export const urlSchema = z.string().url('Invalid URL format');

/**
 * Currency validation schema
 */
export const currencySchema = z.enum(['NGN', 'USD', 'EUR', 'GBP']);

/**
 * Amount validation schema (for Nigerian Naira)
 */
export const amountSchema = z.number()
  .positive('Amount must be positive')
  .max(1000000000, 'Amount exceeds maximum allowed');

/**
 * Percentage validation schema
 */
export const percentageSchema = z.number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage cannot exceed 100');

/**
 * Helper function to validate any data against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Helper function to safely validate with error handling
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Helper function to format validation errors
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  
  return formatted;
}