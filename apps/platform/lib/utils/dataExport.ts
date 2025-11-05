/**
 * Data Export Utility
 * Handles exporting data to various formats (CSV, XLSX, JSON, PDF)
 */

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any) => string;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filename: string;
  columns?: ExportColumn[];
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): string {
  if (data.length === 0) {
    throw new Error('No data to export');
  }
  
  const columns = options.columns || generateColumnsFromData(data[0]);
  const rows: string[] = [];
  
  // Add headers
  if (options.includeHeaders !== false) {
    rows.push(columns.map(col => escapeCSV(col.label)).join(','));
  }
  
  // Add data rows
  data.forEach(item => {
    const row = columns.map(col => {
      const value = item[col.key];
      const formatted = col.formatter ? col.formatter(value) : formatValue(value);
      return escapeCSV(formatted);
    });
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): string {
  const columns = options.columns;
  
  if (columns) {
    // Export only specified columns
    const filtered = data.map(item => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        obj[col.key] = col.formatter 
          ? col.formatter(item[col.key]) 
          : item[col.key];
      });
      return obj;
    });
    return JSON.stringify(filtered, null, 2);
  }
  
  return JSON.stringify(data, null, 2);
}

/**
 * Prepare data for XLSX export (returns structured data)
 */
export function prepareForXLSX<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): {
  headers: string[];
  rows: any[][];
} {
  if (data.length === 0) {
    return { headers: [], rows: [] };
  }
  
  const columns = options.columns || generateColumnsFromData(data[0]);
  const headers = columns.map(col => col.label);
  
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      return col.formatter ? col.formatter(value) : value;
    })
  );
  
  return { headers, rows };
}

/**
 * Generate download for exported data
 */
export function downloadExport(content: string, options: ExportOptions): void {
  const blob = new Blob([content], {
    type: getMimeType(options.format),
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.filename}.${options.format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get MIME type for format
 */
function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    csv: 'text/csv;charset=utf-8;',
    json: 'application/json',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
  };
  return mimeTypes[format] || 'text/plain';
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Escape if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Format value for export
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Generate columns from data object
 */
function generateColumnsFromData<T extends Record<string, any>>(
  data: T
): ExportColumn[] {
  return Object.keys(data).map(key => ({
    key,
    label: formatColumnLabel(key),
  }));
}

/**
 * Format column label (convert camelCase to Title Case)
 */
function formatColumnLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Export properties data
 */
export function exportPropertiesData(
  properties: any[],
  format: 'csv' | 'xlsx' | 'json',
  includeUnits: boolean = false
): string | { headers: string[]; rows: any[][] } {
  const columns: ExportColumn[] = [
    { key: 'id', label: 'Property ID' },
    { key: 'title', label: 'Title' },
    { key: 'propertyType', label: 'Type' },
    { key: 'structure', label: 'Structure' },
    { key: 'price', label: 'Price', formatter: (v) => formatCurrency(v) },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'status', label: 'Status' },
    { key: 'bedrooms', label: 'Bedrooms' },
    { key: 'bathrooms', label: 'Bathrooms' },
    { key: 'isAvailable', label: 'Available', formatter: (v) => v ? 'Yes' : 'No' },
    { key: 'viewCount', label: 'Views' },
    { key: 'createdAt', label: 'Created', formatter: (v) => formatDate(v) },
  ];
  
  if (includeUnits) {
    columns.push(
      { key: 'totalUnits', label: 'Total Units' },
      { key: 'availableUnits', label: 'Available Units' }
    );
  }
  
  const options: ExportOptions = {
    format,
    filename: `properties-${Date.now()}`,
    columns,
  };
  
  if (format === 'xlsx') {
    return prepareForXLSX(properties, options);
  }
  
  if (format === 'json') {
    return exportToJSON(properties, options);
  }
  
  return exportToCSV(properties, options);
}

/**
 * Export commission earnings data
 */
export function exportCommissionData(
  earnings: any[],
  format: 'csv' | 'xlsx' | 'json'
): string | { headers: string[]; rows: any[][] } {
  const columns: ExportColumn[] = [
    { key: 'id', label: 'Transaction ID' },
    { key: 'propertyTitle', label: 'Property' },
    { key: 'rentAmount', label: 'Rent Amount', formatter: (v) => formatCurrency(v) },
    { key: 'commission', label: 'Commission', formatter: (v) => formatCurrency(v) },
    { key: 'status', label: 'Status' },
    { key: 'paymentDate', label: 'Date', formatter: (v) => formatDate(v) },
    { key: 'releasedAt', label: 'Released', formatter: (v) => v ? formatDate(v) : 'Pending' },
  ];
  
  const options: ExportOptions = {
    format,
    filename: `commission-earnings-${Date.now()}`,
    columns,
  };
  
  if (format === 'xlsx') {
    return prepareForXLSX(earnings, options);
  }
  
  if (format === 'json') {
    return exportToJSON(earnings, options);
  }
  
  return exportToCSV(earnings, options);
}

/**
 * Helper: Format currency
 */
function formatCurrency(value: any): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(num);
}

/**
 * Helper: Format date
 */
function formatDate(value: any): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}