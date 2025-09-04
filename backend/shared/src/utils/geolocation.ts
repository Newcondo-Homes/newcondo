import { BoundaryCoordinates, GeolocationPoint, PropertyMask, BoundaryValidationResult } from '../types/geolocation';
import { BOUNDARY_CONSTANTS } from '../constants/boundaries';

/**
 * Calculate the distance between two geographical points using Haversine formula
 * @param point1 First geographical point
 * @param point2 Second geographical point
 * @returns Distance in meters
 */
export function calculateDistance(point1: GeolocationPoint, point2: GeolocationPoint): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate the area of a polygon using the Shoelace formula
 * @param coordinates Array of boundary coordinates
 * @returns Area in square meters
 */
export function calculatePolygonArea(coordinates: BoundaryCoordinates[]): number {
  if (coordinates.length < 3) return 0;

  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].lng * coordinates[j].lat;
    area -= coordinates[j].lng * coordinates[i].lat;
  }

  // Convert to square meters (approximate)
  const degToMeter = 111320; // meters per degree at equator
  return Math.abs(area) / 2 * degToMeter * degToMeter;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point Point to check
 * @param polygon Array of polygon vertices
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(point: GeolocationPoint, polygon: BoundaryCoordinates[]): boolean {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if two polygons overlap
 * @param polygon1 First polygon
 * @param polygon2 Second polygon
 * @returns True if polygons overlap
 */
export function doPolygonsOverlap(polygon1: BoundaryCoordinates[], polygon2: BoundaryCoordinates[]): boolean {
  // Check if any vertex of polygon1 is inside polygon2
  for (const vertex of polygon1) {
    if (isPointInPolygon(vertex, polygon2)) {
      return true;
    }
  }

  // Check if any vertex of polygon2 is inside polygon1
  for (const vertex of polygon2) {
    if (isPointInPolygon(vertex, polygon1)) {
      return true;
    }
  }

  // TODO: Add edge intersection checks for more complex cases
  return false;
}

/**
 * Validate property boundary mask
 * @param mask Property mask to validate
 * @returns Validation result
 */
export function validateBoundaryMask(mask: PropertyMask): BoundaryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum number of coordinates
  if (mask.coordinates.length < BOUNDARY_CONSTANTS.MIN_BOUNDARY_POINTS) {
    errors.push(`Minimum ${BOUNDARY_CONSTANTS.MIN_BOUNDARY_POINTS} boundary points required`);
  }

  // Check maximum number of coordinates
  if (mask.coordinates.length > BOUNDARY_CONSTANTS.MAX_BOUNDARY_POINTS) {
    errors.push(`Maximum ${BOUNDARY_CONSTANTS.MAX_BOUNDARY_POINTS} boundary points allowed`);
  }

  // Calculate area
  const area = calculatePolygonArea(mask.coordinates);

  // Check minimum area
  if (area < BOUNDARY_CONSTANTS.MIN_PROPERTY_AREA_SQM) {
    errors.push(`Property area too small. Minimum ${BOUNDARY_CONSTANTS.MIN_PROPERTY_AREA_SQM} square meters required`);
  }

  // Check maximum area
  if (area > BOUNDARY_CONSTANTS.MAX_PROPERTY_AREA_SQM) {
    errors.push(`Property area too large. Maximum ${BOUNDARY_CONSTANTS.MAX_PROPERTY_AREA_SQM} square meters allowed`);
  }

  // Check if coordinates are within Nigeria bounds
  const nigerianBounds = BOUNDARY_CONSTANTS.NIGERIA_BOUNDS;
  for (const coord of mask.coordinates) {
    if (
      coord.lat < nigerianBounds.south ||
      coord.lat > nigerianBounds.north ||
      coord.lng < nigerianBounds.west ||
      coord.lng > nigerianBounds.east
    ) {
      errors.push('Property coordinates must be within Nigeria boundaries');
      break;
    }
  }

  // Check for self-intersecting polygon
  if (isPolygonSelfIntersecting(mask.coordinates)) {
    errors.push('Property boundary cannot intersect itself');
  }

  // Warning for unusually shaped properties
  const perimeter = calculatePolygonPerimeter(mask.coordinates);
  const circleRadius = Math.sqrt(area / Math.PI);
  const circlePerimeter = 2 * Math.PI * circleRadius;
  const shapeFactor = perimeter / circlePerimeter;

  if (shapeFactor > BOUNDARY_CONSTANTS.MAX_SHAPE_COMPLEXITY) {
    warnings.push('Property shape appears unusually complex');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculatedArea: area,
    perimeter
  };
}

