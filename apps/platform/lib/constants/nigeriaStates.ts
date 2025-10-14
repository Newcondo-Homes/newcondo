// apps/platform/lib/constants/nigeriaStates.ts

/**
 * Comprehensive Nigerian geographical data
 * State -> LGA -> Locations hierarchy
 */

export interface Location {
  name: string;
  type: 'town' | 'area' | 'district';
}

export interface LGA {
  name: string;
  code: string;
  locations: Location[];
}

export interface State {
  name: string;
  code: string;
  capital: string;
  lgas: LGA[];
}

/**
 * Nigeria States Data
 * Note: This is a sample structure. In production, this should be loaded from a database
 * or comprehensive JSON file for all 36 states + FCT
 */
export const NIGERIA_STATES: State[] = [
  {
    name: 'Lagos',
    code: 'LAG',
    capital: 'Ikeja',
    lgas: [
      {
        name: 'Ikeja',
        code: 'LAG-IKE',
        locations: [
          { name: 'Allen Avenue', type: 'area' },
          { name: 'Alausa', type: 'district' },
          { name: 'GRA', type: 'area' },
          { name: 'Ogba', type: 'area' },
          { name: 'Oregun', type: 'area' },
        ],
      },
      {
        name: 'Lagos Island',
        code: 'LAG-ISL',
        locations: [
          { name: 'Marina', type: 'area' },
          { name: 'Victoria Island', type: 'area' },
          { name: 'Ikoyi', type: 'area' },
          { name: 'Lekki Phase 1', type: 'area' },
          { name: 'Oniru', type: 'area' },
        ],
      },
      {
        name: 'Eti-Osa',
        code: 'LAG-ETO',
        locations: [
          { name: 'Lekki', type: 'area' },
          { name: 'Ajah', type: 'area' },
          { name: 'Sangotedo', type: 'area' },
          { name: 'Chevron', type: 'area' },
          { name: 'VGC', type: 'area' },
        ],
      },
      {
        name: 'Alimosho',
        code: 'LAG-ALI',
        locations: [
          { name: 'Egbeda', type: 'area' },
          { name: 'Ikotun', type: 'area' },
          { name: 'Iyana-Ipaja', type: 'area' },
          { name: 'Idimu', type: 'area' },
          { name: 'Igando', type: 'area' },
        ],
      },
      {
        name: 'Kosofe',
        code: 'LAG-KOS',
        locations: [
          { name: 'Ketu', type: 'area' },
          { name: 'Mile 12', type: 'area' },
          { name: 'Anthony', type: 'area' },
          { name: 'Ojota', type: 'area' },
          { name: 'Ogudu', type: 'area' },
        ],
      },
    ],
  },
  {
    name: 'Abuja FCT',
    code: 'FCT',
    capital: 'Abuja',
    lgas: [
      {
        name: 'Abuja Municipal',
        code: 'FCT-AMC',
        locations: [
          { name: 'Wuse', type: 'district' },
          { name: 'Garki', type: 'district' },
          { name: 'Maitama', type: 'district' },
          { name: 'Asokoro', type: 'district' },
          { name: 'Gwarinpa', type: 'area' },
        ],
      },
      {
        name: 'Gwagwalada',
        code: 'FCT-GWA',
        locations: [
          { name: 'Gwagwalada Town', type: 'town' },
          { name: 'Kutunku', type: 'area' },
          { name: 'Tunga-Maje', type: 'area' },
        ],
      },
      {
        name: 'Kuje',
        code: 'FCT-KUJ',
        locations: [
          { name: 'Kuje Town', type: 'town' },
          { name: 'Gudugbawa', type: 'area' },
        ],
      },
    ],
  },
  {
    name: 'Rivers',
    code: 'RIV',
    capital: 'Port Harcourt',
    lgas: [
      {
        name: 'Port Harcourt',
        code: 'RIV-PHC',
        locations: [
          { name: 'GRA Phase 1', type: 'area' },
          { name: 'GRA Phase 2', type: 'area' },
          { name: 'Old GRA', type: 'area' },
          { name: 'Trans Amadi', type: 'area' },
          { name: 'Rumuola', type: 'area' },
        ],
      },
      {
        name: 'Obio-Akpor',
        code: 'RIV-OBA',
        locations: [
          { name: 'Rumuokoro', type: 'area' },
          { name: 'Elelenwo', type: 'area' },
          { name: 'Choba', type: 'area' },
          { name: 'Rumueme', type: 'area' },
        ],
      },
    ],
  },
  // Add more states as needed...
];

/**
 * Helper functions
 */

export function getAllStates(): State[] {
  return NIGERIA_STATES;
}

export function getStateByCode(code: string): State | undefined {
  return NIGERIA_STATES.find(state => state.code === code);
}

export function getStateByName(name: string): State | undefined {
  return NIGERIA_STATES.find(state => 
    state.name.toLowerCase() === name.toLowerCase()
  );
}

export function getLGAsByState(stateCode: string): LGA[] {
  const state = getStateByCode(stateCode);
  return state?.lgas || [];
}

export function getLocationsByLGA(stateCode: string, lgaCode: string): Location[] {
  const state = getStateByCode(stateCode);
  const lga = state?.lgas.find(l => l.code === lgaCode);
  return lga?.locations || [];
}

export function searchLocations(query: string): Array<{
  state: string;
  lga: string;
  location: string;
}> {
  const results: Array<{
    state: string;
    lga: string;
    location: string;
  }> = [];

  const lowerQuery = query.toLowerCase();

  NIGERIA_STATES.forEach(state => {
    state.lgas.forEach(lga => {
      lga.locations.forEach(location => {
        if (
          location.name.toLowerCase().includes(lowerQuery) ||
          lga.name.toLowerCase().includes(lowerQuery) ||
          state.name.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            state: state.name,
            lga: lga.name,
            location: location.name,
          });
        }
      });
    });
  });

  return results;
}

export function getFullAddress(stateCode: string, lgaCode: string, locationName: string): string {
  const state = getStateByCode(stateCode);
  const lga = state?.lgas.find(l => l.code === lgaCode);
  
  if (!state || !lga) return '';
  
  return `${locationName}, ${lga.name}, ${state.name}`;
}

/**
 * Get hierarchical address data
 */
export interface HierarchicalAddress {
  state: string;
  stateCode: string;
  lga: string;
  lgaCode: string;
  location: string;
  fullAddress: string;
}

export function createHierarchicalAddress(
  stateCode: string,
  lgaCode: string,
  locationName: string
): HierarchicalAddress | null {
  const state = getStateByCode(stateCode);
  const lga = state?.lgas.find(l => l.code === lgaCode);
  const location = lga?.locations.find(l => l.name === locationName);

  if (!state || !lga || !location) return null;

  return {
    state: state.name,
    stateCode: state.code,
    lga: lga.name,
    lgaCode: lga.code,
    location: location.name,
    fullAddress: getFullAddress(stateCode, lgaCode, locationName),
  };
}