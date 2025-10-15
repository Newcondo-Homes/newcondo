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





// // apps/platform/types/address.ts

// export interface NigerianState {
//   id: string;
//   name: string;
//   code: string;
// }

// export interface LocalGovernmentArea {
//   id: string;
//   name: string;
//   stateId: string;
// }

// export interface Location {
//   id: string;
//   name: string;
//   lgaId: string;
// }

// export interface HierarchicalAddress {
//   state: NigerianState;
//   lga: LocalGovernmentArea;
//   location: Location;
//   streetAddress?: string;
//   landmarks?: string;
// }

// export interface AddressSelectionState {
//   selectedState?: NigerianState;
//   selectedLga?: LocalGovernmentArea;
//   selectedLocation?: Location;
//   streetAddress?: string;
//   landmarks?: string;
// }

// export interface FormattedAddress {
//   full: string;
//   hierarchical: HierarchicalAddress;
//   displayShort: string; // e.g., "Ikeja, Lagos"
//   displayFull: string; // e.g., "123 Main St, Ikeja, Lagos State"
// }

// // Comprehensive Nigerian States (all 36 states + FCT)
// export const NIGERIAN_STATES: NigerianState[] = [
//   { id: 'ab', name: 'Abia', code: 'AB' },
//   { id: 'ad', name: 'Adamawa', code: 'AD' },
//   { id: 'ak', name: 'Akwa Ibom', code: 'AK' },
//   { id: 'an', name: 'Anambra', code: 'AN' },
//   { id: 'ba', name: 'Bauchi', code: 'BA' },
//   { id: 'by', name: 'Bayelsa', code: 'BY' },
//   { id: 'be', name: 'Benue', code: 'BE' },
//   { id: 'bo', name: 'Borno', code: 'BO' },
//   { id: 'cr', name: 'Cross River', code: 'CR' },
//   { id: 'de', name: 'Delta', code: 'DE' },
//   { id: 'eb', name: 'Ebonyi', code: 'EB' },
//   { id: 'ed', name: 'Edo', code: 'ED' },
//   { id: 'ek', name: 'Ekiti', code: 'EK' },
//   { id: 'en', name: 'Enugu', code: 'EN' },
//   { id: 'fc', name: 'Federal Capital Territory', code: 'FC' },
//   { id: 'go', name: 'Gombe', code: 'GO' },
//   { id: 'im', name: 'Imo', code: 'IM' },
//   { id: 'ji', name: 'Jigawa', code: 'JI' },
//   { id: 'kd', name: 'Kaduna', code: 'KD' },
//   { id: 'kn', name: 'Kano', code: 'KN' },
//   { id: 'kt', name: 'Katsina', code: 'KT' },
//   { id: 'ke', name: 'Kebbi', code: 'KE' },
//   { id: 'ko', name: 'Kogi', code: 'KO' },
//   { id: 'kw', name: 'Kwara', code: 'KW' },
//   { id: 'la', name: 'Lagos', code: 'LA' },
//   { id: 'na', name: 'Nasarawa', code: 'NA' },
//   { id: 'ni', name: 'Niger', code: 'NI' },
//   { id: 'og', name: 'Ogun', code: 'OG' },
//   { id: 'on', name: 'Ondo', code: 'ON' },
//   { id: 'os', name: 'Osun', code: 'OS' },
//   { id: 'oy', name: 'Oyo', code: 'OY' },
//   { id: 'pl', name: 'Plateau', code: 'PL' },
//   { id: 'ri', name: 'Rivers', code: 'RI' },
//   { id: 'so', name: 'Sokoto', code: 'SO' },
//   { id: 'ta', name: 'Taraba', code: 'TA' },
//   { id: 'yo', name: 'Yobe', code: 'YO' },
//   { id: 'za', name: 'Zamfara', code: 'ZA' },
// ];

