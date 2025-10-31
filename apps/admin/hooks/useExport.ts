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