import { NIGERIA_ADDRESS_HIERARCHY } from '../constants/nigeriaAddress';

export interface AddressLevel {
  code: string;
  name: string;
}

export interface HierarchicalAddress {
  state: AddressLevel;
  lga: AddressLevel;
  location: AddressLevel;
}

/**
 * Get all states in Nigeria
 */
export const getAllStates = (): AddressLevel[] => {
  return Object.entries(NIGERIA_ADDRESS_HIERARCHY).map(([code, data]) => ({
    code,
    name: data.name,
  }));
};

/**
 * Get LGAs for a specific state
 */
export const getLGAsByState = (stateCode: string): AddressLevel[] => {
  const state = NIGERIA_ADDRESS_HIERARCHY[stateCode];
  
  if (!state) {
    throw new Error(`State with code ${stateCode} not found`);
  }

  return Object.entries(state.lgas).map(([code, data]) => ({
    code,
    name: data.name,
  }));
};

/**
 * Get locations for a specific LGA
 */
export const getLocationsByLGA = (
  stateCode: string,
  lgaCode: string
): AddressLevel[] => {
  const state = NIGERIA_ADDRESS_HIERARCHY[stateCode];
  
  if (!state) {
    throw new Error(`State with code ${stateCode} not found`);
  }

  const lga = state.lgas[lgaCode];
  
  if (!lga) {
    throw new Error(`LGA with code ${lgaCode} not found in state ${stateCode}`);
  }

  return lga.locations.map((location, index) => ({
    code: `${lgaCode}_LOC_${index}`,
    name: location,
  }));
};

/**
 * Validate hierarchical address
 */
export const validateHierarchicalAddress = (
  stateCode: string,
  lgaCode: string,
  locationName: string
): boolean => {
  try {
    const state = NIGERIA_ADDRESS_HIERARCHY[stateCode];
    if (!state) return false;

    const lga = state.lgas[lgaCode];
    if (!lga) return false;

    return lga.locations.includes(locationName);
  } catch {
    return false;
  }
};

/**
 * Get full address path (State -> LGA -> Location)
 */
export const getFullAddressPath = (
  stateCode: string,
  lgaCode: string,
  locationName: string
): HierarchicalAddress | null => {
  try {
    const state = NIGERIA_ADDRESS_HIERARCHY[stateCode];
    if (!state) return null;

    const lga = state.lgas[lgaCode];
    if (!lga) return null;

    if (!lga.locations.includes(locationName)) return null;

    return {
      state: { code: stateCode, name: state.name },
      lga: { code: lgaCode, name: lga.name },
      location: { code: locationName, name: locationName },
    };
  } catch {
    return null;
  }
};

/**
 * Format address for display
 */
export const formatAddress = (
  stateCode: string,
  lgaCode: string,
  locationName: string
): string => {
  const addressPath = getFullAddressPath(stateCode, lgaCode, locationName);
  
  if (!addressPath) {
    return 'Invalid address';
  }

  return `${addressPath.location.name}, ${addressPath.lga.name}, ${addressPath.state.name}`;
};

/**
 * Search locations across all states
 */
export const searchLocations = (query: string): Array<{
  location: string;
  lga: string;
  state: string;
  stateCode: string;
  lgaCode: string;
}> => {
  const results: Array<{
    location: string;
    lga: string;
    state: string;
    stateCode: string;
    lgaCode: string;
  }> = [];

  const lowerQuery = query.toLowerCase();

  Object.entries(NIGERIA_ADDRESS_HIERARCHY).forEach(([stateCode, stateData]) => {
    Object.entries(stateData.lgas).forEach(([lgaCode, lgaData]) => {
      lgaData.locations.forEach(location => {
        if (location.toLowerCase().includes(lowerQuery)) {
          results.push({
            location,
            lga: lgaData.name,
            state: stateData.name,
            stateCode,
            lgaCode,
          });
        }
      });
    });
  });

  return results;
};

/**
 * Get nearby locations within the same LGA
 */
export const getNearbyLocations = (
  stateCode: string,
  lgaCode: string,
  currentLocation: string
): string[] => {
  try {
    const locations = getLocationsByLGA(stateCode, lgaCode);
    return locations
      .map(loc => loc.name)
      .filter(loc => loc !== currentLocation);
  } catch {
    return [];
  }
};




