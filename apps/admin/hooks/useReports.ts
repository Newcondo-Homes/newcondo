import { useQuery, useMutation } from '@tanstack/react-query';
import {
  generateReport,
  getReportTemplates,
  getScheduledReports,
  scheduleReport,
  cancelScheduledReport,
  getReportHistory,
  downloadReport,
} from '@/lib/api/reports';
import type { ReportConfig, DateRange } from '@/types/report';
import { toast } from 'sonner';

export function useGenerateReport() {
  return useMutation({
    mutationFn: (config: ReportConfig) => generateReport(config),
    onSuccess: (data) => {
      toast.success('Report generated successfully');
      
      // Trigger download if report is ready
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    },
  });
}

export function useReportTemplates() {
  return useQuery({
    queryKey: ['reports', 'templates'],
    queryFn: getReportTemplates,
    staleTime: 3600000, // 1 hour
  });
}

export function useScheduledReports() {
  return useQuery({
    queryKey: ['reports', 'scheduled'],
    queryFn: getScheduledReports,
  });
}

export function useScheduleReport() {
  return useMutation({
    mutationFn: (config: ReportConfig & { schedule: string }) => scheduleReport(config),
    onSuccess: () => {
      toast.success('Report scheduled successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to schedule report');
    },
  });
}

export function useCancelScheduledReport() {
  return useMutation({
    mutationFn: (reportId: string) => cancelScheduledReport(reportId),
    onSuccess: () => {
      toast.success('Scheduled report cancelled');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel scheduled report');
    },
  });
}

export function useReportHistory(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['reports', 'history', page, pageSize],
    queryFn: () => getReportHistory(page, pageSize),
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (reportId: string) => downloadReport(reportId),
    onSuccess: (data, reportId) => {
      toast.success('Report downloaded');
      
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}-${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to download report');
    },
  });
}

// Predefined report types
export function useUserReport(dateRange: DateRange) {
  const { mutate, ...rest } = useGenerateReport();

  const generateUserReport = () => {
    mutate({
      type: 'USER_REPORT',
      dateRange,
      format: 'pdf',
      includeCharts: true,
    });
  };

  return { generateUserReport, ...rest };
}

export function useRevenueReport(dateRange: DateRange) {
  const { mutate, ...rest } = useGenerateReport();

  const generateRevenueReport = () => {
    mutate({
      type: 'REVENUE_REPORT',
      dateRange,
      format: 'pdf',
      includeCharts: true,
    });
  };

  return { generateRevenueReport, ...rest };
}

export function usePropertyReport(dateRange: DateRange) {
  const { mutate, ...rest } = useGenerateReport();

  const generatePropertyReport = () => {
    mutate({
      type: 'PROPERTY_REPORT',
      dateRange,
      format: 'pdf',
      includeCharts: true,
    });
  };

  return { generatePropertyReport, ...rest };
}

export function useAgentReport(dateRange: DateRange) {
  const { mutate, ...rest } = useGenerateReport();

  const generateAgentReport = () => {
    mutate({
      type: 'AGENT_REPORT',
      dateRange,
      format: 'pdf',
      includeCharts: true,
    });
  };

  return { generateAgentReport, ...rest };
}

export function useTransactionReport(dateRange: DateRange) {
  const { mutate, ...rest } = useGenerateReport();

  const generateTransactionReport = () => {
    mutate({
      type: 'TRANSACTION_REPORT',
      dateRange,
      format: 'pdf',
      includeCharts: true,
    });
  };

  return { generateTransactionReport, ...rest };
}