import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface FilterState {
  // User filters
  userFilters: {
    role?: string;
    verificationStatus?: string;
    searchQuery?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
  
  // Property filters
  propertyFilters: {
    status?: string;
    propertyType?: string;
    city?: string;
    state?: string;
    priceMin?: number;
    priceMax?: number;
    searchQuery?: string;
  };
  
  // Transaction filters
  transactionFilters: {
    status?: string;
    paymentType?: string;
    amountMin?: number;
    amountMax?: number;
    dateFrom?: Date;
    dateTo?: Date;
  };
  
  // Agent filters
  agentFilters: {
    minReliabilityScore?: number;
    serviceArea?: string;
    isAvailable?: boolean;
    searchQuery?: string;
  };
  
  // Actions
  setUserFilters: (filters: Partial<FilterState['userFilters']>) => void;
  setPropertyFilters: (filters: Partial<FilterState['propertyFilters']>) => void;
  setTransactionFilters: (filters: Partial<FilterState['transactionFilters']>) => void;
  setAgentFilters: (filters: Partial<FilterState['agentFilters']>) => void;
  clearUserFilters: () => void;
  clearPropertyFilters: () => void;
  clearTransactionFilters: () => void;
  clearAgentFilters: () => void;
  clearAllFilters: () => void;
}

const initialState = {
  userFilters: {},
  propertyFilters: {},
  transactionFilters: {},
  agentFilters: {},
};

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUserFilters: (filters) =>
          set((state) => ({
            userFilters: { ...state.userFilters, ...filters },
          })),

        setPropertyFilters: (filters) =>
          set((state) => ({
            propertyFilters: { ...state.propertyFilters, ...filters },
          })),

        setTransactionFilters: (filters) =>
          set((state) => ({
            transactionFilters: { ...state.transactionFilters, ...filters },
          })),

        setAgentFilters: (filters) =>
          set((state) => ({
            agentFilters: { ...state.agentFilters, ...filters },
          })),

        clearUserFilters: () => set({ userFilters: {} }),

        clearPropertyFilters: () => set({ propertyFilters: {} }),

        clearTransactionFilters: () => set({ transactionFilters: {} }),

        clearAgentFilters: () => set({ agentFilters: {} }),

        clearAllFilters: () => set(initialState),
      }),
      {
        name: 'admin-filters',
        partialize: (state) => ({
          userFilters: state.userFilters,
          propertyFilters: state.propertyFilters,
          transactionFilters: state.transactionFilters,
          agentFilters: state.agentFilters,
        }),
      }
    ),
    { name: 'Filter Store' }
  )
);