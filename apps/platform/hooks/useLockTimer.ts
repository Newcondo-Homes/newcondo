'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { lockTimerApi } from '@/lib/api/lockTimer';

interface LockTimerState {
  isLocked: boolean;
  remainingTime: number; // in seconds
  lockExpiry: Date | null;
  lockId: string | null;
}

interface LockTimerOptions {
  propertyId: string;
  unitId?: string;
  lockDuration?: number; // in seconds, default 15 minutes (900s)
  onLockExpired?: () => void;
  onLockExtended?: (newExpiry: Date) => void;
  onLockReleased?: () => void;
  autoRelease?: boolean; // Auto-release lock on unmount
  warningThreshold?: number; // Show warning when X seconds remain
  onWarning?: (remainingSeconds: number) => void;
}

interface LockTimerReturn {
  state: LockTimerState;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<boolean>;
  extendLock: (additionalSeconds?: number) => Promise<boolean>;
  refreshLock: () => Promise<boolean>;
  isAcquiring: boolean;
  isReleasing: boolean;
  isExtending: boolean;
  canExtend: boolean;
  isWarning: boolean;
  error: Error | null;
  formatRemainingTime: () => string;
}

const DEFAULT_LOCK_DURATION = 900; // 15 minutes
const DEFAULT_WARNING_THRESHOLD = 120; // 2 minutes

/**
 * Hook for managing payment lock timers
 * Handles lock acquisition, extension, and automatic release
 */
export function useLockTimer(options: LockTimerOptions): LockTimerReturn {
  const {
    propertyId,
    unitId,
    lockDuration = DEFAULT_LOCK_DURATION,
    onLockExpired,
    onLockExtended,
    onLockReleased,
    autoRelease = true,
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
    onWarning,
  } = options;

  const [state, setState] = useState<LockTimerState>({
    isLocked: false,
    remainingTime: 0,
    lockExpiry: null,
    lockId: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasWarned = useRef(false);

  // Acquire lock mutation
  const acquireLockMutation = useMutation({
    mutationFn: () => lockTimerApi.acquireLock(propertyId, { lockDuration }, unitId),
    onSuccess: (data) => {
      const expiry = new Date(data.lockExpiry);
      setState({
        isLocked: true,
        remainingTime: Math.floor((expiry.getTime() - Date.now()) / 1000),
        lockExpiry: expiry,
        lockId: data.lockId,
      });
      hasWarned.current = false;
    },
  });

  // Release lock mutation
  const releaseLockMutation = useMutation({
    mutationFn: () => {
      if (!state.lockId) return Promise.resolve({ success: false });;

      return lockTimerApi.releaseLock(
        propertyId,
        { lockId: state.lockId },
        unitId
      );
    },
    onSuccess: () => {
      setState({
        isLocked: false,
        remainingTime: 0,
        lockExpiry: null,
        lockId: null,
      });
      hasWarned.current = false;
      onLockReleased?.();
    },
  });

  // Extend lock mutation
  const extendLockMutation = useMutation({
    mutationFn: async (additionalSeconds: number = lockDuration) => {
      if (!state.lockId) {
        Promise.resolve({ success: false, lockExpiry: '' });
      }

      return lockTimerApi.extendLock(
        propertyId,
        { lockId: state.lockId, additionalSeconds },
        unitId
      );
    },
    onSuccess: (data) => {
      if (!data.lockExpiry) {
        const expiry = new Date(data.lockExpiry);
        setState((prev) => ({
          ...prev,
          remainingTime: Math.floor((expiry.getTime() - Date.now()) / 1000),
          lockExpiry: expiry,
        }));
        hasWarned.current = false;
        onLockExtended?.(expiry);
      }
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (!state.isLocked || !state.lockExpiry) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const expiry = state.lockExpiry!.getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setState((prev) => ({
        ...prev,
        remainingTime: remaining,
      }));

      // Check for warning threshold
      if (
        !hasWarned.current &&
        remaining <= warningThreshold &&
        remaining > 0 
      ) {
        hasWarned.current = true;
        onWarning?.(remaining);
      }

      // Check for expiration
      if (remaining === 0) {
        setState((prev) => ({
          ...prev,
          isLocked: false,
          lockId: null,
        }));
        if (onLockExpired) {
          onLockExpired();
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isLocked, state.lockExpiry, warningThreshold, onWarning, onLockExpired]);

  // Auto-release on unmount
  useEffect(() => {
    return () => {
      if (autoRelease && state.isLocked && state.lockId) {
        // Use navigator.sendBeacon for reliable cleanup on page unload
        lockTimerApi.beaconReleaseLock(propertyId, state.lockId, unitId);
      }
    };
  }, [autoRelease, state.isLocked, state.lockId, propertyId, unitId]);

  // Public methods
  const acquireLock = useCallback(async () => {
    try {
      await acquireLockMutation.mutateAsync();
      return true;
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      return false;
    }
  }, [acquireLockMutation]);

  const releaseLock = useCallback(async () => {
    try {
      await releaseLockMutation.mutateAsync();
      return true;
    } catch (error) {
      console.error('Failed to release lock:', error);
      return false;
    }
  }, [releaseLockMutation]);

  const extendLock = useCallback(
    async (additionalSeconds?: number) => {
      try {
        await extendLockMutation.mutateAsync(additionalSeconds);
        return true;
      } catch (error) {
        console.error('Failed to extend lock:', error);
        return false;
      }
    },
    [extendLockMutation]
  );

  const refreshLock = useCallback(async () => {
    return await extendLock(lockDuration);
  }, [extendLock, lockDuration]);

  const formatRemainingTime = useCallback(() => {
    const { remainingTime } = state;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [state.remainingTime]);

  const canExtend = state.isLocked && state.remainingTime > 0;
  const isWarning = state.remainingTime <= warningThreshold && state.remainingTime > 0;

  return {
    state,
    acquireLock,
    releaseLock,
    extendLock,
    refreshLock,
    isAcquiring: acquireLockMutation.isPending,
    isReleasing: releaseLockMutation.isPending,
    isExtending: extendLockMutation.isPending,
    canExtend:state.isLocked && state.remainingTime > 0,
    isWarning: state.remainingTime <= warningThreshold && state.remainingTime > 0,
    error: (acquireLockMutation.error || releaseLockMutation.error || extendLockMutation.error) as Error | null,
    formatRemainingTime,
  };
}

/**
 * Hook for managing multiple lock timers
 */
export function useMultipleLockTimers() {
  const [locks, setLocks] = useState<Map<string, LockTimerState>>(new Map());

  const addLock = useCallback((key: string, lockState: LockTimerState) => {
    setLocks((prev) => new Map(prev).set(key, lockState));
  }, []);

  const removeLock = useCallback((key: string) => {
    setLocks((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const hasActiveLocks = locks.size > 0;
  const activeLockCount = locks.size;

  return {
    locks,
    addLock,
    removeLock,
    hasActiveLocks,
    activeLockCount,
  };
}