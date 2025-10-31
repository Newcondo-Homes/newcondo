/**
 * Admin Dashboard - API Types
 * Location: apps/admin/src/types/api.ts
 */

/**
 * Standard API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: PaginationMetadata;
  message?: string;
  error?: ApiError;
}

/**
 * API Error
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * Response Metadata
 */
export interface ResponseMetadata {
  timestamp: Date;
  requestId?: string;
  executionTime?: number; // milliseconds
  version?: string;
}

/**
 * Pagination Metadata
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Sort Options
 */
export interface SortOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Filter Options
 */
export interface FilterOptions {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Query Options (combines all query parameters)
 */
export interface QueryOptions extends SortOptions, FilterOptions, PaginationOptions {}

/**
 * Bulk Action Response
 */
export interface BulkActionResponse {
  success: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors?: {
    id: string;
    error: string;
  }[];
  message?: string;
}

/**
 * File Upload Response
 */
export interface FileUploadResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  message?: string;
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * API Request Status
 */
export enum RequestStatus {
  IDLE = "IDLE",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

/**
 * API Call State
 */
export interface ApiCallState<T = any> {
  status: RequestStatus;
  data?: T;
  error?: ApiError;
  loading: boolean;
}

/**
 * HTTP Methods
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * API Request Config
 */
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}

/**
 * API Client Options
 */
export interface ApiClientOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

/**
 * Webhook Event
 */
export interface WebhookEvent<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: Date;
  source: string;
}

/**
 * Export Options
 */
export interface ExportOptions {
  format: "csv" | "excel" | "pdf" | "json";
  fields?: string[];
  filters?: FilterOptions;
  includeHeaders?: boolean;
  filename?: string;
}

/**
 * Export Response
 */
export interface ExportResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  format: string;
  recordCount: number;
  message?: string;
}

/**
 * Batch Operation
 */
export interface BatchOperation<T = any> {
  operation: "create" | "update" | "delete";
  data: T;
  id?: string;
}

/**
 * Batch Request
 */
export interface BatchRequest<T = any> {
  operations: BatchOperation<T>[];
}

/**
 * Batch Response
 */
export interface BatchResponse<T = any> {
  success: boolean;
  results: {
    operation: BatchOperation<T>;
    success: boolean;
    data?: T;
    error?: ApiError;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: Date;
  uptime: number; // seconds
  services: {
    name: string;
    status: "healthy" | "unhealthy";
    responseTime?: number; // milliseconds
    message?: string;
  }[];
  version: string;
}

/**
 * API Rate Limit Info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number; // seconds
}

/**
 * Search Result
 */
export interface SearchResult<T = any> {
  item: T;
  score: number; // relevance score
  highlights?: Record<string, string[]>;
}

/**
 * Search Response
 */
export interface SearchResponse<T = any> {
  success: boolean;
  results: SearchResult<T>[];
  total: number;
  query: string;
  filters?: FilterOptions;
  pagination: PaginationMetadata;
  suggestions?: string[];
}