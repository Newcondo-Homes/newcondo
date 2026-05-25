/**
 * Proximity radius constants for agent assignment
 * All distances in kilometers
 */
/**
 * Default proximity radius for agent assignment
 */
export declare const DEFAULT_PROXIMITY_RADIUS = 15;
/**
 * Maximum proximity radius to search for agents
 */
export declare const MAX_PROXIMITY_RADIUS = 50;
/**
 * Minimum proximity radius
 */
export declare const MIN_PROXIMITY_RADIUS = 5;
/**
 * Proximity tiers for expanding search
 * If no agents found in tier 1, expand to tier 2, etc.
 */
export declare const PROXIMITY_TIERS: {
    TIER_1: number;
    TIER_2: number;
    TIER_3: number;
    TIER_4: number;
};
/**
 * Get all proximity tiers as array
 */
export declare const getProximityTiers: () => number[];
/**
 * Priority scoring based on distance
 * Closer agents get higher priority scores
 */
export declare const calculateDistancePriority: (distanceKm: number) => number;
/**
 * Get proximity tier name by distance
 */
export declare const getProximityTierName: (distanceKm: number) => string;
/**
 * Location-specific radius adjustments
 * Urban areas have smaller radius, rural areas larger
 */
export declare const LOCATION_TYPE_RADIUS: {
    URBAN: number;
    SUBURBAN: number;
    RURAL: number;
};
/**
 * Major cities with urban classification
 */
export declare const URBAN_CITIES: string[];
/**
 * Determine location type based on city/area
 */
export declare const getLocationType: (city: string) => keyof typeof LOCATION_TYPE_RADIUS;
/**
 * Get recommended radius based on location type
 */
export declare const getRecommendedRadius: (city: string) => number;
/**
 * Agent capacity limits based on proximity
 * Maximum concurrent jobs an agent can have in each tier
 */
export declare const AGENT_CAPACITY_BY_TIER: {
    TIER_1: number;
    TIER_2: number;
    TIER_3: number;
    TIER_4: number;
};
/**
 * Time estimation based on distance
 * Average travel time in minutes
 */
export declare const estimateTravelTime: (distanceKm: number) => number;
/**
 * Format distance for display
 */
export declare const formatDistance: (distanceKm: number) => string;
/**
 * Check if distance is within acceptable range
 */
export declare const isWithinAcceptableRange: (distanceKm: number) => boolean;
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
export declare const SERVICE_AREAS: ServiceAreaBoundary[];
/**
 * Find nearest service area to coordinates
 */
export declare const findNearestServiceArea: (lat: number, lng: number) => ServiceAreaBoundary | null;
/**
 * Broadcast radius for job notifications
 * How far to notify agents about new jobs
 */
export declare const JOB_BROADCAST_RADIUS = 15;
/**
 * Notification priority zones
 */
export declare const NOTIFICATION_ZONES: {
    HIGH_PRIORITY: number;
    MEDIUM_PRIORITY: number;
    LOW_PRIORITY: number;
};
//# sourceMappingURL=proximityRadius.d.ts.map