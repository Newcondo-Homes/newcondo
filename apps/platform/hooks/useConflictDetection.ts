'use client'

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import {
  checkBookingConflicts,
  bulkCheckConflicts,
} from '@/lib/api/conflicts';

import type { ConflictCheckRequest, ConflictCheckResponse } from '@/types/conflicts';

interface UseConflictDetectionOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onConflictDetected?: (conflict: ConflictCheckResponse) => void;
}

interface ConflictDetectionReturn {
  conflict: ConflictCheckResponse | null;
  isChecking: boolean;
  checkConflict: (params: ConflictCheckRequest) => Promise<ConflictCheckResponse>;
  clearConflict: () => void;
  hasActiveConflict: boolean;
  error: Error | null;
}

interface ConflictInfo {
  hasConflict: boolean;
  conflictType?: 'PAYMENT_IN_PROGRESS' | 'ALREADY_RENTED' | 'UNIT_UNAVAILABLE' | 'PROPERTY_LOCKED';
  conflictDetails?: {
    lockedBy?: string;
    lockedAt?: string;
    lockExpiry?: string;
    rentalId?: string;
    conflictingUserId?: string;
  };
  message?: string;
}

interface ConflictCheckParams {
  propertyId: string;
  unitId?: string;
  userId: string;
}



/**
 * Hook for detecting booking conflicts before payment
 * Checks for:
 * - Active payment locks by other users
 * - Existing rentals
 * - Unit availability
 * - Property availability
 */
export function useConflictDetection(
  options: UseConflictDetectionOptions = {}
): ConflictDetectionReturn {
  const {
    enabled = true,
    refetchInterval,
    onConflictDetected,
  } = options;

  const [conflict, setConflict] = useState<ConflictCheckResponse | null>(null);
  const [checkParams, setCheckParams] = useState<ConflictCheckRequest | null>(null);

  // Query for real-time conflict checking
  const {
    data: conflictData,
    isLoading: isChecking,
    error,
  } = useQuery<ConflictCheckResponse | null>({
    queryKey: ['conflict-check', checkParams?.propertyId, checkParams?.unitId],
    queryFn: async () => {
      if (!checkParams) return null;

      return checkBookingConflicts(checkParams);
    },
    enabled: enabled && !!checkParams,
    refetchInterval: refetchInterval || 5000, // Default 5s polling
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
  });

  // Manual conflict check mutation
  const conflictCheckMutation = useMutation({
    mutationFn: async (params: ConflictCheckRequest) => checkBookingConflicts(params),
    onSuccess: (data) => {
      setConflict(data);
      if (data.hasConflict && onConflictDetected) {
        onConflictDetected(data);
      }
    },
  });

  // Update conflict state when query data changes
  useEffect(() => {
    if (conflictData) {
      setConflict(conflictData);
      if (conflictData.hasConflict && onConflictDetected) {
        onConflictDetected(conflictData);
      }
    }
  }, [conflictData, onConflictDetected]);

  // Manual conflict check function
  const checkConflict = useCallback(
    async (params: ConflictCheckRequest): Promise<ConflictCheckResponse> => {
      setCheckParams(params);
      const result = await conflictCheckMutation.mutateAsync(params);
      return result;
    },
    [conflictCheckMutation]
  );

  // Clear conflict state
  const clearConflict = useCallback(() => {
    setConflict(null);
    setCheckParams(null);
  }, []);

  // Helper to check if there's an active conflict
  const hasActiveConflict = conflict?.hasConflict ?? false;

  return {
    conflict,
    isChecking: isChecking || conflictCheckMutation.isPending,
    checkConflict,
    clearConflict,
    hasActiveConflict,
    error: error as Error | null,
  };
}

/**
 * Hook for batch conflict checking (multiple properties/units)
 */
export function useBatchConflictDetection() {
  const batchCheckMutation = useMutation({
    mutationFn: async (items: ConflictCheckRequest[]) => bulkCheckConflicts(items),
  });

  const checkBatchConflicts = useCallback(
    async (items: ConflictCheckRequest[]) => {
      return await batchCheckMutation.mutateAsync(items);
    },
    [batchCheckMutation]
  );

  return {
    checkBatchConflicts,
    isChecking: batchCheckMutation.isPending,
    error: batchCheckMutation.error,
    results: batchCheckMutation.data,
  };
}

/**
 * Hook for conflict resolution suggestions
 */
export function useConflictResolution(conflict: ConflictCheckResponse | null) {
  const getResolutionSuggestions = useCallback(() => {
    if (!conflict?.hasConflict || !conflict.conflicts.length) return [];

    const suggestions: string[] = [...(conflict.warnings ?? [])];

    conflict.conflicts.forEach((c) => {
      switch (c.conflictType) {
        case 'SIMULTANEOUS_PAYMENT':
          suggestions.push(
            'Another user is currently processing payment for this property.',
            'Please wait a few minutes and try again.'
          );
          break;
        case 'ALREADY_RENTED':
          suggestions.push(
            'This property has already been rented.',
            'Please browse other available properties.'
          );
          break;
        case 'OVERLAPPING_RENTAL':
          suggestions.push(
            'Your rental dates overlap with an existing booking.',
            'Please choose different dates.'
          );
          break;
        case 'PAYMENT_LOCKED':
          suggestions.push(
            'This property is temporarily locked for payment processing.',
            'The lock will expire shortly — please try again.'
          );
          break;
      }
    });

    if (conflict.recommendations?.length) {
      suggestions.push(...conflict.recommendations);
    }

    return [...new Set(suggestions)];
  }, [conflict]);

  const conflictTypes = conflict?.conflicts.map((c) => c.conflictType) ?? [];

  return {
    suggestions: getResolutionSuggestions(),
    canRetry:
      conflictTypes.includes('SIMULTANEOUS_PAYMENT') ||
      conflictTypes.includes('PAYMENT_LOCKED'),
    shouldWait: conflictTypes.includes('SIMULTANEOUS_PAYMENT'),
    canProceed: conflict?.canProceed ?? false,
  };
}