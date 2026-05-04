import client from './client';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface PropertyLock {
  propertyId: string;
  unitId?: string;
  userId: string;
  expiresAt: string;
  lockToken: string;
}

export interface LockResponse {
  success: boolean;
  lock?: PropertyLock;
  message?: string;
  remainingTime?: number;
}

export interface ReleaseLockRequest {
  propertyId: string;
  unitId?: string;
  lockToken: string;
}

export interface ExtendLockRequest {
  propertyId: string;
  unitId?: string;
  lockToken: string;
  extensionMinutes?: number;
}

export interface LockStatusResponse {
  isLocked: boolean;
  lockedBy?: string;
  expiresAt?: string;
  remainingTime?: number;
}

/**
 * Acquire a payment lock for a property or unit
 */
export async function acquirePropertyLock(
  propertyId: string,
  unitId?: string
): Promise<LockResponse> {
  try {
    const response = await client.post<LockResponse>('/api/locking/acquire', {
      propertyId,
      unitId,
    });
    return response.data as LockResponse;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to ...'
    );
  }
}

/**
 * Release a payment lock for a property or unit
 */
export async function releasePropertyLock(
  data: ReleaseLockRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await client.post('/api/locking/release', data);
    return response.data as { success: boolean; message?: string };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to ...'
    );
  }
}

/**
 * Extend an existing payment lock
 */
export async function extendPropertyLock(
  data: ExtendLockRequest
): Promise<LockResponse> {
  try {
    const response = await client.post<LockResponse>(
      '/api/locking/extend',
      data
    );
    return response.data as LockResponse;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to ...'
    );
  }
}

/**
 * Check lock status for a property or unit
 */
export async function checkLockStatus(
  propertyId: string,
  unitId?: string
): Promise<LockStatusResponse> {
  try {
    const params = new URLSearchParams({ propertyId });
    if (unitId) params.append('unitId', unitId);

    const response = await client.get<LockStatusResponse>(
      `/api/locking/status?${params.toString()}`
    );
    return response.data as LockStatusResponse;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to ...'
    );
  }
}

/**
 * Force release a lock (admin only)
 */
export async function forceReleaseLock(
  propertyId: string,
  unitId?: string,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await client.post('/api/locking/force-release', {
      propertyId,
      unitId,
      reason,
    });
    return response.data as { success: boolean; message?: string };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to ...'
    );
  }
}

/**
 * Get user's active locks
 */
export async function getUserActiveLocks(): Promise<PropertyLock[]> {
  try {
    const response = await client.get<PropertyLock[]>(
      '/api/locking/user-locks'
    );
    return response.data as PropertyLock[];
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to ...'
    );
  }
}

/**
 * Cleanup expired locks (system operation)
 */
export async function cleanupExpiredLocks(): Promise<{
  success: boolean;
  cleanedCount: number;
}> {
  try {
    const response = await client.post('/api/locking/cleanup');
    return response.data as {
      success: boolean;
      cleanedCount: number;
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to ...'
    );
  }
}