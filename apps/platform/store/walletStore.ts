// apps/platform/store/walletStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface WalletState {
  // Wallet data
  virtualAccounts: VirtualAccount[];
  activeAccount: VirtualAccount | null;
  transactions: WalletTransaction[];
  
  // Balance tracking
  totalBalance: number;
  availableBalance: number;
  heldBalance: number;
  
  // Withdrawal settings
  withdrawalSettings: WithdrawalSettings | null;
  pendingWithdrawals: Withdrawal[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions - Virtual Accounts
  setVirtualAccounts: (accounts: VirtualAccount[]) => void;
  addVirtualAccount: (account: VirtualAccount) => void;
  updateVirtualAccount: (id: string, updates: Partial<VirtualAccount>) => void;
  setActiveAccount: (account: VirtualAccount | null) => void;
  getAccountById: (id: string) => VirtualAccount | undefined;
  
  // Actions - Transactions
  setTransactions: (transactions: WalletTransaction[]) => void;
  addTransaction: (transaction: WalletTransaction) => void;
  getTransactionsByAccount: (accountId: string) => WalletTransaction[];
  
  // Actions - Balance
  updateBalances: (total: number, available: number, held: number) => void;
  refreshBalance: (accountId: string) => void;
  
  // Actions - Withdrawals
  setWithdrawalSettings: (settings: WithdrawalSettings) => void;
  requestWithdrawal: (withdrawal: Withdrawal) => void;
  updateWithdrawal: (id: string, updates: Partial<Withdrawal>) => void;
  getPendingWithdrawals: () => Withdrawal[];
  getWithdrawalHistory: () => Withdrawal[];
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
}

export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  userId: string;
  propertyId?: string;
  
  // Balance
  balance: number;
  availableBalance: number;
  heldBalance: number;
  currency: string;
  
  // Status
  isActive: boolean;
  
  // Flutterwave
  flutterwaveAccountId?: string;
  
  // Metadata
  accountType: 'USER' | 'PROPERTY';
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  virtualAccountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  
  // Transaction details
  status: TransactionStatus;
  description: string;
  reference: string;
  
  // Related entities
  paymentId?: string;
  rentalId?: string;
  propertyId?: string;
  
  // Balance tracking
  balanceBefore: number;
  balanceAfter: number;
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: string;
}

export type TransactionType = 
  | 'CREDIT'
  | 'DEBIT'
  | 'HOLD'
  | 'RELEASE'
  | 'COMMISSION'
  | 'REFUND'
  | 'WITHDRAWAL'
  | 'TRANSFER';

export type TransactionStatus = 
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED';

export interface WithdrawalSettings {
  userId: string;
  
  // Automatic withdrawal settings
  autoWithdrawalEnabled: boolean;
  autoWithdrawalMode: 'IMMEDIATE' | 'SCHEDULED';
  
  // Scheduled withdrawal
  withdrawalInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  withdrawalDay?: number; // Day of week (1-7) or month (1-31)
  withdrawalTime?: string; // HH:mm format
  
  // Minimum balance
  minimumBalance: number;
  
  // Default bank account
  defaultBankAccount?: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
  };
  
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  virtualAccountId: string;
  userId: string;
  
  // Withdrawal details
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  
  // Bank details
  destinationAccountNumber: string;
  destinationAccountName: string;
  destinationBankCode: string;
  destinationBankName: string;
  
  // Processing
  reference?: string;
  flutterwaveReference?: string;
  processingFee?: number;
  netAmount?: number;
  
  // Status tracking
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  
  // Metadata
  isAutomatic: boolean;
  metadata?: Record<string, any>;
}

export type WithdrawalStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

const initialState = {
  virtualAccounts: [],
  activeAccount: null,
  transactions: [],
  totalBalance: 0,
  availableBalance: 0,
  heldBalance: 0,
  withdrawalSettings: null,
  pendingWithdrawals: [],
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Virtual Accounts
        setVirtualAccounts: (accounts) =>
          set({ virtualAccounts: accounts }, false, 'setVirtualAccounts'),

        addVirtualAccount: (account) =>
          set(
            (state) => ({
              virtualAccounts: [...state.virtualAccounts, account],
            }),
            false,
            'addVirtualAccount'
          ),

        updateVirtualAccount: (id, updates) =>
          set(
            (state) => ({
              virtualAccounts: state.virtualAccounts.map((acc) =>
                acc.id === id ? { ...acc, ...updates, updatedAt: new Date().toISOString() } : acc
              ),
              activeAccount:
                state.activeAccount?.id === id
                  ? { ...state.activeAccount, ...updates }
                  : state.activeAccount,
            }),
            false,
            'updateVirtualAccount'
          ),

        setActiveAccount: (account) =>
          set({ activeAccount: account }, false, 'setActiveAccount'),

        getAccountById: (id) => {
          return get().virtualAccounts.find((acc) => acc.id === id);
        },

        // Transactions
        setTransactions: (transactions) =>
          set({ transactions }, false, 'setTransactions'),

        addTransaction: (transaction) =>
          set(
            (state) => ({
              transactions: [transaction, ...state.transactions],
            }),
            false,
            'addTransaction'
          ),

        getTransactionsByAccount: (accountId) => {
          return get().transactions.filter((tx) => tx.virtualAccountId === accountId);
        },

        // Balance
        updateBalances: (total, available, held) =>
          set(
            {
              totalBalance: total,
              availableBalance: available,
              heldBalance: held,
            },
            false,
            'updateBalances'
          ),

        refreshBalance: (accountId) => {
          const account = get().getAccountById(accountId);
          if (account) {
            set(
              {
                totalBalance: account.balance,
                availableBalance: account.availableBalance,
                heldBalance: account.heldBalance,
              },
              false,
              'refreshBalance'
            );
          }
        },

        // Withdrawal Settings
        setWithdrawalSettings: (settings) =>
          set({ withdrawalSettings: settings }, false, 'setWithdrawalSettings'),

        requestWithdrawal: (withdrawal) =>
          set(
            (state) => ({
              pendingWithdrawals: [...state.pendingWithdrawals, withdrawal],
            }),
            false,
            'requestWithdrawal'
          ),

        updateWithdrawal: (id, updates) =>
          set(
            (state) => ({
              pendingWithdrawals: state.pendingWithdrawals.map((w) =>
                w.id === id ? { ...w, ...updates } : w
              ),
            }),
            false,
            'updateWithdrawal'
          ),

        getPendingWithdrawals: () => {
          return get().pendingWithdrawals.filter(
            (w) => w.status === 'PENDING' || w.status === 'PROCESSING'
          );
        },

        getWithdrawalHistory: () => {
          return get().pendingWithdrawals.filter(
            (w) => w.status === 'COMPLETED' || w.status === 'FAILED' || w.status === 'CANCELLED'
          );
        },

        // Loading and error
        setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

        setError: (error) => set({ error }, false, 'setError'),

        clearError: () => set({ error: null }, false, 'clearError'),

        // Reset
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'wallet-storage',
        partialize: (state) => ({
          virtualAccounts: state.virtualAccounts,
          withdrawalSettings: state.withdrawalSettings,
        }),
      }
    ),
    { name: 'WalletStore' }
  )
);