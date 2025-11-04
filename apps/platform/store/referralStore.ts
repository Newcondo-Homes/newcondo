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