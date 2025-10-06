import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';

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

export function useDispute() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's disputes
  const fetchDisputes = (params: DisputeListParams = {}) => {
    return useQuery({
      queryKey: ['disputes', params],
      queryFn: async () => {
        const response = await api.get('/disputes', { params });
        return response.data;
      },
    });
  };

  // Fetch single dispute details
  const fetchDispute = (disputeId?: string) => {
    return useQuery({
      queryKey: ['dispute', disputeId],
      queryFn: async () => {
        if (!disputeId) return null;
        const response = await api.get(`/disputes/${disputeId}`);
        return response.data;
      },
      enabled: !!disputeId,
    });
  };

  // Create new dispute
  const createDisputeMutation = useMutation({
    mutationFn: async (data: CreateDisputeData) => {
      const formData = new FormData();
      formData.append('rentalId', data.rentalId);
      formData.append('paymentId', data.paymentId);
      formData.append('reason', data.reason);
      formData.append('description', data.description);
      formData.append('preferredResolution', data.preferredResolution);
      
      if (data.evidence && data.evidence.length > 0) {
        data.evidence.forEach((file) => {
          formData.append('evidence', file);
        });
      }

      const response = await api.post<DisputeResponse>('/disputes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['confirmation-status'] });
      
      toast({
        title: 'Dispute Created',
        description: 'Your dispute has been submitted successfully. We will review it within 24 hours.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Create Dispute',
        description: error.response?.data?.message || 'An error occurred while creating the dispute.',
        variant: 'destructive',
      });
    },
  });

  // Update existing dispute
  const updateDisputeMutation = useMutation({
    mutationFn: async (data: UpdateDisputeData) => {
      const formData = new FormData();
      
      if (data.additionalInfo) {
        formData.append('additionalInfo', data.additionalInfo);
      }
      
      if (data.additionalEvidence && data.additionalEvidence.length > 0) {
        data.additionalEvidence.forEach((file) => {
          formData.append('additionalEvidence', file);
        });
      }

      const response = await api.patch<DisputeResponse>(
        `/disputes/${data.disputeId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute', data.id] });
      
      toast({
        title: 'Dispute Updated',
        description: 'Your dispute has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.message || 'Failed to update dispute.',
        variant: 'destructive',
      });
    },
  });

  // Cancel dispute
  const cancelDisputeMutation = useMutation({
    mutationFn: async (disputeId: string) => {
      const response = await api.post(`/disputes/${disputeId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      
      toast({
        title: 'Dispute Cancelled',
        description: 'Your dispute has been cancelled.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.response?.data?.message || 'Failed to cancel dispute.',
        variant: 'destructive',
      });
    },
  });

  return {
    // Queries
    fetchDisputes,
    fetchDispute,
    
    // Mutations
    createDispute: createDisputeMutation.mutate,
    updateDispute: updateDisputeMutation.mutate,
    cancelDispute: cancelDisputeMutation.mutate,
    
    // Loading states
    isCreating: createDisputeMutation.isPending,
    isUpdating: updateDisputeMutation.isPending,
    isCancelling: cancelDisputeMutation.isPending,
    
    // Error states
    createError: createDisputeMutation.error,
    updateError: updateDisputeMutation.error,
    cancelError: cancelDisputeMutation.error,
  };
}