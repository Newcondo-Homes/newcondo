// apps/platform/store/analyticsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AnalyticsFilter {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  startDate?: Date;
  endDate?: Date;
  propertyId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'property';
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

interface AnalyticsState {
  // Filters
  currentFilter: AnalyticsFilter;
  
  // Chart preferences
  chartType: 'line' | 'bar' | 'pie' | 'doughnut';
  showComparison: boolean;
  
  // Selected metrics for display
  selectedMetrics: string[];
  
  // Dashboard layout
  widgetLayout: {
    id: string;
    position: number;
    visible: boolean;
  }[];
  
  // Cached chart data
  cachedChartData: Record<string, ChartData>;
  
  // Actions
  setCurrentFilter: (filter: AnalyticsFilter) => void;
  updateFilter: (updates: Partial<AnalyticsFilter>) => void;
  resetFilter: () => void;
  
  setChartType: (type: 'line' | 'bar' | 'pie' | 'doughnut') => void;
  toggleComparison: () => void;
  
  toggleMetric: (metric: string) => void;
  setSelectedMetrics: (metrics: string[]) => void;
  
  updateWidgetLayout: (widgets: { id: string; position: number; visible: boolean }[]) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  
  cacheChartData: (key: string, data: ChartData) => void;
  getCachedChartData: (key: string) => ChartData | undefined;
  clearCache: () => void;
}

const defaultFilter: AnalyticsFilter = {
  period: 'month',
};

const defaultMetrics = ['views', 'conversions', 'earnings', 'rentals'];

const defaultWidgets = [
  { id: 'overview', position: 0, visible: true },
  { id: 'views-chart', position: 1, visible: true },
  { id: 'earnings-chart', position: 2, visible: true },
  { id: 'top-properties', position: 3, visible: true },
  { id: 'recent-activity', position: 4, visible: true },
];

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    persist(
      (set, get) => ({
        currentFilter: defaultFilter,
        chartType: 'line',
        showComparison: false,
        selectedMetrics: defaultMetrics,
        widgetLayout: defaultWidgets,
        cachedChartData: {},

        setCurrentFilter: (filter) =>
          set({ currentFilter: filter }, false, 'setCurrentFilter'),

        updateFilter: (updates) =>
          set(
            (state) => ({
              currentFilter: { ...state.currentFilter, ...updates },
            }),
            false,
            'updateFilter'
          ),

        resetFilter: () =>
          set({ currentFilter: defaultFilter }, false, 'resetFilter'),

        setChartType: (type) => set({ chartType: type }, false, 'setChartType'),

        toggleComparison: () =>
          set(
            (state) => ({ showComparison: !state.showComparison }),
            false,
            'toggleComparison'
          ),

        toggleMetric: (metric) =>
          set(
            (state) => ({
              selectedMetrics: state.selectedMetrics.includes(metric)
                ? state.selectedMetrics.filter((m) => m !== metric)
                : [...state.selectedMetrics, metric],
            }),
            false,
            'toggleMetric'
          ),

        setSelectedMetrics: (metrics) =>
          set({ selectedMetrics: metrics }, false, 'setSelectedMetrics'),

        updateWidgetLayout: (widgets) =>
          set({ widgetLayout: widgets }, false, 'updateWidgetLayout'),

        toggleWidgetVisibility: (widgetId) =>
          set(
            (state) => ({
              widgetLayout: state.widgetLayout.map((widget) =>
                widget.id === widgetId
                  ? { ...widget, visible: !widget.visible }
                  : widget
              ),
            }),
            false,
            'toggleWidgetVisibility'
          ),

        cacheChartData: (key, data) =>
          set(
            (state) => ({
              cachedChartData: { ...state.cachedChartData, [key]: data },
            }),
            false,
            'cacheChartData'
          ),

        getCachedChartData: (key) => {
          const { cachedChartData } = get();
          return cachedChartData[key];
        },

        clearCache: () =>
          set({ cachedChartData: {} }, false, 'clearCache'),
      }),
      {
        name: 'analytics-storage',
        partialize: (state) => ({
          chartType: state.chartType,
          showComparison: state.showComparison,
          selectedMetrics: state.selectedMetrics,
          widgetLayout: state.widgetLayout,
        }),
      }
    ),
    { name: 'AnalyticsStore' }
  )
);