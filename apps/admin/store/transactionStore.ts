import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  paymentType: string;
  userId: string;
  createdAt: Date;
  [key: string]: any;
}

interface TransactionState {
  transactions: Transaction[];
  selectedTransactions: string[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filterStatus: string | null;
  filterPaymentType: string | null;
  
  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  setTotalCount: (count: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleTransactionSelection: (transactionId: string) => void;
  clearSelection: () => void;
  setFilterStatus: (status: string | null) => void;
  setFilterPaymentType: (type: string | null) => void;
  reset: () => void;
}

const initialState = {
  transactions: [],
  selectedTransactions: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  filterStatus: null,
  filterPaymentType: null,
};

export const useTransactionStore = create<TransactionState>()(
  devtools(
    (set) => ({
      ...initialState,

      setTransactions: (transactions) => set({ transactions }),

      setTotalCount: (count) => set({ totalCount: count }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      toggleTransactionSelection: (transactionId) =>
        set((state) => ({
          selectedTransactions: state.selectedTransactions.includes(transactionId)
            ? state.selectedTransactions.filter((id) => id !== transactionId)
            : [...state.selectedTransactions, transactionId],
        })),

      clearSelection: () => set({ selectedTransactions: [] }),

      setFilterStatus: (status) => set({ filterStatus: status }),

      setFilterPaymentType: (type) => set({ filterPaymentType: type }),

      reset: () => set(initialState),
    }),
    { name: 'Transaction Store' }
  )
);