// // Sample LGAs - This would typically come from a comprehensive database
// export const LAGOS_LGAS: LocalGovernmentArea[] = [
//   { id: 'la-agege', name: 'Agege', stateId: 'la' },
//   { id: 'la-ajeromi', name: 'Ajeromi-Ifelodun', stateId: 'la' },
//   { id: 'la-alimosho', name: 'Alimosho', stateId: 'la' },
//   { id: 'la-amuwo', name: 'Amuwo-Odofin', stateId: 'la' },
//   { id: 'la-apapa', name: 'Apapa', stateId: 'la' },
//   { id: 'la-badagry', name: 'Badagry', stateId: 'la' },
//   { id: 'la-epe', name: 'Epe', stateId: 'la' },
//   { id: 'la-eti-osa', name: 'Eti-Osa', stateId: 'la' },
//   { id: 'la-ibeju-lekki', name: 'Ibeju-Lekki', stateId: 'la' },
//   { id: 'la-ifako-ijaiye', name: 'Ifako-Ijaiye', stateId: 'la' },
//   { id: 'la-ikeja', name: 'Ikeja', stateId: 'la' },
//   { id: 'la-ikorodu', name: 'Ikorodu', stateId: 'la' },
//   { id: 'la-kosofe', name: 'Kosofe', stateId: 'la' },
//   { id: 'la-lagos-island', name: 'Lagos Island', stateId: 'la' },
//   { id: 'la-lagos-mainland', name: 'Lagos Mainland', stateId: 'la' },
//   { id: 'la-mushin', name: 'Mushin', stateId: 'la' },
//   { id: 'la-ojo', name: 'Ojo', stateId: 'la' },
//   { id: 'la-oshodi-isolo', name: 'Oshodi-Isolo', stateId: 'la' },
//   { id: 'la-shomolu', name: 'Shomolu', stateId: 'la' },
//   { id: 'la-surulere', name: 'Surulere', stateId: 'la' },
// ];

// // Sample Locations for Ikeja LGA
// export const IKEJA_LOCATIONS: Location[] = [
//   { id: 'ikeja-allen', name: 'Allen Avenue', lgaId: 'la-ikeja' },
//   { id: 'ikeja-computer-village', name: 'Computer Village', lgaId: 'la-ikeja' },
//   { id: 'ikeja-gra', name: 'GRA Ikeja', lgaId: 'la-ikeja' },
//   { id: 'ikeja-industrial', name: 'Ikeja Industrial Estate', lgaId: 'la-ikeja' },
//   { id: 'ikeja-maryland', name: 'Maryland', lgaId: 'la-ikeja' },
//   { id: 'ikeja-opebi', name: 'Opebi', lgaId: 'la-ikeja' },
//   { id: 'ikeja-oregun', name: 'Oregun', lgaId: 'la-ikeja' },
//   { id: 'ikeja-railway', name: 'Ikeja Along', lgaId: 'la-ikeja' },
// ];

// // Helper function to format address
// export const formatAddress = (
//   address: HierarchicalAddress
// ): FormattedAddress => {
//   const parts: string[] = [];
  
//   if (address.streetAddress) {
//     parts.push(address.streetAddress);
//   }
  
//   parts.push(address.location.name);
//   parts.push(address.lga.name);
//   parts.push(address.state.name);

//   const displayShort = `${address.location.name}, ${address.state.name}`;
//   const displayFull = parts.join(', ');

//   return {
//     full: displayFull,
//     hierarchical: address,
//     displayShort,
//     displayFull,
//   };
// };

// // Helper to validate hierarchical address
// export const isValidHierarchicalAddress = (
//   address: Partial<HierarchicalAddress>
// ): address is HierarchicalAddress => {
//   return !!(
//     address.state &&
//     address.lga &&
//     address.location &&
//     address.lga.stateId === address.state.id &&
//     address.location.lgaId === address.lga.id
//   );
// };

// // Helper to get state by ID
// export const getStateById = (stateId: string): NigerianState | undefined => {
//   return NIGERIAN_STATES.find(state => state.id === stateId);
// };

// // Helper to get state by code
// export const getStateByCode = (code: string): NigerianState | undefined => {
//   return NIGERIAN_STATES.find(state => state.code === code);
// };

// // Type for address validation errors
// export interface AddressValidationError {
//   field: 'state' | 'lga' | 'location' | 'streetAddress';
//   message: string;
// }

// export const validateAddress = (
//   address: Partial<HierarchicalAddress>
// ): AddressValidationError[] => {
//   const errors: AddressValidationError[] = [];

//   if (!address.state) {
//     errors.push({
//       field: 'state',
//       message: 'Please select a state',
//     });
//   }

//   if (!address.lga) {
//     errors.push({
//       field: 'lga',
//       message: 'Please select a local government area',
//     });
//   }

//   if (!address.location) {
//     errors.push({
//       field: 'location',
//       message: 'Please select a location',
//     });
//   }

//   if (address.lga && address.state && address.lga.stateId !== address.state.id) {
//     errors.push({
//       field: 'lga',
//       message: 'Selected LGA does not belong to the selected state',
//     });
//   }

//   if (address.location && address.lga && address.location.lgaId !== address.lga.id) {
//     errors.push({
//       field: 'location',
//       message: 'Selected location does not belong to the selected LGA',
//     });
//   }

//   return errors;
// };