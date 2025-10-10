/**
 * Proximity and Distance Calculation Types
 * For agent assignment and service area management
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProximitySearchParams {
  center: Coordinates;
  radiusKm: number; // Search radius in kilometers
  maxResults?: number;
  includeDistance?: boolean;
}

export interface ProximityResult<T> {
  item: T;
  distance: number; // Distance in kilometers
  bearing?: number; // Compass bearing from center (0-360 degrees)
  estimatedTravelTime?: number; // In minutes (if available)
}

export interface ServiceArea {
  id: string;
  userId: string;
  areas: ServiceAreaDefinition[];
  maxDistanceKm: number; // Maximum distance willing to travel
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAreaDefinition {
  type: "STATE" | "LGA" | "LOCATION" | "RADIUS" | "POLYGON";
  // For STATE/LGA/LOCATION types
  stateId?: string;
  stateName?: string;
  lgaId?: string;
  lgaName?: string;
  locationId?: string;
  locationName?: string;
  // For RADIUS type
  centerPoint?: Coordinates;
  radiusKm?: number;
  // For POLYGON type (custom drawn areas)
  polygonCoordinates?: Coordinates[];
}

export interface DistanceCalculation {
  from: Coordinates;
  to: Coordinates;
  distanceKm: number;
  distanceMeters: number;
  straightLine: boolean; // true if calculated as crow flies, false if road distance
  estimatedTravelTime?: number; // In minutes
  route?: RouteInfo;
}

export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  polyline?: string; // Encoded polyline for map display
  steps?: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  startLocation: Coordinates;
  endLocation: Coordinates;
}

// Agent availability with proximity
export interface AgentProximityInfo {
  userId: string;
  userName: string;
  userPhone: string;
  currentLocation?: Coordinates;
  serviceAreas: ServiceAreaDefinition[];
  distance?: number; // Distance from property in km
  isAvailable: boolean;
  reliabilityScore: number;
  totalJobs: number;
  completedJobs: number;
  completionRate: number;
  averageCompletionTime?: number; // In hours
}

// Proximity-based assignment criteria
export interface ProximityAssignmentCriteria {
  propertyLocation: Coordinates;
  maxDistanceKm: number;
  minReliabilityScore?: number;
  preferredStates?: string[];
  preferredLGAs?: string[];
  excludeUserIds?: string[];
  sortBy: "DISTANCE" | "RELIABILITY" | "COMPLETION_RATE" | "TOTAL_JOBS";
  sortOrder: "ASC" | "DESC";
  limit?: number;
}

// Distance tiers for pricing/priority
export enum DistanceTier {
  VERY_CLOSE = "VERY_CLOSE", // 0-5km
  CLOSE = "CLOSE", // 5-15km
  MODERATE = "MODERATE", // 15-30km
  FAR = "FAR", // 30-50km
  VERY_FAR = "VERY_FAR", // 50km+
}

export interface DistanceTierInfo {
  tier: DistanceTier;
  distanceKm: number;
  estimatedTravelTime: number; // minutes
  additionalFee?: number; // Optional distance-based fee
}

// Geohash for efficient proximity queries
export interface GeohashInfo {
  geohash: string;
  precision: number; // 1-12, higher = more precise
  boundingBox: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
}

// Batch proximity calculation
export interface BatchProximityRequest {
  origin: Coordinates;
  destinations: Array<{
    id: string;
    coordinates: Coordinates;
    metadata?: Record<string, any>;
  }>;
  includeRoute?: boolean;
}

export interface BatchProximityResponse {
  results: Array<{
    id: string;
    distance: DistanceCalculation;
    metadata?: Record<string, any>;
  }>;
  totalProcessed: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

// Helper functions type definitions
export type CalculateDistanceFunction = (
  from: Coordinates,
  to: Coordinates,
  options?: {
    unit?: "km" | "m" | "mi";
    precise?: boolean;
  }
) => number;

export type GetDistanceTierFunction = (distanceKm: number) => DistanceTier;

export type IsWithinRadiusFunction = (
  point: Coordinates,
  center: Coordinates,
  radiusKm: number
) => boolean;

export type CalculateBearingFunction = (
  from: Coordinates,
  to: Coordinates
) => number;