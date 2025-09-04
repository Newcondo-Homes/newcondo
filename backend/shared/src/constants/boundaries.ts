// Property boundary size limits (in square meters)
export const BOUNDARY_SIZE_LIMITS = {
  // Minimum property sizes
  MIN_ROOM_SIZE: 9, // 3m x 3m minimum room
  MIN_APARTMENT_SIZE: 25, // 5m x 5m minimum apartment
  MIN_HOUSE_SIZE: 50, // 7m x 7m minimum house
  MIN_DUPLEX_SIZE: 100, // 10m x 10m minimum duplex
  MIN_OFFICE_SIZE: 15, // 3m x 5m minimum office
  MIN_SHOP_SIZE: 10, // 2m x 5m minimum shop
  MIN_WAREHOUSE_SIZE: 100, // 10m x 10m minimum warehouse
  
  // Maximum property sizes
  MAX_ROOM_SIZE: 50, // 7m x 7m maximum room
  MAX_APARTMENT_SIZE: 200, // 14m x 14m maximum apartment
  MAX_HOUSE_SIZE: 1000, // 32m x 32m maximum house
  MAX_DUPLEX_SIZE: 2000, // 45m x 45m maximum duplex
  MAX_OFFICE_SIZE: 500, // 22m x 22m maximum office
  MAX_SHOP_SIZE: 300, // 17m x 17m maximum shop
  MAX_WAREHOUSE_SIZE: 10000, // 100m x 100m maximum warehouse
  
  // Absolute limits
  ABSOLUTE_MIN_SIZE: 5, // 2.5m x 2m absolute minimum
  ABSOLUTE_MAX_SIZE: 50000, // 224m x 224m absolute maximum (5 hectares)
} as const;

// GPS accuracy requirements (in meters)
export const GPS_ACCURACY_REQUIREMENTS = {
  EXCELLENT: 3, // GPS accuracy <= 3m
  GOOD: 5, // GPS accuracy <= 5m
  ACCEPTABLE: 10, // GPS accuracy <= 10m
  POOR: 20, // GPS accuracy > 10m but <= 20m
  UNACCEPTABLE: 21, // GPS accuracy > 20m
  
  // Minimum required accuracy for property marking
  REQUIRED_FOR_MARKING: 10,
  RECOMMENDED_FOR_MARKING: 5,
} as const;

// Map zoom levels for different marking phases
export const ZOOM_LEVELS = {
  COUNTRY: 6,
  STATE: 8,
  CITY: 10,
  NEIGHBORHOOD: 15,
  STREET: 17,
  BUILDING: 19,
  PROPERTY_MARKING: 21, // Required zoom level for property marking
  MAXIMUM: 22,
} as const;

// Boundary validation thresholds
export const VALIDATION_THRESHOLDS = {
  // Overlap detection
  MAX_ALLOWED_OVERLAP_PERCENTAGE: 10, // Maximum 10% overlap with existing boundaries
  SIGNIFICANT_OVERLAP_THRESHOLD: 25, // Flag as potential duplicate if > 25% overlap
  DEFINITE_DUPLICATE_THRESHOLD: 75, // Mark as duplicate if > 75% overlap
  
  // Shape validation
  MAX_ASPECT_RATIO: 10, // Maximum length:width ratio (prevents extremely thin rectangles)
  MIN_ASPECT_RATIO: 0.1, // Minimum length:width ratio
  
  // Distance validation (for remote marking)
  MAX_DISTANCE_FROM_DECLARED_LOCATION: 1000, // 1km maximum distance from declared address
  RECOMMENDED_DISTANCE_FROM_DECLARED_LOCATION: 100, // 100m recommended distance
} as const;

