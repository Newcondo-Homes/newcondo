import { Request, Response } from 'express';
import { Role } from "@newcondo/db";


export type AuthenticatedRequest = Request & {
  user: NonNullable<Request['user']>; // Ensures user is not undefined
};
// Base API Response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

// Service route handler type
export interface ServiceRouteHandler {
  (req: Request, res: Response): Promise<void> | void;
}

// Service module interface
export interface ServiceModule {
  routes: {
    [key: string]: ServiceRouteHandler;
  };
  middleware?: {
    [key: string]: any;
  };
  controllers?: {
    [key: string]: any;
  };
  services?: {
    [key: string]: any;
  };
}

// Combined service configuration
export interface CombinedServiceConfig {
  port: number;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  security: {
    helmet: boolean;
    compression: boolean;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'simple';
  };
}

// Service initialization result
export interface ServiceInitResult {
  serviceName: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

// Health check result
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  details?: {
    uptime?: number;
    memory?: {
      used: number;
      total: number;
    };
    database?: {
      connected: boolean;
      latency?: number;
    };
    dependencies?: {
      [key: string]: 'healthy' | 'unhealthy';
    };
  };
}

// Request context
export interface RequestContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  ip: string;
  userAgent?: string;
  requestId: string;
  timestamp: string;
}

// Service operation result
export interface ServiceOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  };
}

// Database operation options
export interface DatabaseOptions {
  transaction?: boolean;
  timeout?: number;
  retries?: number;
}

// File upload context
export interface FileUploadContext {
  userId: string;
  entityId?: string;
  entityType?: string;
  allowedTypes: string[];
  maxSize: number;
  folder: string;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Filter parameters
export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

// Service metrics
export interface ServiceMetrics {
  serviceName: string;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
  };
  timestamp: string;
}

// Error context
export interface ErrorContext {
  serviceName: string;
  operation: string;
  userId?: string;
  requestId: string;
  additionalInfo?: Record<string, any>;
}

// Notification context
export interface NotificationContext {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  template: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
  ip: string;
  userAgent?: string;
}

// Service status
export interface ServiceStatus {
  name: string;
  version: string;
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  lastHealthCheck: string;
  dependencies: {
    [key: string]: 'connected' | 'disconnected' | 'error';
  };
}



// Extended Express Request interface
export interface ExtendedRequest extends Request {
  context?: RequestContext;
  user?: {
    id: string;
    email: string;
    role: Role;
  };
  pagination?: PaginationParams;
  filters?: FilterParams;
}