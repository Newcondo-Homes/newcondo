import { PROXIMITY_RADIUS } from '../constants/proximityRadius';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProximityResult {
  distance: number; // in kilometers
  isWithinRadius: boolean;
  estimatedTravelTime?: number; // in minutes
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if a point is within a specified radius of another point
 */
export const isWithinRadius = (
  point1: Coordinates,
  point2: Coordinates,
  radiusKm: number = PROXIMITY_RADIUS.DEFAULT
): boolean => {
  const distance = calculateDistance(point1, point2);
  return distance <= radiusKm;
};

/**
 * Get proximity details between two points
 */
export const getProximity = (
  agentLocation: Coordinates,
  propertyLocation: Coordinates,
  maxRadius: number = PROXIMITY_RADIUS.DEFAULT
): ProximityResult => {
  const distance = calculateDistance(agentLocation, propertyLocation);
  const isWithinRadius = distance <= maxRadius;
  
  // Estimate travel time (assuming average speed of 30 km/h in urban areas)
  const estimatedTravelTime = Math.ceil((distance / 30) * 60);

  return {
    distance,
    isWithinRadius,
    estimatedTravelTime,
  };
};

/**
 * Find all agents within radius of a property
 */
export const findAgentsInProximity = async (
  propertyLocation: Coordinates,
  radiusKm: number = PROXIMITY_RADIUS.DEFAULT
): Promise<Array<{ agentId: string; distance: number; travelTime: number }>> => {
  const { prisma } = await import('@newcondo/db');
  
  // Get all available agents
  const agents = await prisma.user.findMany({
    where: {
      isAvailableForMarking: true,
      OR: [
        { role: 'AGENT' },
        {
          role: 'RENTER',
          isPremium: true,
        },
      ],
    },
    select: {
      id: true,
      agentServiceAreas: true,
    },
  });

  const agentsInProximity: Array<{
    agentId: string;
    distance: number;
    travelTime: number;
  }> = [];

  // TODO: In production, store agent's last known location
  // For now, we'll use service areas to approximate
  
  for (const agent of agents) {
    // This is simplified - in production, use actual agent coordinates
    // For now, check if property location matches service areas
    // You'd need to geocode service areas or store agent coordinates
    
    // Placeholder logic - replace with actual coordinate comparison
    const distance = 0; // Calculate actual distance
    const proximity = getProximity(
      { lat: 0, lng: 0 }, // Agent location - to be implemented
      propertyLocation,
      radiusKm
    );

    if (proximity.isWithinRadius) {
      agentsInProximity.push({
        agentId: agent.id,
        distance: proximity.distance,
        travelTime: proximity.estimatedTravelTime || 0,
      });
    }
  }

  // Sort by distance (closest first)
  return agentsInProximity.sort((a, b) => a.distance - b.distance);
};

/**
 * Calculate bounding box for a given center point and radius
 * Useful for database queries
 */
export const getBoundingBox = (
  center: Coordinates,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} => {
  const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(center.lat)));

  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
};

/**
 * Parse GPS coordinates from string format
 */
