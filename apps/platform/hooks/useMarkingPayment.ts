// apps/platform/hooks/useMarkingPayment.ts
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MarkingPaymentData {
  jobId: string;
  markingType: 'SELF' | 'NEWCONDO_ADMIN' | 'SHAREABLE_LINK' | 'ASSIGN_AGENT';
  paymentMethod: 'card' | 'bank_transfer' | 'virtual_account';
}

interface PaymentResponse {
  paymentId: string;
  flutterwaveRef?: string;
  paymentLink?: string;
  virtualAccount?: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
  };
  amount: number;
  status: string;
}

interface PaymentHistory {
  id: string;
  jobId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: Date;
  paidAt?: Date;
  failureReason?: string;
}

const MARKING_FEES = {
  SELF: 0,
  NEWCONDO_ADMIN: 25000,
  SHAREABLE_LINK: 0,
  ASSIGN_AGENT: 20000,
};

export function useMarkingPayment() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate marking fee
  const calculateFee = useCallback((markingType: string): number => {
    return MARKING_FEES[markingType as keyof typeof MARKING_FEES] || 0;
  }, []);

  // Initiate payment
  const initiatePayment = useMutation({
    mutationFn: async (data: MarkingPaymentData) => {
      setIsProcessing(true);
      const res = await fetch('/api/marking-jobs/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Payment initiation failed');
      }
      return res.json() as Promise<PaymentResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      toast.success('Payment initiated successfully');
      
      // Redirect to payment link if provided
      if (data.paymentLink) {
        window.open(data.paymentLink, '_blank');
      }
      setIsProcessing(false);
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setIsProcessing(false);
    },
  });

  // Verify payment
  const verifyPayment = useMutation({
    mutationFn: async ({ 
      paymentId, 
      flutterwaveRef 
    }: { 
      paymentId: string; 
      flutterwaveRef?: string 
    }) => {
      const res = await fetch('/api/marking-jobs/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentId, flutterwaveRef }),
      });
      if (!res.ok) throw new Error('Payment verification failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
      toast.success('Payment verified successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Fetch payment history
  const {
    data: paymentHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useQuery<PaymentHistory[]>({
    queryKey: ['markingPaymentHistory'],
    queryFn: async () => {
      const res = await fetch('/api/marking-jobs/payment/history', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch payment history');
      return res.json();
    },
  });

  // Get virtual account for payment
  const getVirtualAccount = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/marking-jobs/${jobId}/virtual-account`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to get virtual account');
      return res.json();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handle webhook callback (for background payment confirmation)
  const handleWebhookCallback = useCallback(async (reference: string) => {
    try {
      const res = await fetch('/api/marking-jobs/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reference }),
      });
      
      if (!res.ok) throw new Error('Webhook processing failed');
      
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      
      return data;
    } catch (error) {
      console.error('Webhook callback error:', error);
      throw error;
    }
  }, [queryClient]);

  // Get payment status
  const getPaymentStatus = useCallback(
    (jobId: string): string | undefined => {
      const history = paymentHistory?.find(p => p.jobId === jobId);
      return history?.status;
    },
    [paymentHistory]
  );

  // Check if payment is pending
  const isPaymentPending = useCallback(
    (jobId: string): boolean => {
      const status = getPaymentStatus(jobId);
      return status === 'PENDING';
    },
    [getPaymentStatus]
  );

  // Check if payment is successful
  const isPaymentSuccessful = useCallback(
    (jobId: string): boolean => {
      const status = getPaymentStatus(jobId);
      return status === 'SUCCESS';
    },
    [getPaymentStatus]
  );

  return {
    calculateFee,
    initiatePayment: initiatePayment.mutateAsync,
    verifyPayment: verifyPayment.mutateAsync,
    getVirtualAccount: getVirtualAccount.mutateAsync,
    paymentHistory,
    isLoadingHistory,
    isProcessing,
    refetchHistory,
    handleWebhookCallback,
    getPaymentStatus,
    isPaymentPending,
    isPaymentSuccessful,
    MARKING_FEES,
  };
}