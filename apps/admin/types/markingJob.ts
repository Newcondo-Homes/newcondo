/**
 * Admin Dashboard - Marking Job Types
 * Location: apps/admin/src/types/markingJob.ts
 */

export enum MarkingJobStatus {
  QUEUED = "QUEUED",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export enum UrgencyLevel {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum MarkingMethod {
  SELF_MARK = "SELF_MARK",
  ASSIGN_NEWCONDO = "ASSIGN_NEWCONDO",
  SEND_LINK = "SEND_LINK",
  ASSIGN_AGENT = "ASSIGN_AGENT",
}

export interface PropertyMarkingJob {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  
  // Requester
  requestedBy: string;
  requesterName: string | null;
  requesterEmail: string;
  requesterPhone: string | null;
  
  // Assignment
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  assignedAgentEmail: string | null;
  assignedAgentPhone: string | null;
  
  // Job Details
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions: string | null;
  preferredTime: Date | null;
  urgencyLevel: UrgencyLevel;
  markingMethod: MarkingMethod;
  
  // Pricing
  markingFee: number;
  agentCompensation: number;
  platformFee: number;
  paymentStatus: string;
  
  // Status
  status: MarkingJobStatus;
  assignedAt: Date | null;
  completedAt: Date | null;
  timeSlotExpiry: Date | null;
  
  // Completion
  completionNotes: string | null;
  completionImages: string[];
  boundaryData: any | null;
  
  // Queue
  queuePosition: number | null;
  maxCompletionTime: Date | null;
  
  // Property Owner Confirmation
  confirmationDeadline: Date | null;
  isConfirmed: boolean;
  confirmedAt: Date | null;
  confirmationNotes: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MarkingJobListItem {
  id: string;
  propertyTitle: string;
  requesterName: string | null;
  assignedAgentName: string | null;
  status: MarkingJobStatus;
  urgencyLevel: UrgencyLevel;
  markingFee: number;
  queuePosition: number | null;
  createdAt: Date;
}

export interface AgentQueueItem {
  agentId: string;
  agentName: string | null;
  agentEmail: string;
  agentPhone: string | null;
  position: number;
  jobId: string;
  propertyTitle: string;
  assignedAt: Date;
  timeSlotExpiry: Date;
  remainingTime: number; // minutes
  isActive: boolean;
}

export interface MarkingJobAssignment {
  jobId: string;
  agentId: string;
  assignedBy: string; // Admin ID
  timeSlotDuration: number; // hours
  notes?: string;
}

export interface MarkingJobReassignment {
  jobId: string;
  currentAgentId: string;
  newAgentId: string;
  reason: string;
  reassignedBy: string; // Admin ID
}

export interface MarkingJobCompletion {
  jobId: string;
  completionNotes: string;
  boundaryData: any;
  images: string[];
  completedBy: string;
}

export interface MarkingJobFilters {
  search?: string;
  status?: MarkingJobStatus;
  urgencyLevel?: UrgencyLevel;
  markingMethod?: MarkingMethod;
  requestedBy?: string;
  assignedAgentId?: string;
  paymentStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isExpiringSoon?: boolean; // Within 24 hours
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface MarkingJobStats {
  totalJobs: number;
  queued: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  expired: number;
  averageCompletionTime: number; // hours
  todayCreated: number;
  todayCompleted: number;
  thisWeekCompleted: number;
}

export interface AgentQueueStats {
  totalAgents: number;
  activeAgents: number;
  availableAgents: number;
  busyAgents: number;
  averageQueuePosition: number;
  averageWaitTime: number; // minutes
}

export interface MarkingJobOversight {
  jobId: string;
  issues: string[];
  qualityScore: number | null; // 0-100
  requiresReview: boolean;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
}

export interface MarkingJobTimeline {
  id: string;
  jobId: string;
  event: string;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface BulkMarkingJobAction {
  jobIds: string[];
  action: "cancel" | "reassign" | "extend_deadline";
  reason?: string;
  notes?: string;
  newAgentId?: string; // For reassign
  extensionHours?: number; // For extend_deadline
}

export interface MarkingJobAlert {
  id: string;
  jobId: string;
  alertType: "expiring_soon" | "expired" | "queue_timeout" | "quality_issue";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  isResolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
}