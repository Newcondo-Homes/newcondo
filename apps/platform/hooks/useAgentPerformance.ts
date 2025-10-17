import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types for agent performance metrics
interface AgentPerformanceMetrics {
  agentId: string;
  reliabilityScore: number; // 0-5 rating
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  averageCompletionTime: number; // in hours
  averageConfirmationWaitTime: number; // in hours
  responseRate: number; // percentage of jobs accepted vs offered
  completionRate: number; // percentage of completed vs assigned jobs
  averageRating: number; // 1-5 from property owners
  serviceAreas: string[]; // cities/LGAs where agent operates
  lastActiveAt: Date;
  isAvailable: boolean;
  activeJobsCount: number;
  queuePosition?: number; // current position in marking job queue
}

interface AgentFilterOptions {
  minReliabilityScore?: number;
  serviceArea?: string;
  isAvailableOnly?: boolean;
  sortBy?: 'reliability' | 'completionRate' | 'responseRate' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook to fetch and manage agent performance metrics
 * Used to evaluate agent quality before job assignment
 */
export const useAgentPerformance = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<AgentFilterOptions>({
    minReliabilityScore: 3.0,
    isAvailableOnly: true,
    sortBy: 'reliability',
    sortOrder: 'desc',
  });

  // Fetch single agent performance
  const {
    data: agentMetrics,
    isLoading: isLoadingAgent,
    error: agentError,
    refetch: refetchAgent,
  } = useQuery({
    queryKey: ['agentPerformance', selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId) return null;

      const response = await fetch(
        `/api/marking-jobs/agents/${selectedAgentId}/performance`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch agent performance metrics');
      }

      return (await response.json()) as AgentPerformanceMetrics;
    },
    enabled: !!selectedAgentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });

  // Fetch multiple agents with filtering and sorting
  const {
    data: filteredAgents = [],
    isLoading: isLoadingFiltered,
    error: filteredError,
    refetch: refetchFiltered,
  } = useQuery({
    queryKey: ['agentPerformanceFiltered', filterOptions],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filterOptions.minReliabilityScore) {
        params.append('minReliabilityScore', filterOptions.minReliabilityScore.toString());
      }
      if (filterOptions.serviceArea) {
        params.append('serviceArea', filterOptions.serviceArea);
      }
      if (filterOptions.isAvailableOnly) {
        params.append('isAvailable', 'true');
      }
      if (filterOptions.sortBy) {
        params.append('sortBy', filterOptions.sortBy);
      }
      if (filterOptions.sortOrder) {
        params.append('sortOrder', filterOptions.sortOrder);
      }

      const response = await fetch(
        `/api/marking-jobs/agents/performance?${params.toString()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch filtered agent performance');
      }

      return (await response.json()) as AgentPerformanceMetrics[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Get agent rating percentage for UI display
  const getAgentRatingPercentage = useCallback((agent: AgentPerformanceMetrics) => {
    return ((agent.averageRating / 5) * 100).toFixed(1);
  }, []);

  // Determine if agent is qualified for high-priority jobs
  const isQualifiedForHighPriority = useCallback((agent: AgentPerformanceMetrics) => {
    return (
      agent.reliabilityScore >= 4.5 &&
      agent.completionRate >= 95 &&
      agent.responseRate >= 90
    );
  }, []);

  // Get performance badge color based on reliability score
  const getPerformanceBadgeColor = useCallback((score: number) => {
    if (score >= 4.5) return 'green'; // Excellent
    if (score >= 4.0) return 'blue'; // Very Good
    if (score >= 3.5) return 'yellow'; // Good
    if (score >= 3.0) return 'orange'; // Fair
    return 'red'; // Poor
  }, []);

  // Calculate agent fit score for specific property location
  const calculateLocationFitScore = useCallback(
    (agent: AgentPerformanceMetrics, propertyLocation: string): number => {
      const isInServiceArea = agent.serviceAreas.includes(propertyLocation);
      const baseScore = agent.reliabilityScore * 20; // 0-100
      const locationBonus = isInServiceArea ? 10 : -5;
      return Math.max(0, Math.min(100, baseScore + locationBonus));
    },
    []
  );

  // Refetch single agent metrics (useful for real-time updates)
  const refreshAgentMetrics = useCallback(() => {
    if (selectedAgentId) {
      refetchAgent();
    }
  }, [selectedAgentId, refetchAgent]);

  // Refetch all filtered agents
  const refreshFilteredAgents = useCallback(() => {
    refetchFiltered();
  }, [refetchFiltered]);

  return {
    // Single agent metrics
    selectedAgentId,
    setSelectedAgentId,
    agentMetrics,
    isLoadingAgent,
    agentError,
    refreshAgentMetrics,

    // Filtered agents
    filteredAgents,
    isLoadingFiltered,
    filteredError,
    filterOptions,
    setFilterOptions,
    refreshFilteredAgents,

    // Utilities
    getAgentRatingPercentage,
    isQualifiedForHighPriority,
    getPerformanceBadgeColor,
    calculateLocationFitScore,

    // Combined loading state
    isLoading: isLoadingAgent || isLoadingFiltered,
    error: agentError || filteredError,
  };
};

export default useAgentPerformance;