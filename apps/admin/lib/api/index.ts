/**
 * Admin API Index
 * Central export point for all admin API modules
 */

// API Client
export { apiClient, type ApiError } from './client';

// Verification API
export * from './verification';

// Properties API
export * from './properties';

// Disputes API
export * from './disputes';

// Marking Jobs API
export * from './markingJobs';

// Payments API
export * from './payments';

// Support API
export * from './support';

// Analytics API
export * from './analytics';

// Duplicates API
export * from './duplicates';

// Re-export common types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SearchParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}