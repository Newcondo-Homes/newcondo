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




// /**
//  * Geolocation Utilities
//  * Handles distance calculations, proximity checks, and coordinate validation
//  */

// interface Coordinates {
//   latitude: number;
//   longitude: number;
// }

// interface BoundingBox {
//   minLat: number;
//   maxLat: number;
//   minLng: number;
//   maxLng: number;
// }

// /**
//  * Calculate distance between two coordinates using Haversine formula
//  * @param coord1 - First coordinate
//  * @param coord2 - Second coordinate
//  * @returns Distance in kilometers
//  */
// export function calculateDistance(
//   coord1: Coordinates,
//   coord2: Coordinates
// ): number {
//   const R = 6371; // Earth's radius in kilometers
//   const dLat = toRadians(coord2.latitude - coord1.latitude);
//   const dLon = toRadians(coord2.longitude - coord1.longitude);

//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRadians(coord1.latitude)) *
//       Math.cos(toRadians(coord2.latitude)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);

//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const distance = R * c;

//   return Number(distance.toFixed(2));
// }

// /**
//  * Convert degrees to radians
//  */
// function toRadians(degrees: number): number {
//   return degrees * (Math.PI / 180);
// }

// /**
//  * Check if a coordinate is within a specified radius of a center point
//  * @param center - Center coordinate
//  * @param point - Point to check
//  * @param radiusKm - Radius in kilometers
//  * @returns True if point is within radius
//  */
// export function isWithinRadius(
//   center: Coordinates,
//   point: Coordinates,
//   radiusKm: number
// ): boolean {
//   const distance = calculateDistance(center, point);
//   return distance <= radiusKm;
// }

// /**
//  * Find all points within a radius (useful for finding nearby agents)
//  * @param center - Center coordinate
//  * @param points - Array of points with IDs
//  * @param radiusKm - Radius in kilometers
//  * @returns Filtered points with distances
//  */
// export function findPointsWithinRadius<T extends { id: string }>(
//   center: Coordinates,
//   points: (T & Coordinates)[],
//   radiusKm: number
// ): Array<T & { distance: number }> {
//   return points
//     .map((point) => ({
//       ...point,
//       distance: calculateDistance(center, point),
//     }))
//     .filter((point) => point.distance <= radiusKm)
//     .sort((a, b) => a.distance - b.distance);
// }

// /**
//  * Validate GPS coordinates
//  * @param latitude - Latitude value
//  * @param longitude - Longitude value
//  * @returns True if coordinates are valid
//  */
// export function validateCoordinates(
//   latitude: number,
//   longitude: number
// ): boolean {
//   return (
//     latitude >= -90 &&
//     latitude <= 90 &&
//     longitude >= -180 &&
//     longitude <= 180 &&
//     !isNaN(latitude) &&
//     !isNaN(longitude)
//   );
// }

// /**
//  * Parse GPS coordinates from string format
//  * @param coordsString - String in format "lat,lng" or JSON format
//  * @returns Parsed coordinates or null if invalid
//  */
// export function parseCoordinates(coordsString: string): Coordinates | null {
//   try {
//     // Try JSON format first
//     const parsed = JSON.parse(coordsString);
//     if (parsed.lat && parsed.lng) {
//       return {
//         latitude: Number(parsed.lat),
//         longitude: Number(parsed.lng),
//       };
//     }
//     if (parsed.latitude && parsed.longitude) {
//       return {
//         latitude: Number(parsed.latitude),
//         longitude: Number(parsed.longitude),
//       };
//     }
//   } catch {
//     // Try comma-separated format
//     const parts = coordsString.split(',').map((s) => s.trim());
//     if (parts.length === 2) {
//       const lat = Number(parts[0]);
//       const lng = Number(parts[1]);
//       if (validateCoordinates(lat, lng)) {
//         return { latitude: lat, longitude: lng };
//       }
//     }
//   }
//   return null;
// }

// /**
//  * Calculate bounding box for a given center and radius
//  * Useful for database queries to pre-filter results
//  * @param center - Center coordinate
//  * @param radiusKm - Radius in kilometers
//  * @returns Bounding box coordinates
//  */
// export function getBoundingBox(
//   center: Coordinates,
//   radiusKm: number
// ): BoundingBox {
//   // Approximate degrees per kilometer (varies by latitude)
//   const latDegreePerKm = 1 / 111.32;
//   const lngDegreePerKm =
//     1 / (111.32 * Math.cos(toRadians(center.latitude)));

