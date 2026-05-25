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
    areas?: string[];
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
 * Get state by code
 */
export declare function getStateByCode(stateCode: string): NigerianState | undefined;
/**
 * Get LGA by state code and LGA code
 */
export declare function getLGAByCode(stateCode: string, lgaCode: string): LGA | undefined;
/**
 * Get location by codes
 */
export declare function getLocationByCode(stateCode: string, lgaCode: string, locationCode: string): Location | undefined;
/**
 * Build full hierarchical address
 */
export declare function buildHierarchicalAddress(stateCode: string, lgaCode: string, locationCode: string, area?: string, streetAddress?: string, landmark?: string): HierarchicalAddress | null;
/**
 * Format address for display
 */
export declare function formatAddress(address: HierarchicalAddress): string;
/**
 * Get all states (for dropdowns)
 */
export declare function getAllStates(): Array<{
    code: string;
    name: string;
}>;
/**
 * Get LGAs for a state (for dropdowns)
 */
export declare function getLGAsForState(stateCode: string): Array<{
    code: string;
    name: string;
}>;
/**
 * Get locations for an LGA (for dropdowns)
 */
export declare function getLocationsForLGA(stateCode: string, lgaCode: string): Array<{
    code: string;
    name: string;
    type: string;
}>;
/**
 * Get areas for a location (for dropdowns)
 */
export declare function getAreasForLocation(stateCode: string, lgaCode: string, locationCode: string): string[];
/**
 * Validate address hierarchy
 */
export declare function validateAddressHierarchy(stateCode: string, lgaCode: string, locationCode: string): {
    valid: boolean;
    error?: string;
};
/**
 * Search locations by name (fuzzy search)
 */
export declare function searchLocationsUtil(query: string): Array<{
    state: string;
    lga: string;
    location: string;
    fullPath: string;
}>;
export {};
//# sourceMappingURL=addressHierarchy.d.ts.map