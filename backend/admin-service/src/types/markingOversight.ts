// backend/admin-service/src/types/markingOversight.ts

/**
 * Marking Job Status for oversight
 */
export enum MarkingJobOversightStatus {
  PENDING = 'PENDING', // Awaiting agent assignment
  ASSIGNED = 'ASSIGNED', // Assigned to agent
  IN_PROGRESS = 'IN_PROGRESS', // Agent working on marking
  COMPLETED = 'COMPLETED', // Agent completed marking
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // Awaiting owner verification
  VERIFIED = 'VERIFIED', // Owner confirmed marking
  REJECTED = 'REJECTED', // Owner rejected marking
  DISPUTED = 'DISPUTED', // Dispute raised
  CANCELLED = 'CANCELLED', // Job cancelled
  EXPIRED = 'EXPIRED', // Time limit exceeded
}

/**
 * Marking Dispute Status
 */
export enum MarkingDisputeStatus {
  PENDING = 'PENDING', // Newly created dispute
  IN_REVIEW = 'IN_REVIEW', // Under admin review
  AWAITING_EVIDENCE = 'AWAITING_EVIDENCE', // Admin awaiting more evidence
  RESOLVED = 'RESOLVED', // Dispute resolved
  ESCALATED = 'ESCALATED', // Escalated to senior admin
}

/**
 * Dispute Resolution Types
 */
export enum DisputeResolution {
  APPROVED = 'APPROVED', // Property marking accepted
  REJECTED = 'REJECTED', // Property marking rejected
  REMARK_REQUIRED = 'REMARK_REQUIRED', // Request for re-marking
  PARTIAL_REFUND = 'PARTIAL_REFUND', // Partial refund to owner
  FULL_REFUND = 'FULL_REFUND', // Full refund to owner
}

/**
 * Oversight Priority Levels
 */
export enum OversightPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Marking Job Detail for oversight
 */
export interface MarkingJobOversightDetail {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  requestedBy: string;
  requestedByName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: MarkingJobOversightStatus;
  markingFee: number;
  paymentStatus: string;
  createdAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  verificationDeadline?: Date;
  completionImages?: string[];
  contactPersonName: string;
  contactPersonPhone: string;
  urgencyLevel: string;
  timeSlotExpiry?: Date;
  maxCompletionTime?: Date;
  hasDispute: boolean;
}

/**
 * Marking Dispute Detail
 */
export interface MarkingDisputeDetail {
  id: string;
  markingJobId: string;
  propertyId: string;
  propertyAddress: string;
  propertyOwnerId: string;
  propertyOwnerName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: MarkingDisputeStatus;
  reason: string;
  description?: string;
  ownerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: DisputeResolution;
  adminNotes?: string;
  priority: OversightPriority;
  evidenceImages?: string[];
  compensationAmount?: number;
}

/**
 * Marking Dispute Input for creation/resolution
 */
export interface CreateMarkingDisputeInput {
  markingJobId: string;
  reason: string;
  description?: string;
  priority?: OversightPriority;
  evidenceImages?: string[];
}

/**
 * Dispute Resolution Input
 */
export interface ResolveDisputeInput {
  resolution: DisputeResolution;
  notes: string;
  action: string; // 'APPROVE_PROPERTY' | 'REJECT_MARKING' | 'REQUEST_REMARKING'
  compensationAmount?: number;
  reassignAgentId?: string;
}

/**
 * Dispute Escalation Input
 */
export interface EscalateDisputeInput {
  reason: string;
  priority: OversightPriority;
  additionalNotes?: string;
}

/**
 * Agent Assignment for Re-marking
 */
export interface RemarkingAssignment {
  disputeId: string;
  agentId: string;
  deadline: Date;
  instructions?: string;
  compensationPercentage: number; // e.g., 70% for second attempt
}

/**
 * Dispute Statistics
 */
