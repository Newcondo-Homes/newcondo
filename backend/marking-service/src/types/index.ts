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