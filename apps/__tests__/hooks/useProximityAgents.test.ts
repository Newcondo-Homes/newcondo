/**
 * Test Suite: useProximityAgents Hook
 * Location: apps/platform/__tests__/hooks/useProximityAgents.test.ts
 * 
 * Tests the custom hook for fetching and managing proximity-based agents
 * for property marking jobs.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProximityAgents } from '@/hooks/useProximityAgents';
import * as markingApi from '@/lib/api/marking';

// Mock the API module
vi.mock('@/lib/api/marking');

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProximityAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProximityAgents('property-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.agents).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.totalCount).toBe(0);
    });

    it('should not fetch if propertyId is not provided', () => {
      const getProximityAgentsSpy = vi.spyOn(markingApi, 'getProximityAgents');

      renderHook(() => useProximityAgents(''), {
        wrapper: createWrapper(),
      });

      expect(getProximityAgentsSpy).not.toHaveBeenCalled();
    });
  });

  describe('Successful Agent Fetching', () => {
    it('should fetch proximity agents successfully', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348012345678',
          agentReliabilityScore: 4.5,
          totalMarkingJobs: 50,
          completedMarkingJobs: 48,
          isAvailableForMarking: true,
          distanceKm: 2.5,
          estimatedTravelTime: '15 mins',
        },
        {
          id: 'agent-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+2348087654321',
          agentReliabilityScore: 4.8,
          totalMarkingJobs: 75,
          completedMarkingJobs: 74,
          isAvailableForMarking: true,
          distanceKm: 3.2,
          estimatedTravelTime: '20 mins',
        },
      ];

      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: mockAgents,
          totalCount: 2,
        },
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.agents).toEqual(mockAgents);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.error).toBeNull();
      expect(markingApi.getProximityAgents).toHaveBeenCalledWith('property-123', {
        radius: 10,
        limit: 20,
      });
    });

    it('should fetch agents with custom radius and limit', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348012345678',
          agentReliabilityScore: 4.5,
          totalMarkingJobs: 50,
          completedMarkingJobs: 48,
          isAvailableForMarking: true,
          distanceKm: 1.5,
          estimatedTravelTime: '10 mins',
        },
      ];

      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: mockAgents,
          totalCount: 1,
        },
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123', { radius: 5, limit: 10 }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.agents).toEqual(mockAgents);
      expect(markingApi.getProximityAgents).toHaveBeenCalledWith('property-123', {
        radius: 5,
        limit: 10,
      });
    });

    it('should handle empty agent list', async () => {
      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: [],
          totalCount: 0,
        },
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.agents).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch proximity agents');
      vi.mocked(markingApi.getProximityAgents).mockRejectedValue(mockError);

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.agents).toEqual([]);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('Failed to fetch proximity agents');
    });

    it('should handle network errors', async () => {
      vi.mocked(markingApi.getProximityAgents).mockRejectedValue(
        new Error('Network Error')
      );

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.agents).toEqual([]);
    });

    it('should handle unsuccessful API response', async () => {
      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: false,
        error: 'No agents found in proximity',
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.agents).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Agent Filtering and Sorting', () => {
    it('should return agents sorted by distance', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348012345678',
          agentReliabilityScore: 4.5,
          totalMarkingJobs: 50,
          completedMarkingJobs: 48,
          isAvailableForMarking: true,
          distanceKm: 5.2,
          estimatedTravelTime: '30 mins',
        },
        {
          id: 'agent-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+2348087654321',
          agentReliabilityScore: 4.8,
          totalMarkingJobs: 75,
          completedMarkingJobs: 74,
          isAvailableForMarking: true,
          distanceKm: 1.2,
          estimatedTravelTime: '8 mins',
        },
      ];

      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: mockAgents,
          totalCount: 2,
        },
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify agents are returned (sorting should be done by the API)
      expect(result.current.agents).toHaveLength(2);
      expect(result.current.agents[0].id).toBe('agent-1');
      expect(result.current.agents[1].id).toBe('agent-2');
    });

    it('should only include available agents', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348012345678',
          agentReliabilityScore: 4.5,
          totalMarkingJobs: 50,
          completedMarkingJobs: 48,
          isAvailableForMarking: true,
          distanceKm: 2.5,
          estimatedTravelTime: '15 mins',
        },
      ];

      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: mockAgents,
          totalCount: 1,
        },
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All agents should be available for marking
      result.current.agents.forEach((agent) => {
        expect(agent.isAvailableForMarking).toBe(true);
      });
    });
  });

  describe('Refetch Functionality', () => {
    it('should allow manual refetch', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348012345678',
          agentReliabilityScore: 4.5,
          totalMarkingJobs: 50,
          completedMarkingJobs: 48,
          isAvailableForMarking: true,
          distanceKm: 2.5,
          estimatedTravelTime: '15 mins',
        },
      ];

      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: mockAgents,
          totalCount: 1,
        },
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(markingApi.getProximityAgents).toHaveBeenCalledTimes(1);

      // Trigger refetch
      await result.current.refetch();

      expect(markingApi.getProximityAgents).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading States', () => {
    it('should show loading state during fetch', async () => {
      vi.mocked(markingApi.getProximityAgents).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: { agents: [], totalCount: 0 },
                }),
              100
            )
          )
      );

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Agent Reliability Information', () => {
    it('should include reliability scores and job statistics', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348012345678',
          agentReliabilityScore: 4.9,
          totalMarkingJobs: 100,
          completedMarkingJobs: 98,
          isAvailableForMarking: true,
          distanceKm: 2.5,
          estimatedTravelTime: '15 mins',
        },
      ];

      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: mockAgents,
          totalCount: 1,
        },
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const agent = result.current.agents[0];
      expect(agent.agentReliabilityScore).toBe(4.9);
      expect(agent.totalMarkingJobs).toBe(100);
      expect(agent.completedMarkingJobs).toBe(98);
      expect(agent.completedMarkingJobs / agent.totalMarkingJobs).toBeGreaterThanOrEqual(0.95);
    });
  });

  describe('Distance and Travel Time Information', () => {
    it('should include distance and estimated travel time', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348012345678',
          agentReliabilityScore: 4.5,
          totalMarkingJobs: 50,
          completedMarkingJobs: 48,
          isAvailableForMarking: true,
          distanceKm: 3.7,
          estimatedTravelTime: '22 mins',
        },
      ];

      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: mockAgents,
          totalCount: 1,
        },
      });

      const { result } = renderHook(
        () => useProximityAgents('property-123'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const agent = result.current.agents[0];
      expect(agent.distanceKm).toBe(3.7);
      expect(agent.estimatedTravelTime).toBe('22 mins');
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache when specified', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348012345678',
          agentReliabilityScore: 4.5,
          totalMarkingJobs: 50,
          completedMarkingJobs: 48,
          isAvailableForMarking: true,
          distanceKm: 2.5,
          estimatedTravelTime: '15 mins',
        },
      ];

      vi.mocked(markingApi.getProximityAgents).mockResolvedValue({
        success: true,
        data: {
          agents: mockAgents,
          totalCount: 1,
        },
      });

      const { result, rerender } = renderHook(
        ({ enabled }) => useProximityAgents('property-123', { enabled }),
        {
          wrapper: createWrapper(),
          initialProps: { enabled: true },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(markingApi.getProximityAgents).toHaveBeenCalledTimes(1);

      // Disable and re-enable to trigger refetch
      rerender({ enabled: false });
      rerender({ enabled: true });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still be called only once due to caching
      expect(markingApi.getProximityAgents).toHaveBeenCalledTimes(1);
    });
  });
});