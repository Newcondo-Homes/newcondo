import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { markingApi } from '@/lib/api/marking';

interface AgentAvailability {
  isAvailable: boolean;
  serviceAreas: string[];
  reliabilityScore: number;
  totalJobs: number;
  completedJobs: number;
  currentActiveJobs: number;
  maxConcurrentJobs: number;
}

interface UpdateAvailabilityParams {
  isAvailable: boolean;
  serviceAreas?: string[];
}

interface UseAgentAvailabilityOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseAgentAvailabilityReturn {
  availability: AgentAvailability | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  toggleAvailability: () => Promise<void>;
  updateServiceAreas: (areas: string[]) => Promise<void>;
  updateAvailability: (params: UpdateAvailabilityParams) => Promise<void>;
  
  // Status checks
  canTakeMoreJobs: boolean;
  isAtCapacity: boolean;
  
  // Mutation states
  isUpdating: boolean;
  updateError: Error | null;
}

export const useAgentAvailability = (
  options: UseAgentAvailabilityOptions = {}
): UseAgentAvailabilityReturn => {
  const { enabled = true, refetchInterval = 30000 } = options; // Refetch every 30 seconds
  const queryClient = useQueryClient();

  // Fetch agent availability status
  const {
    data: availability,
    isLoading,
    error,
    refetch
  } = useQuery<AgentAvailability>({
    queryKey: ['agentAvailability'],
    queryFn: async () => {
      const response = await markingApi.getAgentAvailability();
      return response.data;
    },
    enabled,
    refetchInterval,
    staleTime: 20000, // Consider data stale after 20 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Update availability mutation
  const updateMutation = useMutation({
    mutationFn: async (params: UpdateAvailabilityParams) => {
      const response = await markingApi.updateAgentAvailability(params);
      return response.data;
    },
    onSuccess: (data) => {
      // Update cache immediately
      queryClient.setQueryData(['agentAvailability'], data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['agentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['proximityAgents'] });
    },
    onError: (error) => {
      console.error('Failed to update availability:', error);
    }
  });

  // Toggle availability on/off
  const toggleAvailability = useCallback(async () => {
    if (!availability) return;
    
    await updateMutation.mutateAsync({
      isAvailable: !availability.isAvailable
    });
  }, [availability, updateMutation]);

  // Update service areas
  const updateServiceAreas = useCallback(async (areas: string[]) => {
    await updateMutation.mutateAsync({
      isAvailable: availability?.isAvailable ?? true,
      serviceAreas: areas
    });
  }, [availability, updateMutation]);

  // Update availability with custom parameters
  const updateAvailability = useCallback(async (params: UpdateAvailabilityParams) => {
    await updateMutation.mutateAsync(params);
  }, [updateMutation]);

  // Check if agent can take more jobs
  const canTakeMoreJobs = Boolean(
    availability?.isAvailable &&
    availability.currentActiveJobs < availability.maxConcurrentJobs
  );

  // Check if agent is at capacity
  const isAtCapacity = Boolean(
    availability &&
    availability.currentActiveJobs >= availability.maxConcurrentJobs
  );

  // Auto-disable availability if at capacity
  useEffect(() => {
    if (isAtCapacity && availability?.isAvailable) {
      console.warn('Agent at capacity, automatically disabling availability');
      updateMutation.mutate({ isAvailable: false });
    }
  }, [isAtCapacity, availability?.isAvailable]);

  return {
    availability,
    isLoading,
    error: error as Error | null,
    
    toggleAvailability,
    updateServiceAreas,
    updateAvailability,
    
    canTakeMoreJobs,
    isAtCapacity,
    
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error as Error | null
  };
};

// Hook for checking if agent is available in specific area
export const useAgentAreaAvailability = (state: string, lga: string) => {
  const { availability, isLoading } = useAgentAvailability();

  const isAvailableInArea = useCallback(() => {
    if (!availability || !availability.isAvailable) return false;
    
    // Check if service areas include the location
    const areaString = `${state}, ${lga}`;
    return availability.serviceAreas.some(area => 
      area.toLowerCase().includes(state.toLowerCase()) &&
      area.toLowerCase().includes(lga.toLowerCase())
    );
  }, [availability, state, lga]);

  return {
    isAvailableInArea: isAvailableInArea(),
    isLoading
  };
};

// Hook for agent statistics
export const useAgentStats = () => {
  const { availability } = useAgentAvailability();

  const completionRate = availability && availability.totalJobs > 0
    ? (availability.completedJobs / availability.totalJobs) * 100
    : 0;

  const reliabilityStatus = 
    !availability ? 'unknown' :
    availability.reliabilityScore >= 4.5 ? 'excellent' :
    availability.reliabilityScore >= 4.0 ? 'good' :
    availability.reliabilityScore >= 3.5 ? 'average' :
    'poor';

  return {
    reliabilityScore: availability?.reliabilityScore ?? 0,
    reliabilityStatus,
    totalJobs: availability?.totalJobs ?? 0,
    completedJobs: availability?.completedJobs ?? 0,
    completionRate: Math.round(completionRate),
    currentActiveJobs: availability?.currentActiveJobs ?? 0,
    maxConcurrentJobs: availability?.maxConcurrentJobs ?? 3
  };
};