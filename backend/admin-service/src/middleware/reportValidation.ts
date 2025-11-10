import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Report generation validation schema
const reportGenerationSchema = z.object({
  reportType: z.enum([
    'platform_overview',
    'revenue_summary',
    'user_analytics',
    'property_performance',
    'transaction_report',
    'agent_performance',
    'market_analysis',
    'system_health',
    'custom'
  ]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['pdf', 'xlsx', 'csv', 'json']).default('pdf'),
  includeCharts: z.boolean().optional().default(true),
  includeRawData: z.boolean().optional().default(false),
  filters: z.object({
    cities: z.array(z.string()).optional(),
    states: z.array(z.string()).optional(),
    propertyTypes: z.array(z.string()).optional(),
    userRoles: z.array(z.string()).optional(),
    paymentStatuses: z.array(z.string()).optional()
  }).optional(),
  customMetrics: z.array(z.string()).optional(),
  emailTo: z.array(z.string().email()).optional(),
  schedule: z.object({
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
  }).optional()
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date must be before or equal to end date'
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 365; // Max 1 year for reports
  },
  {
    message: 'Report date range cannot exceed 1 year'
  }
);

// Scheduled report validation
const scheduledReportSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  reportType: z.enum([
    'platform_overview',
    'revenue_summary',
    'user_analytics',
    'property_performance',
    'transaction_report',
    'agent_performance',
    'market_analysis'
  ]),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }),
  format: z.enum(['pdf', 'xlsx', 'csv']).default('pdf'),
  recipients: z.array(z.string().email()).min(1).max(10),
  filters: z.object({
    cities: z.array(z.string()).optional(),
    states: z.array(z.string()).optional(),
    propertyTypes: z.array(z.string()).optional()
  }).optional(),
  isActive: z.boolean().default(true)
}).refine(
  (data) => {
    if (data.schedule.frequency === 'weekly' && data.schedule.dayOfWeek === undefined) {
      return false;
    }
    if (data.schedule.frequency === 'monthly' && data.schedule.dayOfMonth === undefined) {
      return false;
    }
    return true;
  },
  {
    message: 'Weekly reports require dayOfWeek, monthly reports require dayOfMonth'
  }
);

// Report export validation
const reportExportSchema = z.object({
  reportId: z.string().cuid(),
  format: z.enum(['pdf', 'xlsx', 'csv', 'json']),
  includeRawData: z.boolean().optional().default(false)
});

// Report comparison validation
const reportComparisonSchema = z.object({
  reportIds: z.array(z.string().cuid()).min(2).max(5),
  comparisonType: z.enum(['period_over_period', 'year_over_year', 'metric_comparison']),
  metrics: z.array(z.string()).optional()
});

/**
 * Validate report generation request
 */
export const validateReportGeneration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = reportGenerationSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Report generation validation failed',
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

/**
 * Validate scheduled report creation/update
 */
export const validateScheduledReport = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = scheduledReportSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Scheduled report validation failed',
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

/**
 * Validate report export request
 */
export const validateReportExport = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = reportExportSchema.parse({
      ...req.params,
      ...req.query
    });
    req.query = validated as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Report export validation failed',
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

/**
 * Validate report comparison request
 */
export const validateReportComparison = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validated = reportComparisonSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Report comparison validation failed',
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

/**
 * Validate report access permissions
 */
export const validateReportAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { reportId } = req.params;
  
  if (!reportId) {
    res.status(400).json({
      success: false,
      error: 'Report ID is required'
    });
    return;
  }
  
  // Additional permission checks can be added here
  // For now, we rely on admin authentication middleware
  next();
};

/**
 * Validate report file size limits
 */
export const validateReportSizeLimits = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { includeRawData, format } = req.body;
  
  // Warn about large reports
  if (includeRawData && format === 'xlsx') {
    console.warn('Large report requested with raw data and Excel format');
  }
  
  next();
};