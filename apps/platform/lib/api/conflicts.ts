import { apiClient } from './client';

// Types for conflict detection
export interface BookingConflict {
  id: string;
  propertyId: string;
  unitId?: string;
  conflictType: 'SIMULTANEOUS_PAYMENT' | 'OVERLAPPING_RENTAL' | 'PAYMENT_LOCKED' | 'ALREADY_RENTED';
  conflictingUserId?: string;
  conflictingRentalId?: string;
  detectedAt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metadata?: Record<string, any>;
}

export interface ConflictCheckRequest {
  propertyId: string;
  unitId?: string;
  userId: string;
  startDate: string;
  endDate?: string;
}

export interface ConflictCheckResponse {
  hasConflict: boolean;
  conflicts: BookingConflict[];
  canProceed: boolean;
  warnings: string[];
  recommendations?: string[];
}

export interface ConflictResolutionRequest {
  conflictId: string;
  resolutionAction: 'CANCEL_FIRST' | 'CANCEL_SECOND' | 'MERGE' | 'IGNORE';
  reason: string;
}

export interface ConflictHistoryParams {
  propertyId?: string;
  unitId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  conflictType?: BookingConflict['conflictType'];
  page?: number;
  limit?: number;
}

export interface ConflictHistoryResponse {
  conflicts: BookingConflict[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PropertyConflictStats {
  propertyId: string;
  unitId?: string;
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  conflictsByType: Record<string, number>;
  lastConflictAt?: string;
  averageResolutionTime?: number; // in minutes
}

/**
 * Check for booking conflicts before payment
 */
export const checkBookingConflicts = async (
  request: ConflictCheckRequest
): Promise<ConflictCheckResponse> => {
  const response = await apiClient.post<ConflictCheckResponse>(
    '/api/conflicts/check',
    request
  );
  return response.data;
};

/**
 * Check real-time property availability and conflicts
 */
export const checkPropertyAvailability = async (
  propertyId: string,
  unitId?: string
): Promise<ConflictCheckResponse> => {
  const params = new URLSearchParams({ propertyId });
  if (unitId) params.append('unitId', unitId);

  const response = await apiClient.get<ConflictCheckResponse>(
    `/api/conflicts/availability?${params.toString()}`
  );
  return response.data;
};

/**
 * Detect simultaneous payment attempts
 */
export const detectSimultaneousPayments = async (
  propertyId: string,
  unitId?: string
): Promise<{
  hasSimultaneousAttempts: boolean;
  activeAttempts: number;
  attemptDetails: Array<{
    userId: string;
    attemptedAt: string;
    lockStatus: 'ACQUIRED' | 'WAITING' | 'TIMEOUT';
  }>;
}> => {
  const params = new URLSearchParams({ propertyId });
  if (unitId) params.append('unitId', unitId);

  const response = await apiClient.get(
    `/api/conflicts/simultaneous-payments?${params.toString()}`
  );
  return response.data;
};

/**
 * Get conflict history for a property or user
 */
export const getConflictHistory = async (
  params: ConflictHistoryParams
): Promise<ConflictHistoryResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.propertyId) searchParams.append('propertyId', params.propertyId);
  if (params.unitId) searchParams.append('unitId', params.unitId);
  if (params.userId) searchParams.append('userId', params.userId);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  if (params.conflictType) searchParams.append('conflictType', params.conflictType);
  searchParams.append('page', (params.page || 1).toString());
  searchParams.append('limit', (params.limit || 20).toString());

  const response = await apiClient.get<ConflictHistoryResponse>(
    `/api/conflicts/history?${searchParams.toString()}`
  );
  return response.data;
};

/**
 * Get conflict statistics for a property
 */
export const getPropertyConflictStats = async (
  propertyId: string,
  unitId?: string
): Promise<PropertyConflictStats> => {
  const params = new URLSearchParams({ propertyId });
  if (unitId) params.append('unitId', unitId);

  const response = await apiClient.get<PropertyConflictStats>(
    `/api/conflicts/stats?${params.toString()}`
  );
  return response.data;
};

/**
 * Report a detected conflict
 */
