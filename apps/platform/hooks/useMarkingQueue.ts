// apps/platform/hooks/useMarkingQueue.ts
import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface QueuedJob {
  id: string;
  propertyId: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
    images: { url: string }[];
  };
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  markingFee: number;
  queuePosition: number;
  timeSlotExpiry?: Date;
  distance?: number;
  estimatedTime?: string;
  createdAt: Date;
}

interface QueueStats {
  totalInQueue: number;
  yourPosition?: number;
  estimatedWaitTime?: string;
  activeJobs: number;
}

export function useMarkingQueue() {
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number>(5000);

  // Fetch available jobs in queue (for agents)
  const {
    data: availableJobs,
    isLoading: isLoadingQueue,
    error: queueError,
    refetch: refetchQueue
  } = useQuery<QueuedJob[]>({
    queryKey: ['markingQueue'],
    queryFn: async () => {
      const res = await fetch('/api/marking-jobs/queue', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch queue');
      return res.json();
    },
    refetchInterval: pollingInterval,
    enabled: true,
  });

  // Fetch agent's current queue position
  const {
    data: queueStats,
    refetch: refetchStats
  } = useQuery<QueueStats>({
    queryKey: ['queueStats'],
    queryFn: async () => {
      const res = await fetch('/api/marking-jobs/queue/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch queue stats');
      return res.json();
    },
    refetchInterval: pollingInterval,
  });

  // Join queue for a job
  const joinQueue = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/marking-jobs/${jobId}/join-queue`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to join queue');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['markingQueue'] });
      queryClient.invalidateQueries({ queryKey: ['queueStats'] });
      queryClient.invalidateQueries({ queryKey: ['agentJobs'] });
      toast.success(`You're in position ${data.queuePosition}. Time slot: 3 hours`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Leave queue
  const leaveQueue = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/marking-jobs/${jobId}/leave-queue`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to leave queue');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingQueue'] });
      queryClient.invalidateQueries({ queryKey: ['queueStats'] });
      queryClient.invalidateQueries({ queryKey: ['agentJobs'] });
      toast.success('Left queue successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Check if agent is in queue for a job
  const isInQueue = useCallback((jobId: string): boolean => {
    return queueStats?.yourPosition !== undefined;
  }, [queueStats]);

  // Get job by ID
  const getQueueJob = useCallback((jobId: string) => {
    return availableJobs?.find(job => job.id === jobId);
  }, [availableJobs]);

  // Filter jobs by distance
  const getJobsByDistance = useCallback((maxDistance: number) => {
    return availableJobs?.filter(job => 
      job.distance && job.distance <= maxDistance
    ) || [];
  }, [availableJobs]);

  // Sort jobs by various criteria
  const sortJobs = useCallback((
    jobs: QueuedJob[] | undefined, 
    sortBy: 'distance' | 'fee' | 'time' | 'queue'
  ) => {
    if (!jobs) return [];
    
    return [...jobs].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || Infinity) - (b.distance || Infinity);
        case 'fee':
          return b.markingFee - a.markingFee;
        case 'time':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'queue':
          return a.queuePosition - b.queuePosition;
        default:
          return 0;
      }
    });
  }, []);

  // Enable/disable polling based on queue activity
  useEffect(() => {
    if (queueStats?.yourPosition !== undefined) {
      // More frequent polling when in queue
      setPollingInterval(3000);
    } else if (availableJobs && availableJobs.length > 0) {
      // Normal polling when viewing available jobs
      setPollingInterval(5000);
    } else {
      // Less frequent polling when idle
      setPollingInterval(10000);
    }
  }, [queueStats, availableJobs]);

  return {
    availableJobs,
    queueStats,
    isLoadingQueue,
    queueError,
    refetchQueue,
    refetchStats,
    joinQueue: joinQueue.mutateAsync,
    leaveQueue: leaveQueue.mutateAsync,
    isJoiningQueue: joinQueue.isPending,
    isLeavingQueue: leaveQueue.isPending,
    isInQueue,
    getQueueJob,
    getJobsByDistance,
    sortJobs,
  };
}