export interface DisputeStatistics {
  totalDisputes: number;
  pendingDisputes: number;
  resolvedDisputes: number;
  escalatedDisputes: number;
  averageResolutionTime: number; // in hours
  resolutionRate: number; // percentage
  commonReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  agentDisputes: Array<{
    agentId: string;
    agentName: string;
    disputeCount: number;
    resolutionRate: number;
  }>;
}

/**
 * Marking Job Query Options
 */
export interface MarkingJobQueryOptions {
  status?: MarkingJobOversightStatus;
  propertyId?: string;
  assignedAgentId?: string;
  page: number;
  limit: number;
  sortBy: string;
  adminId: string;
}

/**
 * Dispute Query Options
 */
export interface DisputeQueryOptions {
  status?: MarkingDisputeStatus;
  propertyId?: string;
  agentId?: string;
  priority?: OversightPriority;
  page: number;
  limit: number;
  sortBy: string;
  adminId: string;
}

/**
 * Marking Notification
 */
export interface MarkingNotification {
  id: string;
  recipientId: string;
  type: 'OWNER' | 'AGENT' | 'ADMIN';
  title: string;
  message: string;
  relatedEntityId: string; // marking job or dispute ID
  isRead: boolean;
  createdAt: Date;
}

/**
 * Agent Re-marking Performance
 */
export interface AgentRemarking {
  agentId: string;
  agentName: string;
  totalRemarking: number;
  completedRemarking: number;
  averageCompletionTime: number; // in hours
  succeededOnSecondAttempt: number;
  disputeRatePercentage: number;
}

/**
 * Property Verification for Dispute
 */
export interface PropertyVerificationData {
  propertyId: string;
  boundaryCoordinates?: any; // Polygon data
  boundaryImages: string[];
  agentVerificationNotes?: string;
  ownerVerificationNotes?: string;
  completionImages: string[];
  firstAttemptImages: string[];
  secondAttemptImages?: string[];
}

/**
 * Dispute Notification Payload
 */
export interface DisputeNotificationPayload {
  recipientId: string;
  message: string;
  type: 'OWNER' | 'AGENT' | 'ADMIN';
  disputeId: string;
  markingJobId: string;
  actionUrl?: string;
  additionalData?: any;
}










// // backend/admin-service/src/types/markingOversight.ts

// import { MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@prisma/client';

// /**
//  * Marking Job Overview for Admin Dashboard
//  */
// export interface MarkingJobOverview {
//   id: string;
//   propertyId: string;
//   requestedBy: string;
//   assignedAgentId: string | null;
//   status: MarkingJobStatus;
//   urgencyLevel: UrgencyLevel;
//   markingFee: number;
//   paymentStatus: PaymentStatus;
//   createdAt: Date;
//   assignedAt: Date | null;
//   completedAt: Date | null;
//   timeSlotExpiry: Date | null;
//   maxCompletionTime: Date | null;
//   queuePosition: number | null;
//   property: {
//     id: string;
//     title: string;
//     address: string;
//     city: string;
//     state: string;
//     gpsCoordinates: string | null;
//   };
//   requestingUser: {
//     id: string;
//     name: string | null;
//     email: string;
//     phone: string | null;
//     role: string;
//   };
//   assignedAgent: {
//     id: string;
//     name: string | null;
//     email: string;
//     phone: string | null;
//     agentReliabilityScore: number | null;
//     totalMarkingJobs: number;
//     completedMarkingJobs: number;
//   } | null;
// }

// /**
//  * Detailed Marking Job Information
//  */
// export interface MarkingJobDetails extends MarkingJobOverview {
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions: string | null;
//   preferredTime: Date | null;
//   completionNotes: string | null;
//   completionImages: string[];
//   boundaryData: any | null;
// }

// /**
//  * Job Assignment Request
//  */
// export interface JobAssignmentRequest {
//   agentId: string;
//   notes?: string;
// }

// /**
//  * Job Reassignment Request
//  */
// export interface JobReassignmentRequest {
//   newAgentId: string;
//   reason: string;
// }

// /**
//  * Job Cancellation Request
//  */
// export interface JobCancellationRequest {
//   reason: string;
// }

