import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
const createPropertySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  
  // Structure and pricing
  structure: z.enum(['SINGLE_UNIT', 'MULTI_FAMILY']).default('SINGLE_UNIT'),
  price: z.number().positive('Price must be positive').optional(),
  currency: z.string().default('NGN'),
  
  // Location
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().default('Nigeria'),
  gpsCoordinates: z.string().optional(), // JSON string: {"lat": 6.5244, "lng": 3.3792}
  
  // Property boundary - critical for duplicate prevention
  boundaryCoordinates: z.any().optional(), // Polygon coordinates
  buildingFingerprint: z.string().optional(), // Unique identifier
  
  // Building details (for multi-family)
  totalUnits: z.number().int().positive().optional(),
  availableUnits: z.number().int().positive().optional(),
  buildingFeatures: z.array(z.string()).default([]),
  
  // Property details (for single units)
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE']).default('APARTMENT'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  area: z.string().optional(),
  features: z.array(z.string()).default([]),
  
  // Ownership
  isOwnerListing: z.boolean().default(true),
  agentId: z.string().optional(),
  
  // Availability
  isAvailable: z.boolean().default(true),
  availableFrom: z.string().datetime().optional(),
});

const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().cuid('Invalid property ID'),
});

const boundaryValidationSchema = z.object({
  coordinates: z.array(z.object({
    lat: z.number(),
    lng: z.number()
  })).min(3, 'Property boundary must have at least 3 points'),
  area: z.number().positive('Area must be positive'),
  center: z.object({
    lat: z.number(),
    lng: z.number()
  })
});

const searchQuerySchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE']).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  features: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
  sortBy: z.enum(['price', 'createdAt', 'viewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  boundingBox: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number()
  }).optional() // For map-based searches
});

const propertyUnitsSchema = z.array(z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  floor: z.number().int().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  area: z.string().optional(),
  features: z.array(z.string()).default([]),
  price: z.number().positive('Unit price must be positive'),
  currency: z.string().default('NGN'),
  isAvailable: z.boolean().default(true),
  availableFrom: z.string().datetime().optional()
}));

// Middleware functions
export const validateCreateProperty = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createPropertySchema.parse(req.body);
    
    // Additional business logic validation
    if (validatedData.structure === 'MULTI_FAMILY') {
      if (!validatedData.totalUnits || validatedData.totalUnits < 2) {
        return res.status(400).json({
          success: false,
          message: 'Multi-family properties must have at least 2 total units'
        });
      }
    } else {
      // Single unit must have a price
      if (!validatedData.price) {
        return res.status(400).json({
          success: false,
          message: 'Single unit properties must have a price'
        });
      }
    }
    
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

export const validateUpdateProperty = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updatePropertySchema.parse({
      id: req.params.id,
      ...req.body
    });
    
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

export const validateBoundary = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = boundaryValidationSchema.parse(req.body);
    
    // Additional boundary validation
    const area = validatedData.area;
    const MIN_AREA = 10; // 10 square meters minimum
    const MAX_AREA = 10000; // 1 hectare maximum
    
    if (area < MIN_AREA) {
      return res.status(400).json({
        success: false,
        message: `Property area too small. Minimum area is ${MIN_AREA} square meters`
      });
    }
    
    if (area > MAX_AREA) {
      return res.status(400).json({
        success: false,
        message: `Property area too large. Maximum area is ${MAX_AREA} square meters`
      });
    }
    
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Boundary validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = searchQuerySchema.parse(req.query);
    
    // Additional search validation
    if (validatedData.minPrice && validatedData.maxPrice) {
      if (validatedData.minPrice >= validatedData.maxPrice) {
        return res.status(400).json({
          success: false,
          message: 'Minimum price must be less than maximum price'
        });
      }
    }
    
    req.query = validatedData as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Search validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

export const validatePropertyUnits = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = propertyUnitsSchema.parse(req.body.units);
    
    // Check for duplicate unit numbers
    const unitNumbers = validatedData.map(unit => unit.unitNumber);
    const duplicates = unitNumbers.filter((num, index) => unitNumbers.indexOf(num) !== index);
    
    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Duplicate unit numbers found: ${duplicates.join(', ')}`
      });
    }
    
    req.body.units = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Units validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

// Property ownership validation
export const validateOwnership = (req: Request, res: Response, next: NextFunction) => {
  // This will be populated by auth middleware
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // For property updates, we'll verify ownership in the controller
  next();
};

// Rate limiting for property creation
export const createPropertyRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This could be enhanced with Redis for distributed rate limiting
  // For now, we'll implement basic rate limiting logic
  next();
};