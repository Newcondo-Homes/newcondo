// apps/platform/store/commissionStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Commission {
  id: string;
  amount: number;
  status: 'PENDING' | 'RELEASED' | 'WITHDRAWN';
  type: 'LISTING_AGENT' | 'SUB_AGENT' | 'MARKING_SERVICE';
  propertyId: string;
  propertyTitle: string;
  createdAt: string;
  releasedAt?: string;
}

interface WithdrawalSettings {
  autoWithdrawal: boolean;
  minimumBalance?: number;
  frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  bankAccountId?: string;
}

interface CommissionState {
  // Commission data
  commissions: Commission[];
  selectedCommissionId: string | null;
  
  // Filters
  statusFilter: 'ALL' | 'PENDING' | 'RELEASED' | 'WITHDRAWN';
  typeFilter: 'ALL' | 'LISTING_AGENT' | 'SUB_AGENT' | 'MARKING_SERVICE';
  
  // Summary data (cached)
  summary: {
    totalEarned: number;
    availableBalance: number;
    pendingBalance: number;
    withdrawnTotal: number;
    lastUpdated?: Date;
  };
  
  // Withdrawal settings
  withdrawalSettings: WithdrawalSettings;
  
  // UI state
  showWithdrawalModal: boolean;
  selectedForWithdrawal: string[];
  
  // Actions
  setCommissions: (commissions: Commission[]) => void;
  addCommission: (commission: Commission) => void;
  updateCommission: (id: string, updates: Partial<Commission>) => void;
  
  setSelectedCommissionId: (id: string | null) => void;
  
  setStatusFilter: (status: 'ALL' | 'PENDING' | 'RELEASED' | 'WITHDRAWN') => void;
  setTypeFilter: (type: 'ALL' | 'LISTING_AGENT' | 'SUB_AGENT' | 'MARKING_SERVICE') => void;
  resetFilters: () => void;
  
  updateSummary: (summary: Partial<CommissionState['summary']>) => void;
  
  setWithdrawalSettings: (settings: WithdrawalSettings) => void;
  updateWithdrawalSettings: (updates: Partial<WithdrawalSettings>) => void;
  
  toggleWithdrawalModal: () => void;
  selectForWithdrawal: (id: string) => void;
  deselectForWithdrawal: (id: string) => void;
  clearWithdrawalSelection: () => void;
  
  // Computed values
  getFilteredCommissions: () => Commission[];
  getTotalSelectedAmount: () => number;
}

export const useCommissionStore = create<CommissionState>()(
  devtools(
    persist(
      (set, get) => ({
        commissions: [],
        selectedCommissionId: null,
        statusFilter: 'ALL',
        typeFilter: 'ALL',
        summary: {
          totalEarned: 0,
          availableBalance: 0,
          pendingBalance: 0,
          withdrawnTotal: 0,
        },
        withdrawalSettings: {
          autoWithdrawal: false,
        },
        showWithdrawalModal: false,
        selectedForWithdrawal: [],

        setCommissions: (commissions) =>
          set({ commissions }, false, 'setCommissions'),

        addCommission: (commission) =>
          set(
            (state) => ({ commissions: [commission, ...state.commissions] }),
            false,
            'addCommission'
          ),

        updateCommission: (id, updates) =>
          set(
            (state) => ({
              commissions: state.commissions.map((c) =>
                c.id === id ? { ...c, ...updates } : c
              ),
            }),
            false,
            'updateCommission'
          ),

        setSelectedCommissionId: (id) =>
          set({ selectedCommissionId: id }, false, 'setSelectedCommissionId'),

        setStatusFilter: (status) =>
          set({ statusFilter: status }, false, 'setStatusFilter'),

        setTypeFilter: (type) =>
          set({ typeFilter: type }, false, 'setTypeFilter'),

        resetFilters: () =>
          set(
            { statusFilter: 'ALL', typeFilter: 'ALL' },
            false,
            'resetFilters'
          ),

        updateSummary: (summary) =>
          set(
            (state) => ({
              summary: { ...state.summary, ...summary, lastUpdated: new Date() },
            }),
            false,
            'updateSummary'
          ),

        setWithdrawalSettings: (settings) =>
          set({ withdrawalSettings: settings }, false, 'setWithdrawalSettings'),

        updateWithdrawalSettings: (updates) =>
          set(
            (state) => ({
              withdrawalSettings: { ...state.withdrawalSettings, ...updates },
            }),
            false,
            'updateWithdrawalSettings'
          ),

        toggleWithdrawalModal: () =>
          set(
            (state) => ({ showWithdrawalModal: !state.showWithdrawalModal }),
            false,
            'toggleWithdrawalModal'
          ),

        selectForWithdrawal: (id) =>
          set(
            (state) => ({
              selectedForWithdrawal: state.selectedForWithdrawal.includes(id)
                ? state.selectedForWithdrawal
                : [...state.selectedForWithdrawal, id],
            }),
            false,
            'selectForWithdrawal'
          ),

        deselectForWithdrawal: (id) =>
          set(
            (state) => ({
              selectedForWithdrawal: state.selectedForWithdrawal.filter(
                (commId) => commId !== id
              ),
            }),
            false,
            'deselectForWithdrawal'
          ),

        clearWithdrawalSelection: () =>
          set({ selectedForWithdrawal: [] }, false, 'clearWithdrawalSelection'),

        getFilteredCommissions: () => {
          const { commissions, statusFilter, typeFilter } = get();
          
          return commissions.filter((commission) => {
            const statusMatch =
              statusFilter === 'ALL' || commission.status === statusFilter;
            const typeMatch =
              typeFilter === 'ALL' || commission.type === typeFilter;
            
            return statusMatch && typeMatch;
          });
        },

        getTotalSelectedAmount: () => {
          const { commissions, selectedForWithdrawal } = get();
          
          return commissions
            .filter((c) => selectedForWithdrawal.includes(c.id))
            .reduce((sum, c) => sum + c.amount, 0);
        },
      }),
      {
        name: 'commission-storage',
        partialize: (state) => ({
          withdrawalSettings: state.withdrawalSettings,
          statusFilter: state.statusFilter,
          typeFilter: state.typeFilter,
        }),
      }
    ),
    { name: 'CommissionStore' }
  )
);