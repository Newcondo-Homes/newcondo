// apps/admin/src/store/paymentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PaymentUser {
  id: string;
  name: string;
  email: string;
}

interface PaymentProperty {
  id: string;
  title: string;
  address: string;
}

interface Payment {
  id: string;
  userId: string;
  rentalId?: string;
  markingJobId?: string;
  amount: number;
  currency: string;
  paymentType: 'RENT' | 'DEPOSIT' | 'AGENT_COMMISSION' | 'PREMIUM_UPGRADE' | 'PROPERTY_MARKING';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  agentCommission?: number;
  platformFee?: number;
  ownerAmount?: number;
  confirmationPeriodEnd?: string;
  isReleased: boolean;
  releasedAt?: string;
  description?: string;
  failureReason?: string;
  paidAt?: string;
  user: PaymentUser;
  property?: PaymentProperty;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  heldPayments: number;
  releasedPayments: number;
  platformFees: number;
  agentCommissions: number;
}

interface PaymentFilters {
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';
  paymentType?: 'RENT' | 'DEPOSIT' | 'AGENT_COMMISSION' | 'PREMIUM_UPGRADE' | 'PROPERTY_MARKING';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

interface PaymentState {
  // Data
  payments: Payment[];
  selectedPayment: Payment | null;
  stats: PaymentStats;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: PaymentFilters;
  
  // Actions
  fetchPayments: (filters?: PaymentFilters) => Promise<void>;
  fetchPaymentById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  processRefund: (paymentId: string, reason: string, amount?: number) => Promise<void>;
  releasePayment: (paymentId: string) => Promise<void>;
  retryPayment: (paymentId: string) => Promise<void>;
  flagPayment: (paymentId: string, reason: string) => Promise<void>;
  setFilters: (filters: PaymentFilters) => void;
  clearFilters: () => void;
  setSelectedPayment: (payment: Payment | null) => void;
  reset: () => void;
}

const initialFilters: PaymentFilters = {
  status: undefined,
  paymentType: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  minAmount: undefined,
  maxAmount: undefined,
  searchQuery: undefined,
};

export const usePaymentStore = create<PaymentState>()(
  devtools(
    (set, get) => ({
      // Initial State
      payments: [],
      selectedPayment: null,
      stats: {
        totalRevenue: 0,
        pendingPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedPayments: 0,
        heldPayments: 0,
        releasedPayments: 0,
        platformFees: 0,
        agentCommissions: 0,
      },
      isLoading: false,
      error: null,
      filters: initialFilters,

      // Fetch all payments
      fetchPayments: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.status) queryParams.append('status', currentFilters.status);
          if (currentFilters.paymentType) queryParams.append('paymentType', currentFilters.paymentType);
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          if (currentFilters.minAmount) queryParams.append('minAmount', String(currentFilters.minAmount));
          if (currentFilters.maxAmount) queryParams.append('maxAmount', String(currentFilters.maxAmount));
          if (currentFilters.searchQuery) queryParams.append('search', currentFilters.searchQuery);

          const response = await fetch(`/api/admin/payments?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch payments');
          }

          const data = await response.json();
          
          set({ 
            payments: data.payments,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch single payment
      fetchPaymentById: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/payments/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch payment');
          }

          const data = await response.json();
          
          set({ 
            selectedPayment: data.payment,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch stats
      fetchStats: async () => {
        try {
          const response = await fetch('/api/admin/payments/stats');
          
          if (!response.ok) {
            throw new Error('Failed to fetch stats');
          }

          const data = await response.json();
          
          set({ stats: data.stats });
        } catch (error) {
          console.error('Failed to fetch payment stats:', error);
        }
      },

      // Process refund
      processRefund: async (paymentId, reason, amount) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, amount }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to process refund');
          }

          // Refresh data
          await get().fetchPayments();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Release payment
      releasePayment: async (paymentId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/payments/${paymentId}/release`, {
            method: 'POST',
          });
          
          if (!response.ok) {
            throw new Error('Failed to release payment');
          }

          // Refresh data
          await get().fetchPayments();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Retry payment
      retryPayment: async (paymentId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/payments/${paymentId}/retry`, {
            method: 'POST',
          });
          
          if (!response.ok) {
            throw new Error('Failed to retry payment');
          }

          // Refresh current payment if selected
          if (get().selectedPayment?.id === paymentId) {
            await get().fetchPaymentById(paymentId);
          }
          
          await get().fetchPayments();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Flag payment
      flagPayment: async (paymentId, reason) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/payments/${paymentId}/flag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to flag payment');
          }

          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Set filters
      setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } });
      },

      // Clear filters
      clearFilters: () => {
        set({ filters: initialFilters });
      },

      // Set selected payment
      setSelectedPayment: (payment) => {
        set({ selectedPayment: payment });
      },

      // Reset store
      reset: () => {
        set({
          payments: [],
          selectedPayment: null,
          stats: {
            totalRevenue: 0,
            pendingPayments: 0,
            successfulPayments: 0,
            failedPayments: 0,
            refundedPayments: 0,
            heldPayments: 0,
            releasedPayments: 0,
            platformFees: 0,
            agentCommissions: 0,
          },
          isLoading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    { name: 'PaymentStore' }
  )
);