// /**
//  * Completion Review Request
//  */
// export interface CompletionReviewRequest {
//   approved: boolean;
//   notes?: string;
// }

// /**
//  * Dispute Resolution Request
//  */
// export interface DisputeResolutionRequest {
//   resolution: string;
//   compensateAgent?: boolean;
//   refundOwner?: boolean;
//   notes?: string;
// }

// /**
//  * Urgency Update Request
//  */
// export interface UrgencyUpdateRequest {
//   urgencyLevel: UrgencyLevel;
//   reason?: string;
// }

// /**
//  * Deadline Extension Request
//  */
// export interface DeadlineExtensionRequest {
//   extensionHours: number;
//   reason?: string;
// }

// /**
//  * Bulk Update Request
//  */
// export interface BulkUpdateRequest {
//   jobIds: string[];
//   action: 'assign' | 'reassign' | 'cancel' | 'update_urgency' | 'extend_deadline';
//   data: any;
// }

// /**
//  * Job Filters for Search/Filter
//  */
// export interface JobFilters {
//   status?: MarkingJobStatus | MarkingJobStatus[];
//   urgencyLevel?: UrgencyLevel | UrgencyLevel[];
//   assignedAgentId?: string;
//   requestedBy?: string;
//   city?: string;
//   state?: string;
//   startDate?: Date;
//   endDate?: Date;
//   paymentStatus?: PaymentStatus;
//   minFee?: number;
//   maxFee?: number;
//   hasCompletionImages?: boolean;
//   hasBoundaryData?: boolean;
// }

// /**
//  * Pagination Options
//  */
// export interface PaginationOptions {
//   page: number;
//   limit: number;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
// }

// /**
//  * Queue Status Information
//  */
// export interface QueueStatus {
//   totalQueued: number;
//   byUrgency: Record<string, number>;
//   averageWaitHours: number;
//   oldestJob?: {
//     id: string;
//     createdAt: Date;
//     urgencyLevel: UrgencyLevel;
//   };
//   estimatedWaitTime?: number;
// }

// /**
//  * Agent Performance Metrics
//  */
// export interface AgentPerformanceMetrics {
//   agent: {
//     id: string;
//     name: string | null;
//     email: string;
//     phone: string | null;
//     agentReliabilityScore: number | null;
//     totalMarkingJobs: number;
//     completedMarkingJobs: number;
//     agentServiceAreas: string[];
//     isAvailableForMarking: boolean;
//   };
//   statistics: {
//     totalJobs: number;
//     completedJobs: number;
//     cancelledJobs: number;
//     inProgressJobs: number;
//     expiredJobs: number;
//     completionRate: number;
//     averageCompletionHours: number;
//     totalEarnings: number;
//   };
//   locationDistribution: Record<string, number>;
//   recentJobs: any[];
// }

// /**
//  * Marking Analytics Overview
//  */
// export interface MarkingAnalyticsOverview {
//   overview: {
//     totalJobs: number;
//     queuedJobs: number;
//     assignedJobs: number;
//     inProgressJobs: number;
//     completedJobs: number;
//     cancelledJobs: number;
//     expiredJobs: number;
//     activeAgents: number;
//     completionRate: number;
//   };
//   revenue: {
//     totalRevenue: number;
//     completedRevenue: number;
//     agentPayout: number;
//     platformProfit: number;
//   };
//   distribution: {
//     urgency: Record<string, number>;
//     location: Record<string, number>;
//   };
//   averages: {
//     completionTimeHours: number;
//     waitTimeHours: number;
//   };
//   topAgents: Array<{
//     id: string;
//     name: string | null;
//     email: string;
//     totalMarkingJobs: number;
//     completedMarkingJobs: number;
//     agentReliabilityScore: number | null;
//   }>;
//   timeSeries: Array<{
//     period: string;
//     total: number;
//     completed: number;
//     cancelled: number;
//     queued: number;
//   }>;
// }