//   const latOffset = radiusKm * latDegreePerKm;
//   const lngOffset = radiusKm * lngDegreePerKm;

//   return {
//     minLat: center.latitude - latOffset,
//     maxLat: center.latitude + latOffset,
//     minLng: center.longitude - lngOffset,
//     maxLng: center.longitude + lngOffset,
//   };
// }

// /**
//  * Get the center point (centroid) of multiple coordinates
//  * @param coordinates - Array of coordinates
//  * @returns Center coordinate
//  */
// export function getCentroid(coordinates: Coordinates[]): Coordinates {
//   if (coordinates.length === 0) {
//     throw new Error('Cannot calculate centroid of empty array');
//   }

//   const sum = coordinates.reduce(
//     (acc, coord) => ({
//       latitude: acc.latitude + coord.latitude,
//       longitude: acc.longitude + coord.longitude,
//     }),
//     { latitude: 0, longitude: 0 }
//   );

//   return {
//     latitude: sum.latitude / coordinates.length,
//     longitude: sum.longitude / coordinates.length,
//   };
// }

// /**
//  * Format coordinates for display
//  * @param coords - Coordinates to format
//  * @param precision - Decimal places (default: 6)
//  * @returns Formatted string
//  */
// export function formatCoordinates(
//   coords: Coordinates,
//   precision: number = 6
// ): string {
//   return `${coords.latitude.toFixed(precision)}, ${coords.longitude.toFixed(precision)}`;
// }

// /**
//  * Check if a point is within Nigeria's approximate boundaries
//  * @param coords - Coordinates to check
//  * @returns True if within Nigeria
//  */
// export function isWithinNigeria(coords: Coordinates): boolean {
//   // Nigeria approximate boundaries
//   const NIGERIA_BOUNDS = {
//     minLat: 4.0,
//     maxLat: 14.0,
//     minLng: 2.5,
//     maxLng: 15.0,
//   };

//   return (
//     coords.latitude >= NIGERIA_BOUNDS.minLat &&
//     coords.latitude <= NIGERIA_BOUNDS.maxLat &&
//     coords.longitude >= NIGERIA_BOUNDS.minLng &&
//     coords.longitude <= NIGERIA_BOUNDS.maxLng
//   );
// }

// /**
//  * Calculate reasonable proximity radius based on location density
//  * @param cityOrState - City or state name
//  * @returns Recommended radius in kilometers
//  */
// export function getRecommendedProximityRadius(cityOrState: string): number {
//   const lowerCase = cityOrState.toLowerCase();

//   // Major cities - smaller radius due to high agent density
//   const majorCities = ['lagos', 'abuja', 'port harcourt', 'kano', 'ibadan'];
//   if (majorCities.some((city) => lowerCase.includes(city))) {
//     return 5; // 5km radius
//   }

//   // Medium cities
//   const mediumCities = [
//     'benin',
//     'enugu',
//     'jos',
//     'ilorin',
//     'owerri',
//     'calabar',
//     'abeokuta',
//   ];
//   if (mediumCities.some((city) => lowerCase.includes(city))) {
//     return 10; // 10km radius
//   }

//   // Smaller cities and rural areas
//   return 20; // 20km radius
// }

// /**
//  * Sort agents by proximity to property
//  * @param propertyCoords - Property coordinates
//  * @param agents - Array of agents with coordinates
//  * @returns Sorted agents with distance information
//  */
// export function sortAgentsByProximity<T extends { id: string; gpsCoordinates?: string }>(
//   propertyCoords: Coordinates,
//   agents: T[]
// ): Array<T & { distance: number | null; coordinates: Coordinates | null }> {
//   return agents
//     .map((agent) => {
//       const coordinates = agent.gpsCoordinates
//         ? parseCoordinates(agent.gpsCoordinates)
//         : null;
      
//       const distance = coordinates
//         ? calculateDistance(propertyCoords, coordinates)
//         : null;

//       return {
//         ...agent,
//         coordinates,
//         distance,
//       };
//     })
//     .sort((a, b) => {
//       // Agents with valid coordinates come first
//       if (a.distance === null && b.distance === null) return 0;
//       if (a.distance === null) return 1;
//       if (b.distance === null) return -1;
//       return a.distance - b.distance;
//     });
// }