import { client } from './client';

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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to acquire property lock'
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to release property lock'
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to extend property lock'
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to check lock status'
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to force release lock'
    );
  }
}

/**
 * Get user's active locks
 */
export async function getUserActiveLocks(): Promise<PropertyLock[]> {
  try {
    const response = await client.get<{ locks: PropertyLock[] }>(
      '/api/locking/user-locks'
    );
    return response.data.locks;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch user locks'
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to cleanup expired locks'
    );
  }
}