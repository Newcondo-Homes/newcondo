// apps/admin/src/lib/utils/exportToCsv.ts

/**
 * Convert data to CSV format
 */
export const convertToCSV = (
  data: Record<string, any>[],
  headers?: string[]
): string => {
  if (data.length === 0) return '';

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders
      .map(header => {
        const value = row[header];
        
        // Handle different data types
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        
        // Escape quotes and wrap in quotes if contains comma or newline
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      })
      .join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (
  data: Record<string, any>[],
  filename: string,
  headers?: string[]
): void => {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Export table data to CSV
 */
export const exportTableToCSV = (
  tableId: string,
  filename: string
): void => {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error(`Table with id "${tableId}" not found`);
    return;
  }
  
  const rows = table.querySelectorAll('tr');
  const data: string[][] = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('th, td');
    const rowData: string[] = [];
    
    cells.forEach(cell => {
      let text = cell.textContent?.trim() || '';
      
      // Escape quotes and wrap in quotes if needed
      if (text.includes(',') || text.includes('\n') || text.includes('"')) {
        text = `"${text.replace(/"/g, '""')}"`;
      }
      
      rowData.push(text);
    });
    
    data.push(rowData);
  });
  
  const csv = data.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Export chart data to CSV
 */
export const exportChartToCSV = (
  chartData: Record<string, any>[],
  filename: string,
  xAxisKey: string,
  yAxisKeys: string[]
): void => {
  const headers = [xAxisKey, ...yAxisKeys];
  downloadCSV(chartData, filename, headers);
};

/**
 * Export analytics report to CSV
 */
export const exportAnalyticsReportToCSV = (
  reportData: {
    summary: Record<string, any>;
    details: Record<string, any>[];
  },
  filename: string
): void => {
  // Create summary section
  const summaryRows = Object.entries(reportData.summary).map(([key, value]) => ({
    Metric: key,
    Value: value,
  }));
  
  // Add separator
  const separator = [{ Metric: '---', Value: '---' }];
  
  // Combine summary and details
  const combinedData = [...summaryRows, ...separator, ...reportData.details];
  
  downloadCSV(combinedData, filename);
};

/**
 * Format data for CSV export
 */
export const formatDataForCSV = (
  data: Record<string, any>[],
  formatters?: Record<string, (value: any) => string>
): Record<string, any>[] => {
  if (!formatters) return data;
  
  return data.map(row => {
    const formatted: Record<string, any> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      if (formatters[key]) {
        formatted[key] = formatters[key](value);
      } else {
        formatted[key] = value;
      }
    });
    
    return formatted;
  });
};

/**
 * Export filtered data to CSV
 */
export const exportFilteredDataToCSV = (
  data: Record<string, any>[],
  filters: Record<string, any>,
  filename: string
): void => {
  const filteredData = data.filter(row => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') return true;
      return row[key] === value;
    });
  });
  
  downloadCSV(filteredData, filename);
};

/**
 * Export with custom column mapping
 */
export const exportWithColumnMapping = (
  data: Record<string, any>[],
  columnMapping: Record<string, string>,
  filename: string
): void => {
  const mappedData = data.map(row => {
    const mapped: Record<string, any> = {};
    
    Object.entries(columnMapping).forEach(([originalKey, newKey]) => {
      mapped[newKey] = row[originalKey];
    });
    
    return mapped;
  });
  
  downloadCSV(mappedData, filename);
};

/**
 * Batch export multiple datasets
 */
export const batchExportToCSV = (
  datasets: Array<{
    data: Record<string, any>[];
    filename: string;
    headers?: string[];
  }>
): void => {
  datasets.forEach(({ data, filename, headers }) => {
    setTimeout(() => {
      downloadCSV(data, filename, headers);
    }, 100);
  });
};

/**
 * Export with date range in filename
 */
export const exportWithDateRange = (
  data: Record<string, any>[],
  baseFilename: string,
  startDate: Date,
  endDate: Date
): void => {
  const dateStr = `${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`;
  const filename = `${baseFilename}_${dateStr}`;
  downloadCSV(data, filename);
};