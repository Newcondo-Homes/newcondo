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