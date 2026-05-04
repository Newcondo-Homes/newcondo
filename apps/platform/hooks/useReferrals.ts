// apps/platform/hooks/useReferrals.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReferralStore } from '@/store/referralStore';
import * as referralApi from '@/lib/api/referrals';
import { ReferralListQuery } from '@/lib/validations/referral';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useReferrals(query?: ReferralListQuery) {
  const queryClient = useQueryClient();
  const { setReferrals, setPaginationData, setLoadingReferrals, setError } = useReferralStore();

  // Fetch referrals
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['referrals', query],
    queryFn: () => referralApi.getReferrals(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  useEffect(() => {
    if (data) {
      setReferrals(data.referrals);
      setPaginationData({
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        totalItems: data.total,
      });
      setLoadingReferrals(false);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      setError((error as Error).message);
      setLoadingReferrals(false);
      toast.error('Failed to load referrals', {
        description: (error as Error).message,
      });
    }
  }, [error]);

  return {
    referrals: data?.referrals ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    refetch,
  };
}

export function useReferralStats() {
  const { setStats, setLoadingStats, setError } = useReferralStore();

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: referralApi.getReferralStats,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (stats) {
      setStats(stats);
      setLoadingStats(false);
    }
  }, [stats]);

  useEffect(() => {
    if (error) {
      setError((error as Error).message);
      setLoadingStats(false);
    }
  }, [error]);


  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

export function useReferralById(id: string) {
  const { selectReferral } = useReferralStore();

  const {
    data: referral,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['referral', id],
    queryFn: () => referralApi.getReferralById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (referral) {
      selectReferral(referral);
    }
  }, [referral]);

  return {
    referral,
    isLoading,
    error,
  };
}

export function useInviteViaEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referralApi.inviteViaEmail,
    onSuccess: (data) => {
      toast.success('Invitation sent!', {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to send invitation', {
        description: error.message,
      });
    },
  });
}

export function useInviteViaSMS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referralApi.inviteViaSMS,
    onSuccess: (data) => {
      toast.success('SMS invitation sent!', {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to send SMS', {
        description: error.message,
      });
    },
  });
}

export function useInviteViaWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referralApi.inviteViaWhatsApp,
    onSuccess: (data) => {
      // Open WhatsApp URL
      window.open(data.whatsappUrl, '_blank');
      toast.success('Opening WhatsApp...');
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to prepare WhatsApp message', {
        description: error.message,
      });
    },
  });
}

export function useBulkInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referralApi.sendBulkInvites,
    onSuccess: (data) => {
      toast.success('Invitations sent!', {
        description: `Successfully sent ${data.success} invitations. ${data.failed} failed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to send invitations', {
        description: error.message,
      });
    },
  });
}

export function useValidateReferralCode() {
  return useMutation({
    mutationFn: referralApi.validateReferralCode,
    onError: (error: Error) => {
      toast.error('Invalid referral code', {
        description: error.message,
      });
    },
  });
}

export function useApplyReferralCode() {
  return useMutation({
    mutationFn: referralApi.applyReferralCode,
    onSuccess: (data) => {
      toast.success('Referral code applied!', {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to apply referral code', {
        description: error.message,
      });
    },
  });
}

export function useReferralLeaderboard(params?: {
  period?: 'week' | 'month' | 'year' | 'all';
  limit?: number;
}) {
  const { setLeaderboard, setLoadingLeaderboard } = useReferralStore();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['referral-leaderboard', params],
    queryFn: () => referralApi.getReferralLeaderboard(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (data) {
      setLeaderboard(data.leaderboard, data.userRank);
      setLoadingLeaderboard(false);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      setLoadingLeaderboard(false);
    }
  }, [error]);

  return {
    leaderboard: data?.leaderboard ?? [],
    userRank: data?.userRank ?? null,
    isLoading,
    error,
  };
}

export function useReferralTimeline() {
  const {
    data: timeline,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['referral-timeline'],
    queryFn: referralApi.getReferralTimeline,
    staleTime: 5 * 60 * 1000,
  });

  return {
    timeline: timeline ?? [],
    isLoading,
    error,
  };
}

export function useRegenerateReferralCode() {
  const queryClient = useQueryClient();
  const { setReferralLink } = useReferralStore();

  return useMutation({
    mutationFn: referralApi.regenerateReferralCode,
    onSuccess: (data) => {
      setReferralLink(data);
      toast.success('Referral code regenerated!');
      queryClient.invalidateQueries({ queryKey: ['referral-link'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to regenerate code', {
        description: error.message,
      });
    },
  });
}