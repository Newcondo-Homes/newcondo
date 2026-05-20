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
  centerPoint?: ProximityCoordinates;
  radiusKm?: number;
  // For POLYGON type (custom drawn areas)
  polygonCoordinates?: ProximityCoordinates[];
}

export interface ProximityDistanceCalculation {
  from: ProximityCoordinates;
  to: ProximityCoordinates;
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
  startLocation: ProximityCoordinates;
  endLocation: ProximityCoordinates;
}

// Agent availability with proximity
export interface AgentProximityInfo {
  userId: string;
  userName: string;
  userPhone: string;
  currentLocation?: ProximityCoordinates;
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

// Helper functions type definitions
export type CalculateDistanceFunction = (
  from: ProximityCoordinates,
  to: ProximityCoordinates,
  options?: {
    unit?: "km" | "m" | "mi";
    precise?: boolean;
  }
) => number;

export type GetDistanceTierFunction = (distanceKm: number) => DistanceTier;

export type IsWithinRadiusFunction = (
  point: ProximityCoordinates,
  center: ProximityCoordinates,
  radiusKm: number
) => boolean;

export type CalculateBearingFunction = (
  from: ProximityCoordinates,
  to: ProximityCoordinates
) => number;