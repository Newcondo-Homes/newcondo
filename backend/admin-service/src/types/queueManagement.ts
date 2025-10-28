// backend/admin-service/src/types/queueManagement.ts

export interface QueueStatus {
  jobId: string;
  propertyId: string;
  propertyAddress: string;
  
  // Queue Information
  totalAgentsInQueue: number;
  currentPosition: number;
  activeAgentId?: string;
  activeAgentName?: string;
  
  // Timing
  queueStartedAt: Date;
  currentAgentAssignedAt?: Date;
  currentAgentTimeRemaining?: number; // in seconds
  estimatedCompletionTime?: Date;
  
  // Queue Members
  queueMembers: QueueMember[];
  
  // Status
  isActive: boolean;
  isPaused: boolean;
  pauseReason?: string;
}

export interface QueueMember {
  agentId: string;
  agentName: string;
  agentPhone?: string;
  position: number;
  joinedAt: Date;
  status: QueueMemberStatus;
  notificationSent: boolean;
  lastNotificationAt?: Date;
  
  // Agent Info
  distanceToProperty?: number; // in km
  estimatedArrivalTime?: number; // in minutes
  reliabilityScore?: number;
  completedJobs?: number;
}

export enum QueueMemberStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  NOTIFIED = 'NOTIFIED',
  EXPIRED = 'EXPIRED',
  REMOVED = 'REMOVED',
  COMPLETED = 'COMPLETED',
}

export interface QueueManagementAction {
  jobId: string;
  adminId: string;
  action: QueueAction;
  targetAgentId?: string;
  reason?: string;
  newTimeLimit?: number; // in minutes
}

export enum QueueAction {
  PAUSE_QUEUE = 'PAUSE_QUEUE',
  RESUME_QUEUE = 'RESUME_QUEUE',
  SKIP_AGENT = 'SKIP_AGENT',
  REMOVE_AGENT = 'REMOVE_AGENT',
  EXTEND_TIME = 'EXTEND_TIME',
  FORCE_COMPLETE = 'FORCE_COMPLETE',
  CANCEL_QUEUE = 'CANCEL_QUEUE',
  REORDER_QUEUE = 'REORDER_QUEUE',
}

export interface QueueMetrics {
  // Active Queues
  totalActiveQueues: number;
  totalAgentsInQueues: number;
  averageQueueSize: number;
  
  // Performance
  averageWaitTime: number; // in minutes
  averageCompletionTime: number; // in minutes
  successRate: number; // percentage of jobs completed
  timeoutRate: number; // percentage of agents timing out
  
  // Today's Stats
  queuesCreatedToday: number;
  queuesCompletedToday: number;
  agentsTimedOutToday: number;
  
  // Issues
  stuckQueues: number; // queues with no activity for > 6 hours
  overflowQueues: number; // queues with > 10 agents
}

export interface QueueAlert {
  id: string;
  jobId: string;
  alertType: QueueAlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  requiresAction: boolean;
  suggestedAction?: string;
  createdAt: Date;
}

export enum QueueAlertType {
  AGENT_TIMEOUT = 'AGENT_TIMEOUT',
  QUEUE_STUCK = 'QUEUE_STUCK',
  QUEUE_OVERFLOW = 'QUEUE_OVERFLOW',
  NO_AGENTS_AVAILABLE = 'NO_AGENTS_AVAILABLE',
  MULTIPLE_TIMEOUTS = 'MULTIPLE_TIMEOUTS',
  QUEUE_EXPIRED = 'QUEUE_EXPIRED',
}

export interface QueueIntervention {
  jobId: string;
  adminId: string;
  interventionType: 'MANUAL_ASSIGNMENT' | 'PRIORITY_BOOST' | 'QUEUE_RESET' | 'BROADCAST_EXPANSION';
  targetAgentId?: string;
  expandedRadius?: number; // for broadcast expansion
  priorityLevel?: number;
  reason: string;
  timestamp: Date;
}

export interface AgentQueueActivity {
  agentId: string;
  agentName: string;
  
  // Current Status
  isInQueue: boolean;
  currentQueuePosition?: number;
  currentJobId?: string;
  
  // Queue History
  totalQueuesJoined: number;
  totalQueuesCompleted: number;
  totalQueuesExpired: number;
  totalQueuesAbandoned: number;
  
  // Performance in Queues
  averagePositionJoined: number;
  averageWaitTime: number; // in minutes
  successRateInQueue: number; // percentage
  
  // Recent Activity
  lastQueueJoinedAt?: Date;
  lastQueueCompletedAt?: Date;
}

export interface QueueConfiguration {
  defaultTimeSlot: number; // in minutes (default: 180)
  maxQueueSize: number; // maximum agents per queue
  autoExpireAfter: number; // hours before queue auto-expires
  notificationIntervals: number[]; // minutes before time expires to send notifications
  broadcastRadius: number; // km for initial agent broadcast
  expandedRadius: number; // km for expanded broadcast
}

export interface QueueReorder {
  jobId: string;
  adminId: string;
  newOrder: {
    agentId: string;
    newPosition: number;
  }[];
  reason: string;
}