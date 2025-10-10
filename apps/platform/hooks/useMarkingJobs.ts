// apps/platform/hooks/useMarkingJobs.ts
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MarkingJobData {
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  markingType: 'SELF' | 'NEWCONDO_ADMIN' | 'SHAREABLE_LINK' | 'ASSIGN_AGENT';
}

interface MarkingJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: string;
  markingFee: number;
  paymentStatus: string;
  status: string;
  assignedAt?: Date;
  completedAt?: Date;
  timeSlotExpiry?: Date;
  completionNotes?: string;
  completionImages: string[];
  boundaryData?: any;
  queuePosition?: number;
  maxCompletionTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function useMarkingJobs() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's marking jobs
  const {
    data: markingJobs,
    isLoading,
    error,
    refetch
  } = useQuery<MarkingJob[]>({
    queryKey: ['markingJobs'],
    queryFn: async () => {
      const res = await fetch('/api/marking-jobs', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch marking jobs');
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // Fetch single marking job
  const fetchMarkingJob = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/marking-jobs/${jobId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch marking job');
    return res.json();
  }, []);

  // Create marking job
  const createMarkingJob = useMutation({
    mutationFn: async (data: MarkingJobData) => {
      setIsSubmitting(true);
      const res = await fetch('/api/marking-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create marking job');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      toast.success('Marking job created successfully');
      setIsSubmitting(false);
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  // Cancel marking job
  const cancelMarkingJob = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/marking-jobs/${jobId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel marking job');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      toast.success('Marking job cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Confirm marking completion
  const confirmMarking = useMutation({
    mutationFn: async ({ jobId, approved, notes }: { 
      jobId: string; 
      approved: boolean; 
      notes?: string 
    }) => {
      const res = await fetch(`/api/marking-jobs/${jobId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved, notes }),
      });
      if (!res.ok) throw new Error('Failed to confirm marking');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      toast.success(
        variables.approved 
          ? 'Marking confirmed successfully' 
          : 'Marking rejected. Agent will be notified.'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Complete marking (for agents)
  const completeMarking = useMutation({
    mutationFn: async ({ 
      jobId, 
      boundaryData, 
      images, 
      notes 
    }: { 
      jobId: string; 
      boundaryData: any; 
      images: string[]; 
      notes?: string 
    }) => {
      const res = await fetch(`/api/marking-jobs/${jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ boundaryData, images, notes }),
      });
      if (!res.ok) throw new Error('Failed to complete marking');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['agentJobs'] });
      toast.success('Marking completed! Waiting for property owner confirmation.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Get marking job by property
  const getJobByProperty = useCallback(
    (propertyId: string) => {
      return markingJobs?.find(job => job.propertyId === propertyId);
    },
    [markingJobs]
  );

  // Get pending jobs
  const pendingJobs = markingJobs?.filter(
    job => job.status === 'QUEUED' || job.status === 'ASSIGNED'
  ) || [];

  // Get completed jobs
  const completedJobs = markingJobs?.filter(
    job => job.status === 'COMPLETED'
  ) || [];

  return {
    markingJobs,
    pendingJobs,
    completedJobs,
    isLoading,
    error,
    isSubmitting,
    refetch,
    fetchMarkingJob,
    createMarkingJob: createMarkingJob.mutateAsync,
    cancelMarkingJob: cancelMarkingJob.mutateAsync,
    confirmMarking: confirmMarking.mutateAsync,
    completeMarking: completeMarking.mutateAsync,
    getJobByProperty,
  };
}