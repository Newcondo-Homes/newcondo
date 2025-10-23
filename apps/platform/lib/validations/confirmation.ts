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









// // apps/platform/lib/validations/confirmation.ts
// import { z } from 'zod';

// // Confirm marking schema
// export const confirmMarkingSchema = z.object({
//   // Rating for agent (1-5 stars)
//   rating: z
//     .number()
//     .int()
//     .min(1, 'Rating must be at least 1')
//     .max(5, 'Rating cannot exceed 5'),
  
//   // Feedback (mandatory for ratings below 4)
//   feedback: z
//     .string()
//     .max(1000, 'Feedback is too long')
//     .optional()
//     .refine(
//       (feedback, ctx) => {
//         const rating = ctx.parent.rating;
//         if (rating < 4 && (!feedback || feedback.length < 10)) {
//           return false;
//         }
//         return true;
//       },
//       {
//         message: 'Detailed feedback is required for ratings below 4 stars (minimum 10 characters)'
//       }
//     ),
  
//   // Specific aspects rating
//   aspectRatings: z
//     .object({
//       accuracy: z.number().int().min(1).max(5),
//       timeliness: z.number().int().min(1).max(5),
//       communication: z.number().int().min(1).max(5),
//       professionalism: z.number().int().min(1).max(5)
//     })
//     .optional(),
  
//   // Boundary verification
//   boundaryAccurate: z.boolean(),
  
//   // Images verification
//   imagesQualityAcceptable: z.boolean(),
  
//   // Would recommend agent
//   wouldRecommend: z.boolean().optional(),
  
//   // Additional comments
//   additionalComments: z.string().max(500).optional()
// });

// export type ConfirmMarkingInput = z.infer<typeof confirmMarkingSchema>;

// // Reject marking schema
// export const rejectMarkingSchema = z.object({
//   // Primary rejection reason
//   primaryReason: z.enum([
//     'INCORRECT_PROPERTY',
//     'POOR_BOUNDARY_MARKING',
//     'INSUFFICIENT_IMAGES',
//     'POOR_IMAGE_QUALITY',
//     'WRONG_LOCATION',
//     'INCOMPLETE_MARKING',
//     'UNPROFESSIONAL_CONDUCT',
//     'OTHER'
//   ]),
  
//   // Detailed explanation (mandatory)
//   detailedExplanation: z
//     .string()
//     .min(20, 'Please provide a detailed explanation (minimum 20 characters)')
//     .max(1000, 'Explanation is too long'),
  
//   // Specific issues
//   issues: z
//     .array(
//       z.object({
//         type: z.enum([
//           'BOUNDARY',
//           'IMAGES',
//           'LOCATION',
//           'COMMUNICATION',
//           'ACCESS',
//           'OTHER'
//         ]),
//         description: z.string().max(200)
//       })
//     )
//     .min(1, 'At least one issue must be specified')
//     .max(10, 'Maximum 10 issues allowed'),
  
//   // Evidence (image URLs)
//   evidenceImages: z
//     .array(z.string().url())
//     .max(5, 'Maximum 5 evidence images allowed')
//     .optional(),
  
//   // Request re-marking
//   requestReMarking: z.boolean().default(true),
  
//   // Request refund
//   requestRefund: z.boolean().default(false)
// });

// export type RejectMarkingInput = z.infer<typeof rejectMarkingSchema>;

// // Request revision schema
// export const requestRevisionSchema = z.object({
//   // Revision type
//   revisionType: z.enum([
//     'BOUNDARY_ADJUSTMENT',
//     'ADDITIONAL_IMAGES',
//     'BETTER_IMAGE_QUALITY',
//     'CORRECT_LOCATION',
//     'COMPLETE_MISSING_AREAS',
//     'OTHER'
//   ]),
  
//   // Specific revision requests
//   revisionRequests: z
//     .array(
//       z.object({
//         area: z.enum([
//           'BOUNDARY',
//           'EXTERIOR',
//           'INTERIOR',
//           'COMPOUND',
//           'STREET_VIEW',
//           'OTHER'
//         ]),
//         instruction: z
//           .string()
//           .min(10, 'Please provide clear instructions')
//           .max(300, 'Instruction is too long')
//       })
//     )
//     .min(1, 'At least one revision request is required')
//     .max(5, 'Maximum 5 revision requests allowed'),
  
