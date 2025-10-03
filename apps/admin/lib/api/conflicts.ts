// apps/admin/src/lib/api/conflicts.ts
import { apiClient } from './client';

export interface BookingConflict {
  id: string;
  propertyId: string;
  unitId?: string;
  conflictType: ConflictType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DETECTED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  
  // Conflicting bookings/payments
  involvedPayments: string[];
  involvedUsers: string[];
  
  // Detection details
  detectedAt: Date;
  detectionMethod: 'AUTOMATIC' | 'MANUAL_REPORT' | 'SYSTEM_AUDIT';
  
  // Conflict details
  description: string;
  metadata: ConflictMetadata;
  
  // Resolution
  resolution?: {
    resolvedBy: string;
    resolvedAt: Date;
    resolutionType: ResolutionType;
    notes: string;
    actionsTaken: string[];
  };
}

export type ConflictType = 
  | 'DOUBLE_BOOKING'
  | 'SIMULTANEOUS_PAYMENT'
  | 'LOCK_TIMEOUT_RACE'
  | 'STALE_LOCK'
  | 'BOUNDARY_OVERLAP'
  | 'DUPLICATE_PROPERTY'
  | 'PAYMENT_WITHOUT_LOCK'
  | 'EXPIRED_LOCK_PAYMENT';

export type ResolutionType =
  | 'REFUND_ISSUED'
  | 'LOCK_RELEASED'
  | 'BOOKING_CANCELLED'
  | 'PROPERTY_DELISTED'
  | 'BOUNDARY_ADJUSTED'
  | 'DUPLICATE_MERGED'
  | 'FALSE_POSITIVE';

export interface ConflictMetadata {
  lockIds?: string[];
  paymentIds?: string[];
  rentalIds?: string[];
  timestamps?: Date[];
  boundaryOverlap?: number;
  duplicateScore?: number;
  userIpAddresses?: string[];
  [key: string]: any;
}

export interface ConflictStatistics {
  totalConflicts: number;
  activeConflicts: number;
  resolvedConflicts: number;
  conflictsByType: Record<ConflictType, number>;
  conflictsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  conflictTrend: {
    date: string;
    count: number;
  }[];
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflicts: BookingConflict[];
  warnings: string[];
  recommendations: string[];
}

export interface ResolveConflictRequest {
  conflictId: string;
  resolutionType: ResolutionType;
  notes: string;
  actionsTaken: string[];
  adminId: string;
  notifyUsers?: boolean;
}

/**
 * Get all booking conflicts
 */
export async function getConflicts(params?: {
  page?: number;
  limit?: number;
  status?: BookingConflict['status'];
  conflictType?: ConflictType;
  severity?: BookingConflict['severity'];
  propertyId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  conflicts: BookingConflict[];
  total: number;
  page: number;
  limit: number;
}> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);
  if (params?.conflictType) queryParams.set('conflictType', params.conflictType);
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.propertyId) queryParams.set('propertyId', params.propertyId);
  if (params?.startDate) queryParams.set('startDate', params.startDate.toISOString());
  if (params?.endDate) queryParams.set('endDate', params.endDate.toISOString());

  const response = await apiClient.get(`/admin/conflicts?${queryParams.toString()}`);
  return response.data;
}

/**
 * Get a specific conflict by ID
 */
export async function getConflictById(conflictId: string): Promise<BookingConflict> {
  const response = await apiClient.get(`/admin/conflicts/${conflictId}`);
  return response.data;
}

/**
 * Detect conflicts for a specific property
 */
export async function detectPropertyConflicts(
  propertyId: string,
  unitId?: string
): Promise<ConflictDetectionResult> {
  const url = unitId 
    ? `/admin/conflicts/detect/${propertyId}/unit/${unitId}`
    : `/admin/conflicts/detect/${propertyId}`;
  
  const response = await apiClient.post(url);
  return response.data;
}

/**
 * Run system-wide conflict detection audit
 */
