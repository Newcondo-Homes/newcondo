// backend/shared/src/utils/addressHierarchy.ts

/**
 * Comprehensive Nigerian Address Hierarchy System
 * Provides structured location data from State → LGA → City/Town → Area
 */

interface NigerianState {
  code: string;
  name: string;
  capital: string;
  lgas: LGA[];
}

interface LGA {
  code: string;
  name: string;
  locations: Location[];
}

interface Location {
  code: string;
  name: string;
  type: 'CITY' | 'TOWN' | 'VILLAGE' | 'AREA';
  areas?: string[]; // Sub-areas within location
}

export interface HierarchicalAddress {
  stateCode: string;
  stateName: string;
  lgaCode: string;
  lgaName: string;
  locationCode: string;
  locationName: string;
  area?: string;
  streetAddress?: string;
  landmark?: string;
}

/**
 * Nigerian States and their LGAs
 * This is a comprehensive but simplified structure for demonstration
 * In production, this should be loaded from a database
 */
const NIGERIAN_STATES: NigerianState[] = [
  {
    code: 'LA',
    name: 'Lagos',
    capital: 'Ikeja',
    lgas: [
      {
        code: 'LA-IKJ',
        name: 'Ikeja',
        locations: [
          { code: 'LA-IKJ-IKJ', name: 'Ikeja GRA', type: 'AREA', areas: ['Phase 1', 'Phase 2'] },
          { code: 'LA-IKJ-ALL', name: 'Allen Avenue', type: 'AREA' },
          { code: 'LA-IKJ-OGU', name: 'Ogba', type: 'AREA', areas: ['Oke-Ira', 'Aguda'] },
        ],
      },
      {
        code: 'LA-LAI',
        name: 'Lagos Island',
        locations: [
          { code: 'LA-LAI-VI', name: 'Victoria Island', type: 'AREA', areas: ['VI Extension', 'Oniru'] },
          { code: 'LA-LAI-IKO', name: 'Ikoyi', type: 'AREA', areas: ['Old Ikoyi', 'Banana Island'] },
          { code: 'LA-LAI-LAG', name: 'Lagos Island Central', type: 'AREA' },
        ],
      },
      {
        code: 'LA-YAB',
        name: 'Yaba',
        locations: [
          { code: 'LA-YAB-YAB', name: 'Yaba', type: 'AREA', areas: ['Akoka', 'Sabo'] },
          { code: 'LA-YAB-EBI', name: 'Ebute Metta', type: 'AREA' },
        ],
      },
      {
        code: 'LA-SUR',
        name: 'Surulere',
        locations: [
          { code: 'LA-SUR-SUR', name: 'Surulere', type: 'AREA', areas: ['Adelabu', 'Ijesha', 'Ojuelegba'] },
          { code: 'LA-SUR-ITI', name: 'Itire', type: 'AREA' },
        ],
      },
      {
        code: 'LA-ALI',
        name: 'Alimosho',
        locations: [
          { code: 'LA-ALI-EGU', name: 'Egbeda', type: 'AREA' },
          { code: 'LA-ALI-IPJ', name: 'Ipaja', type: 'AREA' },
          { code: 'LA-ALI-IYP', name: 'Iyana Ipaja', type: 'AREA' },
        ],
      },
      {
        code: 'LA-KOO',
        name: 'Kosofe',
        locations: [
          { code: 'LA-KOO-KET', name: 'Ketu', type: 'AREA' },
          { code: 'LA-KOO-MAR', name: 'Maryland', type: 'AREA' },
          { code: 'LA-KOO-ANT', name: 'Anthony', type: 'AREA' },
        ],
      },
      {
        code: 'LA-EKO',
        name: 'Eko Atlantic',
        locations: [
          { code: 'LA-EKO-EKO', name: 'Eko Atlantic City', type: 'AREA' },
        ],
      },
      {
        code: 'LA-LKW',
        name: 'Lekki',
        locations: [
          { code: 'LA-LKW-LEK', name: 'Lekki Phase 1', type: 'AREA' },
          { code: 'LA-LKW-AJA', name: 'Ajah', type: 'AREA' },
          { code: 'LA-LKW-SAG', name: 'Sangotedo', type: 'AREA' },
        ],
      },
    ],
  },
  {
    code: 'AB',
    name: 'Abia',
    capital: 'Umuahia',
    lgas: [
      {
        code: 'AB-UMU',
        name: 'Umuahia North',
        locations: [
          { code: 'AB-UMU-UMU', name: 'Umuahia', type: 'CITY', areas: ['World Bank', 'Ubakala'] },
        ],
      },
      {
        code: 'AB-ABA',
        name: 'Aba North',
        locations: [
          { code: 'AB-ABA-ABA', name: 'Aba', type: 'CITY', areas: ['Ariaria', 'St. Michael'] },
        ],
      },
    ],
  },
  {
    code: 'FC',
    name: 'FCT Abuja',
    capital: 'Abuja',
    lgas: [
      {
        code: 'FC-AMC',
        name: 'Abuja Municipal',
        locations: [
          { code: 'FC-AMC-MAI', name: 'Maitama', type: 'AREA' },
          { code: 'FC-AMC-ASO', name: 'Asokoro', type: 'AREA' },
          { code: 'FC-AMC-GRB', name: 'Garki', type: 'AREA', areas: ['Garki 1', 'Garki 2'] },
          { code: 'FC-AMC-WUS', name: 'Wuse', type: 'AREA', areas: ['Wuse 1', 'Wuse 2'] },
        ],
      },
      {
        code: 'FC-GWA',
        name: 'Gwagwalada',
        locations: [
          { code: 'FC-GWA-GWA', name: 'Gwagwalada', type: 'CITY' },
        ],
      },
    ],
  },
  {
    code: 'OY',
    name: 'Oyo',
    capital: 'Ibadan',
    lgas: [
      {
        code: 'OY-IBA',
        name: 'Ibadan North',
        locations: [
          { code: 'OY-IBA-BOD', name: 'Bodija', type: 'AREA' },
          { code: 'OY-IBA-SAM', name: 'Sango', type: 'AREA' },
        ],
      },
    ],
  },
  {
    code: 'RI',
    name: 'Rivers',
    capital: 'Port Harcourt',
    lgas: [
      {
        code: 'RI-PHC',
        name: 'Port Harcourt',
        locations: [
          { code: 'RI-PHC-GRA', name: 'GRA', type: 'AREA', areas: ['Phase 1', 'Phase 2', 'Phase 3'] },
          { code: 'RI-PHC-RUM', name: 'Rumuokoro', type: 'AREA' },
        ],
      },
    ],
  },
  {
    code: 'AN',
    name: 'Anambra',
    capital: 'Awka',
    lgas: [
      {
        code: 'AN-ONN',
        name: 'Onitsha North',
        locations: [
          { code: 'AN-ONN-ONI', name: 'Onitsha', type: 'CITY', areas: ['Main Market', 'Fegge'] },
        ],
      },
    ],
  },
];

