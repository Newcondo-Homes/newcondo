/**
 * Marking Service Configuration
 * Central configuration for property marking service
 */

export const markingConfig = {
  // Service Identification
  SERVICE_NAME: 'marking-service',
  SERVICE_VERSION: '1.0.0',

  // API Configuration
  API: {
    // Base paths
    BASE_PATH: '/api/v1/marking',
    HEALTH_CHECK_PATH: '/health',
    READY_CHECK_PATH: '/ready',

    // Response format
    RESPONSE_FORMAT: 'json',
    
    // Timeout settings (in milliseconds)
    REQUEST_TIMEOUT: 30000,
    SOCKET_TIMEOUT: 60000,
  },

  // Database Configuration
  DATABASE: {
    // Query timeouts
    QUERY_TIMEOUT: 10000,
    CONNECTION_TIMEOUT: 5000,
    IDLE_TIMEOUT: 30000,

    // Connection pooling
    POOL_MIN: 2,
    POOL_MAX: 10,
  },

  // Queue Configuration
  QUEUE: {
    // Processing settings
    MAX_ATTEMPTS: 3,
    RETRY_DELAY_MS: 5000,
    PROCESSING_BATCH_SIZE: 10,

    // Queue priority levels
    PRIORITY_LEVELS: {
      LOW: 1,
      NORMAL: 2,
      HIGH: 3,
      URGENT: 4,
    },

    // Dead letter queue
    DEAD_LETTER_QUEUE_ENABLED: true,
    DLQ_RETENTION_DAYS: 30,
  },

  // Notification Configuration
  NOTIFICATIONS: {
    // Email settings
    EMAIL: {
      ENABLED: true,
      SENDER_EMAIL: process.env.NOTIFICATION_SENDER_EMAIL || 'noreply@newcondo.com',
      SENDER_NAME: 'Newcondo',
      REPLY_TO: process.env.NOTIFICATION_REPLY_TO || 'support@newcondo.com',
    },

    // SMS settings
    SMS: {
      ENABLED: true,
      SENDER_ID: process.env.SMS_SENDER_ID || 'NEWCONDO',
    },

    // Push notification settings
    PUSH: {
      ENABLED: true,
    },

    // Notification retry settings
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 10000,
  },

  // File Upload Configuration
  FILE_UPLOAD: {
    MAX_FILE_SIZE_MB: 10,
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    UPLOAD_SERVICE: 'uploadthing', // Using uploadthing as specified
    STORAGE_PATH: '/marking-service/uploads',
  },

  // Geolocation Configuration
  GEOLOCATION: {
    // Google Maps API settings
    GOOGLE_MAPS_ENABLED: true,
    MAP_STYLE: 'satellite', // Default to satellite view for boundary marking
    
    // Default zoom levels
    DEFAULT_ZOOM: 18, // Close-up for detailed marking
    MIN_ZOOM: 15,
    MAX_ZOOM: 21,

    // Location precision
    LOCATION_PRECISION_DECIMAL_PLACES: 6, // ~0.11 meter precision
  },

  // Virtual Account Configuration
  VIRTUAL_ACCOUNT: {
    // Flutterwave integration
    PROVIDER: 'flutterwave',
    ENABLE_AUTO_CREATION: true,
    
    // Account settings
    ACCOUNT_NAME_FORMAT: 'NEWCONDO-{USER_ID}-{PROPERTY_ID}',
    AUTO_SETTLEMENT_ENABLED: false, // Manual settlement by default
    SETTLEMENT_MINIMUM_AMOUNT: 0, // No minimum for payouts

    // Account maintenance
    INACTIVE_ACCOUNT_THRESHOLD_DAYS: 90,
    AUTO_CLOSE_INACTIVE: false,
  },

  // Logging Configuration
  LOGGING: {
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FORMAT: 'json',
    
    // Log retention
    LOG_RETENTION_DAYS: 30,
    
    // Sensitive data masking
    MASK_SENSITIVE_DATA: true,
    FIELDS_TO_MASK: ['phoneNumber', 'email', 'password', 'ssn', 'nin'],
  },

  // Security Configuration
  SECURITY: {
    // Rate limiting
    RATE_LIMIT: {
      ENABLED: true,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100,
    },

    // CORS settings
    CORS: {
      ENABLED: true,
      ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
      ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
      CREDENTIALS: true,
    },

    // JWT settings
    JWT: {
      ALGORITHM: 'HS256',
      EXPIRY: '24h',
    },

    // HTTPS enforcement
    HTTPS_ONLY: process.env.NODE_ENV === 'production',
  },

  // Feature Flags
  FEATURES: {
    ENABLE_MARKING_JOBS: true,
    ENABLE_QUEUE_SYSTEM: true,
    ENABLE_AUTOMATIC_ASSIGNMENT: true,
    ENABLE_TIME_SLOT_MANAGEMENT: true,
    ENABLE_BOUNDARY_VERIFICATION: true,
    ENABLE_PAYMENT_PROCESSING: true,
    ENABLE_VIRTUAL_ACCOUNTS: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_ANALYTICS: true,
  },

  // Environment-specific settings
  ENVIRONMENT: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_TESTING: process.env.NODE_ENV === 'test',
  },
} as const;

export default markingConfig;