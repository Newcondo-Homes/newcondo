// Core coordinate types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CoordinatesWithAccuracy extends Coordinates {
  accuracy: number; // GPS accuracy in meters
}

// Boundary and polygon types
export interface BoundaryPoints {
  northEast: Coordinates;
  southWest: Coordinates;
}

export interface PolygonCoordinates {
  points: Coordinates[];
}

export interface RectangleBounds extends BoundaryPoints {
  center: Coordinates;
  area: number; // Area in square meters
}

// Property boundary specific types
export interface PropertyBoundary {
  id: string;
  propertyId: string;
  coordinates: RectangleBounds;
  verified: boolean;
  markedAt: Date;
  markedBy: string; // User ID or agent ID
  fingerprint: string; // Unique identifier for duplicate detection
  accuracy: number; // GPS accuracy when boundary was marked
  zoomLevel: number; // Zoom level when boundary was marked
}

// Geolocation detection and validation
export interface GeolocationData {
  coordinates: CoordinatesWithAccuracy;
  timestamp: Date;
  heading?: number; // Device compass heading in degrees
  altitude?: number; // Altitude in meters
  altitudeAccuracy?: number; // Altitude accuracy in meters
  speed?: number; // Speed in meters per second
}

export interface GeolocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT';
}

// Property marking specific types
export interface PropertyMarkingSession {
  id: string;
  userId: string;
  propertyId?: string; // May not exist yet for new properties
  startTime: Date;
  endTime?: Date;
  initialLocation: GeolocationData;
  finalBoundary?: RectangleBounds;
  status: MarkingSessionStatus;
  mapType: 'satellite' | 'roadmap' | 'hybrid';
  zoomLevel: number;
}

export enum MarkingSessionStatus {
  STARTED = 'STARTED',
  LOCATING = 'LOCATING',
  DRAWING = 'DRAWING',
  VALIDATING = 'VALIDATING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

// Duplicate detection types
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  existingBoundaries: PropertyBoundary[];
  overlapPercentage: number;
  conflictingPropertyIds: string[];
  confidenceScore: number; // 0-1 confidence in duplicate detection
}

export interface BoundaryOverlap {
  propertyId: string;
  overlapArea: number; // Square meters of overlap
  overlapPercentage: number; // Percentage of current boundary that overlaps
  existingBoundary: RectangleBounds;
}

// Address and location context
export interface AddressComponents {
  streetNumber?: string;
  route?: string; // Street name
  locality?: string; // City/town
  administrativeAreaLevel1?: string; // State/province
  administrativeAreaLevel2?: string; // County/LGA
  country?: string;
  postalCode?: string;
  formattedAddress: string;
}

export interface LocationContext {
  coordinates: Coordinates;
  address: AddressComponents;
  placeId?: string; // Google Places ID
  types: string[]; // Google Places types
  timezone?: string;
}

// Validation and accuracy types
export interface BoundaryValidationResult {
  isValid: boolean;
  errors: BoundaryValidationError[];
  warnings: string[];
  suggestedCorrections?: RectangleBounds;
}

export interface BoundaryValidationError {
  type: BoundaryErrorType;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export enum BoundaryErrorType {
  TOO_LARGE = 'TOO_LARGE',
  TOO_SMALL = 'TOO_SMALL',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
  OVERLAPS_EXISTING = 'OVERLAPS_EXISTING',
  LOW_ACCURACY = 'LOW_ACCURACY',
  SUSPICIOUS_SHAPE = 'SUSPICIOUS_SHAPE',
}

// Distance and area calculations
export interface DistanceCalculation {
  meters: number;
  kilometers: number;
  feet: number;
  miles: number;
}

export interface AreaCalculation {
  squareMeters: number;
  squareKilometers: number;
  squareFeet: number;
  acres: number;
}

// Map interaction types
export interface MapViewport {
  center: Coordinates;
  zoom: number;
  bounds: BoundaryPoints;
}

export interface DrawingEvent {
  type: 'rectangle_complete' | 'rectangle_changed' | 'drawing_started';
  coordinates: RectangleBounds;
  timestamp: Date;
}

// Remote marking service types
export interface RemoteMarkingRequest {
  id: string;
  propertyId: string;
  requestedBy: string;
  contactPerson: {
    name: string;
    phone: string;
    alternatePhone?: string;
  };
  propertyAddress: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: 'low' | 'normal' | 'high' | 'urgent';
  paymentStatus: 'pending' | 'paid' | 'failed';
  assignmentType: 'friend' | 'agent'; // Ask someone you know vs Newcondo agent
}

export interface AgentMarkingJob extends RemoteMarkingRequest {
  assignedAgentId?: string;
  status: AgentMarkingStatus;
  estimatedArrival?: Date;
  completionPhotos: string[];
  agentNotes?: string;
  boundaryData?: RectangleBounds;
  qualityScore?: number; // 1-5 rating of marking quality
}

export enum AgentMarkingStatus {
  QUEUED = 'QUEUED',
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE = 'EN_ROUTE',
  AT_LOCATION = 'AT_LOCATION',
  MARKING_IN_PROGRESS = 'MARKING_IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

// Geofencing and proximity types
export interface GeofenceArea {
  center: Coordinates;
  radius: number; // Radius in meters
  name: string;
}

export interface ProximityCheck {
  userLocation: Coordinates;
  targetLocation: Coordinates;
  distance: DistanceCalculation;
  withinRange: boolean;
  requiredRadius: number; // Required proximity in meters
}

// Map tile and imagery types
export interface MapTileInfo {
  x: number;
  y: number;
  z: number; // Zoom level
  url: string;
  type: 'satellite' | 'roadmap' | 'terrain';
}

export interface ImageryMetadata {
  captureDate: Date;
  resolution: number; // Meters per pixel
  source: string;
  accuracy: 'high' | 'medium' | 'low';
}

// Export utility types
export type PropertyBoundaryWithMetadata = PropertyBoundary & {
  locationContext: LocationContext;
  validationResult: BoundaryValidationResult;
  imageMetadata?: ImageryMetadata;
};

export type MarkingSessionWithDetails = PropertyMarkingSession & {
  locationContext: LocationContext;
  duplicateCheck?: DuplicateDetectionResult;
  validationResult?: BoundaryValidationResult;
};

// Common response types for API
export interface GeolocationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: GeolocationError | BoundaryValidationError[];
  metadata?: {
    processingTime: number;
    accuracy: number;
    confidence: number;
  };
}