import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';

interface ConfirmationData {
  rentalId: string;
  isConfirmed: boolean;
  notes?: string;
  images?: string[];
}

interface ConfirmationResponse {
  success: boolean;
  message: string;
  rental: {
    id: string;
    isConfirmed: boolean;
    confirmedAt?: string;
    confirmationDeadline?: string;
  };
}

interface DisputeData {
  rentalId: string;
  reason: string;
  description: string;
  evidence?: string[];
}

export function useConfirmation(rentalId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch confirmation status
  const {
    data: confirmationStatus,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery({
    queryKey: ['confirmation-status', rentalId],
    queryFn: async () => {
      if (!rentalId) return null;
      const response = await api.get(`/confirmations/${rentalId}/status`);
      return response.data;
    },
    enabled: !!rentalId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Submit property confirmation
  const confirmPropertyMutation = useMutation({
    mutationFn: async (data: ConfirmationData) => {
      const response = await api.post<ConfirmationResponse>(
        '/confirmations/confirm',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['confirmation-status'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      toast({
        title: 'Property Confirmed',
        description: 'Your confirmation has been submitted successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Confirmation Failed',
        description: error.response?.data?.message || 'Failed to submit confirmation.',
        variant: 'destructive',
      });
    },
  });

  // Reject/Dispute property
  const rejectPropertyMutation = useMutation({
    mutationFn: async (data: DisputeData) => {
      const response = await api.post<ConfirmationResponse>(
        '/confirmations/reject',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confirmation-status'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      
      toast({
        title: 'Dispute Submitted',
        description: 'Your dispute has been submitted. Our team will review it shortly.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.response?.data?.message || 'Failed to submit dispute.',
        variant: 'destructive',
      });
    },
  });

  // Get time remaining for confirmation
  const getTimeRemaining = () => {
    if (!confirmationStatus?.confirmationDeadline) return null;
    
    const deadline = new Date(confirmationStatus.confirmationDeadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      expired: false,
      hours,
      minutes,
      totalMilliseconds: diff,
    };
  };

  // Check if confirmation period is active
  const isConfirmationPeriodActive = () => {
    const timeRemaining = getTimeRemaining();
    return timeRemaining && !timeRemaining.expired;
  };

  return {
    // Data
    confirmationStatus,
    isLoadingStatus,
    statusError,
    
    // Mutations
    confirmProperty: confirmPropertyMutation.mutate,
    rejectProperty: rejectPropertyMutation.mutate,
    isConfirming: confirmPropertyMutation.isPending,
    isRejecting: rejectPropertyMutation.isPending,
    
    // Helpers
    getTimeRemaining,
    isConfirmationPeriodActive,
    isConfirmed: confirmationStatus?.isConfirmed || false,
    canConfirm: isConfirmationPeriodActive() && !confirmationStatus?.isConfirmed,
  };
}