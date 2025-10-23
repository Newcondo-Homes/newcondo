// apps/platform/lib/validations/marking.ts
import { z } from 'zod';
import { coordinateSchema, boundaryPointSchema } from './boundary';

// Phone number validation for Nigeria
const nigerianPhoneSchema = z.string()
  .regex(/^(\+234|234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone number')
  .transform((val) => {
    // Normalize to international format
    if (val.startsWith('0')) {
      return '+234' + val.slice(1);
    }
    if (val.startsWith('234')) {
      return '+' + val;
    }
    return val;
  });

// Marking job urgency levels
export const urgencyLevelSchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

// Marking job status
export const markingJobStatusSchema = z.enum([
  'QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'
]);

// Create marking job request
export const createMarkingJobSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  
  // Contact details
  contactPersonName: z.string()
    .min(2, 'Contact person name must be at least 2 characters')
    .max(100, 'Contact person name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Contact person name contains invalid characters'),
  
  contactPersonPhone: nigerianPhoneSchema,
  
  // Access instructions
  accessInstructions: z.string()
    .min(10, 'Access instructions must be at least 10 characters')
    .max(500, 'Access instructions cannot exceed 500 characters')
    .optional(),
  
  // Preferred time
  preferredTime: z.coerce.date()
    .refine(
      (date) => date > new Date(),
      'Preferred time must be in the future'
    )
    .refine(
      (date) => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30); // Max 30 days in advance
        return date <= maxDate;
      },
      'Preferred time cannot be more than 30 days in advance'
    )
    .optional(),
  
  // Urgency level
  urgencyLevel: urgencyLevelSchema.default('NORMAL'),
  
  // Additional information
  propertySize: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
  accessType: z.enum(['EASY', 'RESTRICTED', 'DIFFICULT']).optional(),
  specialInstructions: z.string().max(300, 'Special instructions cannot exceed 300 characters').optional(),
  
  // Alternative contact
  alternativeContact: z.object({
    name: z.string().min(2).max(100),
    phone: nigerianPhoneSchema,
    relationship: z.string().max(50),
  }).optional(),
});

// Update marking job request
export const updateMarkingJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  
  // Updatable fields
  contactPersonName: z.string().min(2).max(100).optional(),
  contactPersonPhone: nigerianPhoneSchema.optional(),
  accessInstructions: z.string().min(10).max(500).optional(),
  preferredTime: z.coerce.date()
    .refine((date) => date > new Date(), 'Preferred time must be in the future')
    .optional(),
  urgencyLevel: urgencyLevelSchema.optional(),
  specialInstructions: z.string().max(300).optional(),
  
  // Status updates (admin/agent only)
  status: markingJobStatusSchema.optional(),
  assignedAgentId: z.string().optional(),
  completionNotes: z.string().max(1000).optional(),
});

// Agent assignment request
export const assignAgentSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  estimatedCompletionTime: z.coerce.date()
    .refine(
      (date) => date > new Date(),
      'Estimated completion time must be in the future'
    )
    .refine(
      (date) => {
        const maxTime = new Date();
        maxTime.setHours(maxTime.getHours() + 3); // Max 3 hours for completion
        return date <= maxTime;
      },
      'Estimated completion time cannot exceed 3 hours'
    ),
  agentNotes: z.string().max(300, 'Agent notes cannot exceed 300 characters').optional(),
});

// Complete marking job request
export const completeMarkingJobSchema = z.object({
jobId: z.string().min(1, 'Job ID is required'),
// Boundary data
boundaryCoordinates: z.array(boundaryPointSchema)
.min(3, 'Property boundary must have at least 3 points')
.max(20, 'Property boundary cannot have more than 20 points'),
// Completion evidence
completionImages: z.array(z.string().url('Invalid image URL'))
.min(1, 'At least one completion image is required')
.max(10, 'Cannot upload more than 10 completion images'),
// Completion notes
completionNotes: z.string()
.min(20, 'Completion notes must be at least 20 characters')
.max(1000, 'Completion notes cannot exceed 1000 characters'),
// Property verification
propertyMatches: z.boolean(),
propertyCondition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
accessDifficulty: z.enum(['EASY', 'MODERATE', 'DIFFICULT']),
// Additional findings
additionalFindings: z.string().max(500).optional(),
recommendedActions: z.array(z.string()).max(5).optional(),
// GPS accuracy
gpsAccuracy: z.number()
.min(1, 'GPS accuracy must be at least 1 meter')
.max(50, 'GPS accuracy cannot exceed 50 meters'),
// Final verification
verifiedByAgentId: z.string().min(1, 'Agent ID is required'),
verifiedAt: z.coerce.date()
});





// // apps/platform/lib/validations/marking.ts
// import { z } from "zod";

