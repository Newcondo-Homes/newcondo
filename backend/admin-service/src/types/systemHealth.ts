export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  database: DatabaseHealth;
  thirdParty: ThirdPartyHealth;
  timestamp: Date;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unreachable';
  uptime: number;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connectionCount: number;
  activeConnections: number;
  idleConnections: number;
  queryPerformance: {
    averageQueryTime: number;
    slowQueries: number;
  };
  storage: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
}

export interface APIPerformance {
  service: string;
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
  };
  endpoints: {
    endpoint: string;
    count: number;
    averageTime: number;
    errorCount: number;
  }[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  message: string;
  stackTrace?: string;
  metadata?: any;
}

export interface ErrorLogs {
  logs: ErrorLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ResourceUsage {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
  timestamp: Date;
}

export interface UptimeHistory {
  service?: string;
  history: {
    date: string;
    uptime: number;
    downtime: number;
    incidents: number;
  }[];
  summary: {
    averageUptime: number;
    totalIncidents: number;
    longestUptime: number;
    longestDowntime: number;
  };
}

export interface ThirdPartyHealth {
  services: {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    responseTime?: number;
    lastCheck: Date;
    error?: string;
  }[];
  overallStatus: 'operational' | 'degraded' | 'down';
}

export interface BackupStatus {
  lastBackup: Date;
  nextBackup: Date;
  backupSize: number;
  status: 'success' | 'failed' | 'in_progress';
  retentionDays: number;
  backups: {
    date: Date;
    size: number;
    status: 'success' | 'failed';
    location: string;
  }[];
}

export interface HealthCheckResult {
  service: string;
  healthy: boolean;
  checks: {
    name: string;
    passed: boolean;
    message?: string;
    duration: number;
  }[];
  timestamp: Date;
}