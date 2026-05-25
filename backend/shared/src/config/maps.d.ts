interface GoogleMapsConfig {
    apiKey: string;
    defaultCenter: {
        lat: number;
        lng: number;
    };
    defaultZoom: number;
    maxZoom: number;
    minZoom: number;
    styles: google.maps.MapTypeStyle[];
    libraries: string[];
    region: string;
    language: string;
}
interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}
export declare const NIGERIA_BOUNDS: MapBounds;
export declare const NIGERIAN_CITIES: {
    LAGOS: {
        lat: number;
        lng: number;
    };
    ABUJA: {
        lat: number;
        lng: number;
    };
    KANO: {
        lat: number;
        lng: number;
    };
    IBADAN: {
        lat: number;
        lng: number;
    };
    BENIN_CITY: {
        lat: number;
        lng: number;
    };
    PORT_HARCOURT: {
        lat: number;
        lng: number;
    };
    KADUNA: {
        lat: number;
        lng: number;
    };
    JOS: {
        lat: number;
        lng: number;
    };
    ILORIN: {
        lat: number;
        lng: number;
    };
    ENUGU: {
        lat: number;
        lng: number;
    };
};
declare const customMapStyles: google.maps.MapTypeStyle[];
export declare const googleMapsConfig: GoogleMapsConfig;
export declare const validateMapsConfig: () => boolean;
export declare const MAP_TYPES: {
    readonly ROADMAP: "roadmap";
    readonly SATELLITE: "satellite";
    readonly HYBRID: "hybrid";
    readonly TERRAIN: "terrain";
};
export declare const DEFAULT_MARKING_MAP_TYPE: "satellite";
export declare const BOUNDARY_MARKING_OPTIONS: {
    zoomControl: boolean;
    mapTypeControl: boolean;
    streetViewControl: boolean;
    fullscreenControl: boolean;
    gestureHandling: string;
    clickableIcons: boolean;
    disableDoubleClickZoom: boolean;
};
export declare const DRAWING_MANAGER_OPTIONS: {
    drawingMode: null;
    drawingControl: boolean;
    drawingControlOptions: {
        position: number;
        drawingModes: string[];
    };
    rectangleOptions: {
        fillColor: string;
        fillOpacity: number;
        strokeWeight: number;
        strokeColor: string;
        clickable: boolean;
        editable: boolean;
        zIndex: number;
    };
};
export declare const EXISTING_BOUNDARY_OPTIONS: {
    fillColor: string;
    fillOpacity: number;
    strokeWeight: number;
    strokeColor: string;
    clickable: boolean;
    editable: boolean;
    zIndex: number;
};
export type { GoogleMapsConfig, MapBounds };
export { customMapStyles as defaultMapStyles };
//# sourceMappingURL=maps.d.ts.map