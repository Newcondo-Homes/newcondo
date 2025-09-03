// apps/platform/lib/validations/boundary.ts
import { z } from 'zod';

// Coordinate validation
export const coordinateSchema = z.object({
  lat: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .refine((val) => !isNaN(val), 'Latitude must be a valid number'),
  lng: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .refine((val) => !isNaN(val), 'Longitude must be a valid number'),
});

// Boundary point validation
export const boundaryPointSchema = coordinateSchema.extend({
  timestamp: z.date().optional(),
  order: z.number().int().min(0).optional(),
});

// Property boundary validation
export const propertyBoundarySchema = z.object({
  id: z.string().optional(),
  coordinates: z.array(boundaryPointSchema)
    .min(3, 'Property boundary must have at least 3 points')
    .max(20, 'Property boundary cannot have more than 20 points')
    .refine(
      (coords) => {
        // Check if boundary is closed (first and last points are close)
        if (coords.length < 3) return false;
        const first = coords[0];
        const last = coords[coords.length - 1];
        const distance = calculateDistance(first, last);
        return distance < 10; // Within 10 meters
      },
      'Boundary must form a closed polygon'
    )
    .refine(
      (coords) => {
        // Check for self-intersecting polygons
        return !hasSelfIntersection(coords);
      },
      'Boundary cannot intersect with itself'
    ),
  area: z.number()
    .min(10, 'Property area must be at least 10 square meters')
    .max(5000, 'Property area cannot exceed 5000 square meters'),
  center: coordinateSchema,
  isComplete: z.boolean(),
  propertyId: z.string().optional(),
  createdBy: z.string().optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.date().optional(),
});

// Boundary creation request
export const createBoundarySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  coordinates: z.array(boundaryPointSchema)
    .min(3, 'Boundary must have at least 3 points')
    .max(20, 'Boundary cannot have more than 20 points'),
  metadata: z.object({
    drawingDuration: z.number().optional(), // Time taken to draw in seconds
    mapZoomLevel: z.number().min(10).max(21).optional(),
    mapType: z.enum(['satellite', 'roadmap', 'hybrid']).optional(),
    userLocation: coordinateSchema.optional(),
    deviceType: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  }).optional(),
});

// Boundary update request
export const updateBoundarySchema = z.object({
  boundaryId: z.string().min(1, 'Boundary ID is required'),
  coordinates: z.array(boundaryPointSchema)
    .min(3, 'Boundary must have at least 3 points')
    .max(20, 'Boundary cannot have more than 20 points')
    .optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  rejectionReason: z.string().max(500, 'Rejection reason cannot exceed 500 characters').optional(),
});

// Duplicate detection request
export const duplicateDetectionSchema = z.object({
  coordinates: z.array(boundaryPointSchema)
    .min(3, 'Boundary must have at least 3 points'),
  propertyType: z.enum([
    'APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 
    'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE'
  ]).optional(),
  excludePropertyId: z.string().optional(), // Exclude specific property from duplicate check
  threshold: z.number().min(0).max(1).default(0.8), // Similarity threshold (0-1)
});

// Boundary dispute request
export const boundaryDisputeSchema = z.object({
  originalPropertyId: z.string().min(1, 'Original property ID is required'),
  disputedPropertyId: z.string().min(1, 'Disputed property ID is required'),
  reason: z.string()
    .min(10, 'Dispute reason must be at least 10 characters')
    .max(1000, 'Dispute reason cannot exceed 1000 characters'),
  evidence: z.array(z.string().url('Invalid evidence URL')).optional(),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
});

// Boundary validation result
export const boundaryValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  area: z.number(),
  perimeter: z.number(),
  center: coordinateSchema,
  boundingBox: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }),
  duplicateMatches: z.array(z.object({
    propertyId: z.string(),
    similarity: z.number().min(0).max(1),
    overlapArea: z.number(),
    overlapPercentage: z.number().min(0).max(100),
  })),
});

