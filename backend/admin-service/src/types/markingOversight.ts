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