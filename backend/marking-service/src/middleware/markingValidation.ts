import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas for property marking
const createMarkingJobSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID'),
  contactPersonName: z.string().min(2, 'Contact person name must be at least 2 characters').max(50, 'Contact person name too long'),
  contactPersonPhone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone number'),
  accessInstructions: z.string().max(500, 'Access instructions too long').optional(),
  preferredTime: z.string().datetime('Invalid preferred time').optional(),
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL')
});

const updateMarkingJobSchema = z.object({
  contactPersonName: z.string().min(2).max(50).optional(),
  contactPersonPhone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/).optional(),
  accessInstructions: z.string().max(500).optional(),
  preferredTime: z.string().datetime().optional(),
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional()
});

const completeMarkingJobSchema = z.object({
  completionNotes: z.string().min(10, 'Completion notes must be at least 10 characters').max(1000, 'Completion notes too long'),
  completionImages: z.array(z.string().url('Invalid image URL')).min(1, 'At least one completion image is required').max(10, 'Maximum 10 images allowed'),
  boundaryData: z.object({
    coordinates: z.array(z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })).min(3, 'Boundary must have at least 3 coordinates'),
    area: z.number().positive('Area must be positive'),
    center: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
  })
});

const assignAgentSchema = z.object({
  agentId: z.string().cuid('Invalid agent ID'),
  timeSlotStart: z.string().datetime('Invalid time slot start'),
  timeSlotEnd: z.string().datetime('Invalid time slot end'),
  notes: z.string().max(500, 'Notes too long').optional()
});

const updateJobStatusSchema = z.object({
  status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']),
  notes: z.string().max(500, 'Notes too long').optional()
});

// Middleware functions
export const validateCreateMarkingJob = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createMarkingJobSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateUpdateMarkingJob = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateMarkingJobSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateCompleteMarkingJob = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = completeMarkingJobSchema.parse(req.body);
    
    // Additional validation for boundary data
    const { boundaryData } = validatedData;
    const coordinates = boundaryData.coordinates;
    
    // Check if polygon is closed (first and last coordinates should be the same or very close)
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const distance = Math.sqrt(
      Math.pow(first.lat - last.lat, 2) + Math.pow(first.lng - last.lng, 2)
    );
    
    if (distance > 0.0001) { // Allow small tolerance
      return res.status(400).json({
        success: false,
        message: 'Boundary polygon must be closed (first and last coordinates should match)'
      });
    }
    
    // Validate area is reasonable (between 50 sqm and 10,000 sqm for typical properties)
    if (boundaryData.area < 50 || boundaryData.area > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Property area must be between 50 and 10,000 square meters'
      });
    }
    
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateAssignAgent = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = assignAgentSchema.parse(req.body);
    
    // Validate time slot duration (should be exactly 3 hours)
    const startTime = new Date(validatedData.timeSlotStart);
    const endTime = new Date(validatedData.timeSlotEnd);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    if (durationHours !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Time slot must be exactly 3 hours'
      });
    }
    
    // Validate time slot is in the future
    if (startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Time slot must be in the future'
      });
    }
    
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateUpdateJobStatus = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateJobStatusSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

// Validate marking job ID parameter
export const validateMarkingJobId = (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Valid job ID is required'
    });
  }
  
  // Basic CUID validation (starts with 'c' and is 25 characters long)
  if (!/^c[a-z0-9]{24}$/.test(jobId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job ID format'
    });
  }
  
  next();
};

// Validate property ID parameter
export const validatePropertyId = (req: Request, res: Response, next: NextFunction) => {
  const { propertyId } = req.params;
  
  if (!propertyId || typeof propertyId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Valid property ID is required'
    });
  }
  
  // Basic CUID validation
  if (!/^c[a-z0-9]{24}$/.test(propertyId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid property ID format'
    });
  }
  
  next();
};

// Validate pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page = '1', limit = '10' } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive integer'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  req.query.page = pageNum.toString();
  req.query.limit = limitNum.toString();
  
  next();
};



// // backend/marking-service/src/middleware/markingValidation.ts

// import { Request, Response, NextFunction } from 'express';
// import { z } from 'zod';

