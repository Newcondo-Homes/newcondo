// apps/admin/src/store/analyticsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UserAnalytics {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  verifiedUsers: number;
  premiumUsers: number;
  usersByRole: {
    owners: number;
    agents: number;
    renters: number;
  };
  userGrowthRate: number;
}

interface PropertyAnalytics {
  totalProperties: number;
  newPropertiesThisMonth: number;
  publishedProperties: number;
  rentedProperties: number;
  pendingApproval: number;
  propertiesByType: Record<string, number>;
  propertiesByState: Record<string, number>;
  avgPropertyPrice: number;
  boundaryVerifiedPercent: number;
}

interface PaymentAnalytics {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueThisWeek: number;
  revenueToday: number;
  platformFees: number;
  agentCommissions: number;
  avgTransactionValue: number;
  transactionCount: number;
  revenueByType: {
    rent: number;
    deposit: number;
    propertyMarking: number;
    premiumUpgrade: number;
  };
  revenueGrowthRate: number;
}

interface MarkingJobAnalytics {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  avgCompletionTime: number;
  avgAgentRating: number;
  jobsByStatus: Record<string, number>;
  jobsByUrgency: Record<string, number>;
  topPerformingAgents: {
    id: string;
    name: string;
    completedJobs: number;
    rating: number;
  }[];
}

interface PlatformAnalytics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  mostViewedProperties: {
    id: string;
    title: string;
    views: number;
  }[];
  topCities: {
    city: string;
    propertyCount: number;
  }[];
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

