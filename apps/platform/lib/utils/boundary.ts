/**
 * Boundary processing utilities for property marking
 * Handles polygon operations, boundary validation, and overlap detection
 */

import { Coordinates } from './geolocation';

export interface BoundaryPolygon {
  coordinates: Coordinates[];
  area?: number; // in square meters
  perimeter?: number; // in meters
}

export interface BoundingRect {
  topLeft: Coordinates;
  topRight: Coordinates;
  bottomLeft: Coordinates;
  bottomRight: Coordinates;
}

export interface BoundaryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  area?: number;
  perimeter?: number;
}

/**
 * Validate property boundary polygon
 */
export const validateBoundary = (
  polygon: BoundaryPolygon,
  propertyType: string = 'APARTMENT'
): BoundaryValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum number of points
  if (polygon.coordinates.length < 3) {
    errors.push('Boundary must have at least 3 points');
  }

  // Check maximum number of points
  if (polygon.coordinates.length > 50) {
    errors.push('Boundary cannot have more than 50 points');
  }

  // Validate each coordinate
  polygon.coordinates.forEach((coord, index) => {
    if (!isValidCoordinate(coord)) {
      errors.push(`Invalid coordinate at point ${index + 1}`);
    }
  });

  // Check if polygon is closed (first and last points should be the same or very close)
  if (polygon.coordinates.length >= 3) {
    const first = polygon.coordinates[0];
    const last = polygon.coordinates[polygon.coordinates.length - 1];
    const distance = calculatePointDistance(first, last);

    if (distance > 0.000001) { // About 0.1 meters
      warnings.push('Polygon should be closed (first and last points should match)');
    }
  }

  // Calculate area and validate size limits
  const area = calculatePolygonArea(polygon);
  const areaLimits = getAreaLimits(propertyType);

  if (area < areaLimits.min) {
    errors.push(`Property boundary too small. Minimum area: ${areaLimits.min}m²`);
  }

  if (area > areaLimits.max) {
    errors.push(`Property boundary too large. Maximum area: ${areaLimits.max}m²`);
  }

  // Check for self-intersecting polygon
  if (isPolygonSelfIntersecting(polygon.coordinates)) {
    errors.push('Boundary cannot cross itself');
  }

  // Calculate perimeter
  const perimeter = calculatePolygonPerimeter(polygon);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    area,
    perimeter
  };
};

/**
 * Check if two polygons overlap
 */
export const doPolygonsOverlap = (
  polygon1: BoundaryPolygon,
  polygon2: BoundaryPolygon
): boolean => {
  // Use SAT (Separating Axis Theorem) for polygon overlap detection
  return (
    isPolygonInsidePolygon(polygon1, polygon2) ||
    isPolygonInsidePolygon(polygon2, polygon1) ||
    doPolygonEdgesIntersect(polygon1.coordinates, polygon2.coordinates)
  );
};

/**
 * Calculate polygon area using Shoelace formula
 */
export const calculatePolygonArea = (polygon: BoundaryPolygon): number => {
  const coords = polygon.coordinates;
  if (coords.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].lat * coords[j].lng;
    area -= coords[j].lat * coords[i].lng;
  }

  // Convert to square meters (approximate)
  const areaInDegrees = Math.abs(area) / 2;
  const metersPerDegree = 111320; // Approximate at equator
  return areaInDegrees * metersPerDegree * metersPerDegree;
};

/**
 * Calculate polygon perimeter
 */
export const calculatePolygonPerimeter = (polygon: BoundaryPolygon): number => {
  const coords = polygon.coordinates;
  if (coords.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const next = (i + 1) % coords.length;
    perimeter += calculatePointDistance(coords[i], coords[next]) * 111320; // Convert to meters
  }

  return perimeter;
};

/**
 * Calculate distance between two points in degrees
 */
const calculatePointDistance = (point1: Coordinates, point2: Coordinates): number => {
  const latDiff = point2.lat - point1.lat;
  const lngDiff = point2.lng - point1.lng;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
};

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export const isPointInPolygon = (
  point: Coordinates,
  polygon: Coordinates[]
): boolean => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      ((polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)) &&
      (point.lng < (polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat) /
        (polygon[j].lat - polygon[i].lat) + polygon[i].lng)
    ) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Check if one polygon is completely inside another
 */
