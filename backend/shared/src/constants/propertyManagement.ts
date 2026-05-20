/**
 * Property management constants and configuration
 */

// Property status values
export const PROPERTY_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  RENTED: 'RENTED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

// Property structure types
export const PROPERTY_STRUCTURE = {
  SINGLE_UNIT: 'SINGLE_UNIT',
  MULTI_FAMILY: 'MULTI_FAMILY',
} as const;

// Property types
export const PROPERTY_TYPES = {
  APARTMENT: 'APARTMENT',
  HOUSE: 'HOUSE',
  DUPLEX: 'DUPLEX',
  ROOM: 'ROOM',
  SHARED_APARTMENT: 'SHARED_APARTMENT',
  OFFICE: 'OFFICE',
  SHOP: 'SHOP',
  WAREHOUSE: 'WAREHOUSE',
} as const;

// Unit status values
export const UNIT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
  RESERVED: 'RESERVED',
} as const;

// Admin approval status
export const ADMIN_APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

// Property sharing/promotion types
export const PROPERTY_PROMOTION_TYPES = {
  PUBLIC: 'public', // Anyone can share
  PERMISSION_BASED: 'permission_based', // Agents must request permission
  RESTRICTED: 'restricted', // No agent promotion allowed
  REQUEST_BASED: 'request_based', // Agents request, owner approves
} as const;

// Rental status
export const RENTAL_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
} as const;

// Property boundary settings
export const BOUNDARY_SETTINGS = {
  MIN_BOUNDARY_POINTS: 3, // Minimum points to define a boundary
  MAX_BOUNDARY_POINTS: 50, // Maximum points for a boundary
  BOUNDARY_PRECISION: 6, // Decimal places for coordinates
  DUPLICATE_OVERLAP_THRESHOLD: 0.7, // 70% overlap considered duplicate
} as const;

// Property images
export const PROPERTY_IMAGE_SETTINGS = {
  MAX_IMAGES: 20,
  MIN_IMAGES: 1,
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  THUMBNAIL_WIDTH: 400,
  THUMBNAIL_HEIGHT: 300,
  FULL_WIDTH: 1920,
  FULL_HEIGHT: 1080,
} as const;

// Property listing limits
export const LISTING_LIMITS = {
  FREE_TIER_MAX_PROPERTIES: 5,
  PREMIUM_TIER_MAX_PROPERTIES: 50,
  ADMIN_MAX_PROPERTIES: -1, // Unlimited
} as const;

// Property view tracking
export const VIEW_TRACKING = {
  TRACK_ANONYMOUS_VIEWS: true,
  TRACK_LOGGED_IN_VIEWS: true,
  TRACK_REFERRAL_SOURCE: true,
  VIEW_COUNT_INTERVAL_SECONDS: 60, // Don't count multiple views within 60 seconds
} as const;

// Property marketing
export const MARKETING_SETTINGS = {
  ENABLE_SHAREABLE_LINKS: true,
  ENABLE_AGENT_PROMOTION: true,
  ENABLE_QR_CODES: true,
  ENABLE_SOCIAL_SHARING: true,
  LINK_EXPIRY_DAYS: 365, // Links expire after 1 year
} as const;

// Property performance metrics
export const PERFORMANCE_METRICS = {
  EXCELLENT_CONVERSION_RATE: 5.0, // 5% or higher
  GOOD_CONVERSION_RATE: 3.0, // 3-5%
  AVERAGE_CONVERSION_RATE: 1.5, // 1.5-3%
  POOR_CONVERSION_RATE: 1.5, // Below 1.5%
} as const;

// Property search and filtering
export const SEARCH_SETTINGS = {
  MAX_SEARCH_RESULTS: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PRICE_RANGE_MULTIPLIER: 10, // Max price can be 10x min price
  FUZZY_SEARCH_THRESHOLD: 0.6, // Similarity threshold for fuzzy search
} as const;

// Property availability
export const AVAILABILITY_SETTINGS = {
  MARK_AS_UNAVAILABLE_AFTER_RENTAL: true,
  AUTO_RELIST_AFTER_RENTAL_EXPIRY: false,
  AVAILABILITY_BUFFER_DAYS: 7, // Days before available date to show property
} as const;

// Property payment locking
export const PAYMENT_LOCK_SETTINGS = {
  LOCK_DURATION_MINUTES: 30, // Lock property for 30 minutes during payment
  MAX_LOCK_RETRIES: 3,
  LOCK_RETRY_DELAY_MS: 1000, // 1 second between retries
} as const;

