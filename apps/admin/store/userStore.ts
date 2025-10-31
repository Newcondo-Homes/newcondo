// apps/admin/src/store/userStore.ts

import { create } from 'zustand';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  verificationStatus: string;
}

interface UserStoreState {
  selectedUser: User | null;
  filters: Record<string, any>;
  setSelectedUser: (user: User | null) => void;
  updateFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  selectedUser: null,
  filters: {},
  
  setSelectedUser: (user) => set({ selectedUser: user }),
  
  updateFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  clearFilters: () => set({ filters: {} })
}));

// ============================================
// apps/admin/src/store/verificationStore.ts

import { create } from 'zustand';

interface Document {
  id: string;
  userId: string;
  documentType: string;
  status: string;
}

interface VerificationStoreState {
  selectedDocument: Document | null;
  selectedDocuments: string[];
  reviewNotes: Record<string, string>;
  
  setSelectedDocument: (doc: Document | null) => void;
  toggleDocumentSelection: (docId: string) => void;
  clearSelection: () => void;
  setReviewNote: (docId: string, note: string) => void;
}

export const useVerificationStore = create<VerificationStoreState>((set) => ({
  selectedDocument: null,
  selectedDocuments: [],
  reviewNotes: {},
  
  setSelectedDocument: (doc) => set({ selectedDocument: doc }),
  
  toggleDocumentSelection: (docId) => set((state) => ({
    selectedDocuments: state.selectedDocuments.includes(docId)
      ? state.selectedDocuments.filter(id => id !== docId)
      : [...state.selectedDocuments, docId]
  })),
  
  clearSelection: () => set({ selectedDocuments: [], reviewNotes: {} }),
  
  setReviewNote: (docId, note) => set((state) => ({
    reviewNotes: { ...state.reviewNotes, [docId]: note }
  }))
}));

// ============================================
// apps/admin/src/store/propertyStore.ts

import { create } from 'zustand';

interface Property {
  id: string;
  title: string;
  status: string;
  adminApprovalStatus: string;
}

interface PropertyStoreState {
  selectedProperty: Property | null;
  filters: Record<string, any>;
  viewMode: 'grid' | 'list';
  
  setSelectedProperty: (property: Property | null) => void;
  updateFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const usePropertyStore = create<PropertyStoreState>((set) => ({
  selectedProperty: null,
  filters: {},
  viewMode: 'grid',
  
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  
  updateFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  clearFilters: () => set({ filters: {} }),
  
  setViewMode: (mode) => set({ viewMode: mode })
}));

// ============================================
// apps/admin/src/store/disputeStore.ts

import { create } from 'zustand';

interface Dispute {
  id: string;
  originalPropertyId: string;
  duplicatePropertyId: string;
  status: string;
}

interface DisputeStoreState {
  selectedDispute: Dispute | null;
  comparisonMode: boolean;
  
  setSelectedDispute: (dispute: Dispute | null) => void;
  toggleComparisonMode: () => void;
}

export const useDisputeStore = create<DisputeStoreState>((set) => ({
  selectedDispute: null,
  comparisonMode: false,
  
  setSelectedDispute: (dispute) => set({ selectedDispute: dispute }),
  
  toggleComparisonMode: () => set((state) => ({
    comparisonMode: !state.comparisonMode
  }))
}));

// ============================================
// apps/admin/src/store/markingJobStore.ts

import { create } from 'zustand';

interface MarkingJob {
  id: string;
  propertyId: string;
  status: string;
  assignedAgentId?: string;
}

interface MarkingJobStoreState {
  selectedJob: MarkingJob | null;
  filters: Record<string, any>;
  queueView: 'list' | 'calendar';
  
  setSelectedJob: (job: MarkingJob | null) => void;
  updateFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  setQueueView: (view: 'list' | 'calendar') => void;
}

export const useMarkingJobStore = create<MarkingJobStoreState>((set) => ({
  selectedJob: null,
  filters: {},
  queueView: 'list',
  
  setSelectedJob: (job) => set({ selectedJob: job }),
  
  updateFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  clearFilters: () => set({ filters: {} }),
  
  setQueueView: (view) => set({ queueView: view })
}));

// ============================================
// apps/admin/src/store/paymentStore.ts

import { create } from 'zustand';

interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: string;
  paymentType: string;
}

interface PaymentStoreState {
  selectedPayment: Payment | null;
  filters: Record<string, any>;
  
  setSelectedPayment: (payment: Payment | null) => void;
  updateFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
}

export const usePaymentStore = create<PaymentStoreState>((set) => ({
  selectedPayment: null,
  filters: {},
  
  setSelectedPayment: (payment) => set({ selectedPayment: payment }),
  
  updateFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  clearFilters: () => set({ filters: {} })
}));

// ============================================
// apps/admin/src/store/supportStore.ts

import { create } from 'zustand';

interface Ticket {
  id: string;
  userId: string;
  title: string;
  status: string;
  priority: string;
}

interface SupportStoreState {
  selectedTicket: Ticket | null;
  filters: Record<string, any>;
  draftResponses: Record<string, string>;
  
  setSelectedTicket: (ticket: Ticket | null) => void;
  updateFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  setDraftResponse: (ticketId: string, response: string) => void;
  clearDraftResponse: (ticketId: string) => void;
}

export const useSupportStore = create<SupportStoreState>((set) => ({
  selectedTicket: null,
  filters: {},
  draftResponses: {},
  
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
  
  updateFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  clearFilters: () => set({ filters: {} }),
  
  setDraftResponse: (ticketId, response) => set((state) => ({
    draftResponses: { ...state.draftResponses, [ticketId]: response }
  })),
  
  clearDraftResponse: (ticketId) => set((state) => {
    const { [ticketId]: _, ...rest } = state.draftResponses;
    return { draftResponses: rest };
  })
}));

// ============================================
// apps/admin/src/store/analyticsStore.ts

import { create } from 'zustand';

interface AnalyticsStoreState {
  dateRange: { startDate: string; endDate: string };
  cachedMetrics: Record<string, any>;
  
  setDateRange: (range: { startDate: string; endDate: string }) => void;
  cacheMetrics: (key: string, data: any) => void;
  clearCache: () => void;
}

export const useAnalyticsStore = create<AnalyticsStoreState>((set) => ({
  dateRange: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  cachedMetrics: {},
  
  setDateRange: (range) => set({ dateRange: range }),
  
  cacheMetrics: (key, data) => set((state) => ({
    cachedMetrics: { ...state.cachedMetrics, [key]: data }
  })),
  
  setMetrics: (data: any) => set({ cachedMetrics: data }),
  
  clearCache: () => set({ cachedMetrics: {} })
}));

// ============================================
// apps/admin/src/store/index.ts

export { useAdminStore } from './adminStore';
export { useUIStore, useToast } from './uiStore';
export { useUserStore } from './userStore';
export { useVerificationStore } from './verificationStore';
export { usePropertyStore } from './propertyStore';
export { useDisputeStore } from './disputeStore';
export { useMarkingJobStore } from './markingJobStore';
export { usePaymentStore } from './paymentStore';
export { useSupportStore } from './supportStore';
export { useAnalyticsStore } from './analyticsStore';