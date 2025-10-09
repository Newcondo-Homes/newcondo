/**
 * Proximity Configuration
 * Settings for geographic proximity calculations and service area coverage
 */

export const proximityConfig = {
  // Distance Calculation
  DISTANCE: {
    // Unit of measurement
    UNIT: 'kilometers', // 'kilometers' or 'miles'

    // Earth radius for Haversine formula (in kilometers)
    EARTH_RADIUS_KM: 6371,

    // Precision decimal places for coordinates
    COORDINATE_PRECISION: 6, // ~0.111 meters

    // Distance rounding
    ROUND_TO_DECIMAL_PLACES: 2,

    // Acceptable distance tolerance for duplicate detection (in meters)
    DUPLICATE_DETECTION_TOLERANCE_METERS: 50,
  },

  // Service Area Configuration
  SERVICE_AREA: {
    // Default search radius for agent matching (in kilometers)
    DEFAULT_SEARCH_RADIUS_KM: 5,

    // Expandable search radius levels (in kilometers)
    SEARCH_RADIUS_LEVELS: {
      TIER_1: 2, // Closest agents first
      TIER_2: 5, // Regional agents
      TIER_3: 10, // Extended area
      TIER_4: 20, // City-wide
      TIER_5: 50, // State-wide (for urgent cases)
    },

    // Radius expansion strategy
    EXPANSION_STRATEGY: 'progressive', // progressive or all-at-once
    EXPANSION_DELAY_MINUTES: 15, // Wait before expanding search radius

    // Maximum search radius (in kilometers)
    MAX_SEARCH_RADIUS_KM: 50,

    // Minimum agents required in area
    MIN_AGENTS_THRESHOLD: 1, // Expand search if fewer agents found

    // Agent geofencing
    GEOFENCING_ENABLED: true,
    GEOFENCE_UPDATE_FREQUENCY_MINUTES: 30, // Update agent location cache
  },

  // Agent Service Coverage
  COVERAGE: {
    // Types of coverage areas
    COVERAGE_TYPES: {
      EXACT: 'exact', // Specific cities/LGAs
      RADIUS: 'radius', // Radius-based coverage
      POLYGON: 'polygon', // Geographic polygon (for future use)
    },

    // Default coverage for new agents (in kilometers)
    DEFAULT_COVERAGE_RADIUS_KM: 10,

    // Coverage validation
    VALIDATE_COVERAGE: true,
    AUTO_EXPAND_COVERAGE: false, // Manual expansion only

    // Coverage overlap handling
    ALLOW_COVERAGE_OVERLAP: true,
    REDISTRIBUTE_ON_CONFLICT: false,

    // Coverage audit
    AUDIT_COVERAGE_CHANGES: true,
    AUDIT_LOG_RETENTION_DAYS: 90,
  },

  // Geographic Hierarchy Configuration
  HIERARCHY: {
    // Hierarchical location structure (Nigeria-specific)
    LEVELS: {
      0: 'country',
      1: 'state',
      2: 'lga', // Local Government Area
      3: 'town',
      4: 'location', // Neighborhood/street
    },

    // Supported countries (for future expansion)
    SUPPORTED_COUNTRIES: ['Nigeria'],

    // Default country
    DEFAULT_COUNTRY: 'Nigeria',

    // Hierarchical search direction
    SEARCH_DIRECTION: 'bottom-up', // Start with specific location, expand to state

    // Location validation
    VALIDATE_HIERARCHY: true,
    REQUIRE_FULL_HIERARCHY: true, // Require all levels to be specified

    // Location caching
    CACHE_HIERARCHY: true,
    HIERARCHY_CACHE_TTL_MINUTES: 1440, // 24 hours

    // Location auto-completion
    ENABLE_AUTOCOMPLETE: true,
    AUTOCOMPLETE_MIN_CHARS: 2,
  },

  // Geographic Boundaries
  BOUNDARIES: {
    // Nigeria geographic bounds (approximate)
    BOUNDS: {
      NORTH: 13.891038,
      SOUTH: 4.4161049,
      EAST: 14.67919,
      WEST: 2.6917872,
    },

    // Validation tolerance (in decimal degrees)
    TOLERANCE_DECIMAL_DEGREES: 0.01,

    // Buffer zone around boundaries (in kilometers)
    BOUNDARY_BUFFER_KM: 10, // Allow marking slightly outside official boundaries

    // Island/offshore handling
    ALLOW_OFFSHORE_MARKING: false,
  },

  // Geolocation Accuracy
  ACCURACY: {
    // Minimum accuracy for GPS coordinates (in meters)
    MIN_GPS_ACCURACY: 30,

    // Minimum accuracy for address-based geolocation (in meters)
    MIN_ADDRESS_ACCURACY: 100,

    // Location age threshold (in hours)
    MAX_LOCATION_AGE_HOURS: 24,

    // Accuracy improvement
    ENABLE_ACCURACY_IMPROVEMENT: true,
    ACCURACY_RETRY_COUNT: 3,
    ACCURACY_RETRY_DELAY_SECONDS: 5,

    // Accuracy requirements by marking type
    ACCURACY_REQUIREMENTS: {
      SELF_MARKING: 30, // meters
      AGENT_MARKING: 20, // meters
      REMOTE_MARKING: 50, // meters (less strict for remote)
    },
  },

  // Zone Management
  ZONES: {
    // Zone types for service organization
    ZONE_TYPES: ['city', 'region', 'state', 'service_area'],

    // Zone size limits (in square kilometers)
    MAX_ZONE_SIZE_SQ_KM: 500,
    MIN_ZONE_SIZE_SQ_KM: 1,

    // Zone agent capacity
    AGENTS_PER_ZONE_TARGET: 5, // Target agents per zone
    AGENTS_PER_ZONE_MIN: 1,

    // Zone rebalancing
    AUTO_REBALANCE_ZONES: false, // Manual rebalancing only
    REBALANCE_THRESHOLD_AGENTS: 2,
    REBALANCE_FREQUENCY_DAYS: 30,

    // Zone coverage validation
    VALIDATE_COVERAGE_GAPS: true,
    ALERT_COVERAGE_GAPS: true,
  },

  // Performance Optimization
  OPTIMIZATION: {
    // Caching strategy
    CACHE_ENABLED: true,
    CACHE_TTL_MINUTES: 60,
    CACHE_MAX_SIZE_MB: 500,

    // Query optimization
    USE_SPATIAL_INDEX: true,
    ENABLE_QUERY_CACHING: true,

    // Batch processing
    BATCH_PROCESSING_ENABLED: true,
    BATCH_SIZE: 100,

    // Indexing
    GEOGRAPHIC_INDEX_TYPE: 'gist', // PostgreSQL GiST or BRIN
    MAINTAIN_INDEX_FREQUENCY_HOURS: 6,
  },

  // Testing & Development
  TESTING: {
    // Mock locations for testing
    MOCK_MODE: false,
    
    // Test coordinates (Central Lagos)
    TEST_COORDINATES: {
      lat: 6.5244,
      lng: 3.3792,
    },

    // Test locations
    TEST_LOCATIONS: {
      LAGOS: { state: 'Lagos', lga: 'Ikeja', town: 'Ikeja', lat: 6.5244, lng: 3.3792 },
      ABUJA: { state: 'FCT', lga: 'Garki', town: 'Garki', lat: 9.076479, lng: 7.398941 },
      IBADAN: { state: 'Oyo', lga: 'Ibadan North', town: 'Ibadan', lat: 7.3775, lng: 3.9470 },
    },

    // Debug mode
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    LOG_DISTANCE_CALCULATIONS: false,
    LOG_MATCHING_RESULTS: false,
  },

  // API Integration
  MAPS_API: {
    // Google Maps settings
    PROVIDER: 'google_maps',
    API_VERSION: 1,

    // Rate limiting
    MAX_REQUESTS_PER_SECOND: 10,
    MAX_BATCH_SIZE: 50,

    // Timeout settings (in seconds)
    TIMEOUT: 10,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_SECONDS: 2,

    // Caching of results
    CACHE_RESULTS: true,
    CACHE_TTL_HOURS: 24,

    // Fallback behavior
    FALLBACK_TO_RADIUS_SEARCH: true,
  },

  // Compliance & Regulations
  COMPLIANCE: {
    // Privacy regulations
    STORE_PRECISE_LOCATION: true, // Based on GDPR/data protection laws
    LOCATION_DATA_RETENTION_DAYS: 90,

    // Data minimization
    MINIMIZE_LOCATION_COLLECTION: false,
    ANONYMOUS_LOCATION_TRACKING: false,

    // Audit trail
    MAINTAIN_AUDIT_TRAIL: true,
    AUDIT_LOG_RETENTION_DAYS: 365, // 1 year
  },
} as const;

export default proximityConfig;