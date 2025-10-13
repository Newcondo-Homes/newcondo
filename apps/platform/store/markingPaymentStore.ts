// apps/platform/store/markingPaymentStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type PaymentStatus = 
  | 'PENDING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED'
  | 'HELD'
  | 'RELEASED';

export interface MarkingPayment {
  id: string;
  userId: string;
  markingJobId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  agentCommission?: number;
  platformFee?: number;
  description?: string;
  failureReason?: string;
  paidAt?: string;
  confirmationPeriodEnd?: string;
  isReleased: boolean;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPricing {
  markingFee: number; // 20,000 or 25,000 NGN
  agentCommission: number; // 25% of marking fee
  platformFee: number; // 75% of marking fee
  initialPayment?: number; // 1,000 NGN for agent
  remainingPayment?: number; // Balance after initial payment
}

export interface MarkingPaymentStoreState {
  // Current payment being processed
  currentPayment: Partial<MarkingPayment> | null;
  
  // Payment pricing
  pricing: PaymentPricing | null;
  
  // All marking payments
  payments: MarkingPayment[];
  
  // Selected payment for viewing details
  selectedPayment: MarkingPayment | null;
  
  // Loading states
  isInitializingPayment: boolean;
  isProcessingPayment: boolean;
  isVerifyingPayment: boolean;
  isLoadingPayments: boolean;
  isReleasingPayment: boolean;
  
  // Flutterwave modal state
  showPaymentModal: boolean;
  paymentLink?: string;
  
  // Error states
  error: string | null;
  
  // Actions
  setCurrentPayment: (payment: Partial<MarkingPayment> | null) => void;
  updateCurrentPayment: (payment: Partial<MarkingPayment>) => void;
  
  setPricing: (pricing: PaymentPricing) => void;
  calculatePricing: (markingFee: number, method: 'NEWCONDO_ADMIN' | 'ASSIGN_AGENT') => void;
  
  setPayments: (payments: MarkingPayment[]) => void;
  addPayment: (payment: MarkingPayment) => void;
  updatePayment: (paymentId: string, updates: Partial<MarkingPayment>) => void;
  
  setSelectedPayment: (payment: MarkingPayment | null) => void;
  
  setIsInitializingPayment: (isInitializing: boolean) => void;
  setIsProcessingPayment: (isProcessing: boolean) => void;
  setIsVerifyingPayment: (isVerifying: boolean) => void;
  setIsLoadingPayments: (isLoading: boolean) => void;
  setIsReleasingPayment: (isReleasing: boolean) => void;
  
  setShowPaymentModal: (show: boolean) => void;
  setPaymentLink: (link: string | undefined) => void;
  
  setError: (error: string | null) => void;
  
  // Reset store
  reset: () => void;
}

const MARKING_FEE_PROPERTY_OWNER = 20000; // NGN
const MARKING_FEE_NEWCONDO = 25000; // NGN
const AGENT_COMMISSION_PERCENTAGE = 0.25; // 25%
const INITIAL_AGENT_PAYMENT = 1000; // NGN

const initialState = {
  currentPayment: null,
  pricing: null,
  payments: [],
  selectedPayment: null,
  isInitializingPayment: false,
  isProcessingPayment: false,
  isVerifyingPayment: false,
  isLoadingPayments: false,
  isReleasingPayment: false,
  showPaymentModal: false,
  paymentLink: undefined,
  error: null,
};

export const useMarkingPaymentStore = create<MarkingPaymentStoreState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setCurrentPayment: (payment) =>
          set({ currentPayment: payment }, false, 'setCurrentPayment'),

        updateCurrentPayment: (payment) =>
          set(
            (state) => ({
              currentPayment: {
                ...state.currentPayment,
                ...payment,
              },
            }),
            false,
            'updateCurrentPayment'
          ),

        setPricing: (pricing) =>
          set({ pricing }, false, 'setPricing'),

        calculatePricing: (markingFee, method) =>
          set(
            () => {
              const actualFee = method === 'NEWCONDO_ADMIN' 
                ? MARKING_FEE_NEWCONDO 
                : MARKING_FEE_PROPERTY_OWNER;
              
              const agentCommission = actualFee * AGENT_COMMISSION_PERCENTAGE;
              const platformFee = actualFee - agentCommission;

              const pricing: PaymentPricing = {
                markingFee: actualFee,
                agentCommission,
                platformFee,
              };

              if (method === 'ASSIGN_AGENT') {
                pricing.initialPayment = INITIAL_AGENT_PAYMENT;
                pricing.remainingPayment = agentCommission - INITIAL_AGENT_PAYMENT;
              }

              return { pricing };
            },
            false,
            'calculatePricing'
          ),

        setPayments: (payments) =>
          set({ payments }, false, 'setPayments'),

        addPayment: (payment) =>
          set(
            (state) => ({
              payments: [payment, ...state.payments],
            }),
            false,
            'addPayment'
          ),

        updatePayment: (paymentId, updates) =>
          set(
            (state) => ({
              payments: state.payments.map((payment) =>
                payment.id === paymentId ? { ...payment, ...updates } : payment
              ),
              selectedPayment:
                state.selectedPayment?.id === paymentId
                  ? { ...state.selectedPayment, ...updates }
                  : state.selectedPayment,
            }),
            false,
            'updatePayment'
          ),

        setSelectedPayment: (payment) =>
          set({ selectedPayment: payment }, false, 'setSelectedPayment'),

        setIsInitializingPayment: (isInitializing) =>
          set({ isInitializingPayment: isInitializing }, false, 'setIsInitializingPayment'),

        setIsProcessingPayment: (isProcessing) =>
          set({ isProcessingPayment: isProcessing }, false, 'setIsProcessingPayment'),

        setIsVerifyingPayment: (isVerifying) =>
          set({ isVerifyingPayment: isVerifying }, false, 'setIsVerifyingPayment'),

        setIsLoadingPayments: (isLoading) =>
          set({ isLoadingPayments: isLoading }, false, 'setIsLoadingPayments'),

        setIsReleasingPayment: (isReleasing) =>
          set({ isReleasingPayment: isReleasing }, false, 'setIsReleasingPayment'),

        setShowPaymentModal: (show) =>
          set({ showPaymentModal: show }, false, 'setShowPaymentModal'),

        setPaymentLink: (link) =>
          set({ paymentLink: link }, false, 'setPaymentLink'),

        setError: (error) =>
          set({ error }, false, 'setError'),

        reset: () =>
          set(initialState, false, 'reset'),
      }),
      {
        name: 'marking-payment-store',
        partialize: (state) => ({
          currentPayment: state.currentPayment,
          pricing: state.pricing,
        }),
      }
    ),
    { name: 'MarkingPaymentStore' }
  )
);