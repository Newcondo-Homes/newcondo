/**
 * Proximity Calculations Utility
 * Location: apps/platform/lib/utils/proximityCalculations.ts
 * 
 * Handles distance calculations between agents and properties for marking job assignments
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface ProximityResult {
  distance: number; // in kilometers
  isWithinRange: boolean;
  travelTimeEstimate?: number; // in minutes
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
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
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if agent is within reasonable proximity to property
 * Default reasonable range: 50km
 */
export function isWithinReasonableProximity(
  agentLocation: Coordinates,
  propertyLocation: Coordinates,
  maxDistanceKm: number = 50
): ProximityResult {
  const distance = calculateDistance(agentLocation, propertyLocation);
  const isWithinRange = distance <= maxDistanceKm;

  // Estimate travel time (assuming average speed of 30km/h in Nigerian cities)
  const travelTimeEstimate = Math.ceil((distance / 30) * 60);

  return {
    distance,
    isWithinRange,
    travelTimeEstimate,
  };
}

/**
 * Parse GPS coordinates from JSON string or object
 */
export function parseGPSCoordinates(
  gpsData: string | Coordinates | null | undefined
): Coordinates | null {
  if (!gpsData) return null;

  try {
    if (typeof gpsData === 'string') {
      const parsed = JSON.parse(gpsData);
      return {
        lat: parseFloat(parsed.lat),
        lng: parseFloat(parsed.lng),
      };
    }

    return {
      lat: parseFloat(String(gpsData.lat)),
      lng: parseFloat(String(gpsData.lng)),
    };
  } catch (error) {
    console.error('Error parsing GPS coordinates:', error);
    return null;
  }
}

/**
 * Validate coordinates are within Nigeria's approximate boundaries
 * Nigeria bounds: lat (4°N to 14°N), lng (3°E to 15°E)
 */
export function isValidNigerianCoordinates(coords: Coordinates): boolean {
  return (
    coords.lat >= 4 &&
    coords.lat <= 14 &&
    coords.lng >= 3 &&
    coords.lng <= 15
  );
}

/**
 * Sort agents by distance from property
 */
export function sortAgentsByProximity<T extends { gpsCoordinates?: string | null }>(
  agents: T[],
  propertyLocation: Coordinates
): (T & { distance: number })[] {
  return agents
    .map((agent) => {
      const agentCoords = parseGPSCoordinates(agent.gpsCoordinates);
      const distance = agentCoords
        ? calculateDistance(agentCoords, propertyLocation)
        : Infinity;

      return {
        ...agent,
        distance,
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter agents within service area
 * Checks if property location matches any of agent's service areas
 */
export function isPropertyInServiceArea(
  propertyCity: string,
  propertyState: string,
  agentServiceAreas: string[]
): boolean {
  const normalizedAreas = agentServiceAreas.map((area) =>
    area.toLowerCase().trim()
  );
  const propertyLocation = `${propertyCity}, ${propertyState}`.toLowerCase();

  return normalizedAreas.some(
    (area) =>
      propertyLocation.includes(area) ||
      area.includes(propertyCity.toLowerCase()) ||
      area.includes(propertyState.toLowerCase())
  );
}

/**
 * Get proximity tier for agent (for priority assignment)
 */
export function getProximityTier(distanceKm: number): 'NEAR' | 'MEDIUM' | 'FAR' {
  if (distanceKm <= 10) return 'NEAR';
  if (distanceKm <= 30) return 'MEDIUM';
  return 'FAR';
}

/**
 * Calculate estimated time to reach property
 * Considers different travel speeds based on distance
 */
export function estimateTravelTime(distanceKm: number): {
  minutes: number;
  formatted: string;
} {
  let averageSpeedKmh: number;

  // Adjust speed based on distance (shorter trips = slower avg speed due to traffic)
  if (distanceKm <= 5) {
    averageSpeedKmh = 20; // Heavy traffic, city center
  } else if (distanceKm <= 20) {
    averageSpeedKmh = 30; // Moderate traffic
  } else {
    averageSpeedKmh = 40; // Highway/express roads
  }

  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.ceil(hours * 60);

  // Format as "X mins" or "X hr Y mins"
  const formatted =
    minutes < 60
      ? `${minutes} mins`
      : `${Math.floor(minutes / 60)} hr ${minutes % 60} mins`;

  return { minutes, formatted };
}

/**
 * Get coordinates from address components
 * Useful for fallback when GPS coordinates are not available
 */
export function getCityStateCoordinates(
  city: string,
  state: string
): Coordinates | null {
  // Major Nigerian cities approximate coordinates
  const cityCoordinates: Record<string, Coordinates> = {
    lagos: { lat: 6.5244, lng: 3.3792 },
    abuja: { lat: 9.0765, lng: 7.3986 },
    'port harcourt': { lat: 4.8156, lng: 7.0498 },
    kano: { lat: 12.0022, lng: 8.592 },
    ibadan: { lat: 7.3775, lng: 3.947 },
    kaduna: { lat: 10.5105, lng: 7.4165 },
    benin: { lat: 6.3405, lng: 5.6037 },
    enugu: { lat: 6.4403, lng: 7.4914 },
    jos: { lat: 9.8965, lng: 8.8583 },
    ilorin: { lat: 8.4799, lng: 4.5418 },
  };

  const normalizedCity = city.toLowerCase().trim();
  return cityCoordinates[normalizedCity] || null;
}

/**
 * Calculate maximum agents to notify based on property location
 * More agents for urgent jobs or properties in high-demand areas
 */
export function calculateMaxAgentsToNotify(
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
  nearbyAgentsCount: number
): number {
  const baseLimit = {
    LOW: 5,
    NORMAL: 10,
    HIGH: 15,
    URGENT: 20,
  }[urgencyLevel];

  // Don't exceed available agents
  return Math.min(baseLimit, nearbyAgentsCount);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Get search radius based on agent availability
 * Expands search if few agents available
 */
export function getSearchRadius(availableAgentsCount: number): number {
  if (availableAgentsCount >= 10) return 25; // 25km if many agents
  if (availableAgentsCount >= 5) return 35; // 35km if moderate agents
  if (availableAgentsCount >= 2) return 50; // 50km if few agents
  return 75; // 75km if very few agents (expand search)
}