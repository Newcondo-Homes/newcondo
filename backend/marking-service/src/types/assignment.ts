export interface AssignmentRequest {
  jobId: string;
  preferredAgentId?: string;
  requiresExpertise?: string[];
  maxDistance?: number; // in kilometers
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  timePreference?: {
    preferredDate?: Date;
    timeSlots?: string[]; // ['morning', 'afternoon', 'evening']
    avoidDates?: Date[];
  };
}

export interface AssignmentCriteria {
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  expertise?: string[];
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  maxTravelDistance: number;
  preferredCompletionTime: Date;
  minimumReliabilityScore?: number;
}

export interface AgentMatch {
  agentId: string;
  agentName: string;
  matchScore: number; // 0-100
  distance: number; // in kilometers
  reliabilityScore: number;
  totalJobs: number;
  completedJobs: number;
  averageCompletionTime: number; // in hours
  serviceAreas: string[];
  availability: AgentAvailability;
  estimatedTravelTime: number; // in minutes
  currentWorkload: number; // number of active jobs
}

export interface AgentAvailability {
  isAvailable: boolean;
  nextAvailableSlot?: Date;
  busyUntil?: Date;
  workingHours: {
    [key: string]: { // day of week
      start: string; // '09:00'
      end: string;   // '17:00'
    };
  };
  timeOffPeriods?: {
    start: Date;
    end: Date;
    reason?: string;
  }[];
}

export interface AssignmentResult {
  success: boolean;
  assignedAgent?: {
    agentId: string;
    agentName: string;
    phone: string;
    email: string;
    estimatedArrival?: Date;
    acceptanceDeadline: Date; // 30 minutes to accept
  };
  alternativeAgents?: AgentMatch[];
  error?: {
    code: string;
    message: string;
  };
}

export interface AssignmentNotification {
  type: 'ASSIGNMENT_OFFERED' | 'ASSIGNMENT_ACCEPTED' | 'ASSIGNMENT_REJECTED' | 'ASSIGNMENT_EXPIRED';
  jobId: string;
  agentId?: string;
  message: string;
  deadline?: Date;
  metadata?: Record<string, any>;
}

export interface AssignmentHistory {
  jobId: string;
  attempts: AssignmentAttempt[];
  finalAssignment?: {
    agentId: string;
    assignedAt: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    reason?: string;
  };
}

export interface AssignmentAttempt {
  attemptNumber: number;
  agentId: string;
  offeredAt: Date;
  response?: 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  respondedAt?: Date;
  rejectionReason?: string;
  timeoutAt: Date;
}

export interface BulkAssignmentRequest {
  jobIds: string[];
  criteria: AssignmentCriteria;
  maxAssignmentsPerAgent?: number;
  prioritizeBalancing?: boolean; // distribute evenly among agents
}

export interface AssignmentMetrics {
  totalAssignments: number;
  successfulAssignments: number;
  failedAssignments: number;
  averageAssignmentTime: number; // time to find agent
  averageAcceptanceTime: number; // time for agent to accept
  mostActiveAgents: {
    agentId: string;
    assignmentCount: number;
    successRate: number;
  }[];
  assignmentsByUrgency: {
    [key in 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT']: number;
  };
}