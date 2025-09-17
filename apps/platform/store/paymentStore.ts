import { create } from 'zustand';
import { devtools, subscriptWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Payment,
  PaymentForm,
  FlutterwaveResponse,
  VirtualAccount,
  PaymentHistory,
  PaymentStatus,
  PaymentType,
} from '../types/payment';

interface PaymentState {
  // Current payment being processed
  currentPayment: PaymentForm | null;
  
  // Payment status
  isProcessing: boolean;
  isLoading: boolean;
  
  // Payment history
  payments: Payment[];
  paymentHistory: PaymentHistory | null;
  
  // Virtual accounts
  virtualAccounts: VirtualAccount[];
  
  // Flutterwave specific
  flutterwaveRef: string | null;
  paymentLink: string | null;
  
  // Error handling
  error: string | null;
  
  // Success states
  lastSuccessfulPayment: Payment | null;
  
  // Actions
  setCurrentPayment: (payment: PaymentForm) => void;
  clearCurrentPayment: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Payment operations
  initializePayment: (paymentData: PaymentForm) => void;
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => void;
  addPayment: (payment: Payment) => void;
  setPayments: (payments: Payment[]) => void;
  setPaymentHistory: (history: PaymentHistory) => void;
  
  // Flutterwave operations
  setFlutterwaveRef: (ref: string) => void;
  setPaymentLink: (link: string) => void;
  clearFlutterwaveData: () => void;
  handleFlutterwaveResponse: (response: FlutterwaveResponse) => void;
  
  // Virtual accounts
  setVirtualAccounts: (accounts: VirtualAccount[]) => void;
  addVirtualAccount: (account: VirtualAccount) => void;
  updateVirtualAccountBalance: (accountId: string, balance: number) => void;
  
  // Utility functions
  getPaymentById: (paymentId: string) => Payment | undefined;
  getPaymentsByType: (type: PaymentType) => Payment[];
  getPaymentsByStatus: (status: PaymentStatus) => Payment[];
  getTotalPayments: () => number;
  getTotalAmountPaid: () => number;
  
  // Reset functions
  resetPaymentState: () => void;
  resetError: () => void;
}

const initialState = {
  currentPayment: null,
  isProcessing: false,
  isLoading: false,
  payments: [],
  paymentHistory: null,
  virtualAccounts: [],
  flutterwaveRef: null,
  paymentLink: null,
  error: null,
  lastSuccessfulPayment: null,
};

