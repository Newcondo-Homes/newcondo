/**
 * Export Helper Utility
 * Handles exporting data to various formats (CSV, PDF)
 * Location: backend/shared/src/utils/exportHelper.ts
 */

import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { formatDateUtil, formatDateTime } from './formatting'

interface ExportColumn {
  label: string;
  key: string;
  format?: (value: any) => string;
}

interface PDFOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'LETTER';
  footer?: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: any[], columns: ExportColumn[]): string => {
  try {
    // Transform data based on column definitions
    const transformedData = data.map((item) => {
      const row: any = {};
      columns.forEach((col) => {
        const value = item[col.key];
        row[col.label] = col.format ? col.format(value) : value;
      });
      return row;
    });

    // Create CSV parser
    const fields = columns.map((col) => col.label);
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transformedData);

    return csv;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export data to CSV');
  }
};

/**
 * Export data to CSV and return as buffer
 */
export const exportToCSVBuffer = (
  data: any[],
  columns: ExportColumn[]
): Buffer => {
  const csv = exportToCSV(data, columns);
  return Buffer.from(csv, 'utf-8');
};

/**
 * Create a PDF document with table data
 */
export const exportToPDF = async (
  tableData: TableData,
  options: PDFOptions
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: options.pageSize || 'A4',
        layout: options.orientation || 'portrait',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add title
      doc.fontSize(20).text(options.title, { align: 'center' });
      doc.moveDown(0.5);

      // Add subtitle if provided
      if (options.subtitle) {
        doc.fontSize(12).text(options.subtitle, { align: 'center' });
        doc.moveDown(1);
      }

      // Add generation date
      doc
        .fontSize(10)
        .text(`Generated on: ${new Date().toLocaleString()}`, {
          align: 'right',
        });
      doc.moveDown(1);

      // Calculate column widths
      const pageWidth = doc.page.width - 100; // Account for margins
      const columnWidth = pageWidth / tableData.headers.length;

      // Draw table headers
      let yPosition = doc.y;
      doc.fontSize(10).fillColor('black');

      tableData.headers.forEach((header, i) => {
        doc.text(header, 50 + i * columnWidth, yPosition, {
          width: columnWidth,
          align: 'left',
        });
      });

      // Draw header underline
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(doc.page.width - 50, yPosition).stroke();
      yPosition += 10;

      // Draw table rows
      tableData.rows.forEach((row) => {
        // Check if we need a new page
        if (yPosition > doc.page.height - 100) {
          doc.addPage();
          yPosition = 50;

          // Redraw headers on new page
          tableData.headers.forEach((header, i) => {
            doc.text(header, 50 + i * columnWidth, yPosition, {
              width: columnWidth,
              align: 'left',
            });
          });
          yPosition += 20;
          doc
            .moveTo(50, yPosition)
            .lineTo(doc.page.width - 50, yPosition)
            .stroke();
          yPosition += 10;
        }

        row.forEach((cell, i) => {
          doc.text(String(cell), 50 + i * columnWidth, yPosition, {
            width: columnWidth,
            align: 'left',
          });
        });

        yPosition += 20;
      });

      // Add footer if provided
      if (options.footer) {
        doc
          .fontSize(8)
          .text(options.footer, 50, doc.page.height - 50, {
            align: 'center',
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Convert data array to table format for PDF export
 */
export const dataToTableFormat = (
  data: any[],
  columns: ExportColumn[]
): TableData => {
  const headers = columns.map((col) => col.label);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      return col.format ? col.format(value) : String(value ?? '');
    })
  );

  return { headers, rows };
};

/**
 * Generate filename with timestamp
 */
export const generateFilename = (
  baseName: string,
  extension: 'csv' | 'pdf'
): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${baseName}_${timestamp}.${extension}`;
};

/**
 * Format currency for exports
 */
export const exportFormatCurrency = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Sanitize data for export (remove sensitive fields)
 */
export const sanitizeExportData = <T extends Record<string, any>>(
  data: T[],
  excludeFields: string[] = []
): Partial<T>[] => {
  const defaultExclude = ['passwordHash', 'refreshToken', 'token'];
  const fieldsToExclude = [...defaultExclude, ...excludeFields];

  return data.map((item) => {
    const sanitized: any = { ...item };
    fieldsToExclude.forEach((field) => {
      delete sanitized[field];
    });
    return sanitized;
  });
};

/**
 * Create CSV stream for large datasets
 */
export const createCSVStream = (
  columns: ExportColumn[]
): { write: (data: any) => void; end: () => void; stream: Readable } => {
  const parser = new Parser({
    fields: columns.map((col) => col.label),
  });

  const stream = new Readable({
    read() {},
  });

  let isFirstWrite = true;

  return {
    write: (data: any) => {
      const transformedData = columns.reduce((acc, col) => {
        const value = data[col.key];
        acc[col.label] = col.format ? col.format(value) : value;
        return acc;
      }, {} as any);

      const csv = parser.parse([transformedData]);
      
      // Only include header on first write
      if (isFirstWrite) {
        stream.push(csv + '\n');
        isFirstWrite = false;
      } else {
        // Skip header line for subsequent writes
        const lines = csv.split('\n');
        stream.push(lines.slice(1).join('\n') + '\n');
      }
    },
    end: () => {
      stream.push(null);
    },
    stream,
  };
};

export default {
  exportToCSV,
  exportToCSVBuffer,
  exportToPDF,
  dataToTableFormat,
  generateFilename,
  exportFormatCurrency,
  formatDateUtil,
  formatDateTime,
  sanitizeExportData,
  createCSVStream,
};