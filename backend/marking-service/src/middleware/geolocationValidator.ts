// backend/shared/src/middleware/geolocationValidator.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Interface for GPS coordinates
 */
export interface GPSCoordinates {
  lat: number;
  lng: number;
}

/**
 * Interface for boundary polygon coordinates
 */
export interface BoundaryPolygon {
  coordinates: GPSCoordinates[];
}

/**
 * Validation options for geolocation
 */
export interface GeolocationValidationOptions {
  requireBoundary?: boolean;
  minBoundaryPoints?: number;
  maxBoundaryPoints?: number;
  allowedCountries?: string[];
  maxBoundaryArea?: number; // in square meters
  minBoundaryArea?: number; // in square meters
}

/**
 * Nigerian geographic boundaries
 */
const NIGERIA_BOUNDS = {
  minLat: 4.0, // Southern boundary
  maxLat: 14.0, // Northern boundary
  minLng: 2.5, // Western boundary
  maxLng: 15.0, // Eastern boundary
};

/**
 * Validates if coordinates are within Nigeria
 */
export const isWithinNigeria = (lat: number, lng: number): boolean => {
  return (
    lat >= NIGERIA_BOUNDS.minLat &&
    lat <= NIGERIA_BOUNDS.maxLat &&
    lng >= NIGERIA_BOUNDS.minLng &&
    lng <= NIGERIA_BOUNDS.maxLng
  );
};

/**
 * Validates GPS coordinate format and values
 */
export const validateCoordinates = (lat: number, lng: number): {
  valid: boolean;
  error?: string;
} => {
  // Check if values are numbers
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }

  // Check if values are finite
  if (!isFinite(lat) || !isFinite(lng)) {
    return { valid: false, error: 'Coordinates must be finite numbers' };
  }

  // Check latitude range (-90 to 90)
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  // Check longitude range (-180 to 180)
  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  // Check if coordinates are within Nigeria
  if (!isWithinNigeria(lat, lng)) {
    return {
      valid: false,
      error: 'Coordinates must be within Nigeria boundaries',
    };
  }

  return { valid: true };
};

/**
 * Calculates the area of a polygon using the Shoelace formula
 * @param coordinates Array of GPS coordinates forming a polygon
 * @returns Area in square meters (approximate)
 */
export const calculatePolygonArea = (
  coordinates: GPSCoordinates[]
): number => {
  if (coordinates.length < 3) {
    return 0;
  }

  // Earth's radius in meters
  const EARTH_RADIUS = 6371000;

  // Convert to radians and calculate area using Shoelace formula
  let area = 0;
  const numPoints = coordinates.length;

  for (let i = 0; i < numPoints; i++) {
    const j = (i + 1) % numPoints;
    const xi = (coordinates[i].lng * Math.PI) / 180;
    const yi = (coordinates[i].lat * Math.PI) / 180;
    const xj = (coordinates[j].lng * Math.PI) / 180;
    const yj = (coordinates[j].lat * Math.PI) / 180;

    area += xi * Math.sin(yj) - xj * Math.sin(yi);
  }

  area = Math.abs(area * EARTH_RADIUS * EARTH_RADIUS) / 2;

  return area;
};

/**
 * Validates boundary polygon
 */
export const validateBoundary = (
  boundary: BoundaryPolygon,
  options: GeolocationValidationOptions = {}
): {
  valid: boolean;
  error?: string;
  area?: number;
} => {
  const {
    minBoundaryPoints = 3,
    maxBoundaryPoints = 100,
    maxBoundaryArea = 10000, // 10,000 sq meters (1 hectare) default
    minBoundaryArea = 20, // 20 sq meters minimum
  } = options;

  // Check if boundary exists
  if (!boundary || !boundary.coordinates || !Array.isArray(boundary.coordinates)) {
    return { valid: false, error: 'Invalid boundary format' };
  }

  // Check minimum points
  if (boundary.coordinates.length < minBoundaryPoints) {
    return {
      valid: false,
      error: `Boundary must have at least ${minBoundaryPoints} points`,
    };
  }

  // Check maximum points
  if (boundary.coordinates.length > maxBoundaryPoints) {
    return {
      valid: false,
      error: `Boundary cannot have more than ${maxBoundaryPoints} points`,
    };
  }

  // Validate each coordinate
  for (let i = 0; i < boundary.coordinates.length; i++) {
    const coord = boundary.coordinates[i];

    if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
      return {
        valid: false,
        error: `Invalid coordinate at index ${i}`,
      };
    }

    const validation = validateCoordinates(coord.lat, coord.lng);
    if (!validation.valid) {
      return {
        valid: false,
        error: `Coordinate at index ${i}: ${validation.error}`,
      };
    }
  }

  // Check if polygon is closed (first and last points should be the same or very close)
  const firstPoint = boundary.coordinates[0];
  const lastPoint = boundary.coordinates[boundary.coordinates.length - 1];
  const isClosed =
    Math.abs(firstPoint.lat - lastPoint.lat) < 0.00001 &&
    Math.abs(firstPoint.lng - lastPoint.lng) < 0.00001;

  if (!isClosed) {
    return {
      valid: false,
      error: 'Boundary polygon must be closed (first and last points must match)',
    };
  }

  // Calculate area
  const area = calculatePolygonArea(boundary.coordinates);

  // Check minimum area
  if (area < minBoundaryArea) {
    return {
      valid: false,
      error: `Boundary area (${area.toFixed(2)} sq m) is too small. Minimum: ${minBoundaryArea} sq m`,
      area,
    };
  }

  // Check maximum area
  if (area > maxBoundaryArea) {
    return {
      valid: false,
      error: `Boundary area (${area.toFixed(2)} sq m) is too large. Maximum: ${maxBoundaryArea} sq m`,
      area,
    };
  }

  return { valid: true, area };
};

