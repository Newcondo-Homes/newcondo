/**
 * Property management constants and configuration
 */
export declare const PROPERTY_STATUS: {
    readonly DRAFT: "DRAFT";
    readonly PENDING: "PENDING";
    readonly PUBLISHED: "PUBLISHED";
    readonly RENTED: "RENTED";
    readonly UNAVAILABLE: "UNAVAILABLE";
};
export declare const PROPERTY_STRUCTURE: {
    readonly SINGLE_UNIT: "SINGLE_UNIT";
    readonly MULTI_FAMILY: "MULTI_FAMILY";
};
export declare const PROPERTY_TYPES: {
    readonly APARTMENT: "APARTMENT";
    readonly HOUSE: "HOUSE";
    readonly DUPLEX: "DUPLEX";
    readonly ROOM: "ROOM";
    readonly SHARED_APARTMENT: "SHARED_APARTMENT";
    readonly OFFICE: "OFFICE";
    readonly SHOP: "SHOP";
    readonly WAREHOUSE: "WAREHOUSE";
};
export declare const UNIT_STATUS: {
    readonly AVAILABLE: "AVAILABLE";
    readonly OCCUPIED: "OCCUPIED";
    readonly MAINTENANCE: "MAINTENANCE";
    readonly RESERVED: "RESERVED";
};
export declare const ADMIN_APPROVAL_STATUS: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
};
export declare const PROPERTY_PROMOTION_TYPES: {
    readonly PUBLIC: "public";
    readonly PERMISSION_BASED: "permission_based";
    readonly RESTRICTED: "restricted";
    readonly REQUEST_BASED: "request_based";
};
export declare const RENTAL_STATUS: {
    readonly ACTIVE: "ACTIVE";
    readonly EXPIRED: "EXPIRED";
    readonly TERMINATED: "TERMINATED";
    readonly PENDING_CONFIRMATION: "PENDING_CONFIRMATION";
};
export declare const BOUNDARY_SETTINGS: {
    readonly MIN_BOUNDARY_POINTS: 3;
    readonly MAX_BOUNDARY_POINTS: 50;
    readonly BOUNDARY_PRECISION: 6;
    readonly DUPLICATE_OVERLAP_THRESHOLD: 0.7;
};
export declare const PROPERTY_IMAGE_SETTINGS: {
    readonly MAX_IMAGES: 20;
    readonly MIN_IMAGES: 1;
    readonly MAX_FILE_SIZE_MB: 5;
    readonly ALLOWED_FORMATS: readonly ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    readonly THUMBNAIL_WIDTH: 400;
    readonly THUMBNAIL_HEIGHT: 300;
    readonly FULL_WIDTH: 1920;
    readonly FULL_HEIGHT: 1080;
};
export declare const LISTING_LIMITS: {
    readonly FREE_TIER_MAX_PROPERTIES: 5;
    readonly PREMIUM_TIER_MAX_PROPERTIES: 50;
    readonly ADMIN_MAX_PROPERTIES: -1;
};
export declare const VIEW_TRACKING: {
    readonly TRACK_ANONYMOUS_VIEWS: true;
    readonly TRACK_LOGGED_IN_VIEWS: true;
    readonly TRACK_REFERRAL_SOURCE: true;
    readonly VIEW_COUNT_INTERVAL_SECONDS: 60;
};
export declare const MARKETING_SETTINGS: {
    readonly ENABLE_SHAREABLE_LINKS: true;
    readonly ENABLE_AGENT_PROMOTION: true;
    readonly ENABLE_QR_CODES: true;
    readonly ENABLE_SOCIAL_SHARING: true;
    readonly LINK_EXPIRY_DAYS: 365;
};
export declare const PERFORMANCE_METRICS: {
    readonly EXCELLENT_CONVERSION_RATE: 5;
    readonly GOOD_CONVERSION_RATE: 3;
    readonly AVERAGE_CONVERSION_RATE: 1.5;
    readonly POOR_CONVERSION_RATE: 1.5;
};
export declare const SEARCH_SETTINGS: {
    readonly MAX_SEARCH_RESULTS: 100;
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PRICE_RANGE_MULTIPLIER: 10;
    readonly FUZZY_SEARCH_THRESHOLD: 0.6;
};
export declare const AVAILABILITY_SETTINGS: {
    readonly MARK_AS_UNAVAILABLE_AFTER_RENTAL: true;
    readonly AUTO_RELIST_AFTER_RENTAL_EXPIRY: false;
    readonly AVAILABILITY_BUFFER_DAYS: 7;
};
export declare const PAYMENT_LOCK_SETTINGS: {
    readonly LOCK_DURATION_MINUTES: 30;
    readonly MAX_LOCK_RETRIES: 3;
    readonly LOCK_RETRY_DELAY_MS: 1000;
};
export declare const MARKING_SERVICE_SETTINGS: {
    readonly MAX_COMPLETION_DAYS: 3;
    readonly TIME_SLOT_HOURS: 3;
    readonly QUEUE_EXPIRY_HOURS: 72;
    readonly MARKING_VERIFICATION_PERIOD_HOURS: 48;
    readonly MAX_VERIFICATION_ATTEMPTS: 5;
};
export declare const OCCUPANCY_SETTINGS: {
    readonly EXCELLENT_OCCUPANCY_RATE: 90;
    readonly GOOD_OCCUPANCY_RATE: 75;
    readonly FAIR_OCCUPANCY_RATE: 50;
    readonly POOR_OCCUPANCY_RATE: 50;
};
export declare const PROPERTY_VALIDATION_RULES: {
    readonly MIN_TITLE_LENGTH: 10;
    readonly MAX_TITLE_LENGTH: 200;
    readonly MIN_DESCRIPTION_LENGTH: 50;
    readonly MAX_DESCRIPTION_LENGTH: 5000;
    readonly MIN_PRICE: 1000;
    readonly MAX_PRICE: 100000000;
    readonly MIN_BEDROOMS: 0;
    readonly MAX_BEDROOMS: 50;
    readonly MIN_BATHROOMS: 0;
    readonly MAX_BATHROOMS: 50;
    readonly MIN_AREA: 1;
    readonly MAX_AREA: 100000;
};
export declare const EXPORT_FORMATS_DOCS: {
    readonly CSV: "csv";
    readonly PDF: "pdf";
    readonly XLSX: "xlsx";
    readonly JSON: "json";
};
export declare const NOTIFICATION_EVENTS: {
    readonly PROPERTY_CREATED: "property:created";
    readonly PROPERTY_UPDATED: "property:updated";
    readonly PROPERTY_PUBLISHED: "property:published";
    readonly PROPERTY_RENTED: "property:rented";
    readonly PROPERTY_APPROVED: "property:approved";
    readonly PROPERTY_REJECTED: "property:rejected";
    readonly PROPERTY_VIEWED: "property:viewed";
    readonly PROPERTY_FAVORITED: "property:favorited";
    readonly RENTAL_CONFIRMED: "rental:confirmed";
    readonly RENTAL_EXPIRED: "rental:expired";
    readonly MARKING_REQUESTED: "marking:requested";
    readonly MARKING_COMPLETED: "marking:completed";
    readonly MARKING_VERIFIED: "marking:verified";
};
export declare const PROPERTY_ANALYTICS_PERIODS: {
    readonly DAY: "day";
    readonly WEEK: "week";
    readonly MONTH: "month";
    readonly QUARTER: "quarter";
    readonly YEAR: "year";
    readonly LAST_7_DAYS: "last-7-days";
    readonly LAST_30_DAYS: "last-30-days";
    readonly LAST_90_DAYS: "last-90-days";
    readonly LAST_12_MONTHS: "last-12-months";
    readonly THIS_MONTH: "this-month";
    readonly THIS_YEAR: "this-year";
    readonly CUSTOM: "custom";
};
export declare const METRIC_TYPES: {
    readonly VIEWS: "views";
    readonly RENTALS: "rentals";
    readonly REVENUE: "revenue";
    readonly CONVERSION: "conversion";
    readonly OCCUPANCY: "occupancy";
    readonly COMMISSION: "commission";
};
export declare const SORT_OPTIONS: {
    readonly NEWEST: "newest";
    readonly OLDEST: "oldest";
    readonly PRICE_LOW_HIGH: "price_low_high";
    readonly PRICE_HIGH_LOW: "price_high_low";
    readonly MOST_VIEWED: "most_viewed";
    readonly MOST_POPULAR: "most_popular";
    readonly BEST_RATED: "best_rated";
};
export declare const ERROR_MESSAGES: {
    readonly PROPERTY_NOT_FOUND: "Property not found";
    readonly PROPERTY_ACCESS_DENIED: "You do not have permission to access this property";
    readonly PROPERTY_ALREADY_RENTED: "This property is already rented";
    readonly PROPERTY_NOT_AVAILABLE: "This property is not available";
    readonly INVALID_PROPERTY_DATA: "Invalid property data provided";
    readonly BOUNDARY_OVERLAP: "Property boundary overlaps with existing property";
    readonly MARKING_JOB_NOT_FOUND: "Marking job not found";
    readonly INVALID_UNIT_DATA: "Invalid unit data provided";
    readonly UNIT_NOT_FOUND: "Unit not found";
    readonly PAYMENT_LOCK_FAILED: "Failed to acquire payment lock";
};
export declare const PROPERTY_SUCCESS_MESSAGES: {
    readonly PROPERTY_CREATED: "Property created successfully";
    readonly PROPERTY_UPDATED: "Property updated successfully";
    readonly PROPERTY_DELETED: "Property deleted successfully";
    readonly PROPERTY_PUBLISHED: "Property published successfully";
    readonly MARKING_REQUESTED: "Marking service requested successfully";
    readonly MARKING_COMPLETED: "Property marking completed successfully";
    readonly RENTAL_CONFIRMED: "Rental confirmed successfully";
};
//# sourceMappingURL=propertyManagement.d.ts.map