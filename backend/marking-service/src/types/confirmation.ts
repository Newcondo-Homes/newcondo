// backend/marking-service/src/types/confirmation.ts

export interface OwnerConfirmation {
  jobId: string;
  ownerId: string;
  confirmed: boolean;
  rejectionReason?: string;
  confirmedAt?: Date;
  rejectedAt?: Date;
}

export interface ConfirmationWindow {
  jobId: string;
  startTime: Date;
  endTime: Date;
  hoursRemaining: number;
  daysRemaining: number;
  isExpired: boolean;
  remindersSent: number;
}

export interface ConfirmationReminder {
  jobId: string;
  ownerId: string;
  reminderType: 'initial' | '24hours' | '12hours' | '2hours' | 'final';
  sentAt: Date;
  channel: 'email' | 'sms' | 'push';
}

export interface ConfirmationAction {
  jobId: string;
  ownerId: string;
  action: 'confirm' | 'reject' | 'request_remark';
  reason?: string;
  feedback?: string;
  requestedChanges?: string[];
}

export interface ConfirmationDeadline {
  jobId: string;
  deadline: Date;
  timeElapsed: number; // milliseconds
  timeRemaining: number; // milliseconds
  isPastDeadline: boolean;
  gracePeriodActive: boolean;
}

export const CONFIRMATION_WINDOW_HOURS = 48; // 2 days
export const CONFIRMATION_GRACE_PERIOD_HOURS = 24; // 1 day grace period
export const PARTIAL_PAYMENT_ON_TIMEOUT = 1000; // 1000 naira

export interface ConfirmationTimeoutResult {
  jobId: string;
  timedOut: boolean;
  partialPaymentReleased: boolean;
  partialPaymentAmount: number;
  nextSteps: 'retry' | 'escalate' | 'close';
  iterationCount: number;
  totalPaid: number;
}

export interface ConfirmationStatus {
  jobId: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'timeout' | 'expired';
  confirmationWindowStart: Date;
  confirmationWindowEnd: Date;
  ownerNotified: boolean;
  remindersSent: string[];
  timeoutIterations: number;
  totalPaidToAgent: number;
  remainingFee: number;
}

export interface RemarkRequest {
  jobId: string;
  requestedBy: string;
  reason: string;
  requestedChanges: string[];
  previousIterations: number;
  newMarkingJobRequired: boolean;
  originalFeeRefund: number;
}