const isPolygonInsidePolygon = (
  innerPolygon: BoundaryPolygon,
  outerPolygon: BoundaryPolygon
): boolean => {
  return innerPolygon.coordinates.every(point =>
    isPointInPolygon(point, outerPolygon.coordinates)
  );
};

/**
 * Check if polygon edges intersect
 */
const doPolygonEdgesIntersect = (
  polygon1: Coordinates[],
  polygon2: Coordinates[]
): boolean => {
  for (let i = 0; i < polygon1.length; i++) {
    const p1 = polygon1[i];
    const p2 = polygon1[(i + 1) % polygon1.length];

    for (let j = 0; j < polygon2.length; j++) {
      const p3 = polygon2[j];
      const p4 = polygon2[(j + 1) % polygon2.length];

      if (doLineSegmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Check if two line segments intersect
 */
const doLineSegmentsIntersect = (
  p1: Coordinates,
  p2: Coordinates,
  p3: Coordinates,
  p4: Coordinates
): boolean => {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
};

/**
 * Calculate direction for line segment intersection
 */
const direction = (pi: Coordinates, pj: Coordinates, pk: Coordinates): number => {
  return (pk.lat - pi.lat) * (pj.lng - pi.lng) - (pj.lat - pi.lat) * (pk.lng - pi.lng);
};

/**
 * Check if polygon is self-intersecting
 */
const isPolygonSelfIntersecting = (coordinates: Coordinates[]): boolean => {
  if (coordinates.length < 4) return false;

  for (let i = 0; i < coordinates.length; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % coordinates.length];

    for (let j = i + 2; j < coordinates.length; j++) {
      if (j === coordinates.length - 1 && i === 0) continue; // Skip last-to-first edge

      const p3 = coordinates[j];
      const p4 = coordinates[(j + 1) % coordinates.length];

      if (doLineSegmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Validate individual coordinate
 */
const isValidCoordinate = (coord: Coordinates): boolean => {
  return (
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    !isNaN(coord.lat) &&
    !isNaN(coord.lng) &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  );
};

/**
 * Get area limits based on property type (in square meters)
 */
const getAreaLimits = (propertyType: string): { min: number; max: number } => {
  const limits = {
    ROOM: { min: 9, max: 50 }, // 9-50 sqm
    APARTMENT: { min: 25, max: 300 }, // 25-300 sqm
    SHARED_APARTMENT: { min: 50, max: 500 }, // 50-500 sqm
    HOUSE: { min: 80, max: 1000 }, // 80-1000 sqm
    DUPLEX: { min: 120, max: 1500 }, // 120-1500 sqm
    OFFICE: { min: 20, max: 2000 }, // 20-2000 sqm
    SHOP: { min: 10, max: 500 }, // 10-500 sqm
    WAREHOUSE: { min: 100, max: 10000 } // 100-10000 sqm
  };

  return limits[propertyType as keyof typeof limits] || limits.APARTMENT;
};

/**
 * Simplify polygon using Douglas-Peucker algorithm
 */
export const simplifyPolygon = (
  coordinates: Coordinates[],
  tolerance: number = 0.00001
): Coordinates[] => {
  if (coordinates.length <= 2) return coordinates;

  return douglasPeucker(coordinates, tolerance);
};

/**
 * Douglas-Peucker line simplification algorithm
 */
const douglasPeucker = (
  points: Coordinates[],
  tolerance: number
): Coordinates[] => {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);

    return [...left.slice(0, -1), ...right];
  } else {
    return [points[0], points[points.length - 1]];
  }
};

/**
 * Calculate perpendicular distance from point to line
 */
const perpendicularDistance = (
  point: Coordinates,
  lineStart: Coordinates,
  lineEnd: Coordinates
): number => {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return Math.sqrt(A * A + B * B);

  const param = dot / lenSq;

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }

  const dx = point.lat - xx;
  const dy = point.lng - yy;

  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Convert rectangle bounds to polygon coordinates
 */
export const rectangleToPolygon = (bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): BoundaryPolygon => {
  return {
    coordinates: [
      { lat: bounds.north, lng: bounds.west }, // Top-left
      { lat: bounds.north, lng: bounds.east }, // Top-right
      { lat: bounds.south, lng: bounds.east }, // Bottom-right
      { lat: bounds.south, lng: bounds.west }, // Bottom-left
      { lat: bounds.north, lng: bounds.west }  // Close polygon
    ]
  };
};

/**
 * Get bounding rectangle from polygon
 */
export const getPolygonBounds = (polygon: BoundaryPolygon): {
  north: number;
  south: number;
  east: number;
  west: number;
} => {
  if (polygon.coordinates.length === 0) {
    throw new Error('Cannot get bounds of empty polygon');
  }

  let north = -90, south = 90, east = -180, west = 180;

  polygon.coordinates.forEach(coord => {
    if (coord.lat > north) north = coord.lat;
    if (coord.lat < south) south = coord.lat;
    if (coord.lng > east) east = coord.lng;
    if (coord.lng < west) west = coord.lng;
  });

  return { north, south, east, west };
};

/**
 * Calculate polygon centroid
 */
export const getPolygonCenter = (polygon: BoundaryPolygon): Coordinates => {
  if (polygon.coordinates.length === 0) {
    throw new Error('Cannot calculate center of empty polygon');
  }

  let totalLat = 0;
  let totalLng = 0;
  let totalArea = 0;

  for (let i = 0; i < polygon.coordinates.length - 1; i++) {
    const curr = polygon.coordinates[i];
    const next = polygon.coordinates[i + 1];

    const a = curr.lat * next.lng - next.lat * curr.lng;
    totalArea += a;
    totalLat += (curr.lat + next.lat) * a;
    totalLng += (curr.lng + next.lng) * a;
  }

  totalArea /= 2;

  if (totalArea === 0) {
    // Fallback to simple average for degenerate cases
    const avgLat = polygon.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / polygon.coordinates.length;
    const avgLng = polygon.coordinates.reduce((sum, coord) => sum + coord.lng, 0) / polygon.coordinates.length;
    return { lat: avgLat, lng: avgLng };
  }

  return {
    lat: totalLat / (6 * totalArea),
    lng: totalLng / (6 * totalArea)
  };
};

/**
 * Check if polygon contains a point
 */
export const isPointInBoundary = (
  point: Coordinates,
  boundary: BoundaryPolygon
): boolean => {
  return isPointInPolygon(point, boundary.coordinates);
};



/**
* Buffer polygon by a specified distance (simplified version)
*/
export const bufferPolygon = (
  polygon: BoundaryPolygon,
  bufferMeters: number
): BoundaryPolygon => {
  // Simple buffer implementation - expand each point outward from centroid
  const center = getPolygonCenter(polygon);
  const bufferDegrees = bufferMeters / 111320; // Approx conversion meters→degrees


  const bufferedCoords = polygon.coordinates.map(coord => {
    const latDiff = coord.lat - center.lat;
    const lngDiff = coord.lng - center.lng;
    const length = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);


    if (length === 0) {
      // If the point is at the center, just move it north by buffer distance
      return {
        lat: coord.lat + bufferDegrees,
        lng: coord.lng,
      };
    }


    const scale = (length + bufferDegrees) / length;
    return {
      lat: center.lat + latDiff * scale,
      lng: center.lng + lngDiff * scale,
    };
  });


  // Close polygon if not already closed
  if (
    bufferedCoords.length > 0 &&
    (bufferedCoords[0].lat !== bufferedCoords[bufferedCoords.length - 1].lat ||
      bufferedCoords[0].lng !== bufferedCoords[bufferedCoords.length - 1].lng)
  ) {
    bufferedCoords.push(bufferedCoords[0]);
  }


  return {
    coordinates: bufferedCoords,
    area: calculatePolygonArea({ coordinates: bufferedCoords }),
    perimeter: calculatePolygonPerimeter({ coordinates: bufferedCoords }),
  };
};