// apps/admin/src/types/reports.ts

/**
 * Report metadata
 */
export interface ReportMetadata {
  reportId: string;
  title: string;
  description?: string;
  type: 'revenue' | 'transactions' | 'users' | 'properties' | 'agents' | 'commissions' | 'marking_jobs' | 'verification' | 'platform_overview' | 'custom';
  format: 'pdf' | 'csv' | 'excel' | 'json';
  status: 'generating' | 'completed' | 'failed';
  generatedBy: string;
  generatedByName: string;
  generatedAt: string;
  fileUrl?: string;
  fileSize?: number;
  expiresAt?: string;
}

/**
 * Report generation request
 */
export interface ReportGenerationRequest {
  reportType: string;
  title: string;
  description?: string;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  period: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: Record<string, any>;
  options?: Record<string, any>;
  notifyOnCompletion?: boolean;
}

/**
 * Report generation progress
 */
export interface ReportGenerationProgress {
  reportId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  estimatedTimeRemaining?: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

/**
 * Scheduled report
 */
export interface ScheduledReport {
  scheduleId: string;
  reportConfig: ReportGenerationRequest;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
  };
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  isActive: boolean;
  lastGenerated?: string;
  nextScheduled: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Report template
 */
export interface ReportTemplate {
  templateId: string;
  name: string;
  description?: string;
  category: 'EXECUTIVE' | 'FINANCIAL' | 'OPERATIONAL' | 'ANALYTICS';
  reportConfig: Partial<ReportGenerationRequest>;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report history
 */
export interface ReportHistory {
  reports: ReportMetadata[];
  totalReports: number;
  totalSize: number;
  recentReports: ReportMetadata[];
  popularReports: Array<{
    type: string;
    count: number;
  }>;
}

/**
 * Report distribution
 */
export interface ReportDistribution {
  distributionId: string;
  reportId: string;
  recipients: Array<{
    email: string;
    name?: string;
    sentAt?: string;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
  }>;
  subject: string;
  message?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Report comparison
 */
export interface ReportComparison {
  comparisonId: string;
  report1: ReportMetadata;
  report2: ReportMetadata;
  differences: Array<{
    metric: string;
    report1Value: number;
    report2Value: number;
    change: number;
    changePercentage: number;
  }>;
  insights: string[];
  generatedAt: string;
}

/**
 * Report export options
 */
export interface ReportExportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  includeCharts: boolean;
  includeRawData: boolean;
  compressionLevel?: 'none' | 'low' | 'medium' | 'high';
  password?: string;
  watermark?: string;
}

/**
 * Report section
 */
export interface ReportSection {
  sectionId: string;
  title: string;
  order: number;
  type: 'summary' | 'chart' | 'table' | 'text' | 'list';
  content: any;
  visible: boolean;
}

/**
 * Custom report builder
 */
export interface CustomReportBuilder {
  dataSource: string;
  selectedFields: string[];
  filters: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  aggregations?: Array<{
    field: string;
    operation: 'count' | 'sum' | 'average' | 'min' | 'max';
    alias?: string;
  }>;
  limit?: number;
}

/**
 * Report sharing
 */
export interface ReportSharing {
  shareId: string;
  reportId: string;
  shareUrl: string;
  expiresAt: string;
  password?: string;
  downloadAllowed: boolean;
  viewCount: number;
  lastViewed?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Report insights
 */
export interface ReportInsights {
  keyFindings: string[];
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    significance: 'high' | 'medium' | 'low';
    description: string;
  }>;
  anomalies: Array<{
    metric: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
    description: string;
  }>;
  recommendations: string[];
}

/**
 * Report subscription
 */
export interface ReportSubscription {
  subscriptionId: string;
  userId: string;
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  deliveryMethod: 'email' | 'dashboard' | 'both';
  isActive: boolean;
  lastDelivered?: string;
  createdAt: string;
}

/**
 * Report analytics
 */
export interface ReportAnalytics {
  reportId: string;
  views: number;
  downloads: number;
  shares: number;
  averageViewDuration: number;
  popularSections: Array<{
    sectionId: string;
    sectionTitle: string;
    viewCount: number;
  }>;
  userEngagement: {
    totalUsers: number;
    returningUsers: number;
    engagementRate: number;
  };
}