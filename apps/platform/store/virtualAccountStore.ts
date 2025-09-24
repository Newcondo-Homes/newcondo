// apps/platform/store/virtualAccountStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  balance: number;
  currency: string;
  isActive: boolean;
  propertyId?: string;
  propertyTitle?: string;
  flutterwaveAccountId?: string;
  lastUpdated: string;
  createdAt: string;
}

export interface AccountTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  balanceAfter: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  source: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface VirtualAccountState {
  // Account data
  accounts: VirtualAccount[];
  selectedAccountId: string | null;
  
  // Transaction data
  transactions: Record<string, AccountTransaction[]>;
  transactionFilters: {
    type: 'ALL' | 'CREDIT' | 'DEBIT';
    status: 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED';
    dateRange: {
      start?: string;
      end?: string;
    };
    source?: string;
    amountRange: {
      min?: number;
      max?: number;
    };
  };
  
  // UI state
  isLoading: boolean;
  isCreatingAccount: boolean;
  isRefreshingBalance: boolean;
  error: string | null;
  lastRefresh: string | null;
  
  // Balance history
  balanceHistory: Record<string, { date: string; balance: number }[]>;
  
  // Statement generation
  isGeneratingStatement: boolean;
  statementProgress: number;
  
  // Reconciliation
  reconciledTransactions: Set<string>;
  pendingReconciliation: AccountTransaction[];
}

export interface VirtualAccountActions {
  // Account management
  setAccounts: (accounts: VirtualAccount[]) => void;
  addAccount: (account: VirtualAccount) => void;
  updateAccount: (accountId: string, updates: Partial<VirtualAccount>) => void;
  removeAccount: (accountId: string) => void;
  selectAccount: (accountId: string | null) => void;
  
  // Balance management
  updateBalance: (accountId: string, balance: number) => void;
  refreshBalance: (accountId: string) => void;
  setBalanceHistory: (accountId: string, history: { date: string; balance: number }[]) => void;
  
  // Transaction management
  setTransactions: (accountId: string, transactions: AccountTransaction[]) => void;
  addTransaction: (accountId: string, transaction: AccountTransaction) => void;
  updateTransaction: (accountId: string, transactionId: string, updates: Partial<AccountTransaction>) => void;
  markTransactionReconciled: (transactionId: string) => void;
  addPendingReconciliation: (transaction: AccountTransaction) => void;
  
  // Filtering
  setTransactionFilters: (filters: Partial<VirtualAccountState['transactionFilters']>) => void;
  resetFilters: () => void;
  
  // UI state management
  setLoading: (isLoading: boolean) => void;
  setCreatingAccount: (isCreating: boolean) => void;
  setRefreshingBalance: (isRefreshing: boolean) => void;
  setError: (error: string | null) => void;
  setLastRefresh: (timestamp: string) => void;
  
  // Statement generation
  setGeneratingStatement: (isGenerating: boolean) => void;
  setStatementProgress: (progress: number) => void;
  
  // Computed selectors
  getSelectedAccount: () => VirtualAccount | null;
  getAccountById: (accountId: string) => VirtualAccount | null;
  getAccountsByProperty: (propertyId: string) => VirtualAccount[];
  getTransactionsByAccount: (accountId: string) => AccountTransaction[];
  getFilteredTransactions: (accountId: string) => AccountTransaction[];
  getTotalBalance: () => number;
  getBalanceByProperty: (propertyId: string) => number;
  
  // Utility actions
  clearAll: () => void;
  reset: () => void;
}

type VirtualAccountStore = VirtualAccountState & VirtualAccountActions;

const initialState: VirtualAccountState = {
  accounts: [],
  selectedAccountId: null,
  transactions: {},
  transactionFilters: {
    type: 'ALL',
    status: 'ALL',
    dateRange: {},
    amountRange: {},
  },
  isLoading: false,
  isCreatingAccount: false,
  isRefreshingBalance: false,
  error: null,
  lastRefresh: null,
  balanceHistory: {},
  isGeneratingStatement: false,
  statementProgress: 0,
  reconciledTransactions: new Set(),
  pendingReconciliation: [],
};

