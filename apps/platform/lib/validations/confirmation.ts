import { z } from 'zod';

/**
 * Schema for confirming property
 */
export const confirmPropertySchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  confirmed: z.boolean(),
  notes: z.string().optional()
});

/**
 * Schema for checking confirmation status
 */
export const confirmationStatusSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required')
});

/**
 * Schema for confirmation timer query
 */
export const confirmationTimerSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required')
});

/**
 * Schema for confirmation history query
 */
export const confirmationHistorySchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  status: z.enum(['pending', 'confirmed', 'disputed']).optional()
});

/**
 * Type exports
 */
export type ConfirmPropertyInput = z.infer<typeof confirmPropertySchema>;
export type ConfirmationStatusInput = z.infer<typeof confirmationStatusSchema>;
export type ConfirmationTimerInput = z.infer<typeof confirmationTimerSchema>;
export type ConfirmationHistoryInput = z.infer<typeof confirmationHistorySchema>;