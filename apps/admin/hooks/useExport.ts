// apps/admin/src/hooks/useExport.ts
import { useState, useCallback } from 'react';

type ExportFormat = 'csv' | 'json' | 'xlsx';

interface UseExportProps<T> {
  filename?: string;
  defaultFormat?: ExportFormat;
}

interface UseExportReturn<T> {
  isExporting: boolean;
  exportData: (data: T[], format?: ExportFormat, customFilename?: string) => Promise<void>;
  error: string | null;
}

export const useExport = <T extends Record<string, any>>({
  filename = 'export',
  defaultFormat = 'csv',
}: UseExportProps<T> = {}): UseExportReturn<T> => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToCSV = useCallback((data: T[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    const csvRows = data.map((row) => {
      return headers.map((header) => {
        const value = row[header];
        
        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        }
        
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        const stringValue = String(value);
        
        // Escape commas and quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }, []);

  const convertToJSON = useCallback((data: T[]): string => {
    return JSON.stringify(data, null, 2);
  }, []);

  const downloadFile = useCallback((content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportToCSV = useCallback((data: T[], fileName: string) => {
    const csv = convertToCSV(data);
    downloadFile(csv, `${fileName}.csv`, 'text/csv;charset=utf-8;');
  }, [convertToCSV, downloadFile]);

  const exportToJSON = useCallback((data: T[], fileName: string) => {
    const json = convertToJSON(data);
    downloadFile(json, `${fileName}.json`, 'application/json;charset=utf-8;');
  }, [convertToJSON, downloadFile]);

  const exportToXLSX = useCallback(async (data: T[], fileName: string) => {
    // Basic XLSX export - in production, use a library like xlsx or exceljs
    // For now, we'll fall back to CSV with .xlsx extension
    console.warn('XLSX export not fully implemented. Using CSV format.');
    const csv = convertToCSV(data);
    downloadFile(csv, `${fileName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }, [convertToCSV, downloadFile]);

  const exportData = useCallback(async (
    data: T[],
    format: ExportFormat = defaultFormat,
    customFilename?: string
  ): Promise<void> => {
    setIsExporting(true);
    setError(null);

    try {
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = customFilename || `${filename}_${timestamp}`;

      switch (format) {
        case 'csv':
          exportToCSV(data, fileName);
          break;
        case 'json':
          exportToJSON(data, fileName);
          break;
        case 'xlsx':
          await exportToXLSX(data, fileName);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [defaultFormat, filename, exportToCSV, exportToJSON, exportToXLSX]);

  return {
    isExporting,
    exportData,
    error,
  };
};











// import { useMutation } from '@tanstack/react-query';
// import { toast } from 'sonner';

// export type ExportFormat = 'csv' | 'excel' | 'pdf';

// export interface ExportConfig {
//   data: any[];
//   filename: string;
//   format: ExportFormat;
//   columns?: string[];
//   headers?: Record<string, string>;
// }

// export function useExport() {
//   return useMutation({
//     mutationFn: async (config: ExportConfig) => {
//       const { data, filename, format, columns, headers } = config;

//       if (format === 'csv') {
//         return exportToCSV(data, filename, columns, headers);
//       } else if (format === 'excel') {
//         return exportToExcel(data, filename, columns, headers);
//       } else if (format === 'pdf') {
//         return exportToPDF(data, filename, columns, headers);
//       }

//       throw new Error('Unsupported export format');
//     },
//     onSuccess: (_, variables) => {
//       toast.success(`Data exported as ${variables.format.toUpperCase()}`);
//     },
//     onError: (error) => {
//       toast.error(error instanceof Error ? error.message : 'Failed to export data');
//     },
//   });
// }

// // CSV Export
// function exportToCSV(
//   data: any[],
//   filename: string,
//   columns?: string[],
//   headers?: Record<string, string>
// ) {
//   const cols = columns || Object.keys(data[0] || {});
//   const headerRow = cols.map((col) => (headers?.[col] || col)).join(',');
  
//   const rows = data.map((row) =>
//     cols.map((col) => {
//       const value = row[col];
//       // Escape commas and quotes
//       if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
//         return `"${value.replace(/"/g, '""')}"`;
//       }
//       return value ?? '';
//     }).join(',')
//   );

//   const csv = [headerRow, ...rows].join('\n');
//   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//   downloadBlob(blob, `${filename}.csv`);
// }

// // Excel Export (simple CSV with .xlsx extension)
// function exportToExcel(
//   data: any[],
//   filename: string,
//   columns?: string[],
//   headers?: Record<string, string>
// ) {
//   // For a real Excel export, you'd use a library like xlsx or exceljs
//   // This is a simplified version
//   exportToCSV(data, filename, columns, headers);
//   toast.info('Excel export uses CSV format. For advanced Excel features, consider using a dedicated library.');
// }

// // PDF Export (basic implementation)
// function exportToPDF(
//   data: any[],
//   filename: string,
//   columns?: string[],
//   headers?: Record<string, string>
// ) {
//   // For a real PDF export, you'd use a library like jsPDF or pdfmake
//   toast.error('PDF export requires additional library. Please use CSV or Excel format.');
//   throw new Error('PDF export not implemented');
// }

// // Helper to download blob
// function downloadBlob(blob: Blob, filename: string) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   window.URL.revokeObjectURL(url);
// }

// // Quick export hooks for common data types
// export function useQuickExport() {
//   const { mutate } = useExport();

//   return {
//     exportUsers: (users: any[], format: ExportFormat = 'csv') => {
//       mutate({
//         data: users,
//         filename: `users-export-${Date.now()}`,
//         format,
//         columns: ['id', 'name', 'email', 'role', 'verificationStatus', 'createdAt'],
//         headers: {
//           id: 'User ID',
//           name: 'Name',
//           email: 'Email',
//           role: 'Role',
//           verificationStatus: 'Verification Status',
//           createdAt: 'Created At',
//         },
//       });
//     },

//     exportProperties: (properties: any[], format: ExportFormat = 'csv') => {
//       mutate({
//         data: properties,
//         filename: `properties-export-${Date.now()}`,
//         format,
//         columns: ['id', 'title', 'city', 'state', 'price', 'status', 'createdAt'],
//         headers: {
//           id: 'Property ID',
//           title: 'Title',
//           city: 'City',
//           state: 'State',
//           price: 'Price',
//           status: 'Status',
//           createdAt: 'Created At',
//         },
//       });
//     },

//     exportTransactions: (transactions: any[], format: ExportFormat = 'csv') => {
//       mutate({
//         data: transactions,
//         filename: `transactions-export-${Date.now()}`,
//         format,
//         columns: ['id', 'amount', 'status', 'paymentType', 'paidAt', 'userId'],
//         headers: {
//           id: 'Transaction ID',
//           amount: 'Amount',
//           status: 'Status',
//           paymentType: 'Payment Type',
//           paidAt: 'Paid At',
//           userId: 'User ID',
//         },
//       });
//     },

//     exportAgents: (agents: any[], format: ExportFormat = 'csv') => {
//       mutate({
//         data: agents,
//         filename: `agents-export-${Date.now()}`,
//         format,
//         columns: [
//           'id',
//           'name',
//           'email',
//           'totalMarkingJobs',
//           'completedMarkingJobs',
//           'agentReliabilityScore',
//         ],
//         headers: {
//           id: 'Agent ID',
//           name: 'Name',
//           email: 'Email',
//           totalMarkingJobs: 'Total Jobs',
//           completedMarkingJobs: 'Completed Jobs',
//           agentReliabilityScore: 'Reliability Score',
//         },
//       });
//     },
//   };
// }