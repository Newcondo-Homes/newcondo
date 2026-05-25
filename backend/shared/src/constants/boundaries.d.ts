export declare const BOUNDARY_SIZE_LIMITS: {
    readonly MIN_ROOM_SIZE: 9;
    readonly MIN_APARTMENT_SIZE: 25;
    readonly MIN_HOUSE_SIZE: 50;
    readonly MIN_DUPLEX_SIZE: 100;
    readonly MIN_OFFICE_SIZE: 15;
    readonly MIN_SHOP_SIZE: 10;
    readonly MIN_WAREHOUSE_SIZE: 100;
    readonly MAX_ROOM_SIZE: 50;
    readonly MAX_APARTMENT_SIZE: 200;
    readonly MAX_HOUSE_SIZE: 1000;
    readonly MAX_DUPLEX_SIZE: 2000;
    readonly MAX_OFFICE_SIZE: 500;
    readonly MAX_SHOP_SIZE: 300;
    readonly MAX_WAREHOUSE_SIZE: 10000;
    readonly ABSOLUTE_MIN_SIZE: 5;
    readonly ABSOLUTE_MAX_SIZE: 50000;
};
export declare const GPS_ACCURACY_REQUIREMENTS: {
    readonly EXCELLENT: 3;
    readonly GOOD: 5;
    readonly ACCEPTABLE: 10;
    readonly POOR: 20;
    readonly UNACCEPTABLE: 21;
    readonly REQUIRED_FOR_MARKING: 10;
    readonly RECOMMENDED_FOR_MARKING: 5;
};
export declare const ZOOM_LEVELS: {
    readonly COUNTRY: 6;
    readonly STATE: 8;
    readonly CITY: 10;
    readonly NEIGHBORHOOD: 15;
    readonly STREET: 17;
    readonly BUILDING: 19;
    readonly PROPERTY_MARKING: 21;
    readonly MAXIMUM: 22;
};
export declare const VALIDATION_THRESHOLDS: {
    readonly MAX_ALLOWED_OVERLAP_PERCENTAGE: 10;
    readonly SIGNIFICANT_OVERLAP_THRESHOLD: 25;
    readonly DEFINITE_DUPLICATE_THRESHOLD: 75;
    readonly MAX_ASPECT_RATIO: 10;
    readonly MIN_ASPECT_RATIO: 0.1;
    readonly MAX_DISTANCE_FROM_DECLARED_LOCATION: 1000;
    readonly RECOMMENDED_DISTANCE_FROM_DECLARED_LOCATION: 100;
};
export declare const PROPERTY_TYPE_CONFIGS: {
    readonly ROOM: {
        readonly minSize: 9;
        readonly maxSize: 50;
        readonly recommendedAccuracy: 5;
        readonly allowedIn: readonly ["apartment", "house", "duplex"];
    };
    readonly APARTMENT: {
        readonly minSize: 25;
        readonly maxSize: 200;
        readonly recommendedAccuracy: 5;
        readonly allowedIn: readonly ["building", "complex"];
    };
    readonly HOUSE: {
        readonly minSize: 50;
        readonly maxSize: 1000;
        readonly recommendedAccuracy: 3;
        readonly allowedIn: readonly ["residential_area"];
    };
    readonly DUPLEX: {
        readonly minSize: 100;
        readonly maxSize: 2000;
        readonly recommendedAccuracy: 3;
        readonly allowedIn: readonly ["residential_area"];
    };
    readonly OFFICE: {
        readonly minSize: 15;
        readonly maxSize: 500;
        readonly recommendedAccuracy: 5;
        readonly allowedIn: readonly ["commercial_building", "office_complex"];
    };
    readonly SHOP: {
        readonly minSize: 10;
        readonly maxSize: 300;
        readonly recommendedAccuracy: 5;
        readonly allowedIn: readonly ["commercial_area", "market", "plaza"];
    };
    readonly WAREHOUSE: {
        readonly minSize: 100;
        readonly maxSize: 10000;
        readonly recommendedAccuracy: 10;
        readonly allowedIn: readonly ["industrial_area"];
    };
};
export declare const SESSION_LIMITS: {
    readonly MAX_MARKING_SESSION_DURATION: number;
    readonly LOCATION_TIMEOUT: number;
    readonly AUTO_SAVE_INTERVAL: number;
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly SESSION_CLEANUP_INTERVAL: number;
};
export declare const REMOTE_MARKING: {
    readonly BASE_FEE: 2000;
    readonly URGENT_MULTIPLIER: 2;
    readonly HIGH_PRIORITY_MULTIPLIER: 1.5;
    readonly DISTANCE_FEE_PER_KM: 100;
    readonly STANDARD_COMPLETION_TIME: number;
    readonly URGENT_COMPLETION_TIME: number;
    readonly AGENT_RESPONSE_TIMEOUT: number;
    readonly TIME_SLOT_DURATION: number;
    readonly MAX_JOBS_PER_AGENT: 5;
    readonly MAX_QUEUE_POSITION: 100;
    readonly QUEUE_TIMEOUT: number;
};
export declare const FINGERPRINTING: {
    readonly COORDINATE_PRECISION: 6;
    readonly GRID_SIZE: 0.0001;
    readonly COORDINATE_WEIGHT: 0.4;
    readonly SHAPE_WEIGHT: 0.3;
    readonly CONTEXT_WEIGHT: 0.3;
    readonly HIGH_SIMILARITY_THRESHOLD: 0.9;
    readonly MEDIUM_SIMILARITY_THRESHOLD: 0.7;
    readonly LOW_SIMILARITY_THRESHOLD: 0.5;
};
export declare const BOUNDARY_ERRORS: {
    readonly INVALID_COORDINATES: {
        readonly code: "INVALID_COORDINATES";
        readonly message: "Property coordinates are invalid or outside allowed bounds";
    };
    readonly TOO_LARGE: {
        readonly code: "BOUNDARY_TOO_LARGE";
        readonly message: "Property boundary exceeds maximum allowed size for this property type";
    };
    readonly TOO_SMALL: {
        readonly code: "BOUNDARY_TOO_SMALL";
        readonly message: "Property boundary is below minimum required size for this property type";
    };
    readonly OVERLAPS_EXISTING: {
        readonly code: "OVERLAPS_EXISTING";
        readonly message: "Property boundary overlaps with existing marked properties";
    };
    readonly LOW_GPS_ACCURACY: {
        readonly code: "LOW_GPS_ACCURACY";
        readonly message: "GPS accuracy is insufficient for reliable property marking";
    };
    readonly INVALID_SHAPE: {
        readonly code: "INVALID_SHAPE";
        readonly message: "Property boundary shape is invalid or suspicious";
    };
    readonly OUT_OF_BOUNDS: {
        readonly code: "OUT_OF_BOUNDS";
        readonly message: "Property location is outside Nigeria or supported regions";
    };
    readonly SESSION_EXPIRED: {
        readonly code: "SESSION_EXPIRED";
        readonly message: "Property marking session has expired. Please start a new session";
    };
    readonly DUPLICATE_DETECTED: {
        readonly code: "DUPLICATE_DETECTED";
        readonly message: "This property appears to be already marked by another user";
    };
    readonly AGENT_UNAVAILABLE: {
        readonly code: "AGENT_UNAVAILABLE";
        readonly message: "No agents are currently available for property marking in your area";
    };
};
export declare const BOUNDARY_SUCCESS: {
    readonly MARKED_SUCCESSFULLY: "Property boundary marked successfully";
    readonly VALIDATED_SUCCESSFULLY: "Property boundary validation completed";
    readonly AGENT_ASSIGNED: "Agent has been assigned for property marking";
    readonly MARKING_COMPLETED: "Remote property marking completed successfully";
};
export declare const BOUNDARY_COLORS: {
    readonly NEW_BOUNDARY: "#FF0000";
    readonly EXISTING_BOUNDARY: "#808080";
    readonly CONFLICT_BOUNDARY: "#FF6B35";
    readonly VALIDATED_BOUNDARY: "#28A745";
    readonly INVALID_BOUNDARY: "#DC3545";
    readonly AGENT_MARKED: "#007BFF";
};
export declare const BOUNDARY_OPACITY: {
    readonly NEW_BOUNDARY: 0.3;
    readonly EXISTING_BOUNDARY: 0.5;
    readonly CONFLICT_BOUNDARY: 0.7;
    readonly HOVER: 0.2;
    readonly SELECTED: 0.4;
};
export declare const PROPERTY_CATEGORIES: {
    readonly RESIDENTIAL: {
        readonly types: readonly ["ROOM", "APARTMENT", "HOUSE", "DUPLEX"];
        readonly defaultAccuracy: 5;
        readonly allowsSubdivision: true;
    };
    readonly COMMERCIAL: {
        readonly types: readonly ["OFFICE", "SHOP"];
        readonly defaultAccuracy: 5;
        readonly allowsSubdivision: true;
    };
    readonly INDUSTRIAL: {
        readonly types: readonly ["WAREHOUSE"];
        readonly defaultAccuracy: 10;
        readonly allowsSubdivision: false;
    };
};
export declare const NIGERIA_SPECIFIC: {
    readonly HIGHBROW_AREAS: {
        readonly 'Victoria Island': {
            readonly minSize: 100;
            readonly maxSize: 5000;
        };
        readonly Ikoyi: {
            readonly minSize: 150;
            readonly maxSize: 8000;
        };
        readonly 'Banana Island': {
            readonly minSize: 500;
            readonly maxSize: 10000;
        };
        readonly Asokoro: {
            readonly minSize: 200;
            readonly maxSize: 6000;
        };
        readonly Maitama: {
            readonly minSize: 300;
            readonly maxSize: 8000;
        };
    };
    readonly TYPICAL_SIZES: {
        readonly 'Self-Contained': {
            readonly min: 15;
            readonly typical: 25;
            readonly max: 40;
        };
        readonly 'Room and Parlor': {
            readonly min: 30;
            readonly typical: 45;
            readonly max: 70;
        };
        readonly '2 Bedroom Flat': {
            readonly min: 60;
            readonly typical: 80;
            readonly max: 120;
        };
        readonly '3 Bedroom Flat': {
            readonly min: 90;
            readonly typical: 120;
            readonly max: 180;
        };
        readonly Duplex: {
            readonly min: 150;
            readonly typical: 250;
            readonly max: 500;
        };
        readonly 'Detached House': {
            readonly min: 200;
            readonly typical: 350;
            readonly max: 1000;
        };
    };
    readonly BOUNDS: {
        readonly NORTH: 13.885645;
        readonly SOUTH: 4.277144;
        readonly EAST: 14.677982;
        readonly WEST: 2.668432;
    };
};
export type PropertyTypeKey = keyof typeof PROPERTY_TYPE_CONFIGS;
export type BoundaryErrorCode = keyof typeof BOUNDARY_ERRORS;
export type PropertyCategoryKey = keyof typeof PROPERTY_CATEGORIES;
//# sourceMappingURL=boundaries.d.ts.map