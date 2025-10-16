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