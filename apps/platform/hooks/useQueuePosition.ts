// File: apps/platform/hooks/useQueuePosition.ts
'use client'

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface QueuePositionData {
  markingJobId: string;
  currentPosition: number;
  totalInQueue: number;
  estimatedWaitTime: number; // in minutes
  isAssigned: boolean;
  assignedAt?: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

interface PositionState {
  positions: Map<string, QueuePositionData>;
  loading: boolean;
  error: string | null;
}

export function useQueuePosition() {
  const { user } = useAuth();
  const [state, setState] = useState<PositionState>({
    positions: new Map(),
    loading: false,
    error: null,
  });

  // Fetch queue position for a specific marking job
  const fetchPosition = useCallback(
    async (markingJobId: string): Promise<QueuePositionData | null> => {
      if (!user?.id) return null;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(
          `/api/marking/queue/position/${markingJobId}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch queue position');
        }

        const data = await res.json();

        setState((prev) => {
          const newPositions = new Map(prev.positions);
          newPositions.set(markingJobId, data);
          return { ...prev, positions: newPositions };
        });

        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errorMsg }));
        return null;
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [user?.id]
  );

  // Fetch all agent's queue positions
  const fetchAllPositions = useCallback(async () => {
    if (!user?.id) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/marking/queue/my-positions', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch queue positions');
      }

      const data = await res.json();
      const positionsMap = new Map<string, QueuePositionData>();

      (data.positions || []).forEach(
        (position: QueuePositionData) => {
          positionsMap.set(position.markingJobId, position);
        }
      );

      setState((prev) => ({ ...prev, positions: positionsMap }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({ ...prev, error: errorMsg }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [user?.id]);

  // Get position for specific job
  const getPosition = useCallback(
    (markingJobId: string): QueuePositionData | undefined => {
      return state.positions.get(markingJobId);
    },
    [state.positions]
  );

  // Calculate estimated wait time based on position
  const calculateEstimatedWait = useCallback(
    (markingJobId: string): number => {
      const position = state.positions.get(markingJobId);
      if (!position) return 0;

      // Estimate: average 30 minutes per agent ahead
      const baseTime = 30;
      return (position.currentPosition - 1) * baseTime;
    },
    [state.positions]
  );

  // Check if agent is assigned
  const isAssigned = useCallback(
    (markingJobId: string): boolean => {
      const position = state.positions.get(markingJobId);
      return position?.isAssigned || false;
    },
    [state.positions]
  );

  // Get all active queue positions
  const getActivePositions = useCallback(() => {
    return Array.from(state.positions.values()).filter(
      (pos) => pos.status === 'QUEUED' || pos.status === 'ASSIGNED'
    );
  }, [state.positions]);

  // Get assigned position (if agent is currently assigned)
  const getAssignedPosition = useCallback(() => {
    return Array.from(state.positions.values()).find(
      (pos) => pos.isAssigned && pos.status === 'ASSIGNED'
    );
  }, [state.positions]);

  // Real-time polling for position updates
  useEffect(() => {
    if (!user?.id || state.positions.size === 0) return;

    const interval = setInterval(() => {
      fetchAllPositions();
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [user?.id, state.positions.size, fetchAllPositions]);

  return {
    positions: state.positions,
    loading: state.loading,
    error: state.error,
    fetchPosition,
    fetchAllPositions,
    getPosition,
    calculateEstimatedWait,
    isAssigned,
    getActivePositions,
    getAssignedPosition,
  };
}