export const useVirtualAccountStore = create<VirtualAccountStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Account management
        setAccounts: (accounts) =>
          set((state) => {
            state.accounts = accounts;
            state.lastRefresh = new Date().toISOString();
          }),

        addAccount: (account) =>
          set((state) => {
            const exists = state.accounts.find(acc => acc.id === account.id);
            if (!exists) {
              state.accounts.push(account);
            }
          }),

        updateAccount: (accountId, updates) =>
          set((state) => {
            const accountIndex = state.accounts.findIndex(acc => acc.id === accountId);
            if (accountIndex !== -1) {
              state.accounts[accountIndex] = {
                ...state.accounts[accountIndex],
                ...updates,
                lastUpdated: new Date().toISOString(),
              };
            }
          }),

        removeAccount: (accountId) =>
          set((state) => {
            state.accounts = state.accounts.filter(acc => acc.id !== accountId);
            if (state.selectedAccountId === accountId) {
              state.selectedAccountId = null;
            }
            // Clean up related data
            delete state.transactions[accountId];
            delete state.balanceHistory[accountId];
          }),

        selectAccount: (accountId) =>
          set((state) => {
            state.selectedAccountId = accountId;
          }),

        // Balance management
        updateBalance: (accountId, balance) =>
          set((state) => {
            const account = state.accounts.find(acc => acc.id === accountId);
            if (account) {
              account.balance = balance;
              account.lastUpdated = new Date().toISOString();
            }
            
            // Add to balance history
            if (!state.balanceHistory[accountId]) {
              state.balanceHistory[accountId] = [];
            }
            state.balanceHistory[accountId].push({
              date: new Date().toISOString(),
              balance,
            });
            
            // Keep only last 100 entries
            if (state.balanceHistory[accountId].length > 100) {
              state.balanceHistory[accountId] = state.balanceHistory[accountId].slice(-100);
            }
          }),

        refreshBalance: (accountId) =>
          set((state) => {
            state.isRefreshingBalance = true;
            state.error = null;
          }),

        setBalanceHistory: (accountId, history) =>
          set((state) => {
            state.balanceHistory[accountId] = history;
          }),

        // Transaction management
        setTransactions: (accountId, transactions) =>
          set((state) => {
            state.transactions[accountId] = transactions;
          }),

        addTransaction: (accountId, transaction) =>
          set((state) => {
            if (!state.transactions[accountId]) {
              state.transactions[accountId] = [];
            }
            
            // Avoid duplicates
            const exists = state.transactions[accountId].find(t => t.id === transaction.id);
            if (!exists) {
              state.transactions[accountId].unshift(transaction);
              
              // Update account balance if this is the latest transaction
              const account = state.accounts.find(acc => acc.id === accountId);
              if (account && transaction.status === 'SUCCESS') {
                account.balance = transaction.balanceAfter;
                account.lastUpdated = new Date().toISOString();
              }
            }
          }),

        updateTransaction: (accountId, transactionId, updates) =>
          set((state) => {
            if (state.transactions[accountId]) {
              const transactionIndex = state.transactions[accountId].findIndex(
                t => t.id === transactionId
              );
              if (transactionIndex !== -1) {
                state.transactions[accountId][transactionIndex] = {
                  ...state.transactions[accountId][transactionIndex],
                  ...updates,
                };
              }
            }
          }),

        markTransactionReconciled: (transactionId) =>
          set((state) => {
            state.reconciledTransactions.add(transactionId);
            
            // Remove from pending reconciliation
            state.pendingReconciliation = state.pendingReconciliation.filter(
              t => t.id !== transactionId
            );
          }),

        addPendingReconciliation: (transaction) =>
          set((state) => {
            const exists = state.pendingReconciliation.find(t => t.id === transaction.id);
            if (!exists) {
              state.pendingReconciliation.push(transaction);
            }
          }),

        // Filtering
        setTransactionFilters: (filters) =>
          set((state) => {
            state.transactionFilters = {
              ...state.transactionFilters,
              ...filters,
            };
          }),

        resetFilters: () =>
          set((state) => {
            state.transactionFilters = {
              type: 'ALL',
              status: 'ALL',
              dateRange: {},
              amountRange: {},
            };
          }),

        // UI state management
        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }),

        setCreatingAccount: (isCreating) =>
          set((state) => {
            state.isCreatingAccount = isCreating;
          }),

        setRefreshingBalance: (isRefreshing) =>
          set((state) => {
            state.isRefreshingBalance = isRefreshing;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        setLastRefresh: (timestamp) =>
          set((state) => {
            state.lastRefresh = timestamp;
          }),

        // Statement generation
        setGeneratingStatement: (isGenerating) =>
          set((state) => {
            state.isGeneratingStatement = isGenerating;
            if (!isGenerating) {
              state.statementProgress = 0;
            }
          }),

        setStatementProgress: (progress) =>
          set((state) => {
            state.statementProgress = Math.min(Math.max(progress, 0), 100);
          }),

        // Computed selectors
        getSelectedAccount: () => {
          const state = get();
          return state.accounts.find(acc => acc.id === state.selectedAccountId) || null;
        },

        getAccountById: (accountId) => {
          const state = get();
          return state.accounts.find(acc => acc.id === accountId) || null;
        },

        getAccountsByProperty: (propertyId) => {
          const state = get();
          return state.accounts.filter(acc => acc.propertyId === propertyId);
        },

        getTransactionsByAccount: (accountId) => {
          const state = get();
          return state.transactions[accountId] || [];
        },

        getFilteredTransactions: (accountId) => {
          const state = get();
          const transactions = state.transactions[accountId] || [];
          const filters = state.transactionFilters;

          return transactions.filter((transaction) => {
            // Type filter
            if (filters.type !== 'ALL' && transaction.type !== filters.type) {
              return false;
            }

            // Status filter
            if (filters.status !== 'ALL' && transaction.status !== filters.status) {
              return false;
            }

            // Date range filter
            if (filters.dateRange.start || filters.dateRange.end) {
              const transactionDate = new Date(transaction.createdAt);
              if (filters.dateRange.start && transactionDate < new Date(filters.dateRange.start)) {
                return false;
              }
              if (filters.dateRange.end && transactionDate > new Date(filters.dateRange.end)) {
                return false;
              }
            }

            // Source filter
            if (filters.source && transaction.source !== filters.source) {
              return false;
            }

            // Amount range filter
            if (filters.amountRange.min !== undefined && transaction.amount < filters.amountRange.min) {
              return false;
            }
            if (filters.amountRange.max !== undefined && transaction.amount > filters.amountRange.max) {
              return false;
            }

            return true;
          });
        },

        getTotalBalance: () => {
          const state = get();
          return state.accounts
            .filter(acc => acc.isActive)
            .reduce((total, acc) => total + acc.balance, 0);
        },

        getBalanceByProperty: (propertyId) => {
          const state = get();
          return state.accounts
            .filter(acc => acc.propertyId === propertyId && acc.isActive)
            .reduce((total, acc) => total + acc.balance, 0);
        },

        // Utility
        clearAll: () => set(initialState),

        reset: () => set(initialState),
      })),
      {
        name: 'virtual-account-storage',
        partialize: (state) => ({
          accounts: state.accounts,
          selectedAccountId: state.selectedAccountId,
          transactions: state.transactions,
          reconciledTransactions: Array.from(state.reconciledTransactions),
          balanceHistory: state.balanceHistory,
          lastRefresh: state.lastRefresh,
        }),
        merge: (persistedState, currentState) => {
          const state = persistedState as Partial<VirtualAccountState>;
          const reconciledTransactions = new Set(
            (state.reconciledTransactions as unknown as string[]) || []
          );
          return {
            ...currentState,
            ...state,
            reconciledTransactions,
          };
        },
      }
    )
  )
);
