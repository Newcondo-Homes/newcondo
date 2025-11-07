import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  errorRate: number;
  [key: string]: any;
}

interface SystemHealthState {
  healthStatus: HealthStatus | null;
  alerts: any[];
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Actions
  setHealthStatus: (status: HealthStatus) => void;
  setAlerts: (alerts: any[]) => void;
  addAlert: (alert: any) => void;
  removeAlert: (alertId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
  reset: () => void;
}

const initialState = {
  healthStatus: null,
  alerts: [],
  isLoading: false,
  error: null,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
};

export const useSystemHealthStore = create<SystemHealthState>()(
  devtools(
    (set) => ({
      ...initialState,

      setHealthStatus: (status) => set({ healthStatus: status }),

      setAlerts: (alerts) => set({ alerts }),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [...state.alerts, alert],
        })),

      removeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.filter((alert) => alert.id !== alertId),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      toggleAutoRefresh: () =>
        set((state) => ({
          autoRefresh: !state.autoRefresh,
        })),

      setRefreshInterval: (interval) => set({ refreshInterval: interval }),

      reset: () => set(initialState),
    }),
    { name: 'System Health Store' }
  )
);