// apps/platform/store/referralStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Referral {
  id: string;
  propertyId: string;
  propertyTitle: string;
  promotionLink: string;
  views: number;
  clicks: number;
  conversions: number;
  earnings: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
  createdAt: string;
}

interface SubAgent {
  id: string;
  agentId: string;
  agentName: string;
  propertyId: string;
  status: 'PENDING' | 'APPROVED' | 'REVOKED';
  views: number;
  conversions: number;
  earnings: number;
  approvedAt?: string;
}

interface PromotionSettings {
  allowPublicPromotion: boolean;
  allowPermissionBasedPromotion: boolean;
  requireApproval: boolean;
  commissionSplitPercentage: number;
}

interface ReferralState {
  // Referral data
  referrals: Referral[];
  subAgents: SubAgent[];
  
  // Selected items
  selectedReferralId: string | null;
  selectedSubAgentIds: string[];
  
  // Filters
  referralStatusFilter: 'ALL' | 'ACTIVE' | 'EXPIRED' | 'PAUSED';
  subAgentStatusFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'REVOKED';
  
  // Property-specific promotion settings cache
  promotionSettingsCache: Record<string, PromotionSettings>;
  
  // UI state
  showPromotionLinkModal: boolean;
  showSubAgentApprovalModal: boolean;
  currentPropertyIdForPromotion: string | null;
  
  // Recently copied links
  recentlyCopiedLinks: string[];
  
  // Actions - Referrals
  setReferrals: (referrals: Referral[]) => void;
  addReferral: (referral: Referral) => void;
  updateReferral: (id: string, updates: Partial<Referral>) => void;
  removeReferral: (id: string) => void;
  
  setSelectedReferralId: (id: string | null) => void;
  setReferralStatusFilter: (status: 'ALL' | 'ACTIVE' | 'EXPIRED' | 'PAUSED') => void;
  
  // Actions - Sub-agents
  setSubAgents: (subAgents: SubAgent[]) => void;
  addSubAgent: (subAgent: SubAgent) => void;
  updateSubAgent: (id: string, updates: Partial<SubAgent>) => void;
  removeSubAgent: (id: string) => void;
  
  toggleSubAgentSelection: (id: string) => void;
  clearSubAgentSelection: () => void;
  setSubAgentStatusFilter: (status: 'ALL' | 'PENDING' | 'APPROVED' | 'REVOKED') => void;
  
  // Actions - Promotion settings
  cachePromotionSettings: (propertyId: string, settings: PromotionSettings) => void;
  getPromotionSettings: (propertyId: string) => PromotionSettings | undefined;
  clearPromotionSettingsCache: () => void;
  
  // Actions - UI
  togglePromotionLinkModal: (propertyId?: string) => void;
  toggleSubAgentApprovalModal: () => void;
  
  addRecentlyCopiedLink: (link: string) => void;
  clearRecentlyCopiedLinks: () => void;
  
  // Computed values
  getFilteredReferrals: () => Referral[];
  getFilteredSubAgents: () => SubAgent[];
  getTotalReferralEarnings: () => number;
  getPendingSubAgentsCount: () => number;
}

const defaultPromotionSettings: PromotionSettings = {
  allowPublicPromotion: true,
  allowPermissionBasedPromotion: true,
  requireApproval: false,
  commissionSplitPercentage: 50,
};

