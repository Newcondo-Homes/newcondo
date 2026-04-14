import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@newcondo/ui'

interface QueuePosition {
  position: number;
  estimatedWaitTime: number; // in seconds
  totalInQueue: number;
  isProcessing: boolean;
}

interface PaymentQueueItem {
  id: string;
  userId: string;
  propertyId: string;
  unitId?: string;
  position: number;
  status: 'WAITING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: Date;
  processingStartedAt?: Date;
}

interface JoinQueueParams {
  propertyId: string;
  unitId?: string;
  amount: number;
}

export function usePaymentQueue(propertyId?: string, unitId?: string) {
  const [isInQueue, setIsInQueue] = useState(false);
  const queryClient = useQueryClient();

  // Fetch queue status
  const { data: queueStatus, isLoading } = useQuery<QueuePosition>({
    queryKey: ['paymentQueue', propertyId, unitId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);

      const response = await fetch(
        `/api/payments/queue/status?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch queue status');
      }

      return response.json();
    },
    enabled: !!propertyId && isInQueue,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll more frequently when processing or near front of queue
      if (data?.isProcessing || (data?.position ?? 0) <= 3) {
        return 2000; // 2 seconds
      }
      return 5000; // 5 seconds
    },
  });

  // Join payment queue
  const joinQueueMutation = useMutation({
    mutationFn: async ({ propertyId, unitId, amount }: JoinQueueParams) => {
      const response = await fetch('/api/payments/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, unitId, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join queue');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsInQueue(true);
      queryClient.invalidateQueries({ queryKey: ['paymentQueue', propertyId, unitId] });
      
      toast.success('Added to Payment Queue',{
        description: `You are #${data.position} in line. Estimated wait: ${Math.ceil(data.estimatedWaitTime / 60)} minutes.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Queue Join Failed',{
        description: error.message,
      });
    },
  });

  // Leave payment queue
  const leaveQueueMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/payments/queue/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, unitId }),
      });

      if (!response.ok) {
        throw new Error('Failed to leave queue');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsInQueue(false);
      queryClient.invalidateQueries({ queryKey: ['paymentQueue', propertyId, unitId] });
      
      toast('Left Queue',{
        description: 'You have been removed from the payment queue.',
      });
    },
  });

  // Get user's queue item
  const { data: myQueueItem } = useQuery<PaymentQueueItem | null>({
    queryKey: ['myQueueItem', propertyId, unitId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);

      const response = await fetch(
        `/api/payments/queue/my-position?${params.toString()}`
      );

      if (!response.ok) {
        return null;
      }

      return response.json();
    },
    enabled: isInQueue && !!propertyId,
    refetchInterval: 3000,
  });

  // Auto-update isInQueue based on myQueueItem
  useEffect(() => {
    if (myQueueItem) {
      setIsInQueue(['WAITING', 'PROCESSING'].includes(myQueueItem.status));
    }
  }, [myQueueItem]);

  // Notify when it's user's turn
  useEffect(() => {
    if (queueStatus?.position === 1 && !queueStatus.isProcessing) {
      toast.success("It's Your Turn!",{
        description: 'You can now proceed with payment.',
        duration: 10000,
      });
    }
  }, [queueStatus, toast]);

  // Format estimated wait time
  const formattedWaitTime = useCallback(() => {
    if (!queueStatus?.estimatedWaitTime) return '—';
    
    const minutes = Math.ceil(queueStatus.estimatedWaitTime / 60);
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  }, [queueStatus]);

  return {
    queueStatus,
    myQueueItem,
    isLoading,
    isInQueue,
    
    // Queue info
    position: queueStatus?.position ?? null,
    totalInQueue: queueStatus?.totalInQueue ?? 0,
    estimatedWaitTime: queueStatus?.estimatedWaitTime ?? 0,
    formattedWaitTime: formattedWaitTime(),
    isProcessing: queueStatus?.isProcessing ?? false,
    
    // Actions
    joinQueue: joinQueueMutation.mutate,
    leaveQueue: leaveQueueMutation.mutate,
    
    // Status checks
    canProceed: queueStatus?.position === 1 && !queueStatus?.isProcessing,
    isMyTurn: queueStatus?.position === 1,
    
    // Loading states
    isJoining: joinQueueMutation.isPending,
    isLeaving: leaveQueueMutation.isPending,
  };
}