export const reportConflict = async (
  conflict: Omit<BookingConflict, 'id' | 'detectedAt'>
): Promise<BookingConflict> => {
  const response = await apiClient.post<BookingConflict>(
    '/api/conflicts/report',
    conflict
  );
  return response.data;
};

/**
 * Resolve a conflict (admin/system use)
 */
export const resolveConflict = async (
  request: ConflictResolutionRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(
    '/api/conflicts/resolve',
    request
  );
  return response.data;
};

/**
 * Check for boundary-based duplicate conflicts
 */
export const checkBoundaryConflicts = async (
  propertyId: string,
  boundaryCoordinates: any
): Promise<{
  hasDuplicates: boolean;
  potentialDuplicates: Array<{
    propertyId: string;
    similarity: number;
    boundaryOverlap: number;
    distanceMeters: number;
  }>;
  warnings: string[];
}> => {
  const response = await apiClient.post('/api/conflicts/boundary-check', {
    propertyId,
    boundaryCoordinates,
  });
  return response.data;
};

/**
 * Validate rental period for conflicts
 */
export const validateRentalPeriod = async (
  propertyId: string,
  unitId: string | undefined,
  startDate: string,
  endDate: string
): Promise<{
  isValid: boolean;
  conflicts: BookingConflict[];
  suggestedDates?: {
    earliestAvailable: string;
    nextAvailable: string;
  };
}> => {
  const response = await apiClient.post('/api/conflicts/validate-period', {
    propertyId,
    unitId,
    startDate,
    endDate,
  });
  return response.data;
};

/**
 * Get active payment locks for a property
 */
export const getActivePaymentLocks = async (
  propertyId: string,
  unitId?: string
): Promise<{
  isLocked: boolean;
  lockDetails?: {
    lockedBy: string;
    lockedAt: string;
    expiresAt: string;
    remainingSeconds: number;
  };
  queuePosition?: number;
}> => {
  const params = new URLSearchParams({ propertyId });
  if (unitId) params.append('unitId', unitId);

  const response = await apiClient.get(
    `/api/conflicts/payment-locks?${params.toString()}`
  );
  return response.data;
};

/**
 * Subscribe to real-time conflict updates (WebSocket/SSE)
 */
export const subscribeToConflictUpdates = (
  propertyId: string,
  unitId: string | undefined,
  onUpdate: (conflict: BookingConflict) => void
): (() => void) => {
  const params = new URLSearchParams({ propertyId });
  if (unitId) params.append('unitId', unitId);

  const eventSource = new EventSource(
    `/api/conflicts/subscribe?${params.toString()}`
  );

  eventSource.onmessage = (event) => {
    const conflict = JSON.parse(event.data) as BookingConflict;
    onUpdate(conflict);
  };

  eventSource.onerror = (error) => {
    console.error('Conflict subscription error:', error);
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
};

/**
 * Bulk check conflicts for multiple properties
 */
export const bulkCheckConflicts = async (
  requests: ConflictCheckRequest[]
): Promise<Map<string, ConflictCheckResponse>> => {
  const response = await apiClient.post<Record<string, ConflictCheckResponse>>(
    '/api/conflicts/bulk-check',
    { requests }
  );
  
  return new Map(Object.entries(response.data));
};

/**
 * Get conflict resolution recommendations
 */
export const getConflictRecommendations = async (
  conflictId: string
): Promise<{
  recommendations: Array<{
    action: ConflictResolutionRequest['resolutionAction'];
    description: string;
    priority: number;
    pros: string[];
    cons: string[];
  }>;
  autoResolvable: boolean;
}> => {
  const response = await apiClient.get(
    `/api/conflicts/${conflictId}/recommendations`
  );
  return response.data;
};

export default {
  checkBookingConflicts,
  checkPropertyAvailability,
  detectSimultaneousPayments,
  getConflictHistory,
  getPropertyConflictStats,
  reportConflict,
  resolveConflict,
  checkBoundaryConflicts,
  validateRentalPeriod,
  getActivePaymentLocks,
  subscribeToConflictUpdates,
  bulkCheckConflicts,
  getConflictRecommendations,
};