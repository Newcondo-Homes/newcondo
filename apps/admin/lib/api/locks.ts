// apps/admin/src/lib/api/locks.ts
import { apiClient } from './client';

export interface PropertyLock {
  id: string;
  propertyId: string;
  unitId?: string;
  userId: string;
  lockedAt: Date;
  expiresAt: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'RELEASED';
  lockReason: 'PAYMENT_INITIATED' | 'INSPECTION_SCHEDULED' | 'ADMIN_HOLD';
  metadata?: Record<string, any>;
}

export interface LockStatusResponse {
  propertyId: string;
  unitId?: string;
  isLocked: boolean;
  lock?: PropertyLock;
  availableForBooking: boolean;
}

export interface CreateLockRequest {
  propertyId: string;
  unitId?: string;
  userId: string;
  lockDurationMinutes?: number;
  lockReason: PropertyLock['lockReason'];
  metadata?: Record<string, any>;
}

export interface LockStatistics {
  totalActiveLocks: number;
  expiredLocksToday: number;
  averageLockDuration: number;
  locksByReason: Record<string, number>;
  propertiesCurrentlyLocked: number;
}

export interface ReleaseLockRequest {
  lockId: string;
  reason: string;
  adminId: string;
}

/**
 * Get all active property locks
 */
export async function getActiveLocks(params?: {
  page?: number;
  limit?: number;
  propertyId?: string;
  userId?: string;
  status?: PropertyLock['status'];
}): Promise<{
  locks: PropertyLock[];
  total: number;
  page: number;
  limit: number;
}> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.propertyId) queryParams.set('propertyId', params.propertyId);
  if (params?.userId) queryParams.set('userId', params.userId);
  if (params?.status) queryParams.set('status', params.status);

  const response = await apiClient.get(`/admin/locks?${queryParams.toString()}`);
  return response.data;
}

/**
 * Get lock status for a specific property/unit
 */
export async function getLockStatus(
  propertyId: string,
  unitId?: string
): Promise<LockStatusResponse> {
  const url = unitId 
    ? `/admin/locks/status/${propertyId}/unit/${unitId}`
    : `/admin/locks/status/${propertyId}`;
  
  const response = await apiClient.get(url);
  return response.data;
}

/**
 * Get details of a specific lock
 */
export async function getLockById(lockId: string): Promise<PropertyLock> {
  const response = await apiClient.get(`/admin/locks/${lockId}`);
  return response.data;
}

/**
 * Create a new property lock (admin override)
 */
export async function createLock(data: CreateLockRequest): Promise<PropertyLock> {
  const response = await apiClient.post('/admin/locks', data);
  return response.data;
}

/**
 * Release a property lock manually
 */
export async function releaseLock(data: ReleaseLockRequest): Promise<{
  success: boolean;
  message: string;
  lock: PropertyLock;
}> {
  const response = await apiClient.post('/admin/locks/release', data);
  return response.data;
}

/**
 * Extend lock expiration time
 */
export async function extendLock(
  lockId: string,
  additionalMinutes: number,
  reason: string
): Promise<PropertyLock> {
  const response = await apiClient.patch(`/admin/locks/${lockId}/extend`, {
    additionalMinutes,
    reason,
  });
  return response.data;
}

/**
 * Force release all expired locks
 */
export async function releaseExpiredLocks(): Promise<{
  releasedCount: number;
  locks: PropertyLock[];
}> {
  const response = await apiClient.post('/admin/locks/release-expired');
  return response.data;
}

/**
 * Get lock statistics
 */
export async function getLockStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<LockStatistics> {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('startDate', startDate.toISOString());
  if (endDate) queryParams.set('endDate', endDate.toISOString());

  const response = await apiClient.get(`/admin/locks/statistics?${queryParams.toString()}`);
  return response.data;
}

/**
 * Get locks by user
 */
export async function getLocksByUser(userId: string): Promise<PropertyLock[]> {
  const response = await apiClient.get(`/admin/locks/user/${userId}`);
  return response.data;
}

/**
 * Get locks by property
 */
export async function getLocksByProperty(propertyId: string): Promise<PropertyLock[]> {
  const response = await apiClient.get(`/admin/locks/property/${propertyId}`);
  return response.data;
}

/**
 * Batch release locks
 */
export async function batchReleaseLocks(
  lockIds: string[],
  reason: string,
  adminId: string
): Promise<{
  successCount: number;
  failureCount: number;
  results: Array<{ lockId: string; success: boolean; error?: string }>;
}> {
  const response = await apiClient.post('/admin/locks/batch-release', {
    lockIds,
    reason,
    adminId,
  });
  return response.data;
}

/**
 * Get lock history for a property
 */
export async function getLockHistory(
  propertyId: string,
  options?: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  locks: PropertyLock[];
  total: number;
  page: number;
  limit: number;
}> {
  const queryParams = new URLSearchParams();
  if (options?.page) queryParams.set('page', options.page.toString());
  if (options?.limit) queryParams.set('limit', options.limit.toString());
  if (options?.startDate) queryParams.set('startDate', options.startDate.toISOString());
  if (options?.endDate) queryParams.set('endDate', options.endDate.toISOString());

  const response = await apiClient.get(
    `/admin/locks/history/${propertyId}?${queryParams.toString()}`
  );
  return response.data;
}