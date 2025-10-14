// apps/platform/lib/api/address.ts
import { apiClient } from './client';

/**
 * Address API Client
 * Handles hierarchical Nigerian address structure (State > LGA > City/Location)
 */

export interface State {
  id: string;
  name: string;
  code: string; // e.g., "LA" for Lagos
  zone: string; // Geopolitical zone (South West, North Central, etc.)
}

export interface LGA {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
}

export interface Location {
  id: string;
  name: string;
  lgaId: string;
  lgaName: string;
  stateId: string;
  stateName: string;
  postalCode?: string;
}

export interface AddressHierarchy {
  state: State;
  lga: LGA;
  location: Location;
}

export interface GetStatesResponse {
  success: boolean;
  data: State[];
  total: number;
}

export interface GetLGAsRequest {
  stateId: string;
}

export interface GetLGAsResponse {
  success: boolean;
  data: LGA[];
  total: number;
  state: State;
}

export interface GetLocationsRequest {
  lgaId: string;
}

export interface GetLocationsResponse {
  success: boolean;
  data: Location[];
  total: number;
  lga: LGA;
  state: State;
}

export interface SearchAddressRequest {
  query: string;
  stateId?: string;
  lgaId?: string;
  limit?: number;
}

export interface SearchAddressResponse {
  success: boolean;
  data: {
    states: State[];
    lgas: LGA[];
    locations: Location[];
  };
  total: number;
}

export interface ValidateAddressRequest {
  stateId: string;
  lgaId: string;
  locationId: string;
}

export interface ValidateAddressResponse {
  success: boolean;
  data: {
    isValid: boolean;
    hierarchy: AddressHierarchy;
  };
  message: string;
}

export interface GetAddressHierarchyRequest {
  locationId: string;
}

export interface GetAddressHierarchyResponse {
  success: boolean;
  data: AddressHierarchy;
}

export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResponse {
  success: boolean;
  data: {
    formattedAddress: string;
    suggestedHierarchy?: AddressHierarchy;
    googlePlaceId?: string;
    addressComponents: Array<{
      longName: string;
      shortName: string;
      types: string[];
    }>;
  };
}

export interface NearbyLocationsRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number; // Default 5km
  limit?: number; // Default 10
}

export interface NearbyLocationsResponse {
  success: boolean;
  data: Array<{
    location: Location;
    distance: number; // In kilometers
  }>;
}

/**
 * Get all Nigerian states
 */
export async function getStates(): Promise<GetStatesResponse> {
  const response = await apiClient.get<GetStatesResponse>('/api/address/states');
  return response.data;
}

/**
 * Get LGAs for a specific state
 */
export async function getLGAs(stateId: string): Promise<GetLGAsResponse> {
  const response = await apiClient.get<GetLGAsResponse>(
    `/api/address/states/${stateId}/lgas`
  );
  return response.data;
}

/**
 * Get locations/cities for a specific LGA
 */
export async function getLocations(lgaId: string): Promise<GetLocationsResponse> {
  const response = await apiClient.get<GetLocationsResponse>(
    `/api/address/lgas/${lgaId}/locations`
  );
  return response.data;
}

/**
 * Search across states, LGAs, and locations
 */
export async function searchAddress(
  params: SearchAddressRequest
): Promise<SearchAddressResponse> {
  const response = await apiClient.get<SearchAddressResponse>(
    '/api/address/search',
    { params }
  );
  return response.data;
}

/**
 * Validate a complete address hierarchy
 */
export async function validateAddress(
  data: ValidateAddressRequest
): Promise<ValidateAddressResponse> {
  const response = await apiClient.post<ValidateAddressResponse>(
    '/api/address/validate',
    data
  );
  return response.data;
}

/**
 * Get complete address hierarchy from location ID
 */
export async function getAddressHierarchy(
  locationId: string
): Promise<GetAddressHierarchyResponse> {
  const response = await apiClient.get<GetAddressHierarchyResponse>(
    `/api/address/locations/${locationId}/hierarchy`
  );
  return response.data;
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  params: ReverseGeocodeRequest
): Promise<ReverseGeocodeResponse> {
  const response = await apiClient.post<ReverseGeocodeResponse>(
    '/api/address/reverse-geocode',
    params
  );
  return response.data;
}