/**
 * Calculates distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export const calculateDistance = (
  coord1: GPSCoordinates,
  coord2: GPSCoordinates
): number => {
  const EARTH_RADIUS = 6371000; // meters

  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
};

/**
 * Checks if a point is within a polygon using ray casting algorithm
 */
export const isPointInPolygon = (
  point: GPSCoordinates,
  polygon: GPSCoordinates[]
): boolean => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Middleware to validate GPS coordinates in request body
 */
export const validateGPSCoordinates = (
  options: GeolocationValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { gpsCoordinates, boundaryCoordinates } = req.body;

      // Validate main GPS coordinates if provided
      if (gpsCoordinates) {
        let coords: GPSCoordinates;

        // Parse if string
        if (typeof gpsCoordinates === 'string') {
          try {
            coords = JSON.parse(gpsCoordinates);
          } catch (error) {
            res.status(400).json({
              success: false,
              error: 'Invalid GPS coordinates format. Must be valid JSON.',
            });
            return;
          }
        } else {
          coords = gpsCoordinates;
        }

        // Validate coordinates
        const validation = validateCoordinates(coords.lat, coords.lng);
        if (!validation.valid) {
          res.status(400).json({
            success: false,
            error: validation.error,
          });
          return;
        }

        // Attach validated coordinates to request
        req.body.validatedGPSCoordinates = coords;
      }

      // Validate boundary coordinates if provided or required
      if (boundaryCoordinates || options.requireBoundary) {
        if (!boundaryCoordinates) {
          res.status(400).json({
            success: false,
            error: 'Boundary coordinates are required',
          });
          return;
        }

        let boundary: BoundaryPolygon;

        // Parse if string
        if (typeof boundaryCoordinates === 'string') {
          try {
            boundary = JSON.parse(boundaryCoordinates);
          } catch (error) {
            res.status(400).json({
              success: false,
              error: 'Invalid boundary coordinates format. Must be valid JSON.',
            });
            return;
          }
        } else {
          boundary = boundaryCoordinates;
        }

        // Validate boundary
        const boundaryValidation = validateBoundary(boundary, options);
        if (!boundaryValidation.valid) {
          res.status(400).json({
            success: false,
            error: boundaryValidation.error,
          });
          return;
        }

        // Attach validated boundary to request
        req.body.validatedBoundary = boundary;
        req.body.boundaryArea = boundaryValidation.area;
      }

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Geolocation validation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
};

/**
 * Middleware to validate agent proximity to property
 */
export const validateAgentProximity = (maxDistanceKm: number = 50) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { agentLocation, propertyLocation } = req.body;

      if (!agentLocation || !propertyLocation) {
        res.status(400).json({
          success: false,
          error: 'Agent and property locations are required',
        });
        return;
      }

      // Validate both coordinates
      const agentValidation = validateCoordinates(
        agentLocation.lat,
        agentLocation.lng
      );
      const propertyValidation = validateCoordinates(
        propertyLocation.lat,
        propertyLocation.lng
      );

      if (!agentValidation.valid) {
        res.status(400).json({
          success: false,
          error: `Invalid agent location: ${agentValidation.error}`,
        });
        return;
      }

      if (!propertyValidation.valid) {
        res.status(400).json({
          success: false,
          error: `Invalid property location: ${propertyValidation.error}`,
        });
        return;
      }

      // Calculate distance
      const distanceMeters = calculateDistance(agentLocation, propertyLocation);
      const distanceKm = distanceMeters / 1000;

      // Check if within allowed distance
      if (distanceKm > maxDistanceKm) {
        res.status(400).json({
          success: false,
          error: `Agent is too far from property. Distance: ${distanceKm.toFixed(2)}km, Maximum: ${maxDistanceKm}km`,
          distance: distanceKm,
        });
        return;
      }

      // Attach distance to request
      req.body.proximityDistance = distanceKm;

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Proximity validation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
};

export default {
  validateGPSCoordinates,
  validateAgentProximity,
  validateCoordinates,
  validateBoundary,
  calculateDistance,
  calculatePolygonArea,
  isPointInPolygon,
  isWithinNigeria,
};