// // backend/shared/src/utils/addressHierarchy.ts

// /**
//  * Comprehensive Nigerian Address Hierarchy System
//  * Provides structured location data from State → LGA → City/Town → Area
//  */

// export interface NigerianState {
//   code: string;
//   name: string;
//   capital: string;
//   lgas: LGA[];
// }

// export interface LGA {
//   code: string;
//   name: string;
//   locations: Location[];
// }

// export interface Location {
//   code: string;
//   name: string;
//   type: 'CITY' | 'TOWN' | 'VILLAGE' | 'AREA';
//   areas?: string[]; // Sub-areas within location
// }

// export interface HierarchicalAddress {
//   stateCode: string;
//   stateName: string;
//   lgaCode: string;
//   lgaName: string;
//   locationCode: string;
//   locationName: string;
//   area?: string;
//   streetAddress?: string;
//   landmark?: string;
// }

// /**
//  * Nigerian States and their LGAs
//  * This is a comprehensive but simplified structure for demonstration
//  * In production, this should be loaded from a database
//  */
// export const NIGERIAN_STATES: NigerianState[] = [
//   {
//     code: 'LA',
//     name: 'Lagos',
//     capital: 'Ikeja',
//     lgas: [
//       {
//         code: 'LA-IKJ',
//         name: 'Ikeja',
//         locations: [
//           { code: 'LA-IKJ-IKJ', name: 'Ikeja GRA', type: 'AREA', areas: ['Phase 1', 'Phase 2'] },
//           { code: 'LA-IKJ-ALL', name: 'Allen Avenue', type: 'AREA' },
//           { code: 'LA-IKJ-OGU', name: 'Ogba', type: 'AREA', areas: ['Oke-Ira', 'Aguda'] },
//         ],
//       },
//       {
//         code: 'LA-LAI',
//         name: 'Lagos Island',
//         locations: [
//           { code: 'LA-LAI-VI', name: 'Victoria Island', type: 'AREA', areas: ['VI Extension', 'Oniru'] },
//           { code: 'LA-LAI-IKO', name: 'Ikoyi', type: 'AREA', areas: ['Old Ikoyi', 'Banana Island'] },
//           { code: 'LA-LAI-LAG', name: 'Lagos Island Central', type: 'AREA' },
//         ],
//       },
//       {
//         code: 'LA-YAB',
//         name: 'Yaba',
//         locations: [
//           { code: 'LA-YAB-YAB', name: 'Yaba', type: 'AREA', areas: ['Akoka', 'Sabo'] },
//           { code: 'LA-YAB-EBI', name: 'Ebute Metta', type: 'AREA' },
//         ],
//       },
//       {
//         code: 'LA-SUR',
//         name: 'Surulere',
//         locations: [
//           { code: 'LA-SUR-SUR', name: 'Surulere', type: 'AREA', areas: ['Adelabu', 'Ijesha', 'Ojuelegba'] },
//           { code: 'LA-SUR-ITI', name: 'Itire', type: 'AREA' },
//         ],
//       },
//       {
//         code: 'LA-ALI',
//         name: 'Alimosho',
//         locations: [
//           { code: 'LA-ALI-EGU', name: 'Egbeda', type: 'AREA' },
//           { code: 'LA-ALI-IPJ', name: 'Ipaja', type: 'AREA' },
//           { code: 'LA-ALI-IYP', name: 'Iyana Ipaja', type: 'AREA' },
//         ],
//       },
//       {
//         code: 'LA-KOO',
//         name: 'Kosofe',
//         locations: [
//           { code: 'LA-KOO-KET', name: 'Ketu', type: 'AREA' },
//           { code: 'LA-KOO-MAR', name: 'Maryland', type: 'AREA' },
//           { code: 'LA-KOO-ANT', name: 'Anthony', type: 'AREA' },
//         ],
//       },
//       {
//         code: 'LA-EKO',
//         name: 'Eko Atlantic',
//         locations: [
//           { code: 'LA-EKO-EKO', name: 'Eko Atlantic City', type: 'AREA' },
//         ],
//       },
//       {
//         code: 'LA-LKW',
//         name: 'Lekki',
//         locations: [
//           { code: 'LA-LKW-LEK', name: 'Lekki Phase 1', type: 'AREA' },
//           { code: 'LA-LKW-AJA', name: 'Ajah', type: 'AREA' },
//           { code: 'LA-LKW-SAG', name: 'Sangotedo', type: 'AREA' },
//         ],
//       },
//     ],
//   },
//   {
//     code: 'AB',
//     name: 'Abia',
//     capital: 'Umuahia',
//     lgas: [
//       {
//         code: 'AB-UMU',
//         name: 'Umuahia North',
//         locations: [
//           { code: 'AB-UMU-UMU', name: 'Umuahia', type: 'CITY', areas: ['World Bank', 'Ubakala'] },
//         ],
//       },
//       {
//         code: 'AB-ABA',
//         name: 'Aba North',
//         locations: [
//           { code: 'AB-ABA-ABA', name: 'Aba', type: 'CITY', areas: ['Ariaria', 'St. Michael'] },
//         ],
//       },
//     ],
//   },
//   {
//     code: 'FC',
//     name: 'FCT Abuja',
//     capital: 'Abuja',
//     lgas: [
//       {
//         code: 'FC-AMC',
//         name: 'Abuja Municipal',
//         locations: [
//           { code: 'FC-AMC-MAI', name: 'Maitama', type: 'AREA' },
//           { code: 'FC-AMC-ASO', name: 'Asokoro', type: 'AREA' },
//           { code: 'FC-AMC-GRB', name: 'Garki', type: 'AREA', areas: ['Garki 1', 'Garki 2'] },
//           { code: 'FC-AMC-WUS', name: 'Wuse', type: 'AREA', areas: ['Wuse 1', 'Wuse 2'] },
//         ],
//       },
//       {
//         code: 'FC-GWA',
//         name: 'Gwagwalada',
//         locations: [
//           { code: 'FC-GWA-GWA', name: 'Gwagwalada', type: 'CITY' },
//         ],
//       },
//     ],
//   },
//   {
//     code: 'OY',
//     name: 'Oyo',
//     capital: 'Ibadan',
//     lgas: [
//       {
//         code: 'OY-IBA',
//         name: 'Ibadan North',
//         locations: [
//           { code: 'OY-IBA-BOD', name: 'Bodija', type: 'AREA' },
//           { code: 'OY-IBA-SAM', name: 'Sango', type: 'AREA' },
//         ],
//       },
//     ],
//   },
//   {
//     code: 'RI',
//     name: 'Rivers',
//     capital: 'Port Harcourt',
//     lgas: [
//       {
//         code: 'RI-PHC',
//         name: 'Port Harcourt',
//         locations: [
//           { code: 'RI-PHC-GRA', name: 'GRA', type: 'AREA', areas: ['Phase 1', 'Phase 2', 'Phase 3'] },
//           { code: 'RI-PHC-RUM', name: 'Rumuokoro', type: 'AREA' },
//         ],
//       },
//     ],
//   },
//   {
//     code: 'AN',
//     name: 'Anambra',
//     capital: 'Awka',
//     lgas: [
//       {
//         code: 'AN-ONN',
//         name: 'Onitsha North',
//         locations: [
//           { code: 'AN-ONN-ONI', name: 'Onitsha', type: 'CITY', areas: ['Main Market', 'Fegge'] },
//         ],
//       },
//     ],
//   },
// ];

