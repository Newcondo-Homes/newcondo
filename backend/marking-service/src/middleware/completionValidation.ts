// backend/marking-service/src/middleware/completionValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@newcondo/db';

// Validation schemas
const completeJobSchema = z.object({
  completionNotes: z
    .string()
    .min(20, 'Completion notes must be at least 20 characters')
    .max(2000, 'Completion notes must not exceed 2000 characters')
    .trim(),
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
    ).min(3, 'At least 3 boundary points are required'),
    centerPoint: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    area: z.number().positive('Area must be a positive number'),
  }),
});

const markInProgressSchema = z.object({
  startTime: z
    .string()
    .datetime()
    .optional()
    .transform((date) => (date ? new Date(date) : new Date())),
  notes: z.string().max(500).trim().optional(),
});

const uploadCompletionImageSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  description: z
    .string()
    .max(200, 'Image description must not exceed 200 characters')
    .trim()
    .optional(),
  imageType: z
    .enum([
      'exterior_front',
      'exterior_back',
      'exterior_side',
      'interior_living',
      'interior_kitchen',
      'interior_bedroom',
      'interior_bathroom',
      'boundary_marker',
      'street_view',
      'gate_entrance',
      'other',
    ])
    .default('other'),
});

// Middleware functions
export const validateCompleteJob = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = completeJobSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

export const validateMarkInProgress = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = markInProgressSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

export const validateUploadCompletionImage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = uploadCompletionImageSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
};

// Check if job is assigned to the current user
export const validateJobAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        assignedAgentId: true,
        status: true,
        timeSlotExpiry: true,
      },
    });
    
    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Marking job not found',
      });
      return;
    }
    
    if (job.assignedAgentId !== userId) {
      res.status(403).json({
        success: false,
        message: 'This job is not assigned to you',
      });
      return;
    }
    
    if (job.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'This job has already been completed',
      });
      return;
    }
    
    if (job.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        message: 'This job has been cancelled',
      });
      return;
    }
    
    if (job.status === 'EXPIRED') {
      res.status(400).json({
        success: false,
        message: 'This job has expired',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating job assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating job assignment',
    });
  }
};

// Check if time slot is still valid
export const validateTimeSlotNotExpired = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        timeSlotExpiry: true,
        status: true,
      },
    });
    
    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Marking job not found',
      });
      return;
    }
    
    if (job.timeSlotExpiry && new Date() > job.timeSlotExpiry) {
      res.status(400).json({
        success: false,
        message: 'Your time slot for this job has expired',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating time slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating time slot',
    });
  }
};

// Validate boundary data quality
export const validateBoundaryQuality = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { boundaryData } = req.body;
    
    if (!boundaryData || !boundaryData.coordinates) {
      res.status(400).json({
        success: false,
        message: 'Boundary data is required',
      });
      return;
    }
    
    const { coordinates, area } = boundaryData;
    
    // Check minimum boundary points
    if (coordinates.length < 3) {
      res.status(400).json({
        success: false,
        message: 'At least 3 boundary points are required to form a valid polygon',
      });
      return;
    }
    
    // Check maximum boundary points (prevent overly complex boundaries)
    if (coordinates.length > 100) {
      res.status(400).json({
        success: false,
        message: 'Boundary cannot have more than 100 points',
      });
      return;
    }
    
    // Validate area constraints (in square meters)
    const MIN_AREA = 20; // 20 sqm minimum
    const MAX_AREA = 50000; // 50,000 sqm maximum (5 hectares)
    
    if (area < MIN_AREA) {
      res.status(400).json({
        success: false,
        message: `Property area is too small. Minimum area is ${MIN_AREA} square meters`,
      });
      return;
    }
    
    if (area > MAX_AREA) {
      res.status(400).json({
        success: false,
        message: `Property area is too large. Maximum area is ${MAX_AREA} square meters`,
      });
      return;
    }
    
    // Check for duplicate consecutive points
    for (let i = 0; i < coordinates.length - 1; i++) {
      const curr = coordinates[i];
      const next = coordinates[i + 1];
      
      if (curr.lat === next.lat && curr.lng === next.lng) {
        res.status(400).json({
          success: false,
          message: 'Boundary contains duplicate consecutive points',
        });
        return;
      }
    }
    
    // Check if polygon is self-intersecting (basic check)
    // A more robust check would use a proper geometry library
    const isValidPolygon = validatePolygonShape(coordinates);
    if (!isValidPolygon) {
      res.status(400).json({
        success: false,
        message: 'Boundary forms an invalid or self-intersecting polygon',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating boundary quality:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating boundary quality',
    });
  }
};

// Helper function to validate polygon shape
function validatePolygonShape(
  coordinates: Array<{ lat: number; lng: number }>
): boolean {
  // Check if first and last points are the same (closed polygon)
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  
  // If not closed, automatically consider it valid (will be closed in processing)
  if (first.lat !== last.lat || first.lng !== last.lng) {
    return true;
  }
  
  // Basic validation - more complex validation would require geometry libraries
  return coordinates.length >= 4; // At least 3 unique points + closing point
}

// Validate completion image types coverage
export const validateImageCoverage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { completionImages } = req.body;
    
    if (!completionImages || completionImages.length < 3) {
      res.status(400).json({
        success: false,
        message: 'At least 3 completion images are required',
      });
      return;
    }
    
    // Check for reasonable image coverage
    const requiredTypes = ['exterior_front', 'boundary_marker'];
    const imageUrls = completionImages.map((img: string | { url: string }) => 
      typeof img === 'string' ? img : img.url
    );
    
    // Note: This is a basic check. In production, you might want to track image types
    if (completionImages.length < 5) {
      res.status(400).json({
        success: false,
        message: 'Please provide at least 5 images including exterior views and boundary markers',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating image coverage:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating image coverage',
    });
  }
};

// Validate job can be marked in progress
export const validateCanMarkInProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        status: true,
        assignedAgentId: true,
      },
    });
    
    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Marking job not found',
      });
      return;
    }
    
    if (job.assignedAgentId !== userId) {
      res.status(403).json({
        success: false,
        message: 'This job is not assigned to you',
      });
      return;
    }
    
    if (job.status !== 'ASSIGNED') {
      res.status(400).json({
        success: false,
        message: 'Job must be in ASSIGNED status to mark as in progress',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating job status:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating job status',
    });
  }
};

// Validate completion notes quality
export const validateCompletionNotes = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { completionNotes } = req.body;
    
    if (!completionNotes || completionNotes.trim().length < 20) {
      res.status(400).json({
        success: false,
        message: 'Completion notes must be at least 20 characters and provide meaningful details',
      });
      return;
    }
    
    // Check for suspicious patterns (all caps, excessive punctuation, etc.)
    const allCaps = completionNotes === completionNotes.toUpperCase();
    const excessivePunctuation = (completionNotes.match(/[!?.]{3,}/g) || []).length > 2;
    
    if (allCaps && completionNotes.length > 50) {
      res.status(400).json({
        success: false,
        message: 'Please provide completion notes in normal case (not all caps)',
      });
      return;
    }
    
    if (excessivePunctuation) {
      res.status(400).json({
        success: false,
        message: 'Please provide professional completion notes without excessive punctuation',
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Error validating completion notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating completion notes',
    });
  }
};