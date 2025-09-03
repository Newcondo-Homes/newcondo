/**
 * Duplicate detection types for property fingerprinting and conflict resolution
 */

import { Coordinates, PropertyBoundaryData } from './boundary';
import { AddressComponents } from './geolocation';

// Duplicate detection statuses (matches Prisma enum)
export type DuplicateStatus = 
  | 'PENDING'
  | 'CONFIRMED_DUPLICATE'
  | 'NOT_DUPLICATE'
  | 'RESOLVED';

// Property fingerprint for duplicate detection
export interface PropertyFingerprint {
  id: string;
  propertyId: string;
  
  // Geospatial fingerprint
  coordinates: Coordinates;
  boundaryHash: string; // Hash of boundary coordinates
  geoHash: string; // Geohash for spatial indexing
  addressHash: string; // Hash of normalized address
  
  // Physical characteristics
  buildingFootprint: number; // Building area in square meters
  buildingHeight?: number; // Estimated height
  buildingOrientation?: number; // Compass orientation (0-360 degrees)
  roofType?: string; // 'flat', 'pitched', 'complex'
  buildingShape?: string; // 'rectangular', 'L-shaped', 'complex'
  
  // Visual characteristics
  dominantColors: string[]; // Hex colors of building exterior
  roofColor: string;
  textureFingerprint?: string; // Hash of building texture patterns
  
  // Structural features
  visibleFeatures: BuildingFeature[];
  
  // Contextual fingerprint
  nearbyLandmarks: NearbyLandmark[];
  streetViewFingerprint?: string; // Hash of street view characteristics
  
  // Temporal data
  satelliteImageDate?: Date; // Date of satellite image used
  imageResolution?: number; // Meters per pixel
  
  // Confidence metrics
  confidenceScore: number; // 0-100 overall confidence
  qualityMetrics: QualityMetrics;
  
  createdAt: Date;
  updatedAt: Date;
}

// Building features for fingerprinting
export interface BuildingFeature {
  type: 
    | 'swimming_pool'
    | 'solar_panels'
    | 'balcony'
    | 'garage'
    | 'garden'
    | 'fence'
    | 'gate'
    | 'driveway'
    | 'antenna'
    | 'air_conditioning'
    | 'chimney'
    | 'extension'
    | 'porch'
    | 'deck'
    | 'shed'
    | 'water_tank';
  
  coordinates: Coordinates;
  size?: number; // Area or length in square meters/meters
  confidence: number; // 0-100 confidence in detection
  detectionMethod: 'visual' | 'satellite' | 'street_view' | 'manual';
}

// Nearby landmarks for contextual fingerprinting
export interface NearbyLandmark {
  type: 
    | 'school'
    | 'hospital'
    | 'church'
    | 'mosque'
    | 'market'
    | 'bank'
    | 'gas_station'
    | 'restaurant'
    | 'park'
    | 'bus_stop'
    | 'intersection'
    | 'bridge'
    | 'water_body'
    | 'hill'
    | 'tower';
  
  name?: string;
  distance: number; // Distance in meters
  bearing: number; // Direction from property (0-360 degrees)
  coordinates: Coordinates;
}

// Quality metrics for fingerprint reliability
export interface QualityMetrics {
  imageClarity: number; // 0-100 satellite image clarity
  boundaryPrecision: number; // 0-100 boundary drawing precision
    featureDetection: number; // 0-100 accuracy of detected features
  temporalRelevance: number; // 0-100 freshness of satellite/street view data
  overallQuality: number; // Weighted score combining all metrics
}

// Extended boundary interface for duplicate detection context
export interface PropertyBoundary extends PropertyBoundaryData {
  source: 'survey' | 'satellite' | 'manual' | 'mixed';
  confidence: number; // 0-100 confidence in accuracy
  verified: boolean;
}

// Duplicate detection result
export interface DuplicateDetectionResult {
  status: DuplicateStatus;
  similarityScore: number; // 0-1 similarity ratio
  matchingFactors: string[];
  differingFactors: string[];
  confidence: number; // 0-1 confidence level
  reviewedBy?: string; // User ID if manually reviewed
  reviewedAt?: Date;
}

// Candidate match for duplicate detection
export interface DuplicateCandidate {
  propertyId: string;
  fingerprint: PropertyFingerprint;
  similarityScore: number;
  confidence: number;
  status: DuplicateStatus;
}
