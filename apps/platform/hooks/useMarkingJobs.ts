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










// // apps/platform/hooks/useMarkingJobs.ts
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import {
//   getMarkingJobs,
//   getMarkingJobById,
//   createMarkingJob,
//   updateMarkingJob,
//   cancelMarkingJob,
//   getMarkingJobStats,
//   getAvailableMarkingJobs,
//   acceptMarkingJob,
//   rejectMarkingJob,
//   getMyAssignedJobs,
//   getMyRequestedJobs,
//   getJobTimeSlot
// } from '@/lib/api/marking';
// import type {
//   MarkingJob,
//   CreateMarkingJobRequest,
//   UpdateMarkingJobRequest
// } from '@/types/marking';

// // Query keys
// export const markingJobKeys = {
//   all: ['marking-jobs'] as const,
//   lists: () => [...markingJobKeys.all, 'list'] as const,
//   list: (filters?: any) => [...markingJobKeys.lists(), filters] as const,
//   details: () => [...markingJobKeys.all, 'detail'] as const,
//   detail: (id: string) => [...markingJobKeys.details(), id] as const,
//   stats: () => [...markingJobKeys.all, 'stats'] as const,
//   available: (lat: number, lng: number, radius: number) =>
//     [...markingJobKeys.all, 'available', lat, lng, radius] as const,
//   myAssignments: () => [...markingJobKeys.all, 'my-assignments'] as const,
//   myRequests: () => [...markingJobKeys.all, 'my-requests'] as const,
//   timeSlot: (id: string) => [...markingJobKeys.all, 'time-slot', id] as const,
// };

// // Fetch marking jobs list
// export function useMarkingJobs(filters?: {
//   status?: string;
//   propertyId?: string;
//   page?: number;
//   limit?: number;
// }) {
//   return useQuery({
//     queryKey: markingJobKeys.list(filters),
//     queryFn: () => getMarkingJobs(filters),
//     staleTime: 30000, // 30 seconds
//   });
// }

// // Fetch single marking job
// export function useMarkingJob(jobId: string, enabled: boolean = true) {
//   return useQuery({
//     queryKey: markingJobKeys.detail(jobId),
//     queryFn: () => getMarkingJobById(jobId),
//     enabled: enabled && !!jobId,
//     staleTime: 10000, // 10 seconds
//   });
// }

// // Fetch marking job statistics
// export function useMarkingJobStats() {
//   return useQuery({
//     queryKey: markingJobKeys.stats(),
//     queryFn: getMarkingJobStats,
//     staleTime: 60000, // 1 minute
//   });
// }

// // Fetch available marking jobs for agents
// export function useAvailableMarkingJobs(
//   latitude: number,
//   longitude: number,
//   radius: number = 10,
//   enabled: boolean = true
// ) {
//   return useQuery({
//     queryKey: markingJobKeys.available(latitude, longitude, radius),
//     queryFn: () => getAvailableMarkingJobs(latitude, longitude, radius),
//     enabled: enabled && !!latitude && !!longitude,
//     staleTime: 30000, // 30 seconds
//     refetchInterval: 60000, // Refetch every minute for new jobs
//   });
// }

// // Fetch agent's assigned jobs
// export function useMyAssignedJobs() {
//   return useQuery({
//     queryKey: markingJobKeys.myAssignments(),
//     queryFn: getMyAssignedJobs,
//     staleTime: 20000, // 20 seconds
//     refetchInterval: 30000, // Refetch every 30 seconds
//   });
// }

// // Fetch user's requested jobs
// export function useMyRequestedJobs() {
//   return useQuery({
//     queryKey: markingJobKeys.myRequests(),
//     queryFn: getMyRequestedJobs,
//     staleTime: 20000, // 20 seconds
//   });
// }

// // Fetch job time slot information
// export function useJobTimeSlot(jobId: string, enabled: boolean = true) {
//   return useQuery({
//     queryKey: markingJobKeys.timeSlot(jobId),
//     queryFn: () => getJobTimeSlot(jobId),
//     enabled: enabled && !!jobId,
//     staleTime: 10000, // 10 seconds
//     refetchInterval: 30000, // Update every 30 seconds
//   });
// }

// // Create marking job mutation
// export function useCreateMarkingJob() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: CreateMarkingJobRequest) => createMarkingJob(data),
//     onSuccess: (response) => {
//       toast.success('Marking job created successfully');
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.myRequests() });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.stats() });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || 'Failed to create marking job');
//     },
//   });
// }

