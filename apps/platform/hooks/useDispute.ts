'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@newcondo/ui';
import { disputesApi } from '@/lib/api/disputes';

import type {
  DisputeRequest,
  DisputeStatus,
} from '@/types/dispute';

interface UpdateDisputeData {
  disputeId: string;
  additionalInfo?: string;
  additionalEvidence?: File[];
}


interface CreateDisputeData {
  rentalId: string;
  paymentId: string;
  reason: string;
  description: string;
  evidence?: File[];
  preferredResolution: 'REFUND' | 'PARTIAL_REFUND' | 'PROPERTY_FIX';
}

interface UpdateDisputeData {
  disputeId: string;
  additionalInfo?: string;
  additionalEvidence?: File[];
}

interface DisputeResponse {
  id: string;
  rentalId: string;
  paymentId: string;
  status: string;
  reason: string;
  description: string;
  evidenceUrls: string[];
  createdAt: string;
  updatedAt: string;
}

interface DisputeListParams {
  status?: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  page?: number;
  limit?: number;
}

export function useDispute(disputeId?: string) {
  const queryClient = useQueryClient();

  const {
    data: disputesData,
    isLoading: isLoadingDisputes,
    error: disputesError,
  } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => disputesApi.getMyDisputes(),
  });

  const {
    data: dispute,
    isLoading: isLoadingDispute,
    error: disputeError,
  } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => disputesApi.getDispute(disputeId!),
    enabled: !!disputeId,
  });

  // Create new dispute
  const createDisputeMutation = useMutation({
    mutationFn: (data: DisputeRequest) => disputesApi.createDispute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['confirmation-status'] });

      toast.success('Dispute Created', {
        description: 'Your dispute has been submitted successfully. We will review it within 24 hours.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Create Dispute', {
        description: error.response?.data?.message || 'An error occurred while creating the dispute.',
      });
    },
  });

  const uploadEvidenceMutation = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      disputesApi.uploadEvidence(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      toast.success('Evidence Uploaded', {
        description: 'Your evidence has been added to the dispute.',
      });
    },
    onError: (error: any) => {
      toast.error('Upload Failed', {
        description: error?.message || 'Failed to upload evidence.',
      });
    },
  });

  // Update existing dispute
  const updateDisputeMutation = useMutation({
    mutationFn: async (data: UpdateDisputeData) => {
      await Promise.all([
        data.additionalInfo
          ? disputesApi.addComment(data.disputeId, data.additionalInfo)
          : Promise.resolve(null),
        data.additionalEvidence?.length
          ? disputesApi.uploadEvidence(data.disputeId, data.additionalEvidence)
          : Promise.resolve(null),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });

      toast.success('Dispute Updated', {
        description: 'Your dispute has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast.error('Update Failed', {
        description: error?.message || 'Failed to update dispute.',
      });
    },
  });

  // Cancel dispute
  const cancelDisputeMutation = useMutation({
    mutationFn: (id: string) => disputesApi.cancelDispute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      toast.success('Dispute Cancelled', {
        description: 'Your dispute has been cancelled.',
      });
    },
    onError: (error: any) => {
      toast.error('Cancellation Failed', {
        description: error.response?.data?.message || 'Failed to cancel dispute.',
      });
    },
  });


   const acceptResolutionMutation = useMutation({
    mutationFn: (id: string) => disputesApi.acceptResolution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      toast.success('Resolution Accepted', {
        description: 'You have accepted the dispute resolution.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Accept Resolution', {
        description: error?.message || 'Failed to accept resolution.',
      });
    },
  });


  return {
    // Queries
    disputes: disputesData?.disputes ?? [],
    disputesTotal: disputesData?.total ?? 0,
    dispute,

    // Loading states
    isLoadingDisputes,
    isLoadingDispute,
    isCreating: createDisputeMutation.isPending,
    isUpdating: updateDisputeMutation.isPending,
    isCancelling: cancelDisputeMutation.isPending,
    isUploadingEvidence: uploadEvidenceMutation.isPending,
    isAcceptingResolution: acceptResolutionMutation.isPending,

    // Actions
    createDispute: createDisputeMutation.mutate,
    updateDispute: updateDisputeMutation.mutate,
    cancelDispute: cancelDisputeMutation.mutate,
    uploadEvidence: uploadEvidenceMutation.mutate,
    acceptResolution: acceptResolutionMutation.mutate,

    // Error states
    disputesError,
    disputeError,
    createError: createDisputeMutation.error,
    updateError: updateDisputeMutation.error,
    cancelError: cancelDisputeMutation.error,
  };
}