'use client'

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@newcondo/ui';

interface PropertyLockData {
  propertyId: string;
  unitId?: string;
  isLocked: boolean;
  lockExpiry: string | null;
  lockedBy: string | null;
}

interface LockPropertyParams {
  propertyId: string;
  unitId?: string;
  lockDuration?: number; // in milliseconds, default 15 minutes
}

interface ExtendLockParams {
  propertyId: string;
  unitId?: string;
  additionalTime?: number;
}

interface ReleaseLockParams {
  propertyId: string;
  unitId?: string;
}

export function usePropertyLock(propertyId?: string, unitId?: string) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const queryClient = useQueryClient();

  // Fetch current lock status
  const { data: lockStatus, isLoading } = useQuery<PropertyLockData>({
    queryKey: ['propertyLock', propertyId, unitId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);

      const response = await fetch(
        `/api/booking/lock-status?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch lock status');
      }

      return response.json();
    },
    enabled: !!propertyId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  // Acquire property lock
  const lockMutation = useMutation({
    mutationFn: async ({ propertyId, unitId, lockDuration = 900000 }: LockPropertyParams) => {
      const response = await fetch('/api/booking/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, unitId, lockDuration }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to acquire lock');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['propertyLock', propertyId, unitId] });
      queryClient.invalidateQueries({ queryKey: ['propertyAvailability', propertyId] });
      
      toast('Property Locked',{
        description: 'You have 15 minutes to complete your payment.',
      });
    },
    onError: (error: Error) => {
      toast.error('Lock Failed',{
        description: error.message,
      });
    },
  });

  // Release property lock
  const releaseMutation = useMutation({
    mutationFn: async ({ propertyId, unitId }: ReleaseLockParams) => {
      const response = await fetch('/api/booking/lock', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, unitId }),
      });

      if (!response.ok) {
        throw new Error('Failed to release lock');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLock', propertyId, unitId] });
      queryClient.invalidateQueries({ queryKey: ['propertyAvailability', propertyId] });
    },
  });

  // Extend lock duration
  const extendLockMutation = useMutation({
    mutationFn: async ({ 
      propertyId, 
      unitId, 
      additionalTime = 300000 // 5 minutes default
    }: ExtendLockParams) => {
      const response = await fetch('/api/booking/lock/extend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, unitId, additionalTime }),
      });

      if (!response.ok) {
        throw new Error('Failed to extend lock');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLock', propertyId, unitId] });
      toast('Lock Extended',{
        description: 'You have additional time to complete payment.',
      });
    },
  });

  // Calculate time remaining
  useEffect(() => {
    if (!lockStatus?.lockExpiry || !lockStatus.isLocked) {
      setTimeRemaining(0);
      return;
    }

    const calculateTimeRemaining = () => {
      const expiry = new Date(lockStatus.lockExpiry!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);

      // Auto-release if expired
      if (remaining === 0 && lockStatus.isLocked) {
        queryClient.invalidateQueries({ queryKey: ['propertyLock', propertyId, unitId] });
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockStatus, propertyId, unitId, queryClient]);

  // Helper to check if user owns the lock
  const ownsLock = useCallback((userId: string) => {
    return lockStatus?.lockedBy === userId && lockStatus.isLocked;
  }, [lockStatus]);

  // Format time remaining
  const formattedTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    lockStatus,
    isLoading,
    timeRemaining,
    formattedTimeRemaining: formattedTimeRemaining(),
    
    // Actions
    acquireLock: lockMutation.mutate,
    releaseLock: releaseMutation.mutate,
    extendLock: extendLockMutation.mutate,
    
    // Status checks
    isLocked: lockStatus?.isLocked ?? false,
    ownsLock,
    isExpired: timeRemaining === 0 && lockStatus?.isLocked,
    
    // Loading states
    isAcquiring: lockMutation.isPending,
    isReleasing: releaseMutation.isPending,
    isExtending: extendLockMutation.isPending,
  };
}