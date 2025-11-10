import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Date range validation schema
const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'all']).optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date'
  }
);

// Platform metrics validation
const platformMetricsSchema = z.object({
  ...dateRangeSchema.shape,
  metrics: z.array(z.enum([
    'total_users',
    'active_users',
    'total_properties',
    'total_transactions',
    'platform_revenue',
    'conversion_rate'
  ])).optional()
});

// Transaction analytics validation
const transactionAnalyticsSchema = z.object({
  ...dateRangeSchema.shape,
  status: z.enum(['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED', 'all']).optional(),
  paymentType: z.enum(['RENT', 'DEPOSIT', 'AGENT_COMMISSION', 'PREMIUM_UPGRADE', 'PROPERTY_MARKING', 'all']).optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'status', 'type']).optional()
}).refine(
  (data) => {
    if (data.minAmount && data.maxAmount) {
      return data.minAmount <= data.maxAmount;
    }
    return true;
  },
  {
    message: 'Minimum amount must be less than or equal to maximum amount'
  }
);

// Revenue analytics validation
const revenueAnalyticsSchema = z.object({
  ...dateRangeSchema.shape,
  breakdown: z.enum(['total', 'by_source', 'by_period', 'by_property_type']).optional(),
  includeProjections: z.boolean().optional()
});

// Agent performance validation
const agentPerformanceSchema = z.object({
  ...dateRangeSchema.shape,
  agentId: z.string().cuid().optional(),
  sortBy: z.enum(['revenue', 'properties_listed', 'completion_rate', 'rating']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional()
});

// Market insights validation
const marketInsightsSchema = z.object({
  ...dateRangeSchema.shape,
  city: z.string().optional(),
  state: z.string().optional(),
  propertyType: z.enum([
    'APARTMENT',
    'HOUSE',
    'DUPLEX',
    'ROOM',
    'SHARED_APARTMENT',
    'OFFICE',
    'SHOP',
    'WAREHOUSE',
    'all'
  ]).optional(),
  analysisType: z.enum(['price_trends', 'demand_supply', 'occupancy_rates', 'growth_areas']).optional()
});

// System health validation
const systemHealthSchema = z.object({
  metrics: z.array(z.enum([
    'api_response_time',
    'error_rate',
    'active_connections',
    'database_performance',
    'payment_gateway_status',
    'storage_usage'
  ])).optional(),
  includeHistory: z.boolean().optional()
});

// Pagination validation
const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Generic validation middleware factory
 */
const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse({
        ...req.query,
        ...req.body,
        ...req.params
      });
      
      // Replace request data with validated data
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Validation error occurred'
      });
    }
  };
};

// Export validation middlewares
export const validateDateRange = validateSchema(dateRangeSchema);
export const validatePlatformMetrics = validateSchema(platformMetricsSchema);
export const validateTransactionAnalytics = validateSchema(transactionAnalyticsSchema);
export const validateRevenueAnalytics = validateSchema(revenueAnalyticsSchema);
export const validateAgentPerformance = validateSchema(agentPerformanceSchema);
export const validateMarketInsights = validateSchema(marketInsightsSchema);
export const validateSystemHealth = validateSchema(systemHealthSchema);
export const validatePagination = validateSchema(paginationSchema);

/**
 * Validate export format
 */
export const validateExportFormat = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const format = req.query.format as string;
  
  if (format && !['json', 'csv', 'xlsx', 'pdf'].includes(format)) {
    res.status(400).json({
      success: false,
      error: 'Invalid export format. Supported formats: json, csv, xlsx, pdf'
    });
    return;
  }
  
  next();
};

/**
 * Validate analytics time range limits
 */
export const validateTimeRangeLimits = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    // Limit to 2 years for performance
    if (daysDiff > 730) {
      res.status(400).json({
        success: false,
        error: 'Date range cannot exceed 2 years'
      });
      return;
    }
  }
  
  next();
};