// apps/admin/src/lib/utils/exportUtils.ts

import { formatDate, formatCurrency } from './format';
import { downloadFile } from './helpers';

/**
 * Export utilities for data exports (CSV, JSON, etc.)
 */

/**
 * Convert array of objects to CSV
 */
export const arrayToCSV = <T extends Record<string, any>>(
  data: T[],
  options?: {
    headers?: string[];
    delimiter?: string;
    includeHeaders?: boolean;
  }
): string => {
  const { headers, delimiter = ',', includeHeaders = true } = options || {};

  if (data.length === 0) return '';

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV header row
  const headerRow = includeHeaders
    ? csvHeaders.map(h => escapeCSVValue(h)).join(delimiter) + '\n'
    : '';

  // Create CSV data rows
  const dataRows = data
    .map(row => {
      return csvHeaders
        .map(header => {
          const value = row[header];
          return escapeCSVValue(formatCSVValue(value));
        })
        .join(delimiter);
    })
    .join('\n');

  return headerRow + dataRows;
};

/**
 * Escape CSV value
 */
const escapeCSVValue = (value: any): string => {
  const stringValue = String(value ?? '');
  
  // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Format value for CSV export
 */
const formatCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (value instanceof Date) {
    return formatDate(value, 'datetime');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
};

/**
 * Export data to CSV file
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  options?: {
    headers?: string[];
    delimiter?: string;
  }
): void => {
  const csv = arrayToCSV(data, options);
  const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  downloadFile(csv, csvFilename, 'text/csv');
};

/**
 * Export data to JSON file
 */
export const exportToJSON = <T>(
  data: T,
  filename: string,
  pretty: boolean = true
): void => {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
  downloadFile(json, jsonFilename, 'application/json');
};

/**
 * Export users data
 */
export const exportUsers = (
  users: any[],
  format: 'csv' | 'json' = 'csv'
): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `users_export_${timestamp}`;

  if (format === 'csv') {
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'User Type',
      'Verification Status',
      'Premium',
      'Created At',
    ];

    const data = users.map(user => ({
      'ID': user.id,
      'Name': user.name || '-',
      'Email': user.email,
      'Phone': user.phone || '-',
      'Role': user.role,
      'User Type': user.userType || '-',
      'Verification Status': user.verificationStatus,
      'Premium': user.isPremium ? 'Yes' : 'No',
      'Created At': formatDate(user.createdAt, 'datetime'),
    }));

    exportToCSV(data, filename, { headers });
  } else {
    exportToJSON(users, filename);
  }
};

/**
 * Export properties data
 */
export const exportProperties = (
  properties: any[],
  format: 'csv' | 'json' = 'csv'
): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `properties_export_${timestamp}`;

  if (format === 'csv') {
    const headers = [
      'ID',
      'Title',
      'Type',
      'Structure',
      'Price',
      'City',
      'State',
      'Status',
      'Approval Status',
      'Boundary Verified',
      'Owner',
      'Created At',
    ];

    const data = properties.map(property => ({
      'ID': property.id,
      'Title': property.title,
      'Type': property.propertyType,
      'Structure': property.structure,
      'Price': property.price ? formatCurrency(property.price) : '-',
      'City': property.city,
      'State': property.state,
      'Status': property.status,
      'Approval Status': property.adminApprovalStatus,
      'Boundary Verified': property.boundaryVerified ? 'Yes' : 'No',
      'Owner': property.owner?.name || '-',
      'Created At': formatDate(property.createdAt, 'datetime'),
    }));

    exportToCSV(data, filename, { headers });
  } else {
    exportToJSON(properties, filename);
  }
};

/**
 * Export payments data
 */
export const exportPayments = (
  payments: any[],
  format: 'csv' | 'json' = 'csv'
): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `payments_export_${timestamp}`;

  if (format === 'csv') {
    const headers = [
      'ID',
      'User',
      'Type',
      'Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Transaction ID',
      'Created At',
      'Paid At',
    ];

    const data = payments.map(payment => ({
      'ID': payment.id,
      'User': payment.user?.name || payment.user?.email || '-',
      'Type': payment.paymentType,
      'Amount': formatCurrency(payment.amount),
      'Currency': payment.currency,
      'Status': payment.status,
      'Payment Method': payment.paymentMethod || '-',
      'Transaction ID': payment.transactionId || '-',
      'Created At': formatDate(payment.createdAt, 'datetime'),
      'Paid At': payment.paidAt ? formatDate(payment.paidAt, 'datetime') : '-',
    }));

    exportToCSV(data, filename, { headers });
  } else {
    exportToJSON(payments, filename);
  }
};

/**
 * Export marking jobs data
 */
export const exportMarkingJobs = (
  jobs: any[],
  format: 'csv' | 'json' = 'csv'
): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `marking_jobs_export_${timestamp}`;

  if (format === 'csv') {
    const headers = [
      'ID',
      'Property',
      'Requester',
      'Assigned Agent',
      'Status',
      'Urgency',
      'Marking Fee',
      'Queue Position',
      'Created At',
      'Completed At',
    ];

    const data = jobs.map(job => ({
      'ID': job.id,
      'Property': job.property?.title || '-',
      'Requester': job.requestingUser?.name || '-',
      'Assigned Agent': job.assignedAgent?.name || '-',
      'Status': job.status,
      'Urgency': job.urgencyLevel,
      'Marking Fee': formatCurrency(job.markingFee),
      'Queue Position': job.queuePosition || '-',
      'Created At': formatDate(job.createdAt, 'datetime'),
      'Completed At': job.completedAt ? formatDate(job.completedAt, 'datetime') : '-',
    }));

    exportToCSV(data, filename, { headers });
  } else {
    exportToJSON(jobs, filename);
  }
};

/**
 * Export support tickets data
 */
export const exportSupportTickets = (
  tickets: any[],
  format: 'csv' | 'json' = 'csv'
): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `support_tickets_export_${timestamp}`;

  if (format === 'csv') {
    const headers = [
      'ID',
      'User',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Created At',
      'Resolved At',
    ];

    const data = tickets.map(ticket => ({
      'ID': ticket.id,
      'User': ticket.user?.name || ticket.user?.email || '-',
      'Title': ticket.title,
      'Category': ticket.category,
      'Priority': ticket.priority,
      'Status': ticket.status,
      'Created At': formatDate(ticket.createdAt, 'datetime'),
      'Resolved At': ticket.resolvedAt ? formatDate(ticket.resolvedAt, 'datetime') : '-',
    }));

    exportToCSV(data, filename, { headers });
  } else {
    exportToJSON(tickets, filename);
  }
};

/**
 * Export analytics report
 */
export const exportAnalyticsReport = (
  data: {
    summary: any;
    users: any;
    properties: any;
    payments: any;
    markingJobs: any;
  },
  period: string
): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `analytics_report_${period}_${timestamp}`;

  exportToJSON(data, filename, true);
};

/**
 * Generate export filename with timestamp
 */
export const generateExportFilename = (
  prefix: string,
  format: 'csv' | 'json' | 'pdf' = 'csv'
): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.${format}`;
};

/**
 * Validate export data before export
 */
export const validateExportData = (data: any[]): { valid: boolean; error?: string } => {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Data must be an array' };
  }

  if (data.length === 0) {
    return { valid: false, error: 'No data to export' };
  }

  return { valid: true };
};

/**
 * Format export summary
 */
export const formatExportSummary = (
  totalRecords: number,
  format: string,
  filename: string
): string => {
  return `Exported ${totalRecords} record(s) as ${format.toUpperCase()} to ${filename}`;
};