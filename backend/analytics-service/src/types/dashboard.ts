export interface DashboardOverview {
  period: {
    startDate: Date;
    endDate: Date;
    range: string;
  };
  users: UserStats;
  properties: PropertyStats;
  revenue: RevenueStats;
  markingService: MarkingStats;
  engagement: EngagementStats;
  timestamp: Date;
}

export interface UserStats {
  total: number;
  new: number;
  verified: number;
  byRole: Record<string, number>;
}

export interface PropertyStats {
  total: number;
  new: number;
  published: number;
  rented: number;
}

export interface RevenueStats {
  total: number;
  platformFees: number;
  transactionCount: number;
}

export interface MarkingStats {
  total: number;
  completed: number;
  pending: number;
}

export interface EngagementStats {
  views: number;
  searches: number;
  favorites: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  recentSignups: number;
  propertiesViewed: number;
  paymentsInProgress: number;
  markingJobsActive: number;
  timestamp: Date;
}

export interface PlatformHealth {
  overall: 'healthy' | 'partial' | 'degraded' | 'unhealthy';
  components: {
    database: ComponentHealth;
    api: ComponentHealth;
    paymentSystem: ComponentHealth;
    markingSystem: ComponentHealth;
  };
  timestamp: Date;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}

export interface Alert {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  count: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface Activity {
  id: string;
  type: string;
  timestamp: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  metadata: any;
  description: string;
}