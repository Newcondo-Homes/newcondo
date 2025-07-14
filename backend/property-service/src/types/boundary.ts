// backend/property-service/src/types/boundary.ts

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface PropertyBoundary {
  id: string;
  propertyId: string;
  coordinates: GeoCoordinates[]; // Array of lat/lng points forming the boundary polygon
  centerPoint: GeoCoordinates;
  area: number; // Area in square meters
  buildingFingerprint: string;
  verified: boolean;
  markedBy?: string; // User ID who marked the boundary
  markedAt?: Date;
  boundaryImages?: string[]; // URLs to marking photos
  markingType: BoundaryMarkingType;
}

export enum BoundaryMarkingType {
  OWNER_MARKED = 'owner_marked',
  AGENT_MARKED = 'agent_marked',
  SYSTEM_GENERATED = 'system_generated',
  ADMIN_VERIFIED = 'admin_verified'
}

export interface BoundaryValidationResult {
  isValid: boolean;
  errors: BoundaryValidationError[];
  warnings: BoundaryValidationWarning[];
  suggestedAdjustments?: GeoCoordinates[];
}

export interface BoundaryValidationError {
  code: BoundaryErrorCode;
  message: string;
  coordinates?: GeoCoordinates[];
}

export interface BoundaryValidationWarning {
  code: BoundaryWarningCode;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export enum BoundaryErrorCode {
  INVALID_POLYGON = 'invalid_polygon',
  SELF_INTERSECTING = 'self_intersecting',
  TOO_SMALL = 'too_small',
  TOO_LARGE = 'too_large',
  OVERLAPPING_EXISTING = 'overlapping_existing',
  OUTSIDE_BOUNDS = 'outside_bounds',
  INVALID_COORDINATES = 'invalid_coordinates'
}

export enum BoundaryWarningCode {
  UNUSUAL_SHAPE = 'unusual_shape',
  LARGE_AREA = 'large_area',
  SMALL_AREA = 'small_area',
  NEAR_EXISTING = 'near_existing',
  COMPLEX_SHAPE = 'complex_shape'
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  existingProperties: ExistingPropertyMatch[];
  confidence: number; // 0-1 confidence score
  similarityFactors: SimilarityFactor[];
}

export interface ExistingPropertyMatch {
  propertyId: string;
  ownerId: string;
  ownerName: string;
  propertyTitle: string;
  matchPercentage: number;
  overlappingArea: number; // Square meters
  boundaryCoordinates: GeoCoordinates[];
  createdAt: Date;
}

export interface SimilarityFactor {
  factor: SimilarityFactorType;
  score: number; // 0-1 score
  weight: number; // Weight in overall calculation
  description: string;
}

export enum SimilarityFactorType {
  BOUNDARY_OVERLAP = 'boundary_overlap',
  LOCATION_PROXIMITY = 'location_proximity',
  BUILDING_FEATURES = 'building_features',
  ADDRESS_SIMILARITY = 'address_similarity',
  IMAGE_SIMILARITY = 'image_similarity'
}

export interface BoundaryMarkingRequest {
  propertyId: string;
  coordinates: GeoCoordinates[];
  userLocation: GeoCoordinates;
  mapZoomLevel: number;
  markingTimestamp: Date;
  boundaryImages?: string[];
  markingNotes?: string;
}

export interface BoundaryMarkingResponse {
  success: boolean;
  boundary?: PropertyBoundary;
  validationResult: BoundaryValidationResult;
  duplicateDetection: DuplicateDetectionResult;
  buildingFingerprint: string;
  message: string;
}

export interface BoundaryConflictResolution {
  conflictId: string;
  originalPropertyId: string;
  challengingPropertyId: string;
  conflictType: BoundaryConflictType;
  overlappingArea: number;
  proposedResolution: ResolutionType;
  evidenceUrls: string[];
  adminNotes?: string;
  status: ConflictResolutionStatus;
}

export enum BoundaryConflictType {
  COMPLETE_OVERLAP = 'complete_overlap',
  PARTIAL_OVERLAP = 'partial_overlap',
  ADJACENT_DISPUTE = 'adjacent_dispute',
  DUPLICATE_CLAIM = 'duplicate_claim'
}

export enum ResolutionType {
  APPROVE_ORIGINAL = 'approve_original',
  APPROVE_CHALLENGER = 'approve_challenger',
  REQUIRE_VERIFICATION = 'require_verification',
  SPLIT_PROPERTY = 'split_property',
  REJECT_BOTH = 'reject_both'
}

export enum ConflictResolutionStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated'
}

export interface PropertyFingerprint {
  id: string;
  propertyId: string;
  coordinates: GeoCoordinates[];
  centerPoint: GeoCoordinates;
  buildingDimensions: BuildingDimensions;
  structuralFeatures: StructuralFeature[];
  visualMarkers: VisualMarker[];
  fingerprintHash: string;
  confidence: number;
  createdAt: Date;
}

export interface BuildingDimensions {
  length: number; // meters
  width: number; // meters
  area: number; // square meters
  perimeter: number; // meters
  aspectRatio: number;
}

export interface StructuralFeature {
  type: StructuralFeatureType;
  position: GeoCoordinates;
  dimensions?: { width: number; height: number };
  confidence: number;
}

export enum StructuralFeatureType {
  MAIN_ENTRANCE = 'main_entrance',
  WINDOWS = 'windows',
  ROOF_SHAPE = 'roof_shape',
  DRIVEWAY = 'driveway',
  GARDEN = 'garden',
  FENCE = 'fence',
  BALCONY = 'balcony',
  PARKING = 'parking'
}

export interface VisualMarker {
  type: VisualMarkerType;
  position: GeoCoordinates;
  description: string;
  confidence: number;
}

export enum VisualMarkerType {
  DISTINCTIVE_COLOR = 'distinctive_color',
  ROOF_MATERIAL = 'roof_material',
  ARCHITECTURAL_STYLE = 'architectural_style',
  LANDSCAPING = 'landscaping',
  ADJACENT_LANDMARKS = 'adjacent_landmarks'
}

export interface BoundarySearchQuery {
  centerPoint: GeoCoordinates;
  radius: number; // meters
  excludePropertyIds?: string[];
  includeUnverified?: boolean;
  minArea?: number;
  maxArea?: number;
}

export interface BoundarySearchResult {
  properties: PropertyBoundary[];
  total: number;
  hasMore: boolean;
  searchRadius: number;
  centerPoint: GeoCoordinates;
}

export interface BoundaryStatistics {
  totalBoundaries: number;
  verifiedBoundaries: number;
  pendingBoundaries: number;
  conflictingBoundaries: number;
  averageArea: number;
  averageAccuracy: number;
  recentActivity: {
    markedToday: number;
    markedThisWeek: number;
    markedThisMonth: number;
  };
}

export interface BoundaryValidationConfig {
  minArea: number; // square meters
  maxArea: number; // square meters
  maxVertices: number;
  minVertices: number;
  maxOverlapPercentage: number;
  requiredAccuracy: number; // GPS accuracy in meters
  allowedShapeComplexity: number;
}

export interface MapViewport {
  center: GeoCoordinates;
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  mapType: 'satellite' | 'roadmap' | 'hybrid' | 'terrain';
}