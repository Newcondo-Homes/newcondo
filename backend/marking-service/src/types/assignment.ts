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





// // backend/marking-service/src/types/assignment.ts

// export interface AssignmentRequest {
//   jobId: string;
//   agentId?: string; // Optional: for manual assignment
//   autoAssign: boolean;
//   preferredAgents?: string[]; // Priority agents
//   excludeAgents?: string[]; // Agents to exclude
//   maxDistanceKm?: number;
//   minReliabilityScore?: number;
// }

// export interface AssignmentResult {
//   success: boolean;
//   jobId: string;
//   agentId?: string;
//   agentName?: string;
//   assignedAt?: Date;
//   timeSlotExpiry?: Date;
//   queuePosition?: number;
//   message: string;
//   errors?: string[];
//   fallbackReason?: string;
// }

// export interface AssignmentCriteria {
//   proximity: {
//     enabled: boolean;
//     weight: number;
//     maxDistanceKm: number;
//   };
//   reliability: {
//     enabled: boolean;
//     weight: number;
//     minScore: number;
//   };
//   availability: {
//     enabled: boolean;
//     weight: number;
//     maxConcurrentJobs: number;
//   };
//   experience: {
//     enabled: boolean;
//     weight: number;
//     minCompletedJobs: number;
//   };
//   performance: {
//     enabled: boolean;
//     weight: number;
//     minSuccessRate: number;
//   };
// }

// export interface AssignmentScore {
//   agentId: string;
//   totalScore: number;
//   breakdown: {
//     proximityScore: number;
//     reliabilityScore: number;
//     availabilityScore: number;
//     experienceScore: number;
//     performanceScore: number;
//   };
//   metadata: {
//     distanceKm?: number;
//     reliabilityRating?: number;
//     currentJobs: number;
//     completedJobs: number;
//     successRate: number;
//   };
//   isQualified: boolean;
//   disqualificationReasons?: string[];
// }

// export interface AssignmentPool {
//   jobId: string;
//   totalAgents: number;
//   qualifiedAgents: number;
//   rankedAgents: AssignmentScore[];
//   selectionCriteria: AssignmentCriteria;
//   generatedAt: Date;
// }

// export interface AssignmentHistory {
//   jobId: string;
//   assignments: Array<{
//     agentId: string;
//     agentName: string;
//     assignedAt: Date;
//     expiredAt?: Date;
//     completedAt?: Date;
//     status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REASSIGNED';
//     outcome?: AssignmentOutcome;
//     notes?: string;
//   }>;
//   currentAssignment?: {
//     agentId: string;
//     assignedAt: Date;
//     timeSlotExpiry: Date;
//   };
//   totalReassignments: number;
// }

// export type AssignmentOutcome = 
//   | 'SUCCESS' 
//   | 'TIMEOUT' 
//   | 'DECLINED' 
//   | 'CANCELLED' 
//   | 'QUALITY_ISSUE';

// export interface AssignmentNotification {
//   assignmentId: string;
//   jobId: string;
//   agentId: string;
//   notificationType: AssignmentNotificationType;
//   channel: NotificationChannel[];
//   content: {
//     subject: string;
//     body: string;
//     actionRequired?: string;
//     actionUrl?: string;
//     expiresAt?: Date;
//   };
//   scheduledFor: Date;
//   sentAt?: Date;
//   status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'READ';
// }

// export type AssignmentNotificationType = 
//   | 'NEW_ASSIGNMENT' 
//   | 'ASSIGNMENT_REMINDER' 
//   | 'EXPIRY_WARNING' 
//   | 'ASSIGNMENT_EXPIRED' 
//   | 'ASSIGNMENT_CANCELLED' 
//   | 'NEXT_IN_LINE';

// export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';

// export interface AssignmentReassignment {
//   jobId: string;
//   fromAgentId: string;
//   toAgentId?: string;
//   reason: ReassignmentReason;
//   initiatedBy: string; // User ID or 'SYSTEM'
//   initiatedAt: Date;
//   previousTimeSlotStart: Date;
//   previousTimeSlotEnd: Date;
//   newTimeSlotStart?: Date;
//   newTimeSlotEnd?: Date;
//   compensationAdjustment?: {
//     previousAgentCompensation: number;
//     newAgentCompensation: number;
//   };
// }

// export type ReassignmentReason = 
//   | 'TIMEOUT' 
//   | 'AGENT_DECLINED' 
//   | 'AGENT_UNAVAILABLE' 
//   | 'PROPERTY_OWNER_REQUEST' 
//   | 'QUALITY_CONCERN' 
//   | 'DISTANCE_TOO_FAR' 
//   | 'MANUAL_OVERRIDE';

// export interface AssignmentAcceptance {
//   jobId: string;
//   agentId: string;
//   acceptedAt: Date;
//   estimatedArrivalTime?: Date;
//   notes?: string;
//   confirmationMethod: 'IN_APP' | 'SMS' | 'PHONE_CALL';
// }

// export interface AssignmentDecline {
//   jobId: string;
//   agentId: string;
//   declinedAt: Date;
//   reason: DeclineReason;
//   detailedReason?: string;
//   willRetryLater: boolean;
// }

