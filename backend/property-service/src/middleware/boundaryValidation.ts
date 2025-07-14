// backend/property-service/src/middleware/boundaryValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BoundaryErrorCode } from '../types/boundary';

const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const boundaryMarkingSchema = z.object({
  propertyId: z.string().cuid(),
  coordinates: z.array(coordinateSchema).min(3).max(50), // Minimum 3 points for polygon, max 50 for performance
  userLocation: coordinateSchema,
  mapZoomLevel: z.number().min(1).max(22),
  markingTimestamp: z.string().datetime(),
  boundaryImages: z.array(z.string().url()).optional(),
  markingNotes: z.string().max(1000).optional()
});

const boundaryValidationSchema = z.object({
  coordinates: z.array(coordinateSchema).min(3).max(50),
  propertyId: z.string().cuid().optional(),
  excludePropertyIds: z.array(z.string().cuid()).optional()
});

const boundarySearchSchema = z.object({
  centerPoint: coordinateSchema,
  radius: z.number().min(10).max(5000), // 10m to 5km radius
  excludePropertyIds: z.array(z.string().cuid()).optional(),
  includeUnverified: z.boolean().optional(),
  minArea: z.number().min(1).optional(),
  maxArea: z.number().max(100000).optional() // Max 10 hectares
});

const duplicateCheckSchema = z.object({
  coordinates: z.array(coordinateSchema).min(3).max(50),
  propertyId: z.string().cuid().optional(),
  threshold: z.number().min(0).max(1).optional() // Similarity threshold
});

export const validateBoundaryRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = boundaryMarkingSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid boundary marking request',
        details: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Additional validation for polygon shape
    const { coordinates } = result.data;
    
    // Check if polygon is closed (first and last points should be the same or very close)
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const isClosedPolygon = Math.abs(first.lat - last.lat) < 0.0001 && 
                           Math.abs(first.lng - last.lng) < 0.0001;
    
    if (!isClosedPolygon) {
      coordinates.push(first); // Auto-close the polygon
    }

    // Check for self-intersecting polygon
    if (isSelfIntersecting(coordinates)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid polygon shape',
        code: BoundaryErrorCode.SELF_INTERSECTING,
        message: 'Polygon boundaries cannot intersect themselves'
      });
    }

    // Calculate area and validate size
    const area = calculatePolygonArea(coordinates);
    const minArea = 20; // 20 square meters minimum
    const maxArea = 50000; // 5 hectares maximum
    
    if (area < minArea) {
      return res.status(400).json({
        success: false,
        error: 'Property area too small',
        code: BoundaryErrorCode.TOO_SMALL,
        message: `Property area must be at least ${minArea} square meters`
      });
    }
    
    if (area > maxArea) {
      return res.status(400).json({
        success: false,
        error: 'Property area too large',
        code: BoundaryErrorCode.TOO_LARGE,
        message: `Property area cannot exceed ${maxArea} square meters`
      });
    }

    // Add calculated area to request
    req.body.calculatedArea = area;
    req.body.coordinates = coordinates; // Use the potentially modified coordinates
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Boundary validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const validateBoundaryValidation = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = boundaryValidationSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid boundary validation request',
        details: result.error.errors
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Boundary validation middleware failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const validateBoundarySearch = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = boundarySearchSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid boundary search request',
        details: result.error.errors
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Boundary search validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const validateDuplicateCheck = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = duplicateCheckSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid duplicate check request',
        details: result.error.errors
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Duplicate check validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to check if polygon is self-intersecting
function isSelfIntersecting(coordinates: Array<{lat: number, lng: number}>): boolean {
  const n = coordinates.length;
  if (n < 4) return false;
  
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      if (i === 0 && j === n - 2) continue; // Skip adjacent edges
      
      const line1 = {
        start: coordinates[i],
        end: coordinates[i + 1]
      };
      const line2 = {
        start: coordinates[j],
        end: coordinates[j + 1]
      };
      
      if (doLinesIntersect(line1, line2)) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper function to check if two line segments intersect
function doLinesIntersect(
  line1: {start: {lat: number, lng: number}, end: {lat: number, lng: number}},
  line2: {start: {lat: number, lng: number}, end: {lat: number, lng: number}}
): boolean {
  const {start: p1, end: q1} = line1;
  const {start: p2, end: q2} = line2;
  
  const orientation = (p: {lat: number, lng: number}, q: {lat: number, lng: number}, r: {lat: number, lng: number}) => {
    const val = (q.lng - p.lng) * (r.lat - q.lat) - (q.lat - p.lat) * (r.lng - q.lng);
    if (val === 0) return 0;
    return val > 0 ? 1 : 2;
  };
  
  const onSegment = (p: {lat: number, lng: number}, q: {lat: number, lng: number}, r: {lat: number, lng: number}) => {
    return q.lat <= Math.max(p.lat, r.lat) && q.lat >= Math.min(p.lat, r.lat) &&
           q.lng <= Math.max(p.lng, r.lng) && q.lng >= Math.min(p.lng, r.lng);
  };
  
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);
  
  if (o1 !== o2 && o3 !== o4) return true;
  
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  
  return false;
}

// Helper function to calculate polygon area using shoelace formula
function calculatePolygonArea(coordinates: Array<{lat: number, lng: number}>): number {
  const n = coordinates.length;
  if (n < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from degrees to square meters (approximate)
  // This is a rough approximation - for production, use proper geospatial libraries
  const metersPerDegree = 111000; // Approximate meters per degree at equator
  return area * metersPerDegree * metersPerDegree;
}