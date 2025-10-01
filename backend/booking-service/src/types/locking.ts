// backend/booking-service/src/types/locking.ts

/**
 * Lock status enumeration
 */
export enum LockStatus {
  ACQUIRED = 'ACQUIRED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

/**
 * Lock type enumeration - defines what kind of lock is being used
 */
export enum LockType {
  PROPERTY = 'PROPERTY',
  UNIT = 'UNIT',
  PAYMENT = 'PAYMENT',
}

/**
 * Property lock interface
 */
export interface PropertyLock {
  id: string;
  propertyId: string;
  unitId?: string | null;
  userId: string;
  lockType: LockType;
  status: LockStatus;
  acquiredAt: Date;
  expiresAt: Date;
  releasedAt?: Date | null;
  sessionId: string; // Unique session identifier for the lock
  metadata?: Record<string, any>;
}

/**
 * Lock acquisition request
 */
export interface LockAcquisitionRequest {
  propertyId: string;
  unitId?: string | null;
  userId: string;
  lockType: LockType;
  lockDuration?: number; // Duration in milliseconds (default: 15 minutes)
  sessionId: string;
  metadata?: Record<string, any>;
}

/**
 * Lock acquisition response
 */
export interface LockAcquisitionResponse {
  success: boolean;
  lock?: PropertyLock;
  error?: string;
  existingLock?: PropertyLock; // If lock already exists
  message?: string;
}

/**
 * Lock release request
 */
export interface LockReleaseRequest {
  lockId: string;
  userId: string;
  sessionId: string;
  reason?: string;
}

/**
 * Lock release response
 */
export interface LockReleaseResponse {
  success: boolean;
  lockId: string;
  releasedAt?: Date;
  error?: string;
  message?: string;
}

/**
 * Lock validation result
 */
export interface LockValidationResult {
  isValid: boolean;
  lock?: PropertyLock;
  error?: string;
  reason?: string;
}

/**
 * Lock extension request
 */
export interface LockExtensionRequest {
  lockId: string;
  userId: string;
  sessionId: string;
  extensionDuration: number; // Duration in milliseconds
}

/**
 * Lock extension response
 */
export interface LockExtensionResponse {
  success: boolean;
  lock?: PropertyLock;
  newExpiryTime?: Date;
  error?: string;
  message?: string;
}

/**
 * Lock query options
 */
export interface LockQueryOptions {
  propertyId?: string;
  unitId?: string;
  userId?: string;
  lockType?: LockType;
  status?: LockStatus;
  includeExpired?: boolean;
}

/**
 * Mutex lock configuration
 */
export interface MutexConfig {
  lockKey: string; // Redis key for the lock
  lockDuration: number; // Duration in milliseconds
  retryAttempts: number; // Number of retry attempts
  retryDelay: number; // Delay between retries in milliseconds
}

/**
 * Mutex lock result
 */
export interface MutexLockResult {
  acquired: boolean;
  lockKey: string;
  lockValue: string; // Unique value to identify lock owner
  expiresAt: Date;
  error?: string;
}

/**
 * Mutex unlock result
 */
export interface MutexUnlockResult {
  released: boolean;
  lockKey: string;
  error?: string;
}

/**
 * Lock cleanup options
 */
export interface LockCleanupOptions {
  olderThan?: Date; // Clean locks older than this date
  status?: LockStatus;
  propertyId?: string;
  unitId?: string;
}

/**
 * Lock cleanup result
 */
export interface LockCleanupResult {
  success: boolean;
  cleanedCount: number;
  error?: string;
}

/**
 * Lock statistics
 */
export interface LockStatistics {
  totalActiveLocks: number;
  totalExpiredLocks: number;
  locksByType: Record<LockType, number>;
  locksByStatus: Record<LockStatus, number>;
  averageLockDuration: number; // In milliseconds
}

/**
 * Payment lock metadata
 */
export interface PaymentLockMetadata {
  amount: number;
  currency: string;
  paymentIntentId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Lock conflict information
 */
export interface LockConflict {
  conflictType: 'EXISTING_LOCK' | 'EXPIRED_LOCK' | 'INVALID_SESSION';
  existingLock?: PropertyLock;
  requestedBy: string;
  conflictedAt: Date;
  message: string;
}

/**
 * Batch lock operation request
 */
export interface BatchLockRequest {
  locks: LockAcquisitionRequest[];
  atomicOperation?: boolean; // If true, all locks must succeed or all fail
}

/**
 * Batch lock operation response
 */
export interface BatchLockResponse {
  success: boolean;
  successfulLocks: PropertyLock[];
  failedLocks: Array<{
    request: LockAcquisitionRequest;
    error: string;
  }>;
  message?: string;
}

/**
 * Lock event for logging/monitoring
 */
export interface LockEvent {
  eventType: 'ACQUIRED' | 'RELEASED' | 'EXPIRED' | 'FAILED' | 'EXTENDED';
  lockId?: string;
  propertyId: string;
  unitId?: string | null;
  userId: string;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Lock health check result
 */
export interface LockHealthCheck {
  healthy: boolean;
  activeLocksCount: number;
  expiredLocksCount: number;
  redisConnected: boolean;
  lastCleanupAt?: Date;
  issues?: string[];
}