export const useReferralStore = create<ReferralState>()(
  devtools(
    persist(
      (set, get) => ({
        referrals: [],
        subAgents: [],
        selectedReferralId: null,
        selectedSubAgentIds: [],
        referralStatusFilter: 'ALL',
        subAgentStatusFilter: 'ALL',
        promotionSettingsCache: {},
        showPromotionLinkModal: false,
        showSubAgentApprovalModal: false,
        currentPropertyIdForPromotion: null,
        recentlyCopiedLinks: [],

        // Referral actions
        setReferrals: (referrals) =>
          set({ referrals }, false, 'setReferrals'),

        addReferral: (referral) =>
          set(
            (state) => ({ referrals: [referral, ...state.referrals] }),
            false,
            'addReferral'
          ),

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
            (state) => ({
              referrals: state.referrals.filter((r) => r.id !== id),
            }),
            false,
            'removeReferral'
          ),

        setSelectedReferralId: (id) =>
          set({ selectedReferralId: id }, false, 'setSelectedReferralId'),

        setReferralStatusFilter: (status) =>
          set({ referralStatusFilter: status }, false, 'setReferralStatusFilter'),

        // Sub-agent actions
        setSubAgents: (subAgents) =>
          set({ subAgents }, false, 'setSubAgents'),

        addSubAgent: (subAgent) =>
          set(
            (state) => ({ subAgents: [subAgent, ...state.subAgents] }),
            false,
            'addSubAgent'
          ),

        updateSubAgent: (id, updates) =>
          set(
            (state) => ({
              subAgents: state.subAgents.map((sa) =>
                sa.id === id ? { ...sa, ...updates } : sa
              ),
            }),
            false,
            'updateSubAgent'
          ),

        removeSubAgent: (id) =>
          set(
            (state) => ({
              subAgents: state.subAgents.filter((sa) => sa.id !== id),
            }),
            false,
            'removeSubAgent'
          ),

        toggleSubAgentSelection: (id) =>
          set(
            (state) => ({
              selectedSubAgentIds: state.selectedSubAgentIds.includes(id)
                ? state.selectedSubAgentIds.filter((saId) => saId !== id)
                : [...state.selectedSubAgentIds, id],
            }),
            false,
            'toggleSubAgentSelection'
          ),

        clearSubAgentSelection: () =>
          set({ selectedSubAgentIds: [] }, false, 'clearSubAgentSelection'),

        setSubAgentStatusFilter: (status) =>
          set({ subAgentStatusFilter: status }, false, 'setSubAgentStatusFilter'),

        // Promotion settings actions
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
          return promotionSettingsCache[propertyId] || defaultPromotionSettings;
        },

        clearPromotionSettingsCache: () =>
          set({ promotionSettingsCache: {} }, false, 'clearPromotionSettingsCache'),

        // UI actions
        togglePromotionLinkModal: (propertyId) =>
          set(
            (state) => ({
              showPromotionLinkModal: !state.showPromotionLinkModal,
              currentPropertyIdForPromotion: propertyId || null,
            }),
            false,
            'togglePromotionLinkModal'
          ),

        toggleSubAgentApprovalModal: () =>
          set(
            (state) => ({
              showSubAgentApprovalModal: !state.showSubAgentApprovalModal,
            }),
            false,
            'toggleSubAgentApprovalModal'
          ),

        addRecentlyCopiedLink: (link) =>
          set(
            (state) => ({
              recentlyCopiedLinks: [
                link,
                ...state.recentlyCopiedLinks.filter((l) => l !== link),
              ].slice(0, 5), // Keep only last 5
            }),
            false,
            'addRecentlyCopiedLink'
          ),

        clearRecentlyCopiedLinks: () =>
          set({ recentlyCopiedLinks: [] }, false, 'clearRecentlyCopiedLinks'),

        // Computed values
        getFilteredReferrals: () => {
          const { referrals, referralStatusFilter } = get();
          
          if (referralStatusFilter === 'ALL') {
            return referrals;
          }
          
          return referrals.filter((r) => r.status === referralStatusFilter);
        },

        getFilteredSubAgents: () => {
          const { subAgents, subAgentStatusFilter } = get();
          
          if (subAgentStatusFilter === 'ALL') {
            return subAgents;
          }
          
          return subAgents.filter((sa) => sa.status === subAgentStatusFilter);
        },

        getTotalReferralEarnings: () => {
          const { referrals } = get();
          return referrals.reduce((sum, r) => sum + r.earnings, 0);
        },

        getPendingSubAgentsCount: () => {
          const { subAgents } = get();
          return subAgents.filter((sa) => sa.status === 'PENDING').length;
        },
      }),
      {
        name: 'referral-storage',
        partialize: (state) => ({
          referralStatusFilter: state.referralStatusFilter,
          subAgentStatusFilter: state.subAgentStatusFilter,
          recentlyCopiedLinks: state.recentlyCopiedLinks,
        }),
      }
    ),
    { name: 'ReferralStore' }
  )
);