// // Update marking job mutation
// export function useUpdateMarkingJob(jobId: string) {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: UpdateMarkingJobRequest) => updateMarkingJob(jobId, data),
//     onSuccess: (response) => {
//       toast.success('Marking job updated successfully');
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.myRequests() });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || 'Failed to update marking job');
//     },
//   });
// }

// // Cancel marking job mutation
// export function useCancelMarkingJob() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (jobId: string) => cancelMarkingJob(jobId),
//     onSuccess: (response, jobId) => {
//       toast.success('Marking job cancelled successfully');
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.myRequests() });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.stats() });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || 'Failed to cancel marking job');
//     },
//   });
// }

// // Accept marking job mutation (for agents)
// export function useAcceptMarkingJob() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (jobId: string) => acceptMarkingJob(jobId),
//     onSuccess: (response, jobId) => {
//       toast.success('Marking job accepted successfully');
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.available() });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.myAssignments() });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || 'Failed to accept marking job');
//     },
//   });
// }

// // Reject marking job mutation (for agents)
// export function useRejectMarkingJob() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ jobId, reason }: { jobId: string; reason?: string }) =>
//       rejectMarkingJob(jobId, reason),
//     onSuccess: (response, { jobId }) => {
//       toast.success('Marking job rejected');
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
//       queryClient.invalidateQueries({ queryKey: markingJobKeys.myAssignments() });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || 'Failed to reject marking job');
//     },
//   });
// }

// // Helper hook to check if job is expiring soon
// export function useJobExpiryStatus(jobId: string) {
//   const { data: timeSlot, isLoading } = useJobTimeSlot(jobId);

//   if (isLoading || !timeSlot) {
//     return { isExpiringSoon: false, minutesRemaining: 0, isExpired: false };
//   }

//   const minutesRemaining = Math.floor(timeSlot.remainingTime / 60);
//   const isExpiringSoon = minutesRemaining <= 30 && minutesRemaining > 0;
//   const isExpired = timeSlot.isExpired;

//   return { isExpiringSoon, minutesRemaining, isExpired };
// }

// // Helper hook for job status badge color
// export function useJobStatusColor(status: string): string {
//   const statusColors: Record<string, string> = {
//     QUEUED: 'bg-blue-100 text-blue-800',
//     ASSIGNED: 'bg-purple-100 text-purple-800',
//     IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
//     COMPLETED: 'bg-green-100 text-green-800',
//     CANCELLED: 'bg-gray-100 text-gray-800',
//     EXPIRED: 'bg-red-100 text-red-800',
//   };

//   return statusColors[status] || 'bg-gray-100 text-gray-800';
// }














// // apps/platform/hooks/useMarkingJobs.ts
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//   createMarkingJob,
//   acceptMarkingJob,
//   completeMarkingJob,
//   cancelMarkingJob,
//   confirmMarkingCompletion,
// } from '@/lib/api/markingHistory';
// import { useToast } from '@/hooks/useToast';
// import { useRouter } from 'next/navigation';

// export interface CreateMarkingJobData {
//   propertyId: string;
//   assignmentType: 'SELF' | 'NEWCONDO_ADMIN' | 'SEND_LINK' | 'ASSIGN_AGENTS';
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
//   shareableLink?: string; // For 'SEND_LINK' option
// }

