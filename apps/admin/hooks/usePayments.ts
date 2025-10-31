// apps/admin/src/hooks/usePayments.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api/payments';
import { usePaymentStore } from '@/store/paymentStore';
import { PaymentStatus, PaymentType } from '@newcondo/db';

interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface VirtualAccountFilters {
  page?: number;
  limit?: number;
  userId?: string;
  propertyId?: string;
  isActive?: boolean;
  minBalance?: number;
}

export const usePayments = (filters?: PaymentFilters) => {
  const queryClient = useQueryClient();
  const { setSelectedPayment } = usePaymentStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch payments
   */
  const {
    data: paymentsData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentsApi.getPayments(filters),
    staleTime: 20000,
  });

  /**
   * Fetch single payment details
   */
  const usePaymentDetails = (paymentId: string) => {
    return useQuery({
      queryKey: ['payment', paymentId],
      queryFn: () => paymentsApi.getPaymentById(paymentId),
      enabled: !!paymentId,
    });
  };

  /**
   * Fetch virtual accounts
   */
  const useVirtualAccounts = (accountFilters?: VirtualAccountFilters) => {
    return useQuery({
      queryKey: ['virtualAccounts', accountFilters],
      queryFn: () => paymentsApi.getVirtualAccounts(accountFilters),
      staleTime: 30000,
    });
  };

  /**
   * Process refund mutation
   */
  const refundPaymentMutation = useMutation({
    mutationFn: ({ 
      paymentId, 
      amount, 
      reason 
    }: { 
      paymentId: string; 
      amount?: number; 
      reason: string;
    }) => paymentsApi.processRefund(paymentId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['virtualAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    }
  });

  /**
   * Release payment mutation (after confirmation period)
   */
  const releasePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsApi.releasePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['virtualAccounts'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to release payment');
    }
  });

  /**
   * Reconcile payment mutation
   */
  const reconcilePaymentMutation = useMutation({
    mutationFn: ({ 
      paymentId, 
      notes 
    }: { 
      paymentId: string; 
      notes?: string;
    }) => paymentsApi.reconcilePayment(paymentId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to reconcile payment');
    }
  });

  /**
   * Manage virtual account mutation
   */
  const manageVirtualAccountMutation = useMutation({
    mutationFn: ({ 
      accountId, 
      action,
      data
    }: { 
      accountId: string; 
      action: 'ACTIVATE' | 'DEACTIVATE' | 'UPDATE_BALANCE';
      data?: any;
    }) => paymentsApi.manageVirtualAccount(accountId, action, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtualAccounts'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to manage virtual account');
    }
  });

  /**
   * Flag suspicious payment mutation
   */
  const flagSuspiciousMutation = useMutation({
    mutationFn: ({ 
      paymentId, 
      reason 
    }: { 
      paymentId: string; 
      reason: string;
    }) => paymentsApi.flagSuspicious(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to flag payment');
    }
  });

  /**
   * Process refund
   */
  const processRefund = useCallback(async (
    paymentId: string,
    reason: string,
    amount?: number
  ) => {
    setError(null);
    return refundPaymentMutation.mutateAsync({ paymentId, amount, reason });
  }, [refundPaymentMutation]);

  /**
   * Release payment
   */
  const releasePayment = useCallback(async (paymentId: string) => {
    setError(null);
    return releasePaymentMutation.mutateAsync(paymentId);
  }, [releasePaymentMutation]);

  /**
   * Reconcile payment
   */
  const reconcilePayment = useCallback(async (
    paymentId: string,
    notes?: string
  ) => {
    setError(null);
    return reconcilePaymentMutation.mutateAsync({ paymentId, notes });
  }, [reconcilePaymentMutation]);

  /**
   * Manage virtual account
   */
  const manageVirtualAccount = useCallback(async (
    accountId: string,
    action: 'ACTIVATE' | 'DEACTIVATE' | 'UPDATE_BALANCE',
    data?: any
  ) => {
    setError(null);
    return manageVirtualAccountMutation.mutateAsync({ accountId, action, data });
  }, [manageVirtualAccountMutation]);

  /**
   * Flag suspicious payment
   */
  const flagSuspicious = useCallback(async (
    paymentId: string,
    reason: string
  ) => {
    setError(null);
    return flagSuspiciousMutation.mutateAsync({ paymentId, reason });
  }, [flagSuspiciousMutation]);

  /**
   * Export financial report
   */
  const exportFinancialReport = useCallback(async (
    startDate: string,
    endDate: string,
    format: 'CSV' | 'EXCEL' | 'PDF' = 'CSV'
  ) => {
    setError(null);
    try {
      const blob = await paymentsApi.exportFinancialReport(startDate, endDate, format);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${startDate}-${endDate}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Get payment statistics
   */
  const getStatistics = useCallback(() => {
    const stats = paymentsData?.data?.statistics;
    return {
      totalTransactions: stats?.totalTransactions || 0,
      totalRevenue: stats?.totalRevenue || 0,
      successfulPayments: stats?.successfulPayments || 0,
      failedPayments: stats?.failedPayments || 0,
      pendingPayments: stats?.pendingPayments || 0,
      refundedAmount: stats?.refundedAmount || 0,
      averageTransactionValue: stats?.averageTransactionValue || 0,
      successRate: stats?.successRate || 0
    };
  }, [paymentsData]);

  return {
    // Data
    payments: paymentsData?.data?.payments || [],
    pagination: paymentsData?.data?.pagination,
    statistics: getStatistics(),
    
    // Loading states
    isLoading,
    isFetching,
    
    // Mutations loading states
    isRefunding: refundPaymentMutation.isPending,
    isReleasing: releasePaymentMutation.isPending,
    isReconciling: reconcilePaymentMutation.isPending,
    isManagingAccount: manageVirtualAccountMutation.isPending,
    isFlagging: flagSuspiciousMutation.isPending,
    
    // Actions
    processRefund,
    releasePayment,
    reconcilePayment,
    manageVirtualAccount,
    flagSuspicious,
    exportFinancialReport,
    refetch,
    
    // Additional hooks
    usePaymentDetails,
    useVirtualAccounts,
    
    // State
    error,
    clearError: () => setError(null)
  };
};