export const usePaymentStore = create<PaymentState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // Basic setters
      setCurrentPayment: (payment) =>
        set((state) => {
          state.currentPayment = payment;
          state.error = null;
        }),

      clearCurrentPayment: () =>
        set((state) => {
          state.currentPayment = null;
        }),

      setProcessing: (isProcessing) =>
        set((state) => {
          state.isProcessing = isProcessing;
          if (isProcessing) {
            state.error = null;
          }
        }),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
          if (error) {
            state.isProcessing = false;
          }
        }),

      // Payment operations
      initializePayment: (paymentData) =>
        set((state) => {
          state.currentPayment = paymentData;
          state.isProcessing = false;
          state.error = null;
          state.flutterwaveRef = null;
          state.paymentLink = null;
        }),

      updatePaymentStatus: (paymentId, status) =>
        set((state) => {
          const paymentIndex = state.payments.findIndex(p => p.id === paymentId);
          if (paymentIndex !== -1) {
            state.payments[paymentIndex].status = status;
            if (status === 'SUCCESS') {
              state.lastSuccessfulPayment = state.payments[paymentIndex];
              state.isProcessing = false;
            } else if (status === 'FAILED' || status === 'CANCELLED') {
              state.isProcessing = false;
            }
          }
        }),

      addPayment: (payment) =>
        set((state) => {
          const existingIndex = state.payments.findIndex(p => p.id === payment.id);
          if (existingIndex !== -1) {
            state.payments[existingIndex] = payment;
          } else {
            state.payments.unshift(payment);
          }
        }),

      setPayments: (payments) =>
        set((state) => {
          state.payments = payments;
        }),

      setPaymentHistory: (history) =>
        set((state) => {
          state.paymentHistory = history;
        }),

      // Flutterwave operations
      setFlutterwaveRef: (ref) =>
        set((state) => {
          state.flutterwaveRef = ref;
        }),

      setPaymentLink: (link) =>
        set((state) => {
          state.paymentLink = link;
        }),

      clearFlutterwaveData: () =>
        set((state) => {
          state.flutterwaveRef = null;
          state.paymentLink = null;
        }),

      handleFlutterwaveResponse: (response) =>
        set((state) => {
          if (response.status === 'successful') {
            state.isProcessing = false;
            state.error = null;
            // The payment will be updated via updatePaymentStatus when backend confirms
          } else if (response.status === 'cancelled' || response.status === 'failed') {
            state.isProcessing = false;
            state.error = response.status === 'failed' 
              ? 'Payment failed. Please try again.' 
              : 'Payment was cancelled.';
          }
        }),

      // Virtual accounts
      setVirtualAccounts: (accounts) =>
        set((state) => {
          state.virtualAccounts = accounts;
        }),

      addVirtualAccount: (account) =>
        set((state) => {
          const existingIndex = state.virtualAccounts.findIndex(a => a.id === account.id);
          if (existingIndex !== -1) {
            state.virtualAccounts[existingIndex] = account;
          } else {
            state.virtualAccounts.push(account);
          }
        }),

      updateVirtualAccountBalance: (accountId, balance) =>
        set((state) => {
          const accountIndex = state.virtualAccounts.findIndex(a => a.id === accountId);
          if (accountIndex !== -1) {
            state.virtualAccounts[accountIndex].balance = balance;
          }
        }),

      // Utility functions
      getPaymentById: (paymentId) => {
        return get().payments.find(p => p.id === paymentId);
      },

      getPaymentsByType: (type) => {
        return get().payments.filter(p => p.paymentType === type);
      },

      getPaymentsByStatus: (status) => {
        return get().payments.filter(p => p.status === status);
      },

      getTotalPayments: () => {
        return get().payments.length;
      },

      getTotalAmountPaid: () => {
        return get().payments
          .filter(p => p.status === 'SUCCESS')
          .reduce((total, payment) => total + payment.amount, 0);
      },

      // Reset functions
      resetPaymentState: () =>
        set((state) => {
          Object.assign(state, initialState);
        }),

      resetError: () =>
        set((state) => {
          state.error = null;
        }),
    })),
    {
      name: 'payment-store',
      partialize: (state) => ({
        payments: state.payments,
        paymentHistory: state.paymentHistory,
        virtualAccounts: state.virtualAccounts,
      }),
    }
  )
);

// Selectors for better performance
export const useCurrentPayment = () => usePaymentStore(state => state.currentPayment);
export const usePaymentLoading = () => usePaymentStore(state => state.isLoading || state.isProcessing);
export const usePaymentError = () => usePaymentStore(state => state.error);
export const usePayments = () => usePaymentStore(state => state.payments);
export const useVirtualAccounts = () => usePaymentStore(state => state.virtualAccounts);
export const useFlutterwaveData = () => usePaymentStore(state => ({
  flutterwaveRef: state.flutterwaveRef,
  paymentLink: state.paymentLink,
}));

// Computed selectors
export const usePaymentStats = () => usePaymentStore(state => ({
  totalPayments: state.getTotalPayments(),
  totalAmountPaid: state.getTotalAmountPaid(),
  successfulPayments: state.getPaymentsByStatus('SUCCESS').length,
  failedPayments: state.getPaymentsByStatus('FAILED').length,
  pendingPayments: state.getPaymentsByStatus('PENDING').length,
}));