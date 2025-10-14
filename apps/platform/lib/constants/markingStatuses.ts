// apps/platform/lib/constants/markingStatuses.ts

/**
 * Status constants for property marking jobs
 */

export const MARKING_JOB_STATUSES = {
  QUEUED: 'QUEUED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type MarkingJobStatus = typeof MARKING_JOB_STATUSES[keyof typeof MARKING_JOB_STATUSES];

/**
 * Payment status for marking jobs
 */
export const MARKING_PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;

export type MarkingPaymentStatus = typeof MARKING_PAYMENT_STATUSES[keyof typeof MARKING_PAYMENT_STATUSES];

/**
 * Urgency levels for marking jobs
 */
export const URGENCY_LEVELS = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];

/**
 * Confirmation status for property owner verification
 */
export const CONFIRMATION_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;

export type ConfirmationStatus = typeof CONFIRMATION_STATUSES[keyof typeof CONFIRMATION_STATUSES];

/**
 * Marking method types
 */
export const MARKING_METHODS = {
  SELF: 'SELF', // Property owner marks themselves
  KNOWN_PERSON: 'KNOWN_PERSON', // Send link to someone they know
  ASSIGN_AGENT: 'ASSIGN_AGENT', // Assign to platform agents
  NEWCONDO_ADMIN: 'NEWCONDO_ADMIN', // Let Newcondo admin handle it
} as const;

export type MarkingMethod = typeof MARKING_METHODS[keyof typeof MARKING_METHODS];

/**
 * Status display configurations
 */
export const STATUS_CONFIGS: Record<MarkingJobStatus, {
  label: string;
  description: string;
  color: string;
  icon: string;
}> = {
  QUEUED: {
    label: 'Queued',
    description: 'Waiting for agent assignment',
    color: 'blue',
    icon: 'clock',
  },
  ASSIGNED: {
    label: 'Assigned',
    description: 'Agent has been assigned to the job',
    color: 'purple',
    icon: 'user-check',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    description: 'Agent is currently marking the property',
    color: 'yellow',
    icon: 'loader',
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Marking job has been completed',
    color: 'green',
    icon: 'check-circle',
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Marking job was cancelled',
    color: 'red',
    icon: 'x-circle',
  },
  EXPIRED: {
    label: 'Expired',
    description: 'Marking job has expired',
    color: 'gray',
    icon: 'alert-triangle',
  },
};

/**
 * Urgency level display configurations
 */
export const URGENCY_CONFIGS: Record<UrgencyLevel, {
  label: string;
  color: string;
  priority: number;
}> = {
  LOW: {
    label: 'Low Priority',
    color: 'gray',
    priority: 1,
  },
  NORMAL: {
    label: 'Normal Priority',
    color: 'blue',
    priority: 2,
  },
  HIGH: {
    label: 'High Priority',
    color: 'orange',
    priority: 3,
  },
  URGENT: {
    label: 'Urgent',
    color: 'red',
    priority: 4,
  },
};

/**
 * Get status display info
 */
export function getStatusInfo(status: MarkingJobStatus) {
  return STATUS_CONFIGS[status];
}

/**
 * Get urgency display info
 */
export function getUrgencyInfo(urgency: UrgencyLevel) {
  return URGENCY_CONFIGS[urgency];
}

/**
 * Check if status is terminal (job is finished)
 */
export function isTerminalStatus(status: MarkingJobStatus): boolean {
  return [
    MARKING_JOB_STATUSES.COMPLETED,
    MARKING_JOB_STATUSES.CANCELLED,
    MARKING_JOB_STATUSES.EXPIRED,
  ].includes(status);
}

/**
 * Check if status allows cancellation
 */
export function canCancelJob(status: MarkingJobStatus): boolean {
  return [
    MARKING_JOB_STATUSES.QUEUED,
    MARKING_JOB_STATUSES.ASSIGNED,
  ].includes(status);
}

/**
 * Check if agent can accept job
 */
export function canAcceptJob(status: MarkingJobStatus): boolean {
  return status === MARKING_JOB_STATUSES.QUEUED;
}

/**
 * Get next possible statuses
 */
export function getNextStatuses(currentStatus: MarkingJobStatus): MarkingJobStatus[] {
  const transitions: Record<MarkingJobStatus, MarkingJobStatus[]> = {
    QUEUED: [MARKING_JOB_STATUSES.ASSIGNED, MARKING_JOB_STATUSES.CANCELLED, MARKING_JOB_STATUSES.EXPIRED],
    ASSIGNED: [MARKING_JOB_STATUSES.IN_PROGRESS, MARKING_JOB_STATUSES.CANCELLED, MARKING_JOB_STATUSES.EXPIRED],
    IN_PROGRESS: [MARKING_JOB_STATUSES.COMPLETED, MARKING_JOB_STATUSES.CANCELLED],
    COMPLETED: [],
    CANCELLED: [],
    EXPIRED: [],
  };

  return transitions[currentStatus] || [];
}