// // Validation schema for creating a marking job
// const createMarkingJobSchema = z.object({
//   propertyId: z.string().cuid(),
//   markingMethod: z.enum(['SELF', 'NEWCONDO_ADMIN', 'SEND_SOMEONE', 'ASSIGN_TO_AGENTS']),
//   contactPersonName: z.string().min(2, 'Contact person name must be at least 2 characters'),
//   contactPersonPhone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone number'),
//   accessInstructions: z.string().optional(),
//   preferredTime: z.string().datetime().optional(),
//   urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  
//   // Property location details (hierarchical address)
//   propertyLocation: z.object({
//     state: z.string().min(1, 'State is required'),
//     lga: z.string().min(1, 'LGA is required'),
//     city: z.string().min(1, 'City is required'),
//     location: z.string().min(1, 'Location is required'),
//     streetAddress: z.string().min(1, 'Street address is required'),
//   }),
  
//   // Optional property images for identification
//   propertyImages: z.array(z.string().url()).optional(),
  
//   // For SEND_SOMEONE method - guide/marker details
//   guideDetails: z.object({
//     name: z.string().min(2),
//     phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/),
//     relationship: z.string().optional(),
//   }).optional(),
// });

// // Validation schema for completing a marking job
// const completeMarkingJobSchema = z.object({
//   completionNotes: z.string().min(10, 'Completion notes must be at least 10 characters'),
//   completionImages: z.array(z.string().url()).min(3, 'At least 3 images are required'),
//   boundaryData: z.object({
//     coordinates: z.array(z.object({
//       lat: z.number(),
//       lng: z.number(),
//     })).min(4, 'At least 4 boundary points are required'),
//     center: z.object({
//       lat: z.number(),
//       lng: z.number(),
//     }),
//     area: z.number().positive('Area must be positive'),
//   }),
//   roomImages: z.array(z.object({
//     roomType: z.string(),
//     imageUrl: z.string().url(),
//     description: z.string().optional(),
//   })).min(1, 'At least 1 room image is required'),
// });

// // Validation schema for confirming/verifying a marking job
// const confirmMarkingJobSchema = z.object({
//   isConfirmed: z.boolean(),
//   feedback: z.string().optional(),
//   rejectionReason: z.string().optional(),
// });

// // Validation schema for updating marking job
// const updateMarkingJobSchema = z.object({
//   contactPersonName: z.string().min(2).optional(),
//   contactPersonPhone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/).optional(),
//   accessInstructions: z.string().optional(),
//   preferredTime: z.string().datetime().optional(),
//   urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
//   propertyImages: z.array(z.string().url()).optional(),
// });

// // Validation schema for shareable link generation
// const generateShareableLinkSchema = z.object({
//   propertyId: z.string().cuid(),
//   expiresInHours: z.number().min(1).max(72).default(24),
//   markerName: z.string().min(2, 'Marker name is required'),
//   markerPhone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, 'Invalid phone number'),
// });