// // Marking job request validation
// export const createMarkingJobSchema = z.object({
//   propertyId: z.string().cuid("Invalid property ID").describe("Property ID"),
//   contactPersonName: z
//     .string()
//     .min(2, "Name must be at least 2 characters")
//     .max(100, "Name must not exceed 100 characters"),
//   contactPersonPhone: z
//     .string()
//     .regex(
//       /^(\+?234|0)[0-9]{10}$/,
//       "Invalid Nigerian phone number"
//     ),
//   accessInstructions: z
//     .string()
//     .min(10, "Instructions must be at least 10 characters")
//     .max(500, "Instructions must not exceed 500 characters")
//     .optional(),
//   preferredTime: z
//     .string()
//     .datetime()
//     .optional(),
//   urgencyLevel: z
//     .enum(["LOW", "NORMAL", "HIGH", "URGENT"])
//     .default("NORMAL"),
//   markerType: z
//     .enum(["SELF", "KNOWN_PERSON", "NEWCONDO_AGENT", "NEWCONDO_PREMIUM"])
//     .describe("Type of marker"),
//   addressState: z
//     .string()
//     .min(2, "State is required")
//     .describe("State from hierarchical address"),
//   addressLGA: z
//     .string()
//     .min(2, "LGA is required")
//     .describe("Local Government Area"),
//   addressCity: z
//     .string()
//     .min(2, "City is required")
//     .describe("City/Town"),
//   addressLocation: z
//     .string()
//     .min(2, "Specific location is required")
//     .describe("Specific location/neighborhood"),
// });

// // Update marking job completion
// export const completeMarkingJobSchema = z.object({
//   markingJobId: z.string().cuid("Invalid marking job ID"),
//   boundaryData: z
//     .object({
//       coordinates: z
//         .array(
//           z.object({
//             lat: z.number().min(-90).max(90),
//             lng: z.number().min(-180).max(180),
//           })
//         )
//         .min(3, "Boundary must have at least 3 points"),
//       area: z.number().positive("Area must be positive").optional(),
//     })
//     .describe("Property boundary coordinates"),
//   completionNotes: z
//     .string()
//     .max(500, "Notes must not exceed 500 characters")
//     .optional(),
//   completionImages: z
//     .array(z.string().url())
//     .max(10, "Maximum 10 images allowed")
//     .optional(),
// });

// // Confirm marking job (by property owner)
// export const confirmMarkingJobSchema = z.object({
//   markingJobId: z.string().cuid("Invalid marking job ID"),
//   isConfirmed: z.boolean().describe("Confirm or reject the marking"),
//   rejectionReason: z
//     .string()
//     .min(10, "Reason must be at least 10 characters")
//     .max(300, "Reason must not exceed 300 characters")
//     .optional(),
// });

// // Assign marking job to agent
// export const assignMarkingJobSchema = z.object({
//   markingJobId: z.string().cuid("Invalid marking job ID"),
//   agentId: z.string().cuid("Invalid agent ID"),
// });

// // Cancel marking job
// export const cancelMarkingJobSchema = z.object({
//   markingJobId: z.string().cuid("Invalid marking job ID"),
//   cancellationReason: z
//     .string()
//     .min(5, "Reason must be at least 5 characters")
//     .max(300, "Reason must not exceed 300 characters"),
// });

// // Share marking job link (for known person marking)
// export const shareMarkingLinkSchema = z.object({
//   markingJobId: z.string().cuid("Invalid marking job ID"),
//   markerEmail: z.string().email("Invalid email address").optional(),
//   markerPhone: z
//     .string()
//     .regex(
//       /^(\+?234|0)[0-9]{10}$/,
//       "Invalid Nigerian phone number"
//     )
//     .optional(),
// });

// export type CreateMarkingJobInput = z.infer<typeof createMarkingJobSchema>;
// export type CompleteMarkingJobInput = z.infer<
//   typeof completeMarkingJobSchema
// >;
// export type ConfirmMarkingJobInput = z.infer<typeof confirmMarkingJobSchema>;
// export type AssignMarkingJobInput = z.infer<typeof assignMarkingJobSchema>;
// export type CancelMarkingJobInput = z.infer<typeof cancelMarkingJobSchema>;
// export type ShareMarkingLinkInput = z.infer<typeof shareMarkingLinkSchema>;














// // apps/platform/lib/validations/marking.ts
// import { z } from 'zod';

// // Enums
// export const MarkingJobStatusEnum = z.enum([
//   'QUEUED',
//   'ASSIGNED',
//   'IN_PROGRESS',
//   'COMPLETED',
//   'CANCELLED',
//   'EXPIRED'
// ]);

// export const UrgencyLevelEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

// export const ImageTypeEnum = z.enum([
//   'BOUNDARY',
//   'EXTERIOR_FRONT',
//   'EXTERIOR_BACK',
//   'EXTERIOR_SIDE',
//   'LIVING_ROOM',
//   'BEDROOM',
//   'KITCHEN',
//   'BATHROOM',
//   'COMPOUND',
//   'STREET_VIEW',
//   'OTHER'
// ]);

// // Phone number validation for Nigerian numbers
// const nigerianPhoneSchema = z
//   .string()
//   .regex(/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone number')
//   .or(z.string().regex(/^[789][01]\d{8}$/, 'Invalid phone number'));

// // GPS coordinates validation
// const coordinatesSchema = z.object({
//   lat: z.number().min(-90).max(90),
//   lng: z.number().min(-180).max(180)
// });

