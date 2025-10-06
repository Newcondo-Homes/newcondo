import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';

interface VirtualAccountData {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  balance: number;
  currency: string;
  isActive: boolean;
  userId: string;
  propertyId?: string;
  createdAt: string;
}

interface TransactionData {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

interface TransactionListParams {
  page?: number;
  limit?: number;
  type?: 'CREDIT' | 'DEBIT';
  startDate?: string;
  endDate?: string;
}

interface WithdrawalSettingsData {
  autoWithdraw: boolean;
  withdrawalSchedule?: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  minimumBalance?: number;
  destinationAccountNumber: string;
  destinationAccountName: string;
  destinationBankCode: string;
}

export function useVirtualAccount(accountId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch virtual account details
  const {
    data: account,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['virtual-account', accountId],
    queryFn: async () => {
      if (!accountId) {
        // Fetch user's primary virtual account
        const response = await api.get<VirtualAccountData>('/virtual-accounts/me');
        return response.data;
      }
      const response = await api.get<VirtualAccountData>(`/virtual-accounts/${accountId}`);
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds to keep balance updated
  });

  // Fetch all user's virtual accounts
  const {
    data: accounts,
    isLoading: isLoadingAccounts,
  } = useQuery({
    queryKey: ['virtual-accounts-list'],
    queryFn: async () => {
      const response = await api.get<VirtualAccountData[]>('/virtual-accounts');
      return response.data;
    },
  });

  // Fetch transaction history
  const fetchTransactions = (params: TransactionListParams = {}) => {
    return useQuery({
      queryKey: ['virtual-account-transactions', accountId, params],
      queryFn: async () => {
        const targetAccountId = accountId || account?.id;
        if (!targetAccountId) return null;
        
        const response = await api.get(`/virtual-accounts/${targetAccountId}/transactions`, {
          params,
        });
        return response.data;
      },
      enabled: !!(accountId || account?.id),
    });
  };

  // Fetch withdrawal settings
  const {
    data: withdrawalSettings,
    isLoading: isLoadingSettings,
  } = useQuery({
    queryKey: ['withdrawal-settings', accountId],
    queryFn: async () => {
      const targetAccountId = accountId || account?.id;
      if (!targetAccountId) return null;
      
      const response = await api.get<WithdrawalSettingsData>(
        `/virtual-accounts/${targetAccountId}/withdrawal-settings`
      );
      return response.data;
    },
    enabled: !!(accountId || account?.id),
  });

  // Update withdrawal settings
  const updateWithdrawalSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<WithdrawalSettingsData>) => {
      const targetAccountId = accountId || account?.id;
      if (!targetAccountId) throw new Error('No account ID available');
      
      const response = await api.patch(
        `/virtual-accounts/${targetAccountId}/withdrawal-settings`,
        settings
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-settings'] });
      
      toast({
        title: 'Settings Updated',
        description: 'Your withdrawal settings have been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.message || 'Failed to update withdrawal settings.',
        variant: 'destructive',
      });
    },
  });

  // Format balance
  const formatBalance = (amount?: number) => {
    if (amount === undefined) return 'Loading...';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: account?.currency || 'NGN',
    }).format(amount);
  };

  // Check if account has sufficient balance
  const hasSufficientBalance = (amount: number) => {
    if (!account) return false;
    return account.balance >= amount;
  };

  // Get account status
  const getAccountStatus = () => {
    if (!account) return 'Unknown';
    if (!account.isActive) return 'Inactive';
    if (account.balance === 0) return 'Zero Balance';
    return 'Active';
  };

  // Calculate available balance for withdrawal
  const getAvailableBalance = () => {
    if (!account) return 0;
    
    const minimumBalance = withdrawalSettings?.minimumBalance || 0;
    const availableBalance = account.balance - minimumBalance;
    
    return Math.max(0, availableBalance);
  };

  // Refresh account balance
  const refreshBalance = () => {
    queryClient.invalidateQueries({ queryKey: ['virtual-account', accountId] });
    queryClient.invalidateQueries({ queryKey: ['virtual-accounts-list'] });
  };

  return {
    // Data
    account,
    accounts,
    withdrawalSettings,
    
    // Loading states
    isLoading,
    isLoadingAccounts,
    isLoadingSettings,
    
    // Error
    error,
    
    // Queries
    fetchTransactions,
    
    // Mutations
    updateWithdrawalSettings: updateWithdrawalSettingsMutation.mutate,
    isUpdatingSettings: updateWithdrawalSettingsMutation.isPending,
    
    // Helpers
    formatBalance,
    hasSufficientBalance,
    getAccountStatus: getAccountStatus(),
    getAvailableBalance: getAvailableBalance(),
    refreshBalance,
    refetch,
    
    // Formatted data
    formattedBalance: formatBalance(account?.balance),
    formattedAvailableBalance: formatBalance(getAvailableBalance()),
  };
}