/**
 * Calculate the perimeter of a polygon
 * @param coordinates Array of boundary coordinates
 * @returns Perimeter in meters
 */
export function calculatePolygonPerimeter(coordinates: BoundaryCoordinates[]): number {
  if (coordinates.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const current = coordinates[i];
    const next = coordinates[(i + 1) % coordinates.length];
    perimeter += calculateDistance(current, next);
  }

  return perimeter;
}

/**
 * Check if a polygon is self-intersecting
 * @param coordinates Array of boundary coordinates
 * @returns True if polygon intersects itself
 */
export function isPolygonSelfIntersecting(coordinates: BoundaryCoordinates[]): boolean {
  const n = coordinates.length;
  if (n < 4) return false;

  for (let i = 0; i < n; i++) {
    const line1Start = coordinates[i];
    const line1End = coordinates[(i + 1) % n];

    for (let j = i + 2; j < n; j++) {
      if (j === n - 1 && i === 0) continue; // Skip adjacent lines
      
      const line2Start = coordinates[j];
      const line2End = coordinates[(j + 1) % n];

      if (doLinesIntersect(line1Start, line1End, line2Start, line2End)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if two line segments intersect
 * @param p1 First line start point
 * @param q1 First line end point
 * @param p2 Second line start point
 * @param q2 Second line end point
 * @returns True if lines intersect
 */
function doLinesIntersect(
  p1: BoundaryCoordinates,
  q1: BoundaryCoordinates,
  p2: BoundaryCoordinates,
  q2: BoundaryCoordinates
): boolean {
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

/**
 * Find orientation of ordered triplet of points
 * @param p Point p
 * @param q Point q
 * @param r Point r
 * @returns 0 for collinear, 1 for clockwise, 2 for counterclockwise
 */
function orientation(p: BoundaryCoordinates, q: BoundaryCoordinates, r: BoundaryCoordinates): number {
  const val = (q.lat - p.lat) * (r.lng - q.lng) - (q.lng - p.lng) * (r.lat - q.lat);
  if (val === 0) return 0;
  return val > 0 ? 1 : 2;
}

/**
 * Check if point q lies on line segment pr
 * @param p Point p
 * @param q Point q
 * @param r Point r
 * @returns True if q lies on segment pr
 */
function onSegment(p: BoundaryCoordinates, q: BoundaryCoordinates, r: BoundaryCoordinates): boolean {
  return (
    q.lng <= Math.max(p.lng, r.lng) &&
    q.lng >= Math.min(p.lng, r.lng) &&
    q.lat <= Math.max(p.lat, r.lat) &&
    q.lat >= Math.min(p.lat, r.lat)
  );
}

/**
 * Generate a bounding box for a set of coordinates
 * @param coordinates Array of coordinates
 * @returns Bounding box
 */
export function getBoundingBox(coordinates: BoundaryCoordinates[]) {
  if (coordinates.length === 0) {
    throw new Error('Cannot create bounding box from empty coordinates');
  }

  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;

  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  }

  return {
    northeast: { lat: maxLat, lng: maxLng },
    southwest: { lat: minLat, lng: minLng },
    center: {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    }
  };
}

/**
 * Convert degrees to radians
 * @param degrees Degrees to convert
 * @returns Radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param radians Radians to convert
 * @returns Degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize coordinates to ensure proper formatting
 * @param coordinates Raw coordinates
 * @returns Normalized coordinates
 */
export function normalizeCoordinates(coordinates: any[]): BoundaryCoordinates[] {
  return coordinates.map(coord => ({
    lat: parseFloat(coord.lat.toString()),
    lng: parseFloat(coord.lng.toString())
  }));
}

/**
 * Calculate the center point of a polygon
 * @param coordinates Array of boundary coordinates
 * @returns Center point
 */
export function getPolygonCenter(coordinates: BoundaryCoordinates[]): GeolocationPoint {
  const boundingBox = getBoundingBox(coordinates);
  return boundingBox.center;
}