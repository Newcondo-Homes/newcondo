import { apiClient } from './client';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportConfig {
  type: ReportType;
  dateRange: DateRange;
  format: 'csv' | 'pdf' | 'excel';
  includeCharts?: boolean;
  filters?: any;
  schedule?: string;
}

export type ReportType =
  | 'USER_REPORT'
  | 'REVENUE_REPORT'
  | 'PROPERTY_REPORT'
  | 'AGENT_REPORT'
  | 'TRANSACTION_REPORT'
  | 'MARKET_REPORT'
  | 'SYSTEM_REPORT'
  | 'CUSTOM_REPORT';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  defaultFormat: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
  }>;
  sampleUrl?: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: ReportType;
  schedule: string;
  format: string;
  filters?: any;
  recipients: string[];
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  createdBy: string;
}

export interface ReportHistory {
  id: string;
  type: ReportType;
  name: string;
  format: string;
  status: 'pending' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  generatedAt: Date;
  generatedBy: string;
  downloadCount: number;
}

// Generate report
export async function generateReport(config: ReportConfig): Promise<{
  reportId: string;
  status: string;
  url?: string;
  message: string;
}> {
  const response = await apiClient.post('/admin/reports/generate', {
    ...config,
    dateRange: {
      startDate: config.dateRange.startDate.toISOString(),
      endDate: config.dateRange.endDate.toISOString(),
    },
  });
  return response.data;
}

// Get report templates
export async function getReportTemplates(): Promise<ReportTemplate[]> {
  const response = await apiClient.get('/admin/reports/templates');
  return response.data;
}

// Get scheduled reports
export async function getScheduledReports(): Promise<ScheduledReport[]> {
  const response = await apiClient.get('/admin/reports/scheduled');
  return response.data;
}

// Schedule report
export async function scheduleReport(
  config: ReportConfig & {
    schedule: string;
    name: string;
    recipients: string[];
  }
): Promise<{ message: string; reportId: string }> {
  const response = await apiClient.post('/admin/reports/schedule', {
    ...config,
    dateRange: {
      startDate: config.dateRange.startDate.toISOString(),
      endDate: config.dateRange.endDate.toISOString(),
    },
  });
  return response.data;
}

// Cancel scheduled report
export async function cancelScheduledReport(reportId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/admin/reports/scheduled/${reportId}`);
  return response.data;
}

// Get report history
export async function getReportHistory(
  page: numberpage: number = 1,
  pageSize: number = 20
): Promise<{ reports: ReportHistory[]; total: number; page: number; pageSize: number }> {
  const response = await apiClient.get('/admin/reports/history', {
    params: { page, pageSize },
  });
  return response.data;
}

// Download report
export async function downloadReport(reportId: string): Promise<Blob> {
  const response = await apiClient.get(`/admin/reports/${reportId}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

// Delete report
export async function deleteReport(reportId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/admin/reports/${reportId}`);
  return response.data;
}

// Get report status
export async function getReportStatus(reportId: string): Promise<{
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  fileUrl?: string;
}> {
  const response = await apiClient.get(`/admin/reports/${reportId}/status`);
  return response.data;
}

// Update scheduled report
export async function updateScheduledReport(
  reportId: string,
  updates: Partial<{
    name: string;
    schedule: string;
    format: string;
    filters: any;
    recipients: string[];
    isActive: boolean;
  }>
): Promise<{ message: string }> {
  const response = await apiClient.patch(`/admin/reports/scheduled/${reportId}`, updates);
  return response.data;
}

// Get report by ID
export async function getReportById(reportId: string): Promise<ReportHistory> {
  const response = await apiClient.get(`/admin/reports/${reportId}`);
  return response.data;
}

// Email report
export async function emailReport(
  reportId: string,
  recipients: string[],
  message?: string
): Promise<{ message: string }> {
  const response = await apiClient.post(`/admin/reports/${reportId}/email`, {
    recipients,
    message,
  });
  return response.data;
}

// Generate custom report
export async function generateCustomReport(config: {
  name: string;
  dateRange: DateRange;
  format: string;
  sections: Array<{
    type: string;
    title: string;
    data: any;
  }>;
}): Promise<{ reportId: string; url: string }> {
  const response = await apiClient.post('/admin/reports/custom', {
    ...config,
    dateRange: {
      startDate: config.dateRange.startDate.toISOString(),
      endDate: config.dateRange.endDate.toISOString(),
    },
  });
  return response.data;
}

// Get report templates by type
export async function getReportTemplatesByType(type: ReportType): Promise<ReportTemplate[]> {
  const response = await apiClient.get('/admin/reports/templates/by-type', {
    params: { type },
  });
  return response.data;
}

// Preview report
export async function previewReport(config: ReportConfig): Promise<{
  preview: string;
  rowCount: number;
  estimatedSize: string;
}> {
  const response = await apiClient.post('/admin/reports/preview', {
    ...config,
    dateRange: {
      startDate: config.dateRange.startDate.toISOString(),
      endDate: config.dateRange.endDate.toISOString(),
    },
  });
  return response.data;
}

// Duplicate scheduled report
export async function duplicateScheduledReport(reportId: string): Promise<{ message: string; newReportId: string }> {
  const response = await apiClient.post(`/admin/reports/scheduled/${reportId}/duplicate`);
  return response.data;
}

// Get report recipients
export async function getReportRecipients(): Promise<Array<{ email: string; name: string; role: string }>> {
  const response = await apiClient.get('/admin/reports/recipients');
  return response.data;
}