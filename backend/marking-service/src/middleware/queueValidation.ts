import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas for queue management
const queueFilterSchema = z.object({
  status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  agentId: z.string().cuid().optional(),
  city: z.string().min(2).max(50).optional(),
  state: z.string().min(2).max(50).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'urgencyLevel', 'preferredTime', 'markingFee']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const agentAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  serviceAreas: z.array(z.string().min(2).max(50)).max(10, 'Maximum 10 service areas allowed').optional()
});

const queuePositionUpdateSchema = z.object({
  newPosition: z.number().int().min(1, 'Queue position must be at least 1'),
  reason: z.string().max(200, 'Reason too long').optional()
});

const bulkStatusUpdateSchema = z.object({
  jobIds: z.array(z.string().cuid()).min(1, 'At least one job ID required').max(50, 'Maximum 50 jobs can be updated at once'),
  status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']),
  notes: z.string().max(500, 'Notes too long').optional()
});

const agentCapacitySchema = z.object({
  maxConcurrentJobs: z.number().int().min(1).max(10).default(3),
  workingHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
  }).optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).max(7, 'Maximum 7 days').optional() // 0 = Sunday, 6 = Saturday
});

// Middleware functions
export const validateQueueFilters = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = queueFilterSchema.parse(req.query);
    
    // Additional validation for date range
    if (validatedData.dateFrom && validatedData.dateTo) {
      const fromDate = new Date(validatedData.dateFrom);
      const toDate = new Date(validatedData.dateTo);
      
      if (fromDate >= toDate) {
        return res.status(400).json({
          success: false,
          message: 'dateFrom must be before dateTo'
        });
      }
      
      // Limit date range to maximum 1 year
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (toDate.getTime() - fromDate.getTime() > oneYear) {
        return res.status(400).json({
          success: false,
          message: 'Date range cannot exceed 1 year'
        });
      }
    }
    
    req.query = validatedData as any;
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

export const validateAgentAvailability = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = agentAvailabilitySchema.parse(req.body);
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

export const validateQueuePositionUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = queuePositionUpdateSchema.parse(req.body);
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

