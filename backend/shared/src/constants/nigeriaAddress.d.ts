export interface AddressLocation {
    name: string;
    code: string;
}
export interface LGA extends AddressLocation {
    locations: string[];
}
interface NigerianState extends AddressLocation {
    lgas: LGA[];
}
/**
 * Comprehensive Nigerian Address Hierarchy
 * State -> LGA (Local Government Area) -> Locations (Towns/Areas)
 */
export declare const NIGERIAN_STATES: NigerianState[];
/**
 * Get all state names
 */
export declare const getStateNames: () => string[];
/**
 * Get LGAs for a specific state
 */
export declare const getLGAsByState: (stateName: string) => LGA[];
/**
 * Get locations for a specific LGA in a state
 */
export declare const getLocationsByLGA: (stateName: string, lgaName: string) => string[];
/**
 * Validate if a complete address exists
 */
export declare const isValidAddress: (stateName: string, lgaName: string, location: string) => boolean;
/**
 * Get full address path
 */
export declare const getAddressPath: (stateName: string, lgaName: string, location: string) => string;
/**
 * Search for locations across all states
 */
export declare const searchLocations: (query: string) => Array<{
    state: string;
    lga: string;
    location: string;
}>;
export {};
//# sourceMappingURL=nigeriaAddress.d.ts.map