//   // Overall revision notes
//   revisionNotes: z
//     .string()
//     .min(20, 'Please provide detailed revision notes')
//     .max(1000, 'Revision notes are too long'),
  
//   // Priority level
//   priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  
//   // Deadline for revision (optional, max 48 hours)
//   revisionDeadline: z
//     .string()
//     .datetime()
//     .optional()
//     .refine(
//       (date) => {
//         if (!date) return true;
//         const deadline = new Date(date);
//         const now = new Date();
//         const maxDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
//         return deadline > now && deadline <= maxDeadline;
//       },
//       { message: 'Revision deadline must be within 48 hours' }
//     )
// });

// export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>;

// // Extend confirmation deadline schema
// export const extendConfirmationDeadlineSchema = z.object({
//   extensionDays: z
//     .number()
//     .int()
//     .min(1, 'Extension must be at least 1 day')
//     .max(3, 'Maximum extension is 3 days'),
  
//   reason: z
//     .string()
//     .min(10, 'Please provide a reason for extension')
//     .max(300, 'Reason is too long')
// });

// export type ExtendConfirmationDeadlineInput = z.infer<
//   typeof extendConfirmationDeadlineSchema
// >;

// // Report confirmation issue schema
// export const reportConfirmationIssueSchema = z.object({
//   issueType: z.enum([
//     'PAYMENT_NOT_RELEASED',
//     'INCORRECT_BOUNDARY',
//     'POOR_IMAGES',
//     'AGENT_UNRESPONSIVE',
//     'TECHNICAL_ERROR',
//     'OTHER'
//   ]),
  
//   description: z
//     .string()
//     .min(20, 'Please provide a detailed description')
//     .max(1000, 'Description is too long'),
  
//   urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  
//   affectedAspects: z
//     .array(
//       z.enum([
//         'PAYMENT',
//         'BOUNDARY',
//         'IMAGES',
//         'COMMUNICATION',
//         'TIMELINE',
//         'OTHER'
//       ])
//     )
//     .min(1, 'Select at least one affected aspect'),
  
//   evidenceUrls: z
//     .array(z.string().url())
//     .max(5, 'Maximum 5 evidence URLs allowed')
//     .optional(),
  
//   contactPreference: z
//     .enum(['EMAIL', 'PHONE', 'IN_APP'])
//     .default('IN_APP')
// });

// export type ReportConfirmationIssueInput = z.infer<typeof reportConfirmationIssueSchema>;

// // Auto-confirmation notification preferences schema
// export const autoConfirmationPreferencesSchema = z.object({
//   enableAutoConfirmation: z.boolean().default(true),
  
//   sendReminderDaysBefore: z
//     .number()
//     .int()
//     .min(1)
//     .max(3)
//     .default(1),
  
//   notificationChannels: z
//     .array(z.enum(['EMAIL', 'SMS', 'IN_APP', 'PUSH']))
//     .min(1, 'At least one notification channel is required')
// });

// export type AutoConfirmationPreferencesInput = z.infer<
//   typeof autoConfirmationPreferencesSchema
// >;

// // Validation helpers
// export const validateConfirmationEligibility = (completedAt: Date): {
//   eligible: boolean;
//   reason?: string;
//   deadline?: Date;
// } => {
//   const now = new Date();
//   const confirmationDeadline = new Date(completedAt.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
  
//   if (now > confirmationDeadline) {
//     return {
//       eligible: false,
//       reason: 'Confirmation deadline has passed. Job was auto-confirmed.',
//       deadline: confirmationDeadline
//     };
//   }
  
//   return {
//     eligible: true,
//     deadline: confirmationDeadline
//   };
// };

// export const calculateRemainingConfirmationTime = (
//   completedAt: Date
// ): {
//   hoursRemaining: number;
//   daysRemaining: number;
//   isExpired: boolean;
// } => {
//   const now = new Date();
//   const deadline = new Date(completedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
//   const remainingMs = deadline.getTime() - now.getTime();
  
//   if (remainingMs <= 0) {
//     return { hoursRemaining: 0, daysRemaining: 0, isExpired: true };
//   }
  
//   const hoursRemaining = Math.floor(remainingMs / (60 * 60 * 1000));
//   const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  
//   return { hoursRemaining, daysRemaining, isExpired: false };
// };