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