export const parseCoordinates = (coordinatesString: string): Coordinates | null => {
  try {
    const coords = JSON.parse(coordinatesString);
    
    if (
      typeof coords.lat === 'number' &&
      typeof coords.lng === 'number' &&
      isValidLatitude(coords.lat) &&
      isValidLongitude(coords.lng)
    ) {
      return coords;
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Validate latitude value
 */
export const isValidLatitude = (lat: number): boolean => {
  return lat >= -90 && lat <= 90;
};

/**
 * Validate longitude value
 */
export const isValidLongitude = (lng: number): boolean => {
  return lng >= -180 && lng <= 180;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (coords: Coordinates): string => {
  return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
};

/**
 * Get center point of multiple coordinates
 */
export const getCenterPoint = (points: Coordinates[]): Coordinates => {
  if (points.length === 0) {
    throw new Error('Cannot calculate center of empty array');
  }

  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length,
  };
};



// // backend/shared/src/utils/geoProximity.ts

// /**
//  * Geolocation and Proximity Utilities
//  * Handles distance calculations, proximity checks, and service area management
//  */

// export interface Coordinates {
//   lat: number;
//   lng: number;
// }

// export interface ProximityResult {
//   distance: number; // in kilometers
//   isWithinRange: boolean;
//   estimatedTravelTime?: number; // in minutes
// }

// export interface ServiceArea {
//   center: Coordinates;
//   radiusKm: number;
//   boundaryPoints?: Coordinates[]; // For polygon service areas
// }

// /**
//  * Calculate distance between two coordinates using Haversine formula
//  * Returns distance in kilometers
//  */
// export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
//   const R = 6371; // Earth's radius in kilometers
//   const dLat = toRadians(point2.lat - point1.lat);
//   const dLng = toRadians(point2.lng - point1.lng);

//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRadians(point1.lat)) *
//       Math.cos(toRadians(point2.lat)) *
//       Math.sin(dLng / 2) *
//       Math.sin(dLng / 2);

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
//  * Convert radians to degrees
//  */
// function toDegrees(radians: number): number {
//   return radians * (180 / Math.PI);
// }

// /**
//  * Check if a point is within a given radius
//  */
// export function isWithinRadius(
//   point: Coordinates,
//   center: Coordinates,
//   radiusKm: number
// ): boolean {
//   const distance = calculateDistance(point, center);
//   return distance <= radiusKm;
// }

// /**
//  * Check proximity and return detailed result
//  */
// export function checkProximity(
//   point: Coordinates,
//   center: Coordinates,
//   maxRadiusKm: number
// ): ProximityResult {
//   const distance = calculateDistance(point, center);
//   const isWithinRange = distance <= maxRadiusKm;

//   // Estimate travel time (rough estimate: 40 km/h average speed in Nigerian cities)
//   const estimatedTravelTime = Math.ceil((distance / 40) * 60); // in minutes

//   return {
//     distance,
//     isWithinRange,
//     estimatedTravelTime,
//   };
// }

// /**
//  * Find all agents within a specified radius of a property
//  */
// export function findAgentsWithinRadius(
//   propertyLocation: Coordinates,
//   agentLocations: Array<{ id: string; location: Coordinates }>,
//   radiusKm: number
// ): Array<{ id: string; distance: number; estimatedTravelTime: number }> {
//   return agentLocations
//     .map((agent) => {
//       const proximity = checkProximity(propertyLocation, agent.location, radiusKm);
//       return {
//         id: agent.id,
//         distance: proximity.distance,
//         estimatedTravelTime: proximity.estimatedTravelTime || 0,
//         isWithinRange: proximity.isWithinRange,
//       };
//     })
//     .filter((result) => result.isWithinRange)
//     .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)
// }

// /**
//  * Calculate reasonable proximity radius based on location type
//  * Urban areas: smaller radius, Rural areas: larger radius
//  */
// export function getReasonableProximityRadius(locationType: 'URBAN' | 'SUBURBAN' | 'RURAL'): number {
//   switch (locationType) {
//     case 'URBAN':
//       return 10; // 10 km for dense urban areas (Lagos, Abuja core)
//     case 'SUBURBAN':
//       return 25; // 25 km for suburban areas
//     case 'RURAL':
//       return 50; // 50 km for rural areas
//     default:
//       return 15; // Default 15 km
//   }
// }

// /**
//  * Determine location type based on state/city
//  * This is a simplified implementation - in production, use more sophisticated data
//  */
// export function determineLocationType(stateName: string, cityName: string): 'URBAN' | 'SUBURBAN' | 'RURAL' {
//   const majorCities = ['lagos', 'abuja', 'port harcourt', 'kano', 'ibadan'];
//   const urbanAreas = ['victoria island', 'ikoyi', 'lekki', 'maitama', 'asokoro', 'wuse'];

//   const cityLower = cityName.toLowerCase();
//   const stateLower = stateName.toLowerCase();

//   // Check if it's a major city or urban area
//   if (majorCities.some((city) => cityLower.includes(city) || stateLower.includes(city))) {
//     return 'URBAN';
//   }

//   if (urbanAreas.some((area) => cityLower.includes(area))) {
//     return 'URBAN';
//   }

//   // Check if it's likely suburban (areas around major cities)
//   if (
//     cityLower.includes('lekki') ||
//     cityLower.includes('ajah') ||
//     cityLower.includes('sangotedo') ||
//     cityLower.includes('ikorodu')
//   ) {
//     return 'SUBURBAN';
//   }

//   return 'RURAL';
// }

// /**
//  * Get bounding box for a given center point and radius
//  * Returns NE and SW corners for map queries
//  */
// export function getBoundingBox(
//   center: Coordinates,
//   radiusKm: number
// ): { ne: Coordinates; sw: Coordinates } {
//   const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
//   const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(center.lat)));

//   return {
//     ne: {
//       lat: center.lat + latDelta,
//       lng: center.lng + lngDelta,
//     },
//     sw: {
//       lat: center.lat - latDelta,
//       lng: center.lng - lngDelta,
//     },
//   };
// }

// /**
//  * Check if a point is inside a polygon (service area)
//  * Uses ray-casting algorithm
//  */
// export function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
//   let inside = false;
//   const x = point.lng;
//   const y = point.lat;

//   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//     const xi = polygon[i].lng;
//     const yi = polygon[i].lat;
//     const xj = polygon[j].lng;
//     const yj = polygon[j].lat;

//     const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

//     if (intersect) inside = !inside;
//   }

//   return inside;
// }

// /**
//  * Check if agent can service a property based on service area
//  */
// export function canServiceProperty(
//   propertyLocation: Coordinates,
//   serviceArea: ServiceArea
// ): ProximityResult {
//   // If boundary points are defined, check polygon
//   if (serviceArea.boundaryPoints && serviceArea.boundaryPoints.length > 2) {
//     const isInside = isPointInPolygon(propertyLocation, serviceArea.boundaryPoints);
//     const distance = calculateDistance(propertyLocation, serviceArea.center);

//     return {
//       distance,
//       isWithinRange: isInside,
//       estimatedTravelTime: isInside ? Math.ceil((distance / 40) * 60) : undefined,
//     };
//   }

//   // Otherwise, use simple radius check
//   return checkProximity(propertyLocation, serviceArea.center, serviceArea.radiusKm);
// }

// /**
//  * Parse GPS coordinates from various string formats
//  */
// export function parseCoordinates(coordString: string): Coordinates | null {
//   try {
//     // Try JSON format first
//     const parsed = JSON.parse(coordString);
//     if (parsed.lat && parsed.lng) {
//       return { lat: parsed.lat, lng: parsed.lng };
//     }
//     if (parsed.latitude && parsed.longitude) {
//       return { lat: parsed.latitude, lng: parsed.longitude };
//     }
//   } catch {
//     // Try comma-separated format: "6.5244, 3.3792"
//     const parts = coordString.split(',').map((s) => s.trim());
//     if (parts.length === 2) {
//       const lat = parseFloat(parts[0]);
//       const lng = parseFloat(parts[1]);
//       if (!isNaN(lat) && !isNaN(lng)) {
//         return { lat, lng };
//       }
//     }
//   }

//   return null;
// }

// /**
//  * Validate coordinates (Nigeria bounds)
//  * Nigeria roughly: 4°N to 14°N, 3°E to 15°E
//  */
// export function validateNigerianCoordinates(coords: Coordinates): boolean {
//   return coords.lat >= 4 && coords.lat <= 14 && coords.lng >= 2.5 && coords.lng <= 15;
// }

// /**
//  * Format coordinates for display
//  */
// export function formatCoordinates(coords: Coordinates, precision: number = 6): string {
//   return `${coords.lat.toFixed(precision)}, ${coords.lng.toFixed(precision)}`;
// }

// /**
//  * Get center point from multiple coordinates (centroid)
//  */
// export function getCentroid(points: Coordinates[]): Coordinates {
//   if (points.length === 0) {
//     throw new Error('Cannot calculate centroid of empty array');
//   }

//   const sum = points.reduce(
//     (acc, point) => ({
//       lat: acc.lat + point.lat,
//       lng: acc.lng + point.lng,
//     }),
//     { lat: 0, lng: 0 }
//   );

//   return {
//     lat: sum.lat / points.length,
//     lng: sum.lng / points.length,
//   };
// }

// /**
//  * Sort locations by proximity to a reference point
//  */
// export function sortByProximity<T extends { id: string; location: Coordinates }>(
//   locations: T[],
//   referencePoint: Coordinates
// ): Array<T & { distance: number }> {
//   return locations
//     .map((location) => ({
//       ...location,
//       distance: calculateDistance(referencePoint, location.location),
//     }))
//     .sort((a, b) => a.distance - b.distance);
// }

// /**
//  * Calculate grid boundaries for efficient geo queries
//  * Divides an area into grid cells for indexing
//  */
// export function getGridCell(coords: Coordinates, gridSizeKm: number): string {
//   const latCell = Math.floor(coords.lat / (gridSizeKm / 111.32));
//   const lngCell = Math.floor(coords.lng / (gridSizeKm / 111.32));
//   return `${latCell}_${lngCell}`;
// }