// GPS accuracy validation
export const gpsAccuracySchema = z.object({
  coordinates: coordinateSchema,
  accuracy: z.number().min(0), // Accuracy in meters
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  timestamp: z.date(),
});

// Map interaction validation
export const mapInteractionSchema = z.object({
  action: z.enum(['POINT_ADDED', 'POINT_REMOVED', 'BOUNDARY_COMPLETED', 'MAP_MOVED', 'ZOOM_CHANGED']),
  coordinates: coordinateSchema.optional(),
  pointIndex: z.number().int().min(0).optional(),
  zoomLevel: z.number().min(1).max(21).optional(),
  timestamp: z.date().default(() => new Date()),
});

// Nigeria-specific coordinate validation
export const nigeriaCoordinateSchema = coordinateSchema.refine(
  (coord) => {
    // Nigeria's approximate bounding box
    const nigeriaBounds = {
      north: 13.9,
      south: 4.3,
      east: 14.7,
      west: 2.7,
    };
    
    return (
      coord.lat >= nigeriaBounds.south &&
      coord.lat <= nigeriaBounds.north &&
      coord.lng >= nigeriaBounds.west &&
      coord.lng <= nigeriaBounds.east
    );
  },
  'Coordinates must be within Nigeria'
);

// Export types inferred from schemas
export type Coordinate = z.infer<typeof coordinateSchema>;
export type BoundaryPoint = z.infer<typeof boundaryPointSchema>;
export type PropertyBoundary = z.infer<typeof propertyBoundarySchema>;
export type CreateBoundaryRequest = z.infer<typeof createBoundarySchema>;
export type UpdateBoundaryRequest = z.infer<typeof updateBoundarySchema>;
export type DuplicateDetectionRequest = z.infer<typeof duplicateDetectionSchema>;
export type BoundaryDisputeRequest = z.infer<typeof boundaryDisputeSchema>;
export type BoundaryValidationResult = z.infer<typeof boundaryValidationResultSchema>;
export type GPSAccuracy = z.infer<typeof gpsAccuracySchema>;
export type MapInteraction = z.infer<typeof mapInteractionSchema>;

// Helper functions for validation
function calculateDistance(point1: Coordinate, point2: Coordinate): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Check for self-intersecting polygons using ray casting algorithm
function hasSelfIntersection(points: BoundaryPoint[]): boolean {
  if (points.length < 4) return false;

  for (let i = 0; i < points.length; i++) {
    const line1Start = points[i];
    const line1End = points[(i + 1) % points.length];

    for (let j = i + 2; j < points.length; j++) {
      if (j === points.length - 1 && i === 0) continue; // Skip adjacent lines

      const line2Start = points[j];
      const line2End = points[(j + 1) % points.length];

      if (doLinesIntersect(line1Start, line1End, line2Start, line2End)) {
        return true;
      }
    }
  }

  return false;
}

// Check if two line segments intersect
function doLinesIntersect(
  p1: Coordinate, 
  q1: Coordinate, 
  p2: Coordinate, 
  q2: Coordinate
): boolean {
  const orientation = (p: Coordinate, q: Coordinate, r: Coordinate): number => {
    const val = (q.lng - p.lng) * (r.lat - q.lat) - (q.lat - p.lat) * (r.lng - q.lng);
    if (val === 0) return 0; // Collinear
    return val > 0 ? 1 : 2; // Clockwise or Counterclockwise
  };

  const onSegment = (p: Coordinate, q: Coordinate, r: Coordinate): boolean => {
    return (
      q.lng <= Math.max(p.lng, r.lng) &&
      q.lng >= Math.min(p.lng, r.lng) &&
      q.lat <= Math.max(p.lat, r.lat) &&
      q.lat >= Math.min(p.lat, r.lat)
    );
  };

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) return true;

  // Special cases for collinear points
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}