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











// /**
//  * Shared GPS and Proximity Types for Property Marking Service
//  * Location: backend/shared/src/types/geolocation.ts
//  */

// /**
//  * GPS Coordinates interface
//  */
// export interface Coordinates {
//   latitude: number;
//   longitude: number;
// }

// /**
//  * Extended location data with optional metadata
//  */
// export interface LocationData extends Coordinates {
//   accuracy?: number; // Accuracy in meters
//   altitude?: number;
//   altitudeAccuracy?: number;
//   heading?: number; // Direction of travel in degrees
//   speed?: number; // Speed in meters per second
//   timestamp?: Date;
// }

// /**
//  * Structured address following Nigerian geography hierarchy
//  */
// export interface HierarchicalAddress {
//   state: string;
//   lga: string; // Local Government Area
//   city?: string;
//   location: string; // Lowest level location/area
//   streetAddress?: string;
//   landmark?: string;
//   postalCode?: string;
// }

// /**
//  * Complete geolocation data combining coordinates and address
//  */
// export interface GeolocationData {
//   coordinates: Coordinates;
//   address: HierarchicalAddress;
//   accuracy?: number;
//   source?: 'GPS' | 'MANUAL' | 'GEOCODED';
// }

// /**
//  * Distance calculation result
//  */
// export interface DistanceResult {
//   distance: number; // Distance in kilometers
//   unit: 'km' | 'm' | 'mi';
//   fromLocation: Coordinates;
//   toLocation: Coordinates;
// }

// /**
//  * Proximity search parameters
//  */
// export interface ProximitySearchParams {
//   center: Coordinates;
//   radiusKm: number;
//   minRadiusKm?: number; // For ring/donut searches
//   limit?: number; // Maximum results to return
//   excludeIds?: string[]; // IDs to exclude from results
// }

// /**
//  * Proximity search result with distance information
//  */
// export interface ProximityResult<T = any> {
//   item: T;
//   distance: number; // Distance in kilometers
//   coordinates: Coordinates;
// }

// /**
//  * Service area definition for agents
//  */
// export interface ServiceArea {
//   state: string;
//   lgas?: string[]; // Specific LGAs, or all if undefined
//   cities?: string[]; // Specific cities, or all if undefined
//   locations?: string[]; // Specific locations, or all if undefined
//   radiusKm?: number; // Optional radius from a central point
//   centerPoint?: Coordinates; // Center point for radius-based areas
// }

// /**
//  * Bounding box for map regions
//  */
// export interface BoundingBox {
//   northEast: Coordinates;
//   southWest: Coordinates;
// }

// /**
//  * Map viewport definition
//  */
// export interface MapViewport {
//   center: Coordinates;
//   zoom: number;
//   bounds?: BoundingBox;
// }

// /**
//  * Property boundary polygon
//  */
// export interface PropertyBoundary {
//   coordinates: Coordinates[]; // Array of points forming a polygon
//   area?: number; // Area in square meters
//   perimeter?: number; // Perimeter in meters
//   isValid: boolean; // Whether the boundary forms a valid closed polygon
// }

// /**
//  * Property boundary validation result
//  */
// export interface BoundaryValidationResult {
//   isValid: boolean;
//   errors?: string[];
//   warnings?: string[];
//   suggestedFixes?: {
//     description: string;
//     fixedCoordinates?: Coordinates[];
//   }[];
// }

// /**
//  * Proximity zone definition for agent assignment
//  */
// export interface ProximityZone {
//   id: string;
//   name: string;
//   center: Coordinates;
//   radiusKm: number;
//   priority?: number; // Higher priority zones checked first
//   isActive: boolean;
// }

// /**
//  * Agent proximity match result
//  */
// export interface AgentProximityMatch {
//   agentId: string;
//   distance: number; // Distance in kilometers
//   isWithinServiceArea: boolean;
//   zone?: ProximityZone; // Matched proximity zone
//   travelTimeEstimate?: number; // Estimated travel time in minutes
// }

// /**
//  * Geofence definition
//  */
// export interface Geofence {
//   id: string;
//   name: string;
//   boundary: Coordinates[] | PropertyBoundary;
//   type: 'POLYGON' | 'CIRCLE';
//   radius?: number; // For circular geofences in kilometers
//   center?: Coordinates; // For circular geofences
// }

// /**
//  * Geofence check result
//  */
// export interface GeofenceCheckResult {
//   isInside: boolean;
//   geofence: Geofence;
//   distanceToEdge?: number; // Distance to nearest edge in meters
//   nearestPoint?: Coordinates; // Nearest point on the boundary
// }

// /**
//  * Route information between two points
//  */
// export interface RouteInfo {
//   origin: Coordinates;
//   destination: Coordinates;
//   distance: number; // Distance in kilometers
//   duration: number; // Duration in minutes
//   polyline?: string; // Encoded polyline for route visualization
// }

