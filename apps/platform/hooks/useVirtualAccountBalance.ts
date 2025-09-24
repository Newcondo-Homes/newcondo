// apps/platform/hooks/useVirtualAccountBalance.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { virtualAccountApi } from '../lib/api/virtualAccount';
import { useAuth } from './useAuth';

export interface VirtualAccountBalance {
  id: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  isActive: boolean;
  propertyId?: string;
  lastUpdated: string;
}

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
  } = useQuery({
    queryKey: ['virtualAccountBalance', user?.id, propertyId],
    queryFn: () => virtualAccountApi.getBalance(propertyId),
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Get balance history
  const {
    data: balanceHistory,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['virtualAccountHistory', user?.id, propertyId],
    queryFn: () => virtualAccountApi.getBalanceHistory(propertyId),
    enabled: !!user?.id && !!balance,
    staleTime: 60000, // 1 minute
  });

  // Refresh balance mutation
  const refreshBalanceMutation = useMutation({
    mutationFn: () => virtualAccountApi.refreshBalance(propertyId),
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
      virtualAccountApi.createAccount(data),
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

  const getBalanceStatus = useCallback((balance?: VirtualAccountBalance) => {
    if (!balance) return 'no-account';
    if (!balance.isActive) return 'inactive';
    if (balance.balance > 0) return 'positive';
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