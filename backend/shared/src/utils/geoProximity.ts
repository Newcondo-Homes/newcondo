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