import { AcquireLockInput, ReleaseLockInput, CheckLockInput, ExtendLockInput } from "../validations/locking";

/**
 * Default lock duration in milliseconds (5 minutes)
 */
export const DEFAULT_LOCK_DURATION = 5 * 60 * 1000;

/**
 * Maximum lock duration in milliseconds (15 minutes)
 */
export const MAX_LOCK_DURATION = 15 * 60 * 1000;

/**
 * Minimum lock duration in milliseconds (1 minute)
 */
export const MIN_LOCK_DURATION = 1 * 60 * 1000;

/**
 * Grace period before lock expiry to show warning (30 seconds)
 */
export const LOCK_WARNING_THRESHOLD = 30 * 1000;

/**
 * Generate a unique lock key for a property or unit
 */
export function generateLockKey(propertyId: string, unitId?: string): string {
  return unitId ? `lock:unit:${unitId}` : `lock:property:${propertyId}`;
}

/**
 * Calculate lock expiry timestamp
 */
export function calculateLockExpiry(durationMs: number = DEFAULT_LOCK_DURATION): Date {
  return new Date(Date.now() + durationMs);
}

/**
 * Check if a lock is expired
 */
export function isLockExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * Calculate remaining lock time in milliseconds
 */
export function getRemainingLockTime(expiryDate: Date): number {
  const remaining = expiryDate.getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Check if lock is about to expire (within warning threshold)
 */
export function isLockExpiringSoon(expiryDate: Date): boolean {
  const remaining = getRemainingLockTime(expiryDate);
  return remaining > 0 && remaining <= LOCK_WARNING_THRESHOLD;
}

/**
 * Format remaining time for display
 */
export function formatRemainingTime(expiryDate: Date): string {
  const remaining = getRemainingLockTime(expiryDate);
  
  if (remaining === 0) {
    return "Expired";
  }
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  
  return `${seconds}s`;
}

/**
 * Validate lock duration
 */
export function validateLockDuration(durationMs: number): boolean {
  return durationMs >= MIN_LOCK_DURATION && durationMs <= MAX_LOCK_DURATION;
}

/**
 * Create lock acquisition payload
 */
export function createLockPayload(
  propertyId: string,
  userId: string,
  amount: number,
  unitId?: string,
  lockDurationMs: number = DEFAULT_LOCK_DURATION
): AcquireLockInput {
  return {
    propertyId,
    unitId,
    userId,
    amount,
    lockDurationMs: validateLockDuration(lockDurationMs) ? lockDurationMs : DEFAULT_LOCK_DURATION,
  };
}

/**
 * Create lock release payload
 */
export function createReleaseLockPayload(
  propertyId: string,
  userId: string,
  reason: ReleaseLockInput["reason"],
  unitId?: string
): ReleaseLockInput {
  return {
    propertyId,
    unitId,
    userId,
    reason,
  };
}

/**
 * Parse lock error and return user-friendly message
 */
export function parseLockError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("already locked")) {
      return "This property is currently being processed by another user. Please try again in a few minutes.";
    }
    if (error.message.includes("expired")) {
      return "Your payment session has expired. Please start a new checkout.";
    }
    if (error.message.includes("unavailable")) {
      return "This property is no longer available for rent.";
    }
    return error.message;
  }
  return "An error occurred while processing your request. Please try again.";
}

/**
 * Generate a unique checkout session ID
 */
export function generateCheckoutSessionId(): string {
  return `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if user can acquire lock (rate limiting check)
 */
export function canAcquireLock(recentAttempts: number, maxAttempts: number = 3): boolean {
  return recentAttempts < maxAttempts;
}

/**
 * Calculate retry delay based on attempt count (exponential backoff)
 */
export function calculateRetryDelay(attemptCount: number): number {
  const baseDelay = 2000; // 2 seconds
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  return delay;
}

/**
 * Create a lock status object for UI display
 */
export interface LockStatus {
  isLocked: boolean;
  lockedBy?: string;
  expiresAt?: Date;
  remainingTime?: number;
  isExpiringSoon?: boolean;
  canExtend?: boolean;
}

export function createLockStatus(
  isLocked: boolean,
  expiryDate?: Date,
  lockedBy?: string
): LockStatus {
  if (!isLocked || !expiryDate) {
    return { isLocked: false };
  }

  const remainingTime = getRemainingLockTime(expiryDate);
  const expired = remainingTime === 0;

  return {
    isLocked: !expired,
    lockedBy,
    expiresAt: expiryDate,
    remainingTime,
    isExpiringSoon: isLockExpiringSoon(expiryDate),
    canExtend: remainingTime > 0 && remainingTime < MAX_LOCK_DURATION,
  };
}

/**
 * Sanitize lock data for client-side use (remove sensitive info)
 */
export function sanitizeLockData<T extends Record<string, unknown>>(
  lockData: T,
  currentUserId: string
): Partial<T> {
  const { userId, ...rest } = lockData as Record<string, unknown>;
  
  // Only include user ID if it matches current user
  if (userId === currentUserId) {
    return lockData;
  }
  
  return rest as Partial<T>;
}