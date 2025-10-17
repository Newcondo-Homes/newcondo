import { MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@newcondo/db';

// ==================== Queue Overview Types ====================

export interface QueueOverviewStats {
  totalJobsInQueue: number;
  activeAgents: number;
  avgCompletionTime: number; // in hours
  pendingJobs: number;
  completedToday: number;
  expiredJobs: number;
  totalRevenue: number;
  // Extended fields for richer overview data
  queuedJobs: number;
  assignedJobs: number;
  inProgressJobs: number;
  cancelledJobs: number;
  averageWaitTime: number; // in hours
}

// ==================== Queue Job Types ====================

export interface QueueJobDetails {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  assignedAgent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    reliabilityScore: number;
  } | null;
  contactPerson: {
    name: string;
    phone: string;
  };
  accessInstructions: string | null;
  preferredTime: Date | null;
  urgencyLevel: UrgencyLevel;
  markingFee: number;
  paymentStatus: PaymentStatus;
  status: MarkingJobStatus;
  queuePosition: number | null;
  assignedAt: Date | null;
  completedAt: Date | null;
  timeSlotExpiry: Date | null;
  maxCompletionTime: Date | null;
  completionNotes: string | null;
  completionImages: string[];
  createdAt: Date;
  updatedAt: Date;
  // Time metrics for quick admin review
  metrics: {
    timeInQueue: number; // in minutes
    timeWorking: number; // in minutes
    timeRemaining: number; // in minutes
    isOverdue: boolean;
  }
}

export interface QueueJobListItem {
  id: string;
  propertyTitle: string;
  propertyCity: string;
  propertyState: string;
  requesterName: string;
  agentName: string | null;
  status: MarkingJobStatus;
  queuePosition: number | null;
  urgencyLevel: UrgencyLevel;
  markingFee: number;
  paymentStatus: PaymentStatus;
  timeRemaining: number | null; // minutes until expiry
  createdAt: Date;
  assignedAt: Date | null;
}

// ==================== Queue Filter Types ====================

export interface QueueFilterParams {
  status?: MarkingJobStatus[];
  urgencyLevel?: UrgencyLevel[];
  paymentStatus?: PaymentStatus[];
  state?: string[];
  city?: string[];
  agentId?: string;
  requesterId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minFee?: number;
  maxFee?: number;
  searchTerm?: string; // Search in property title, address, or requester name
}

export interface QueueSortParams {
  sortBy: 'createdAt' | 'queuePosition' | 'markingFee' | 'urgencyLevel' | 'timeSlotExpiry';
  sortOrder: 'asc' | 'desc';
}

export interface QueuePaginationParams {
  page: number;
  limit: number;
}

export interface QueueListResponse {
  jobs: QueueJobListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: QueueFilterParams;
  sorting: QueueSortParams;
}

// ==================== Agent Management Types ====================

export interface AgentQueueInfo {
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string | null;
  reliabilityScore: number;
  isAvailableForMarking: boolean;
  serviceAreas: string[];
  currentAssignments: number;
  completedJobs: number;
  totalJobs: number;
  successRate: number;
  averageCompletionTime: number; // in hours
  totalEarnings: number;
  pendingEarnings: number;
  lastActiveAt: Date | null;
}

export interface AgentPerformanceDetails extends AgentQueueInfo {
  jobHistory: {
    id: string;
    propertyTitle: string;
    status: MarkingJobStatus;
    markingFee: number;
    assignedAt: Date | null;
    completedAt: Date | null;
    completionTime: number | null; // in hours
  }[];
  performanceMetrics: {
    onTimeCompletionRate: number;
    averageRating: number | null;
    totalCancellations: number;
    totalExpirations: number;
  };
}

// ==================== Queue Actions Types ====================

export interface ReassignJobRequest {
  jobId: string;
  newAgentId: string;
  reason: string;
  notifyPreviousAgent: boolean;
}

export interface CancelJobRequest {
  jobId: string;
  reason: string;
  refundAmount?: number;
  notifyRequester: boolean;
}