// /**
//  * Batch proximity calculation request
//  */
// export interface BatchProximityRequest {
//   referencePoint: Coordinates;
//   targetPoints: Array<{
//     id: string;
//     coordinates: Coordinates;
//     metadata?: any;
//   }>;
//   maxDistanceKm?: number; // Only include results within this distance
//   sortByDistance?: boolean;
// }

// /**
//  * Batch proximity calculation result
//  */
// export interface BatchProximityResult {
//   referencePoint: Coordinates;
//   results: Array<{
//     id: string;
//     coordinates: Coordinates;
//     distance: number;
//     metadata?: any;
//   }>;
//   totalCount: number;
//   withinRangeCount: number;
// }

// /**
//  * Nigerian state codes
//  */
// export enum NigerianState {
//   ABIA = 'ABIA',
//   ADAMAWA = 'ADAMAWA',
//   AKWA_IBOM = 'AKWA_IBOM',
//   ANAMBRA = 'ANAMBRA',
//   BAUCHI = 'BAUCHI',
//   BAYELSA = 'BAYELSA',
//   BENUE = 'BENUE',
//   BORNO = 'BORNO',
//   CROSS_RIVER = 'CROSS_RIVER',
//   DELTA = 'DELTA',
//   EBONYI = 'EBONYI',
//   EDO = 'EDO',
//   EKITI = 'EKITI',
//   ENUGU = 'ENUGU',
//   FCT = 'FCT',
//   GOMBE = 'GOMBE',
//   IMO = 'IMO',
//   JIGAWA = 'JIGAWA',
//   KADUNA = 'KADUNA',
//   KANO = 'KANO',
//   KATSINA = 'KATSINA',
//   KEBBI = 'KEBBI',
//   KOGI = 'KOGI',
//   KWARA = 'KWARA',
//   LAGOS = 'LAGOS',
//   NASARAWA = 'NASARAWA',
//   NIGER = 'NIGER',
//   OGUN = 'OGUN',
//   ONDO = 'ONDO',
//   OSUN = 'OSUN',
//   OYO = 'OYO',
//   PLATEAU = 'PLATEAU',
//   RIVERS = 'RIVERS',
//   SOKOTO = 'SOKOTO',
//   TARABA = 'TARABA',
//   YOBE = 'YOBE',
//   ZAMFARA = 'ZAMFARA',
// }

// /**
//  * Constants for proximity calculations
//  */
// export const PROXIMITY_CONSTANTS = {
//   // Earth radius in kilometers
//   EARTH_RADIUS_KM: 6371,

//   // Default proximity radius for agent assignment (20km)
//   DEFAULT_AGENT_RADIUS_KM: 20,

//   // Maximum reasonable proximity radius (100km)
//   MAX_PROXIMITY_RADIUS_KM: 100,

//   // Minimum proximity radius (1km)
//   MIN_PROXIMITY_RADIUS_KM: 1,

//   // Default map zoom levels
//   DEFAULT_ZOOM: 15,
//   MAX_ZOOM: 20,
//   MIN_ZOOM: 5,

//   // GPS accuracy thresholds (in meters)
//   EXCELLENT_ACCURACY: 10,
//   GOOD_ACCURACY: 50,
//   ACCEPTABLE_ACCURACY: 100,
//   POOR_ACCURACY: 500,

//   // Property boundary constraints
//   MIN_BOUNDARY_POINTS: 3, // Minimum points to form a polygon
//   MAX_BOUNDARY_POINTS: 100, // Maximum points allowed
//   MIN_PROPERTY_AREA_SQM: 10, // Minimum property area in square meters
//   MAX_PROPERTY_AREA_SQM: 50000, // Maximum property area in square meters (5 hectares)
// } as const;

// /**
//  * Type guard to check if coordinates are valid
//  */
// export function isValidCoordinates(coords: any): coords is Coordinates {
//   return (
//     coords &&
//     typeof coords === 'object' &&
//     typeof coords.latitude === 'number' &&
//     typeof coords.longitude === 'number' &&
//     coords.latitude >= -90 &&
//     coords.latitude <= 90 &&
//     coords.longitude >= -180 &&
//     coords.longitude <= 180
//   );
// }

// /**
//  * Type guard to check if boundary is valid
//  */
// export function isValidBoundary(boundary: any): boundary is PropertyBoundary {
//   return (
//     boundary &&
//     typeof boundary === 'object' &&
//     Array.isArray(boundary.coordinates) &&
//     boundary.coordinates.length >= PROXIMITY_CONSTANTS.MIN_BOUNDARY_POINTS &&
//     boundary.coordinates.every(isValidCoordinates)
//   );
// }