// backend/marking-service/src/types/proximity.ts

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ProximitySearchParams {
  propertyLocation: Coordinates;
  radiusInKm: number;
  userType?: 'AGENT' | 'RENTER'; // Only agents and premium renters
  minReliabilityScore?: number;
  excludeUserIds?: string[];
}

export interface ProximityResult {
  userId: string;
  distance: number; // in kilometers
  userName: string;
  userType: 'AGENT' | 'RENTER';
  reliabilityScore?: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  isAvailableForMarking: boolean;
  serviceAreas: string[];
  lastActive?: Date;
}

export interface ProximitySearchResponse {
  results: ProximityResult[];
  totalFound: number;
  searchRadius: number;
  centerPoint: Coordinates;
  searchedAt: Date;
}

export interface DistanceCalculation {
  from: Coordinates;
  to: Coordinates;
  distanceInKm: number;
  distanceInMeters: number;
}

export interface ServiceArea {
  state: string;
  city: string;
  lga?: string;
  location?: string;
}

export interface ProximityNotification {
  userId: string;
  markingJobId: string;
  distance: number;
  propertyAddress: string;
  estimatedCompensation: number;
  expiresAt: Date;
  notifiedAt: Date;
}

export const PROXIMITY_CONSTANTS = {
  DEFAULT_SEARCH_RADIUS_KM: 10,
  MAX_SEARCH_RADIUS_KM: 50,
  MIN_RELIABILITY_SCORE: 3.0,
  MAX_AGENTS_TO_NOTIFY: 20,
  EARTH_RADIUS_KM: 6371
} as const;