// /**
//  * Service Health Metrics
//  */
// export interface ServiceHealthMetrics {
//   activity: {
//     last24Hours: number;
//     lastWeek: number;
//   };
//   queue: {
//     backlog: number;
//     averageWaitHours: number;
//   };
//   issues: {
//     stuckJobs: number;
//     overdueJobs: number;
//   };
//   agents: {
//     total: number;
//     available: number;
//     active: number;
//     utilizationRate: number;
//   };
//   performance: {
//     successRate: number;
//   };
//   healthScore: number;
// }

// /**
//  * Financial Summary
//  */
// export interface FinancialSummary {
//   totalJobs: number;
//   revenue: {
//     gross: number;
//     agentPayouts: number;
//     platformRevenue: number;
//     netRevenue: number;
//   };
//   refunds: {
//     count: number;
//     amount: number;
//   };
//   averages: {
//     revenuePerJob: number;
//     platformRevenuePerJob: number;
//   };
// }

// /**
//  * Agent Leaderboard Entry
//  */
// export interface AgentLeaderboardEntry {
//   agent: {
//     id: string;
//     name: string | null;
//     email: string;
//     reliabilityScore: number | null;
//   };
//   metrics: {
//     completedJobs: number;
//     totalEarnings: number;
//     averageJobValue: number;
//   };
// }

// /**
//  * Property Owner Statistics
//  */
// export interface PropertyOwnerStats {
//   totalRequests: number;
//   completedJobs: number;
//   pendingJobs: number;
//   cancelledJobs: number;
//   totalSpent: number;
//   averageCost: number;
//   completionRate: number;
// }

// /**
//  * Job History Event
//  */
// export interface JobHistoryEvent {
//   event: string;
//   timestamp: Date | null;
//   actor: {
//     id: string;
//     name: string | null;
//     email: string;
//   } | null;
//   details?: any;
//   description?: string;
// }

// /**
//  * Job History Response
//  */
// export interface JobHistoryResponse {
//   job: MarkingJobDetails | null;
//   timeline: JobHistoryEvent[];
// }

// /**
//  * Bulk Update Result
//  */
// export interface BulkUpdateResult {
//   total: number;
//   successful: number;
//   failed: number;
//   results: Array<{
//     jobId: string;
//     success: boolean;
//     data?: any;
//     error?: string;
//   }>;
// }

// /**
//  * Admin Action Metadata for Marking Jobs
//  */
// export interface MarkingAdminActionMetadata {
//   agentId?: string;
//   previousAgentId?: string;
//   newAgentId?: string;
//   notes?: string;
//   reason?: string;
//   previousUrgency?: UrgencyLevel;
//   newUrgency?: UrgencyLevel;
//   extensionHours?: number;
//   resolution?: string;
//   compensateAgent?: boolean;
//   refundOwner?: boolean;
// }

// /**
//  * Date Range Filter
//  */
// export interface DateRangeFilter {
//   startDate?: Date | string;
//   endDate?: Date | string;
// }

// /**
//  * Time Series Data Point
//  */
// export interface TimeSeriesDataPoint {
//   period: string;
//   total: number;
//   completed: number;
//   cancelled: number;
//   queued: number;
//   assigned?: number;
//   inProgress?: number;
// }

// /**
//  * Location Statistics
//  */
// export interface LocationStatistics {
//   city: string;
//   state: string;
//   totalJobs: number;
//   completedJobs: number;
//   averageCompletionTime: number;
//   activeAgents: number;
// }

// /**
//  * Marking Job Alert Configuration
//  */
// export interface MarkingJobAlertConfig {
//   enabled: boolean;
//   stuckJobThresholdHours: number;
//   overdueJobThresholdHours: number;
//   queueBacklogThreshold: number;
//   lowAgentAvailabilityThreshold: number;
//   recipients: string[];
// }

// /**
//  * Export Configuration for Reports
//  */
// export interface ReportExportConfig {
//   format: 'csv' | 'xlsx' | 'pdf';
//   dateRange: DateRangeFilter;
//   filters: JobFilters;
//   includeCharts: boolean;
//   includeDetails: boolean;
// }