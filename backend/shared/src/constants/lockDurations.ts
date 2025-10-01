// backend/shared/src/constants/lockDurations.ts

export const LOCK_DURATIONS = {
  // Payment lock durations (in milliseconds)
  PAYMENT_LOCK: 10 * 60 * 1000, // 10 minutes
  PAYMENT_LOCK_EXTENDED: 15 * 60 * 1000, // 15 minutes for slow payment gateways
  
  // Queue timeouts
  QUEUE_TIMEOUT: 5 * 60 * 1000, // 5 minutes in queue
  QUEUE_PROCESSING_TIMEOUT: 3 * 60 * 1000, // 3 minutes processing time
  
  // Retry configurations
  LOCK_RETRY_DELAY: 1000, // 1 second
  MAX_LOCK_RETRIES: 3,
  
  // Cleanup intervals
  EXPIRED_LOCKS_CLEANUP_INTERVAL: 1 * 60 * 1000, // 1 minute
  STALE_QUEUE_CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Grace periods
  LOCK_EXPIRY_GRACE_PERIOD: 30 * 1000, // 30 seconds grace
  PAYMENT_COMPLETION_GRACE: 2 * 60 * 1000, // 2 minutes after payment
} as const;

export const LOCK_REASONS = {
  // Success reasons
  LOCK_ACQUIRED: 'Lock successfully acquired',
  LOCK_RELEASED: 'Lock successfully released',
  
  // Failure reasons
  ALREADY_LOCKED: 'Property is already locked by another user',
  PROPERTY_UNAVAILABLE: 'Property is not available for booking',
  PAYMENT_IN_PROGRESS: 'Payment is already in progress for this property',
  ALREADY_RENTED: 'Property has already been rented',
  LOCK_EXPIRED: 'Lock has expired',
  INVALID_LOCK_ID: 'Invalid lock ID provided',
  USER_NOT_AUTHORIZED: 'User is not authorized to release this lock',
  MAX_RETRIES_EXCEEDED: 'Maximum lock acquisition retries exceeded',
  QUEUE_FULL: 'Payment queue is full',
  QUEUE_TIMEOUT: 'Queue processing timeout exceeded',
  DUPLICATE_ATTEMPT: 'Duplicate payment attempt detected',
  UNIT_UNAVAILABLE: 'Selected unit is not available',
  BOUNDARY_CONFLICT: 'Property boundary conflict detected',
  SYSTEM_ERROR: 'System error occurred during lock operation',
} as const;

export const QUEUE_LIMITS = {
  MAX_QUEUE_SIZE: 100, // Maximum number of items in queue
  MAX_CONCURRENT_LOCKS: 5, // Maximum concurrent locks per user
  MAX_DAILY_ATTEMPTS: 10, // Maximum payment attempts per user per day
} as const;

export const AVAILABILITY_CHECK_INTERVALS = {
  REAL_TIME_UPDATE_INTERVAL: 5 * 1000, // 5 seconds for real-time updates
  BACKGROUND_SYNC_INTERVAL: 30 * 1000, // 30 seconds for background sync
  STALE_DATA_THRESHOLD: 60 * 1000, // 1 minute before data is considered stale
} as const;

export const CONFLICT_DETECTION = {
  BOUNDARY_OVERLAP_THRESHOLD: 0.1, // 10% overlap threshold for boundary conflicts
  DUPLICATE_CHECK_RADIUS: 50, // 50 meters radius for duplicate detection
  GPS_ACCURACY_THRESHOLD: 20, // 20 meters GPS accuracy required
} as const;

export type LockDurationType = keyof typeof LOCK_DURATIONS;
export type LockReasonType = keyof typeof LOCK_REASONS;