import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@newcondo/ui';
import { apiClient } from '@/lib/api/client';
import {
  fetchMyVirtualAccount,
  fetchVirtualAccountById,
  fetchAllVirtualAccounts,
  fetchAccountTransactions,
  fetchWithdrawalSettings,
  updateWithdrawalSettings,
} from '@/lib/api/virtualAccounts';
import type {
  TransactionListParams,
  UpdateWithdrawalSettingsParams,
  AccountStatus,
  UseVirtualAccountReturn,
  VirtualAccount
} from '@/types/virtualAccount';


export function useVirtualAccount(accountId?: string): UseVirtualAccountReturn {
  const queryClient = useQueryClient();

  // Fetch virtual account details
  const {
    data: account,
    isLoading,
    error,
    refetch,
  } = useQuery<VirtualAccount>({
    queryKey: ['virtual-account', accountId],
    queryFn: () =>
      accountId
        ? fetchVirtualAccountById(accountId)
        : fetchMyVirtualAccount(),
    refetchInterval: 30000, // Refetch every 30 seconds to keep balance updated
  });

  // Fetch all user's virtual accounts
  const {
    data: accounts,
    isLoading: isLoadingAccounts,
  } = useQuery({
    queryKey: ['virtual-accounts-list'],
    queryFn: fetchAllVirtualAccounts,
  });

  // ─── Withdrawal settings ─────────────────────────────────────────────────────

  const resolvedAccountId = accountId ?? account?.id;

  const { data: withdrawalSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['withdrawal-settings', resolvedAccountId],
    queryFn: () => fetchWithdrawalSettings(resolvedAccountId!),
    enabled: !!resolvedAccountId,
  });




  // ─── Fetch transaction history ───────────────────────────────────────────────

  const fetchTransactions = (params: TransactionListParams = {}) => {
    return useQuery({
      queryKey: ['virtual-account-transactions', accountId, params],
      queryFn: async () => {
        const targetAccountId = accountId || account?.id;
        if (!targetAccountId) return null;

        const response = await apiClient.get(`/virtual-accounts/${targetAccountId}/transactions`, {
          params,
        });
        return response.data;
      },
      enabled: !!(accountId || account?.id),
    });
  };

  // ─── Update withdrawal settings ───────────────────────────────────────────────

  const updateWithdrawalSettingsMutation = useMutation({
    mutationFn: async (settings: UpdateWithdrawalSettingsParams) => {
      if (!resolvedAccountId) throw new Error('No account ID available');
      return updateWithdrawalSettings(resolvedAccountId, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-settings'] });
      toast.success('Settings Updated', {
        description: 'Your withdrawal settings have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast.error('Update Failed', {
        description: error.response?.data?.message || 'Failed to update withdrawal settings.',
      });
    },
  });


  // ─── Helpers ──────────────────────────────────────────────────────────────────

  // Format balance
  const formatBalance = (amount?: number): string => {
    if (amount === undefined) return 'Loading...';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: account?.currency || 'NGN',
    }).format(amount);
  };

  // Check if account has sufficient balance
  const hasSufficientBalance = (amount: number): boolean => {
    if (!account) return false;
    return account.balance >= amount;

    //one-liner
    // !!account && account.balance >= amount;
  };

  // Get account status
  const getAccountStatus = (): AccountStatus  => {
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

  const availableBalance = getAvailableBalance();

  return {
    // Data
    account,
    accounts,
    withdrawalSettings,

    // Loading states
    isLoading,
    isLoadingAccounts,
    isLoadingSettings,
    isUpdatingSettings: updateWithdrawalSettingsMutation.isPending,

    // Error
    error: error as Error | null,

    updateWithdrawalSettings: updateWithdrawalSettingsMutation.mutate,

    // Helpers
    formatBalance,
    hasSufficientBalance,
    fetchTransactions,
    getAccountStatus: getAccountStatus(),
    getAvailableBalance: availableBalance,
    refreshBalance,
    refetch,

    // Formatted data
    formattedBalance: formatBalance(account?.balance),
    formattedAvailableBalance: formatBalance(availableBalance),
  };
}


// ─── Transactions hook (separate — Rules of Hooks) ──────────────────────────

export function useVirtualAccountTransactions(
  accountId: string | undefined,
  params: TransactionListParams = {}
) {
  return useQuery({
    queryKey: ['virtual-account-transactions', accountId, params],
    queryFn: () => fetchAccountTransactions(accountId!, params),
    enabled: !!accountId,
  });
}