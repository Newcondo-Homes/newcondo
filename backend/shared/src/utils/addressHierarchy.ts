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