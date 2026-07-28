import { Decimal } from '@prisma/client/runtime/library';

export interface PropertyLock {
  propertyId: string;
  unitId?: string;
  userId: string;
  lockId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface LockAcquisitionResult {
  success: boolean;
  lockId?: string;
  reason?: string;
  waitTime?: number;
  queuePosition?: number;
}

export interface PaymentLockRequest {
  propertyId: string;
  unitId?: string;
  userId: string;
  amount: Decimal;
  lockDuration?: number; // milliseconds, default 15 minutes
}

export interface PaymentLockRelease {
  lockId: string;
  propertyId: string;
  unitId?: string;
  userId: string;
  reason: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'CANCELLED';
}

export interface LockStatus {
  isLocked: boolean;
  lockedBy?: string;
  lockId?: string;
  expiresAt?: Date;
  timeRemaining?: number;
}

export enum LockAttemptStatus {
  LOCKED = 'LOCKED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  QUEUE_FULL = 'QUEUE_FULL',
  ALREADY_LOCKED = 'ALREADY_LOCKED'
}

export interface LockMetrics {
  totalAttempts: number;
  successfulLocks: number;
  failedLocks: number;
  averageLockDuration: number;
  currentActiveLocks: number;
}