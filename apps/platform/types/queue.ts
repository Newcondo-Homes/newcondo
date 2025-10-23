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





/**
 * Queue Type Definitions for Property Marking Service
 * Defines all types related to marking job queues and agent assignment
 */

export interface QueuedMarkingJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  status: MarkingJobQueueStatus;
  queuePosition: number;
  createdAt: Date;
  assignedAt: Date | null;
  completedAt: Date | null;
  timeSlotExpiry: Date | null;
  markingFee: number;
  propertyAddress: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface AgentQueuePosition {
  agentId: string;
  markingJobId: string;
  position: number;
  status: QueueStatus;
  joinedAt: Date;
  assignedAt: Date | null;
  timeSlotStart: Date | null;
  timeSlotEnd: Date | null;
  notificationSent: boolean;
}

export interface QueueMetrics {
  totalJobsInQueue: number;
  averageWaitTime: number; // in minutes
  totalActiveAgents: number;
  jobsAssignedToday: number;
  completionRate: number; // percentage
  averageTimeToCompletion: number; // in hours
}

export interface AgentPerformanceMetrics {
  agentId: string;
  totalJobsAssigned: number;
  completedJobs: number;
  completionRate: number; // percentage
  averageCompletionTime: number; // in hours
  missedDeadlines: number;
  reliabilityScore: number; // 0-5
  lastJobDate: Date | null;
  averageRating: number;
  totalEarnings: number;
}

export interface TimeSlot {
  jobId: string;
  agentId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isActive: boolean;
  isExpired: boolean;
  markingAttempted: boolean;
}

export interface QueueNotification {
  id: string;
  agentId: string;
  jobId: string;
  type: NotificationType;
  message: string;
  data: {
    propertyAddress?: string;
    queuePosition?: number;
    timeSlotStart?: Date;
    timeSlotEnd?: Date;
    paymentAmount?: number;
  };
  read: boolean;
  createdAt: Date;
  sentVia: NotificationChannel[];
}

export interface AgentQueueStatus {
  agentId: string;
  isAvailable: boolean;
  currentlyAssigned: boolean;
  serviceAreas: string[]; // Cities/LGAs where agent operates
  currentQueueCount: number; // Number of jobs agent is queued for
  responseTime: number; // average response time in minutes
  acceptanceRate: number; // percentage of jobs accepted
  completionRate: number; // percentage of jobs completed successfully
  averageRating: number;
  totalMarkingJobs: number;
}

export interface QueueAssignmentPayload {
  jobId: string;
  agentId: string;
  timeSlotDuration: number; // in minutes (typically 180 for 3 hours)
  paymentAmount: number;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    contactPerson: string;
    contactPhone: string;
    accessInstructions?: string;
  };
}

export interface QueueFilterOptions {
  status?: MarkingJobQueueStatus | MarkingJobQueueStatus[];
  city?: string;
  state?: string;
  radius?: number; // in kilometers from agent location
  minReliabilityScore?: number;
  onlyAvailableAgents?: boolean;
  urgencyLevel?: UrgencyLevel;
}

export interface QueuePosition {
  jobId: string;
  position: number;
  estimatedWaitTime: number; // in minutes
  status: QueueStatus;
}

export interface ProximityResult {
  agentId: string;
  name: string;
  distance: number; // in kilometers
  estimatedTravelTime: number; // in minutes
  reliabilityScore: number;
  completionRate: number;
  isAvailable: boolean;
  currentQueueCount: number;
}

export interface MarkingJobCompletion {
  jobId: string;
  agentId: string;
  completedAt: Date;
  completionNotes: string;
  boundaryData: BoundaryCoordinates;
  completionImages: string[];
  timeSpentMinutes: number;
  qualityRating?: number;
}

export interface BoundaryCoordinates {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface QueueStatistics {
  period: "daily" | "weekly" | "monthly";
  totalJobsQueued: number;
  totalJobsAssigned: number;
  totalJobsCompleted: number;
  averageQueueTime: number; // in minutes
  averageAssignmentTime: number; // in hours
  totalAgentsParticipated: number;
  topPerformingAgents: AgentPerformanceMetrics[];
  completionRateByUrgency: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    URGENT: number;
  };
}

