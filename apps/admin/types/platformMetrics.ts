import { Decimal } from '@prisma/client/runtime/library';

/**
 * Platform health metrics
 */
export interface PlatformHealthMetrics {
  timestamp: Date;
  
  // System performance
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  
  // Application metrics
  application: {
    activeConnections: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    slowQueryCount: number;
  };
  
  // Database metrics
  database: {
    connectionPoolUsage: number;
    activeQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    databaseSize: number;
  };
  
  // External services
  externalServices: {
    flutterwaveStatus: 'up' | 'down' | 'degraded';
    uploadServiceStatus: 'up' | 'down' | 'degraded';
    emailServiceStatus: 'up' | 'down' | 'degraded';
    smsServiceStatus: 'up' | 'down' | 'degraded';
    mapsApiStatus: 'up' | 'down' | 'degraded';
  };
  
  // Overall health
  overallHealth: 'healthy' | 'warning' | 'critical';
  healthScore: number; // 0-100
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // API performance
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    
    // By endpoint
    byEndpoint: {
      endpoint: string;
      method: string;
      requests: number;
      averageResponseTime: number;
      errorRate: number;
    }[];
  };
  
  // Page load times
  frontend: {
    averagePageLoadTime: number;
    averageTimeToInteractive: number;
    averageFirstContentfulPaint: number;
    
    // By page
    byPage: {
      page: string;
      averageLoadTime: number;
      visits: number;
      bounceRate: number;
    }[];
  };
  
  // Error rates
  errors: {
    total4xxErrors: number;
    total5xxErrors: number;
    errorRate: number;
    
    // By error type
    byType: {
      statusCode: number;
      count: number;
      percentage: number;
    }[];
  };
}

/**
 * User engagement metrics
 */
export interface UserEngagementMetrics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Active users
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  
  // Session metrics
  sessions: {
    totalSessions: number;
    averageSessionDuration: number;
    averagePagesPerSession: number;
    bounceRate: number;
  };
  
  // Feature usage
  featureUsage: {
    feature: string;
    users: number;
    usageCount: number;
    averageTimeSpent: number;
  }[];
  
  // User actions
  topActions: {
    action: string;
    count: number;
    uniqueUsers: number;
  }[];
  
  // Retention
  retention: {
    day1: number;
    day7: number;
    day30: number;
    day90: number;
  };
  
  // Churn analysis
  churn: {
    churnedUsers: number;
    churnRate: number;
    averageLifetime: number;
  };
}

/**
 * Growth metrics
 */
export interface GrowthMetrics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // User growth
  userGrowth: {
    newUsers: number;
    growthRate: number;
    compoundMonthlyGrowthRate: number;
    
    // By source
    byAcquisitionChannel: {
      channel: string;
      users: number;
      growthRate: number;
    }[];
    
    // Time series
    timeSeries: {
      date: Date;
      newUsers: number;
      totalUsers: number;
    }[];
  };
  
  // Property growth
  propertyGrowth: {
    newProperties: number;
    growthRate: number;
    
    // By type
    byPropertyType: {
      type: string;
      count: number;
      growthRate: number;
    }[];
    
    // Time series
    timeSeries: {
      date: Date;
      newProperties: number;
      totalProperties: number;
    }[];
  };
  
  // Revenue growth
  revenueGrowth: {
    currentRevenue: Decimal;
    previousRevenue: Decimal;
    growthRate: number;
    monthOverMonthGrowth: number;
    
    // Time series
    timeSeries: {
      date: Date;
      revenue: Decimal;
      transactions: number;
    }[];
  };
  
  // Market penetration
  marketPenetration: {
    totalMarketSize: number;
    currentMarketShare: number;
    penetrationRate: number;
    
    // By location
    byLocation: {
      state: string;
      penetrationRate: number;
      users: number;
    }[];
  };
}

/**
 * Conversion metrics
 */
export interface ConversionMetrics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Overall conversion
  overall: {
    visitors: number;
    signups: number;
    verified: number;
    listers: number;
    renters: number;
    
    // Conversion rates
    visitorToSignup: number;
    signupToVerified: number;
    verifiedToLister: number;
    listingToRental: number;
  };
  
  // Funnel analysis
  funnel: {
    stage: string;
    users: number;
    conversionRate: number;
    dropOffRate: number;
    averageTimeInStage: number;
  }[];
  
  // A/B test results
  abTests: {
    testId: string;
    testName: string;
    variants: {
      name: string;
      users: number;
      conversions: number;
      conversionRate: number;
    }[];
    winner?: string;
  }[];
}

/**
 * Business metrics
 */
export interface BusinessMetrics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Revenue metrics
  revenue: {
    totalRevenue: Decimal;
    recurringRevenue: Decimal;
    averageRevenuePerUser: Decimal;
    
    // By source
    bySource: {
      source: string;
      revenue: Decimal;
      percentage: number;
    }[];
  };
  
  // Customer metrics
  customer: {
    totalCustomers: number;
    activeCustomers: number;
    customerLifetimeValue: Decimal;
    customerAcquisitionCost: Decimal;
    
    // Cohorts
    cohorts: {
      cohortDate: Date;
      customers: number;
      revenue: Decimal;
    }[];
  };
  
  // Unit economics
  unitEconomics: {
    averageTransactionValue: Decimal;
    costPerTransaction: Decimal;
    profitMargin: number;
    breakEvenPoint: Decimal;
  };
  
  // Projections
  projections: {
    nextMonthRevenue: Decimal;
    nextQuarterRevenue: Decimal;
    annualRecurringRevenue: Decimal;
  };
}

/**
 * Platform KPIs
 */
export interface PlatformKPIs {
  timestamp: Date;
  
  // Key performance indicators
  kpis: {
    name: string;
    value: number | Decimal;
    target: number | Decimal;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
    status: 'on_track' | 'at_risk' | 'off_track';
  }[];
  
  // Goals progress
  goals: {
    goal: string;
    current: number | Decimal;
    target: number | Decimal;
    progress: number;
    deadline: Date;
    status: 'on_track' | 'at_risk' | 'missed';
  }[];
}