// // Hierarchical address schema (State > LGA > Location)
// const hierarchicalAddressSchema = z.object({
//   state: z.string().min(1, 'State is required'),
//   lga: z.string().min(1, 'LGA is required'),
//   location: z.string().min(1, 'Location is required'),
//   streetAddress: z.string().optional(),
//   landmark: z.string().optional()
// });

// // Create marking job schema
// export const createMarkingJobSchema = z.object({
//   propertyId: z.string().cuid('Invalid property ID'),
  
//   // Contact person details
//   contactPersonName: z
//     .string()
//     .min(2, 'Contact person name must be at least 2 characters')
//     .max(100, 'Contact person name is too long'),
  
//   contactPersonPhone: nigerianPhoneSchema,
  
//   // Property access details
//   accessInstructions: z
//     .string()
//     .max(500, 'Access instructions are too long')
//     .optional(),
  
//   // Hierarchical address
//   propertyAddress: hierarchicalAddressSchema,
  
//   // Property images (optional, helps agent identify property)
//   propertyImages: z
//     .array(z.string().url())
//     .max(10, 'Maximum 10 property images allowed')
//     .optional(),
  
//   // Preferred time for marking
//   preferredTime: z
//     .string()
//     .datetime()
//     .optional()
//     .refine(
//       (date) => {
//         if (!date) return true;
//         return new Date(date) > new Date();
//       },
//       { message: 'Preferred time must be in the future' }
//     ),
  
//   urgencyLevel: UrgencyLevelEnum.default('NORMAL'),
  
//   // Additional notes
//   notes: z.string().max(1000).optional()
// });

// export type CreateMarkingJobInput = z.infer<typeof createMarkingJobSchema>;

// // Update marking job schema
// export const updateMarkingJobSchema = z.object({
//   contactPersonName: z
//     .string()
//     .min(2)
//     .max(100)
//     .optional(),
  
//   contactPersonPhone: nigerianPhoneSchema.optional(),
  
//   accessInstructions: z.string().max(500).optional(),
  
//   propertyAddress: hierarchicalAddressSchema.optional(),
  
//   propertyImages: z.array(z.string().url()).max(10).optional(),
  
//   preferredTime: z
//     .string()
//     .datetime()
//     .optional()
//     .refine(
//       (date) => {
//         if (!date) return true;
//         return new Date(date) > new Date();
//       },
//       { message: 'Preferred time must be in the future' }
//     ),
  
//   urgencyLevel: UrgencyLevelEnum.optional(),
  
//   notes: z.string().max(1000).optional()
// });

// export type UpdateMarkingJobInput = z.infer<typeof updateMarkingJobSchema>;

// // Join queue schema
// export const joinQueueSchema = z.object({
//   estimatedArrivalTime: z
//     .string()
//     .datetime()
//     .optional()
//     .refine(
//       (date) => {
//         if (!date) return true;
//         const arrival = new Date(date);
//         const now = new Date();
//         const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
//         return arrival <= threeHoursFromNow;
//       },
//       { message: 'Estimated arrival time must be within 3 hours' }
//     ),
  
//   currentLocation: coordinatesSchema.optional(),
  
//   notes: z.string().max(200).optional()
// });

// export type JoinQueueInput = z.infer<typeof joinQueueSchema>;

// // Accept marking job schema
// export const acceptMarkingJobSchema = z.object({
//   estimatedStartTime: z
//     .string()
//     .datetime()
//     .refine(
//       (date) => {
//         const start = new Date(date);
//         const now = new Date();
//         return start > now;
//       },
//       { message: 'Estimated start time must be in the future' }
//     ),
  
//   currentLocation: coordinatesSchema
// });

// export type AcceptMarkingJobInput = z.infer<typeof acceptMarkingJobSchema>;

// // Reject marking job schema
// export const rejectMarkingJobSchema = z.object({
//   reason: z
//     .string()
//     .min(10, 'Please provide a detailed reason (minimum 10 characters)')
//     .max(500, 'Reason is too long')
// });

// export type RejectMarkingJobInput = z.infer<typeof rejectMarkingJobSchema>;

// // Agent location update schema
// export const updateAgentLocationSchema = z.object({
//   coordinates: coordinatesSchema,
//   isAvailableForMarking: z.boolean(),
//   serviceAreas: z
//     .array(
//       z.object({
//         state: z.string(),
//         lga: z.string(),
//         locations: z.array(z.string())
//       })
//     )
//     .min(1, 'At least one service area is required')
//     .max(5, 'Maximum 5 service areas allowed')
// });

// export type UpdateAgentLocationInput = z.infer<typeof updateAgentLocationSchema>;

// // Cancel marking job schema
// export const cancelMarkingJobSchema = z.object({
//   reason: z
//     .string()
//     .min(10, 'Please provide a reason for cancellation')
//     .max(500, 'Reason is too long'),
  
//   refundRequested: z.boolean().default(true)
// });

// export type CancelMarkingJobInput = z.infer<typeof cancelMarkingJobSchema>;