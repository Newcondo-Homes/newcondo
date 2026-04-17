// apps/platform/store/referralStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Referral,
  ReferralStats,
  ReferralLink,
  ReferralLeaderboardEntry,
} from '@/types/referral';
import { Reward, RewardSummary } from '@/types/reward';

interface PromotionSettings {
  allowPublicPromotion: boolean;
  allowPermissionBasedPromotion: boolean;
  requireApproval: boolean;
  commissionSplitPercentage: number;
}

interface ReferralState {
  // Referral data
  referralLink: ReferralLink | null;
  referrals: Referral[];
  stats: ReferralStats | null;
  leaderboard: ReferralLeaderboardEntry[];
  userRank: number | null;

  // rewards data
  rewards: Reward[];
  rewardsSummary: RewardSummary | null;

  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;

  // Loading states
  isLoadingReferrals: boolean;
  isLoadingStats: boolean;
  isLoadingLeaderboard: boolean;
  isLoadingRewards: boolean;

  // Error states
  error: string | null;

  // UI states
  selectedReferral: Referral | null;
  selectedReward: Reward | null;
  isShareModalOpen: boolean;
  isInviteModalOpen: boolean;
  isRedemptionModalOpen: boolean;

  // Promotion settings cache
  promotionSettingsCache: Record<string, PromotionSettings>;

  // Recently copied links
  recentlyCopiedLinks: string[];

  // Actions - Referral Link
  setReferralLink: (link: ReferralLink) => void;

  // Actions - Referrals
  setReferrals: (referrals: Referral[]) => void;
  addReferral: (referral: Referral) => void;
  updateReferral: (id: string, updates: Partial<Referral>) => void;
  removeReferral: (id: string) => void;

  // Actions - rewards
  setRewards: (rewards: Reward[]) => void;
  setRewardsSummary: (summary: RewardSummary) => void;
  addReward: (reward: Reward) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  markRewardAsRedeemed: (id: string) => void;
  setLoadingRewards: (loading: boolean) => void;

  // Actions - Stats
  setStats: (stats: ReferralStats) => void;
  incrementClickCount: () => void;

  // Actions - Leaderboard
  setLeaderboard: (leaderboard: ReferralLeaderboardEntry[], userRank: number | null) => void;
  setLoadingLeaderboard: (loading: boolean) => void;

  // Actions - Pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setPaginationData: (data: { page: number; pageSize: number; totalPages: number; totalItems: number }) => void;

  // Actions - Loading
  setLoadingReferrals: (loading: boolean) => void;
  setLoadingStats: (loading: boolean) => void;

  // Actions - Error
  setError: (error: string | null) => void;

  // Actions - UI
  selectReferral: (referral: Referral | null) => void;
  selectReward: (reward: Reward | null) => void;
  toggleShareModal: () => void;
  toggleInviteModal: () => void;
  toggleRedemptionModal: () => void;

  // Actions - Promotion settings
  cachePromotionSettings: (propertyId: string, settings: PromotionSettings) => void;
  getPromotionSettings: (propertyId: string) => PromotionSettings | undefined;
  clearPromotionSettingsCache: () => void;

  // Actions - Recently copied links
  addRecentlyCopiedLink: (link: string) => void;
  clearRecentlyCopiedLinks: () => void;

  // Actions - Reset
  reset: () => void;
}

const defaultPromotionSettings: PromotionSettings = {
  allowPublicPromotion: true,
  allowPermissionBasedPromotion: true,
  requireApproval: false,
  commissionSplitPercentage: 50,
};

const initialState = {
  referralLink: null,
  rewards: [],
  rewardsSummary: null,
  referrals: [],
  stats: null,
  leaderboard: [],
  userRank: null,
  currentPage: 1,
  pageSize: 20,
  totalPages: 0,
  totalItems: 0,
  isLoadingReferrals: false,
  isLoadingStats: false,
  isLoadingLeaderboard: false,
  error: null,
  selectedReferral: null,
  selectedReward: null,
  isShareModalOpen: false,
  isInviteModalOpen: false,
  isRedemptionModalOpen: false,
  isLoadingRewards: false,
  promotionSettingsCache: {},
  recentlyCopiedLinks: [],
};

