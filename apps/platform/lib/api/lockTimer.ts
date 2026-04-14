// apps/platform/lib/api/lockTimer.ts

import apiClient from '@/lib/api/client';

export interface AcquireLockResponse {
  success: boolean;
  lockId: string;
  lockExpiry: string;
}

export interface ReleaseLockResponse {
  success: boolean;
}

export interface ExtendLockResponse {
  success: boolean;
  lockExpiry: string;
}

export interface AcquireLockPayload {
  lockDuration: number;
}

export interface ReleaseLockPayload {
  lockId: string;
}

export interface ExtendLockPayload {
  lockId: string | null;
  additionalSeconds: number;
}

const getLockEndpoints = (propertyId: string, unitId?: string) => ({
  acquire: unitId
    ? `/api/properties/${propertyId}/units/${unitId}/acquire-lock`
    : `/api/properties/${propertyId}/acquire-lock`,
  release: unitId
    ? `/api/properties/${propertyId}/units/${unitId}/release-lock`
    : `/api/properties/${propertyId}/release-lock`,
  extend: unitId
    ? `/api/properties/${propertyId}/units/${unitId}/extend-lock`
    : `/api/properties/${propertyId}/extend-lock`,
});

export const lockTimerApi = {
  async acquireLock(
    propertyId: string,
    payload: AcquireLockPayload,
    unitId?: string
  ): Promise<AcquireLockResponse> {
    const { acquire } = getLockEndpoints(propertyId, unitId);
    const response = await apiClient.post<AcquireLockResponse>(acquire, payload);

    if (!response.data) {
      throw new Error('Failed to acquire lock: no data returned');
    }

    return response.data;
  },

  async releaseLock(
    propertyId: string,
    payload: ReleaseLockPayload,
    unitId?: string
  ): Promise<ReleaseLockResponse> {
    const { release } = getLockEndpoints(propertyId, unitId);
    const response = await apiClient.post<ReleaseLockResponse>(release, payload);

    if (!response.data) {
      throw new Error('Failed to release lock: no data returned');
    }

    return response.data;
  },

  async extendLock(
    propertyId: string,
    payload: ExtendLockPayload,
    unitId?: string
  ): Promise<ExtendLockResponse> {
    const { extend } = getLockEndpoints(propertyId, unitId);
    const response = await apiClient.post<ExtendLockResponse>(extend, payload);

    if (!response.data) {
      throw new Error('Failed to extend lock: no data returned');
    }

    return response.data;
  },

  /**
   * Beacon-based release for page unload — no response handling needed
   */
  beaconReleaseLock(
    propertyId: string,
    lockId: string,
    unitId?: string
  ): void {
    const { release } = getLockEndpoints(propertyId, unitId);
    const blob = new Blob(
      [JSON.stringify({ lockId })],
      { type: 'application/json' }
    );
    navigator.sendBeacon(release, blob);
  },
};