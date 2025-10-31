// apps/admin/src/hooks/useMarkingJobs.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { markingJobsApi } from '@/lib/api/markingJobs';
import { useMarkingJobStore } from '@/store/markingJobStore';
import { MarkingJobStatus } from '@newcondo/db';

interface MarkingJobFilters {
  page?: number;
  limit?: number;
  status?: MarkingJobStatus;
  agentId?: string;
  propertyId?: string;
  urgent?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface QualityReview {
  boundaryAccuracy: number;
  imageQuality: number;
  completeness: number;
  timeliness: number;
  notes?: string;
  actionRequired?: 'NONE' | 'MINOR_CORRECTION' | 'MAJOR_REWORK' | 'AGENT_WARNING' | 'AGENT_SUSPENSION';
}

export const useMarkingJobs = (filters?: MarkingJobFilters) => {
  const queryClient = useQueryClient();
  const { setSelectedJob } = useMarkingJobStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch marking jobs
   */
  const {
    data: jobsData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['markingJobs', filters],
    queryFn: () => markingJobsApi.getMarkingJobs(filters),
    staleTime: 20000, // 20 seconds - more frequent updates for jobs
  });

  /**
   * Fetch single job details
   */
  const useJobDetails = (jobId: string) => {
    return useQuery({
      queryKey: ['markingJob', jobId],
      queryFn: () => markingJobsApi.getJobById(jobId),
      enabled: !!jobId,
    });
  };

  /**
   * Assign job to agent mutation
   */
  const assignJobMutation = useMutation({
    mutationFn: ({ 
      jobId, 
      agentId, 
      prioritize 
    }: { 
      jobId: string; 
      agentId: string; 
      prioritize?: boolean;
    }) => markingJobsApi.assignJob(jobId, agentId, prioritize),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to assign job');
    }
  });

  /**
   * Review job completion mutation
   */
  const reviewJobMutation = useMutation({
    mutationFn: ({ 
      jobId, 
      approved, 
      qualityScore, 
      feedback,
      requiresRework,
      reworkInstructions
    }: { 
      jobId: string; 
      approved: boolean; 
      qualityScore?: number;
      feedback?: string;
      requiresRework?: boolean;
      reworkInstructions?: string;
    }) => markingJobsApi.reviewJob(jobId, approved, qualityScore, feedback, requiresRework, reworkInstructions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to review job');
    }
  });

  /**
   * Quality audit mutation
   */
  const qualityAuditMutation = useMutation({
    mutationFn: ({ 
      jobId, 
      review 
    }: { 
      jobId: string; 
      review: QualityReview;
    }) => markingJobsApi.qualityAudit(jobId, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to perform quality audit');
    }
  });

  /**
   * Reassign job mutation
   */
  const reassignJobMutation = useMutation({
    mutationFn: ({ 
      jobId, 
      newAgentId, 
      reason 
    }: { 
      jobId: string; 
      newAgentId: string; 
      reason: string;
    }) => markingJobsApi.reassignJob(jobId, newAgentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to reassign job');
    }
  });

  /**
   * Cancel job mutation
   */
  const cancelJobMutation = useMutation({
    mutationFn: ({ 
      jobId, 
      reason 
    }: { 
      jobId: string; 
      reason: string;
    }) => markingJobsApi.cancelJob(jobId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
    }
  });

  /**
   * Extend job deadline mutation
   */
  const extendDeadlineMutation = useMutation({
    mutationFn: ({ 
      jobId, 
      hours, 
      reason 
    }: { 
      jobId: string; 
      hours: number; 
      reason: string;
    }) => markingJobsApi.extendDeadline(jobId, hours, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to extend deadline');
    }
  });

  /**
   * Suspend agent mutation
   */
  const suspendAgentMutation = useMutation({
    mutationFn: ({ 
      agentId, 
      days, 
      reason,
      permanentBan
    }: { 
      agentId: string; 
      days: number; 
      reason: string;
      permanentBan?: boolean;
    }) => markingJobsApi.suspendAgent(agentId, days, reason, permanentBan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to suspend agent');
    }
  });

  /**
   * Assign job to agent
   */
  const assignJob = useCallback(async (
    jobId: string,
    agentId: string,
    prioritize?: boolean
  ) => {
    setError(null);
    return assignJobMutation.mutateAsync({ jobId, agentId, prioritize });
  }, [assignJobMutation]);

  /**
   * Review job completion
   */
  const reviewJob = useCallback(async (
    jobId: string,
    approved: boolean,
    qualityScore?: number,
    feedback?: string,
    requiresRework?: boolean,
    reworkInstructions?: string
  ) => {
    setError(null);
    return reviewJobMutation.mutateAsync({ 
      jobId, 
      approved, 
      qualityScore, 
      feedback,
      requiresRework,
      reworkInstructions
    });
  }, [reviewJobMutation]);

  /**
   * Perform quality audit
   */
  const performQualityAudit = useCallback(async (
    jobId: string,
    review: QualityReview
  ) => {
    setError(null);
    return qualityAuditMutation.mutateAsync({ jobId, review });
  }, [qualityAuditMutation]);

  /**
   * Reassign job to different agent
   */
  const reassignJob = useCallback(async (
    jobId: string,
    newAgentId: string,
    reason: string
  ) => {
    setError(null);
    return reassignJobMutation.mutateAsync({ jobId, newAgentId, reason });
  }, [reassignJobMutation]);

  /**
   * Cancel job
   */
  const cancelJob = useCallback(async (
    jobId: string,
    reason: string
  ) => {
    setError(null);
    return cancelJobMutation.mutateAsync({ jobId, reason });
  }, [cancelJobMutation]);

  /**
   * Extend job deadline
   */
  const extendDeadline = useCallback(async (
    jobId: string,
    hours: number,
    reason: string
  ) => {
    setError(null);
    return extendDeadlineMutation.mutateAsync({ jobId, hours, reason });
  }, [extendDeadlineMutation]);

  /**
   * Suspend agent from marking jobs
   */
  const suspendAgent = useCallback(async (
    agentId: string,
    days: number,
    reason: string,
    permanentBan?: boolean
  ) => {
    setError(null);
    return suspendAgentMutation.mutateAsync({ agentId, days, reason, permanentBan });
  }, [suspendAgentMutation]);

  /**
   * Get agent performance metrics
   */
  const getAgentPerformance = useCallback(async (agentId: string) => {
    try {
      const response = await markingJobsApi.getAgentPerformance(agentId);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent performance');
      return null;
    }
  }, []);

  return {
    // Data
    jobs: jobsData?.data?.jobs || [],
    pagination: jobsData?.data?.pagination,
    statistics: jobsData?.data?.statistics,
    queueStatus: jobsData?.data?.queueStatus,
    
    // Loading states
    isLoading,
    isFetching,
    
    // Mutations loading states
    isAssigning: assignJobMutation.isPending,
    isReviewing: reviewJobMutation.isPending,
    isAuditing: qualityAuditMutation.isPending,
    isReassigning: reassignJobMutation.isPending,
    isCancelling: cancelJobMutation.isPending,
    isExtending: extendDeadlineMutation.isPending,
    isSuspending: suspendAgentMutation.isPending,
    
    // Actions
    assignJob,
    reviewJob,
    performQualityAudit,
    reassignJob,
    cancelJob,
    extendDeadline,
    suspendAgent,
    getAgentPerformance,
    refetch,
    
    // Job details hook
    useJobDetails,
    
    // State
    error,
    clearError: () => setError(null)
  };
};