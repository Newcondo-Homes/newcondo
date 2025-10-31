// apps/admin/src/store/index.ts

// Export all stores
export { useVerificationStore } from './verificationStore';
export { usePropertyStore } from './propertyStore';
export { useDisputeStore } from './disputeStore';
export { useMarkingJobStore } from './markingJobStore';
export { usePaymentStore } from './paymentStore';
export { useSupportStore } from './supportStore';
export { useAnalyticsStore } from './analyticsStore';

// Export types for convenience
export type {
  VerificationState,
  VerificationFilters,
} from './verificationStore';

export type {
  PropertyState,
  PropertyFilters,
} from './propertyStore';

export type {
  DisputeState,
  DisputeFilters,
} from './disputeStore';

export type {
  MarkingJobState,
  MarkingJobFilters,
} from './markingJobStore';

export type {
  PaymentState,
  PaymentFilters,
} from './paymentStore';

export type {
  SupportState,
  SupportFilters,
} from './supportStore';

export type {
  AnalyticsState,
  AnalyticsFilters,
} from './analyticsStore';