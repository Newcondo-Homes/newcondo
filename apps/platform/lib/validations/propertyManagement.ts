import { z } from 'zod';
import { PropertyStatus, PropertyType, PropertyStructure } from '@newcondo/db';

export const propertyManagementFilterSchema = z.object({
  status: z.nativeEnum(PropertyStatus).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  structure: z.nativeEnum(PropertyStructure).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  sortBy: z.enum(['createdAt', 'price', 'viewCount', 'favoriteCount', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const propertyBulkActionSchema = z.object({
  propertyIds: z.array(z.string().cuid()).min(1, 'At least one property must be selected'),
  action: z.enum(['publish', 'unpublish', 'delete', 'archive']),
  reason: z.string().optional(), // For deletions or unpublishing
});

export const propertyDashboardStatsSchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  compareWithPrevious: z.boolean().default(false),
});

export const exportPropertiesSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json', 'pdf']),
  fields: z.array(z.string()).optional(),
  filters: propertyManagementFilterSchema.optional(),
  includeUnits: z.boolean().default(true),
  includeAnalytics: z.boolean().default(false),
});

export const propertyPerformanceQuerySchema = z.object({
  propertyId: z.string().cuid(),
  metrics: z.array(z.enum(['views', 'favorites', 'inquiries', 'applications', 'conversions'])).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export const tenantManagementSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
  includeHistory: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING_CONFIRMATION']).optional(),
});

export type PropertyManagementFilter = z.infer<typeof propertyManagementFilterSchema>;
export type PropertyBulkAction = z.infer<typeof propertyBulkActionSchema>;
export type PropertyDashboardStats = z.infer<typeof propertyDashboardStatsSchema>;
export type ExportProperties = z.infer<typeof exportPropertiesSchema>;
export type PropertyPerformanceQuery = z.infer<typeof propertyPerformanceQuerySchema>;
export type TenantManagement = z.infer<typeof tenantManagementSchema>;