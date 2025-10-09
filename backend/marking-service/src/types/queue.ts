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