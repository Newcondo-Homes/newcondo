// apps/platform/hooks/useRewards.ts

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReferralStore } from '@/store/referralStore';
import * as rewardsApi from '@/lib/api/rewards';
import { RewardQuery } from '@/lib/validations/reward';
import { toast } from 'sonner';


export function useRewards(query?: RewardQuery) {
  const {
    setRewards,
    setPaginationData,
    setLoadingRewards,
    setError,
  } = useReferralStore();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rewards', query],
    queryFn: () => rewardsApi.getRewards(query),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setRewards(data.rewards);
      setPaginationData({
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        totalItems: data.totalCount,
      });
      setLoadingRewards(false);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      setError((error as Error).message);
      setLoadingRewards(false);
      toast.error('Failed to load rewards', {
        description: (error as Error).message,
      });
    }
  }, [error]);

  return {
    rewards: data?.rewards ?? [],
    totalCount: data?.totalCount ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    refetch,
  };
}

export function useRewardsSummary() {
  const { setRewardsSummary } = useReferralStore();

  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rewards-summary'],
    queryFn: rewardsApi.getRewardsSummary,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (summary) {
      setRewardsSummary(summary);
    }
  }, [summary]);

  return {
    summary,
    isLoading,
    error,
    refetch,
  };
}

export function useRewardById(id: string) {
  const { selectReward } = useReferralStore();

  const {
    data: reward,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reward', id],
    queryFn: () => rewardsApi.getRewardById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (reward) {
      selectReward(reward);
    }
  }, [reward]);

  return {
    reward,
    isLoading,
    error,
  };
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  const { markRewardAsRedeemed } = useReferralStore();

  return useMutation({
    mutationFn: rewardsApi.redeemReward,
    onSuccess: (data, variables) => {
      markRewardAsRedeemed(variables.rewardId);
      toast.success('Reward redeemed successfully!', {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-summary'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to redeem reward', {
        description: error.message,
      });
    },
  });
}

export function useRedeemMultipleRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rewardsApi.redeemMultipleRewards,
    onSuccess: (data) => {
      toast.success(`Redeemed ${data.success} rewards!`, {
        description: `Total amount: ₦${data.totalAmount.toLocaleString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-summary'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to redeem rewards', {
        description: error.message,
      });
    },
  });
}

export function useAvailableRewards() {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['available-rewards'],
    queryFn: rewardsApi.getAvailableRewards,
    staleTime: 3 * 60 * 1000,
  });

  return {
    rewards: data?.rewards ?? [],
    totalValue: data?.totalValue ?? 0,
    isLoading,
    error,
  };
}

export function usePendingRewards() {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pending-rewards'],
    queryFn: rewardsApi.getPendingRewards,
    staleTime: 3 * 60 * 1000,
  });

  return {
    rewards: data?.rewards ?? [],
    totalValue: data?.totalValue ?? 0,
    isLoading,
    error,
  };
}

export function useCheckRedemptionEligibility(rewardId: string) {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['redemption-eligibility', rewardId],
    queryFn: () => rewardsApi.checkRedemptionEligibility(rewardId),
    enabled: !!rewardId,
  });

  return {
    eligible: data?.eligible ?? false,
    reason: data?.reason,
    minAmount: data?.minAmount,
    isLoading,
    error,
  };
}

export function useRedemptionHistory() {
  const {
    data: history,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['redemption-history'],
    queryFn: rewardsApi.getRedemptionHistory,
    staleTime: 5 * 60 * 1000,
  });

  return {
    history: history ?? [],
    isLoading,
    error,
  };
}

export function useRewardTiers() {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reward-tiers'],
    queryFn: rewardsApi.getRewardTiers,
    staleTime: 10 * 60 * 1000,
  });

  return {
    currentTier: data?.currentTier,
    nextTier: data?.nextTier,
    progress: data?.progress ?? 0,
    isLoading,
    error,
  };
}

export function useMilestoneBonuses() {
  const {
    data: bonuses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['milestone-bonuses'],
    queryFn: rewardsApi.getMilestoneBonuses,
    staleTime: 10 * 60 * 1000,
  });

  return {
    bonuses: bonuses ?? [],
    isLoading,
    error,
  };
}

export function useNextMilestone() {
  const {
    data: milestone,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['next-milestone'],
    queryFn: rewardsApi.getNextMilestone,
    staleTime: 5 * 60 * 1000,
  });

  return {
    milestone,
    isLoading,
    error,
  };
}

export function useApplyServiceCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rewardsApi.applyServiceCredit,
    onSuccess: (data) => {
      toast.success('Service credit applied!', {
        description: `₦${data.creditApplied.toLocaleString()} added to your account`,
      });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-summary'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to apply credit', {
        description: error.message,
      });
    },
  });
}

export function useRewardTransactions() {
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reward-transactions'],
    queryFn: rewardsApi.getRewardTransactions,
    staleTime: 5 * 60 * 1000,
  });

  return {
    transactions: transactions ?? [],
    isLoading,
    error,
  };
}