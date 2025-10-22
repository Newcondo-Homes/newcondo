// backend/marking-service/src/types/timeSlot.ts

export interface TimeSlot {
  jobId: string;
  agentId: string;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  isExpired: boolean;
  isActive: boolean;
}

export interface TimeSlotAllocation {
  jobId: string;
  agentId: string;
  allocatedAt: Date;
  expiresAt: Date;
  hoursAllocated: number;
  queuePosition: number;
}

export interface TimeSlotExpiry {
  jobId: string;
  agentId: string;
  expiredAt: Date;
  wasCompleted: boolean;
  nextAgentId?: string;
  reassigned: boolean;
}

export interface TimeSlotStatus {
  jobId: string;
  agentId: string;
  currentTime: Date;
  startTime: Date;
  endTime: Date;
  minutesElapsed: number;
  minutesRemaining: number;
  hoursRemaining: number;
  percentageUsed: number;
  isExpiringSoon: boolean; // < 30 minutes
  isExpired: boolean;
}

export const TIME_SLOT_DURATION_HOURS = 3;
export const TIME_SLOT_WARNING_MINUTES = 30; // Warning when 30 mins left
export const TIME_SLOT_EXTENSION_MINUTES = 0; // No extensions allowed

export interface TimeSlotRotation {
  jobId: string;
  previousAgentId: string;
  nextAgentId: string;
  rotatedAt: Date;
  reason: 'expired' | 'failed' | 'declined' | 'timeout';
  previousAttempts: number;
}

export interface TimeSlotMonitoring {
  jobId: string;
  agentId: string;
  checkpointTime: Date;
  timeRemaining: number;
  warningsSent: number;
  lastWarningAt?: Date;
  autoRotationScheduled: boolean;
}

export interface TimeSlotWarning {
  jobId: string;
  agentId: string;
  warningType: '1hour' | '30minutes' | '15minutes' | '5minutes';
  sentAt: Date;
  acknowledged: boolean;
}

export interface TimeSlotMetrics {
  jobId: string;
  agentId: string;
  totalTimeAllocated: number; // minutes
  timeUsed: number; // minutes
  completed: boolean;
  completedAt?: Date;
  efficiency: number; // percentage
  rotations: number;
}