export async function runConflictAudit(options?: {
  propertyIds?: string[];
  checkTypes?: ConflictType[];
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  auditId: string;
  conflictsFound: number;
  conflicts: BookingConflict[];
  warnings: string[];
  completedAt: Date;
}> {
  const response = await apiClient.post('/admin/conflicts/audit', options);
  return response.data;
}

/**
 * Resolve a conflict
 */
export async function resolveConflict(
  data: ResolveConflictRequest
): Promise<BookingConflict> {
  const response = await apiClient.post('/admin/conflicts/resolve', data);
  return response.data;
}

/**
 * Dismiss a conflict (mark as false positive)
 */
export async function dismissConflict(
  conflictId: string,
  reason: string,
  adminId: string
): Promise<BookingConflict> {
  const response = await apiClient.post(`/admin/conflicts/${conflictId}/dismiss`, {
    reason,
    adminId,
  });
  return response.data;
}

/**
 * Update conflict status
 */
export async function updateConflictStatus(
  conflictId: string,
  status: BookingConflict['status'],
  notes?: string
): Promise<BookingConflict> {
  const response = await apiClient.patch(`/admin/conflicts/${conflictId}/status`, {
    status,
    notes,
  });
  return response.data;
}

/**
 * Get conflict statistics
 */
export async function getConflictStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<ConflictStatistics> {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('startDate', startDate.toISOString());
  if (endDate) queryParams.set('endDate', endDate.toISOString());

  const response = await apiClient.get(`/admin/conflicts/statistics?${queryParams.toString()}`);
  return response.data;
}

/**
 * Get conflicts by property
 */
export async function getConflictsByProperty(
  propertyId: string,
  includeResolved?: boolean
): Promise<BookingConflict[]> {
  const queryParams = new URLSearchParams();
  if (includeResolved !== undefined) {
    queryParams.set('includeResolved', includeResolved.toString());
  }

  const response = await apiClient.get(
    `/admin/conflicts/property/${propertyId}?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Get conflicts by user
 */
export async function getConflictsByUser(userId: string): Promise<BookingConflict[]> {
  const response = await apiClient.get(`/admin/conflicts/user/${userId}`);
  return response.data;
}

/**
 * Check for simultaneous payment attempts
 */
export async function checkSimultaneousPayments(
  propertyId: string,
  timeWindowMinutes: number = 5
): Promise<{
  hasSimultaneousAttempts: boolean;
  attempts: Array<{
    paymentId: string;
    userId: string;
    attemptedAt: Date;
    status: string;
  }>;
  conflict?: BookingConflict;
}> {
  const response = await apiClient.get(
    `/admin/conflicts/simultaneous-payments/${propertyId}?timeWindow=${timeWindowMinutes}`
  );
  return response.data;
}

/**
 * Get conflicts requiring immediate attention
 */
export async function getCriticalConflicts(): Promise<BookingConflict[]> {
  const response = await apiClient.get('/admin/conflicts/critical');
  return response.data;
}

/**
 * Bulk resolve conflicts
 */
export async function bulkResolveConflicts(
  conflictIds: string[],
  resolutionType: ResolutionType,
  notes: string,
  adminId: string
): Promise<{
  successCount: number;
  failureCount: number;
  results: Array<{
    conflictId: string;
    success: boolean;
    conflict?: BookingConflict;
    error?: string;
  }>;
}> {
  const response = await apiClient.post('/admin/conflicts/bulk-resolve', {
    conflictIds,
    resolutionType,
    notes,
    adminId,
  });
  return response.data;
}

/**
 * Get conflict resolution history
 */
export async function getConflictResolutionHistory(
  options?: {
    page?: number;
    limit?: number;
    adminId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  resolutions: BookingConflict[];
  total: number;
  page: number;
  limit: number;
}> {
  const queryParams = new URLSearchParams();
  if (options?.page) queryParams.set('page', options.page.toString());
  if (options?.limit) queryParams.set('limit', options.limit.toString());
  if (options?.adminId) queryParams.set('adminId', options.adminId);
  if (options?.startDate) queryParams.set('startDate', options.startDate.toISOString());
  if (options?.endDate) queryParams.set('endDate', options.endDate.toISOString());

  const response = await apiClient.get(
    `/admin/conflicts/resolution-history?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Validate property availability before payment
 */
export async function validatePropertyAvailability(
  propertyId: string,
  unitId?: string,
  userId?: string
): Promise<{
  isAvailable: boolean;
  conflicts: BookingConflict[];
  locks: any[];
  warnings: string[];
  canProceed: boolean;
}> {
  const response = await apiClient.post('/admin/conflicts/validate-availability', {
    propertyId,
    unitId,
    userId,
  });
  return response.data;
}