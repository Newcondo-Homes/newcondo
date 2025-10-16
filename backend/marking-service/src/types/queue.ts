export interface QueuePosition {
  jobId: string;
  position: number;
  estimatedWaitTime: number; // in minutes
  priorityScore: number;
}

export interface QueueStats {
  totalJobs: number;
  queuedJobs: number;
  assignedJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  averageCompletionTime: number; // in hours
  averageWaitTime: number; // in hours
}

export interface AgentQueueEntry {
  agentId: string;
  agentName: string;
  serviceAreas: string[];
  reliabilityScore: number;
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  maxConcurrentJobs: number;
  currentLocation?: {
    lat: number;
    lng: number;
    lastUpdated: Date;
  };
  isAvailable: boolean;
  lastActiveAt: Date;
}

export interface QueueFilters {
  status?: string[];
  urgencyLevel?: string[];
  city?: string;
  state?: string;
  dateFrom?: Date;
  dateTo?: Date;
  assignedAgentId?: string;
}

export interface QueueSortOptions {
  field: 'createdAt' | 'urgencyLevel' | 'queuePosition' | 'maxCompletionTime';
  direction: 'asc' | 'desc';
}

export interface QueueManagementOptions {
  maxQueueSize: number;
  maxWaitTimeHours: number;
  priorityWeights: {
    urgency: number;
    distance: number;
    agentReliability: number;
    timeInQueue: number;
  };
}

export interface QueueNotification {
  type: 'QUEUE_POSITION_UPDATED' | 'AGENT_ASSIGNED' | 'QUEUE_EXPIRED' | 'QUEUE_CANCELLED';
  jobId: string;
  userId: string;
  message: string;
  metadata?: Record<string, any>;
}



// // backend/marking-service/src/types/queue.ts

// export enum QueueStatus {
//   WAITING = 'WAITING',
//   ACTIVE = 'ACTIVE',
//   EXPIRED = 'EXPIRED',
//   COMPLETED = 'COMPLETED',
//   SKIPPED = 'SKIPPED',
//   CANCELLED = 'CANCELLED'
// }

// export interface QueueEntry {
//   id: string;
//   markingJobId: string;
//   agentId: string;
//   position: number;
//   status: QueueStatus;
  
//   // Time Management
//   joinedAt: Date;
//   timeSlotStart?: Date; // When agent's 3-hour window starts
//   timeSlotEnd?: Date; // When agent's 3-hour window ends
//   expiresAt: Date; // Overall expiry if not completed
  
//   // Agent Details
//   agentName: string;
//   agentPhone: string;
//   agentLocation?: {
//     lat: number;
//     lng: number;
//   };
//   distanceToProperty?: number; // In kilometers
  
//   // Notifications
//   notifiedAt?: Date;
//   notificationsSent: number;
//   lastNotificationAt?: Date;
  
//   // Completion
//   startedAt?: Date;
//   completedAt?: Date;
//   skippedAt?: Date;
//   skipReason?: string;
  
