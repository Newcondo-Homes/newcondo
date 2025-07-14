// backend/property-service/src/types/duplicate.ts

export interface PropertyCoordinates {
  lat: number;
  lng: number;
}

export interface PropertyBoundary {
  coordinates: PropertyCoordinates[];
  type: 'polygon';
}

export interface DuplicateCheckRequest {
  coordinates: PropertyCoordinates;
  boundaryCoordinates: PropertyBoundary | any;
  address: string;
  city: string;
  state: string;
  features: string[];
  images?: string[];
  excludePropertyId?: string;
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  duplicateProperty?: {
    id: string;
    title: string;
    address: string;
    coordinates: PropertyCoordinates;
    ownerId: string;
    createdAt: Date;
  };
  confidence: number;
  reasons: string[];
}

export interface MarkedPropertyOverlay {
  id: string;
  coordinates: PropertyCoordinates;
  boundaryCoordinates: PropertyBoundary | any;
  isOwn: boolean;
  ownerId: string;
  status: 'verified' | 'pending' | 'disputed';
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface DuplicateReportRequest {
  originalPropertyId: string;
  duplicatePropertyId: string;
  reportedBy?: string;
  reason?: string;
}

export interface BoundaryValidationRequest {
  boundaryCoordinates: PropertyBoundary | any;
  maxAreaSquareMeters?: number;
}

export interface BoundaryValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  calculatedArea?: number;
}

export interface PropertyFingerprintRequest {
  coordinates: PropertyCoordinates;
  boundaryCoordinates: PropertyBoundary | any;
  address: string;
  features: string[];
  images?: string[];
}

export interface PropertyFingerprintResponse {
  fingerprint: string;
  components: {
    coordinatesHash: string;
    boundaryHash: string;
    addressHash: string;
    featuresHash: string;
    imageFingerprints?: string[];
  };
}

export interface DuplicateDetectionMetrics {
  totalProperties: number;
  duplicatesFound: number;
  falsePositives: number;
  averageConfidence: number;
  processingTime: number;
}

export interface ConflictResolutionData {
  conflictType: 'boundary_overlap' | 'address_duplicate' | 'coordinate_duplicate';
  involvedProperties: string[];
  resolutionRequired: boolean;
  suggestedAction: 'merge' | 'separate' | 'admin_review';
  confidence: number;
}

export interface PropertyClusterAnalysis {
  clusterId: string;
  properties: string[];
  centerCoordinates: PropertyCoordinates;
  averageDistance: number;
  suspiciousActivity: boolean;
  clusterType: 'legitimate' | 'suspicious' | 'duplicate_farm';
}