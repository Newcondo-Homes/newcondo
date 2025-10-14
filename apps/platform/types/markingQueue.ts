// apps/platform/types/markingQueue.ts
// Queue management types for marking jobs

import { UrgencyLevel } from "@newcondo/db";
import { GPSCoordinates } from "./marking";

/**
 * Queue entry for marking job
 */
export interface QueueEntry {
  id: string;
  jobId: string;
  agentId: string;
  position: number;
  
  // Time Management
  enteredQueueAt: string;
  timeSlotStart: string;
  timeSlotEnd: string; // 3 hours from start
  estimatedCompletionTime: string;
  
  // Status
  status: QueueEntryStatus;
  isActive: boolean;
  
  // Notifications
  notificationsSent: number;
  lastNotificationAt?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export enum QueueEntryStatus {
  WAITING = "WAITING", // Waiting in queue
  ACTIVE = "ACTIVE", // Currently active time slot
  COMPLETED = "COMPLETED", // Agent completed the job
  EXPIRED = "EXPIRED", // Time slot expired
  SKIPPED = "SKIPPED", // Agent skipped/declined
  CANCELLED = "CANCELLED", // Job cancelled
}

/**
 * Queue configuration
 */
export interface QueueConfiguration {
  maxQueueSize: number; // Maximum agents in queue per job
  timeSlotDuration: number; // Duration in hours (default: 3)
  maxCompletionTime: number; // Max time from job creation (default: 72 hours)
  notificationIntervals: number[]; // When to send reminders (in minutes)
  autoExpireEnabled: boolean;
  priorityBonusTime: number; // Extra time for high urgency (in hours)
}

/**
 * Queue statistics
 */
export interface QueueStatistics {
  totalQueued: number;
  activeSlots: number;
  completedToday: number;
  expiredToday: number;
  averageWaitTime: number; // In hours
  averageCompletionRate: number; // Percentage
  currentQueueDepth: number; // Average agents per job
}

/**
 * Agent queue status
 */
export interface AgentQueueStatus {
  agentId: string;
  activeJobs: number;
  queuedJobs: number;
  completedJobsToday: number;
  currentJobId?: string;
  nextJobId?: string;
  isAvailable: boolean;
  lastActivity?: string;
}

/**
 * Queue priority calculation
 */
export interface QueuePriority {
  urgencyLevel: UrgencyLevel;
  agentReliabilityScore: number;
  distanceFromProperty: number; // In kilometers
  previousCompletionRate: number; // Percentage
  calculatedScore: number; // Final priority score
}

/**
 * Queue entry creation request
 */
export interface CreateQueueEntryRequest {
  jobId: string;
  agentId: string;
  urgencyLevel: UrgencyLevel;
  estimatedTravelTime: number; // In minutes
}

/**
 * Queue position update
 */
export interface QueuePositionUpdate {
  entryId: string;
  oldPosition: number;
  newPosition: number;
  reason: string;
  updatedAt: string;
}

/**
 * Time slot allocation
 */
export interface TimeSlotAllocation {
  entryId: string;
  jobId: string;
  agentId: string;
  startTime: string;
  endTime: string;
  duration: number; // In hours
  isActive: boolean;
  canExtend: boolean;
}

/**
 * Time slot extension request
 */
export interface TimeSlotExtensionRequest {
  entryId: string;
  reason: string;
  extensionHours: number;
  requestedBy: string;
}

/**
 * Queue management action
 */
export interface QueueAction {
  actionType: QueueActionType;
  entryId: string;
  performedBy: string;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export enum QueueActionType {
  ENTRY_CREATED = "ENTRY_CREATED",
  POSITION_CHANGED = "POSITION_CHANGED",
  SLOT_ACTIVATED = "SLOT_ACTIVATED",
  SLOT_EXPIRED = "SLOT_EXPIRED",
  ENTRY_COMPLETED = "ENTRY_COMPLETED",
  ENTRY_SKIPPED = "ENTRY_SKIPPED",
  ENTRY_CANCELLED = "ENTRY_CANCELLED",
  TIME_EXTENDED = "TIME_EXTENDED",
  NOTIFICATION_SENT = "NOTIFICATION_SENT",
}

/**
 * Agent proximity data for queue assignment
 */
export interface AgentProximityData {
  agentId: string;
  agentName: string;
  coordinates: GPSCoordinates;
  distanceKm: number;
  estimatedTravelTime: number; // In minutes
  reliabilityScore: number;
  completedJobs: number;
  isAvailable: boolean;
  currentQueueLoad: number; // Number of jobs in queue
}

/**
 * Queue broadcast result
 */
export interface QueueBroadcastResult {
  jobId: string;
  totalAgentsNotified: number;
  agentsQueued: number;
  broadcastRadius: number; // In kilometers
  broadcastAt: string;
  notifiedAgents: AgentProximityData[];
}

/**
 * Queue health metrics
 */
export interface QueueHealthMetrics {
  averageQueueDepth: number;
  averageTimeToCompletion: number; // In hours
  slotUtilizationRate: number; // Percentage
  expirationRate: number; // Percentage
  agentResponseRate: number; // Percentage
  bottlenecks: QueueBottleneck[];
  recommendedActions: string[];
}

/**
 * Queue bottleneck identification
 */
export interface QueueBottleneck {
  type: BottleneckType;
  severity: "low" | "medium" | "high";
  affectedJobs: number;
  description: string;
  recommendation: string;
}

export enum BottleneckType {
  LOW_AGENT_AVAILABILITY = "LOW_AGENT_AVAILABILITY",
  HIGH_EXPIRATION_RATE = "HIGH_EXPIRATION_RATE",
  LONG_WAIT_TIMES = "LONG_WAIT_TIMES",
  GEOGRAPHIC_COVERAGE_GAP = "GEOGRAPHIC_COVERAGE_GAP",
  LOW_COMPLETION_RATE = "LOW_COMPLETION_RATE",
}

/**
 * Queue notification settings
 */
export interface QueueNotificationSettings {
  enableReminderNotifications: boolean;
  reminderIntervals: number[]; // In minutes before expiry
  enablePositionUpdates: boolean;
  enableExpiryWarnings: boolean;
  warningThreshold: number; // Minutes before expiry to warn
}

/**
 * Queue filtering options
 */
export interface QueueFilters {
  status?: QueueEntryStatus[];
  urgencyLevel?: UrgencyLevel[];
  agentId?: string;
  jobId?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
  minPosition?: number;
  maxPosition?: number;
}

/**
 * Queue entry with related data
 */
export interface QueueEntryWithRelations extends QueueEntry {
  job: {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    markingFee: number;
    urgencyLevel: UrgencyLevel;
  };
  agent: {
    id: string;
    name: string;
    phone: string;
    reliabilityScore: number;
    currentQueueLoad: number;
  };
}

/**
 * Queue optimization suggestion
 */
export interface QueueOptimizationSuggestion {
  type: OptimizationType;
  priority: "low" | "medium" | "high";
  description: string;
  expectedImprovement: string;
  implementation: string;
}

export enum OptimizationType {
  INCREASE_QUEUE_SIZE = "INCREASE_QUEUE_SIZE",
  ADJUST_TIME_SLOTS = "ADJUST_TIME_SLOTS",
  EXPAND_BROADCAST_RADIUS = "EXPAND_BROADCAST_RADIUS",
  ADD_URGENCY_INCENTIVES = "ADD_URGENCY_INCENTIVES",
  IMPROVE_AGENT_DISTRIBUTION = "IMPROVE_AGENT_DISTRIBUTION",
}

/**
 * Time slot expiry notification
 */
export interface TimeSlotExpiryNotification {
  entryId: string;
  jobId: string;
  agentId: string;
  timeSlotEnd: string;
  minutesRemaining: number;
  nextAgentInQueue?: {
    agentId: string;
    agentName: string;
    estimatedStartTime: string;
  };
}

/**
 * Queue performance metrics per agent
 */
export interface AgentQueuePerformance {
  agentId: string;
  totalEntriesCreated: number;
  completedEntries: number;
  expiredEntries: number;
  skippedEntries: number;
  averageCompletionTime: number; // In hours
  averageQueueWaitTime: number; // In hours
  onTimeCompletionRate: number; // Percentage
  performanceScore: number; // 0-100
}