// Property type specific configurations
export const PROPERTY_TYPE_CONFIGS = {
  ROOM: {
    minSize: BOUNDARY_SIZE_LIMITS.MIN_ROOM_SIZE,
    maxSize: BOUNDARY_SIZE_LIMITS.MAX_ROOM_SIZE,
    recommendedAccuracy: GPS_ACCURACY_REQUIREMENTS.GOOD,
    allowedIn: ['apartment', 'house', 'duplex'], // Can be part of larger properties
  },
  APARTMENT: {
    minSize: BOUNDARY_SIZE_LIMITS.MIN_APARTMENT_SIZE,
    maxSize: BOUNDARY_SIZE_LIMITS.MAX_APARTMENT_SIZE,
    recommendedAccuracy: GPS_ACCURACY_REQUIREMENTS.GOOD,
    allowedIn: ['building', 'complex'],
  },
  HOUSE: {
    minSize: BOUNDARY_SIZE_LIMITS.MIN_HOUSE_SIZE,
    maxSize: BOUNDARY_SIZE_LIMITS.MAX_HOUSE_SIZE,
    recommendedAccuracy: GPS_ACCURACY_REQUIREMENTS.EXCELLENT,
    allowedIn: ['residential_area'],
  },
  DUPLEX: {
    minSize: BOUNDARY_SIZE_LIMITS.MIN_DUPLEX_SIZE,
    maxSize: BOUNDARY_SIZE_LIMITS.MAX_DUPLEX_SIZE,
    recommendedAccuracy: GPS_ACCURACY_REQUIREMENTS.EXCELLENT,
    allowedIn: ['residential_area'],
  },
  OFFICE: {
    minSize: BOUNDARY_SIZE_LIMITS.MIN_OFFICE_SIZE,
    maxSize: BOUNDARY_SIZE_LIMITS.MAX_OFFICE_SIZE,
    recommendedAccuracy: GPS_ACCURACY_REQUIREMENTS.GOOD,
    allowedIn: ['commercial_building', 'office_complex'],
  },
  SHOP: {
    minSize: BOUNDARY_SIZE_LIMITS.MIN_SHOP_SIZE,
    maxSize: BOUNDARY_SIZE_LIMITS.MAX_SHOP_SIZE,
    recommendedAccuracy: GPS_ACCURACY_REQUIREMENTS.GOOD,
    allowedIn: ['commercial_area', 'market', 'plaza'],
  },
  WAREHOUSE: {
    minSize: BOUNDARY_SIZE_LIMITS.MIN_WAREHOUSE_SIZE,
    maxSize: BOUNDARY_SIZE_LIMITS.MAX_WAREHOUSE_SIZE,
    recommendedAccuracy: GPS_ACCURACY_REQUIREMENTS.ACCEPTABLE,
    allowedIn: ['industrial_area'],
  },
} as const;

// Marking session timeouts and limits
export const SESSION_LIMITS = {
  MAX_MARKING_SESSION_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
  LOCATION_TIMEOUT: 10 * 1000, // 10 seconds for GPS location
  AUTO_SAVE_INTERVAL: 30 * 1000, // Auto-save progress every 30 seconds
  MAX_RETRY_ATTEMPTS: 3, // Maximum retry attempts for failed operations
  SESSION_CLEANUP_INTERVAL: 60 * 60 * 1000, // Clean up abandoned sessions every hour
} as const;

// Remote marking service constants
export const REMOTE_MARKING = {
  // Pricing (in Naira)
  BASE_FEE: 2000, // Base fee for property marking service
  URGENT_MULTIPLIER: 2, // 2x fee for urgent requests
  HIGH_PRIORITY_MULTIPLIER: 1.5, // 1.5x fee for high priority
  DISTANCE_FEE_PER_KM: 100, // Additional fee per kilometer from agent's location
  
  // Time limits
  STANDARD_COMPLETION_TIME: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
  URGENT_COMPLETION_TIME: 4 * 60 * 60 * 1000, // 4 hours for urgent requests
  AGENT_RESPONSE_TIMEOUT: 30 * 60 * 1000, // 30 minutes for agent to accept job
  TIME_SLOT_DURATION: 3 * 60 * 60 * 1000, // 3 hours time slot for completion
  
  // Queue management
  MAX_JOBS_PER_AGENT: 5, // Maximum concurrent jobs per agent
  MAX_QUEUE_POSITION: 100, // Maximum queue size
  QUEUE_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days maximum in queue
} as const;

// Boundary fingerprinting constants
export const FINGERPRINTING = {
  // Grid precision for coordinate hashing
  COORDINATE_PRECISION: 6, // 6 decimal places (~0.1m accuracy)
  GRID_SIZE: 0.0001, // Grid size for coordinate bucketing (approximately 11m)
  
  // Hash components weights
  COORDINATE_WEIGHT: 0.4, // 40% weight for coordinates
  SHAPE_WEIGHT: 0.3, // 30% weight for shape (area, aspect ratio)
  CONTEXT_WEIGHT: 0.3, // 30% weight for context (address, nearby features)
  
  // Similarity thresholds
  HIGH_SIMILARITY_THRESHOLD: 0.9, // 90% similarity = likely duplicate
  MEDIUM_SIMILARITY_THRESHOLD: 0.7, // 70% similarity = possible duplicate
  LOW_SIMILARITY_THRESHOLD: 0.5, // 50% similarity = different properties
} as const;