// Enums
export enum MarkingJobQueueStatus {
  QUEUED = "QUEUED",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export enum QueueStatus {
  PENDING = "PENDING", // Waiting in queue
  ASSIGNED = "ASSIGNED", // Offered to agent, awaiting response
  ACCEPTED = "ACCEPTED", // Agent accepted the job
  ACTIVE = "ACTIVE", // Time slot is active
  EXPIRED = "EXPIRED", // Time slot expired without completion
  COMPLETED = "COMPLETED", // Job completed successfully
  SKIPPED = "SKIPPED", // Agent skipped, moved to next
}

export enum NotificationType {
  JOB_AVAILABLE = "JOB_AVAILABLE",
  ASSIGNMENT_OFFERED = "ASSIGNMENT_OFFERED",
  TIME_SLOT_STARTING = "TIME_SLOT_STARTING",
  TIME_SLOT_EXPIRING_SOON = "TIME_SLOT_EXPIRING_SOON",
  TIME_SLOT_EXPIRED = "TIME_SLOT_EXPIRED",
  JOB_COMPLETED = "JOB_COMPLETED",
  PAYMENT_RELEASED = "PAYMENT_RELEASED",
  QUEUE_POSITION_UPDATED = "QUEUE_POSITION_UPDATED",
  PERFORMANCE_ALERT = "PERFORMANCE_ALERT",
}

export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  IN_APP = "IN_APP",
  PUSH = "PUSH",
}

export enum UrgencyLevel {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface PaginatedQueueResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}











// // apps/platform/types/queue.ts
// import type { Coordinates, AgentBasic } from './marking';

// export interface QueuePosition {
//   id: string;
//   jobId: string;
//   agentId: string;
//   position: number;
//   joinedAt: string;
//   estimatedArrivalTime?: string;
//   currentLocation?: Coordinates;
//   status: QueuePositionStatus;
//   timeSlotStart?: string;
//   timeSlotEnd?: string;
//   isActive: boolean;
//   agent?: AgentBasic;
// }

// export type QueuePositionStatus =
//   | 'WAITING'
//   | 'ACTIVE'
//   | 'EXPIRED'
//   | 'COMPLETED'
//   | 'CANCELLED'
//   | 'SKIPPED';

// export interface QueueStatusResponse {
//   success: boolean;
//   data: {
//     jobId: string;
//     totalInQueue: number;
//     currentAgent?: QueuePosition;
//     nextAgent?: QueuePosition;
//     queuePositions: QueuePosition[];
//     averageWaitTime: number; // in minutes
//     lastUpdated: string;
//   };
//   message?: string;
// }

// export interface QueueHistoryResponse {
//   success: boolean;
//   data: {
//     jobId: string;
//     history: Array<{
//       agentId: string;
//       agentName: string;
//       position: number;
//       joinedAt: string;
//       leftAt?: string;
//       status: QueuePositionStatus;
//       reason?: string;
//     }>;
//   };
//   message?: string;
// }

// export interface JoinQueueRequest {
//   estimatedArrivalTime?: string;
//   currentLocation?: Coordinates;
//   notes?: string;
// }

// export interface JoinQueueResponse {
//   success: boolean;
//   data: {
//     queuePosition: QueuePosition;
//     estimatedWaitTime: number; // in minutes
//     positionInQueue: number;
//     timeSlotInfo?: {
//       willStartAt: string;
//       duration: number; // in hours
//       expiresAt: string;
//     };
//   };
//   message?: string;
// }

// export interface QueueNotification {
//   id: string;
//   type: QueueNotificationType;
//   jobId: string;
//   agentId: string;
//   message: string;
//   data?: any;
//   createdAt: string;
//   readAt?: string;
// }

// export type QueueNotificationType =
//   | 'QUEUE_JOINED'
//   | 'POSITION_CHANGED'
//   | 'TIME_SLOT_STARTING'
//   | 'TIME_SLOT_EXPIRING'
//   | 'TIME_SLOT_EXPIRED'
//   | 'PROMOTED_IN_QUEUE'
//   | 'REMOVED_FROM_QUEUE'
//   | 'JOB_COMPLETED_BY_OTHER'
//   | 'JOB_CANCELLED';

// export interface QueueMetrics {
//   totalQueues: number;
//   totalAgentsWaiting: number;
//   averageQueueLength: number;
//   averageWaitTime: number;
//   completionRate: number;
//   timeoutRate: number;
// }