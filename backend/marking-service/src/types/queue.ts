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