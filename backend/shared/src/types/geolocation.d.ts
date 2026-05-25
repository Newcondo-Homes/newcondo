export interface GeoLocationCoordinates {
    lat: number;
    lng: number;
}
export interface CoordinatesWithAccuracy extends GeoLocationCoordinates {
    accuracy: number;
}
export interface BoundaryPoints {
    northEast: GeoLocationCoordinates;
    southWest: GeoLocationCoordinates;
}
export interface PolygonCoordinates {
    points: GeoLocationCoordinates[];
}
export interface RectangleBounds extends BoundaryPoints {
    center: GeoLocationCoordinates;
    area: number;
}
export interface PropertyBoundary {
    id: string;
    propertyId: string;
    coordinates: RectangleBounds;
    verified: boolean;
    markedAt: Date;
    markedBy: string;
    fingerprint: string;
    accuracy: number;
    zoomLevel: number;
}
export interface GeolocationData {
    coordinates: CoordinatesWithAccuracy;
    timestamp: Date;
    heading?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    speed?: number;
}
export interface GeolocationError {
    code: number;
    message: string;
    type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT';
}
export interface PropertyMarkingSession {
    id: string;
    userId: string;
    propertyId?: string;
    startTime: Date;
    endTime?: Date;
    initialLocation: GeolocationData;
    finalBoundary?: RectangleBounds;
    status: MarkingSessionStatus;
    mapType: 'satellite' | 'roadmap' | 'hybrid';
    zoomLevel: number;
}
export declare enum MarkingSessionStatus {
    STARTED = "STARTED",
    LOCATING = "LOCATING",
    DRAWING = "DRAWING",
    VALIDATING = "VALIDATING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}
export interface DuplicateDetectionResult {
    isDuplicate: boolean;
    existingBoundaries: PropertyBoundary[];
    overlapPercentage: number;
    conflictingPropertyIds: string[];
    confidenceScore: number;
}
export interface BoundaryOverlap {
    propertyId: string;
    overlapArea: number;
    overlapPercentage: number;
    existingBoundary: RectangleBounds;
}
export interface AddressComponents {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeAreaLevel1?: string;
    administrativeAreaLevel2?: string;
    country?: string;
    postalCode?: string;
    formattedAddress: string;
}
export interface LocationContext {
    coordinates: GeoLocationCoordinates;
    address: AddressComponents;
    placeId?: string;
    types: string[];
    timezone?: string;
}
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
export declare enum BoundaryErrorType {
    TOO_LARGE = "TOO_LARGE",
    TOO_SMALL = "TOO_SMALL",
    INVALID_COORDINATES = "INVALID_COORDINATES",
    OUT_OF_BOUNDS = "OUT_OF_BOUNDS",
    OVERLAPS_EXISTING = "OVERLAPS_EXISTING",
    LOW_ACCURACY = "LOW_ACCURACY",
    SUSPICIOUS_SHAPE = "SUSPICIOUS_SHAPE"
}
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
export interface MapViewport {
    center: GeoLocationCoordinates;
    zoom: number;
    bounds: BoundaryPoints;
}
export interface DrawingEvent {
    type: 'rectangle_complete' | 'rectangle_changed' | 'drawing_started';
    coordinates: RectangleBounds;
    timestamp: Date;
}
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
    assignmentType: 'friend' | 'agent';
}
export interface AgentMarkingJob extends RemoteMarkingRequest {
    assignedAgentId?: string;
    status: AgentMarkingStatus;
    estimatedArrival?: Date;
    completionPhotos: string[];
    agentNotes?: string;
    boundaryData?: RectangleBounds;
    qualityScore?: number;
}
export declare enum AgentMarkingStatus {
    QUEUED = "QUEUED",
    ASSIGNED = "ASSIGNED",
    EN_ROUTE = "EN_ROUTE",
    AT_LOCATION = "AT_LOCATION",
    MARKING_IN_PROGRESS = "MARKING_IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}
export interface GeofenceArea {
    center: GeoLocationCoordinates;
    radius: number;
    name: string;
}
export interface ProximityCheck {
    userLocation: GeoLocationCoordinates;
    targetLocation: GeoLocationCoordinates;
    distance: DistanceCalculation;
    withinRange: boolean;
    requiredRadius: number;
}
export interface MapTileInfo {
    x: number;
    y: number;
    z: number;
    url: string;
    type: 'satellite' | 'roadmap' | 'terrain';
}
export interface ImageryMetadata {
    captureDate: Date;
    resolution: number;
    source: string;
    accuracy: 'high' | 'medium' | 'low';
}
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
//# sourceMappingURL=geolocation.d.ts.map