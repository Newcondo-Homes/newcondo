// apps/platform/lib/validations/markingJob.ts

import { z } from 'zod';

/**
 * Marking job creation schema
 */
export const createMarkingJobSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID'),
  
  // Contact person details
  contactPersonName: z
    .string()
    .min(2, 'Contact person name must be at least 2 characters')
    .max(100, 'Contact person name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Contact person name can only contain letters, spaces, hyphens, and apostrophes'),
  
  contactPersonPhone: z
    .string()
    .regex(/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone number format. Use format: +2348012345678 or 08012345678'),
  
  accessInstructions: z
    .string()
    .max(500, 'Access instructions must not exceed 500 characters')
    .optional(),
  
  preferredTime: z
    .string()
    .datetime('Invalid date format')
    .or(z.date())
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const preferredDate = new Date(date);
        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30); // Max 30 days in future
        
        return preferredDate > now && preferredDate < maxDate;
      },
      {
        message: 'Preferred time must be between now and 30 days from now',
      }
    ),
  
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  
  // Marking method selection
  markingMethod: z.enum([
    'SELF', // Mark the building themselves
    'NEWCONDO_ADMIN', // Give Newcondo the task
    'SOMEONE_I_KNOW', // Send someone they know
    'ASSIGN_TO_AGENTS', // Assign to agents/renters in proximity
  ]),
  
  // Optional: if markingMethod is SOMEONE_I_KNOW, this will be used
  isShareableLink: z.boolean().default(false),
});

/**
 * Marking job update schema
 */
export const updateMarkingJobSchema = z.object({
  contactPersonName: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z\s'-]+$/)
    .optional(),
  
  contactPersonPhone: z
    .string()
    .regex(/^(\+234|0)[789][01]\d{8}$/)
    .optional(),
  
  accessInstructions: z.string().max(500).optional(),
  
  preferredTime: z
    .string()
    .datetime()
    .or(z.date())
    .optional(),
  
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

/**
 * Marking job completion schema (for agents)
 */
export const completeMarkingJobSchema = z.object({
  completionNotes: z
    .string()
    .min(10, 'Completion notes must be at least 10 characters')
    .max(1000, 'Completion notes must not exceed 1000 characters'),
  
  completionImages: z
    .array(z.string().url('Invalid image URL'))
    .min(3, 'At least 3 completion images are required')
    .max(15, 'Maximum 15 completion images allowed'),
  
  boundaryData: z.object({
    coordinates: z.array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
    ).min(3, 'At least 3 coordinates are required to form a boundary'),
    
    center: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    
    area: z.number().positive('Area must be positive'),
    
    address: z.string().min(5, 'Address is required'),
  }),
});

/**
 * Property owner confirmation schema
 */
export const confirmMarkingJobSchema = z.object({
  isAccepted: z.boolean(),
  
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must not exceed 500 characters')
    .optional(),
  
  feedback: z
    .string()
    .max(1000, 'Feedback must not exceed 1000 characters')
    .optional(),
}).refine(
  (data) => {
    // If not accepted, rejection reason is required
    if (!data.isAccepted && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: 'Rejection reason is required when not accepting the marking',
    path: ['rejectionReason'],
  }
);

/**
 * Agent assignment acceptance schema
 */
export const acceptMarkingJobSchema = z.object({
  estimatedArrivalTime: z
    .string()
    .datetime()
    .or(z.date())
    .refine(
      (date) => {
        const arrivalTime = new Date(date);
        const now = new Date();
        const maxTime = new Date();
        maxTime.setHours(maxTime.getHours() + 3); // Within 3 hours
        
        return arrivalTime > now && arrivalTime <= maxTime;
      },
      {
        message: 'Estimated arrival time must be within the next 3 hours',
      }
    ),
  
  transportMode: z.enum(['WALKING', 'BIKE', 'CAR', 'PUBLIC_TRANSPORT']).optional(),
  
  notes: z.string().max(200).optional(),
});

/**
 * Cancel marking job schema
 */
export const cancelMarkingJobSchema = z.object({
  cancellationReason: z
    .string()
    .min(10, 'Cancellation reason must be at least 10 characters')
    .max(500, 'Cancellation reason must not exceed 500 characters'),
  
  requestRefund: z.boolean().default(false),
});

/**
 * Query/filter marking jobs schema
 */
export const queryMarkingJobsSchema = z.object({
  status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
  
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  
  assignedToMe: z.boolean().optional(),
  
  requestedByMe: z.boolean().optional(),
  
  paymentStatus: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'HELD', 'RELEASED']).optional(),
  
  dateFrom: z.string().datetime().or(z.date()).optional(),
  
  dateTo: z.string().datetime().or(z.date()).optional(),
  
  page: z.number().int().positive().default(1),
  
  limit: z.number().int().positive().max(100).default(20),
  
  sortBy: z.enum(['createdAt', 'updatedAt', 'urgencyLevel', 'status']).default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type CreateMarkingJobInput = z.infer<typeof createMarkingJobSchema>;
export type UpdateMarkingJobInput = z.infer<typeof updateMarkingJobSchema>;
export type CompleteMarkingJobInput = z.infer<typeof completeMarkingJobSchema>;
export type ConfirmMarkingJobInput = z.infer<typeof confirmMarkingJobSchema>;
export type AcceptMarkingJobInput = z.infer<typeof acceptMarkingJobSchema>;
export type CancelMarkingJobInput = z.infer<typeof cancelMarkingJobSchema>;
export type QueryMarkingJobsInput = z.infer<typeof queryMarkingJobsSchema>;