/**
 * Get state by code
 */
export function getStateByCode(stateCode: string): NigerianState | undefined {
  return NIGERIAN_STATES.find((state) => state.code === stateCode);
}

/**
 * Get LGA by state code and LGA code
 */
export function getLGAByCode(stateCode: string, lgaCode: string): LGA | undefined {
  const state = getStateByCode(stateCode);
  return state?.lgas.find((lga) => lga.code === lgaCode);
}

/**
 * Get location by codes
 */
export function getLocationByCode(
  stateCode: string,
  lgaCode: string,
  locationCode: string
): Location | undefined {
  const lga = getLGAByCode(stateCode, lgaCode);
  return lga?.locations.find((loc) => loc.code === locationCode);
}

/**
 * Build full hierarchical address
 */
export function buildHierarchicalAddress(
  stateCode: string,
  lgaCode: string,
  locationCode: string,
  area?: string,
  streetAddress?: string,
  landmark?: string
): HierarchicalAddress | null {
  const state = getStateByCode(stateCode);
  const lga = getLGAByCode(stateCode, lgaCode);
  const location = getLocationByCode(stateCode, lgaCode, locationCode);

  if (!state || !lga || !location) {
    return null;
  }

  return {
    stateCode: state.code,
    stateName: state.name,
    lgaCode: lga.code,
    lgaName: lga.name,
    locationCode: location.code,
    locationName: location.name,
    area,
    streetAddress,
    landmark,
  };
}