// Property marking service
export const MARKING_SERVICE_SETTINGS = {
  MAX_COMPLETION_DAYS: 3, // Maximum 3 days to complete marking
  TIME_SLOT_HOURS: 3, // 3-hour time slot for agents
  QUEUE_EXPIRY_HOURS: 72, // Queue expires after 72 hours
  MARKING_VERIFICATION_PERIOD_HOURS: 48, // 2-3 days for owner to verify
  MAX_VERIFICATION_ATTEMPTS: 5, // Max attempts before closing job
} as const;

// Occupancy calculation
export const OCCUPANCY_SETTINGS = {
  EXCELLENT_OCCUPANCY_RATE: 90, // 90% or higher
  GOOD_OCCUPANCY_RATE: 75, // 75-90%
  FAIR_OCCUPANCY_RATE: 50, // 50-75%
  POOR_OCCUPANCY_RATE: 50, // Below 50%
} as const;

// Property validation rules
export const PROPERTY_VALIDATION_RULES = {
  MIN_TITLE_LENGTH: 10,
  MAX_TITLE_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_PRICE: 1000, // 1,000 NGN
  MAX_PRICE: 100000000, // 100 million NGN
  MIN_BEDROOMS: 0,
  MAX_BEDROOMS: 50,
  MIN_BATHROOMS: 0,
  MAX_BATHROOMS: 50,
  MIN_AREA: 1, // 1 sqm
  MAX_AREA: 100000, // 100,000 sqm
} as const;

// Property export formats
export const EXPORT_FORMATS_DOCS = {
  CSV: 'csv',
  PDF: 'pdf',
  XLSX: 'xlsx',
  JSON: 'json',
} as const;

// Property notification events
export const NOTIFICATION_EVENTS = {
  PROPERTY_CREATED: 'property:created',
  PROPERTY_UPDATED: 'property:updated',
  PROPERTY_PUBLISHED: 'property:published',
  PROPERTY_RENTED: 'property:rented',
  PROPERTY_APPROVED: 'property:approved',
  PROPERTY_REJECTED: 'property:rejected',
  PROPERTY_VIEWED: 'property:viewed',
  PROPERTY_FAVORITED: 'property:favorited',
  RENTAL_CONFIRMED: 'rental:confirmed',
  RENTAL_EXPIRED: 'rental:expired',
  MARKING_REQUESTED: 'marking:requested',
  MARKING_COMPLETED: 'marking:completed',
  MARKING_VERIFIED: 'marking:verified',
} as const;

// Analytics periods
export const PROPERTY_ANALYTICS_PERIODS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  LAST_7_DAYS: 'last-7-days',
  LAST_30_DAYS: 'last-30-days',
  LAST_90_DAYS: 'last-90-days',
  LAST_12_MONTHS: 'last-12-months',
  THIS_MONTH: 'this-month',
  THIS_YEAR: 'this-year',
  CUSTOM: 'custom',
} as const;

// Dashboard metric types
export const METRIC_TYPES = {
  VIEWS: 'views',
  RENTALS: 'rentals',
  REVENUE: 'revenue',
  CONVERSION: 'conversion',
  OCCUPANCY: 'occupancy',
  COMMISSION: 'commission',
} as const;

// Property sorting options
export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  PRICE_LOW_HIGH: 'price_low_high',
  PRICE_HIGH_LOW: 'price_high_low',
  MOST_VIEWED: 'most_viewed',
  MOST_POPULAR: 'most_popular',
  BEST_RATED: 'best_rated',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  PROPERTY_NOT_FOUND: 'Property not found',
  PROPERTY_ACCESS_DENIED: 'You do not have permission to access this property',
  PROPERTY_ALREADY_RENTED: 'This property is already rented',
  PROPERTY_NOT_AVAILABLE: 'This property is not available',
  INVALID_PROPERTY_DATA: 'Invalid property data provided',
  BOUNDARY_OVERLAP: 'Property boundary overlaps with existing property',
  MARKING_JOB_NOT_FOUND: 'Marking job not found',
  INVALID_UNIT_DATA: 'Invalid unit data provided',
  UNIT_NOT_FOUND: 'Unit not found',
  PAYMENT_LOCK_FAILED: 'Failed to acquire payment lock',
} as const;

// Success messages
export const PROPERTY_SUCCESS_MESSAGES = {
  PROPERTY_CREATED: 'Property created successfully',
  PROPERTY_UPDATED: 'Property updated successfully',
  PROPERTY_DELETED: 'Property deleted successfully',
  PROPERTY_PUBLISHED: 'Property published successfully',
  MARKING_REQUESTED: 'Marking service requested successfully',
  MARKING_COMPLETED: 'Property marking completed successfully',
  RENTAL_CONFIRMED: 'Rental confirmed successfully',
} as const;