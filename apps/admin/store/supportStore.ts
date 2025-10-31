// apps/admin/src/store/supportStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TicketUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'TECHNICAL' | 'BILLING' | 'PROPERTY' | 'VERIFICATION' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminResponse?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  user: TicketUser;
  createdAt: string;
  updatedAt: string;
}

interface SupportStats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
  avgResolutionTime: number;
  byCategory: {
    technical: number;
    billing: number;
    property: number;
    verification: number;
    general: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

interface SupportFilters {
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category?: 'TECHNICAL' | 'BILLING' | 'PROPERTY' | 'VERIFICATION' | 'GENERAL';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

interface SupportState {
  // Data
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  stats: SupportStats;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: SupportFilters;
  
  // Actions
  fetchTickets: (filters?: SupportFilters) => Promise<void>;
  fetchTicketById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  updateTicketStatus: (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => Promise<void>;
  updateTicketPriority: (ticketId: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => Promise<void>;
  respondToTicket: (ticketId: string, response: string) => Promise<void>;
  assignTicket: (ticketId: string, adminId: string) => Promise<void>;
  closeTicket: (ticketId: string, resolution: string) => Promise<void>;
  setFilters: (filters: SupportFilters) => void;
  clearFilters: () => void;
  setSelectedTicket: (ticket: SupportTicket | null) => void;
  reset: () => void;
}

const initialFilters: SupportFilters = {
  status: undefined,
  category: undefined,
  priority: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  searchQuery: undefined,
};

export const useSupportStore = create<SupportState>()(
  devtools(
    (set, get) => ({
      // Initial State
      tickets: [],
      selectedTicket: null,
      stats: {
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        total: 0,
        avgResolutionTime: 0,
        byCategory: {
          technical: 0,
          billing: 0,
          property: 0,
          verification: 0,
          general: 0,
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
      },
      isLoading: false,
      error: null,
      filters: initialFilters,

      // Fetch all tickets
      fetchTickets: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.status) queryParams.append('status', currentFilters.status);
          if (currentFilters.category) queryParams.append('category', currentFilters.category);
          if (currentFilters.priority) queryParams.append('priority', currentFilters.priority);
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          if (currentFilters.searchQuery) queryParams.append('search', currentFilters.searchQuery);

          const response = await fetch(`/api/admin/support?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch tickets');
          }

          const data = await response.json();
          
          set({ 
            tickets: data.tickets,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch single ticket
      fetchTicketById: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/support/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch ticket');
          }

          const data = await response.json();
          
          set({ 
            selectedTicket: data.ticket,
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
          const response = await fetch('/api/admin/support/stats');
          
          if (!response.ok) {
            throw new Error('Failed to fetch stats');
          }

          const data = await response.json();
          
          set({ stats: data.stats });
        } catch (error) {
          console.error('Failed to fetch support stats:', error);
        }
      },

      // Update ticket status
      updateTicketStatus: async (ticketId, status) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/support/${ticketId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update ticket status');
          }

          // Refresh data
          await get().fetchTickets();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Update ticket priority
      updateTicketPriority: async (ticketId, priority) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/support/${ticketId}/priority`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update ticket priority');
          }

          // Refresh current ticket if selected
          if (get().selectedTicket?.id === ticketId) {
            await get().fetchTicketById(ticketId);
          }
          
          await get().fetchTickets();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Respond to ticket
      respondToTicket: async (ticketId, response) => {
        set({ isLoading: true, error: null });
        
        try {
          const apiResponse = await fetch(`/api/admin/support/${ticketId}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response }),
          });
          
          if (!apiResponse.ok) {
            throw new Error('Failed to respond to ticket');
          }

          // Refresh current ticket if selected
          if (get().selectedTicket?.id === ticketId) {
            await get().fetchTicketById(ticketId);
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Assign ticket
      assignTicket: async (ticketId, adminId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/support/${ticketId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to assign ticket');
          }

          // Refresh data
          await get().fetchTickets();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Close ticket
      closeTicket: async (ticketId, resolution) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/admin/support/${ticketId}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to close ticket');
          }

          // Refresh data
          await get().fetchTickets();
          await get().fetchStats();
          
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

      // Set selected ticket
      setSelectedTicket: (ticket) => {
        set({ selectedTicket: ticket });
      },

      // Reset store
      reset: () => {
        set({
          tickets: [],
          selectedTicket: null,
          stats: {
            open: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0,
            total: 0,
            avgResolutionTime: 0,
            byCategory: {
              technical: 0,
              billing: 0,
              property: 0,
              verification: 0,
              general: 0,
            },
            byPriority: {
              low: 0,
              medium: 0,
              high: 0,
              urgent: 0,
            },
          },
          isLoading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    { name: 'SupportStore' }
  )
);