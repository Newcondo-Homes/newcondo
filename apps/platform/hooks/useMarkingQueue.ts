// apps/platform/hooks/useMarkingQueue.ts
'use client'

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







// // File: apps/platform/hooks/useMarkingQueue.ts

// import { useState, useCallback, useEffect } from 'react';
// import { useAuth } from './useAuth';

// interface MarkingJobQueueItem {
//   id: string;
//   propertyId: string;
//   status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
//   queuePosition: number;
//   assignedAgentId: string | null;
//   timeSlotExpiry: string;
//   markingFee: number;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: string;
//   urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
//   createdAt: string;
// }

// interface QueueState {
//   queue: MarkingJobQueueItem[];
//   loading: boolean;
//   error: string | null;
// }

// interface JoinQueueResponse {
//   success: boolean;
//   queuePosition: number;
//   timeSlotExpiry: string;
//   message: string;
// }

// export function useMarkingQueue() {
//   const { user } = useAuth();
//   const [state, setState] = useState<QueueState>({
//     queue: [],
//     loading: false,
//     error: null,
//   });

//   // Fetch current queue status
//   const fetchQueue = useCallback(async () => {
//     if (!user?.id) return;

//     setState((prev) => ({ ...prev, loading: true, error: null }));
//     try {
//       const res = await fetch('/api/marking/queue', {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!res.ok) {
//         throw new Error(`Failed to fetch queue: ${res.statusText}`);
//       }

//       const data = await res.json();
//       setState((prev) => ({ ...prev, queue: data.queue || [] }));
//     } catch (err) {
//       const errorMsg = err instanceof Error ? err.message : 'Unknown error';
//       setState((prev) => ({ ...prev, error: errorMsg }));
//     } finally {
//       setState((prev) => ({ ...prev, loading: false }));
//     }
//   }, [user?.id]);

//   // Join a marking job queue
//   const joinQueue = useCallback(
//     async (markingJobId: string): Promise<JoinQueueResponse> => {
//       if (!user?.id) {
//         return {
//           success: false,
//           queuePosition: 0,
//           timeSlotExpiry: '',
//           message: 'User not authenticated',
//         };
//       }

//       setState((prev) => ({ ...prev, loading: true, error: null }));
//       try {
//         const res = await fetch('/api/marking/queue/join', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ markingJobId }),
//         });

//         if (!res.ok) {
//           const error = await res.json();
//           throw new Error(error.message || 'Failed to join queue');
//         }

//         const data = await res.json();
//         await fetchQueue();

//         return {
//           success: true,
//           queuePosition: data.queuePosition,
//           timeSlotExpiry: data.timeSlotExpiry,
//           message: 'Successfully joined queue',
//         };
//       } catch (err) {
//         const errorMsg = err instanceof Error ? err.message : 'Unknown error';
//         setState((prev) => ({ ...prev, error: errorMsg }));
//         return {
//           success: false,
//           queuePosition: 0,
//           timeSlotExpiry: '',
//           message: errorMsg,
//         };
//       } finally {
//         setState((prev) => ({ ...prev, loading: false }));
//       }
//     },
//     [user?.id, fetchQueue]
//   );

//   // Leave/cancel queue position
//   const leaveQueue = useCallback(
//     async (markingJobId: string): Promise<boolean> => {
//       if (!user?.id) return false;

//       setState((prev) => ({ ...prev, loading: true, error: null }));
//       try {
//         const res = await fetch('/api/marking/queue/leave', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ markingJobId }),
//         });

//         if (!res.ok) {
//           throw new Error('Failed to leave queue');
//         }

//         await fetchQueue();
//         return true;
//       } catch (err) {
//         const errorMsg = err instanceof Error ? err.message : 'Unknown error';
//         setState((prev) => ({ ...prev, error: errorMsg }));
//         return false;
//       } finally {
//         setState((prev) => ({ ...prev, loading: false }));
//       }
//     },
//     [user?.id, fetchQueue]
//   );

//   // Get agent's current queue position(s)
//   const getAgentQueuePosition = useCallback(
//     async (markingJobId: string): Promise<number | null> => {
//       try {
//         const res = await fetch(
//           `/api/marking/queue/position/${markingJobId}`
//         );

//         if (!res.ok) {
//           return null;
//         }

//         const data = await res.json();
//         return data.queuePosition || null;
//       } catch (err) {
//         console.error('Error fetching queue position:', err);
//         return null;
//       }
//     },
//     []
//   );

//   // Poll queue for updates (real-time simulation)
//   useEffect(() => {
//     if (!user?.id || !user.isAvailableForMarking) return;

//     const interval = setInterval(() => {
//       fetchQueue();
//     }, 30000); // Poll every 30 seconds

//     return () => clearInterval(interval);
//   }, [user?.id, user?.isAvailableForMarking, fetchQueue]);

//   return {
//     queue: state.queue,
//     loading: state.loading,
//     error: state.error,
//     fetchQueue,
//     joinQueue,
//     leaveQueue,
//     getAgentQueuePosition,
//   };
// }












