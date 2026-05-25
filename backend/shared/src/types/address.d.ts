/**
 * Nigerian Address Types
 * Hierarchical address structure for precise location management
 */
export interface NigerianState {
    id: string;
    name: string;
    code: string;
    geopoliticalZone: GeopoliticalZone;
}
export interface LocalGovernmentArea {
    id: string;
    name: string;
    stateId: string;
    stateName: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}
export interface Location {
    id: string;
    name: string;
    lgaId: string;
    lgaName: string;
    stateId: string;
    stateName: string;
    landmarks?: string[];
    coordinates?: {
        lat: number;
        lng: number;
    };
}
export interface FullAddress {
    state: NigerianState;
    lga: LocalGovernmentArea;
    location: Location;
    streetAddress?: string;
    houseNumber?: string;
    postalCode?: string;
    gpsCoordinates?: {
        lat: number;
        lng: number;
    };
}
export declare enum GeopoliticalZone {
    NORTH_CENTRAL = "NORTH_CENTRAL",
    NORTH_EAST = "NORTH_EAST",
    NORTH_WEST = "NORTH_WEST",
    SOUTH_EAST = "SOUTH_EAST",
    SOUTH_SOUTH = "SOUTH_SOUTH",
    SOUTH_WEST = "SOUTH_WEST"
}
export interface AddressSearchParams {
    stateId?: string;
    lgaId?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
}
export interface AddressSearchResult {
    states?: NigerianState[];
    lgas?: LocalGovernmentArea[];
    locations?: Location[];
    total: number;
}
export interface AddressSelectionState {
    selectedState: NigerianState | null;
    selectedLGA: LocalGovernmentArea | null;
    selectedLocation: Location | null;
    availableStates: NigerianState[];
    availableLGAs: LocalGovernmentArea[];
    availableLocations: Location[];
    isLoadingLGAs: boolean;
    isLoadingLocations: boolean;
}
export interface FormattedAddress {
    short: string;
    medium: string;
    full: string;
    hierarchical: {
        state: string;
        lga: string;
        location: string;
        street?: string;
    };
}
//# sourceMappingURL=address.d.ts.map