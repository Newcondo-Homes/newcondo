/**
 * Proximity and Distance Calculation Types
 * For agent assignment and service area management
 */
export interface ProximityCoordinates {
    lat: number;
    lng: number;
}
export interface ProximitySearchParams {
    center: ProximityCoordinates;
    radiusKm: number;
    maxResults?: number;
    includeDistance?: boolean;
}
export interface ProximityResult<T> {
    item: T;
    distance: number;
    bearing?: number;
    estimatedTravelTime?: number;
}
export interface ServiceArea {
    id: string;
    userId: string;
    areas: ServiceAreaDefinition[];
    maxDistanceKm: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ServiceAreaDefinition {
    type: "STATE" | "LGA" | "LOCATION" | "RADIUS" | "POLYGON";
    stateId?: string;
    stateName?: string;
    lgaId?: string;
    lgaName?: string;
    locationId?: string;
    locationName?: string;
    centerPoint?: ProximityCoordinates;
    radiusKm?: number;
    polygonCoordinates?: ProximityCoordinates[];
}
export interface ProximityDistanceCalculation {
    from: ProximityCoordinates;
    to: ProximityCoordinates;
    distanceKm: number;
    distanceMeters: number;
    straightLine: boolean;
    estimatedTravelTime?: number;
    route?: RouteInfo;
}
export interface RouteInfo {
    distanceKm: number;
    durationMinutes: number;
    polyline?: string;
    steps?: RouteStep[];
}
export interface RouteStep {
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
    startLocation: ProximityCoordinates;
    endLocation: ProximityCoordinates;
}
export interface AgentProximityInfo {
    userId: string;
    userName: string;
    userPhone: string;
    currentLocation?: ProximityCoordinates;
    serviceAreas: ServiceAreaDefinition[];
    distance?: number;
    isAvailable: boolean;
    reliabilityScore: number;
    totalJobs: number;
    completedJobs: number;
    completionRate: number;
    averageCompletionTime?: number;
}
export interface ProximityAssignmentCriteria {
    propertyLocation: ProximityCoordinates;
    maxDistanceKm: number;
    minReliabilityScore?: number;
    preferredStates?: string[];
    preferredLGAs?: string[];
    excludeUserIds?: string[];
    sortBy: "DISTANCE" | "RELIABILITY" | "COMPLETION_RATE" | "TOTAL_JOBS";
    sortOrder: "ASC" | "DESC";
    limit?: number;
}
export declare enum DistanceTier {
    VERY_CLOSE = "VERY_CLOSE",// 0-5km
    CLOSE = "CLOSE",// 5-15km
    MODERATE = "MODERATE",// 15-30km
    FAR = "FAR",// 30-50km
    VERY_FAR = "VERY_FAR"
}
export interface DistanceTierInfo {
    tier: DistanceTier;
    distanceKm: number;
    estimatedTravelTime: number;
    additionalFee?: number;
}
export interface GeohashInfo {
    geohash: string;
    precision: number;
    boundingBox: {
        minLat: number;
        minLng: number;
        maxLat: number;
        maxLng: number;
    };
}
export interface BatchProximityRequest {
    origin: ProximityCoordinates;
    destinations: Array<{
        id: string;
        coordinates: ProximityCoordinates;
        metadata?: Record<string, any>;
    }>;
    includeRoute?: boolean;
}
export interface BatchProximityResponse {
    results: Array<{
        id: string;
        distance: ProximityDistanceCalculation;
        metadata?: Record<string, any>;
    }>;
    totalProcessed: number;
    errors?: Array<{
        id: string;
        error: string;
    }>;
}
export type CalculateDistanceFunction = (from: ProximityCoordinates, to: ProximityCoordinates, options?: {
    unit?: "km" | "m" | "mi";
    precise?: boolean;
}) => number;
export type GetDistanceTierFunction = (distanceKm: number) => DistanceTier;
export type IsWithinRadiusFunction = (point: ProximityCoordinates, center: ProximityCoordinates, radiusKm: number) => boolean;
export type CalculateBearingFunction = (from: ProximityCoordinates, to: ProximityCoordinates) => number;
//# sourceMappingURL=proximity.d.ts.map