export const useReferralStore = create<ReferralState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setReferralLink: (link) => set({ referralLink: link }, false, 'setReferralLink'),

        setReferrals: (referrals) => set({ referrals }, false, 'setReferrals'),

        addReferral: (referral) =>
          set(
            (state) => ({ referrals: [referral, ...state.referrals] }),
            false,
            'addReferral'
          ),

        setRewards: (rewards) => set({ rewards }, false, 'setRewards'),

        setRewardsSummary: (summary) => set({ rewardsSummary: summary }, false, 'setRewardsSummary'),

        addReward: (reward) =>
          set(
            (state) => ({ rewards: [reward, ...state.rewards] }),
            false,
            'addReward'
          ),

        updateReward: (id, updates) =>
          set(
            (state) => ({
              rewards: state.rewards.map((r) =>
                r.id === id ? { ...r, ...updates } : r
              ),
            }),
            false,
            'updateReward'
          ),

        markRewardAsRedeemed: (id) =>
          set(
            (state) => ({
              rewards: state.rewards.map((r) =>
                r.id === id
                  ? { ...r, isRedeemed: true, redeemedAt: new Date().toISOString() }
                  : r
              ),
            }),
            false,
            'markRewardAsRedeemed'
          ),

        setLoadingRewards: (loading) =>
          set({ isLoadingRewards: loading }, false, 'setLoadingRewards'),

        
        updateReferral: (id, updates) =>
          set(
            (state) => ({
              referrals: state.referrals.map((r) =>
                r.id === id ? { ...r, ...updates } : r
              ),
            }),
            false,
            'updateReferral'
          ),

        removeReferral: (id) =>
          set(
            (state) => ({ referrals: state.referrals.filter((r) => r.id !== id) }),
            false,
            'removeReferral'
          ),

        setStats: (stats) => set({ stats }, false, 'setStats'),

        incrementClickCount: () =>
          set(
            (state) => ({
              stats: state.stats
                ? { ...state.stats, clickCount: state.stats.clickCount + 1 }
                : null,
            }),
            false,
            'incrementClickCount'
          ),

        setLeaderboard: (leaderboard, userRank) =>
          set({ leaderboard, userRank }, false, 'setLeaderboard'),

        setLoadingLeaderboard: (loading) =>
          set({ isLoadingLeaderboard: loading }, false, 'setLoadingLeaderboard'),

        setPage: (page) => set({ currentPage: page }, false, 'setPage'),

        setPageSize: (size) => set({ pageSize: size, currentPage: 1 }, false, 'setPageSize'),

        setPaginationData: (data) =>
          set(
            {
              currentPage: data.page,
              pageSize: data.pageSize,
              totalPages: data.totalPages,
              totalItems: data.totalItems,
            },
            false,
            'setPaginationData'
          ),

        setLoadingReferrals: (loading) =>
          set({ isLoadingReferrals: loading }, false, 'setLoadingReferrals'),

        setLoadingStats: (loading) =>
          set({ isLoadingStats: loading }, false, 'setLoadingStats'),

        setError: (error) => set({ error }, false, 'setError'),

        selectReferral: (referral) =>
          set({ selectedReferral: referral }, false, 'selectReferral'),

        selectReward: (reward) =>
          set({ selectedReward: reward }, false, 'selectReward'),

        toggleShareModal: () =>
          set(
            (state) => ({ isShareModalOpen: !state.isShareModalOpen }),
            false,
            'toggleShareModal'
          ),

        toggleInviteModal: () =>
          set(
            (state) => ({ isInviteModalOpen: !state.isInviteModalOpen }),
            false,
            'toggleInviteModal'
          ),

        toggleRedemptionModal: () =>
          set(
            (state) => ({ isRedemptionModalOpen: !state.isRedemptionModalOpen }),
            false,
            'toggleRedemptionModal'
          ),

        cachePromotionSettings: (propertyId, settings) =>
          set(
            (state) => ({
              promotionSettingsCache: {
                ...state.promotionSettingsCache,
                [propertyId]: settings,
              },
            }),
            false,
            'cachePromotionSettings'
          ),

        getPromotionSettings: (propertyId) => {
          const { promotionSettingsCache } = get();
          return promotionSettingsCache[propertyId] ?? defaultPromotionSettings;
        },

        clearPromotionSettingsCache: () =>
          set({ promotionSettingsCache: {} }, false, 'clearPromotionSettingsCache'),

        addRecentlyCopiedLink: (link) =>
          set(
            (state) => ({
              recentlyCopiedLinks: [
                link,
                ...state.recentlyCopiedLinks.filter((l) => l !== link),
              ].slice(0, 5),
            }),
            false,
            'addRecentlyCopiedLink'
          ),

        clearRecentlyCopiedLinks: () =>
          set({ recentlyCopiedLinks: [] }, false, 'clearRecentlyCopiedLinks'),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'referral-storage',
        partialize: (state) => ({
          referralLink: state.referralLink,
          stats: state.stats,
          recentlyCopiedLinks: state.recentlyCopiedLinks,
        }),
      }
    ),
    { name: 'ReferralStore' }
  )
);

// Selectors
export const selectQualifiedReferrals = (state: ReferralState) =>
  state.referrals.filter((r) => r.qualificationMet);

export const selectPendingReferrals = (state: ReferralState) =>
  state.referrals.filter((r) => r.status === 'PENDING');