// Error messages and codes
export const BOUNDARY_ERRORS = {
  INVALID_COORDINATES: {
    code: 'INVALID_COORDINATES',
    message: 'Property coordinates are invalid or outside allowed bounds',
  },
  TOO_LARGE: {
    code: 'BOUNDARY_TOO_LARGE',
    message: 'Property boundary exceeds maximum allowed size for this property type',
  },
  TOO_SMALL: {
    code: 'BOUNDARY_TOO_SMALL',
    message: 'Property boundary is below minimum required size for this property type',
  },
  OVERLAPS_EXISTING: {
    code: 'OVERLAPS_EXISTING',
    message: 'Property boundary overlaps with existing marked properties',
  },
  LOW_GPS_ACCURACY: {
    code: 'LOW_GPS_ACCURACY',
    message: 'GPS accuracy is insufficient for reliable property marking',
  },
  INVALID_SHAPE: {
    code: 'INVALID_SHAPE',
    message: 'Property boundary shape is invalid or suspicious',
  },
  OUT_OF_BOUNDS: {
    code: 'OUT_OF_BOUNDS',
    message: 'Property location is outside Nigeria or supported regions',
  },
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Property marking session has expired. Please start a new session',
  },
  DUPLICATE_DETECTED: {
    code: 'DUPLICATE_DETECTED',
    message: 'This property appears to be already marked by another user',
  },
  AGENT_UNAVAILABLE: {
    code: 'AGENT_UNAVAILABLE',
    message: 'No agents are currently available for property marking in your area',
  },
} as const;

// Success messages
export const BOUNDARY_SUCCESS = {
  MARKED_SUCCESSFULLY: 'Property boundary marked successfully',
  VALIDATED_SUCCESSFULLY: 'Property boundary validation completed',
  AGENT_ASSIGNED: 'Agent has been assigned for property marking',
  MARKING_COMPLETED: 'Remote property marking completed successfully',
} as const;

// Color codes for boundary visualization
export const BOUNDARY_COLORS = {
  NEW_BOUNDARY: '#FF0000', // Red for new boundaries being drawn
  EXISTING_BOUNDARY: '#808080', // Grey for existing marked properties
  CONFLICT_BOUNDARY: '#FF6B35', // Orange for conflicting boundaries
  VALIDATED_BOUNDARY: '#28A745', // Green for validated boundaries
  INVALID_BOUNDARY: '#DC3545', // Dark red for invalid boundaries
  AGENT_MARKED: '#007BFF', // Blue for agent-marked properties
} as const;

// Opacity levels for boundary overlays
export const BOUNDARY_OPACITY = {
  NEW_BOUNDARY: 0.3,
  EXISTING_BOUNDARY: 0.5,
  CONFLICT_BOUNDARY: 0.7,
  HOVER: 0.2,
  SELECTED: 0.4,
} as const;

// Property categories and their specific requirements
export const PROPERTY_CATEGORIES = {
  RESIDENTIAL: {
    types: ['ROOM', 'APARTMENT', 'HOUSE', 'DUPLEX'],
    defaultAccuracy: GPS_ACCURACY_REQUIREMENTS.GOOD,
    allowsSubdivision: true,
  },
  COMMERCIAL: {
    types: ['OFFICE', 'SHOP'],
    defaultAccuracy: GPS_ACCURACY_REQUIREMENTS.GOOD,
    allowsSubdivision: true,
  },
  INDUSTRIAL: {
    types: ['WAREHOUSE'],
    defaultAccuracy: GPS_ACCURACY_REQUIREMENTS.ACCEPTABLE,
    allowsSubdivision: false,
  },
} as const;

// Nigerian-specific location constants
export const NIGERIA_SPECIFIC = {
  // Popular property areas and their typical sizes
  HIGHBROW_AREAS: {
    'Victoria Island': { minSize: 100, maxSize: 5000 },
    'Ikoyi': { minSize: 150, maxSize: 8000 },
    'Banana Island': { minSize: 500, maxSize: 10000 },
    'Asokoro': { minSize: 200, maxSize: 6000 },
    'Maitama': { minSize: 300, maxSize: 8000 },
  },
  
  // Standard property sizes in Nigeria (square meters)
  TYPICAL_SIZES: {
    'Self-Contained': { min: 15, typical: 25, max: 40 },
    'Room and Parlor': { min: 30, typical: 45, max: 70 },
    '2 Bedroom Flat': { min: 60, typical: 80, max: 120 },
    '3 Bedroom Flat': { min: 90, typical: 120, max: 180 },
    'Duplex': { min: 150, typical: 250, max: 500 },
    'Detached House': { min: 200, typical: 350, max: 1000 },
  },
  
  // Nigerian coordinate bounds (more precise)
  BOUNDS: {
    NORTH: 13.885645,
    SOUTH: 4.277144,
    EAST: 14.677982,
    WEST: 2.668432,
  },
} as const;

// Export commonly used type unions
export type PropertyTypeKey = keyof typeof PROPERTY_TYPE_CONFIGS;
export type BoundaryErrorCode = keyof typeof BOUNDARY_ERRORS;
export type PropertyCategoryKey = keyof typeof PROPERTY_CATEGORIES;