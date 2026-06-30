import { Decimal } from '@prisma/client/runtime/library';

export interface PaymentQueueItem {
  id: string;
  userId: string;
  propertyId: string;
  unitId?: string;
  amount: Decimal;
  position: number;
  status: QueueStatus;
  priority: QueuePriority;
  createdAt: Date;
  expiresAt: Date;
  lockAttempts: number;
  maxLockAttempts: number;
  metadata?: Record<string, any>;
}

export enum QueueStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  LOCKED = 'LOCKED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum QueuePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

export interface QueueAddRequest {
  userId: string;
  propertyId: string;
  unitId?: string;
  amount: Decimal;
  priority?: QueuePriority;
  metadata?: Record<string, any>;
}

export interface QueueProcessResult {
  queueItemId: string;
  success: boolean;
  lockAcquired: boolean;
  lockId?: string;
  reason?: string;
  nextAttemptAt?: Date;
}

export interface QueueStats {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  averageWaitTime: number;
  maxQueueSize: number;
  currentQueueSize: number;
}

export interface QueueConfiguration {
  maxQueueSize: number;
  maxWaitTime: number; // milliseconds
  maxLockAttempts: number;
  retryDelay: number; // milliseconds
  lockTimeout: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

export const DEFAULT_QUEUE_CONFIG: QueueConfiguration = {
  maxQueueSize: 100,
  maxWaitTime: 30 * 60 * 1000, // 30 minutes
  maxLockAttempts: 3,
  retryDelay: 5000, // 5 seconds
  lockTimeout: 15 * 60 * 1000, // 15 minutes
  cleanupInterval: 60 * 1000 // 1 minute
};