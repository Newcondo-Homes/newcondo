// apps/platform/hooks/useVirtualAccountBalance.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchAccountBalance,
  fetchAccountTransactions,
  createVirtualAccount,
} from '@/lib/api/virtualAccounts';
import { useAuth } from './useAuth';

import type {
  VirtualAccountBalance,
  VirtualAccountTransaction,
} from '@/types/virtualAccount';


export interface BalanceHistory {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  reference: string;
  timestamp: string;
  balance_after: number;
}

export const useVirtualAccountBalance = (propertyId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get virtual account balance
  const {
    data: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery<VirtualAccountBalance>({
    queryKey: ['virtualAccountBalance', user?.id, propertyId],
    queryFn: () => fetchAccountBalance(propertyId!),
    enabled: !!user?.id && !!propertyId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Get balance history
  const {
    data: balanceHistory,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useQuery<VirtualAccountTransaction[]>({
    queryKey: ['virtualAccountHistory', user?.id, propertyId],
    queryFn: () => fetchAccountTransactions(propertyId!, { limit: 50 }).then((r) => r.data),
    enabled: !!user?.id && !!balance && !!propertyId,
    staleTime: 60000, // 1 minute
  });

  // Refresh balance mutation
  const refreshBalanceMutation = useMutation({
    mutationFn: () => fetchAccountBalance(propertyId!),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['virtualAccountBalance', user?.id, propertyId],
        data
      );
      toast.success('Balance updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to refresh balance');
    },
  });

  // Create virtual account mutation
  const createAccountMutation = useMutation({
    mutationFn: (data: { propertyId?: string; accountName: string }) =>
      createVirtualAccount({ ...data, userId: user!.id }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['virtualAccountBalance', user?.id],
      });
      toast.success('Virtual account created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create virtual account');
    },
  });

  // Helper functions
  const refreshBalance = useCallback(() => {
    refreshBalanceMutation.mutate();
  }, [refreshBalanceMutation]);

  const createAccount = useCallback(
    (data: { propertyId?: string; accountName: string }) => {
      createAccountMutation.mutate(data);
    },
    [createAccountMutation]
  );

  const formatBalance = useCallback(
    (amount: number, currency = 'NGN') => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    },
    []
  );

  const getBalanceStatus = useCallback((bal?: VirtualAccountBalance) => {
    if (!bal) return 'no-account';
    if (!bal.isActive) return 'inactive';
    if (bal.balance > 0) return 'positive';
    return 'zero';
  }, []);

  return {
    // Data
    balance,
    balanceHistory,

    // Loading states
    isBalanceLoading,
    isHistoryLoading,
    isRefreshing: refreshBalanceMutation.isPending,
    isCreatingAccount: createAccountMutation.isPending,

    // Error states
    balanceError,
    historyError,
    refreshError: refreshBalanceMutation.error,
    createError: createAccountMutation.error,

    // Actions
    refreshBalance,
    refetchBalance,
    createAccount,

    // Helpers
    formatBalance,
    getBalanceStatus,

    // Computed values
    hasAccount: !!balance,
    isPositiveBalance: balance && balance.balance > 0,
    formattedBalance: balance ? formatBalance(balance.balance, balance.currency) : '₦0.00',
  };
};