//////////////////////////////////////////


// apps/platform/store/referralStore.ts

// import { create } from 'zustand';
// import { devtools, persist } from 'zustand/middleware';
// import {
//   Referral,
//   ReferralStats,
//   ReferralLink,
//   ReferralLeaderboardEntry,
// } from '@/types/referral';
// import { Reward, RewardSummary } from '@/types/reward';

// interface ReferralState {
//   // Referral data
//   referralLink: ReferralLink | null;
//   referrals: Referral[];
//   stats: ReferralStats | null;
//   leaderboard: ReferralLeaderboardEntry[];
//   userRank: number | null;
  
//   // Rewards data
//   rewards: Reward[];
//   rewardsSummary: RewardSummary | null;
  
//   // Pagination
//   currentPage: number;
//   pageSize: number;
//   totalPages: number;
//   totalItems: number;
  
//   // Loading states
//   isLoadingReferrals: boolean;
//   isLoadingStats: boolean;
//   isLoadingRewards: boolean;
//   isLoadingLeaderboard: boolean;
  
//   // Error states
//   error: string | null;
  
//   // UI states
//   selectedReferral: Referral | null;
//   selectedReward: Reward | null;
//   isShareModalOpen: boolean;
//   isInviteModalOpen: boolean;
//   isRedemptionModalOpen: boolean;
  
//   // Actions - Referral Link
//   setReferralLink: (link: ReferralLink) => void;
  
//   // Actions - Referrals
//   setReferrals: (referrals: Referral[]) => void;
//   addReferral: (referral: Referral) => void;
//   updateReferral: (id: string, updates: Partial<Referral>) => void;
//   removeReferral: (id: string) => void;
  
//   // Actions - Stats
//   setStats: (stats: ReferralStats) => void;
//   incrementClickCount: () => void;
  
//   // Actions - Rewards
//   setRewards: (rewards: Reward[]) => void;
//   setRewardsSummary: (summary: RewardSummary) => void;
//   addReward: (reward: Reward) => void;
//   updateReward: (id: string, updates: Partial<Reward>) => void;
//   markRewardAsRedeemed: (id: string) => void;
  
//   // Actions - Leaderboard
//   setLeaderboard: (leaderboard: ReferralLeaderboardEntry[], userRank: number | null) => void;
  
//   // Actions - Pagination
//   setPage: (page: number) => void;
//   setPageSize: (size: number) => void;
//   setPaginationData: (data: { page: number; pageSize: number; totalPages: number; totalItems: number }) => void;
  
//   // Actions - Loading
//   setLoadingReferrals: (loading: boolean) => void;
//   setLoadingStats: (loading: boolean) => void;
//   setLoadingRewards: (loading: boolean) => void;
//   setLoadingLeaderboard: (loading: boolean) => void;
  
//   // Actions - Error
//   setError: (error: string | null) => void;
  
//   // Actions - UI
//   selectReferral: (referral: Referral | null) => void;
//   selectReward: (reward: Reward | null) => void;
//   toggleShareModal: () => void;
//   toggleInviteModal: () => void;
//   toggleRedemptionModal: () => void;
  
//   // Actions - Reset
//   reset: () => void;
// }

// const initialState = {
//   referralLink: null,
//   referrals: [],
//   stats: null,
//   leaderboard: [],
//   userRank: null,
//   rewards: [],
//   rewardsSummary: null,
//   currentPage: 1,
//   pageSize: 20,
//   totalPages: 0,
//   totalItems: 0,
//   isLoadingReferrals: false,
//   isLoadingStats: false,
//   isLoadingRewards: false,
//   isLoadingLeaderboard: false,
//   error: null,
//   selectedReferral: null,
//   selectedReward: null,
//   isShareModalOpen: false,
//   isInviteModalOpen: false,
//   isRedemptionModalOpen: false,
// };

// export const useReferralStore = create<ReferralState>()(
//   devtools(
//     persist(
//       (set) => ({
//         ...initialState,
        
//         // Referral Link
//         setReferralLink: (link) => set({ referralLink: link }),
        