// /**
//  * Get state by code
//  */
// export function getStateByCode(stateCode: string): NigerianState | undefined {
//   return NIGERIAN_STATES.find((state) => state.code === stateCode);
// }

// /**
//  * Get LGA by state code and LGA code
//  */
// export function getLGAByCode(stateCode: string, lgaCode: string): LGA | undefined {
//   const state = getStateByCode(stateCode);
//   return state?.lgas.find((lga) => lga.code === lgaCode);
// }

// /**
//  * Get location by codes
//  */
// export function getLocationByCode(
//   stateCode: string,
//   lgaCode: string,
//   locationCode: string
// ): Location | undefined {
//   const lga = getLGAByCode(stateCode, lgaCode);
//   return lga?.locations.find((loc) => loc.code === locationCode);
// }

// /**
//  * Build full hierarchical address
//  */
// export function buildHierarchicalAddress(
//   stateCode: string,
//   lgaCode: string,
//   locationCode: string,
//   area?: string,
//   streetAddress?: string,
//   landmark?: string
// ): HierarchicalAddress | null {
//   const state = getStateByCode(stateCode);
//   const lga = getLGAByCode(stateCode, lgaCode);
//   const location = getLocationByCode(stateCode, lgaCode, locationCode);

//   if (!state || !lga || !location) {
//     return null;
//   }