/**
 * Format address for display
 */
export function formatAddress(address: HierarchicalAddress): string {
  const parts: string[] = [];

  if (address.streetAddress) parts.push(address.streetAddress);
  if (address.area) parts.push(address.area);
  parts.push(address.locationName);
  parts.push(address.lgaName);
  parts.push(address.stateName);

  return parts.join(', ');
}

/**
 * Get all states (for dropdowns)
 */
export function getAllStates(): Array<{ code: string; name: string }> {
  return NIGERIAN_STATES.map((state) => ({
    code: state.code,
    name: state.name,
  }));
}

/**
 * Get LGAs for a state (for dropdowns)
 */
export function getLGAsForState(stateCode: string): Array<{ code: string; name: string }> {
  const state = getStateByCode(stateCode);
  if (!state) return [];

  return state.lgas.map((lga) => ({
    code: lga.code,
    name: lga.name,
  }));
}

/**
 * Get locations for an LGA (for dropdowns)
 */
export function getLocationsForLGA(
  stateCode: string,
  lgaCode: string
): Array<{ code: string; name: string; type: string }> {
  const lga = getLGAByCode(stateCode, lgaCode);
  if (!lga) return [];

  return lga.locations.map((location) => ({
    code: location.code,
    name: location.name,
    type: location.type,
  }));
}

/**
 * Get areas for a location (for dropdowns)
 */
export function getAreasForLocation(
  stateCode: string,
  lgaCode: string,
  locationCode: string
): string[] {
  const location = getLocationByCode(stateCode, lgaCode, locationCode);
  return location?.areas || [];
}

/**
 * Validate address hierarchy
 */
export function validateAddressHierarchy(
  stateCode: string,
  lgaCode: string,
  locationCode: string
): { valid: boolean; error?: string } {
  const state = getStateByCode(stateCode);
  if (!state) {
    return { valid: false, error: 'Invalid state code' };
  }

  const lga = getLGAByCode(stateCode, lgaCode);
  if (!lga) {
    return { valid: false, error: 'Invalid LGA code for selected state' };
  }

  const location = getLocationByCode(stateCode, lgaCode, locationCode);
  if (!location) {
    return { valid: false, error: 'Invalid location code for selected LGA' };
  }

  return { valid: true };
}

/**
 * Search locations by name (fuzzy search)
 */
export function searchLocationsUtil(query: string): Array<{
  state: string;
  lga: string;
  location: string;
  fullPath: string;
}> {
  const results: Array<{
    state: string;
    lga: string;
    location: string;
    fullPath: string;
  }> = [];

  const normalizedQuery = query.toLowerCase().trim();

  NIGERIAN_STATES.forEach((state) => {
    state.lgas.forEach((lga) => {
      lga.locations.forEach((location) => {
        if (
          location.name.toLowerCase().includes(normalizedQuery) ||
          lga.name.toLowerCase().includes(normalizedQuery) ||
          state.name.toLowerCase().includes(normalizedQuery)
        ) {
          results.push({
            state: state.name,
            lga: lga.name,
            location: location.name,
            fullPath: `${location.name}, ${lga.name}, ${state.name}`,
          });
        }
      });
    });
  });

  return results;
}