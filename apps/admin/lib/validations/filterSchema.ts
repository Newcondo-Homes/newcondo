// apps/admin/src/lib/validations/filterSchema.ts

import { z } from 'zod';

/**
 * Base filter operator enum
 */
export const filterOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'between',
  'in',
  'not_in',
  'is_null',
  'is_not_null',
]);

/**
 * Filter condition schema
 */
export const filterConditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: filterOperatorEnum,
  value: z.any().optional(),
  values: z.array(z.any()).optional(),
}).refine(
  (data) => {
    // Operators that require value
    const requiresValue = [
      'equals', 'not_equals', 'contains', 'not_contains',
      'starts_with', 'ends_with', 'greater_than', 'less_than',
      'greater_than_or_equal', 'less_than_or_equal',
    ];
    
    // Operators that require values array
    const requiresValues = ['in', 'not_in', 'between'];
    
    // Operators that don't require value
    const noValue = ['is_null', 'is_not_null'];
    
    if (requiresValue.includes(data.operator)) {
      return data.value !== undefined;
    }
    
    if (requiresValues.includes(data.operator)) {
      return Array.isArray(data.values) && data.values.length > 0;
    }
    
    if (noValue.includes(data.operator)) {
      return true;
    }
    
    return false;
  },
  {
    message: 'Invalid value for the selected operator',
  }
);

/**
 * Filter group schema (AND/OR logic)
 */
export const filterGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    logic: z.enum(['AND', 'OR']).default('AND'),
    conditions: z.array(
      z.union([filterConditionSchema, filterGroupSchema])
    ).min(1, 'At least one condition is required'),
  })
);

/**
 * User filter schema
 */
export const userFilterSchema = z.object({
  role: z.enum(['OWNER', 'AGENT', 'RENTER', 'ADMIN']).optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  isPremium: z.boolean().optional(),
  isAvailableForMarking: z.boolean().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  registeredAfter: z.coerce.date().optional(),
  registeredBefore: z.coerce.date().optional(),
  minReliabilityScore: z.number().min(0).max(5).optional(),
  maxReliabilityScore: z.number().min(0).max(5).optional(),
  searchTerm: z.string().optional(),
});

/**
 * Property filter schema
 */
export const propertyFilterSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'RENTED', 'UNAVAILABLE']).optional(),
  adminApprovalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE']).optional(),
  structure: z.enum(['SINGLE_UNIT', 'MULTI_FAMILY']).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minBedrooms: z.number().min(0).optional(),
  maxBedrooms: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  boundaryVerified: z.boolean().optional(),
  hasAgent: z.boolean().optional(),
  listedAfter: z.coerce.date().optional(),
  listedBefore: z.coerce.date().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Payment filter schema
 */
