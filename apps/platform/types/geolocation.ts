/**
 * Geolocation-related types for property mapping and location services
 */

// Basic coordinate types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CoordinatesWithAccuracy extends Coordinates {
  accuracy: number; // in meters
  altitude?: number; // in meters
  altitudeAccuracy?: number; // in meters
}

// Geographic bounds
export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Location information
export interface LocationInfo {
  coordinates: CoordinatesWithAccuracy;
  address?: AddressComponents;
  timestamp: Date;
  source: 'gps' | 'network' | 'passive' | 'manual';
  confidence: number; // 0-100 confidence score
}

// Address components
export interface AddressComponents {
  formattedAddress: string;
  streetNumber?: string;
  streetName?: string;
  locality: string; // City
  sublocality?: string; // Area/District
  administrativeAreaLevel1: string; // State/Province
  administrativeAreaLevel2?: string; // LGA/County
  country: string;
  postalCode?: string;
  plusCode?: string; // Google Plus Code
}

// Property location data
export interface PropertyLocation {
  id: string;
  propertyId: string;
  coordinates: Coordinates;
  address: AddressComponents;
  accuracy: number; // Location accuracy in meters
  verified: boolean;
  verificationMethod: 'user' | 'agent' | 'admin' | 'automated';
  verifiedAt?: Date;
  verifiedBy?: string; // User ID who verified
  
  // Metadata
  elevationMeters?: number;
  timezone: string;
  geoHash: string; // For efficient spatial queries
  whatThreeWords?: string; // What3Words address
}

// Geolocation settings and permissions
export interface GeolocationSettings {
  enableHighAccuracy: boolean;
  timeout: number; // in milliseconds
  maximumAge: number; // in milliseconds
  watchPosition: boolean;
  backgroundLocation: boolean;
  autoUpdate: boolean;
}

export interface GeolocationPermissions {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  backgroundAllowed: boolean;
  preciseLocation: boolean; // iOS 14+ feature
}

// Distance and area calculations
export interface DistanceCalculation {
  distance: number; // in meters
  unit: 'meters' | 'kilometers' | 'miles' | 'feet';
  method: 'haversine' | 'vincenty' | 'euclidean';
  accuracy: number; // estimated accuracy of calculation
}

export interface AreaCalculation {
  area: number; // in square meters
  unit: 'sqm' | 'sqkm' | 'sqft' | 'acres' | 'hectares';
  perimeter: number; // in meters
  boundingBox: GeoBounds;
}

// Geofencing
export interface GeofenceRegion {
  id: string;
  name: string;
  center: Coordinates;
  radius: number; // in meters
  shape: 'circle' | 'polygon';
  coordinates?: Coordinates[]; // for polygon geofences
  active: boolean;
  
  // Trigger settings
  enterEvents: boolean;
  exitEvents: boolean;
  dwellTime?: number; // minimum time in region before triggering (seconds)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface GeofenceEvent {
  id: string;
  regionId: string;
  userId: string;
  eventType: 'enter' | 'exit' | 'dwell';
  timestamp: Date;
  location: LocationInfo;
  confidence: number;
  dwellTime?: number; // time spent in region (seconds)
}

// Map display preferences
export interface MapDisplayOptions {
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  zoom: number;
  center: Coordinates;
  tilt?: number; // 0-45 degrees for aerial view
  heading?: number; // 0-360 degrees compass heading
  
  // Layer visibility
  showTraffic: boolean;
  showTransit: boolean;
  showBicycling: boolean;
  showStreetView: boolean;
  
  // Custom layers
  showPropertyBoundaries: boolean;
  showNeighborhoods: boolean;
  showLandmarks: boolean;
  showUtilities: boolean;
}

// Reverse geocoding
export interface ReverseGeocodingResult {
  coordinates: Coordinates;
  address: AddressComponents;
  placeTypes: string[]; // e.g., ['street_address', 'political']
  placeId?: string; // Google Place ID
  confidence: number;
  source: 'google' | 'mapbox' | 'here' | 'opencage';
}

// Forward geocoding
export interface GeocodingQuery {
  address: string;
  country?: string;
  region?: string; // State/Province
  locality?: string; // City
  bounds?: GeoBounds; // Bias results within bounds
  language?: string; // Language for results
}

export interface GeocodingResult {
  query: string;
  results: Array<{
    coordinates: Coordinates;
    address: AddressComponents;
    confidence: number;
    placeId?: string;
    viewport?: GeoBounds; // Recommended viewing bounds
  }>;
  status: 'success' | 'partial' | 'failed';
  source: 'google' | 'mapbox' | 'here' | 'opencage';
}