// // apps/platform/hooks/useMarkingQueue.ts
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import {
//   joinMarkingQueue,
//   leaveMarkingQueue,
//   getQueuePosition,
//   getQueueStatus,
//   getMyQueuePositions,
//   getQueueHistory,
//   isInQueue,
//   getQueueStats
// } from '@/lib/api/markingQueue';
// import type { JoinQueueRequest } from '@/types/queue';

// // Query keys
// export const queueKeys = {
//   all: ['marking-queue'] as const,
//   position: (jobId: string) => [...queueKeys.all, 'position', jobId] as const,
//   status: (jobId: string) => [...queueKeys.all, 'status', jobId] as const,
//   myPositions: () => [...queueKeys.all, 'my-positions'] as const,
//   history: (jobId: string) => [...queueKeys.all, 'history', jobId] as const,
//   check: (jobId: string) => [...queueKeys.all, 'check', jobId] as const,
//   stats: () => [...queueKeys.all, 'stats'] as const,
// };

// // Get queue position for a job
// export function useQueuePosition(jobId: string, enabled: boolean = true) {
//   return useQuery({
//     queryKey: queueKeys.position(jobId),
//     queryFn: () => getQueuePosition(jobId),
//     enabled: enabled && !!jobId,
//     staleTime: 15000, // 15 seconds
//     refetchInterval: 30000, // Refetch every 30 seconds
//   });
// }

// // Get queue status for a job
// export function useQueueStatus(jobId: string, enabled: boolean = true) {
//   return useQuery({
//     queryKey: queueKeys.status(jobId),
//     queryFn: () => getQueueStatus(jobId),
//     enabled: enabled && !!jobId,
//     staleTime: 10000, // 10 seconds
//     refetchInterval: 20000, // Refetch every 20 seconds
//   });
// }

// // Get all queue positions for current user
// export function useMyQueuePositions() {
//   return useQuery({
//     queryKey: queueKeys.myPositions(),
//     queryFn: getMyQueuePositions,
//     staleTime: 20000, // 20 seconds
//     refetchInterval: 30000, // Refetch every 30 seconds
//   });
// }

// // Get queue history for a job
// export function useQueueHistory(jobId: string, enabled: boolean = true) {
//   return useQuery({
//     queryKey: queueKeys.history(jobId),
//     queryFn: () => getQueueHistory(jobId),
//     enabled: enabled && !!jobId,
//     staleTime: 30000, // 30 seconds
//   });
// }

// // Check if user is in queue
// export function useIsInQueue(jobId: string, enabled: boolean = true) {
//   return useQuery({
//     queryKey: queueKeys.check(jobId),
//     queryFn: () => isInQueue(jobId),
//     enabled: enabled && !!jobId,
//     staleTime: 10000, // 10 seconds
//   });
// }

// // Get queue statistics
// export function useQueueStats() {
//   return useQuery({
//     queryKey: queueKeys.stats(),
//     queryFn: getQueueStats,
//     staleTime: 60000, // 1 minute
//   });
// }

// // Join queue mutation
// export function useJoinQueue(jobId: string) {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data?: JoinQueueRequest) => joinMarkingQueue(jobId, data),
//     onSuccess: (response) => {
//       toast.success(
//         `You've joined the queue at position ${response.data.positionInQueue}`
//       );
      
//       // Invalidate relevant queries
//       queryClient.invalidateQueries({ queryKey: queueKeys.position(jobId) });
//       queryClient.invalidateQueries({ queryKey: queueKeys.status(jobId) });
//       queryClient.invalidateQueries({ queryKey: queueKeys.myPositions() });
//       queryClient.invalidateQueries({ queryKey: queueKeys.check(jobId) });
//       queryClient.invalidateQueries({ queryKey: queueKeys.stats() });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || 'Failed to join queue');
//     },
//   });
// }

// // Leave queue mutation
// export function useLeaveQueue(jobId: string) {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: () => leaveMarkingQueue(jobId),
//     onSuccess: () => {
//       toast.success('You have left the queue');
      
//       // Invalidate relevant queries
//       queryClient.invalidateQueries({ queryKey: queueKeys.position(jobId) });
//       queryClient.invalidateQueries({ queryKey: queueKeys.status(jobId) });
//       queryClient.invalidateQueries({ queryKey: queueKeys.myPositions() });
//       queryClient.invalidateQueries({ queryKey: queueKeys.check(jobId) });
//       queryClient.invalidateQueries({ queryKey: queueKeys.stats() });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || 'Failed to leave queue');
//     },
//   });
// }

// // Helper hook to calculate estimated wait time
// export function useEstimatedWaitTime(jobId: string) {
//   const { data: queueStatus, isLoading } = useQueueStatus(jobId);

//   if (isLoading || !queueStatus?.data) {
//     return { waitTime: 0, formattedWaitTime: 'Calculating...', isReady: false };
//   }

//   const waitTime = queueStatus.data.averageWaitTime;
//   const hours = Math.floor(waitTime / 60);
//   const minutes = waitTime % 60;

//   let formattedWaitTime = '';
//   if (hours > 0) {
//     formattedWaitTime = `${hours}h ${minutes}m`;
//   } else {
//     formattedWaitTime = `${minutes}m`;
//   }

//   return { waitTime, formattedWaitTime, isReady: true };
// }

// // Helper hook to check if user's turn is coming soon
// export function useIsTurnSoon(jobId: string) {
//   const { data: position, isLoading } = useQueuePosition(jobId);

//   if (isLoading || !position) {
//     return { isSoon: false, position: 0, isActive: false };
//   }

//   const isSoon = position.position <= 3 && position.position > 1;
//   const isActive = position.position === 1 && position.status === 'ACTIVE';

//   return { isSoon, position: position.position, isActive };
// }

// // Helper hook for queue status badge
// export function useQueueStatusBadge(status: string): {
//   color: string;
//   label: string;
// } {
//   const statusConfig: Record<string, { color: string; label: string }> = {
//     WAITING: { color: 'bg-blue-100 text-blue-800', label: 'Waiting' },
//     ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Your Turn' },
//     EXPIRED: { color: 'bg-red-100 text-red-800', label: 'Expired' },
//     COMPLETED: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
//     CANCELLED: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
//     SKIPPED: { color: 'bg-yellow-100 text-yellow-800', label: 'Skipped' },
//   };

//   return statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
// }