// apps/admin/src/types/systemHealth.ts

/**
 * System health overview
 */
export interface SystemHealthOverview {
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'offline';
  healthScore: number;
  lastChecked: string;
  uptime: number;
  uptimePercentage: number;
  
  services: {
    api: ServiceHealth;
    database: ServiceHealth;
    cache: ServiceHealth;
    storage: ServiceHealth;
    payment: ServiceHealth;
    notification: ServiceHealth;
  };
  
  alerts: SystemAlert[];
  recentIncidents: SystemIncident[];
}

/**
 * Service health
 */
export interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastChecked: string;
  metrics: {
    requestsPerMinute: number;
    successRate: number;
    averageLatency: number;
  };
}

/**
 * API performance metrics
 */
export interface APIPerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  
  responseTime: {
    average: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  
  requestsByEndpoint: Array<{
    endpoint: string;
    method: string;
    count: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  
  requestsByStatus: Array<{
    statusCode: number;
    count: number;
    percentage: number;
  }>;
  
  requestsTimeline: Array<{
    timestamp: string;
    count: number;
    avgResponseTime: number;
    errorCount: number;
  }>;
}

/**
 * Database metrics
 */
export interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
    max: number;
    utilization: number;
  };
  
  queries: {
    totalQueries: number;
    slowQueries: number;
    failedQueries: number;
    avgQueryTime: number;
    longestQuery: number;
  };
  
  storage: {
    totalSize: number;
    usedSize: number;
    freeSize: number;
    utilizationPercentage: number;
  };
  
  performance: {
    readsPerSecond: number;
    writesPerSecond: number;
    cacheHitRate: number;
    indexEfficiency: number;
  };
}

/**
 * Cache metrics
 */
export interface CacheMetrics {
  provider: 'redis' | 'memcached' | 'in-memory';
  
  hitRate: number;
  missRate: number;
  evictionRate: number;
  
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    hits: number;
    misses: number;
  };
  
  memory: {
    used: number;
    total: number;
    utilizationPercentage: number;
    fragmentationRatio: number;
  };
  
  performance: {
    avgGetLatency: number;
    avgSetLatency: number;
    throughput: number;
  };
  
  keys: {
    totalKeys: number;
    expiredKeys: number;
    evictedKeys: number;
  };
}

/**
 * Server metrics
 */
export interface ServerMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  
  memory: {
    total: number;
    used: number;
    free: number;
    utilizationPercentage: number;
  };
  
  disk: {
    total: number;
    used: number;
    free: number;
    utilizationPercentage: number;
    iops: number;
  };
  
  network: {
    inbound: number;
    outbound: number;
    connections: number;
  };
  
  processes: {
    total: number;
    running: number;
    sleeping: number;
    zombie: number;
  };
}

/**
 * Error tracking
 */
export interface ErrorTracking {
  totalErrors: number;
  errorRate: number;
  
  errorsByType: Array<{
    type: string;
    count: number;
    percentage: number;
    lastOccurrence: string;
  }>;
  
  errorsByEndpoint: Array<{
    endpoint: string;
    errorCount: number;
    errorRate: number;
  }>;
  
  criticalErrors: Array<{
    errorId: string;
    type: string;
    message: string;
    stack?: string;
    endpoint: string;
    userId?: string;
    timestamp: string;
    resolved: boolean;
  }>;
  
  errorTrend: Array<{
    period: string;
    count: number;
  }>;
}

/**
 * System alert
 */
export interface SystemAlert {
  alertId: string;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  title: string;
  message: string;
  affectedService?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

/**
 * System incident
 */
export interface SystemIncident {
  incidentId: string;
  title: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affectedServices: string[];
  startTime: string;
  endTime?: string;
  duration?: number;
  rootCause?: string;
  resolution?: string;
  impactedUsers?: number;
  updates: Array<{
    message: string;
    timestamp: string;
  }>;
}

/**
 * Uptime monitoring
 */
export interface UptimeMonitoring {
  currentUptime: number;
  uptimePercentage: number;
  
  uptimeByPeriod: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  
  downtimeEvents: Array<{
    eventId: string;
    startTime: string;
    endTime: string;
    duration: number;
    reason: string;
    affectedServices: string[];
  }>;
  
  uptimeHistory: Array<{
    date: string;
    uptime: number;
    downtime: number;
  }>;
  
  sla: {
    target: number;
    actual: number;
    compliance: boolean;
  };
}

/**
 * Rate limiting metrics
 */
export interface RateLimitMetrics {
  totalRequests: number;
  limitedRequests: number;
  limitedPercentage: number;
  
  byEndpoint: Array<{
    endpoint: string;
    totalRequests: number;
    limitedRequests: number;
    limitedPercentage: number;
  }>;
  
  byUser: Array<{
    userId: string;
    totalRequests: number;
    limitedRequests: number;
  }>;
  
  byIpAddress: Array<{
    ipAddress: string;
    totalRequests: number;
    limitedRequests: number;
  }>;
}

/**
 * Security metrics
 */
export interface SecurityMetrics {
  authenticationAttempts: {
    total: number;
    successful: number;
    failed: number;
    failureRate: number;
  };
  
  suspiciousActivity: {
    count: number;
    blocked: number;
    flagged: number;
    types: Array<{
      type: string;
      count: number;
    }>;
  };
  
  bannedIPs: {
    total: number;
    permanent: number;
    temporary: number;
  };
  
  securityIncidents: Array<{
    incidentId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

/**
 * Background jobs monitoring
 */
export interface BackgroundJobsMonitoring {
  activeJobs: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
  
  jobsByType: Array<{
    type: string;
    count: number;
    avgDuration: number;
    failureRate: number;
  }>;
  
  queueStats: {
    avgWaitTime: number;
    longestWaitTime: number;
    processingRate: number;
  };
  
  failedJobs: Array<{
    jobId: string;
    type: string;
    error: string;
    attempts: number;
    timestamp: string;
  }>;
}

/**
 * Third-party service status
 */
export interface ThirdPartyServiceStatus {
  flutterwave: {
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    lastChecked: string;
    incidents: number;
  };
  
  cloudinary: {
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    lastChecked: string;
    incidents: number;
  };
  
  googleMaps: {
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    lastChecked: string;
    incidents: number;
  };
  
  emailService: {
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    lastChecked: string;
    deliveryRate: number;
  };
  
  smsService: {
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    lastChecked: string;
    deliveryRate: number;
  };
}

/**
 * Performance benchmarks
 */
export interface PerformanceBenchmarks {
  category: string;
  
  benchmarks: Array<{
    metric: string;
    target: number;
    actual: number;
    unit: string;
    status: 'passing' | 'warning' | 'failing';
  }>;
  
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * System capacity
 */
export interface SystemCapacity {
  current: {
    activeUsers: number;
    requestsPerSecond: number;
    storageUsed: number;
    databaseConnections: number;
  };
  
  capacity: {
    maxUsers: number;
    maxRequestsPerSecond: number;
    maxStorage: number;
    maxDatabaseConnections: number;
  };
  
  utilization: {
    users: number;
    requests: number;
    storage: number;
    database: number;
  };
  
  projectedCapacityReached?: string;
  recommendations: string[];
}