//   return {
//     stateCode: state.code,
//     stateName: state.name,
//     lgaCode: lga.code,
//     lgaName: lga.name,
//     locationCode: location.code,
//     locationName: location.name,
//     area,
//     streetAddress,
//     landmark,
//   };
// }

// /**
//  * Format address for display
//  */
// export function formatAddress(address: HierarchicalAddress): string {
//   const parts: string[] = [];

//   if (address.streetAddress) parts.push(address.streetAddress);
//   if (address.area) parts.push(address.area);
//   parts.push(address.locationName);
//   parts.push(address.lgaName);
//   parts.push(address.stateName);

//   return parts.join(', ');
// }

// /**
//  * Get all states (for dropdowns)
//  */
// export function getAllStates(): Array<{ code: string; name: string }> {
//   return NIGERIAN_STATES.map((state) => ({
//     code: state.code,
//     name: state.name,
//   }));
// }

// /**
//  * Get LGAs for a state (for dropdowns)
//  */
// export function getLGAsForState(stateCode: string): Array<{ code: string; name: string }> {
//   const state = getStateByCode(stateCode);
//   if (!state) return [];

//   return state.lgas.map((lga) => ({
//     code: lga.code,
//     name: lga.name,
//   }));
// }

// /**
//  * Get locations for an LGA (for dropdowns)
//  */
// export function getLocationsForLGA(
//   stateCode: string,
//   lgaCode: string
// ): Array<{ code: string; name: string; type: string }> {
//   const lga = getLGAByCode(stateCode, lgaCode);
//   if (!lga) return [];

//   return lga.locations.map((location) => ({
//     code: location.code,
//     name: location.name,
//     type: location.type,
//   }));
// }

// /**
//  * Get areas for a location (for dropdowns)
//  */
// export function getAreasForLocation(
//   stateCode: string,
//   lgaCode: string,
//   locationCode: string
// ): string[] {
//   const location = getLocationByCode(stateCode, lgaCode, locationCode);
//   return location?.areas || [];
// }

// /**
//  * Validate address hierarchy
//  */
// export function validateAddressHierarchy(
//   stateCode: string,
//   lgaCode: string,
//   locationCode: string
// ): { valid: boolean; error?: string } {
//   const state = getStateByCode(stateCode);
//   if (!state) {
//     return { valid: false, error: 'Invalid state code' };
//   }

//   const lga = getLGAByCode(stateCode, lgaCode);
//   if (!lga) {
//     return { valid: false, error: 'Invalid LGA code for selected state' };
//   }

//   const location = getLocationByCode(stateCode, lgaCode, locationCode);
//   if (!location) {
//     return { valid: false, error: 'Invalid location code for selected LGA' };
//   }

//   return { valid: true };
// }

// /**
//  * Search locations by name (fuzzy search)
//  */
// export function searchLocations(query: string): Array<{
//   state: string;
//   lga: string;
//   location: string;
//   fullPath: string;
// }> {
//   const results: Array<{
//     state: string;
//     lga: string;
//     location: string;
//     fullPath: string;
//   }> = [];

//   const normalizedQuery = query.toLowerCase().trim();

//   NIGERIAN_STATES.forEach((state) => {
//     state.lgas.forEach((lga) => {
//       lga.locations.forEach((location) => {
//         if (
//           location.name.toLowerCase().includes(normalizedQuery) ||
//           lga.name.toLowerCase().includes(normalizedQuery) ||
//           state.name.toLowerCase().includes(normalizedQuery)
//         ) {
//           results.push({
//             state: state.name,
//             lga: lga.name,
//             location: location.name,
//             fullPath: `${location.name}, ${lga.name}, ${state.name}`,
//           });
//         }
//       });
//     });
//   });

//   return results;
// }