//   // Metadata
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface QueueConfiguration {
//   maxQueueSize: number; // Maximum agents in queue
//   timeSlotDuration: number; // 3 hours in milliseconds
//   expiryDuration: number; // Time before queue entry expires
//   notificationIntervals: number[]; // When to send reminders (in minutes)
//   maxSkipsPerAgent: number; // How many times agent can skip before penalty
//   proximityRadiusKm: number; // Radius to search for agents
// }

// export interface QueueMetrics {
//   totalInQueue: number;
//   activeAgents: number;
//   completedJobs: number;
//   expiredSlots: number;
//   averageWaitTime: number; // In minutes
//   averageCompletionTime: number; // In minutes
//   successRate: number; // Percentage of completed vs expired
// }

// export interface QueueOperation {
//   type: 'ADD' | 'REMOVE' | 'PROMOTE' | 'SKIP' | 'EXPIRE' | 'COMPLETE';
//   agentId: string;
//   markingJobId: string;
//   timestamp: Date;
//   reason?: string;
//   metadata?: Record<string, any>;
// }

// export interface AgentQueueEligibility {
//   agentId: string;
//   isEligible: boolean;
//   reasons: string[];
//   distance?: number;
//   availability: {
//     isAvailable: boolean;
//     currentJobs: number;
//     maxConcurrentJobs: number;
//   };
//   reliability: {
//     score: number;
//     completedJobs: number;
//     totalJobs: number;
//     skipRate: number;
//   };
// }

// export interface QueueNotification {
//   type: 'ASSIGNMENT' | 'REMINDER' | 'EXPIRY_WARNING' | 'POSITION_UPDATE';
//   agentId: string;
//   markingJobId: string;
//   queuePosition: number;
//   timeRemaining?: number; // Milliseconds
//   message: string;
//   priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
//   channels: ('EMAIL' | 'SMS' | 'PUSH')[];
// }

// export interface CreateQueueEntryDTO {
//   markingJobId: string;
//   agentId: string;
//   agentLocation?: {
//     lat: number;
//     lng: number;
//   };
// }

// export interface UpdateQueueEntryDTO {
//   status?: QueueStatus;
//   position?: number;
//   timeSlotStart?: Date;
//   timeSlotEnd?: Date;
//   startedAt?: Date;
//   completedAt?: Date;
//   skipReason?: string;
// }

// export interface QueueFilters {
//   markingJobId?: string;
//   agentId?: string;
//   status?: QueueStatus[];
//   dateFrom?: Date;
//   dateTo?: Date;
// }








// // backend/marking-service/src/types/queue.ts

// export interface QueueEntry {
//   jobId: string;
//   agentId: string;
//   position: number;
//   joinedAt: Date;
//   timeSlotStart: Date;
//   timeSlotEnd: Date;
//   status: QueueEntryStatus;
//   notificationsSent: number;
//   lastNotificationAt?: Date;
// }

// export type QueueEntryStatus = 
//   | 'WAITING' 
//   | 'ACTIVE' 
//   | 'EXPIRED' 
//   | 'COMPLETED' 
//   | 'SKIPPED';

// export interface QueueConfiguration {
//   maxQueueSize: number;
//   timeSlotDurationMinutes: number;
//   maxWaitingTimeHours: number;
//   autoReassignOnTimeout: boolean;
//   notificationIntervals: number[]; // minutes before expiry
//   maxReassignments: number;
// }

// export interface QueuePosition {
//   jobId: string;
//   agentId: string;
//   position: number;
//   totalAhead: number;
//   estimatedWaitMinutes: number;
//   timeSlotAllocation?: {
//     start: Date;
//     end: Date;
//     remainingMinutes: number;
//   };
// }

// export interface QueueAgent {
//   agentId: string;
//   name: string;
//   email: string;
//   phone: string;
//   isAvailable: boolean;
//   currentJobs: number;
//   completedJobs: number;
//   reliabilityScore: number;
//   serviceAreas: string[];
//   lastActiveAt: Date;
//   distanceFromProperty?: number; // km
// }

// export interface QueueJobAssignment {
//   jobId: string;
//   agentId: string;
//   assignedAt: Date;
//   timeSlotExpiry: Date;
//   previousAgents: string[]; // Track reassignments
//   reassignmentCount: number;
//   priority: AssignmentPriority;
// }

// export type AssignmentPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// export interface QueueMetrics {
//   totalInQueue: number;
//   averageWaitTime: number; // minutes
//   averageCompletionTime: number; // minutes
//   successRate: number; // percentage
//   timeoutRate: number; // percentage
//   activeAgents: number;
//   availableAgents: number;
//   peakQueueSize: number;
//   currentThroughput: number; // jobs per hour
// }

// export interface QueueAgentFilter {
//   isAvailable?: boolean;
//   minReliabilityScore?: number;
//   maxCurrentJobs?: number;
//   serviceAreas?: string[];
//   maxDistanceKm?: number;
//   excludeAgents?: string[]; // Agents to exclude
// }

// export interface QueueRotation {
//   jobId: string;
//   fromAgentId: string;
//   toAgentId?: string;
//   reason: RotationReason;
//   rotatedAt: Date;
//   previousPosition: number;
//   newPosition?: number;
// }

// export type RotationReason = 
//   | 'TIMEOUT' 
//   | 'AGENT_UNAVAILABLE' 
//   | 'AGENT_DECLINED' 
//   | 'QUALITY_ISSUE' 
//   | 'MANUAL_REASSIGNMENT';

// export interface QueueNotification {
//   queueEntryId: string;
//   agentId: string;
//   type: QueueNotificationType;
//   scheduledFor: Date;
//   sentAt?: Date;
//   status: 'PENDING' | 'SENT' | 'FAILED';
//   retryCount: number;
//   content: {
//     subject: string;
//     message: string;
//     actionUrl?: string;
//   };
// }

// export type QueueNotificationType = 
//   | 'ASSIGNMENT' 
//   | 'REMINDER_30MIN' 
//   | 'REMINDER_1HR' 
//   | 'REMINDER_2HR' 
//   | 'EXPIRY_WARNING' 
//   | 'TIMEOUT_ALERT' 
//   | 'NEXT_IN_QUEUE';

// export interface QueueSnapshot {
//   timestamp: Date;
//   totalJobs: number;
//   queuedJobs: number;
//   activeJobs: number;
//   completedToday: number;
//   averageWaitTime: number;
//   availableAgents: number;
//   entries: Array<{
//     jobId: string;
//     agentId: string;
//     position: number;
//     waitTime: number;
//     status: QueueEntryStatus;
//   }>;
// }

// export interface QueueHealthCheck {
//   isHealthy: boolean;
//   timestamp: Date;
//   issues: Array<{
//     severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
//     message: string;
//     affectedJobs?: string[];
//   }>;
//   metrics: {
//     queueSize: number;
//     oldestJobAge: number; // hours
//     stuckJobs: number;
//     averageProcessingTime: number;
//   };
// }

// export interface QueueRebalance {
//   triggeredBy: 'AUTO' | 'MANUAL';
//   triggeredAt: Date;
//   reason: string;
//   changes: Array<{
//     jobId: string;
//     oldPosition: number;
//     newPosition: number;
//     oldAgentId?: string;
//     newAgentId?: string;
//   }>;
//   affectedJobs: number;
// }

// export interface QueueAgentAvailability {
//   agentId: string;
//   isAvailable: boolean;
//   availableSlots: Array<{
//     start: Date;
//     end: Date;
//     isBooked: boolean;
//   }>;
//   busyUntil?: Date;
//   nextAvailableAt?: Date;
//   currentLoad: number; // percentage
//   maxCapacity: number; // max concurrent jobs
// }

// export interface QueuePriorityCalculation {
//   jobId: string;
//   baseScore: number;
//   urgencyBonus: number;
//   waitTimeBonus: number;
//   proximityBonus: number;
//   retryPenalty: number;
//   finalScore: number;
//   calculatedAt: Date;
// }

// export interface QueueBroadcast {
//   jobId: string;
//   propertyLocation: {
//     lat: number;
//     lng: number;
//     address: string;
//     city: string;
//     state: string;
//   };
//   markingFee: number;
//   urgencyLevel: string;
//   preferredTime?: Date;
//   broadcastAt: Date;
//   expiresAt: Date;
//   recipientAgents: string[];
//   interestedAgents: string[];
//   acceptedBy?: string;
// }

// export interface QueueTimeSlot {
//   slotId: string;
//   jobId: string;
//   agentId: string;
//   startTime: Date;
//   endTime: Date;
//   durationMinutes: number;
//   status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
//   checkpoints: Array<{
//     time: Date;
//     type: 'START' | 'MIDPOINT' | 'REMINDER' | 'WARNING' | 'END';
//     notificationSent: boolean;
//   }>;
// }

// // Constants for queue management
// export const QUEUE_CONSTANTS = {
//   MAX_QUEUE_SIZE: 100,
//   TIME_SLOT_DURATION_MINUTES: 180, // 3 hours
//   MAX_WAITING_TIME_HOURS: 72, // 3 days
//   AUTO_REASSIGN_ON_TIMEOUT: true,
//   NOTIFICATION_INTERVALS_MINUTES: [30, 60, 120],
//   MAX_REASSIGNMENTS: 5,
//   MIN_AGENTS_FOR_BROADCAST: 3,
//   AGENT_RESPONSE_TIMEOUT_MINUTES: 15,
//   PROXIMITY_WEIGHT: 0.3,
//   RELIABILITY_WEIGHT: 0.4,
//   AVAILABILITY_WEIGHT: 0.3,
// } as const;

// export interface QueueStatistics {
//   period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
//   startDate: Date;
//   endDate: Date;
//   stats: {
//     totalJobsProcessed: number;
//     averageQueueTime: number;
//     averageCompletionTime: number;
//     successRate: number;
//     timeoutRate: number;
//     reassignmentRate: number;
//     agentUtilization: number;
//     peakHours: Array<{ hour: number; jobCount: number }>;
//     bottlenecks: Array<{ timestamp: Date; queueSize: number; reason: string }>;
//   };
// }