// Places and points of interest
export interface PlaceDetails {
  placeId: string;
  name: string;
  coordinates: Coordinates;
  address: AddressComponents;
  types: string[]; // e.g., ['restaurant', 'food', 'establishment']
  rating?: number;
  priceLevel?: number; // 0-4 scale
  phoneNumber?: string;
  website?: string;
  openingHours?: Array<{
    day: number; // 0-6 (Sunday to Saturday)
    open: string; // HH:mm format
    close: string; // HH:mm format
  }>;
  photos?: Array<{
    url: string;
    width: number;
    height: number;
    attribution: string;
  }>;
}

// Nearby search
export interface NearbySearchOptions {
  location: Coordinates;
  radius: number; // in meters
  type?: string; // e.g., 'restaurant', 'hospital', 'school'
  keyword?: string;
  language?: string;
  minPrice?: number; // 0-4
  maxPrice?: number; // 0-4
  openNow?: boolean;
}

export interface NearbySearchResult {
  places: PlaceDetails[];
  nextPageToken?: string;
  status: 'success' | 'no_results' | 'over_limit' | 'request_denied' | 'invalid_request';
}

// Route and directions
export interface RouteOptions {
  origin: Coordinates | string;
  destination: Coordinates | string;
  waypoints?: Array<Coordinates | string>;
  mode: 'driving' | 'walking' | 'bicycling' | 'transit';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  units: 'metric' | 'imperial';
  departureTime?: Date;
  arrivalTime?: Date;
}

export interface RouteResult {
  routes: Array<{
    summary: string;
    distance: DistanceCalculation;
    duration: number; // in seconds
    durationInTraffic?: number; // in seconds
    steps: Array<{
      instruction: string;
      distance: DistanceCalculation;
      duration: number;
      startLocation: Coordinates;
      endLocation: Coordinates;
      maneuver?: string;
    }>;
    polyline: string; // Encoded polyline
    bounds: GeoBounds;
  }>;
  status: 'success' | 'not_found' | 'zero_results' | 'over_limit' | 'request_denied';
}

// Location tracking
export interface LocationTrackingOptions {
  accuracy: 'high' | 'balanced' | 'low' | 'passive';
  updateInterval: number; // in milliseconds
  fastestInterval: number; // in milliseconds
  smallestDisplacement: number; // in meters
  maxWaitTime: number; // in milliseconds
  backgroundTracking: boolean;
}

export interface LocationUpdate {
  coordinates: CoordinatesWithAccuracy;
  timestamp: Date;
  speed?: number; // in meters per second
  bearing?: number; // 0-360 degrees
  isFromMockProvider: boolean;
  batteryOptimized: boolean;
}

// Location history
export interface LocationHistoryEntry {
  id: string;
  userId: string;
  coordinates: Coordinates;
  accuracy: number;
  timestamp: Date;
  activity?: 'still' | 'walking' | 'running' | 'bicycling' | 'automotive';
  confidence?: number; // activity detection confidence
  address?: AddressComponents;
  
  // Context information
  purpose?: 'property_visit' | 'marking_job' | 'commute' | 'personal';
  associatedPropertyId?: string;
  associatedJobId?: string;
}

// Offline mapping
export interface OfflineMapRegion {
  id: string;
  name: string;
  bounds: GeoBounds;
  zoomLevels: number[];
  downloadSize: number; // in bytes
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'failed' | 'expired';
  downloadProgress: number; // 0-100 percentage
  downloadedAt?: Date;
  expiresAt?: Date;
  autoUpdate: boolean;
}

// Weather integration (for marking jobs)
export interface WeatherInfo {
  coordinates: Coordinates;
  current: {
    temperature: number; // in Celsius
    humidity: number; // percentage
    windSpeed: number; // km/h
    windDirection: number; // degrees
    visibility: number; // kilometers
    uvIndex: number;
    condition: string; // e.g., 'sunny', 'cloudy', 'rainy'
    conditionCode: string;
  };
  forecast?: Array<{
    date: Date;
    high: number;
    low: number;
    condition: string;
    precipitationChance: number; // percentage
  }>;
  alerts?: Array<{
    type: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
  }>;
}

// Error handling
export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  timestamp: Date;
  retryable: boolean;
  context?: {
    permissions: GeolocationPermissions;
    settings: GeolocationSettings;
    networkStatus: 'online' | 'offline';
    gpsEnabled: boolean;
  };
}