//         // Referrals
//         setReferrals: (referrals) => set({ referrals }),
        
//         addReferral: (referral) =>
//           set((state) => ({ referrals: [referral, ...state.referrals] })),
        
//         updateReferral: (id, updates) =>
//           set((state) => ({
//             referrals: state.referrals.map((ref) =>
//               ref.id === id ? { ...ref, ...updates } : ref
//             ),
//           })),
        
//         removeReferral: (id) =>
//           set((state) => ({
//             referrals: state.referrals.filter((ref) => ref.id !== id),
//           })),
        
//         // Stats
//         setStats: (stats) => set({ stats }),
        
//         incrementClickCount: () =>
//           set((state) => ({
//             stats: state.stats
//               ? { ...state.stats, clickCount: state.stats.clickCount + 1 }
//               : null,
//           })),
        
//         // Rewards
//         setRewards: (rewards) => set({ rewards }),
        
//         setRewardsSummary: (summary) => set({ rewardsSummary: summary }),
        
//         addReward: (reward) =>
//           set((state) => ({ rewards: [reward, ...state.rewards] })),
        
//         updateReward: (id, updates) =>
//           set((state) => ({
//             rewards: state.rewards.map((reward) =>
//               reward.id === id ? { ...reward, ...updates } : reward
//             ),
//           })),
        
//         markRewardAsRedeemed: (id) =>
//           set((state) => ({
//             rewards: state.rewards.map((reward) =>
//               reward.id === id
//                 ? { ...reward, isRedeemed: true, redeemedAt: new Date().toISOString() }
//                 : reward
//             ),
//           })),
        
//         // Leaderboard
//         setLeaderboard: (leaderboard, userRank) => set({ leaderboard, userRank }),
        
//         // Pagination
//         setPage: (page) => set({ currentPage: page }),
        
//         setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
        
//         setPaginationData: (data) =>
//           set({
//             currentPage: data.page,
//             pageSize: data.pageSize,
//             totalPages: data.totalPages,
//             totalItems: data.totalItems,
//           }),
        
//         // Loading
//         setLoadingReferrals: (loading) => set({ isLoadingReferrals: loading }),
        
//         setLoadingStats: (loading) => set({ isLoadingStats: loading }),
        
//         setLoadingRewards: (loading) => set({ isLoadingRewards: loading }),
        
//         setLoadingLeaderboard: (loading) => set({ isLoadingLeaderboard: loading }),
        
//         // Error
//         setError: (error) => set({ error }),
        
//         // UI
//         selectReferral: (referral) => set({ selectedReferral: referral }),
        
//         selectReward: (reward) => set({ selectedReward: reward }),
        
//         toggleShareModal: () =>
//           set((state) => ({ isShareModalOpen: !state.isShareModalOpen })),
        
//         toggleInviteModal: () =>
//           set((state) => ({ isInviteModalOpen: !state.isInviteModalOpen })),
        
//         toggleRedemptionModal: () =>
//           set((state) => ({ isRedemptionModalOpen: !state.isRedemptionModalOpen })),
        
//         // Reset
//         reset: () => set(initialState),
//       }),
//       {
//         name: 'referral-storage',
//         partialize: (state) => ({
//           referralLink: state.referralLink,
//           stats: state.stats,
//         }),
//       }
//     ),
//     { name: 'ReferralStore' }
//   )
// );

// // Selectors for computed values
// export const selectAvailableRewards = (state: ReferralState) =>
//   state.rewards.filter((r) => r.status === 'APPROVED' && !r.isRedeemed);

// export const selectPendingRewards = (state: ReferralState) =>
//   state.rewards.filter((r) => r.status === 'PENDING');

// export const selectTotalAvailableBalance = (state: ReferralState) =>
//   state.rewards
//     .filter((r) => r.status === 'APPROVED' && !r.isRedeemed)
//     .reduce((sum, r) => sum + r.amount, 0);

// export const selectQualifiedReferrals = (state: ReferralState) =>
//   state.referrals.filter((r) => r.qualificationMet);

// export const selectPendingReferrals = (state: ReferralState) =>
//   state.referrals.filter((r) => r.status === 'PENDING');