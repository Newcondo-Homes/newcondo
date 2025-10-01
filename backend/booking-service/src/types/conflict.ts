// backend/booking-service/src/types/conflict.ts

/**
 * Conflict type enumeration
 */
export enum ConflictType {
  DOUBLE_BOOKING = 'DOUBLE_BOOKING',
  SIMULTANEOUS_PAYMENT = 'SIMULTANEOUS_PAYMENT',
  EXPIRED_LOCK = 'EXPIRED_LOCK',
  INVALID_AVAILABILITY = 'INVALID_AVAILABILITY',
  UNIT_ALREADY_RENTED = 'UNIT_ALREADY_RENTED',
  PROPERTY_ALREADY_RENTED = 'PROPERTY_ALREADY_RENTED',
  BOUNDARY_OVERLAP = 'BOUNDARY_OVERLAP',
  DUPLICATE_PROPERTY = 'DUPLICATE_PROPERTY',
}

/**
 * Conflict severity levels
 */
export enum ConflictSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Conflict resolution status
 */
export enum ConflictResolutionStatus {
  PENDING = 'PENDING',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
  ESCALATED = 'ESCALATED',
}

/**
 * Base booking conflict interface
 */
export interface BookingConflict {
  id: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  propertyId: string;
  unitId?: string | null;
  status: ConflictResolutionStatus;
  detectedAt: Date;
  resolvedAt?: Date | null;
  metadata?: Record<string, any>;
}

/**
 * Double booking conflict details
 */
export interface DoubleBookingConflict extends BookingConflict {
  conflictType: ConflictType.DOUBLE_BOOKING;
  firstBooking: {
    userId: string;
    rentalId?: string;
    paymentId?: string;
    startDate: Date;
    endDate?: Date;
  };
  secondBooking: {
    userId: string;
    rentalId?: string;
    paymentId?: string;
    startDate: Date;
    endDate?: Date;
  };
  overlapPeriod: {
    start: Date;
    end: Date;
  };
}

/**
 * Simultaneous payment conflict
 */
export interface SimultaneousPaymentConflict extends BookingConflict {
  conflictType: ConflictType.SIMULTANEOUS_PAYMENT;
  payments: Array<{
    userId: string;
    paymentId: string;
    amount: number;
    currency: string;
    initiatedAt: Date;
    lockAttempted: boolean;
    lockAcquired: boolean;
  }>;
  winner?: {
    userId: string;
    paymentId: string;
  };
  timeDifference: number; // Milliseconds between attempts
}

/**
 * Expired lock conflict
 */
export interface ExpiredLockConflict extends BookingConflict {
  conflictType: ConflictType.EXPIRED_LOCK;
  expiredLock: {
    lockId: string;
    userId: string;
    acquiredAt: Date;
    expiredAt: Date;
  };
  newAttempt: {
    userId: string;
    attemptedAt: Date;
  };
}

/**
 * Invalid availability conflict
 */
export interface InvalidAvailabilityConflict extends BookingConflict {
  conflictType: ConflictType.INVALID_AVAILABILITY;
  expectedStatus: string;
  actualStatus: string;
  lastUpdatedAt: Date;
  attemptedBy: string;
}

/**
 * Unit already rented conflict
 */
export interface UnitAlreadyRentedConflict extends BookingConflict {
  conflictType: ConflictType.UNIT_ALREADY_RENTED;
  existingRental: {
    rentalId: string;
    renterId: string;
    startDate: Date;
    endDate?: Date;
    status: string;
  };
  attemptedRental: {
    userId: string;
    requestedStartDate: Date;
  };
}

/**
 * Boundary overlap conflict (from Phase 4)
 */
export interface BoundaryOverlapConflict extends BookingConflict {
  conflictType: ConflictType.BOUNDARY_OVERLAP;
  overlapPercentage: number;
  conflictingProperties: Array<{
    propertyId: string;
    ownerId: string;
    boundaryVerified: boolean;
  }>;
}

/**
 * Conflict detection request
 */
export interface ConflictDetectionRequest {
  propertyId: string;
  unitId?: string | null;
  userId: string;
  startDate: Date;
  endDate?: Date;
  amount?: number;
  checkTypes?: ConflictType[];
}

/**
 * Conflict detection response
 */
export interface ConflictDetectionResponse {
  hasConflict: boolean;
  conflicts: BookingConflict[];
  canProceed: boolean;
  warnings?: string[];
  recommendations?: string[];
}