export const validateBulkStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = bulkStatusUpdateSchema.parse(req.body);
    
    // Ensure no duplicate job IDs
    const uniqueJobIds = new Set(validatedData.jobIds);
    if (uniqueJobIds.size !== validatedData.jobIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate job IDs are not allowed'
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

export const validateAgentCapacity = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = agentCapacitySchema.parse(req.body);
    
    // Additional validation for working hours
    if (validatedData.workingHours) {
      const { start, end } = validatedData.workingHours;
      const startMinutes = timeToMinutes(start);
      const endMinutes = timeToMinutes(end);
      
      if (startMinutes >= endMinutes) {
        return res.status(400).json({
          success: false,
          message: 'Working start time must be before end time'
        });
      }
      
      // Minimum 4 hours, maximum 16 hours
      const workingHours = (endMinutes - startMinutes) / 60;
      if (workingHours < 4 || workingHours > 16) {
        return res.status(400).json({
          success: false,
          message: 'Working hours must be between 4 and 16 hours'
        });
      }
    }
    
    // Validate working days
    if (validatedData.workingDays) {
      const uniqueDays = new Set(validatedData.workingDays);
      if (uniqueDays.size !== validatedData.workingDays.length) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate working days are not allowed'
        });
      }
      
      if (validatedData.workingDays.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one working day must be specified'
        });
      }
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

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Validate queue metrics request
export const validateQueueMetrics = (req: Request, res: Response, next: NextFunction) => {
  const metricsSchema = z.object({
    period: z.enum(['today', 'week', 'month', 'year']).default('today'),
    agentId: z.string().cuid().optional(),
    includeCompleted: z.string().transform(val => val === 'true').optional()
  });
  
  try {
    const validatedData = metricsSchema.parse(req.query);
    req.query = validatedData as any;
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


// // backend/marking-service/src/middleware/queueValidation.ts

// import { Request, Response, NextFunction } from 'express';
// import { z } from 'zod';

// // Validation schema for joining the marking queue
// const joinQueueSchema = z.object({
//   jobId: z.string().cuid(),
//   estimatedArrivalTime: z.string().datetime().optional(),
//   currentLocation: z.object({
//     lat: z.number().min(-90).max(90),
//     lng: z.number().min(-180).max(180),
//   }).optional(),
// });

// // Validation schema for updating queue status
// const updateQueueStatusSchema = z.object({
//   status: z.enum(['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'STARTED', 'CANCELLED']),
//   currentLocation: z.object({
//     lat: z.number().min(-90).max(90),
//     lng: z.number().min(-180).max(180),
//   }).optional(),
//   cancellationReason: z.string().optional(),
// });

// // Validation schema for queue position management
// const manageQueuePositionSchema = z.object({
//   action: z.enum(['SKIP', 'FORFEIT', 'EXTEND_TIME']),
//   reason: z.string().optional(),
//   extensionMinutes: z.number().min(15).max(60).optional(),
// });

// // Validation schema for agent availability update
// const updateAvailabilitySchema = z.object({
//   isAvailableForMarking: z.boolean(),
//   serviceAreas: z.array(z.object({
//     state: z.string(),
//     lga: z.string(),
//     city: z.string(),
//   })).optional(),
//   maxJobsPerDay: z.number().min(1).max(10).optional(),
// });

// /**
//  * Middleware to validate joining the marking queue
//  */
// export const validateJoinQueue = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = joinQueueSchema.parse(req.body);
    
//     // Validate estimated arrival time if provided
//     if (validated.estimatedArrivalTime) {
//       const arrivalTime = new Date(validated.estimatedArrivalTime);
//       const now = new Date();
//       const maxArrivalTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
      
//       if (arrivalTime < now) {
//         res.status(400).json({
//           success: false,
//           message: 'Estimated arrival time cannot be in the past',
//         });
//         return;
//       }
      
//       if (arrivalTime > maxArrivalTime) {
//         res.status(400).json({
//           success: false,
//           message: 'Estimated arrival time cannot exceed 3 hours from now',
//         });
//         return;
//       }
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
//  * Middleware to validate queue status update
//  */
// export const validateUpdateQueueStatus = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = updateQueueStatusSchema.parse(req.body);
    
//     // If cancelling, reason is required
//     if (validated.status === 'CANCELLED' && !validated.cancellationReason) {
//       res.status(400).json({
//         success: false,
//         message: 'Cancellation reason is required when cancelling',
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
//  * Middleware to validate queue position management
//  */
// export const validateManageQueuePosition = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = manageQueuePositionSchema.parse(req.body);
    
//     // If extending time, extension minutes is required
//     if (validated.action === 'EXTEND_TIME' && !validated.extensionMinutes) {
//       res.status(400).json({
//         success: false,
//         message: 'Extension minutes is required when extending time',
//       });
//       return;
//     }
    
//     // If skipping or forfeiting, reason is required
//     if ((validated.action === 'SKIP' || validated.action === 'FORFEIT') && !validated.reason) {
//       res.status(400).json({
//         success: false,
//         message: 'Reason is required when skipping or forfeiting',
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
//  * Middleware to validate agent availability update
//  */
// export const validateUpdateAvailability = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const validated = updateAvailabilitySchema.parse(req.body);
    
//     // If setting available, service areas should be provided
//     if (validated.isAvailableForMarking && (!validated.serviceAreas || validated.serviceAreas.length === 0)) {
//       res.status(400).json({
//         success: false,
//         message: 'Service areas are required when setting availability to true',
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
//  * Middleware to validate queue entry ID parameter
//  */
// export const validateQueueEntryId = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const { queueId } = req.params;
  
//   if (!queueId || typeof queueId !== 'string') {
//     res.status(400).json({
//       success: false,
//       message: 'Valid queue entry ID is required',
//     });
//     return;
//   }
  
//   next();
// };

// /**
//  * Middleware to validate query parameters for queue listing
//  */
// export const validateQueueQueryParams = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const { status, limit, offset } = req.query;
  
//   // Validate status if provided
//   if (status) {
//     const validStatuses = ['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'];
//     if (!validStatuses.includes(status as string)) {
//       res.status(400).json({
//         success: false,
//         message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
//       });
//       return;
//     }
//   }
  
//   // Validate limit if provided
//   if (limit) {
//     const limitNum = parseInt(limit as string);
//     if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
//       res.status(400).json({
//         success: false,
//         message: 'Limit must be a number between 1 and 100',
//       });
//       return;
//     }
//   }
  
//   // Validate offset if provided
//   if (offset) {
//     const offsetNum = parseInt(offset as string);
//     if (isNaN(offsetNum) || offsetNum < 0) {
//       res.status(400).json({
//         success: false,
//         message: 'Offset must be a non-negative number',
//       });
//       return;
//     }
//   }
  
//   next();
// };









// import { Request, Response, NextFunction } from 'express';
// import { z } from 'zod';
// import { ApiResponse } from '../../../shared/src/utils/response';

// // Zod schemas for queue operations
// const AcceptQueueJobSchema = z.object({
//   markingJobId: z.string().cuid('Invalid marking job ID'),
//   estimatedArrivalTime: z.string().datetime().optional(),
//   agentNotes: z.string().max(200).optional(),
// });

// const RejectQueueJobSchema = z.object({
//   markingJobId: z.string().cuid('Invalid marking job ID'),
//   reason: z.string().min(5).max(200, 'Reason must be between 5 and 200 characters'),
// });

// const UpdateQueuePositionSchema = z.object({
//   markingJobId: z.string().cuid(),
//   newPosition: z.number().int().positive().optional(),
//   status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED']).optional(),
// });

// const GetQueueStatsSchema = z.object({
//   timeRange: z.enum(['TODAY', 'WEEK', 'MONTH', 'ALL']).default('TODAY').optional(),
//   status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED']).optional(),
// });

// export const validateAcceptQueueJob = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const validatedData = AcceptQueueJobSchema.parse(req.body);
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

// export const validateRejectQueueJob = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const validatedData = RejectQueueJobSchema.parse(req.body);
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

// export const validateUpdateQueuePosition = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const validatedData = UpdateQueuePositionSchema.parse(req.body);
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

// export const validateGetQueueStats = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const validatedData = GetQueueStatsSchema.parse(req.query);
//     req.query = validatedData as any;
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

// // Additional validation: Check if agent has valid service areas
// export const validateAgentServiceArea = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { latitude, longitude } = req.body;
    
//     if (!latitude || !longitude) {
//       return res.status(400).json(
//         ApiResponse.error('Agent location (latitude, longitude) is required for queue assignment')
//       );
//     }

//     if (typeof latitude !== 'number' || typeof longitude !== 'number') {
//       return res.status(400).json(
//         ApiResponse.error('Invalid coordinate format. Latitude and longitude must be numbers')
//       );
//     }

//     if (latitude < -90 || latitude > 90) {
//       return res.status(400).json(
//         ApiResponse.error('Invalid latitude. Must be between -90 and 90')
//       );
//     }

//     if (longitude < -180 || longitude > 180) {
//       return res.status(400).json(
//         ApiResponse.error('Invalid longitude. Must be between -180 and 180')
//       );
//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// // Validate agent is eligible for queue operations
// export const validateAgentEligibility = (req: Request, res: Response, next: NextFunction) => {
//   const agent = (req as any).user;

//   if (!agent) {
//     return res.status(401).json(
//       ApiResponse.error('Agent authentication required')
//     );
//   }

//   if (!agent.isAvailableForMarking) {
//     return res.status(403).json(
//       ApiResponse.error('Agent is not marked as available for marking jobs')
//     );
//   }

//   if (!agent.agentServiceAreas || agent.agentServiceAreas.length === 0) {
//     return res.status(403).json(
//       ApiResponse.error('Agent must set service areas before accepting jobs')
//     );
//   }

//   next();
// };








// // backend/marking-service/src/middleware/queueValidation.ts

// import { Request, Response, NextFunction } from 'express';
// import { z } from 'zod';
// import { prisma } from '@newcondo/db';

// // Validation schemas
// const joinQueueSchema = z.object({
//   markingJobId: z.string().cuid('Invalid marking job ID format'),
//   estimatedArrivalTime: z
//     .string()
//     .datetime()
//     .optional()
//     .transform((date) => (date ? new Date(date) : undefined)),
//   notes: z
//     .string()
//     .max(500, 'Notes must not exceed 500 characters')
//     .trim()
//     .optional(),
// });

// const updateQueuePositionSchema = z.object({
//   estimatedArrivalTime: z
//     .string()
//     .datetime()
//     .refine(
//       (date) => new Date(date) > new Date(),
//       'Estimated arrival time must be in the future'
//     )
//     .optional()
//     .transform((date) => (date ? new Date(date) : undefined)),
//   notes: z.string().max(500).trim().optional(),
// });

// const leaveQueueSchema = z.object({
//   reason: z
//     .string()
//     .min(10, 'Reason must be at least 10 characters')
//     .max(500, 'Reason must not exceed 500 characters')
//     .trim(),
// });

// // Middleware functions
// export const validateJoinQueue = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = joinQueueSchema.parse(req.body);
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

// export const validateUpdateQueuePosition = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = updateQueuePositionSchema.parse(req.body);
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

// export const validateLeaveQueue = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   try {
//     const validated = leaveQueueSchema.parse(req.body);
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

// // Check if agent is eligible to join queue
// export const validateAgentEligibility = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const userRole = req.user?.role;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'User authentication required',
//       });
//       return;
//     }
    
//     // Check if user is an agent or premium renter
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         role: true,
//         isPremium: true,
//         isAvailableForMarking: true,
//         verificationStatus: true,
//       },
//     });
    
//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//       return;
//     }
    
//     // Validate user is verified
//     if (user.verificationStatus !== 'VERIFIED') {
//       res.status(403).json({
//         success: false,
//         message: 'Account must be verified to join marking queue',
//       });
//       return;
//     }
    
//     // Check eligibility based on role
//     const isAgent = user.role === 'AGENT';
//     const isPremiumRenter = user.role === 'RENTER' && user.isPremium;
    
//     if (!isAgent && !isPremiumRenter) {
//       res.status(403).json({
//         success: false,
//         message: 'Only agents and premium renters can join the marking queue',
//       });
//       return;
//     }
    
//     // Check if agent has enabled marking service
//     if (!user.isAvailableForMarking) {
//       res.status(403).json({
//         success: false,
//         message: 'You must enable marking service availability in your profile',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error validating agent eligibility:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error validating agent eligibility',
//     });
//   }
// };

// // Check if agent is already in queue
// export const validateNotInQueue = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { markingJobId } = req.body;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'User authentication required',
//       });
//       return;
//     }
    
//     // Check if job exists and is in QUEUED status
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       select: {
//         status: true,
//         assignedAgentId: true,
//       },
//     });
    
//     if (!job) {
//       res.status(404).json({
//         success: false,
//         message: 'Marking job not found',
//       });
//       return;
//     }
    
//     if (job.status !== 'QUEUED') {
//       res.status(400).json({
//         success: false,
//         message: 'This marking job is no longer available for queue',
//       });
//       return;
//     }
    
//     // Check if user is already assigned to this job
//     if (job.assignedAgentId === userId) {
//       res.status(400).json({
//         success: false,
//         message: 'You are already assigned to this job',
//       });
//       return;
//     }
    
//     // Check if user has any active assignments (max 3 concurrent)
//     const activeAssignments = await prisma.propertyMarkingJob.count({
//       where: {
//         assignedAgentId: userId,
//         status: {
//           in: ['ASSIGNED', 'IN_PROGRESS'],
//         },
//       },
//     });
    
//     if (activeAssignments >= 3) {
//       res.status(400).json({
//         success: false,
//         message: 'You have reached the maximum limit of 3 concurrent marking jobs',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error validating queue status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error validating queue status',
//     });
//   }
// };

// // Validate queue position exists
// export const validateQueueMembership = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { jobId } = req.params;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'User authentication required',
//       });
//       return;
//     }
    
//     // Check if user is in queue for this job
//     const job = await prisma.propertyMarkingJob.findFirst({
//       where: {
//         id: jobId,
//         assignedAgentId: userId,
//         status: {
//           in: ['QUEUED', 'ASSIGNED'],
//         },
//       },
//     });
    
//     if (!job) {
//       res.status(404).json({
//         success: false,
//         message: 'You are not in the queue for this marking job',
//       });
//       return;
//     }
    
//     // Check if time slot has expired
//     if (job.timeSlotExpiry && new Date() > job.timeSlotExpiry) {
//       res.status(400).json({
//         success: false,
//         message: 'Your time slot for this job has expired',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error validating queue membership:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error validating queue membership',
//     });
//   }
// };

// // Validate time slot availability
// export const validateTimeSlot = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { markingJobId } = req.body;
    
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       select: {
//         timeSlotExpiry: true,
//         assignedAgentId: true,
//         status: true,
//       },
//     });
    
//     if (!job) {
//       res.status(404).json({
//         success: false,
//         message: 'Marking job not found',
//       });
//       return;
//     }
    
//     // If there's a current assignment, check if time slot expired
//     if (job.assignedAgentId && job.timeSlotExpiry) {
//       const now = new Date();
      
//       if (now < job.timeSlotExpiry) {
//         const remainingMinutes = Math.ceil(
//           (job.timeSlotExpiry.getTime() - now.getTime()) / (1000 * 60)
//         );
        
//         res.status(400).json({
//           success: false,
//           message: `This job is currently assigned. Please wait ${remainingMinutes} minutes for the time slot to expire`,
//         });
//         return;
//       }
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error validating time slot:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error validating time slot',
//     });
//   }
// };

// // Validate service area coverage
// export const validateServiceArea = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const { markingJobId } = req.body;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'User authentication required',
//       });
//       return;
//     }
    
//     // Get agent's service areas
//     const agent = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { agentServiceAreas: true },
//     });
    
//     // Get job location
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: {
//         property: {
//           select: {
//             city: true,
//             state: true,
//           },
//         },
//       },
//     });
    
//     if (!job) {
//       res.status(404).json({
//         success: false,
//         message: 'Marking job not found',
//       });
//       return;
//     }
    
//     // Check if agent covers this area
//     const propertyLocation = `${job.property.city}, ${job.property.state}`;
    
//     if (
//       agent?.agentServiceAreas &&
//       agent.agentServiceAreas.length > 0 &&
//       !agent.agentServiceAreas.some(
//         (area) =>
//           propertyLocation.toLowerCase().includes(area.toLowerCase()) ||
//           area.toLowerCase().includes(job.property.city.toLowerCase()) ||
//           area.toLowerCase().includes(job.property.state.toLowerCase())
//       )
//     ) {
//       res.status(403).json({
//         success: false,
//         message: 'This marking job is outside your service area',
//         propertyLocation,
//         yourServiceAreas: agent.agentServiceAreas,
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error validating service area:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error validating service area',
//     });
//   }
// };