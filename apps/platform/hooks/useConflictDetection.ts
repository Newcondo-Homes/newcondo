import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

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

interface UseConflictDetectionOptions {
  enabled?: boolean;
  refetchInterval?: number; // Auto-check interval in ms
  onConflictDetected?: (conflict: ConflictInfo) => void;
}

interface ConflictDetectionReturn {
  conflict: ConflictInfo | null;
  isChecking: boolean;
  checkConflict: (params: ConflictCheckParams) => Promise<ConflictInfo>;
  clearConflict: () => void;
  hasActiveConflict: boolean;
  error: Error | null;
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

  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [checkParams, setCheckParams] = useState<ConflictCheckParams | null>(null);

  // Query for real-time conflict checking
  const {
    data: conflictData,
    isLoading: isChecking,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conflict-check', checkParams?.propertyId, checkParams?.unitId],
    queryFn: async () => {
      if (!checkParams) return null;

      const endpoint = checkParams.unitId
        ? `/api/properties/${checkParams.propertyId}/units/${checkParams.unitId}/check-conflict`
        : `/api/properties/${checkParams.propertyId}/check-conflict`;

      const response = await api.get<ConflictInfo>(endpoint, {
        params: { userId: checkParams.userId },
      });

      return response.data;
    },
    enabled: enabled && !!checkParams,
    refetchInterval: refetchInterval || 5000, // Default 5s polling
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
  });

  // Manual conflict check mutation
  const conflictCheckMutation = useMutation({
    mutationFn: async (params: ConflictCheckParams) => {
      const endpoint = params.unitId
        ? `/api/properties/${params.propertyId}/units/${params.unitId}/check-conflict`
        : `/api/properties/${params.propertyId}/check-conflict`;

      const response = await api.get<ConflictInfo>(endpoint, {
        params: { userId: params.userId },
      });

      return response.data;
    },
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
    async (params: ConflictCheckParams): Promise<ConflictInfo> => {
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
    mutationFn: async (items: ConflictCheckParams[]) => {
      const response = await api.post<ConflictInfo[]>(
        '/api/properties/batch-check-conflict',
        { items }
      );
      return response.data;
    },
  });

  const checkBatchConflicts = useCallback(
    async (items: ConflictCheckParams[]) => {
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
export function useConflictResolution(conflict: ConflictInfo | null) {
  const getResolutionSuggestions = useCallback(() => {
    if (!conflict?.hasConflict) return [];

    const suggestions: string[] = [];

    switch (conflict.conflictType) {
      case 'PAYMENT_IN_PROGRESS':
        suggestions.push(
          'Another user is currently processing payment for this property.',
          'Please wait for the lock to expire or try another property.',
          `Lock expires at: ${conflict.conflictDetails?.lockExpiry || 'Unknown'}`
        );
        break;

      case 'ALREADY_RENTED':
        suggestions.push(
          'This property has already been rented.',
          'Please browse other available properties.',
          'Consider setting up alerts for similar properties.'
        );
        break;

      case 'UNIT_UNAVAILABLE':
        suggestions.push(
          'This unit is currently unavailable.',
          'Check other units in the same building.',
          'Contact the property manager for more information.'
        );
        break;

      case 'PROPERTY_LOCKED':
        suggestions.push(
          'This property is temporarily locked for payment processing.',
          `Lock will expire in a few minutes.`,
          'You can add this property to your watchlist.'
        );
        break;

      default:
        suggestions.push(
          'Unable to proceed with this property at the moment.',
          'Please try again later or contact support.'
        );
    }

    return suggestions;
  }, [conflict]);

  return {
    suggestions: getResolutionSuggestions(),
    canRetry: conflict?.conflictType === 'PAYMENT_IN_PROGRESS' || 
              conflict?.conflictType === 'PROPERTY_LOCKED',
    shouldWait: conflict?.conflictType === 'PAYMENT_IN_PROGRESS',
  };
}