export const paymentFilterSchema = z.object({
  paymentType: z.enum(['RENT', 'DEPOSIT', 'AGENT_COMMISSION', 'PREMIUM_UPGRADE', 'PROPERTY_MARKING']).optional(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'HELD', 'RELEASED']).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  userId: z.string().optional(),
  propertyId: z.string().optional(),
  paidAfter: z.coerce.date().optional(),
  paidBefore: z.coerce.date().optional(),
  isReleased: z.boolean().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Marking job filter schema
 */
export const markingJobFilterSchema = z.object({
  status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
  paymentStatus: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedAgentId: z.string().optional(),
  requestedById: z.string().optional(),
  propertyId: z.string().optional(),
  requestedAfter: z.coerce.date().optional(),
  requestedBefore: z.coerce.date().optional(),
  completedAfter: z.coerce.date().optional(),
  completedBefore: z.coerce.date().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Transaction filter schema
 */
export const transactionFilterSchema = z.object({
  type: z.enum(['RENT', 'DEPOSIT', 'AGENT_COMMISSION', 'PREMIUM_UPGRADE', 'PROPERTY_MARKING']).optional(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'HELD', 'RELEASED']).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  userId: z.string().optional(),
  flutterwaveRef: z.string().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Agent performance filter schema
 */
export const agentPerformanceFilterSchema = z.object({
  minPerformanceScore: z.number().min(0).max(100).optional(),
  maxPerformanceScore: z.number().min(0).max(100).optional(),
  minCompletedJobs: z.number().min(0).optional(),
  minReliabilityScore: z.number().min(0).max(5).optional(),
  isAvailableForMarking: z.boolean().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  hasActiveListings: z.boolean().optional(),
  joinedAfter: z.coerce.date().optional(),
  joinedBefore: z.coerce.date().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Verification filter schema
 */
export const verificationFilterSchema = z.object({
  documentType: z.enum(['NIN', 'BVN', 'PASSPORT', 'VOTERS_CARD', 'DRIVERS_LICENSE', 'SELFIE', 'OWNERSHIP_DOCUMENT', 'CONSENT_DOCUMENT', 'UNDERTAKING_DOCUMENT']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  userId: z.string().optional(),
  propertyId: z.string().optional(),
  uploadedAfter: z.coerce.date().optional(),
  uploadedBefore: z.coerce.date().optional(),
  verifiedAfter: z.coerce.date().optional(),
  verifiedBefore: z.coerce.date().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Support ticket filter schema
 */
export const supportTicketFilterSchema = z.object({
  category: z.enum(['TECHNICAL', 'BILLING', 'PROPERTY', 'VERIFICATION', 'GENERAL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  userId: z.string().optional(),
  assignedTo: z.string().optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  resolvedAfter: z.coerce.date().optional(),
  resolvedBefore: z.coerce.date().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Date range filter schema
 */
export const dateRangeFilterSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

/**
 * Advanced filter schema (combines multiple filter types)
 */
export const advancedFilterSchema = z.object({
  userFilters: userFilterSchema.optional(),
  propertyFilters: propertyFilterSchema.optional(),
  paymentFilters: paymentFilterSchema.optional(),
  markingJobFilters: markingJobFilterSchema.optional(),
  transactionFilters: transactionFilterSchema.optional(),
  agentPerformanceFilters: agentPerformanceFilterSchema.optional(),
  verificationFilters: verificationFilterSchema.optional(),
  supportTicketFilters: supportTicketFilterSchema.optional(),
  customConditions: filterGroupSchema.optional(),
});

/**
 * Saved filter schema
 */
export const savedFilterSchema = z.object({
  name: z.string().min(1, 'Filter name is required').max(100),
  description: z.string().max(500).optional(),
  filterType: z.enum([
    'user', 'property', 'payment', 'marking_job', 
    'transaction', 'agent_performance', 'verification', 
    'support_ticket', 'advanced'
  ]),
  filterConfig: advancedFilterSchema,
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

/**
 * Filter preset schema
 */
export const filterPresetSchema = z.object({
  presetName: z.enum([
    'pending_verifications',
    'high_value_properties',
    'active_agents',
    'failed_payments',
    'recent_signups',
    'top_performers',
    'expired_listings',
    'urgent_tickets',
  ]),
  customization: z.record(z.any()).optional(),
});

/**
 * Bulk filter operation schema
 */
export const bulkFilterOperationSchema = z.object({
  filters: advancedFilterSchema,
  action: z.enum(['export', 'update', 'delete', 'notify']),
  actionConfig: z.record(z.any()).optional(),
  confirmRequired: z.boolean().default(true),
});

/**
 * Type exports
 */
export type FilterOperator = z.infer<typeof filterOperatorEnum>;
export type FilterCondition = z.infer<typeof filterConditionSchema>;
export type FilterGroup = z.infer<typeof filterGroupSchema>;
export type UserFilter = z.infer<typeof userFilterSchema>;
export type PropertyFilter = z.infer<typeof propertyFilterSchema>;
export type PaymentFilter = z.infer<typeof paymentFilterSchema>;
export type MarkingJobFilter = z.infer<typeof markingJobFilterSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
export type AgentPerformanceFilter = z.infer<typeof agentPerformanceFilterSchema>;
export type VerificationFilter = z.infer<typeof verificationFilterSchema>;
export type SupportTicketFilter = z.infer<typeof supportTicketFilterSchema>;
export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>;
export type AdvancedFilter = z.infer<typeof advancedFilterSchema>;
export type SavedFilter = z.infer<typeof savedFilterSchema>;
export type FilterPreset = z.infer<typeof filterPresetSchema>;
export type BulkFilterOperation = z.infer<typeof bulkFilterOperationSchema>;