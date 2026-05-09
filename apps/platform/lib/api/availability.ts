import client from './client';


interface HistoryEntry {
  timestamp: string;
  isAvailable: boolean;
  reason?: string;
  changedBy?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface AvailabilityStatus {
  propertyId: string;
  unitId?: string;
  isAvailable: boolean;
  reason?: string;
  availableFrom?: string;
  lastChecked: string;
}

export interface AvailabilityUpdate {
  propertyId: string;
  unitId?: string;
  isAvailable: boolean;
  availableFrom?: string;
  reason?: string;
}

export interface BulkAvailabilityCheck {
  properties: Array<{
    propertyId: string;
    unitId?: string;
  }>;
}

export interface AvailabilitySubscription {
  propertyId: string;
  unitId?: string;
  userId: string;
  notifyOnAvailable: boolean;
}

/**
 * Check real-time availability for a property or unit
 */
export async function checkAvailability(
  propertyId: string,
  unitId?: string
): Promise<AvailabilityStatus> {
  try {
    const params = new URLSearchParams({ propertyId });
    if (unitId) params.append('unitId', unitId);

    const response = await client.get<AvailabilityStatus>(
      `/api/availability/check?${params.toString()}`
    );
    return response.data as AvailabilityStatus;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to ...');
  }
}

/**
 * Bulk check availability for multiple properties
 */
export async function bulkCheckAvailability(
  data: BulkAvailabilityCheck
): Promise<AvailabilityStatus[]> {
  try {
    const response = await client.post<{ statuses: AvailabilityStatus[] }>(
      '/api/availability/bulk-check',
      data
    );
    return response.data?.statuses as AvailabilityStatus[];
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to ...');
  }
}

/**
 * Update property availability (owner/agent only)
 */
export async function updateAvailability(
  data: AvailabilityUpdate
): Promise<{
  success: boolean;
  availability?: AvailabilityStatus;
  message?: string;
}> {
  try {
    const response = await client.post('/api/availability/update', data);
    return response.data as {
      success: boolean;
      availability?: AvailabilityStatus;
      message?: string;
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to ...');
  }
}

/**
 * Mark property as unavailable after successful payment
 */
export async function markAsUnavailable(
  propertyId: string,
  unitId?: string,
  reason?: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await client.post('/api/availability/mark-unavailable', {
      propertyId,
      unitId,
      reason: reason || 'Property rented',
    });
    return response.data as {
      success: boolean;
      message?: string;
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to ...');
  }
}

/**
 * Auto-delist property after successful payment
 */
export async function autoDelistProperty(
  propertyId: string,
  unitId?: string,
  paymentId?: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await client.post('/api/availability/auto-delist', {
      propertyId,
      unitId,
      paymentId,
    });
    return response.data as {
      success: boolean;
      message?: string;
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to ...');
  }
}

/**
 * Restore property availability (admin/owner only)
 */
export async function restoreAvailability(
  propertyId: string,
  unitId?: string,
  reason?: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await client.post('/api/availability/restore', {
      propertyId,
      unitId,
      reason,
    });
    return response.data as {
      success: boolean;
      message?: string;
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to ...');
  }
}

/**
 * Subscribe to availability updates
 */
export async function subscribeToAvailability(
  data: AvailabilitySubscription
): Promise<{
  success: boolean;
  subscriptionId?: string;
  message?: string;
}> {
  try {
    const response = await client.post('/api/availability/subscribe', data);
    return response.data as {
      success: boolean;
      subscriptionId?: string;
      message?: string;
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to ...');
  }
}

/**
 * Unsubscribe from availability updates
 */
export async function unsubscribeFromAvailability(
  subscriptionId: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await client.delete(
      `/api/availability/subscribe/${subscriptionId}`
    );
    return response.data as {
      success: boolean;
      message?: string;
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to ...');
  }
}

/**
 * Get availability history for a property
 */
export async function getAvailabilityHistory(
  propertyId: string,
  unitId?: string,
  limit: number = 50
): Promise<
  Array<{
    timestamp: string;
    isAvailable: boolean;
    reason?: string;
    changedBy?: string;
  }>
> {
  try {
    const params = new URLSearchParams({ propertyId, limit: limit.toString() });
    if (unitId) params.append('unitId', unitId);

    const response = await client.get<{ history: HistoryEntry[] }>(
      `/api/availability/history?${params.toString()}`
    );
    return response.data?.history ?? [];
  } catch (error: unknown) {
    // fix line 262: replaced catch (error: any) with typed ApiError pattern
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to fetch availability history'
    );
  }
}

/**
 * Get properties becoming available soon
 */
export async function getUpcomingAvailability(
  days: number = 30
): Promise<AvailabilityStatus[]> {
  try {
    const response = await client.get<{ properties: AvailabilityStatus[] }>(
      `/api/availability/upcoming?days=${days}`
    );
    return response.data?.properties as AvailabilityStatus[];
  } catch (error: unknown) {
    // fix line 280: replaced catch (error: any) with typed ApiError pattern
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to fetch upcoming availability'
    );
  }
}