// /**
//  * Middleware to validate creating a marking job
//  */
// export const validateCreateMarkingJob = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = createMarkingJobSchema.parse(req.body);
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map(err => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     next(error);
//   }
// };

// /**
//  * Middleware to validate completing a marking job
//  */
// export const validateCompleteMarkingJob = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = completeMarkingJobSchema.parse(req.body);
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map(err => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     next(error);
//   }
// };

// /**
//  * Middleware to validate confirming a marking job
//  */
// export const validateConfirmMarkingJob = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = confirmMarkingJobSchema.parse(req.body);
    
//     // If not confirmed, rejection reason is required
//     if (!validated.isConfirmed && !validated.rejectionReason) {
//       res.status(400).json({
//         success: false,
//         message: 'Rejection reason is required when not confirming',
//       });
//       return;
//     }
    
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map(err => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     next(error);
//   }
// };

// /**
//  * Middleware to validate updating a marking job
//  */
// export const validateUpdateMarkingJob = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = updateMarkingJobSchema.parse(req.body);
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map(err => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     next(error);
//   }
// };

// /**
//  * Middleware to validate shareable link generation
//  */
// export const validateGenerateShareableLink = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = generateShareableLinkSchema.parse(req.body);
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map(err => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     next(error);
//   }
// };

// /**
//  * Middleware to validate marking job ID parameter
//  */
// export const validateMarkingJobId = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const { jobId } = req.params;
  
//   if (!jobId || typeof jobId !== 'string') {
//     res.status(400).json({
//       success: false,
//       message: 'Valid marking job ID is required',
//     });
//     return;
//   }
  
//   next();
// };

// /**
//  * Middleware to validate property ID parameter
//  */
// export const validatePropertyId = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const { propertyId } = req.params;
  
//   if (!propertyId || typeof propertyId !== 'string') {
//     res.status(400).json({
//       success: false,
//       message: 'Valid property ID is required',
//     });
//     return;
//   }
  
//   next();
// };










// import { Request, Response, NextFunction } from 'express';
// import { z } from 'zod';
// import { ApiResponse } from '../../../shared/src/utils/response';

// // Zod schemas for marking job validation
// const CreateMarkingJobSchema = z.object({
//   propertyId: z.string().cuid('Invalid property ID'),
//   contactPersonName: z.string().min(2, 'Contact person name is required').max(100),
//   contactPersonPhone: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone number'),
//   accessInstructions: z.string().optional().nullable(),
//   preferredTime: z.string().datetime().optional().nullable(),
//   urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
//   markingOption: z.enum(['SELF_MARK', 'NEWCONDO_AGENT', 'KNOWN_PERSON', 'AVAILABLE_AGENTS']),
// });

// const UpdateMarkingJobSchema = z.object({
//   contactPersonName: z.string().min(2).max(100).optional(),
//   contactPersonPhone: z.string().regex(/^\+?[\d\s-]{10,}$/).optional(),
//   accessInstructions: z.string().optional().nullable(),
//   preferredTime: z.string().datetime().optional().nullable(),
//   urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
// });

// const CompleteMarkingJobSchema = z.object({
//   completionNotes: z.string().min(10).max(500),
//   boundaryData: z.object({
//     coordinates: z.array(z.object({
//       lat: z.number(),
//       lng: z.number(),
//     })).min(3, 'At least 3 coordinates required for boundary'),
//     area: z.number().positive('Area must be positive'),
//   }),
//   completionImages: z.array(z.string().url()).min(1, 'At least one completion image required'),
// });

// const ConfirmMarkingSchema = z.object({
//   isConfirmed: z.boolean(),
//   rejectionReason: z.string().optional().nullable(),
// });

// export const validateCreateMarkingJob = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const validatedData = CreateMarkingJobSchema.parse(req.body);
//     req.body = validatedData;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json(
//         ApiResponse.error('Validation failed', error.errors)
//       );
//     }
//     next(error);
//   }
// };

// export const validateUpdateMarkingJob = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const validatedData = UpdateMarkingJobSchema.parse(req.body);
//     req.body = validatedData;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json(
//         ApiResponse.error('Validation failed', error.errors)
//       );
//     }
//     next(error);
//   }
// };

// export const validateCompleteMarkingJob = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const validatedData = CompleteMarkingJobSchema.parse(req.body);
//     req.body = validatedData;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json(
//         ApiResponse.error('Validation failed', error.errors)
//       );
//     }
//     next(error);
//   }
// };

// export const validateConfirmMarking = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const validatedData = ConfirmMarkingSchema.parse(req.body);
//     req.body = validatedData;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json(
//         ApiResponse.error('Validation failed', error.errors)
//       );
//     }
//     next(error);
//   }
// };

// export const validateMarkingJobId = (req: Request, res: Response, next: NextFunction) => {
//   const { markingJobId } = req.params;
  
//   if (!markingJobId || !markingJobId.match(/^[a-z0-9]+$/i)) {
//     return res.status(400).json(
//       ApiResponse.error('Invalid marking job ID format')
//     );
//   }
  
//   next();
// };







// // backend/marking-service/src/middleware/markingValidation.ts

// import { Request, Response, NextFunction } from 'express';
// import { z } from 'zod';
// import { PropertyMarkingJob, UrgencyLevel } from '@newcondo/db';

// // Validation schemas
// const createMarkingJobSchema = z.object({
//   propertyId: z.string().cuid('Invalid property ID format'),
//   contactPersonName: z
//     .string()
//     .min(2, 'Contact person name must be at least 2 characters')
//     .max(100, 'Contact person name must not exceed 100 characters')
//     .trim(),
//   contactPersonPhone: z
//     .string()
//     .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number format'),
//   accessInstructions: z
//     .string()
//     .max(1000, 'Access instructions must not exceed 1000 characters')
//     .trim()
//     .optional(),
//   preferredTime: z
//     .string()
//     .datetime()
//     .refine(
//       (date) => new Date(date) > new Date(),
//       'Preferred time must be in the future'
//     )
//     .optional()
//     .transform((date) => (date ? new Date(date) : undefined)),
//   urgencyLevel: z
//     .enum([
//       UrgencyLevel.LOW,
//       UrgencyLevel.NORMAL,
//       UrgencyLevel.HIGH,
//       UrgencyLevel.URGENT,
//     ])
//     .default(UrgencyLevel.NORMAL),
// });

// const updateMarkingJobSchema = z.object({
//   contactPersonName: z
//     .string()
//     .min(2)
//     .max(100)
//     .trim()
//     .optional(),
//   contactPersonPhone: z
//     .string()
//     .regex(/^(\+234|0)[789]\d{9}$/)
//     .optional(),
//   accessInstructions: z
//     .string()
//     .max(1000)
//     .trim()
//     .optional(),
//   preferredTime: z
//     .string()
//     .datetime()
//     .refine((date) => new Date(date) > new Date())
//     .optional()
//     .transform((date) => (date ? new Date(date) : undefined)),
//   urgencyLevel: z
//     .enum([
//       UrgencyLevel.LOW,
//       UrgencyLevel.NORMAL,
//       UrgencyLevel.HIGH,
//       UrgencyLevel.URGENT,
//     ])
//     .optional(),
// });

// const assignAgentSchema = z.object({
//   agentId: z.string().cuid('Invalid agent ID format'),
//   notes: z.string().max(500).trim().optional(),
// });

// const cancelJobSchema = z.object({
//   reason: z
//     .string()
//     .min(10, 'Cancellation reason must be at least 10 characters')
//     .max(500, 'Cancellation reason must not exceed 500 characters')
//     .trim(),
// });

// const shareableLinkSchema = z.object({
//   expiryHours: z
//     .number()
//     .int()
//     .min(1, 'Expiry must be at least 1 hour')
//     .max(168, 'Expiry must not exceed 7 days')
//     .default(24),
// });

// // Middleware functions
// export const validateCreateMarkingJob = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = createMarkingJobSchema.parse(req.body);
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map((err) => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error during validation',
//     });
//   }
// };

// export const validateUpdateMarkingJob = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = updateMarkingJobSchema.parse(req.body);
    
//     // Ensure at least one field is being updated
//     if (Object.keys(validated).length === 0) {
//       res.status(400).json({
//         success: false,
//         message: 'At least one field must be provided for update',
//       });
//       return;
//     }
    
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map((err) => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error during validation',
//     });
//   }
// };

// export const validateAssignAgent = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = assignAgentSchema.parse(req.body);
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map((err) => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error during validation',
//     });
//   }
// };

// export const validateCancelJob = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = cancelJobSchema.parse(req.body);
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map((err) => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error during validation',
//     });
//   }
// };

// export const validateShareableLink = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = shareableLinkSchema.parse(req.body);
//     req.body = validated;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.errors.map((err) => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error during validation',
//     });
//   }
// };

// // Validate marking job ID parameter
// export const validateMarkingJobId = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const { jobId } = req.params;
  
//   if (!jobId) {
//     res.status(400).json({
//       success: false,
//       message: 'Marking job ID is required',
//     });
//     return;
//   }
  
//   // Validate CUID format
//   const cuidRegex = /^c[a-z0-9]{24}$/i;
//   if (!cuidRegex.test(jobId)) {
//     res.status(400).json({
//       success: false,
//       message: 'Invalid marking job ID format',
//     });
//     return;
//   }
  
//   next();
// };

// // Validate property ownership or listing rights
// export const validatePropertyRights = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { propertyId } = req.body;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'User authentication required',
//       });
//       return;
//     }
    
//     // This will be implemented in the service layer
//     // The middleware just ensures the data structure is correct
//     next();
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error validating property rights',
//     });
//   }
// };

// // Validate marking fee payment
// export const validateMarkingFee = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const MARKING_FEE = 20000; // ₦20,000
//   const { markingFee } = req.body;
  
//   if (markingFee && markingFee !== MARKING_FEE) {
//     res.status(400).json({
//       success: false,
//       message: `Invalid marking fee. Expected ₦${MARKING_FEE.toLocaleString()}`,
//     });
//     return;
//   }
  
//   next();
// };

// // Validate query parameters for listing jobs
// const listJobsQuerySchema = z.object({
//   status: z
//     .enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'])
//     .optional(),
//   page: z
//     .string()
//     .regex(/^\d+$/)
//     .transform(Number)
//     .refine((n) => n > 0, 'Page must be greater than 0')
//     .default('1'),
//   limit: z
//     .string()
//     .regex(/^\d+$/)
//     .transform(Number)
//     .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
//     .default('10'),
//   sortBy: z
//     .enum(['createdAt', 'updatedAt', 'preferredTime', 'urgencyLevel'])
//     .default('createdAt'),
//   sortOrder: z.enum(['asc', 'desc']).default('desc'),
// });

// export const validateListJobsQuery = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = listJobsQuerySchema.parse(req.query);
//     req.query = validated as any;
//     next();
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({
//         success: false,
//         message: 'Invalid query parameters',
//         errors: error.errors.map((err) => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//       });
//       return;
//     }
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error during validation',
//     });
//   }
// };