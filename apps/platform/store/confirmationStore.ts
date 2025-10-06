// apps/platform/store/confirmationStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ConfirmationState {
  // Confirmation data
  confirmations: PaymentConfirmation[];
  activeConfirmation: PaymentConfirmation | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Filters
  statusFilter: ConfirmationStatus | 'ALL';
  
  // Actions
  setConfirmations: (confirmations: PaymentConfirmation[]) => void;
  addConfirmation: (confirmation: PaymentConfirmation) => void;
  updateConfirmation: (id: string, updates: Partial<PaymentConfirmation>) => void;
  setActiveConfirmation: (confirmation: PaymentConfirmation | null) => void;
  removeConfirmation: (id: string) => void;
  
  // Confirmation actions
  confirmPayment: (id: string) => void;
  requestRefund: (id: string, reason: string) => void;
  
  // Filter actions
  setStatusFilter: (status: ConfirmationStatus | 'ALL') => void;
  getFilteredConfirmations: () => PaymentConfirmation[];
  
  // Utility actions
  getConfirmationById: (id: string) => PaymentConfirmation | undefined;
  getPendingConfirmations: () => PaymentConfirmation[];
  getExpiredConfirmations: () => PaymentConfirmation[];
  getTimeRemaining: (id: string) => number | null;
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
}

export interface PaymentConfirmation {
  id: string;
  paymentId: string;
  rentalId: string;
  propertyId: string;
  unitId?: string;
  renterId: string;
  
  // Property details
  propertyTitle: string;
  propertyAddress: string;
  unitNumber?: string;
  
  // Payment details
  amount: number;
  currency: string;
  paidAt: string;
  
  // Confirmation details
  confirmationDeadline: string;
  status: ConfirmationStatus;
  isConfirmed: boolean;
  confirmedAt?: string;
  
  // Refund details
  refundRequested: boolean;
  refundReason?: string;
  refundRequestedAt?: string;
  refundStatus?: RefundStatus;
  
  // Commission breakdown
  commissionBreakdown?: {
    totalCommission: number;
    platformFee: number;
    listingAgentCommission?: number;
    subAgentCommission?: number;
    propertyOwnerAmount: number;
  };
  
  // Metadata
  hasDispute: boolean;
  disputeReason?: string;
  verificationChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ConfirmationStatus = 
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'RELEASED'
  | 'EXPIRED';

export type RefundStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

const initialState = {
  confirmations: [],
  activeConfirmation: null,
  isLoading: false,
  error: null,
  statusFilter: 'ALL' as ConfirmationStatus | 'ALL',
};

export const useConfirmationStore = create<ConfirmationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Basic setters
        setConfirmations: (confirmations) => 
          set({ confirmations }, false, 'setConfirmations'),

        addConfirmation: (confirmation) =>
          set(
            (state) => ({
              confirmations: [confirmation, ...state.confirmations],
            }),
            false,
            'addConfirmation'
          ),

        updateConfirmation: (id, updates) =>
          set(
            (state) => ({
              confirmations: state.confirmations.map((c) =>
                c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
              ),
              activeConfirmation:
                state.activeConfirmation?.id === id
                  ? { ...state.activeConfirmation, ...updates }
                  : state.activeConfirmation,
            }),
            false,
            'updateConfirmation'
          ),

        setActiveConfirmation: (confirmation) =>
          set({ activeConfirmation: confirmation }, false, 'setActiveConfirmation'),

        removeConfirmation: (id) =>
          set(
            (state) => ({
              confirmations: state.confirmations.filter((c) => c.id !== id),
              activeConfirmation:
                state.activeConfirmation?.id === id ? null : state.activeConfirmation,
            }),
            false,
            'removeConfirmation'
          ),

        // Confirmation actions
        confirmPayment: (id) =>
          set(
            (state) => ({
              confirmations: state.confirmations.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      status: 'CONFIRMED' as ConfirmationStatus,
                      isConfirmed: true,
                      confirmedAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              ),
            }),
            false,
            'confirmPayment'
          ),

        requestRefund: (id, reason) =>
          set(
            (state) => ({
              confirmations: state.confirmations.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      status: 'REFUND_REQUESTED' as ConfirmationStatus,
                      refundRequested: true,
                      refundReason: reason,
                      refundRequestedAt: new Date().toISOString(),
                      refundStatus: 'PENDING' as RefundStatus,
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              ),
            }),
            false,
            'requestRefund'
          ),

        // Filter actions
        setStatusFilter: (status) =>
          set({ statusFilter: status }, false, 'setStatusFilter'),

        getFilteredConfirmations: () => {
          const { confirmations, statusFilter } = get();
          if (statusFilter === 'ALL') return confirmations;
          return confirmations.filter((c) => c.status === statusFilter);
        },

        // Utility getters
        getConfirmationById: (id) => {
          return get().confirmations.find((c) => c.id === id);
        },

        getPendingConfirmations: () => {
          return get().confirmations.filter(
            (c) => c.status === 'PENDING_CONFIRMATION'
          );
        },

        getExpiredConfirmations: () => {
          const now = new Date().getTime();
          return get().confirmations.filter((c) => {
            const deadline = new Date(c.confirmationDeadline).getTime();
            return deadline < now && c.status === 'PENDING_CONFIRMATION';
          });
        },

        getTimeRemaining: (id) => {
          const confirmation = get().getConfirmationById(id);
          if (!confirmation) return null;

          const now = new Date().getTime();
          const deadline = new Date(confirmation.confirmationDeadline).getTime();
          const remaining = deadline - now;

          return remaining > 0 ? remaining : 0;
        },

        // Loading and error
        setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

        setError: (error) => set({ error }, false, 'setError'),

        clearError: () => set({ error: null }, false, 'clearError'),

        // Reset
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'confirmation-storage',
        partialize: (state) => ({
          confirmations: state.confirmations,
          statusFilter: state.statusFilter,
        }),
      }
    ),
    { name: 'ConfirmationStore' }
  )
);