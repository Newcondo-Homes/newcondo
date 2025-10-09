// backend/marking-service/src/constants/jobStatuses.ts

import { MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@prisma/client';

/**
 * Job status transitions and rules
 */

export const JOB_STATUS_FLOW = {
  [MarkingJobStatus.QUEUED]: [
    MarkingJobStatus.ASSIGNED,
    MarkingJobStatus.CANCELLED,
    MarkingJobStatus.EXPIRED,
  ],
  [MarkingJobStatus.ASSIGNED]: [
    MarkingJobStatus.IN_PROGRESS,
    MarkingJobStatus.QUEUED, // If agent declines or times out
    MarkingJobStatus.CANCELLED,
    MarkingJobStatus.EXPIRED,
  ],
  [MarkingJobStatus.IN_PROGRESS]: [
    MarkingJobStatus.COMPLETED,
    MarkingJobStatus.CANCELLED,
    MarkingJobStatus.EXPIRED,
  ],
  [MarkingJobStatus.COMPLETED]: [], // Terminal state
  [MarkingJobStatus.CANCELLED]: [], // Terminal state
  [MarkingJobStatus.EXPIRED]: [], // Terminal state
} as const;

/**
 * Job status metadata
 */
export const JOB_STATUS_META = {
  [MarkingJobStatus.QUEUED]: {
    label: 'Queued',
    description: 'Job is waiting for agent assignment',
    color: 'blue',
    isTerminal: false,
    requiresAction: true,
    actionBy: 'agent',
  },
  [MarkingJobStatus.ASSIGNED]: {
    label: 'Assigned',
    description: 'Job has been assigned to an agent',
    color: 'purple',
    isTerminal: false,
    requiresAction: true,
    actionBy: 'agent',
  },
  [MarkingJobStatus.IN_PROGRESS]: {
    label: 'In Progress',
    description: 'Agent is currently marking the property',
    color: 'yellow',
    isTerminal: false,
    requiresAction: true,
    actionBy: 'agent',
  },
  [MarkingJobStatus.COMPLETED]: {
    label: 'Completed',
    description: 'Property has been successfully marked',
    color: 'green',
    isTerminal: true,
    requiresAction: true,
    actionBy: 'owner',
  },
  [MarkingJobStatus.CANCELLED]: {
    label: 'Cancelled',
    description: 'Job was cancelled',
    color: 'red',
    isTerminal: true,
    requiresAction: false,
    actionBy: null,
  },
  [MarkingJobStatus.EXPIRED]: {
    label: 'Expired',
    description: 'Job expired due to timeout',
    color: 'gray',
    isTerminal: true,
    requiresAction: false,
    actionBy: null,
  },
} as const;

/**
 * Urgency level metadata
 */
export const URGENCY_LEVEL_META = {
  [UrgencyLevel.LOW]: {
    label: 'Low Priority',
    description: 'No rush, flexible timing',
    color: 'gray',
    multiplier: 1.0,
    maxWaitHours: 72,
  },
  [UrgencyLevel.NORMAL]: {
    label: 'Normal Priority',
    description: 'Standard processing time',
    color: 'blue',
    multiplier: 1.0,
    maxWaitHours: 48,
  },
  [UrgencyLevel.HIGH]: {
    label: 'High Priority',
    description: 'Needs attention soon',
    color: 'orange',
    multiplier: 1.2, // 20% premium
    maxWaitHours: 24,
  },
  [UrgencyLevel.URGENT]: {
    label: 'Urgent',
    description: 'Requires immediate attention',
    color: 'red',
    multiplier: 1.5, // 50% premium
    maxWaitHours: 12,
  },
} as const;

/**
 * Payment status metadata
 */
export const PAYMENT_STATUS_META = {
  [PaymentStatus.PENDING]: {
    label: 'Pending',
    description: 'Payment not yet initiated',
    allowJobCreation: false,
  },
  [PaymentStatus.SUCCESS]: {
    label: 'Successful',
    description: 'Payment completed successfully',
    allowJobCreation: true,
  },
  [PaymentStatus.FAILED]: {
    label: 'Failed',
    description: 'Payment failed',
    allowJobCreation: false,
  },
  [PaymentStatus.CANCELLED]: {
    label: 'Cancelled',
    description: 'Payment was cancelled',
    allowJobCreation: false,
  },
  [PaymentStatus.REFUNDED]: {
    label: 'Refunded',
    description: 'Payment was refunded',
    allowJobCreation: false,
  },
  [PaymentStatus.HELD]: {
    label: 'Held',
    description: 'Payment is being held for confirmation',
    allowJobCreation: true,
  },
  [PaymentStatus.RELEASED]: {
    label: 'Released',
    description: 'Payment has been released to recipient',
    allowJobCreation: true,
  },
} as const;

/**
 * Job status validation helpers
 */
export const jobStatusHelpers = {
  /**
   * Check if status transition is valid
   */
  canTransitionTo: (
    currentStatus: MarkingJobStatus,
    newStatus: MarkingJobStatus
  ): boolean => {
    const allowedTransitions = JOB_STATUS_FLOW[currentStatus];
    return allowedTransitions.includes(newStatus);
  },

  /**
   * Check if status is terminal (no further transitions)
   */
  isTerminalStatus: (status: MarkingJobStatus): boolean => {
    return JOB_STATUS_META[status].isTerminal;
  },

  /**
   * Check if status requires action
   */
  requiresAction: (status: MarkingJobStatus): boolean => {
    return JOB_STATUS_META[status].requiresAction;
  },

  /**
   * Get who should take action for a given status
   */
  getActionBy: (status: MarkingJobStatus): 'agent' | 'owner' | null => {
    return JOB_STATUS_META[status].actionBy;
  },

  /**
   * Get next possible statuses
   */
  getNextStatuses: (currentStatus: MarkingJobStatus): MarkingJobStatus[] => {
    return JOB_STATUS_FLOW[currentStatus];
  },

  /**
   * Get status color for UI
   */
  getStatusColor: (status: MarkingJobStatus): string => {
    return JOB_STATUS_META[status].color;
  },

  /**
   * Get status label
   */
  getStatusLabel: (status: MarkingJobStatus): string => {
    return JOB_STATUS_META[status].label;
  },

  /**
   * Get urgency multiplier for pricing
   */
  getUrgencyMultiplier: (urgency: UrgencyLevel): number => {
    return URGENCY_LEVEL_META[urgency].multiplier;
  },

  /**
   * Get maximum wait time for urgency level
   */
  getMaxWaitHours: (urgency: UrgencyLevel): number => {
    return URGENCY_LEVEL_META[urgency].maxWaitHours;
  },

  /**
   * Check if payment status allows job creation
   */
  canCreateJob: (paymentStatus: PaymentStatus): boolean => {
    return PAYMENT_STATUS_META[paymentStatus].allowJobCreation;
  },
};

/**
 * Job completion requirements
 */
export const COMPLETION_REQUIREMENTS = {
  // Minimum number of completion images required
  MIN_IMAGES: 3,
  MAX_IMAGES: 20,

  // Required image types
  REQUIRED_IMAGE_TYPES: [
    'EXTERIOR_FRONT',
    'EXTERIOR_BACK',
    'PROPERTY_NUMBER',
    'STREET_VIEW',
  ],

  // Optional image types
  OPTIONAL_IMAGE_TYPES: [
    'INTERIOR_LIVING_ROOM',
    'INTERIOR_KITCHEN',
    'INTERIOR_BEDROOM',
    'INTERIOR_BATHROOM',
    'COMPOUND',
    'GATE',
    'PARKING',
  ],

  // Minimum notes length (characters)
  MIN_NOTES_LENGTH: 20,
  MAX_NOTES_LENGTH: 1000,

  // Boundary data validation
  MIN_BOUNDARY_POINTS: 4, // Minimum polygon points
} as const;

/**
 * Job cancellation reasons
 */
export enum CancellationReason {
  OWNER_REQUEST = 'OWNER_REQUEST',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NO_AGENT_AVAILABLE = 'NO_AGENT_AVAILABLE',
  AGENT_UNAVAILABLE = 'AGENT_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  DUPLICATE_JOB = 'DUPLICATE_JOB',
  PROPERTY_ALREADY_MARKED = 'PROPERTY_ALREADY_MARKED',
  ADMIN_ACTION = 'ADMIN_ACTION',
  OTHER = 'OTHER',
}

export const CANCELLATION_REASON_META = {
  [CancellationReason.OWNER_REQUEST]: {
    label: 'Owner Request',
    refundable: true,
    refundPercentage: 100,
  },
  [CancellationReason.PAYMENT_FAILED]: {
    label: 'Payment Failed',
    refundable: false,
    refundPercentage: 0,
  },
  [CancellationReason.NO_AGENT_AVAILABLE]: {
    label: 'No Agent Available',
    refundable: true,
    refundPercentage: 100,
  },
  [CancellationReason.AGENT_UNAVAILABLE]: {
    label: 'Agent Unavailable',
    refundable: true,
    refundPercentage: 100,
  },
  [CancellationReason.TIMEOUT]: {
    label: 'Timeout',
    refundable: true,
    refundPercentage: 50,
  },
  [CancellationReason.DUPLICATE_JOB]: {
    label: 'Duplicate Job',
    refundable: true,
    refundPercentage: 100,
  },
  [CancellationReason.PROPERTY_ALREADY_MARKED]: {
    label: 'Property Already Marked',
    refundable: true,
    refundPercentage: 100,
  },
  [CancellationReason.ADMIN_ACTION]: {
    label: 'Admin Action',
    refundable: true,
    refundPercentage: 100,
  },
  [CancellationReason.OTHER]: {
    label: 'Other',
    refundable: false,
    refundPercentage: 0,
  },
} as const;

/**
 * Queue position limits
 */
export const QUEUE_CONFIG = {
  // Maximum agents in queue per job
  MAX_QUEUE_SIZE: 10,

  // Queue position timeout (hours)
  QUEUE_POSITION_TIMEOUT_HOURS: 4,

  // Auto-advance to next agent if current doesn't respond (minutes)
  AUTO_ADVANCE_MINUTES: 30,
} as const;

export type JobStatusTransition = {
  from: MarkingJobStatus;
  to: MarkingJobStatus;
  reason?: string;
  triggeredBy: 'system' | 'agent' | 'owner' | 'admin';
};