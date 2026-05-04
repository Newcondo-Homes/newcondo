// apps/platform/hooks/usePayments.ts
'use client'

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@newcondo/ui';
import { paymentsApi } from '@/lib/api/payments';
import { useAuthStore } from '@/store/authStore';
import type {
  Payment,
  PaymentCreateRequest,
  PaymentHistoryParams,
  PaymentRefundRequest,
  PaymentRetryRequest
} from '@/types/payment';
import type { PaginatedResponse } from '@/types/api';

export const usePayments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentCreateRequest) => paymentsApi.createPayment(data),
    onSuccess: (response) => {
      toast.success('Payment initiated', {
        description: 'Your payment has been successfully initiated.'
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      return response.data;
    },
    onError: (error: any) => {
      toast.error('Payment failed', {
        description: error.response?.data?.message || 'Failed to initiate payment.',
      });
    }
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: any }) =>
      paymentsApi.confirmPayment(paymentId, data),
    onSuccess: () => {
      toast.success('Payment confirmed', {
        description: 'Your payment has been confirmed successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error('Payment confirmation failed', {
        description: error.response?.data?.message || 'Failed to confirm payment.',
      });
    }
  });

  // Cancel payment mutation
  const cancelPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsApi.cancelPayment(paymentId),
    onSuccess: () => {
      toast('Payment cancelled', {
        description: 'The payment has been cancelled successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error('Cancellation failed', {
        description: error.response?.data?.message || 'Failed to cancel payment.',
      });
    }
  });

  // Refund payment mutation
  const refundPaymentMutation = useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: PaymentRefundRequest }) =>
      paymentsApi.refundPayment(paymentId, data),
    onSuccess: () => {
      toast('Refund requested', {
        description: 'Your refund request has been submitted successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error('Refund failed', {
        description: error.response?.data?.message || 'Failed to request refund.',
      });
    }
  });

  // Retry payment mutation
  const retryPaymentMutation = useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: PaymentRetryRequest }) =>
      paymentsApi.retryPayment(paymentId, data),
    onSuccess: () => {
      toast('Payment retry initiated', {
        description: 'Your payment retry has been initiated.'
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error('Retry failed', {
        description: error.response?.data?.message || 'Failed to retry payment.',
      });
    }
  });

  // Release payment mutation
  const releasePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsApi.releasePayment(paymentId),
    onSuccess: () => {
      toast.success('Payment released', {
        description: 'The payment has been released successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error('Release failed', {
        description: error.response?.data?.message || 'Failed to release payment.',
      });
    }
  });

  return {
    // Mutations
    createPayment: createPaymentMutation.mutate,
    confirmPayment: confirmPaymentMutation.mutateAsync,
    cancelPayment: cancelPaymentMutation.mutate,
    refundPayment: refundPaymentMutation.mutate,
    // retryPayment: retryPaymentMutation.mutate,
    retryPayment: retryPaymentMutation.mutateAsync,
    releasePayment: releasePaymentMutation.mutate,
    initiatePayment: createPaymentMutation.mutateAsync, // use mutateAsync so it returns a promise

    // Loading states
    isCreatingPayment: createPaymentMutation.isPending,
    isConfirmingPayment: confirmPaymentMutation.isPending,
    isCancellingPayment: cancelPaymentMutation.isPending,
    isRefundingPayment: refundPaymentMutation.isPending,
    isRetryingPayment: retryPaymentMutation.isPending,
    isReleasingPayment: releasePaymentMutation.isPending,
    isLoading: createPaymentMutation.isPending,


    // Data
    downloadReceipt: (paymentId: string) => usePaymentReceipt().downloadReceipt(paymentId), // ← or just use the hook separately
    fetchPaymentHistory: (params?: PaymentHistoryParams) => paymentsApi.getPaymentHistory(params).then(r => r.data),
    createdPayment: createPaymentMutation.data?.data,

    // Errors
    createPaymentError: createPaymentMutation.error,
    confirmPaymentError: confirmPaymentMutation.error,
    cancelPaymentError: cancelPaymentMutation.error,
    refundPaymentError: refundPaymentMutation.error,
    retryPaymentError: retryPaymentMutation.error,
    releasePaymentError: releasePaymentMutation.error
  };
};

// Hook for fetching payment history
export const usePaymentHistory = (params?: PaymentHistoryParams) => {
  return useQuery({
    queryKey: ['payments', 'history', params],
    queryFn: () => paymentsApi.getPaymentHistory(params),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true // !!params // Only fetch if params are provided
  });
};

// Hook for fetching a single payment
export const usePayment = (paymentId: string) => {
  return useQuery({
    queryKey: ['payments', paymentId],
    queryFn: () => paymentsApi.getPayment(paymentId),
    select: (response) => response.data,
    enabled: !!paymentId
  });
};

// Hook for payment analytics
export const usePaymentAnalytics = (propertyId?: string) => {
  return useQuery({
    queryKey: ['payments', 'analytics', propertyId],
    queryFn: () => paymentsApi.getPaymentAnalytics(propertyId),
    select: (response) => response.data,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
};

// Hook for downloading payment receipt
export const usePaymentReceipt = () => {

  const downloadReceipt = async (paymentId: string, fileName?: string) => {
    try {
      const blob = await paymentsApi.getPaymentReceipt(paymentId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `payment-receipt-${paymentId}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      toast.success('Receipt downloaded', {
        description: 'Payment receipt has been downloaded successfully.'
      });
    } catch (error: any) {
      toast.error('Download failed', {
        description: error.response?.data?.message || 'Failed to download receipt.',
      });
    }
  };

  return { downloadReceipt };
};

// Hook for virtual accounts
export const useVirtualAccounts = () => {
  const queryClient = useQueryClient();

  // Create virtual account mutation
  const createVirtualAccountMutation = useMutation({
    mutationFn: paymentsApi.createVirtualAccount,
    onSuccess: () => {
      toast.success('Virtual account created', {
        description: 'Your virtual account has been created successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['virtualAccounts'] });
    },
    onError: (error: any) => {
      toast.error('Account creation failed', {
        description: error.response?.data?.message || 'Failed to create virtual account.',
      });
    }
  });

  // Get virtual accounts query
  const virtualAccountsQuery = useQuery({
    queryKey: ['virtualAccounts'],
    queryFn: () => paymentsApi.getVirtualAccounts(),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  return {
    createVirtualAccount: createVirtualAccountMutation.mutate,
    isCreatingVirtualAccount: createVirtualAccountMutation.isPending,
    virtualAccounts: virtualAccountsQuery.data,
    isLoadingVirtualAccounts: virtualAccountsQuery.isLoading,
    virtualAccountsError: virtualAccountsQuery.error
  };
};

// Hook for payment verification
export const usePaymentVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPayment = async (transactionId: string) => {
    setIsVerifying(true);
    try {
      const response = await paymentsApi.verifyPaymentStatus(transactionId);

      toast.success('Payment verified', {
        description: 'Payment status has been verified successfully.'
      });

      return response.data;
    } catch (error: any) {
      toast.error('Verification failed', {
        description: error.response?.data?.message || 'Failed to verify payment.',
      });
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  return { verifyPayment, isVerifying };
};