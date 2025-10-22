// backend/marking-service/src/types/index.ts

// Core marking job types
export * from './markingJob';
export * from './queue';
export * from './assignment';
export * from './completion';

// Additional marking service types
export * from './shareableLink';
export * from './proximity';
export * from './compensation';

// Re-export commonly used types for convenience
export type {
  MarkingJob,
  CreateMarkingJobParams,
  UpdateMarkingJobParams,
  MarkingJobStatus
} from './markingJob';

export type {
  QueueEntry,
  QueueStatus,
  QueuePosition
} from './queue';

export type {
  Assignment,
  AssignmentStatus,
  AssignmentMethod
} from './assignment';

export type {
  CompletionData,
  CompletionStatus,
  CompletionValidation
} from './completion';

export type {
  ShareableLink,
  ShareableLinkStatus,
  ShareableLinkValidation
} from './shareableLink';

export type {
  Coordinates,
  ProximityResult,
  ProximitySearchParams
} from './proximity';

export type {
  CompensationStructure,
  CompensationPayment,
  CompensationPaymentType,
  CompensationPaymentStatus
} from './compensation';





// // backend/marking-service/src/types/index.ts
// // Barrel export file for all marking service types

// // Marking Job Types
// export * from './markingJob';

// // Queue Types
// export * from './queue';

// // Assignment Types
// export * from './assignment';

// // Performance Metrics Types
// export * from './performance';

// // Re-export commonly used types for convenience
// export type {
//   MarkingJobStatus,
//   MarkingJobPriority,
//   MarkingJobDetails,
//   CreateMarkingJobInput,
//   UpdateMarkingJobInput,
//   MarkingJobResponse,
//   MarkingJobListResponse,
// } from './markingJob';

// export type {
//   QueueStatus,
//   QueueEntry,
//   QueuePosition,
//   QueueNotification,
//   AgentQueueResponse,
//   QueueStatusResponse,
// } from './queue';

// export type {
//   AssignmentStatus,
//   JobAssignment,
//   CreateAssignmentInput,
//   AssignmentResponse,
//   AssignmentHistoryResponse,
// } from './assignment';

// export type {
//   AgentPerformanceMetrics,
//   AgentReliabilityFactors,
//   PerformanceThresholds,
//   AgentRanking,
//   GetAgentPerformanceResponse,
//   GetLeaderboardResponse,
// } from './performance';












// // backend/marking-service/src/types/index.ts

// // Re-export all types from individual type files
// export * from './markingJob';
// export * from './queue';
// export * from './assignment';
// export * from './completion';
// export * from './confirmation';
// export * from './timeSlot';

// // Common shared types
// export interface ApiResponse<T = any> {
//   success: boolean;
//   message: string;
//   data?: T;
//   error?: string;
//   timestamp: Date;
// }

// export interface PaginationParams {
//   page: number;
//   limit: number;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
// }

// export interface PaginatedResponse<T> {
//   data: T[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//     hasMore: boolean;
//   };
// }

// export interface LocationData {
//   latitude: number;
//   longitude: number;
//   accuracy?: number;
//   address?: string;
//   city?: string;
//   state?: string;
//   lga?: string;
// }

// export interface NotificationPayload {
//   userId: string;
//   type: string;
//   title: string;
//   message: string;
//   data?: Record<string, any>;
//   channels: ('email' | 'sms' | 'push')[];
// }

// export interface ServiceAreaData {
//   state: string;
//   lgas: string[];
//   cities: string[];
//   radius?: number; // km
// }

// export interface MarkingJobFilters {
//   status?: string[];
//   state?: string;
//   lga?: string;
//   urgencyLevel?: string[];
//   dateFrom?: Date;
//   dateTo?: Date;
//   agentId?: string;
//   ownerId?: string;
// }

// export interface AgentLocationUpdate {
//   agentId: string;
//   latitude: number;
//   longitude: number;
//   accuracy?: number;
//   state?: string;
//   lga?: string;
//   city?: string;
//   updatedAt: Date;
// }

// export interface PaymentSplitData {
//   totalAmount: number;
//   agentAmount: number;
//   platformAmount: number;
//   percentage: number;
//   currency: string;
// }

// export const MARKING_FEE = 20000; // 20,000 naira
// export const AGENT_PERCENTAGE = 0.25; // 25%
// export const PARTIAL_PAYMENT_AMOUNT = 1000; // 1,000 naira
// export const NEWCONDO_ADMIN_MARKING_FEE = 25000; // 25,000 naira

// export const MARKING_JOB_CONSTANTS = {
//   FEE: MARKING_FEE,
//   AGENT_COMMISSION_PERCENTAGE: AGENT_PERCENTAGE,
//   AGENT_COMMISSION_AMOUNT: MARKING_FEE * AGENT_PERCENTAGE,
//   PLATFORM_AMOUNT: MARKING_FEE * (1 - AGENT_PERCENTAGE),
//   PARTIAL_PAYMENT: PARTIAL_PAYMENT_AMOUNT,
//   ADMIN_FEE: NEWCONDO_ADMIN_MARKING_FEE,
//   TIME_SLOT_HOURS: 3,
//   CONFIRMATION_WINDOW_HOURS: 48,
//   MAX_QUEUE_DAYS: 3,
//   MIN_COMPLETION_IMAGES: 4,
//   MAX_COMPLETION_IMAGES: 20,
// };