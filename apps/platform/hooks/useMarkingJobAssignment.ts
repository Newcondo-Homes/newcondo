import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Types for job assignment operations
interface JobAssignmentRequest {
  markingJobId: string;
  agentId?: string; // Optional - for admin reassignment
  serviceOption: 'self' | 'newcondo' | 'known_person' | 'available_agents';
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface AssignedJob {
  id: string;
  propertyId: string;
  assignedAgentId: string;
  status: string; // QUEUED, ASSIGNED, IN_PROGRESS, COMPLETED
  queuePosition: number;
  timeSlotExpiry: Date;
  markingFee: number;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
}

interface QueuedJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  status: string;
  queuePosition: number;
  markingFee: number;
  urgencyLevel: string;
  createdAt: Date;
}

interface AssignmentResponse {
  success: boolean;
  message: string;
  job?: AssignedJob;
  error?: string;
}

interface ReassignmentRequest {
  markingJobId: string;
  newAgentId: string;
  reason?: string;
}

/**
 * Hook to handle marking job assignments to agents
 * Manages queue positioning, time slot management, and assignment logic
 */
export const useMarkingJobAssignment = () => {
  const { user } = useAuth();
  const [assignedJobs, setAssignedJobs] = useState<AssignedJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Fetch agent's assigned jobs
  const {
    data: myAssignedJobs = [],
    isLoading: isLoadingMyJobs,
    error: myJobsError,
    refetch: refetchMyJobs,
  } = useQuery({
    queryKey: ['myAssignedJobs', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/marking-jobs/my-assignments', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assigned jobs');
      }

      return (await response.json()) as AssignedJob[];
    },
    enabled: !!user?.id && user?.role === 'AGENT',
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
  });

  // Fetch available jobs in queue for current agent's service area
  const {
    data: queuedJobs = [],
    isLoading: isLoadingQueued,
    error: queuedError,
    refetch: refetchQueuedJobs,
  } = useQuery({
    queryKey: ['queuedJobs', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/marking-jobs/queue', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch queued jobs');
      }

      return (await response.json()) as QueuedJob[];
    },
    enabled: !!user?.id && user?.role === 'AGENT',
    staleTime: 1000 * 60 * 1, // 1 minute - refresh frequently for queue updates
    gcTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60, // Auto-refetch every minute
  });

  // Mutation: Accept/take a queued job
  const acceptJobMutation = useMutation({
    mutationFn: async (markingJobId: string) => {
      const response = await fetch('/api/marking-jobs/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markingJobId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept job');
      }

      return (await response.json()) as AssignmentResponse;
    },
    onSuccess: (data) => {
      if (data.job) {
        setAssignedJobs((prev) => [...prev, data.job as AssignedJob]);
        refetchMyJobs();
        refetchQueuedJobs();
      }
    },
  });

  // Mutation: Reject/decline a queued job
  const rejectJobMutation = useMutation({
    mutationFn: async (markingJobId: string) => {
      const response = await fetch('/api/marking-jobs/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markingJobId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject job');
      }

      return (await response.json()) as { success: boolean };
    },
    onSuccess: () => {
      refetchQueuedJobs();
    },
  });

  // Mutation: Assign job to specific agent (admin/property owner)
  const assignJobToAgentMutation = useMutation({
    mutationFn: async (request: JobAssignmentRequest) => {
      const response = await fetch('/api/marking-jobs/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign job');
      }

      return (await response.json()) as AssignmentResponse;
    },
    onSuccess: (data) => {
      refetchQueuedJobs();
      refetchMyJobs();
    },
  });

  // Mutation: Reassign job from one agent to another (admin only)
  const reassignJobMutation = useMutation({
    mutationFn: async (request: ReassignmentRequest) => {
      const response = await fetch('/api/marking-jobs/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to reassign job');
      }

      return (await response.json()) as AssignmentResponse;
    },
    onSuccess: () => {
      refetchMyJobs();
      refetchQueuedJobs();
    },
  });

  // Accept a job from the queue
  const acceptJob = useCallback(
    async (markingJobId: string) => {
      return acceptJobMutation.mutateAsync(markingJobId);
    },
    [acceptJobMutation]
  );

  // Reject a job from the queue
  const rejectJob = useCallback(
    async (markingJobId: string) => {
      return rejectJobMutation.mutateAsync(markingJobId);
    },
    [rejectJobMutation]
  );

  // Create and assign a new job (for property owners)
  const assignJobToAvailableAgents = useCallback(
    async (request: JobAssignmentRequest) => {
      return assignJobToAgentMutation.mutateAsync(request);
    },
    [assignJobToAgentMutation]
  );

  // Reassign job (admin only)
  const reassignJob = useCallback(
    async (markingJobId: string, newAgentId: string, reason?: string) => {
      return reassignJobMutation.mutateAsync({
        markingJobId,
        newAgentId,
        reason,
      });
    },
    [reassignJobMutation]
  );

  // Get current job details
  const getCurrentJobDetails = useCallback(() => {
    return myAssignedJobs.find((job) => job.id === selectedJobId);
  }, [myAssignedJobs, selectedJobId]);

  // Check if agent has available time slot for new job
  const hasAvailableTimeSlot = useCallback(() => {
    const activeJobs = myAssignedJobs.filter(
      (job) => job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS'
    );
    return activeJobs.length < 3; // Agents can handle max 3 concurrent jobs
  }, [myAssignedJobs]);

  // Get time remaining in current job's time slot
  const getRemainingTimeInSlot = useCallback((jobId: string): number => {
    const job = myAssignedJobs.find((j) => j.id === jobId);
    if (!job || !job.timeSlotExpiry) return 0;

    const now = new Date().getTime();
    const expiry = new Date(job.timeSlotExpiry).getTime();
    const remainingMs = expiry - now;

    return Math.max(0, remainingMs); // milliseconds
  }, [myAssignedJobs]);

  // Format time remaining as readable string (e.g., "2h 30m")
  const formatTimeRemaining = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  // Get sorted queued jobs (by urgency and position)
  const getSortedQueuedJobs = useCallback(() => {
    return [...queuedJobs].sort((a, b) => {
      const urgencyOrder: Record<string, number> = {
        URGENT: 0,
        HIGH: 1,
        NORMAL: 2,
        LOW: 3,
      };
      const urgencyDiff =
        (urgencyOrder[a.urgencyLevel] || 2) - (urgencyOrder[b.urgencyLevel] || 2);

      if (urgencyDiff !== 0) return urgencyDiff;
      return a.queuePosition - b.queuePosition;
    });
  }, [queuedJobs]);

  return {
    // Data
    myAssignedJobs,
    queuedJobs,
    sortedQueuedJobs: getSortedQueuedJobs(),
    selectedJobId,
    setSelectedJobId,

    // Loading states
    isLoadingMyJobs,
    isLoadingQueued,

    // Errors
    myJobsError,
    queuedError,

    // Mutations
    acceptJobMutation,
    rejectJobMutation,
    assignJobToAgentMutation,
    reassignJobMutation,

    // Actions
    acceptJob,
    rejectJob,
    assignJobToAvailableAgents,
    reassignJob,

    // Utilities
    getCurrentJobDetails,
    hasAvailableTimeSlot,
    getRemainingTimeInSlot,
    formatTimeRemaining,

    // Refetch
    refetchMyJobs,
    refetchQueuedJobs,
  };
};

export default useMarkingJobAssignment;