/**
 * Conflict resolution request
 */
export interface ConflictResolutionRequest {
  conflictId: string;
  resolvedBy: string; // User ID or system
  resolution: string;
  action: ConflictResolutionAction;
  metadata?: Record<string, any>;
}

/**
 * Conflict resolution actions
 */
export enum ConflictResolutionAction {
  CANCEL_FIRST_BOOKING = 'CANCEL_FIRST_BOOKING',
  CANCEL_SECOND_BOOKING = 'CANCEL_SECOND_BOOKING',
  REFUND_BOTH = 'REFUND_BOTH',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  AUTO_RESOLVED = 'AUTO_RESOLVED',
  ESCALATE_TO_ADMIN = 'ESCALATE_TO_ADMIN',
}

/**
 * Conflict resolution response
 */
export interface ConflictResolutionResponse {
  success: boolean;
  conflictId: string;
  resolution: string;
  action: ConflictResolutionAction;
  resolvedAt: Date;
  affectedUsers: string[];
  nextSteps?: string[];
}

/**
 * Conflict prevention check
 */
export interface ConflictPreventionCheck {
  propertyId: string;
  unitId?: string | null;
  checks: {
    hasActiveLock: boolean;
    lockOwnedByUser?: boolean;
    isAvailable: boolean;
    hasActiveRental: boolean;
    hasExpiredLock: boolean;
    hasPendingPayments: boolean;
  };
  canProceed: boolean;
  blockers: string[];
}

/**
 * Booking conflict statistics
 */
export interface ConflictStatistics {
  totalConflicts: number;
  conflictsByType: Record<ConflictType, number>;
  conflictsBySeverity: Record<ConflictSeverity, number>;
  conflictsByStatus: Record<ConflictResolutionStatus, number>;
  averageResolutionTime: number; // In milliseconds
  conflictRate: number; // Percentage of bookings with conflicts
  mostCommonType: ConflictType;
  trendData?: Array<{
    date: Date;
    count: number;
    type: ConflictType;
  }>;
}

/**
 * Conflict alert configuration
 */
export interface ConflictAlertConfig {
  enabled: boolean;
  severityThreshold: ConflictSeverity;
  notifyAdmins: boolean;
  notifyUsers: boolean;
  alertChannels: ('email' | 'sms' | 'push')[];
  escalationDelay: number; // Minutes before escalation
}

/**
 * Conflict event log
 */
export interface ConflictEvent {
  eventId: string;
  conflictId: string;
  eventType: 'DETECTED' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED' | 'CANCELLED';
  performedBy?: string;
  timestamp: Date;
  details: string;
  metadata?: Record<string, any>;
}

/**
 * Bulk conflict check request
 */
export interface BulkConflictCheckRequest {
  checks: ConflictDetectionRequest[];
  stopOnFirstConflict?: boolean;
}

/**
 * Bulk conflict check response
 */
export interface BulkConflictCheckResponse {
  totalChecks: number;
  conflictsFound: number;
  results: Array<{
    request: ConflictDetectionRequest;
    response: ConflictDetectionResponse;
  }>;
}

/**
 * Payment queue position
 */
export interface PaymentQueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // In milliseconds
  propertyId: string;
  unitId?: string | null;
  userId: string;
  queuedAt: Date;
}

/**
 * Payment queue conflict
 */
export interface PaymentQueueConflict {
  propertyId: string;
  unitId?: string | null;
  queueSize: number;
  concurrentAttempts: number;
  conflicts: Array<{
    userId: string;
    position: number;
    timestamp: Date;
  }>;
}

/**
 * Conflict mitigation strategy
 */
export interface ConflictMitigationStrategy {
  strategyType: 'LOCK_EXTENSION' | 'QUEUE_PRIORITY' | 'AUTO_REFUND' | 'MANUAL_INTERVENTION';
  description: string;
  applicableConflicts: ConflictType[];
  autoApply: boolean;
}

/**
 * Conflict resolution history
 */
export interface ConflictResolutionHistory {
  conflictId: string;
  history: Array<{
    action: ConflictResolutionAction;
    performedBy: string;
    timestamp: Date;
    notes?: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  }>;
}

/**
 * Real-time conflict monitor
 */
export interface ConflictMonitor {
  activeConflicts: number;
  criticalConflicts: number;
  recentConflicts: BookingConflict[];
  systemHealth: {
    lockServiceHealthy: boolean;
    queueServiceHealthy: boolean;
    lastConflictAt?: Date;
  };
}