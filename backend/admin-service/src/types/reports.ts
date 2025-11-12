export interface ReportGenerationParams {
  data: any;
  format: 'pdf' | 'excel' | 'csv';
  reportType: string;
  dateRange: {
    startDate?: Date;
    endDate?: Date;
  };
}

export interface GeneratedReport {
  filename: string;
  mimeType: string;
  data: Buffer | string;
  size: number;
  generatedAt: Date;
}

export interface ReportMetadata {
  title: string;
  description: string;
  generatedBy: string;
  generatedAt: Date;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  parameters?: Record<string, any>;
}

export interface CSVReport {
  headers: string[];
  rows: any[][];
  metadata: ReportMetadata;
}

export interface PDFReport {
  content: any[];
  styles: Record<string, any>;
  metadata: ReportMetadata;
}

export interface ExcelReport {
  sheets: {
    name: string;
    data: any[][];
    headers: string[];
  }[];
  metadata: ReportMetadata;
}

export interface ReportTemplate {
  type: string;
  name: string;
  description: string;
  format: 'pdf' | 'excel' | 'csv';
  dataSource: string;
  columns: {
    field: string;
    header: string;
    type: 'string' | 'number' | 'date' | 'currency';
    format?: string;
  }[];
}

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  format: 'pdf' | 'excel' | 'csv';
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
}

export interface ReportExport {
  reportId: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }[];
  };
}

export interface TableData {
  headers: string[];
  rows: any[][];
  totals?: any[];
  summary?: Record<string, any>;
}

export interface ReportSection {
  title: string;
  type: 'text' | 'table' | 'chart' | 'summary';
  content: string | TableData | ChartData | Record<string, any>;
}

export interface ComprehensiveReport {
  title: string;
  subtitle?: string;
  metadata: ReportMetadata;
  sections: ReportSection[];
  summary?: Record<string, any>;
}