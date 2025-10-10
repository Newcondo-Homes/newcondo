// backend/shared/src/constants/proximityRadius.ts

/**
 * Proximity radius constants for agent assignment
 * All distances in kilometers
 */

/**
 * Default proximity radius for agent assignment
 */
export const DEFAULT_PROXIMITY_RADIUS = 15; // 15km

/**
 * Maximum proximity radius to search for agents
 */
export const MAX_PROXIMITY_RADIUS = 50; // 50km

/**
 * Minimum proximity radius
 */
export const MIN_PROXIMITY_RADIUS = 5; // 5km

/**
 * Proximity tiers for expanding search
 * If no agents found in tier 1, expand to tier 2, etc.
 */
export const PROXIMITY_TIERS = {
  TIER_1: 10, // 10km - Immediate vicinity
  TIER_2: 20, // 20km - Extended area
  TIER_3: 35, // 35km - Wide area
  TIER_4: 50 // 50km - Maximum search radius
};

/**
 * Get all proximity tiers as array
 */
export const getProximityTiers = (): number[] => {
  return Object.values(PROXIMITY_TIERS);
};

/**
 * Priority scoring based on distance
 * Closer agents get higher priority scores
 */
export const calculateDistancePriority = (distanceKm: number): number => {
  if (distanceKm <= PROXIMITY_TIERS.TIER_1) return 100;
  if (distanceKm <= PROXIMITY_TIERS.TIER_2) return 75;
  if (distanceKm <= PROXIMITY_TIERS.TIER_3) return 50;
  if (distanceKm <= PROXIMITY_TIERS.TIER_4) return 25;
  return 0;
};

/**
 * Get proximity tier name by distance
 */
export const getProximityTierName = (distanceKm: number): string => {
  if (distanceKm <= PROXIMITY_TIERS.TIER_1) return 'Very Close';
  if (distanceKm <= PROXIMITY_TIERS.TIER_2) return 'Close';
  if (distanceKm <= PROXIMITY_TIERS.TIER_3) return 'Moderate';
  if (distanceKm <= PROXIMITY_TIERS.TIER_4) return 'Far';
  return 'Out of Range';
};

/**
 * Location-specific radius adjustments
 * Urban areas have smaller radius, rural areas larger
 */
export const LOCATION_TYPE_RADIUS = {
  URBAN: 10, // Dense urban areas (Lagos, Abuja)
  SUBURBAN: 20, // Suburban areas
  RURAL: 40 // Rural areas
};

/**
 * Major cities with urban classification
 */
export const URBAN_CITIES = [
  'Lagos',
  'Ikeja',
  'Victoria Island',
  'Lekki',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan'
];

/**
 * Determine location type based on city/area
 */
export const getLocationType = (city: string): keyof typeof LOCATION_TYPE_RADIUS => {
  const normalizedCity = city.toLowerCase();
  
  const isUrban = URBAN_CITIES.some(urbanCity => 
    normalizedCity.includes(urbanCity.toLowerCase())
  );
  
  if (isUrban) return 'URBAN';
  
  // Could add more sophisticated logic here
  // For now, default to suburban
  return 'SUBURBAN';
};

/**
 * Get recommended radius based on location type
 */
export const getRecommendedRadius = (city: string): number => {
  const locationType = getLocationType(city);
  return LOCATION_TYPE_RADIUS[locationType];
};

/**
 * Agent capacity limits based on proximity
 * Maximum concurrent jobs an agent can have in each tier
 */
export const AGENT_CAPACITY_BY_TIER = {
  TIER_1: 5, // Can handle 5 jobs within 10km
  TIER_2: 3, // Can handle 3 jobs within 20km
  TIER_3: 2, // Can handle 2 jobs within 35km
  TIER_4: 1 // Can handle 1 job within 50km
};

/**
 * Time estimation based on distance
 * Average travel time in minutes
 */
export const estimateTravelTime = (distanceKm: number): number => {
  // Assuming average speed of 30km/h in urban areas
  const avgSpeedKmPerHour = 30;
  const timeInHours = distanceKm / avgSpeedKmPerHour;
  return Math.ceil(timeInHours * 60); // Convert to minutes
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Check if distance is within acceptable range
 */
export const isWithinAcceptableRange = (distanceKm: number): boolean => {
  return distanceKm <= MAX_PROXIMITY_RADIUS;
};

/**
 * Geofencing configuration
 * Define boundaries for different service areas
 */
export interface ServiceAreaBoundary {
  name: string;
  centerLat: number;
  centerLng: number;
  radius: number;
}

/**
 * Major service area definitions
 */
export const SERVICE_AREAS: ServiceAreaBoundary[] = [
  {
    name: 'Lagos Mainland',
    centerLat: 6.5244,
    centerLng: 3.3792,
    radius: 25
  },
  {
    name: 'Lagos Island',
    centerLat: 6.4474,
    centerLng: 3.3903,
    radius: 15
  },
  {
    name: 'Abuja Central',
    centerLat: 9.0579,
    centerLng: 7.4951,
    radius: 30
  },
  {
    name: 'Port Harcourt',
    centerLat: 4.8156,
    centerLng: 7.0498,
    radius: 20
  },
  {
    name: 'Ibadan',
    centerLat: 7.3775,
    centerLng: 3.9470,
    radius: 25
  },
  {
    name: 'Kano',
    centerLat: 12.0022,
    centerLng: 8.5919,
    radius: 20
  }
];

/**
 * Find nearest service area to coordinates
 */
export const findNearestServiceArea = (
  lat: number,
  lng: number
): ServiceAreaBoundary | null => {
  let nearest: ServiceAreaBoundary | null = null;
  let minDistance = Infinity;

  SERVICE_AREAS.forEach(area => {
    // Simple distance calculation (Haversine would be more accurate)
    const distance = Math.sqrt(
      Math.pow(area.centerLat - lat, 2) + Math.pow(area.centerLng - lng, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = area;
    }
  });

  return nearest;
};

/**
 * Broadcast radius for job notifications
 * How far to notify agents about new jobs
 */
export const JOB_BROADCAST_RADIUS = DEFAULT_PROXIMITY_RADIUS;

/**
 * Notification priority zones
 */
export const NOTIFICATION_ZONES = {
  HIGH_PRIORITY: PROXIMITY_TIERS.TIER_1, // Notify immediately
  MEDIUM_PRIORITY: PROXIMITY_TIERS.TIER_2, // Notify after 5 minutes
  LOW_PRIORITY: PROXIMITY_TIERS.TIER_3 // Notify after 15 minutes
};