interface AnalyticsState {
  // Data
  userAnalytics: UserAnalytics | null;
  propertyAnalytics: PropertyAnalytics | null;
  paymentAnalytics: PaymentAnalytics | null;
  markingJobAnalytics: MarkingJobAnalytics | null;
  platformAnalytics: PlatformAnalytics | null;
  revenueTimeSeries: TimeSeriesData[];
  userGrowthTimeSeries: TimeSeriesData[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  
  // Actions
  fetchUserAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchPropertyAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchPaymentAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchMarkingJobAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchPlatformAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchRevenueTimeSeries: (filters?: AnalyticsFilters) => Promise<void>;
  fetchUserGrowthTimeSeries: (filters?: AnalyticsFilters) => Promise<void>;
  fetchAllAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  exportReport: (reportType: string, format: 'csv' | 'pdf') => Promise<void>;
  setFilters: (filters: AnalyticsFilters) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialFilters: AnalyticsFilters = {
  dateFrom: undefined,
  dateTo: undefined,
  groupBy: 'day',
};

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set, get) => ({
      // Initial State
      userAnalytics: null,
      propertyAnalytics: null,
      paymentAnalytics: null,
      markingJobAnalytics: null,
      platformAnalytics: null,
      revenueTimeSeries: [],
      userGrowthTimeSeries: [],
      isLoading: false,
      error: null,
      filters: initialFilters,

      // Fetch user analytics
      fetchUserAnalytics: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);

          const response = await fetch(`/api/admin/analytics/users?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch user analytics');
          }

          const data = await response.json();
          
          set({ 
            userAnalytics: data.analytics,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch property analytics
      fetchPropertyAnalytics: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);

          const response = await fetch(`/api/admin/analytics/properties?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch property analytics');
          }

          const data = await response.json();
          
          set({ 
            propertyAnalytics: data.analytics,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch payment analytics
      fetchPaymentAnalytics: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);

          const response = await fetch(`/api/admin/analytics/payments?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch payment analytics');
          }

          const data = await response.json();
          
          set({ 
            paymentAnalytics: data.analytics,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch marking job analytics
      fetchMarkingJobAnalytics: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);

          const response = await fetch(`/api/admin/analytics/marking-jobs?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch marking job analytics');
          }

          const data = await response.json();
          
          set({ 
            markingJobAnalytics: data.analytics,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch platform analytics
      fetchPlatformAnalytics: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);

          const response = await fetch(`/api/admin/analytics/platform?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch platform analytics');
          }

          const data = await response.json();
          
          set({ 
            platformAnalytics: data.analytics,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Fetch revenue time series
      fetchRevenueTimeSeries: async (filters) => {
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          if (currentFilters.groupBy) queryParams.append('groupBy', currentFilters.groupBy);

          const response = await fetch(`/api/admin/analytics/revenue-series?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch revenue time series');
          }

          const data = await response.json();
          
          set({ revenueTimeSeries: data.series });
        } catch (error) {
          console.error('Failed to fetch revenue time series:', error);
        }
      },

      // Fetch user growth time series
      fetchUserGrowthTimeSeries: async (filters) => {
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = filters || get().filters;
          
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          if (currentFilters.groupBy) queryParams.append('groupBy', currentFilters.groupBy);

          const response = await fetch(`/api/admin/analytics/user-growth-series?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch user growth time series');
          }

          const data = await response.json();
          
          set({ userGrowthTimeSeries: data.series });
        } catch (error) {
          console.error('Failed to fetch user growth time series:', error);
        }
      },

      // Fetch all analytics
      fetchAllAnalytics: async (filters) => {
        set({ isLoading: true, error: null });
        
        try {
          await Promise.all([
            get().fetchUserAnalytics(filters),
            get().fetchPropertyAnalytics(filters),
            get().fetchPaymentAnalytics(filters),
            get().fetchMarkingJobAnalytics(filters),
            get().fetchPlatformAnalytics(filters),
            get().fetchRevenueTimeSeries(filters),
            get().fetchUserGrowthTimeSeries(filters),
          ]);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred',
            isLoading: false,
          });
        }
      },

      // Export report
      exportReport: async (reportType, format) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          const currentFilters = get().filters;
          
          if (currentFilters.dateFrom) queryParams.append('dateFrom', currentFilters.dateFrom);
          if (currentFilters.dateTo) queryParams.append('dateTo', currentFilters.dateTo);
          queryParams.append('format', format);

          const response = await fetch(`/api/admin/analytics/export/${reportType}?${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to export report');
          }

          // Download the file
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
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

      // Reset store
      reset: () => {
        set({
          userAnalytics: null,
          propertyAnalytics: null,
          paymentAnalytics: null,
          markingJobAnalytics: null,
          platformAnalytics: null,
          revenueTimeSeries: [],
          userGrowthTimeSeries: [],
          isLoading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    { name: 'AnalyticsStore' }
  )
);












// import { create } from 'zustand';
// import { devtools } from 'zustand/middleware';

// interface AnalyticsMetrics {
//   overview?: any;
//   users?: any;
//   properties?: any;
//   revenue?: any;
//   traffic?: any;
// }

// interface AnalyticsState {
//   metrics: AnalyticsMetrics;
//   isLoading: boolean;
//   error: string | null;
//   selectedMetric: string | null;
  
//   // Actions
//   setMetrics: (key: keyof AnalyticsMetrics, data: any) => void;
//   setLoading: (isLoading: boolean) => void;
//   setError: (error: string | null) => void;
//   setSelectedMetric: (metric: string | null) => void;
//   reset: () => void;
// }

// const initialState = {
//   metrics: {},
//   isLoading: false,
//   error: null,
//   selectedMetric: null,
// };

// export const useAnalyticsStore = create<AnalyticsState>()(
//   devtools(
//     (set) => ({
//       ...initialState,

//       setMetrics: (key, data) =>
//         set((state) => ({
//           metrics: { ...state.metrics, [key]: data },
//         })),

//       setLoading: (isLoading) => set({ isLoading }),

//       setError: (error) => set({ error }),

//       setSelectedMetric: (metric) => set({ selectedMetric: metric }),

//       reset: () => set(initialState),
//     }),
//     { name: 'Analytics Store' }
//   )
// );