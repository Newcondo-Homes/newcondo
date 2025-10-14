/**
 * Nigerian Address Types
 * Location: apps/platform/types/address.ts
 * Hierarchical address structure for Nigerian geography
 */

export interface State {
  id: string;
  name: string;
  code: string; // e.g., "LA" for Lagos
  region: GeopoliticalZone;
  capital: string;
}

export interface LGA {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  population?: number;
}

export interface Location {
  id: string;
  name: string;
  lgaId: string;
  lgaName: string;
  stateId: string;
  stateName: string;
  landmarks?: string[];
  postalCode?: string;
}

export interface HierarchicalAddress {
  state: State;
  lga: LGA;
  location: Location;
  streetAddress?: string;
  landmark?: string;
  additionalInfo?: string;
  coordinates?: GeoCoordinates;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

export enum GeopoliticalZone {
  NORTH_CENTRAL = 'NORTH_CENTRAL',
  NORTH_EAST = 'NORTH_EAST',
  NORTH_WEST = 'NORTH_WEST',
  SOUTH_EAST = 'SOUTH_EAST',
  SOUTH_SOUTH = 'SOUTH_SOUTH',
  SOUTH_WEST = 'SOUTH_WEST',
}

export interface AddressFormData {
  stateId: string;
  stateName: string;
  lgaId: string;
  lgaName: string;
  locationId: string;
  locationName: string;
  streetAddress: string;
  landmark?: string;
  additionalInfo?: string;
}

export interface PropertyAddress extends HierarchicalAddress {
  propertyId?: string;
  isVerified: boolean;
  verifiedAt?: string;
  gpsCoordinates: GeoCoordinates;
  boundaryCoordinates?: BoundaryCoordinates;
  accessInstructions?: string;
}

export interface BoundaryCoordinates {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][]; // GeoJSON format
  area?: number; // in square meters
  perimeter?: number; // in meters
}

export interface AddressSearchQuery {
  query: string;
  stateId?: string;
  lgaId?: string;
  limit?: number;
  includeNearby?: boolean;
}

export interface AddressSearchResult {
  id: string;
  fullAddress: string;
  state: string;
  lga: string;
  location: string;
  coordinates?: GeoCoordinates;
  relevanceScore: number;
}

export interface ProximitySearch {
  coordinates: GeoCoordinates;
  radiusKm: number;
  stateId?: string;
  lgaId?: string;
}

export interface ProximityResult {
  location: Location;
  distance: number; // in kilometers
  duration?: number; // estimated travel time in minutes
}

// For property marking service - finding agents nearby
export interface ServiceArea {
  agentId: string;
  states: string[];
  lgas: string[];
  locations: string[];
  operatingRadius?: number; // in kilometers
  isActive: boolean;
}

export interface AgentProximity {
  agentId: string;
  distance: number;
  duration?: number;
  serviceArea: ServiceArea;
  isAvailable: boolean;
  reliabilityScore: number;
  completedJobs: number;
}

// Address validation
export interface AddressValidation {
  isValid: boolean;
  errors: AddressValidationError[];
  suggestions?: HierarchicalAddress[];
}

export interface AddressValidationError {
  field: 'state' | 'lga' | 'location' | 'streetAddress' | 'coordinates';
  message: string;
  code: string;
}

// Distance and proximity utilities
export interface DistanceMatrix {
  from: GeoCoordinates;
  to: GeoCoordinates;
  distanceKm: number;
  durationMinutes?: number;
  route?: GeoCoordinates[];
}

// For contact person location
export interface ContactPersonLocation {
  name: string;
  phone: string;
  address: HierarchicalAddress;
  availability?: {
    days: string[];
    timeRanges: Array<{
      start: string;
      end: string;
    }>;
  };
}

// Formatted address display
export interface FormattedAddress {
  short: string; // "Ikeja, Lagos"
  medium: string; // "Ikeja LGA, Lagos State"
  full: string; // "123 Allen Avenue, Ikeja LGA, Lagos State, Nigeria"
  withLandmark?: string; // "123 Allen Avenue (near Ikeja Mall), Ikeja, Lagos"
}

// Address autocomplete
export interface AddressAutocompleteOption {
  id: string;
  label: string;
  type: 'state' | 'lga' | 'location' | 'street';
  parent?: string;
  coordinates?: GeoCoordinates;
}

// Utility type for address selection flow
export interface AddressSelectionState {
  selectedState?: State;
  selectedLGA?: LGA;
  selectedLocation?: Location;
  streetAddress?: string;
  isComplete: boolean;
  coordinates?: GeoCoordinates;
}

// For storing frequently used addresses
export interface SavedAddress {
  id: string;
  userId: string;
  label: string; // "Home", "Office", etc.
  address: HierarchicalAddress;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Nigerian regions data structure
export interface NigeriaRegionsData {
  zones: GeopoliticalZone[];
  states: State[];
  lgas: LGA[];
  locations: Location[];
}