// apps/platform/hooks/useMarkingCompletion.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  startMarkingJob,
  uploadCompletionImages,
  submitBoundaryData,
  completeMarkingJob,
  getCompletionProgress,
  deleteCompletionImage,
  updateCompletionNotes,
  getCompletionData,
  saveDraft,
  getAgentCompletionStats
} from '@/lib/api/markingCompletion';
import type {
  UploadCompletionImagesRequest,
  SubmitBoundaryDataRequest,
  CompleteMarkingJobRequest
} from '@/types/marking';
import { markingJobKeys } from './useMarkingJobs';

// Query keys
export const completionKeys = {
  all: ['marking-completion'] as const,
  progress: (jobId: string) => [...completionKeys.all, 'progress', jobId] as const,
  data: (jobId: string) => [...completionKeys.all, 'data', jobId] as const,
  stats: () => [...completionKeys.all, 'stats'] as const,
};

// Get completion progress
export function useCompletionProgress(jobId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: completionKeys.progress(jobId),
    queryFn: () => getCompletionProgress(jobId),
    enabled: enabled && !!jobId,
    staleTime: 10000, // 10 seconds
  });
}

// Get completion data
export function useCompletionData(jobId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: completionKeys.data(jobId),
    queryFn: () => getCompletionData(jobId),
    enabled: enabled && !!jobId,
    staleTime: 15000, // 15 seconds
  });
}

// Get agent completion statistics
export function useAgentCompletionStats() {
  return useQuery({
    queryKey: completionKeys.stats(),
    queryFn: getAgentCompletionStats,
    staleTime: 60000, // 1 minute
  });
}

// Start marking job mutation
export function useStartMarkingJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startMarkingJob(jobId),
    onSuccess: () => {
      toast.success('Marking job started');
      queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: completionKeys.progress(jobId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start marking job');
    },
  });
}

// Upload completion images mutation
export function useUploadCompletionImages(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadCompletionImagesRequest) =>
      uploadCompletionImages(jobId, data),
    onSuccess: (response) => {
      toast.success(`${response.data.totalUploaded} images uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: completionKeys.progress(jobId) });
      queryClient.invalidateQueries({ queryKey: completionKeys.data(jobId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload images');
    },
  });
}

// Submit boundary data mutation
export function useSubmitBoundaryData(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitBoundaryDataRequest) => submitBoundaryData(jobId, data),
    onSuccess: () => {
      toast.success('Boundary data submitted successfully');
      queryClient.invalidateQueries({ queryKey: completionKeys.progress(jobId) });
      queryClient.invalidateQueries({ queryKey: completionKeys.data(jobId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit boundary data');
    },
  });
}

// Complete marking job mutation
export function useCompleteMarkingJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteMarkingJobRequest) => completeMarkingJob(jobId, data),
    onSuccess: (response) => {
      toast.success('Marking job completed successfully!');
      
      // Show payment info if available
      if (response.paymentInfo) {
        toast.info(
          `Partial payment of ₦${response.paymentInfo.partialPayment.toLocaleString()} credited. Remaining payment will be released after owner confirmation.`
        );
      }

      queryClient.invalidateQueries({ queryKey: markingJobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: markingJobKeys.myAssignments() });
      queryClient.invalidateQueries({ queryKey: completionKeys.progress(jobId) });
      queryClient.invalidateQueries({ queryKey: completionKeys.data(jobId) });
      queryClient.invalidateQueries({ queryKey: completionKeys.stats() });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete marking job');
    },
  });
}

// Delete completion image mutation
export function useDeleteCompletionImage(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => deleteCompletionImage(jobId, imageId),
    onSuccess: () => {
      toast.success('Image deleted successfully');
      queryClient.invalidateQueries({ queryKey: completionKeys.progress(jobId) });
      queryClient.invalidateQueries({ queryKey: completionKeys.data(jobId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete image');
    },
  });
}

// Update completion notes mutation
export function useUpdateCompletionNotes(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notes: string) => updateCompletionNotes(jobId, notes),
    onSuccess: () => {
      toast.success('Notes updated successfully');
      queryClient.invalidateQueries({ queryKey: completionKeys.data(jobId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update notes');
    },
  });
}

// Save draft mutation
export function useSaveDraft(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CompleteMarkingJobRequest>) => saveDraft(jobId, data),
    onSuccess: () => {
      toast.success('Draft saved successfully');
      queryClient.invalidateQueries({ queryKey: completionKeys.data(jobId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save draft');
    },
  });
}

// Helper hook to check if job can be completed
export function useCanCompleteJob(jobId: string) {
  const { data: progress, isLoading } = useCompletionProgress(jobId);

  if (isLoading || !progress) {
    return { canComplete: false, missingSteps: [], isReady: false };
  }

  return {
    canComplete: progress.canComplete,
    missingSteps: progress.missingSteps,
    isReady: true,
  };
}

// Helper hook to track completion percentage
export function useCompletionPercentage(jobId: string) {
  const { data: progress, isLoading } = useCompletionProgress(jobId);

  if (isLoading || !progress) {
    return { percentage: 0, isComplete: false };
  }

  let completedSteps = 0;
  const totalSteps = 3; // Images, Boundary, Notes

  if (progress.imagesUploaded >= progress.requiredImages) completedSteps++;
  if (progress.boundarySubmitted) completedSteps++;
  if (progress.notesProvided) completedSteps++;

  const percentage = Math.round((completedSteps / totalSteps) * 100);
  const isComplete = percentage === 100;

  return { percentage, isComplete, completedSteps, totalSteps };
}