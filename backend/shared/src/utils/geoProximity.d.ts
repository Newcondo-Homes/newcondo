export interface Coordinates {
    lat: number;
    lng: number;
}
interface ProximityResult {
    distance: number;
    isWithinRadius: boolean;
    estimatedTravelTime?: number;
}
/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export declare const geoProxCalculateDistance: (point1: Coordinates, point2: Coordinates) => number;
/**
 * Check if a point is within a specified radius of another point
 */
export declare const isWithinRadius: (point1: Coordinates, point2: Coordinates, radiusKm?: number) => boolean;
/**
 * Get proximity details between two points
 */
export declare const getProximity: (agentLocation: Coordinates, propertyLocation: Coordinates, maxRadius?: number) => ProximityResult;
/**
 * Find all agents within radius of a property
 */
export declare const findAgentsInProximity: (propertyLocation: Coordinates, radiusKm?: number) => Promise<Array<{
    agentId: string;
    distance: number;
    travelTime: number;
}>>;
/**
 * Calculate bounding box for a given center point and radius
 * Useful for database queries
 */
export declare const geoGetBoundingBox: (center: Coordinates, radiusKm: number) => {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};
/**
 * Parse GPS coordinates from string format
 */
export declare const parseCoordinates: (coordinatesString: string) => Coordinates | null;
/**
 * Validate latitude value
 */
export declare const isValidLatitude: (lat: number) => boolean;
/**
 * Validate longitude value
 */
export declare const isValidLongitude: (lng: number) => boolean;
/**
 * Format coordinates for display
 */
export declare const formatCoordinates: (coords: Coordinates) => string;
/**
 * Get center point of multiple coordinates
 */
export declare const getCenterPoint: (points: Coordinates[]) => Coordinates;
export {};
//# sourceMappingURL=geoProximity.d.ts.map