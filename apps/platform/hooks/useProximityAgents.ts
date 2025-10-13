// apps/platform/hooks/useProximityAgents.ts

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Coordinates {
  lat: number;
  lng: number;
}

interface ProximityAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  isAvailableForMarking: boolean;
  agentReliabilityScore: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  distance: number; // in kilometers
  estimatedArrivalTime: number; // in minutes
  serviceAreas: string[];
}

interface UseProximityAgentsOptions {
  propertyCoordinates?: Coordinates;
  radius?: number; // in kilometers
  minReliabilityScore?: number;
  enabled?: boolean;
}

interface UseProximityAgentsReturn {
  agents: ProximityAgent[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  notifyAgents: (markingJobId: string) => Promise<void>;
  isNotifying: boolean;
  notifyError: Error | null;
}

export const useProximityAgents = ({
  propertyCoordinates,
  radius = 10, // Default 10km radius
  minReliabilityScore = 3.0,
  enabled = true
}: UseProximityAgentsOptions = {}): UseProximityAgentsReturn => {
  const queryClient = useQueryClient();
  const [notifyError, setNotifyError] = useState<Error | null>(null);

  // Fetch nearby agents
  const {
    data: agents = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ProximityAgent[], Error>({
    queryKey: ['proximityAgents', propertyCoordinates, radius, minReliabilityScore],
    queryFn: async () => {
      if (!propertyCoordinates) {
        return [];
      }

      const response = await fetch(
        `/api/marking/agents/proximity?` +
        `lat=${propertyCoordinates.lat}&` +
        `lng=${propertyCoordinates.lng}&` +
        `radius=${radius}&` +
        `minScore=${minReliabilityScore}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch proximity agents');
      }

      return response.json();
    },
    enabled: enabled && !!propertyCoordinates,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Notify agents mutation
  const { mutateAsync: notifyAgentsMutation, isPending: isNotifying } = useMutation({
    mutationFn: async (markingJobId: string) => {
      const response = await fetch('/api/marking/notify-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markingJobId,
          propertyCoordinates,
          radius,
          minReliabilityScore
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to notify agents');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate agents query to refresh data
      queryClient.invalidateQueries({ queryKey: ['proximityAgents'] });
      setNotifyError(null);
    },
    onError: (error: Error) => {
      setNotifyError(error);
    }
  });

  const notifyAgents = useCallback(
    async (markingJobId: string) => {
      try {
        await notifyAgentsMutation(markingJobId);
      } catch (error) {
        // Error is handled in onError callback
        console.error('Error notifying agents:', error);
      }
    },
    [notifyAgentsMutation]
  );

  return {
    agents,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    notifyAgents,
    isNotifying,
    notifyError
  };
};

// Hook to get agent availability status
export const useAgentAvailabilityStatus = (agentId?: string) => {
  return useQuery({
    queryKey: ['agentAvailability', agentId],
    queryFn: async () => {
      if (!agentId) return null;

      const response = await fetch(`/api/marking/agents/${agentId}/availability`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch agent availability');
      }

      return response.json();
    },
    enabled: !!agentId,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
};

// Hook to calculate distance between two coordinates
export const useDistanceCalculation = () => {
  const calculateDistance = useCallback((
    coord1: Coordinates,
    coord2: Coordinates
  ): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }, []);

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  return { calculateDistance };
};

// Hook to filter agents by service area
export const useFilterAgentsByArea = (
  agents: ProximityAgent[],
  targetArea?: string
) => {
  const [filteredAgents, setFilteredAgents] = useState<ProximityAgent[]>(agents);

  useEffect(() => {
    if (!targetArea) {
      setFilteredAgents(agents);
      return;
    }

    const filtered = agents.filter(agent =>
      agent.serviceAreas.some(area =>
        area.toLowerCase().includes(targetArea.toLowerCase())
      )
    );

    setFilteredAgents(filtered);
  }, [agents, targetArea]);

  return filteredAgents;
};