export interface ExtendTimeSlotRequest {
  jobId: string;
  extensionHours: number;
  reason: string;
}

export interface UpdateUrgencyRequest {
  jobId: string;
  newUrgencyLevel: UrgencyLevel;
  reason: string;
}

export interface BulkActionRequest {
  jobIds: string[];
  action: 'reassign' | 'cancel' | 'extend' | 'notify';
  params?: any;
}

// ==================== Analytics Types ====================

export interface QueuePerformanceMetrics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  averageCompletionTime: number; // in hours
  averageQueueTime: number; // in hours
  successRate: number; // percentage
  agentUtilization: number; // percentage
}

export interface TimeSlotAnalytics {
  totalTimeSlots: number;
  expiredTimeSlots: number;
  averageSlotUtilization: number; // percentage
  slotsCompletedOnTime: number;
  slotsExpired: number;
}

export interface GeographicAnalytics {
  state: string;
  city: string;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  averageCompletionTime: number;
  availableAgents: number;
}

export interface RevenueAnalytics {
  totalMarkingRevenue: number;
  totalAgentPayouts: number;
  platformRevenue: number;
  averageJobValue: number;
  projectedMonthlyRevenue: number;
}

export interface QueueTrendData {
  date: string;
  jobsCreated: number;
  jobsCompleted: number;
  jobsCancelled: number;
  averageQueueTime: number;
  averageCompletionTime: number;
}

export interface RealTimeQueueStats {
  totalQueued: number;
  totalAssigned: number;
  totalInProgress: number;
  averageWaitTime: number; // in minutes
  agentsOnline: number;
  timestamp: Date;
}

// ==================== Alert and Notification Types ====================

export interface QueueAlert {
  id: string;
  type: 'LONG_QUEUE_TIME' | 'LOW_AGENT_AVAILABILITY' | 'HIGH_EXPIRATION_RATE' | 'PAYMENT_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  affectedJobs: number;
  createdAt: Date;
  resolvedAt: Date | null;
  metadata?: any;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  smsAlerts: boolean;
  inAppAlerts: boolean;
  alertThresholds: {
    queueTimeMinutes: number;
    agentUtilizationPercent: number;
    expirationRatePercent: number;
  };
}

// ==================== Report Types ====================

export interface QueueReportParams {
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  startDate: Date;
  endDate: Date;
  includeAgentBreakdown: boolean;
  includeGeographicBreakdown: boolean;
  includeRevenueDetails: boolean;
  format: 'JSON' | 'CSV' | 'PDF';
}

export interface QueueReport {
  reportId: string;
  reportType: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: QueuePerformanceMetrics;
  agentBreakdown?: AgentQueueInfo[];
  geographicBreakdown?: GeographicAnalytics[];
  revenueDetails?: RevenueAnalytics;
  trendData?: QueueTrendData[];
  generatedAt: Date;
  generatedBy: string;
}

// ==================== Export Types ====================

export interface ExportQueueDataRequest {
  filters?: QueueFilterParams;
  format: 'CSV' | 'EXCEL' | 'JSON';
  includeCompletionImages: boolean;
  includeAgentDetails: boolean;
}

export interface ExportQueueDataResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  expiresAt: Date;
}

// ==================== Dispute Resolution Types ====================

export interface DisputeDetails {
  disputeId: string;
  jobId: string;
  raisedByUserId: string;
  raisedByUserRole: 'AGENT' | 'RENTER' | 'OWNER';
  reason: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  raisedAt: Date;
  resolvedAt: Date | null;
  adminReviewerId: string | null;
  resolutionNotes: string | null;
  relatedCommunication: any[]; // e.g., messages, log entries
}

export interface ResolutionActionRequest {
  disputeId: string;
  adminId: string;
  action: 'RESOLVE' | 'REJECT' | 'REASSIGN_JOB' | 'ISSUE_PAYOUT';
  resolutionNotes: string;
  payoutAmount?: number;
  targetAgentId?: string;
}