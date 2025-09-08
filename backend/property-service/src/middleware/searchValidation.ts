import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PropertyType } from '@newcondo/db';

// Search query validation schema
const searchQuerySchema = z.object({
  query: z.string().optional().transform(val => val?.trim()),
  page: z.string().optional().transform(val => {
    const num = parseInt(val || '1', 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }),
  limit: z.string().optional().transform(val => {
    const num = parseInt(val || '12', 10);
    return isNaN(num) || num < 1 ? 12 : Math.min(num, 50); // Max 50 items per page
  }),
  sortBy: z.enum(['price_asc', 'price_desc', 'created_desc', 'created_asc', 'relevance']).optional().default('created_desc'),
  
  // Location filters
  city: z.string().optional().transform(val => val?.trim()),
  state: z.string().optional().transform(val => val?.trim()),
  country: z.string().optional().default('Nigeria'),
  
  // Property type filters
  propertyType: z.enum([
    PropertyType.APARTMENT,
    PropertyType.HOUSE,
    PropertyType.DUPLEX,
    PropertyType.ROOM,
    PropertyType.SHARED_APARTMENT,
    PropertyType.OFFICE,
    PropertyType.SHOP,
    PropertyType.WAREHOUSE
  ]).optional(),
  
  // Price filters
  minPrice: z.string().optional().transform(val => {
    const num = parseFloat(val || '0');
    return isNaN(num) || num < 0 ? undefined : num;
  }),
  maxPrice: z.string().optional().transform(val => {
    const num = parseFloat(val || '0');
    return isNaN(num) || num < 0 ? undefined : num;
  }),
  
  // Property details filters
  minBedrooms: z.string().optional().transform(val => {
    const num = parseInt(val || '0', 10);
    return isNaN(num) || num < 0 ? undefined : num;
  }),
  maxBedrooms: z.string().optional().transform(val => {
    const num = parseInt(val || '0', 10);
    return isNaN(num) || num < 0 ? undefined : num;
  }),
  minBathrooms: z.string().optional().transform(val => {
    const num = parseInt(val || '0', 10);
    return isNaN(num) || num < 0 ? undefined : num;
  }),
  maxBathrooms: z.string().optional().transform(val => {
    const num = parseInt(val || '0', 10);
    return isNaN(num) || num < 0 ? undefined : num;
  }),
  
  // Features filter (comma-separated string)
  features: z.string().optional().transform(val => {
    if (!val?.trim()) return undefined;
    return val.split(',').map(f => f.trim()).filter(f => f.length > 0);
  }),
  
  // Structure filter
  structure: z.enum(['SINGLE_UNIT', 'MULTI_FAMILY']).optional(),
  
  // Availability filter
  isAvailable: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  
  // Date filters
  availableFrom: z.string().optional().transform(val => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  }),
  
  // Geo-location search
  lat: z.string().optional().transform(val => {
    const num = parseFloat(val || '0');
    return isNaN(num) ? undefined : num;
  }),
  lng: z.string().optional().transform(val => {
    const num = parseFloat(val || '0');
    return isNaN(num) ? undefined : num;
  }),
  radius: z.string().optional().transform(val => {
    const num = parseFloat(val || '10');
    return isNaN(num) || num <= 0 ? 10 : Math.min(num, 100); // Max 100km radius
  }),
  
  // Admin filters (for admin users only)
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'RENTED', 'UNAVAILABLE']).optional(),
  adminApprovalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  boundaryVerified: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  })
});

// Property details validation schema
const propertyDetailsSchema = z.object({
  id: z.string().min(1, 'Property ID is required')
});

// Favorite validation schema
const favoriteSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required')
});

// Compare properties validation schema
const comparePropertiesSchema = z.object({
  propertyIds: z.string().transform(val => {
    const ids = val.split(',').map(id => id.trim()).filter(id => id.length > 0);
    if (ids.length < 2) throw new Error('At least 2 properties required for comparison');
    if (ids.length > 4) throw new Error('Maximum 4 properties can be compared');
    return ids;
  })
});

// Middleware factory for validation
const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = searchQuerySchema.parse(req.query);
    
    // Additional validation logic
    if (validated.minPrice && validated.maxPrice && validated.minPrice > validated.maxPrice) {
      return res.status(400).json({
        success: false,
        error: 'Minimum price cannot be greater than maximum price'
      });
    }
    
    if (validated.minBedrooms && validated.maxBedrooms && validated.minBedrooms > validated.maxBedrooms) {
      return res.status(400).json({
        success: false,
        error: 'Minimum bedrooms cannot be greater than maximum bedrooms'
      });
    }
    
    if (validated.minBathrooms && validated.maxBathrooms && validated.minBathrooms > validated.maxBathrooms) {
      return res.status(400).json({
        success: false,
        error: 'Minimum bathrooms cannot be greater than maximum bathrooms'
      });
    }
    
    // Check if geo-location search is valid
    if ((validated.lat || validated.lng) && !(validated.lat && validated.lng)) {
      return res.status(400).json({
        success: false,
        error: 'Both latitude and longitude are required for location-based search'
      });
    }
    
    // Attach validated query to request
    req.validatedQuery = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid search parameters'
    });
  }
};

const validatePropertyDetails = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = propertyDetailsSchema.parse(req.params);
    req.validatedParams = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID',
        details: error.errors
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Invalid property ID'
    });
  }
};

const validateFavorite = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = favoriteSchema.parse(req.body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid favorite data',
        details: error.errors
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Invalid favorite data'
    });
  }
};

const validateCompareProperties = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = comparePropertiesSchema.parse(req.query);
    req.validatedQuery = validated;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid comparison data'
    });
  }
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
      validatedParams?: any;
      validatedBody?: any;
    }
  }
}

export {
  validateSearchQuery,
  validatePropertyDetails,
  validateFavorite,
  validateCompareProperties
};