// backend/marking-service/src/constants/proximityLimits.ts

/**
 * Proximity radius limits for agent assignment to marking jobs
 * Measured in kilometers
 */

export const PROXIMITY_LIMITS = {
  // Default proximity radius for agent assignment
  DEFAULT_RADIUS_KM: 10,
  DEFAULT_RADIUS_METERS: 10000,

  // Maximum proximity radius (fallback if no agents found nearby)
  MAX_RADIUS_KM: 50,
  MAX_RADIUS_METERS: 50000,

  // Minimum proximity radius
  MIN_RADIUS_KM: 2,
  MIN_RADIUS_METERS: 2000,

  // Proximity tiers for priority assignment
  TIER_1_RADIUS_KM: 5, // Highest priority
  TIER_2_RADIUS_KM: 10,
  TIER_3_RADIUS_KM: 20,
  TIER_4_RADIUS_KM: 50, // Lowest priority

  // Urban vs Rural area adjustments
  URBAN_RADIUS_KM: 8,
  RURAL_RADIUS_KM: 25,

  // Premium agent radius (agents with high reliability scores)
  PREMIUM_AGENT_RADIUS_KM: 15,
} as const;

/**
 * State-based proximity configurations
 * Adjusts radius based on Nigerian state characteristics
 */
export const STATE_PROXIMITY_CONFIG: Record<string, number> = {
  // High-density urban states (smaller radius)
  Lagos: 8,
  'FCT-Abuja': 10,
  'Rivers': 10,
  Kano: 10,

  // Medium-density states
  Oyo: 15,
  Kaduna: 15,
  Ogun: 12,
  Anambra: 12,
  Enugu: 12,
  Delta: 15,
  Edo: 15,

  // Lower-density/rural states (larger radius)
  Borno: 30,
  Yobe: 30,
  Taraba: 35,
  Adamawa: 30,
  Bauchi: 25,
  Gombe: 25,
  Plateau: 25,
  Benue: 25,
  Niger: 35,
  Kwara: 20,
  Kogi: 25,
  Nasarawa: 20,
  Zamfara: 30,
  Sokoto: 30,
  Kebbi: 30,
  Jigawa: 25,
  Katsina: 25,
  Imo: 15,
  Abia: 15,
  Ebonyi: 20,
  Akwa_Ibom: 15,
  'Cross-River': 20,
  Bayelsa: 20,
  Ondo: 20,
  Ekiti: 20,
  Osun: 15,
};

/**
 * LGA (Local Government Area) classifications
 */
export enum AreaType {
  URBAN = 'URBAN',
  SUBURBAN = 'SUBURBAN',
  RURAL = 'RURAL',
}

/**
 * Helper functions for proximity calculations
 */
export const proximityHelpers = {
  /**
   * Get proximity radius based on state
   */
  getRadiusForState: (state: string): number => {
    return STATE_PROXIMITY_CONFIG[state] || PROXIMITY_LIMITS.DEFAULT_RADIUS_KM;
  },

  /**
   * Get proximity radius based on area type
   */
  getRadiusForAreaType: (areaType: AreaType): number => {
    switch (areaType) {
      case AreaType.URBAN:
        return PROXIMITY_LIMITS.URBAN_RADIUS_KM;
      case AreaType.SUBURBAN:
        return PROXIMITY_LIMITS.DEFAULT_RADIUS_KM;
      case AreaType.RURAL:
        return PROXIMITY_LIMITS.RURAL_RADIUS_KM;
      default:
        return PROXIMITY_LIMITS.DEFAULT_RADIUS_KM;
    }
  },

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = proximityHelpers.toRad(lat2 - lat1);
    const dLon = proximityHelpers.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(proximityHelpers.toRad(lat1)) *
        Math.cos(proximityHelpers.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  },

  /**
   * Convert degrees to radians
   */
  toRad: (degrees: number): number => {
    return (degrees * Math.PI) / 180;
  },

  /**
   * Check if coordinates are within radius
   */
  isWithinRadius: (
    centerLat: number,
    centerLon: number,
    pointLat: number,
    pointLon: number,
    radiusKm: number
  ): boolean => {
    const distance = proximityHelpers.calculateDistance(
      centerLat,
      centerLon,
      pointLat,
      pointLon
    );
    return distance <= radiusKm;
  },

  /**
   * Get proximity tier based on distance
   */
  getProximityTier: (distanceKm: number): number => {
    if (distanceKm <= PROXIMITY_LIMITS.TIER_1_RADIUS_KM) return 1;
    if (distanceKm <= PROXIMITY_LIMITS.TIER_2_RADIUS_KM) return 2;
    if (distanceKm <= PROXIMITY_LIMITS.TIER_3_RADIUS_KM) return 3;
    if (distanceKm <= PROXIMITY_LIMITS.TIER_4_RADIUS_KM) return 4;
    return 5; // Out of range
  },

  /**
   * Calculate priority score based on distance and agent reliability
   */
  calculatePriorityScore: (
    distanceKm: number,
    reliabilityScore: number = 0
  ): number => {
    // Lower distance = higher score
    const distanceScore = Math.max(0, 100 - distanceKm * 2);
    
    // Reliability score (0-5) converted to 0-100
    const reliabilityPoints = (reliabilityScore / 5) * 100;

    // Weighted average: 60% distance, 40% reliability
    return Math.round(distanceScore * 0.6 + reliabilityPoints * 0.4);
  },

  /**
   * Format distance for display
   */
  formatDistance: (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  },

  /**
   * Parse GPS coordinates from string
   */
  parseCoordinates: (gpsString: string): { lat: number; lng: number } | null => {
    try {
      const coords = JSON.parse(gpsString);
      if (coords.lat && coords.lng) {
        return {
          lat: parseFloat(coords.lat),
          lng: parseFloat(coords.lng),
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};

/**
 * Agent search configuration
 */
export const AGENT_SEARCH_CONFIG = {
  // Maximum number of agents to notify per job
  MAX_AGENTS_TO_NOTIFY: 50,

  // Minimum reliability score to be eligible for jobs
  MIN_RELIABILITY_SCORE: 2.0,

  // Maximum concurrent jobs per agent
  MAX_CONCURRENT_JOBS: 3,

  // Cooldown period after completing a job (minutes)
  JOB_COMPLETION_COOLDOWN_MINUTES: 30,
} as const;

/**
 * Proximity expansion strategy when no agents found
 */
export const PROXIMITY_EXPANSION = {
  // Increment radius by this amount when expanding search
  EXPANSION_INCREMENT_KM: 5,

  // Maximum number of expansion attempts
  MAX_EXPANSION_ATTEMPTS: 5,

  // Delay between expansion attempts (milliseconds)
  EXPANSION_DELAY_MS: 1000,
} as const;

export type ProximityTier = 1 | 2 | 3 | 4 | 5;