// export type DeclineReason = 
//   | 'TOO_FAR' 
//   | 'SCHEDULE_CONFLICT' 
//   | 'NOT_INTERESTED' 
//   | 'INSUFFICIENT_INFORMATION' 
//   | 'OTHER';

// export interface AssignmentProgress {
//   jobId: string;
//   agentId: string;
//   currentStatus: 'ASSIGNED' | 'ACCEPTED' | 'EN_ROUTE' | 'ON_SITE' | 'MARKING' | 'UPLOADING';
//   checkpoints: Array<{
//     status: string;
//     timestamp: Date;
//     location?: { lat: number; lng: number };
//     notes?: string;
//   }>;
//   estimatedCompletion?: Date;
//   lastUpdated: Date;
// }

// export interface AssignmentTimeSlot {
//   assignmentId: string;
//   jobId: string;
//   agentId: string;
//   startTime: Date;
//   endTime: Date;
//   durationMinutes: number;
//   bufferMinutes: number; // Extra time before/after
//   isFlexible: boolean;
//   warnings: Array<{
//     type: 'APPROACHING_EXPIRY' | 'OVER_TIME' | 'DELAYED_START';
//     triggeredAt: Date;
//     minutesRemaining?: number;
//   }>;
// }

// export interface AssignmentConflict {
//   jobId: string;
//   agentId: string;
//   conflictType: ConflictType;
//   conflictingJobIds?: string[];
//   detectedAt: Date;
//   resolution?: {
//     resolvedBy: string;
//     resolvedAt: Date;
//     action: 'REASSIGN' | 'ADJUST_TIME' | 'CANCEL';
//     notes: string;
//   };
// }

// export type ConflictType = 
//   | 'SCHEDULE_OVERLAP' 
//   | 'LOCATION_TOO_FAR' 
//   | 'MAX_CAPACITY_REACHED' 
//   | 'AGENT_UNAVAILABLE';

// export interface AssignmentCompensation {
//   jobId: string;
//   agentId: string;
//   baseFee: number;
//   bonuses: Array<{
//     type: 'SPEED_BONUS' | 'QUALITY_BONUS' | 'DIFFICULTY_BONUS';
//     amount: number;
//     reason: string;
//   }>;
//   deductions: Array<{
//     type: 'DELAY_PENALTY' | 'QUALITY_ISSUE' | 'CANCELLATION_FEE';
//     amount: number;
//     reason: string;
//   }>;
//   totalCompensation: number;
//   platformFee: number;
//   netAmount: number;
//   paymentStatus: 'PENDING' | 'HELD' | 'RELEASED' | 'PAID';
// }

// export interface AssignmentAnalytics {
//   period: {
//     start: Date;
//     end: Date;
//   };
//   totalAssignments: number;
//   successfulAssignments: number;
//   failedAssignments: number;
//   averageAssignmentTime: number; // minutes
//   averageCompletionTime: number; // minutes
//   reassignmentRate: number; // percentage
//   topPerformingAgents: Array<{
//     agentId: string;
//     completedJobs: number;
//     averageTime: number;
//     successRate: number;
//     reliabilityScore: number;
//   }>;
//   problematicJobs: Array<{
//     jobId: string;
//     reassignments: number;
//     timeTaken: number;
//     issues: string[];
//   }>;
// }

// // Constants for assignment logic
// export const ASSIGNMENT_CONSTANTS = {
//   MAX_CONCURRENT_ASSIGNMENTS: 3,
//   MIN_RELIABILITY_SCORE: 3.0,
//   MAX_DISTANCE_KM: 50,
//   ASSIGNMENT_TIMEOUT_MINUTES: 15, // Time for agent to accept
//   DEFAULT_TIME_SLOT_MINUTES: 180, // 3 hours
//   BUFFER_TIME_MINUTES: 30,
//   MAX_REASSIGNMENTS: 5,
//   PROXIMITY_BONUS_KM: 10, // Extra points for being within 10km
//   SPEED_BONUS_THRESHOLD_MINUTES: 120, // Complete in under 2 hours
//   QUALITY_BONUS_MIN_RATING: 4.5,
//   WEIGHTS: {
//     PROXIMITY: 0.3,
//     RELIABILITY: 0.4,
//     AVAILABILITY: 0.3,
//   },
// } as const;

// export interface AssignmentValidation {
//   isValid: boolean;
//   errors: string[];
//   warnings: string[];
//   checks: {
//     agentExists: boolean;
//     agentAvailable: boolean;
//     agentQualified: boolean;
//     withinServiceArea: boolean;
//     hasCapacity: boolean;
//     meetsReliabilityThreshold: boolean;
//   };
// }

// export interface AssignmentPreview {
//   jobId: string;
//   suggestedAgents: Array<{
//     agentId: string;
//     agentName: string;
//     score: number;
//     distanceKm: number;
//     estimatedArrival: Date;
//     estimatedCompletion: Date;
//     reliabilityScore: number;
//     completedJobs: number;
//     pros: string[];
//     cons: string[];
//   }>;
//   alternativeOptions: {
//     manualAssignment: boolean;
//     broadcastToAll: boolean;
//     queueForLater: boolean;
//   };
// }