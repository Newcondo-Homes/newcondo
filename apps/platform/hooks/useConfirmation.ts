import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@newcondo/ui';
import { confirmationsApi } from '@/lib/api/confirmations';

import type {
  ConfirmationStatusResponse,
  ConfirmPaymentRequest,
  DisputePaymentRequest,
} from '@/types/confirmation';


export function useConfirmation(rentalId?: string) {
  const queryClient = useQueryClient();

  // Fetch confirmation status
  const {
    data: confirmationStatus,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery<ConfirmationStatusResponse | null>({
    queryKey: ['confirmation-status', rentalId],
    queryFn: async () => {
      if (!rentalId) return null;
      return confirmationsApi.getConfirmationStatus(rentalId)
    },
    enabled: !!rentalId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Submit property confirmation
  const confirmPropertyMutation = useMutation({
    mutationFn: async (data: ConfirmPaymentRequest) =>
      confirmationsApi.confirmProperty(rentalId!, data)
    ,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['confirmation-status'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      toast.success('Property Confirmed', {
        description: 'Your confirmation has been submitted successfully.',
      });
    },
    onError: (error: any) => {
      toast.error('Confirmation Failed', {
        description: error.response?.data?.message || 'Failed to submit confirmation.',
      });
    },
  });

  // Reject/Dispute property
  const rejectPropertyMutation = useMutation({
    mutationFn: async (data: DisputePaymentRequest) =>
      confirmationsApi.disputeProperty(rentalId!, data)
    ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confirmation-status'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });

      toast.success('Dispute Submitted', {
        description: 'Your dispute has been submitted. Our team will review it shortly.',
      });
    },
    onError: (error: any) => {
      toast.error('Submission Failed', {
        description: error.response?.data?.message || 'Failed to submit dispute.',
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