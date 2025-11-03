import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface WithdrawalRequest {
  virtualAccountId: string;
  amount: number;
  bankAccountNumber: string;
  bankCode: string;
  accountName: string;
  narration?: string;
}

interface AutoTransferSettings {
  enabled: boolean;
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  minimumBalance?: number;
  destinationAccount: {
    bankAccountNumber: string;
    bankCode: string;
    accountName: string;
  };
}

interface VirtualAccountBalance {
  id: string;
  balance: number;
  currency: string;
  availableBalance: number; // Balance minus pending withdrawals
  pendingWithdrawals: number;
}

interface WithdrawalHistory {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  bankAccountNumber: string;
  accountName: string;
  reference: string;
  narration?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

export function useWithdrawal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch virtual account balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance
  } = useQuery<VirtualAccountBalance>({
    queryKey: ['virtualAccountBalance'],
    queryFn: async () => {
      const response = await fetch('/api/virtual-accounts/balance', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch withdrawal history
  const {
    data: history,
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useQuery<WithdrawalHistory[]>({
    queryKey: ['withdrawalHistory'],
    queryFn: async () => {
      const response = await fetch('/api/withdrawals/history', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch withdrawal history');
      }

      return response.json();
    },
  });

  // Fetch auto-transfer settings
  const {
    data: autoTransferSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings
  } = useQuery<AutoTransferSettings | null>({
    queryKey: ['autoTransferSettings'],
    queryFn: async () => {
      const response = await fetch('/api/withdrawals/auto-transfer-settings', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch auto-transfer settings');
      }

      return response.json();
    },
  });

  // Initiate withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawalRequest) => {
      const response = await fetch('/api/withdrawals/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Withdrawal failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Withdrawal Initiated',
        description: 'Your withdrawal request has been submitted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['virtualAccountBalance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalHistory'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Withdrawal Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update auto-transfer settings mutation
  const updateAutoTransferMutation = useMutation({
    mutationFn: async (settings: AutoTransferSettings) => {
      const response = await fetch('/api/withdrawals/auto-transfer-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Auto-transfer settings have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['autoTransferSettings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verify bank account mutation
  const verifyBankAccountMutation = useMutation({
    mutationFn: async (data: { bankCode: string; accountNumber: string }) => {
      const response = await fetch('/api/withdrawals/verify-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Verification failed');
      }

      return response.json();
    },
  });

  // Helper function to initiate withdrawal
  const initiateWithdrawal = async (data: WithdrawalRequest) => {
    setIsProcessing(true);
    try {
      await withdrawMutation.mutateAsync(data);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to update auto-transfer settings
  const updateAutoTransfer = async (settings: AutoTransferSettings) => {
    await updateAutoTransferMutation.mutateAsync(settings);
  };

  // Helper function to verify bank account
  const verifyBankAccount = async (bankCode: string, accountNumber: string) => {
    return verifyBankAccountMutation.mutateAsync({ bankCode, accountNumber });
  };

  // Calculate withdrawable amount (balance minus pending)
  const withdrawableAmount = balance
    ? balance.balance - balance.pendingWithdrawals
    : 0;

  return {
    // Balance data
    balance,
    withdrawableAmount,
    isLoadingBalance,
    balanceError,
    refetchBalance,

    // Withdrawal history
    history,
    isLoadingHistory,
    refetchHistory,

    // Auto-transfer settings
    autoTransferSettings,
    isLoadingSettings,
    refetchSettings,

    // Actions
    initiateWithdrawal,
    updateAutoTransfer,
    verifyBankAccount,

    // Loading states
    isProcessing,
    isWithdrawing: withdrawMutation.isPending,
    isUpdatingSettings: updateAutoTransferMutation.isPending,
    isVerifying: verifyBankAccountMutation.isPending,

    // Mutation objects (for advanced usage)
    withdrawMutation,
    updateAutoTransferMutation,
    verifyBankAccountMutation,
  };
}









// // apps/platform/hooks/useWithdrawal.ts
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//   initiateWithdrawal,
//   getWithdrawalHistory,
//   getWithdrawalLimits,
//   cancelWithdrawal,
//   setupAutoWithdrawal,
// } from '@/lib/api/earnings';
// import { useToast } from '@/hooks/useToast';

// export interface WithdrawalData {
//   amount: number;
//   bankAccountId: string;
//   description?: string;
// }

// export interface AutoWithdrawalSettings {
//   enabled: boolean;
//   minimumBalance?: number;
//   frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
//   dayOfWeek?: number; // 0-6 for weekly
//   dayOfMonth?: number; // 1-31 for monthly
//   bankAccountId?: string;
// }

// export const useWithdrawal = () => {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   // Initiate withdrawal mutation
//   const withdrawMutation = useMutation({
//     mutationFn: (data: WithdrawalData) => initiateWithdrawal(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['earnings'] });
//       queryClient.invalidateQueries({ queryKey: ['commission-summary'] });
//       queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] });
//       queryClient.invalidateQueries({ queryKey: ['virtual-account'] });
//       toast({
//         title: 'Success',
//         description: 'Withdrawal initiated successfully',
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Withdrawal Failed',
//         description: error.message || 'Failed to process withdrawal',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Cancel withdrawal mutation
//   const cancelMutation = useMutation({
//     mutationFn: (withdrawalId: string) => cancelWithdrawal(withdrawalId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] });
//       toast({
//         title: 'Success',
//         description: 'Withdrawal cancelled successfully',
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to cancel withdrawal',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Setup auto-withdrawal mutation
//   const setupAutoWithdrawalMutation = useMutation({
//     mutationFn: (settings: AutoWithdrawalSettings) => setupAutoWithdrawal(settings),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['auto-withdrawal-settings'] });
//       toast({
//         title: 'Success',
//         description: 'Auto-withdrawal settings updated successfully',
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to update auto-withdrawal settings',
//         variant: 'destructive',
//       });
//     },
//   });

//   return {
//     // Actions
//     withdraw: withdrawMutation.mutate,
//     withdrawAsync: withdrawMutation.mutateAsync,
//     cancelWithdrawal: cancelMutation.mutate,
//     setupAutoWithdrawal: setupAutoWithdrawalMutation.mutate,
    
//     // States
//     isWithdrawing: withdrawMutation.isPending,
//     isCancelling: cancelMutation.isPending,
//     isSettingUpAuto: setupAutoWithdrawalMutation.isPending,
    
//     // Errors
//     withdrawError: withdrawMutation.error,
//     cancelError: cancelMutation.error,
//   };
// };

// // Hook for withdrawal history
// export const useWithdrawalHistory = (filters?: {
//   page?: number;
//   limit?: number;
//   status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
// }) => {
//   const query = useQuery({
//     queryKey: ['withdrawal-history', filters],
//     queryFn: () => getWithdrawalHistory(filters),
//     staleTime: 1000 * 60 * 3, // 3 minutes
//   });

//   return {
//     // Data
//     withdrawals: query.data?.withdrawals || [],
//     totalCount: query.data?.totalCount || 0,
//     totalPages: query.data?.totalPages || 0,
//     currentPage: query.data?.currentPage || 1,
    
//     // Summary
//     totalWithdrawn: query.data?.totalWithdrawn || 0,
//     pendingWithdrawals: query.data?.pendingWithdrawals || 0,
//     failedWithdrawals: query.data?.failedWithdrawals || 0,
    
//     // States
//     isLoading: query.isLoading,
//     error: query.error,
    
//     // Actions
//     refetch: query.refetch,
//   };
// };

// // Hook for withdrawal limits
// export const useWithdrawalLimits = () => {
//   const query = useQuery({
//     queryKey: ['withdrawal-limits'],
//     queryFn: () => getWithdrawalLimits(),
//     staleTime: 1000 * 60 * 10, // 10 minutes
//   });

//   return {
//     // Limits
//     minimumAmount: query.data?.minimumAmount || 0,
//     maximumAmount: query.data?.maximumAmount || 0,
//     dailyLimit: query.data?.dailyLimit || 0,
//     monthlyLimit: query.data?.monthlyLimit || 0,
    
//     // Usage
//     dailyUsed: query.data?.dailyUsed || 0,
//     monthlyUsed: query.data?.monthlyUsed || 0,
//     dailyRemaining: query.data?.dailyRemaining || 0,
//     monthlyRemaining: query.data?.monthlyRemaining || 0,
    
//     // Availability
//     canWithdraw: query.data?.canWithdraw || false,
//     availableBalance: query.data?.availableBalance || 0,
    
//     // States
//     isLoading: query.isLoading,
//     error: query.error,
    
//     // Actions
//     refetch: query.refetch,
//   };
// };

// // Hook for auto-withdrawal settings
// export const useAutoWithdrawalSettings = () => {
//   const query = useQuery({
//     queryKey: ['auto-withdrawal-settings'],
//     queryFn: () => setupAutoWithdrawal({ enabled: false }), // Just fetch settings
//     staleTime: 1000 * 60 * 5,
//   });

//   return {
//     settings: query.data,
//     isLoading: query.isLoading,
//     error: query.error,
//     refetch: query.refetch,
//   };
// };