// backend/property-service/src/types/locking.ts

export interface PropertyLock {
  propertyId: string;
  unitId?: string | null;
  userId: string;
  lockToken: string;
  expiresAt: Date;
  lockedAt: Date;
  lockType: LockType;
  metadata?: LockMetadata;
}

export enum LockType {
  PAYMENT = 'PAYMENT',
  BOOKING = 'BOOKING',
  INSPECTION = 'INSPECTION',
  MAINTENANCE = 'MAINTENANCE',
}

export interface LockMetadata {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  amount?: number;
  paymentIntentId?: string;
}

export interface LockAcquisitionRequest {
  propertyId: string;
  unitId?: string | null;
  userId: string;
  lockType: LockType;
  durationMinutes?: number; // Default: 15 minutes
  metadata?: LockMetadata;
}

export interface LockAcquisitionResult {
  success: boolean;
  lock?: PropertyLock;
  error?: LockError;
  remainingTime?: number; // If lock exists, time remaining in seconds
  existingLockHolder?: {
    userId: string;
    lockedAt: Date;
    expiresAt: Date;
  };
}

export interface LockError {
  code: LockErrorCode;
  message: string;
  details?: Record<string, any>;
}

export enum LockErrorCode {
  ALREADY_LOCKED = 'ALREADY_LOCKED',
  LOCK_EXPIRED = 'LOCK_EXPIRED',
  INVALID_LOCK_TOKEN = 'INVALID_LOCK_TOKEN',
  PROPERTY_NOT_FOUND = 'PROPERTY_NOT_FOUND',
  UNIT_NOT_FOUND = 'UNIT_NOT_FOUND',
  PROPERTY_UNAVAILABLE = 'PROPERTY_UNAVAILABLE',
  CONCURRENT_LOCK_ATTEMPT = 'CONCURRENT_LOCK_ATTEMPT',
  LOCK_ACQUISITION_FAILED = 'LOCK_ACQUISITION_FAILED',
  INVALID_LOCK_DURATION = 'INVALID_LOCK_DURATION',
}

export interface LockReleaseRequest {
  propertyId: string;
  unitId?: string | null;
  userId: string;
  lockToken: string;
  reason?: LockReleaseReason;
}

export enum LockReleaseReason {
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  TIMEOUT = 'TIMEOUT',
  USER_CANCELLED = 'USER_CANCELLED',
  SYSTEM_RELEASE = 'SYSTEM_RELEASE',
}

export interface LockReleaseResult {
  success: boolean;
  error?: LockError;
}

export interface LockStatusRequest {
  propertyId: string;
  unitId?: string | null;
}

export interface LockStatusResponse {
  isLocked: boolean;
  lock?: PropertyLock;
  availability: AvailabilityStatus;
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  OCCUPIED = 'OCCUPIED',
  UNAVAILABLE = 'UNAVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
}

export interface LockExtensionRequest {
  propertyId: string;
  unitId?: string | null;
  userId: string;
  lockToken: string;
  additionalMinutes: number;
}

export interface LockExtensionResult {
  success: boolean;
  newExpiresAt?: Date;
  error?: LockError;
}

export interface PaymentAttemptLog {
  id: string;
  userId: string;
  propertyId: string;
  unitId?: string | null;
  amount: number;
  status: PaymentAttemptStatus;
  failureReason?: string;
  lockAcquired: boolean;
  lockDuration?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export enum PaymentAttemptStatus {
  LOCKED = 'LOCKED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictType?: ConflictType;
  conflictDetails?: ConflictDetails;
  recommendations?: string[];
}

export enum ConflictType {
  DOUBLE_BOOKING = 'DOUBLE_BOOKING',
  OVERLAPPING_RENTAL = 'OVERLAPPING_RENTAL',
  EXISTING_LOCK = 'EXISTING_LOCK',
  DUPLICATE_PROPERTY = 'DUPLICATE_PROPERTY',
  BOUNDARY_CONFLICT = 'BOUNDARY_CONFLICT',
}

export interface ConflictDetails {
  conflictingEntityId: string;
  conflictingUserId?: string;
  conflictStart?: Date;
  conflictEnd?: Date;
  description: string;
  severity: ConflictSeverity;
}

export enum ConflictSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface BulkLockStatusRequest {
  properties: Array<{
    propertyId: string;
    unitId?: string | null;
  }>;
}

export interface BulkLockStatusResponse {
  locks: Map<string, LockStatusResponse>; // Key: propertyId or propertyId-unitId
}

export interface LockCleanupResult {
  expiredLocksRemoved: number;
  errors: Array<{
    lockId: string;
    error: string;
  }>;
}