/**
 * Find nearby locations based on coordinates
 */
export async function getNearbyLocations(
  params: NearbyLocationsRequest
): Promise<NearbyLocationsResponse> {
  const response = await apiClient.get<NearbyLocationsResponse>(
    '/api/address/nearby',
    { params }
  );
  return response.data;
}

/**
 * Format address hierarchy as string
 */
export function formatAddressHierarchy(hierarchy: AddressHierarchy): string {
  return `${hierarchy.location.name}, ${hierarchy.lga.name}, ${hierarchy.state.name}`;
}

/**
 * Format address with optional street address
 */
export function formatFullAddress(
  streetAddress: string,
  hierarchy: AddressHierarchy
): string {
  return `${streetAddress}, ${formatAddressHierarchy(hierarchy)}`;
}

/**
 * Extract state code from state ID
 */
export function extractStateCode(stateId: string): string {
  // Assuming state IDs follow pattern like "state_LA_001"
  const parts = stateId.split('_');
  return parts.length >= 2 ? parts[1] : '';
}

/**
 * Check if two addresses are in the same LGA
 */
export function isSameLGA(
  hierarchy1: AddressHierarchy,
  hierarchy2: AddressHierarchy
): boolean {
  return hierarchy1.lga.id === hierarchy2.lga.id;
}

/**
 * Check if two addresses are in the same state
 */
export function isSameState(
  hierarchy1: AddressHierarchy,
  hierarchy2: AddressHierarchy
): boolean {
  return hierarchy1.state.id === hierarchy2.state.id;
}

/**
 * Calculate approximate distance category between two addresses
 */
export function getDistanceCategory(
  hierarchy1: AddressHierarchy,
  hierarchy2: AddressHierarchy
): 'same_location' | 'same_lga' | 'same_state' | 'different_state' {
  if (hierarchy1.location.id === hierarchy2.location.id) {
    return 'same_location';
  }
  if (hierarchy1.lga.id === hierarchy2.lga.id) {
    return 'same_lga';
  }
  if (hierarchy1.state.id === hierarchy2.state.id) {
    return 'same_state';
  }
  return 'different_state';
}

/**
 * Get geopolitical zones
 */
export const GEOPOLITICAL_ZONES = {
  NORTH_CENTRAL: 'North Central',
  NORTH_EAST: 'North East',
  NORTH_WEST: 'North West',
  SOUTH_EAST: 'South East',
  SOUTH_SOUTH: 'South South',
  SOUTH_WEST: 'South West',
} as const;

/**
 * Popular states for quick access
 */
export const POPULAR_STATES = [
  'Lagos',
  'Abuja',
  'Kano',
  'Rivers',
  'Oyo',
  'Kaduna',
  'Anambra',
  'Edo',
] as const;

/**
 * Validate location selection is complete
 */
export function isAddressComplete(address: Partial<AddressHierarchy>): boolean {
  return !!(address.state && address.lga && address.location);
}

/**
 * Get user-friendly error messages for address validation
 */
export function getAddressValidationError(
  address: Partial<AddressHierarchy>
): string | null {
  if (!address.state) {
    return 'Please select a state';
  }
  if (!address.lga) {
    return 'Please select an LGA';
  }
  if (!address.location) {
    return 'Please select a location';
  }
  return null;
}

/**
 * Sort states alphabetically
 */
export function sortStates(states: State[]): State[] {
  return [...states].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort LGAs alphabetically
 */
export function sortLGAs(lgas: LGA[]): LGA[] {
  return [...lgas].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort locations alphabetically
 */
export function sortLocations(locations: Location[]): Location[] {
  return [...locations].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter locations by search query
 */
export function filterLocations(
  locations: Location[],
  query: string
): Location[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return locations;

  return locations.filter(
    (location) =>
      location.name.toLowerCase().includes(lowerQuery) ||
      location.lgaName.toLowerCase().includes(lowerQuery) ||
      location.postalCode?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Group locations by first letter
 */
export function groupLocationsByLetter(
  locations: Location[]
): Record<string, Location[]> {
  const grouped: Record<string, Location[]> = {};

  locations.forEach((location) => {
    const firstLetter = location.name.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(location);
  });

  return grouped;
}