// export interface CompleteMarkingData {
//   completionNotes?: string;
//   completionImages: string[];
//   boundaryCoordinates: any;
//   buildingFingerprint?: string;
// }

// export const useMarkingJobs = () => {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();
//   const router = useRouter();

//   // Create marking job mutation
//   const createJobMutation = useMutation({
//     mutationFn: (data: CreateMarkingJobData) => createMarkingJob(data),
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['marking-history'] });
//       queryClient.invalidateQueries({ queryKey: ['property-management'] });
      
//       toast({
//         title: 'Success',
//         description: 'Marking job created successfully',
//       });
      
//       // Redirect to marking job details or payment
//       if (data.jobId) {
//         router.push(`/dashboard/marking-jobs/${data.jobId}`);
//       }
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to create marking job',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Accept marking job mutation (for agents)
//   const acceptJobMutation = useMutation({
//     mutationFn: (jobId: string) => acceptMarkingJob(jobId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['marking-history'] });
//       queryClient.invalidateQueries({ queryKey: ['agent-queue'] });
      
//       toast({
//         title: 'Success',
//         description: 'Marking job accepted. You have 3 hours to complete it.',
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to accept marking job',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Complete marking job mutation (for agents)
//   const completeJobMutation = useMutation({
//     mutationFn: ({ jobId, data }: { jobId: string; data: CompleteMarkingData }) =>
//       completeMarkingJob(jobId, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['marking-history'] });
//       queryClient.invalidateQueries({ queryKey: ['marking-job-details'] });
//       queryClient.invalidateQueries({ queryKey: ['agent-queue'] });
      
//       toast({
//         title: 'Success',
//         description: 'Marking job completed. Awaiting property owner confirmation.',
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to complete marking job',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Cancel marking job mutation
//   const cancelJobMutation = useMutation({
//     mutationFn: ({ jobId, reason }: { jobId: string; reason?: string }) =>
//       cancelMarkingJob(jobId, reason),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['marking-history'] });
//       queryClient.invalidateQueries({ queryKey: ['marking-job-details'] });
      
//       toast({
//         title: 'Success',
//         description: 'Marking job cancelled successfully',
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to cancel marking job',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Confirm marking completion mutation (for property owners)
//   const confirmCompletionMutation = useMutation({
//     mutationFn: ({ jobId, approved, feedback }: { 
//       jobId: string; 
//       approved: boolean;
//       feedback?: string;
//     }) => confirmMarkingCompletion(jobId, approved, feedback),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({ queryKey: ['marking-history'] });
//       queryClient.invalidateQueries({ queryKey: ['marking-job-details'] });
//       queryClient.invalidateQueries({ queryKey: ['property-details'] });
      
//       toast({
//         title: 'Success',
//         description: variables.approved 
//           ? 'Marking confirmed. Payment released to agent.'
//           : 'Marking rejected. Feedback sent to agent.',
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to confirm marking completion',
//         variant: 'destructive',
//       });
//     },
//   });

//   return {
//     // Actions
//     createJob: createJobMutation.mutate,
//     createJobAsync: createJobMutation.mutateAsync,
//     acceptJob: acceptJobMutation.mutate,
//     completeJob: completeJobMutation.mutate,
//     cancelJob: cancelJobMutation.mutate,
//     confirmCompletion: confirmCompletionMutation.mutate,
    
//     // States
//     isCreating: createJobMutation.isPending,
//     isAccepting: acceptJobMutation.isPending,
//     isCompleting: completeJobMutation.isPending,
//     isCancelling: cancelJobMutation.isPending,
//     isConfirming: confirmCompletionMutation.isPending,
    
//     // Data
//     createdJob: createJobMutation.data,
    
//     // Errors
//     createError: createJobMutation.error,
//     acceptError: acceptJobMutation.error,
//     completeError: completeJobMutation.error,
//     cancelError: cancelJobMutation.error,
//     confirmError: confirmCompletionMutation.error,
//   };
// };