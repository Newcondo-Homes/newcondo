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