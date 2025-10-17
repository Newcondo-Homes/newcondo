import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone?: string;
  profileImage?: string;
  
  // Core metrics
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  
  // Performance scores
  reliabilityScore: number; // 0.00 to 5.00
  completionRate: number; // Percentage
  averageCompletionTime: number; // in hours
  onTimeDeliveryRate: number; // Percentage
  
  // Time metrics
  totalHoursWorked: number;
  averageResponseTime: number; // in minutes
  timeSlotUtilization: number; // Percentage
  
  // Quality metrics
  propertyOwnerRating: number; // 0.00 to 5.00
  qualityScore: number; // 0.00 to 5.00
  rejectionsCount: number;
  
  // Financial metrics
  totalEarnings: number;
  pendingPayments: number;
  averageJobValue: number;
  
  // Activity metrics
  lastActiveDate?: Date;
  currentStreak: number; // consecutive days active
  longestStreak: number;
  
  // Service areas
  serviceAreas: string[];
  preferredCities: string[];
  
  // Badge/achievements
  badges: AgentBadge[];
  tier: AgentTier;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export type AgentTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface PerformanceTrend {
  period: string; // e.g., "2024-01", "Week 1"
  completedJobs: number;
  earnings: number;
  averageRating: number;
  completionRate: number;
}

export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  agentName: string;
  profileImage?: string;
  score: number;
  completedJobs: number;
  reliabilityScore: number;
  tier: AgentTier;
}

interface AgentPerformanceState {
  // Current agent performance
  myPerformance: AgentPerformanceMetrics | null;
  performanceTrends: PerformanceTrend[];
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
  myRank: number | null;
  
  // All agents (admin view)
  allAgents: AgentPerformanceMetrics[];
  
  // Filters
  filters: {
    tier?: AgentTier[];
    minReliabilityScore?: number;
    city?: string;
    state?: string;
    isAvailable?: boolean;
  };
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setMyPerformance: (performance: AgentPerformanceMetrics) => void;
  updateMyPerformance: (updates: Partial<AgentPerformanceMetrics>) => void;
  setPerformanceTrends: (trends: PerformanceTrend[]) => void;
  
  // Leaderboard
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setMyRank: (rank: number | null) => void;
  
  // All agents
  setAllAgents: (agents: AgentPerformanceMetrics[]) => void;
  updateAgent: (agentId: string, updates: Partial<AgentPerformanceMetrics>) => void;
  
  // Filters and pagination
  setFilters: (filters: Partial<AgentPerformanceState['filters']>) => void;
  clearFilters: () => void;
  setPagination: (pagination: Partial<AgentPerformanceState['pagination']>) => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utilities
  getAgentById: (agentId: string) => AgentPerformanceMetrics | undefined;
  getTopPerformers: (limit: number) => AgentPerformanceMetrics[];
  getAgentsByTier: (tier: AgentTier) => AgentPerformanceMetrics[];
  calculateTier: (score: number, completedJobs: number) => AgentTier;
  
  // Reset
  reset: () => void;
}

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
};

const initialFilters = {
  tier: undefined,
  minReliabilityScore: undefined,
  city: undefined,
  state: undefined,
  isAvailable: undefined,
};

export const useAgentPerformanceStore = create<AgentPerformanceState>()(
  devtools(
    (set, get) => ({
      // Initial state
      myPerformance: null,
      performanceTrends: [],
      leaderboard: [],
      myRank: null,
      allAgents: [],
      filters: initialFilters,
      pagination: initialPagination,
      isLoading: false,
      error: null,
      
      // Set my performance
      setMyPerformance: (performance) => set({ myPerformance: performance, error: null }),
      
      // Update my performance
      updateMyPerformance: (updates) => set((state) => ({
        myPerformance: state.myPerformance
          ? { ...state.myPerformance, ...updates, updatedAt: new Date() }
          : null,
        error: null,
      })),
      
      // Set performance trends
      setPerformanceTrends: (trends) => set({ performanceTrends: trends, error: null }),
      
      // Set leaderboard
      setLeaderboard: (leaderboard) => set({ leaderboard, error: null }),
      
      // Set my rank
      setMyRank: (rank) => set({ myRank: rank }),
      
      // Set all agents
      setAllAgents: (agents) => set({ allAgents: agents, error: null }),
      
      // Update agent
      updateAgent: (agentId, updates) => set((state) => ({
        allAgents: state.allAgents.map((agent) =>
          agent.agentId === agentId
            ? { ...agent, ...updates, updatedAt: new Date() }
            : agent
        ),
        myPerformance:
          state.myPerformance?.agentId === agentId
            ? { ...state.myPerformance, ...updates, updatedAt: new Date() }
            : state.myPerformance,
        error: null,
      })),
      
      // Set filters
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1 },
      })),
      
      // Clear filters
      clearFilters: () => set({
        filters: initialFilters,
        pagination: initialPagination,
      }),
      
      // Set pagination
      setPagination: (pagination) => set((state) => ({
        pagination: { ...state.pagination, ...pagination },
      })),
      
      // Set loading
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Set error
      setError: (error) => set({ error, isLoading: false }),
      
      // Get agent by ID
      getAgentById: (agentId) => {
        return get().allAgents.find((agent) => agent.agentId === agentId);
      },
      
      // Get top performers
      getTopPerformers: (limit) => {
        return [...get().allAgents]
          .sort((a, b) => {
            // Sort by reliability score, then completion rate
            if (b.reliabilityScore !== a.reliabilityScore) {
              return b.reliabilityScore - a.reliabilityScore;
            }
            return b.completionRate - a.completionRate;
          })
          .slice(0, limit);
      },
      
      // Get agents by tier
      getAgentsByTier: (tier) => {
        return get().allAgents.filter((agent) => agent.tier === tier);
      },
      
      // Calculate tier
      calculateTier: (score, completedJobs) => {
        if (score >= 4.8 && completedJobs >= 100) return 'DIAMOND';
        if (score >= 4.5 && completedJobs >= 50) return 'PLATINUM';
        if (score >= 4.0 && completedJobs >= 25) return 'GOLD';
        if (score >= 3.5 && completedJobs >= 10) return 'SILVER';
        return 'BRONZE';
      },
      
      // Reset
      reset: () => set({
        myPerformance: null,
        performanceTrends: [],
        leaderboard: [],
        myRank: null,
        allAgents: [],
        filters: initialFilters,
        pagination: initialPagination,
        isLoading: false,
        error: null,
      }),
    }),
    { name: 'AgentPerformanceStore' }
  )
);