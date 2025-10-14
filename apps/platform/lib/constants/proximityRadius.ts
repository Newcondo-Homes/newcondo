// apps/platform/lib/constants/proximityRadius.ts

/**
 * Proximity radius configurations for agent assignment
 * All distances in kilometers
 */

export const PROXIMITY_RADIUS = {
  // Initial search radius
  INITIAL_RADIUS: 5, // 5km - start with nearby agents

  // Preferred radius for quick response
  PREFERRED_RADIUS: 10, // 10km - ideal distance for agents

  // Maximum search radius before giving up
  MAX_RADIUS: 50, // 50km - maximum distance we'll search

  // Radius expansion steps when no agents found
  EXPANSION_STEP: 5, // 5km - increase radius by this amount each iteration

  // Urban vs Rural settings
  URBAN_MAX_RADIUS: 30, // 30km for urban areas
  RURAL_MAX_RADIUS: 100, // 100km for rural areas

  // Priority zones
  PRIORITY_ZONE_1: 5, // Within 5km - highest priority
  PRIORITY_ZONE_2: 15, // Within 15km - medium priority
  PRIORITY_ZONE_3: 30, // Within 30km - lower priority
} as const;

/**
 * Travel time estimates (in minutes per km)
 */
export const TRAVEL_TIME_ESTIMATES = {
  URBAN_PEAK: 5, // 5 min/km during peak hours in urban areas
  URBAN_OFF_PEAK: 3, // 3 min/km during off-peak in urban areas
  RURAL: 2, // 2 min/km in rural areas
  HIGHWAY: 1, // 1 min/km on highways
} as const;

/**
 * Agent search configuration
 */
export const AGENT_SEARCH_CONFIG = {
  MAX_AGENTS_PER_SEARCH: 50, // Maximum agents to return in one search
  MIN_AGENTS_BEFORE_EXPANSION: 3, // Minimum agents before expanding radius
  PREFERRED_AGENTS_COUNT: 10, // Ideal number of agents to notify
  MAX_QUEUE_SIZE: 20, // Maximum agents in marking job queue
} as const;

/**
 * Calculate estimated travel time
 */
export function calculateTravelTime(
  distance: number,
  areaType: 'urban' | 'rural' = 'urban',
  isPeakHour: boolean = false
): number {
  let timePerKm: number;

  if (areaType === 'urban') {
    timePerKm = isPeakHour ? TRAVEL_TIME_ESTIMATES.URBAN_PEAK : TRAVEL_TIME_ESTIMATES.URBAN_OFF_PEAK;
  } else {
    timePerKm = TRAVEL_TIME_ESTIMATES.RURAL;
  }

  return Math.ceil(distance * timePerKm);
}

/**
 * Determine if location is urban or rural based on state/city
 */
export function isUrbanArea(state: string, city?: string): boolean {
  const urbanStates = ['Lagos', 'Abuja FCT', 'Rivers', 'Kano'];
  const urbanCities = [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Kano',
    'Ibadan',
    'Kaduna',
    'Benin City',
    'Enugu',
    'Jos',
    'Ilorin',
  ];

  return (
    urbanStates.includes(state) ||
    (city ? urbanCities.some(c => city.toLowerCase().includes(c.toLowerCase())) : false)
  );
}

/**
 * Get appropriate max radius based on area type
 */
export function getMaxRadius(state: string, city?: string): number {
  return isUrbanArea(state, city) 
    ? PROXIMITY_RADIUS.URBAN_MAX_RADIUS 
    : PROXIMITY_RADIUS.RURAL_MAX_RADIUS;
}

/**
 * Get priority zone for a given distance
 */
export function getPriorityZone(distance: number): 1 | 2 | 3 | 4 {
  if (distance <= PROXIMITY_RADIUS.PRIORITY_ZONE_1) return 1;
  if (distance <= PROXIMITY_RADIUS.PRIORITY_ZONE_2) return 2;
  if (distance <= PROXIMITY_RADIUS.PRIORITY_ZONE_3) return 3;
  return 4;
}

/**
 * Calculate search radii for progressive expansion
 */
export function getSearchRadii(state: string, city?: string): number[] {
  const maxRadius = getMaxRadius(state, city);
  const radii: number[] = [];
  
  for (
    let radius = PROXIMITY_RADIUS.INITIAL_RADIUS;
    radius <= maxRadius;
    radius += PROXIMITY_RADIUS.EXPANSION_STEP
  ) {
    radii.push(radius);
  }
  
  return radii;
}

/**
 * Distance multiplier for reliability scoring
 * Agents closer to property get higher scores
 */
export function getDistanceMultiplier(distance: number): number {
  if (distance <= PROXIMITY_RADIUS.PRIORITY_ZONE_1) return 1.5;
  if (distance <= PROXIMITY_RADIUS.PRIORITY_ZONE_2) return 1.2;
  if (distance <= PROXIMITY_RADIUS.PRIORITY_ZONE_3) return 1.0;
  return 0.8;
}

/**
 * Check if distance is within reasonable range
 */
export function isWithinReasonableDistance(
  distance: number,
  state: string,
  city?: string
): boolean {
  const maxRadius = getMaxRadius(state, city);
  return distance <= maxRadius;
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * Format travel time for display
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}