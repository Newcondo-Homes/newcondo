/**
 * Boundary-related types for property mapping and verification
 */

// Coordinate system types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Property boundary polygon
export interface BoundaryPolygon {
  coordinates: Coordinates[];
  center: Coordinates;
  area: number; // in square meters
  perimeter: number; // in meters
}

// Boundary drawing states
export type BoundaryDrawingMode = 'idle' | 'drawing' | 'editing' | 'complete';

export interface BoundaryDrawingState {
  mode: BoundaryDrawingMode;
  currentPoints: Coordinates[];
  isValid: boolean;
  area: number;
  errors: string[];
}

// Map view configuration
export interface MapViewConfig {
  center: Coordinates;
  zoom: number;
  mapTypeId: 'satellite' | 'roadmap' | 'hybrid' | 'terrain';
  tilt?: number; // For satellite view
}

// Boundary validation rules
export interface BoundaryValidationRules {
  minArea: number; // Minimum area in square meters
  maxArea: number; // Maximum area in square meters
  minPoints: number; // Minimum polygon points
  maxPoints: number; // Maximum polygon points
  allowSelfIntersection: boolean;
  bufferDistance: number; // Minimum distance from other properties
}

// Property boundary data as stored in database
export interface PropertyBoundaryData {
  id: string;
  propertyId: string;
  coordinates: Coordinates[];
  center: Coordinates;
  area: number;
  perimeter: number;
  boundingBox: BoundingBox;
  verified: boolean;
  verifiedBy?: string; // User ID or agent ID
  verifiedAt?: Date;
  confidence: number; // 0-100 confidence score
  source: 'user_drawn' | 'agent_marked' | 'satellite_detected';
  metadata: {
    zoomLevel: number;
    mapType: string;
    deviceInfo?: string;
    timestamp: Date;
  };
}

// Boundary conflict/overlap detection
export interface BoundaryConflict {
  type: 'overlap' | 'adjacent' | 'contained' | 'contains';
  severity: 'low' | 'medium' | 'high' | 'critical';
  overlapArea: number;
  overlapPercentage: number;
  conflictingPropertyId: string;
  description: string;
  resolution?: 'pending' | 'resolved' | 'disputed';
}

// Street view integration
export interface StreetViewConfig {
  position: Coordinates;
  heading: number; // 0-360 degrees
  pitch: number; // -90 to 90 degrees
  zoom: number; // 0-4
}

export interface StreetViewMarker {
  position: Coordinates;
  description: string;
  images?: string[];
  timestamp: Date;
}

// Boundary verification status
export type BoundaryVerificationStatus = 
  | 'unverified'
  | 'user_verified'
  | 'agent_verified'
  | 'admin_verified'
  | 'disputed'
  | 'rejected';

// Boundary validation result
export interface BoundaryValidationResult {
  isValid: boolean;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    code: string;
    message: string;
    suggestion?: string;
  }>;
  conflicts: BoundaryConflict[];
  suggestedAdjustments?: {
    coordinates: Coordinates[];
    reason: string;
  };
}

// Map overlay types
export interface PropertyOverlay {
  propertyId: string;
  coordinates: Coordinates[];
  status: 'claimed' | 'verified' | 'disputed' | 'available';
  color: string;
  opacity: number;
  strokeColor: string;
  strokeWeight: number;
  title?: string;
  description?: string;
}

// Interactive drawing tools
export interface DrawingTools {
  polygon: boolean;
  rectangle: boolean;
  circle: boolean;
  freehand: boolean;
  edit: boolean;
  delete: boolean;
  measure: boolean;
}

export interface DrawingOptions {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
  editable: boolean;
  draggable: boolean;
}

// Boundary history tracking
export interface BoundaryHistory {
  id: string;
  propertyId: string;
  coordinates: Coordinates[];
  timestamp: Date;
  userId: string;
  action: 'created' | 'modified' | 'verified' | 'disputed';
  reason?: string;
  previousVersion?: {
    coordinates: Coordinates[];
    timestamp: Date;
  };
}