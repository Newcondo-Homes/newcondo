// apps/platform/types/locking.ts

/**
 * Property/Unit Lock Status
 */
export enum LockStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  PROCESSING = 'PROCESSING',
  EXPIRED = 'EXPIRED'
}

/**
 * Lock Type - determines what is being locked
 */
export enum LockType {
  PROPERTY = 'PROPERTY',
  UNIT = 'UNIT'
}

/**
 * Payment Lock Information
 */
export interface PaymentLock {
  id: string;
  resourceId: string; // propertyId or unitId
  resourceType: LockType;
  userId: string;
  sessionId: string;
  status: LockStatus;
  expiresAt: Date | string;
  createdAt: Date | string;
  releasedAt?: Date | string;
  metadata?: {
    amount: number;
    currency: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

/**
 * Lock Acquisition Request
 */
export interface AcquireLockRequest {
  resourceId: string;
  resourceType: LockType;
  userId: string;
  sessionId: string;
  amount: number;
  currency?: string;
  durationMinutes?: number; // Default: 15 minutes
}

/**
 * Lock Acquisition Response
 */
export interface AcquireLockResponse {
  success: boolean;
  lock?: PaymentLock;
  error?: {
    code: string;
    message: string;
    conflictingLock?: {
      userId: string;
      expiresAt: Date | string;
      timeRemaining: number; // seconds
    };
  };
}

/**
 * Lock Release Request
 */
export interface ReleaseLockRequest {
  lockId: string;
  userId: string;
  reason?: 'payment_success' | 'payment_failed' | 'user_cancelled' | 'expired';
}

/**
 * Lock Release Response
 */
export interface ReleaseLockResponse {
  success: boolean;
  releasedAt?: Date | string;
  error?: string;
}

/**
 * Lock Extension Request
 */
export interface ExtendLockRequest {
  lockId: string;
  userId: string;
  additionalMinutes: number;
}

/**
 * Lock Extension Response
 */
export interface ExtendLockResponse {
  success: boolean;
  newExpiresAt?: Date | string;
  error?: string;
}

/**
 * Lock Validation Result
 */
export interface LockValidation {
  isValid: boolean;
  lock?: PaymentLock;
  error?: {
    code: 'LOCK_NOT_FOUND' | 'LOCK_EXPIRED' | 'LOCK_INVALID_USER' | 'LOCK_ALREADY_RELEASED';
    message: string;
  };
}

/**
 * Active Locks Query Response
 */
export interface ActiveLocksResponse {
  locks: PaymentLock[];
  total: number;
}

/**
 * Lock Statistics
 */
export interface LockStatistics {
  totalLocks: number;
  activeLocks: number;
  expiredLocks: number;
  averageLockDuration: number; // minutes
  lockConflicts: number;
}

/**
 * Frontend Lock State
 */
export interface LockState {
  currentLock: PaymentLock | null;
  isLocking: boolean;
  isReleasing: boolean;
  isExtending: boolean;
  error: string | null;
  timeRemaining: number | null; // seconds
  conflictDetected: boolean;
}

/**
 * Lock Timer Configuration
 */
export interface LockTimerConfig {
  lockId: string;
  expiresAt: Date | string;
  warningThreshold: number; // seconds before expiry to show warning
  onExpire: () => void;
  onWarning: (timeRemaining: number) => void;
  onTick?: (timeRemaining: number) => void;
}

/**
 * Lock Conflict Information
 */
export interface LockConflict {
  resourceId: string;
  resourceType: LockType;
  existingLock: {
    userId: string;
    expiresAt: Date | string;
    timeRemaining: number;
  };
  attemptedBy: string;
  attemptedAt: Date | string;
}

/**
 * Concurrent Payment Attempt Log
 */
export interface PaymentAttemptLog {
  id: string;
  userId: string;
  resourceId: string;
  resourceType: LockType;
  amount: number;
  status: 'LOCKED' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CONFLICT';
  failureReason?: string;
  lockAcquired: boolean;
  lockDuration?: number; // milliseconds
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date | string;
}

/**
 * Lock Health Check Response
 */
export interface LockHealthCheck {
  systemStatus: 'healthy' | 'degraded' | 'down';
  activeLocksCount: number;
  staleLocksCount: number;
  lastCleanupAt: Date | string;
}