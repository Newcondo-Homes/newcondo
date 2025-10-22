import { MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@prisma/client';

export interface MarkingJobRequest {
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: UrgencyLevel;
  markingOption: MarkingOption;
  shareableLink?: string; // For "someone I know" option
}

export enum MarkingOption {
  SELF = 'SELF', // Mark it themselves
  NEWCONDO_ADMIN = 'NEWCONDO_ADMIN', // Assign to Newcondo admin
  SOMEONE_I_KNOW = 'SOMEONE_I_KNOW', // Send link to someone they know
  ASSIGN_TO_AGENTS = 'ASSIGN_TO_AGENTS', // Broadcast to agents in proximity
}

export interface MarkingJobResponse {
  id: string;
  propertyId: string;
  requestedBy: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: UrgencyLevel;
  markingFee: number;
  paymentStatus: PaymentStatus;
  status: MarkingJobStatus;
  assignedAgentId?: string;
  assignedAt?: Date;
  completedAt?: Date;
  timeSlotExpiry?: Date;
  queuePosition?: number;
  maxCompletionTime?: Date;
  completionNotes?: string;
  completionImages: string[];
  boundaryData?: BoundaryData;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoundaryData {
  coordinates: GeoCoordinate[];
  center: GeoCoordinate;
  zoom: number;
  mapType: 'satellite' | 'roadmap';
  areaSquareMeters?: number;
}

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface MarkingJobCompletion {
  markingJobId: string;
  boundaryData: BoundaryData;
  completionNotes: string;
  completionImages: string[]; // URLs to uploaded images
}

export interface MarkingJobConfirmation {
  markingJobId: string;
  isApproved: boolean;
  rejectionReason?: string;
  requestNewMarking?: boolean;
}

export interface AgentMarkingProfile {
  userId: string;
  name: string;
  phone: string;
  email: string;
  isAvailableForMarking: boolean;
  agentServiceAreas: string[];
  agentReliabilityScore: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  currentAssignments: number;
  averageCompletionTime: number; // in minutes
  distanceFromProperty?: number; // in kilometers
}

export interface MarkingJobBroadcast {
  markingJobId: string;
  propertyId: string;
  propertyAddress: string;
  propertyCoordinates: GeoCoordinate;
  markingFee: number;
  urgencyLevel: UrgencyLevel;
  preferredTime?: Date;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  expiresAt: Date;
}

export interface MarkingJobAcceptance {
  markingJobId: string;
  agentId: string;
  estimatedArrivalTime?: Date;
}

export interface MarkingJobQueue {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // in minutes
  currentAssignment?: {
    agentId: string;
    agentName: string;
    timeSlotExpiry: Date;
  };
}

export interface MarkingPaymentBreakdown {
  totalFee: number;
  agentCommission: number;
  platformFee: number;
  currency: string;
}

export const MARKING_FEES = {
  PROPERTY_OWNER_FEE: 20000, // 20,000 NGN
  NEWCONDO_ADMIN_FEE: 25000, // 25,000 NGN
  AGENT_COMMISSION_PERCENTAGE: 0.25, // 25% of property owner fee
  INITIAL_PAYMENT_PERCENTAGE: 0.05, // 5% upfront payment (1,000 NGN)
  CURRENCY: 'NGN',
} as const;

export interface MarkingJobFilters {
  status?: MarkingJobStatus[];
  urgencyLevel?: UrgencyLevel[];
  dateFrom?: Date;
  dateTo?: Date;
  propertyId?: string;
  requestedBy?: string;
  assignedAgentId?: string;
  paymentStatus?: PaymentStatus[];
}

export interface MarkingJobStats {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  cancelledJobs: number;
  averageCompletionTime: number;
  totalRevenue: number;
  agentCommissionsPaid: number;
}

export interface MarkingNotification {
  type: MarkingNotificationType;
  markingJobId: string;
  recipientId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
}

export enum MarkingNotificationType {
  JOB_CREATED = 'JOB_CREATED',
  JOB_BROADCAST = 'JOB_BROADCAST',
  JOB_ASSIGNED = 'JOB_ASSIGNED',
  JOB_ACCEPTED = 'JOB_ACCEPTED',
  TIME_SLOT_EXPIRING = 'TIME_SLOT_EXPIRING',
  TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED',
  JOB_COMPLETED = 'JOB_COMPLETED',
  JOB_CONFIRMED = 'JOB_CONFIRMED',
  JOB_REJECTED = 'JOB_REJECTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  COMMISSION_PAID = 'COMMISSION_PAID',
  QUEUE_POSITION_UPDATED = 'QUEUE_POSITION_UPDATED',
}

export interface ShareableLinkMetadata {
  markingJobId: string;
  propertyId: string;
  requestedBy: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  expiresAt: Date;
  usageLimit: number;
  timesUsed: number;
}

export interface MarkingJobTimeSlot {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isExpired: boolean;
  remainingMinutes: number;
}

export interface MarkingJobValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Helper type for marking job creation
export type CreateMarkingJobInput = Omit
  MarkingJobRequest,
  'shareableLink'
> & {
  userId: string;
};

// Helper type for marking job update
export type UpdateMarkingJobInput = Partial<{
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions: string;
  preferredTime: Date;
  urgencyLevel: UrgencyLevel;
  status: MarkingJobStatus;
}>;



// /**
//  * Marking Job Types and Interfaces
//  */

// import { MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@prisma/client';

// // Marking Job Request Types
// export interface CreateMarkingJobRequest {
//   propertyId: string;
//   markerType: MarkerType;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel?: UrgencyLevel;
//   propertyImages?: string[]; // URLs to property images for identification
// }

// export interface AssignMarkingJobRequest {
//   jobId: string;
//   agentId: string;
// }

// export interface CompleteMarkingJobRequest {
//   jobId: string;
//   completionImages: string[]; // URLs to uploaded completion photos
//   boundaryData: BoundaryData;
//   completionNotes?: string;
// }

// export interface ConfirmMarkingJobRequest {
//   jobId: string;
//   isApproved: boolean;
//   rejectionReason?: string;
// }

// export interface ShareableLinkRequest {
//   jobId: string;
//   propertyId: string;
// }

// // Marking Job Response Types
// export interface MarkingJobResponse {
//   id: string;
//   propertyId: string;
//   property: PropertyInfo;
//   requestedBy: string;
//   requestingUser: UserInfo;
//   assignedAgentId?: string;
//   assignedAgent?: AgentInfo;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel: UrgencyLevel;
//   markingFee: number;
//   paymentStatus: PaymentStatus;
//   status: MarkingJobStatus;
//   assignedAt?: Date;
//   completedAt?: Date;
//   timeSlotExpiry?: Date;
//   maxCompletionTime?: Date;
//   completionNotes?: string;
//   completionImages?: string[];
//   boundaryData?: BoundaryData;
//   queuePosition?: number;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface MarkingJobListResponse {
//   jobs: MarkingJobResponse[];
//   total: number;
//   page: number;
//   limit: number;
//   hasMore: boolean;
// }

// export interface MarkingJobStatsResponse {
//   totalJobs: number;
//   queuedJobs: number;
//   assignedJobs: number;
//   completedJobs: number;
//   cancelledJobs: number;
//   averageCompletionTime: number; // in hours
//   totalEarnings: number;
// }

// // Supporting Types
// export enum MarkerType {
//   SELF = 'SELF', // Property owner marks themselves
//   NEWCONDO = 'NEWCONDO', // Newcondo admin marks
//   KNOWN_PERSON = 'KNOWN_PERSON', // Someone the owner knows
//   AGENT = 'AGENT', // Assign to available agents/renters
// }

// export interface PropertyInfo {
//   id: string;
//   title: string;
//   address: string;
//   city: string;
//   state: string;
//   gpsCoordinates?: string;
//   images?: string[];
// }

// export interface UserInfo {
//   id: string;
//   name: string;
//   email: string;
//   phone?: string;
// }

// export interface AgentInfo extends UserInfo {
//   reliabilityScore?: number;
//   totalMarkingJobs: number;
//   completedMarkingJobs: number;
//   isAvailableForMarking: boolean;
// }

// export interface BoundaryData {
//   coordinates: Coordinate[];
//   center?: Coordinate;
//   area?: number; // in square meters
//   markedAt: Date;
// }

// export interface Coordinate {
//   lat: number;
//   lng: number;
// }

// // Marking Job Filters
// export interface MarkingJobFilters {
//   status?: MarkingJobStatus[];
//   urgencyLevel?: UrgencyLevel[];
//   assignedAgentId?: string;
//   requestedBy?: string;
//   propertyId?: string;
//   city?: string;
//   state?: string;
//   dateFrom?: Date;
//   dateTo?: Date;
//   paymentStatus?: PaymentStatus[];
// }

// // Queue Types
// export interface QueueEntry {
//   agentId: string;
//   agent: AgentInfo;
//   position: number;
//   joinedAt: Date;
//   estimatedWaitTime?: number; // in minutes
//   distance?: number; // in kilometers
// }

// export interface QueueInfo {
//   jobId: string;
//   totalInQueue: number;
//   entries: QueueEntry[];
//   currentAgent?: AgentInfo;
//   currentAgentTimeSlotExpiry?: Date;
// }

// // Shareable Link Types
// export interface ShareableLinkData {
//   token: string;
//   jobId: string;
//   propertyId: string;
//   expiresAt: Date;
//   isUsed: boolean;
//   usedBy?: string;
//   usedAt?: Date;
// }

// export interface ShareableLinkResponse {
//   link: string;
//   token: string;
//   expiresAt: Date;
// }

// // Payment Types for Marking
// export interface MarkingPaymentBreakdown {
//   totalFee: number;
//   agentCommission: number;
//   platformFee: number;
//   partialPayment?: number;
//   remainingPayment?: number;
//   currency: string;
// }

// export interface MarkingPaymentRequest {
//   jobId: string;
//   amount: number;
//   paymentMethod: string;
// }

// export interface MarkingPaymentResponse {
//   paymentId: string;
//   amount: number;
//   status: PaymentStatus;
//   paymentLink?: string;
//   reference: string;
// }

// // Confirmation Types
// export interface ConfirmationStatus {
//   jobId: string;
//   isConfirmed: boolean;
//   confirmationDeadline: Date;
//   hoursRemaining: number;
//   partialPaymentReleased: boolean;
//   fullPaymentReleased: boolean;
// }

// // Time Slot Types
// export interface TimeSlotInfo {
//   jobId: string;
//   agentId: string;
//   startTime: Date;
//   expiryTime: Date;
//   remainingTime: number; // in milliseconds
//   isExpired: boolean;
// }

// // Agent Location Types
// export interface AgentLocation {
//   agentId: string;
//   latitude: number;
//   longitude: number;
//   city?: string;
//   state?: string;
//   lastUpdated: Date;
// }

// export interface ProximitySearch {
//   propertyLatitude: number;
//   propertyLongitude: number;
//   maxDistanceKm: number;
//   minReliabilityScore?: number;
// }

// export interface AgentProximityResult {
//   agent: AgentInfo;
//   distance: number; // in kilometers
//   estimatedTravelTime?: number; // in minutes
//   location: AgentLocation;
// }

// // Completion Validation Types
// export interface CompletionValidation {
//   isValid: boolean;
//   errors: string[];
//   warnings: string[];
// }

// export interface ImageValidation {
//   url: string;
//   isValid: boolean;
//   error?: string;
//   metadata?: {
//     width?: number;
//     height?: number;
//     size?: number;
//     format?: string;
//   };
// }

// // Marking Job Events
// export enum MarkingJobEvent {
//   JOB_CREATED = 'JOB_CREATED',
//   JOB_ASSIGNED = 'JOB_ASSIGNED',
//   JOB_STARTED = 'JOB_STARTED',
//   JOB_COMPLETED = 'JOB_COMPLETED',
//   JOB_CONFIRMED = 'JOB_CONFIRMED',
//   JOB_REJECTED = 'JOB_REJECTED',
//   JOB_CANCELLED = 'JOB_CANCELLED',
//   TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED',
//   CONFIRMATION_DEADLINE_PASSED = 'CONFIRMATION_DEADLINE_PASSED',
//   PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
//   PARTIAL_PAYMENT_RELEASED = 'PARTIAL_PAYMENT_RELEASED',
//   FULL_PAYMENT_RELEASED = 'FULL_PAYMENT_RELEASED',
//   AGENT_JOINED_QUEUE = 'AGENT_JOINED_QUEUE',
//   AGENT_LEFT_QUEUE = 'AGENT_LEFT_QUEUE',
//   QUEUE_POSITION_CHANGED = 'QUEUE_POSITION_CHANGED',
// }

// export interface MarkingJobEventData {
//   event: MarkingJobEvent;
//   jobId: string;
//   timestamp: Date;
//   metadata?: Record<string, any>;
// }

// // Webhook Types
// export interface MarkingJobWebhook {
//   event: MarkingJobEvent;
//   jobId: string;
//   job: MarkingJobResponse;
//   timestamp: Date;
// }

// // Error Types
// export interface MarkingJobError {
//   code: string;
//   message: string;
//   details?: Record<string, any>;
// }

// export enum MarkingJobErrorCode {
//   JOB_NOT_FOUND = 'JOB_NOT_FOUND',
//   JOB_ALREADY_ASSIGNED = 'JOB_ALREADY_ASSIGNED',
//   JOB_ALREADY_COMPLETED = 'JOB_ALREADY_COMPLETED',
//   AGENT_NOT_AVAILABLE = 'AGENT_NOT_AVAILABLE',
//   TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED',
//   INVALID_COMPLETION_DATA = 'INVALID_COMPLETION_DATA',
//   PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
//   PAYMENT_FAILED = 'PAYMENT_FAILED',
//   UNAUTHORIZED = 'UNAUTHORIZED',
//   VALIDATION_ERROR = 'VALIDATION_ERROR',
//   QUEUE_FULL = 'QUEUE_FULL',
//   ALREADY_IN_QUEUE = 'ALREADY_IN_QUEUE',
//   NOT_IN_QUEUE = 'NOT_IN_QUEUE',
//   CONFIRMATION_DEADLINE_PASSED = 'CONFIRMATION_DEADLINE_PASSED',
//   SHAREABLE_LINK_EXPIRED = 'SHAREABLE_LINK_EXPIRED',
//   SHAREABLE_LINK_ALREADY_USED = 'SHAREABLE_LINK_ALREADY_USED',
// }

// // Admin Types
// export interface AdminMarkingJobFilters extends MarkingJobFilters {
//   includeDeleted?: boolean;
//   sortBy?: 'createdAt' | 'updatedAt' | 'urgencyLevel' | 'status';
//   sortOrder?: 'asc' | 'desc';
// }

// export interface AdminMarkingJobStats {
//   overview: {
//     totalJobs: number;
//     activeJobs: number;
//     completedJobs: number;
//     cancelledJobs: number;
//   };
//   financial: {
//     totalRevenue: number;
//     agentPayouts: number;
//     platformEarnings: number;
//     pendingPayments: number;
//   };
//   performance: {
//     averageCompletionTime: number;
//     averageConfirmationTime: number;
//     completionRate: number;
//     cancellationRate: number;
//   };
//   agents: {
//     totalActiveAgents: number;
//     averageJobsPerAgent: number;
//     topPerformingAgents: AgentPerformance[];
//   };
// }

// export interface AgentPerformance {
//   agent: AgentInfo;
//   completedJobs: number;
//   totalEarnings: number;
//   averageCompletionTime: number;
//   reliabilityScore: number;
//   cancellationRate: number;
// }

// // Bulk Operations
// export interface BulkMarkingJobAction {
//   jobIds: string[];
//   action: 'cancel' | 'reassign' | 'complete';
//   reason?: string;
//   newAgentId?: string; // for reassign action
// }

// export interface BulkMarkingJobResult {
//   success: number;
//   failed: number;
//   errors: Array<{
//     jobId: string;
//     error: string;
//   }>;
// }

// // Export all types
// export type {
//   CreateMarkingJobRequest,
//   AssignMarkingJobRequest,
//   CompleteMarkingJobRequest,
//   ConfirmMarkingJobRequest,
//   ShareableLinkRequest,
//   MarkingJobResponse,
//   MarkingJobListResponse,
//   MarkingJobStatsResponse,
//   PropertyInfo,
//   UserInfo,
//   AgentInfo,
//   BoundaryData,
//   Coordinate,
//   MarkingJobFilters,
//   QueueEntry,
//   QueueInfo,
//   ShareableLinkData,
//   ShareableLinkResponse,
//   MarkingPaymentBreakdown,
//   MarkingPaymentRequest,
//   MarkingPaymentResponse,
//   ConfirmationStatus,
//   TimeSlotInfo,
//   AgentLocation,
//   ProximitySearch,
//   AgentProximityResult,
//   CompletionValidation,
//   ImageValidation,
//   MarkingJobEventData,
//   MarkingJobWebhook,
//   MarkingJobError,
//   AdminMarkingJobFilters,
//   AdminMarkingJobStats,
//   AgentPerformance,
//   BulkMarkingJobAction,
//   BulkMarkingJobResult,
// };