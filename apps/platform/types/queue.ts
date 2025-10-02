// apps/platform/types/queue.ts

/**
 * Queue Item Status
 */
export enum QueueStatus {
  WAITING = 'WAITING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

/**
 * Queue Priority Levels
 */
export enum QueuePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

/**
 * Queue Item Type
 */
export enum QueueItemType {
  PAYMENT = 'PAYMENT',
  PROPERTY_LOCK = 'PROPERTY_LOCK',
  UNIT_LOCK = 'UNIT_LOCK',
  BOOKING = 'BOOKING'
}

/**
 * Queue Item
 */
export interface QueueItem {
  id: string;
  type: QueueItemType;
  userId: string;
  resourceId: string; // propertyId or unitId
  resourceType: 'PROPERTY' | 'UNIT';
  
  // Queue Management
  status: QueueStatus;
  priority: QueuePriority;
  position: number;
  estimatedWaitTime: number; // seconds
  
  // Timestamps
  queuedAt: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  expiresAt: Date | string;
  
  // Payment Details
  paymentData?: {
    amount: number;
    currency: string;
    lockId?: string;
  };
  
  // Metadata
  metadata?: Record<string, any>;
  failureReason?: string;
  retryCount?: number;
}

/**
 * Add to Queue Request
 */
export interface AddToQueueRequest {
  type: QueueItemType;
  userId: string;
  resourceId: string;
  resourceType: 'PROPERTY' | 'UNIT';
  priority?: QueuePriority;
  paymentData?: {
    amount: number;
    currency: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Add to Queue Response
 */
export interface AddToQueueResponse {
  success: boolean;
  queueItem?: QueueItem;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Queue Position Update
 */
export interface QueuePositionUpdate {
  queueItemId: string;
  oldPosition: number;
  newPosition: number;
  estimatedWaitTime: number;
}

/**
 * Queue Statistics
 */
export interface QueueStatistics {
  totalItems: number;
  waitingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  averageWaitTime: number; // seconds
  averageProcessingTime: number; // seconds
  peakQueueLength: number;
}

/**
 * User Queue Status
 */
export interface UserQueueStatus {
  hasActiveItems: boolean;
  activeItems: QueueItem[];
  position?: number;
  estimatedWaitTime?: number;
  canJoinQueue: boolean;
  maxQueueItems: number;
}

/**
 * Queue Health Status
 */
export interface QueueHealth {
  status: 'healthy' | 'degraded' | 'critical';
  queueLength: number;
  processingRate: number; // items per minute
  errorRate: number; // percentage
  oldestItemAge: number; // seconds
  stuckItems: number;
}

/**
 * Remove from Queue Request
 */
export interface RemoveFromQueueRequest {
  queueItemId: string;
  userId: string;
  reason?: 'user_cancelled' | 'timeout' | 'error' | 'duplicate';
}

/**
 * Remove from Queue Response
 */
export interface RemoveFromQueueResponse {
  success: boolean;
  removedAt?: Date | string;
  error?: string;
}

/**
 * Queue Item Progress
 */
export interface QueueProgress {
  queueItemId: string;
  status: QueueStatus;
  progress: number; // 0-100
  currentStep?: string;
  message?: string;
  estimatedTimeRemaining?: number; // seconds
}

/**
 * Frontend Queue State
 */
export interface QueueState {
  currentItem: QueueItem | null;
  isInQueue: boolean;
  isProcessing: boolean;
  position: number | null;
  estimatedWaitTime: number | null;
  error: string | null;
  progress: number; // 0-100
}

/**
 * Queue Configuration
 */
export interface QueueConfig {
  maxQueueLength: number;
  maxItemsPerUser: number;
  defaultPriority: QueuePriority;
  itemTimeout: number; // seconds
  retryAttempts: number;
  retryDelay: number; // seconds
  cleanupInterval: number; // seconds
}

/**
 * Queue Event Types
 */
export enum QueueEventType {
  ITEM_ADDED = 'ITEM_ADDED',
  ITEM_STARTED = 'ITEM_STARTED',
  ITEM_COMPLETED = 'ITEM_COMPLETED',
  ITEM_FAILED = 'ITEM_FAILED',
  ITEM_EXPIRED = 'ITEM_EXPIRED',
  ITEM_CANCELLED = 'ITEM_CANCELLED',
  POSITION_UPDATED = 'POSITION_UPDATED',
  QUEUE_FULL = 'QUEUE_FULL'
}

/**
 * Queue Event
 */
export interface QueueEvent {
  type: QueueEventType;
  queueItemId: string;
  userId: string;
  timestamp: Date | string;
  data?: Record<string, any>;
}

/**
 * Queue Conflict Detection
 */
export interface QueueConflict {
  conflictType: 'DUPLICATE_RESOURCE' | 'CONCURRENT_PAYMENT' | 'RESOURCE_LOCKED';
  resourceId: string;
  conflictingItems: QueueItem[];
  detectedAt: Date | string;
  resolution?: 'FIRST_COME_FIRST_SERVED' | 'PRIORITY_BASED' | 'MANUAL_REVIEW';
}

/**
 * Batch Queue Operations
 */
export interface BatchQueueRequest {
  operations: Array<{
    action: 'ADD' | 'REMOVE' | 'UPDATE_PRIORITY';
    queueItemId?: string;
    data?: Partial<AddToQueueRequest>;
  }>;
}

export interface BatchQueueResponse {
  success: boolean;
  results: Array<{
    success: boolean;
    queueItem?: QueueItem;
    error?: string;
  }>;
}

/**
 * Queue Analytics
 */
export interface QueueAnalytics {
  period: {
    start: Date | string;
    end: Date | string;
  };
  totalProcessed: number;
  successRate: number; // percentage
  averageWaitTime: number; // seconds
  averageProcessingTime: number; // seconds
  peakHours: Array<{
    hour: number;
    itemCount: number;
  }>;
  failureReasons: Array<{
    reason: string;
    count: number;
  }>;
}