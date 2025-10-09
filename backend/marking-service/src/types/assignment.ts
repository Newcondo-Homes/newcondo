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




// // backend/marking-service/src/types/assignment.ts

// export enum AssignmentStatus {
//   PENDING = 'PENDING',
//   ACCEPTED = 'ACCEPTED',
//   REJECTED = 'REJECTED',
//   IN_PROGRESS = 'IN_PROGRESS',
//   COMPLETED = 'COMPLETED',
//   FAILED = 'FAILED',
//   EXPIRED = 'EXPIRED'
// }

// export enum AssignmentMethod {
//   AUTOMATIC = 'AUTOMATIC', // System auto-assigns based on proximity
//   MANUAL = 'MANUAL', // Admin manually assigns
//   QUEUE_BASED = 'QUEUE_BASED', // First-come-first-served queue
//   DIRECT = 'DIRECT' // Direct assignment by property owner
// }

// export interface AgentAssignment {
//   id: string;
//   markingJobId: string;
//   agentId: string;
//   assignmentMethod: AssignmentMethod;
//   status: AssignmentStatus;
  
//   // Assignment Details
//   assignedAt: Date;
//   assignedBy?: string; // User ID of assigner (for manual assignments)
//   acceptedAt?: Date;
//   rejectedAt?: Date;
//   rejectionReason?: string;
  
//   // Time Management
//   expectedStartTime?: Date;
//   actualStartTime?: Date;
//   expectedCompletionTime?: Date;
//   actualCompletionTime?: Date;
//   deadline: Date;
  
//   // Agent Location & Distance
//   agentLocation?: {
//     lat: number;
//     lng: number;
//   };
//   propertyLocation: {
//     lat: number;
//     lng: number;
//   };
//   distanceKm: number;
//   estimatedTravelTime?: number; // In minutes
  
//   // Performance Tracking
//   responseTime?: number; // Time to accept/reject in minutes
//   completionTime?: number; // Time to complete in minutes
//   qualityScore?: number; // 1-5 rating
  
//   // Metadata
//   attempts: number; // Number of times assignment was attempted
//   notes?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface AgentAvailability {
//   agentId: string;
//   isAvailable: boolean;
//   currentActiveJobs: number;
//   maxConcurrentJobs: number;
//   serviceAreas: string[]; // States/LGAs where agent operates
//   workingHours?: {
//     start: string; // "09:00"
//     end: string; // "18:00"
//     daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
//   };
//   lastActiveAt?: Date;
//   isOnline: boolean;
// }

// export interface AgentCapability {
//   agentId: string;
//   canMarkProperties: boolean;
//   maxDistanceKm: number; // Maximum distance willing to travel
//   preferredPropertyTypes?: string[];
//   hasVehicle: boolean;
//   hasSmartphone: boolean;
//   experience: {
//     totalJobs: number;
//     completedJobs: number;
//     successRate: number;
//     averageRating: number;
//   };
//   certifications?: string[];
// }

// export interface AssignmentCriteria {
//   proximity: {
//     weight: number; // 0-1
//     maxDistanceKm: number;
//   };
//   reliability: {
//     weight: number; // 0-1
//     minSuccessRate: number;
//     minCompletedJobs: number;
//   };
//   availability: {
//     weight: number; // 0-1
//     maxCurrentJobs: number;
//   };
//   experience: {
//     weight: number; // 0-1
//     minRating: number;
//   };
// }

// export interface AgentScore {
//   agentId: string;
//   totalScore: number;
//   scores: {
//     proximity: number;
//     reliability: number;
//     availability: number;
//     experience: number;
//   };
//   isEligible: boolean;
//   disqualificationReasons?: string[];
// }

// export interface BroadcastRequest {
//   markingJobId: string;
//   propertyLocation: {
//     lat: number;
//     lng: number;
//     address: string;
//   };
//   radiusKm: number;
//   maxAgents?: number;
//   urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
//   notificationChannels: ('EMAIL' | 'SMS' | 'PUSH')[];
// }

// export interface BroadcastResponse {
//   broadcastId: string;
//   markingJobId: string;
//   agentsNotified: number;
//   agentsInRadius: number;
//   notifications: {
//     agentId: string;
//     channels: string[];
//     sentAt: Date;
//   }[];
//   expiresAt: Date;
// }

// export interface AssignmentNotification {
//   type: 'NEW_ASSIGNMENT' | 'ASSIGNMENT_REMINDER' | 'ASSIGNMENT_CANCELLED' | 'DEADLINE_APPROACHING';
//   assignmentId: string;
//   agentId: string;
//   markingJobId: string;
//   message: string;
//   priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
//   actionRequired?: boolean;
//   expiresAt?: Date;
// }

// export interface CreateAssignmentDTO {
//   markingJobId: string;
//   agentId: string;
//   assignmentMethod: AssignmentMethod;
//   assignedBy?: string;
//   expectedStartTime?: Date;
//   expectedCompletionTime?: Date;
//   deadline: Date;
//   notes?: string;
// }

// export interface UpdateAssignmentDTO {
//   status?: AssignmentStatus;
//   acceptedAt?: Date;
//   rejectedAt?: Date;
//   rejectionReason?: string;
//   actualStartTime?: Date;
//   actualCompletionTime?: Date;
//   qualityScore?: number;
//   notes?: string;
// }

// export interface AssignmentFilters {
//   markingJobId?: string;
//   agentId?: string;
//   status?: AssignmentStatus[];
//   assignmentMethod?: AssignmentMethod[];
//   dateFrom?: Date;
//   dateTo?: Date;
// }

// export interface AssignmentAnalytics {
//   totalAssignments: number;
//   acceptanceRate: number;
//   completionRate: number;
//   averageResponseTime: number; // Minutes
//   averageCompletionTime: number; // Minutes
//   averageQualityScore: number;
//   byStatus: Record<AssignmentStatus, number>;
//   byMethod: Record<AssignmentMethod, number>;
// }