/**
 * Export Helper Utility
 * Handles exporting data to various formats (CSV, PDF)
 * Location: backend/shared/src/utils/exportHelper.ts
 */
import { Readable } from 'stream';
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
export declare const exportToCSV: (data: any[], columns: ExportColumn[]) => string;
/**
 * Export data to CSV and return as buffer
 */
export declare const exportToCSVBuffer: (data: any[], columns: ExportColumn[]) => Buffer;
/**
 * Create a PDF document with table data
 */
export declare const exportToPDF: (tableData: TableData, options: PDFOptions) => Promise<Buffer>;
/**
 * Convert data array to table format for PDF export
 */
export declare const dataToTableFormat: (data: any[], columns: ExportColumn[]) => TableData;
/**
 * Generate filename with timestamp
 */
export declare const generateFilename: (baseName: string, extension: "csv" | "pdf") => string;
/**
 * Format currency for exports
 */
export declare const exportFormatCurrency: (amount: number, currency?: string) => string;
/**
 * Sanitize data for export (remove sensitive fields)
 */
export declare const sanitizeExportData: <T extends Record<string, any>>(data: T[], excludeFields?: string[]) => Partial<T>[];
/**
 * Create CSV stream for large datasets
 */
export declare const createCSVStream: (columns: ExportColumn[]) => {
    write: (data: any) => void;
    end: () => void;
    stream: Readable;
};
declare const _default: {
    exportToCSV: (data: any[], columns: ExportColumn[]) => string;
    exportToCSVBuffer: (data: any[], columns: ExportColumn[]) => Buffer;
    exportToPDF: (tableData: TableData, options: PDFOptions) => Promise<Buffer>;
    dataToTableFormat: (data: any[], columns: ExportColumn[]) => TableData;
    generateFilename: (baseName: string, extension: "csv" | "pdf") => string;
    exportFormatCurrency: (amount: number, currency?: string) => string;
    formatDateUtil: (date: Date | string, locale?: import("..").SupportedLocale, options?: Intl.DateTimeFormatOptions) => string;
    formatDateTime: (date: Date | string, locale?: import("..").SupportedLocale, options?: Intl.DateTimeFormatOptions) => string;
    sanitizeExportData: <T extends Record<string, any>>(data: T[], excludeFields?: string[]) => Partial<T>[];
    createCSVStream: (columns: ExportColumn[]) => {
        write: (data: any) => void;
        end: () => void;
        stream: Readable;
    };
};
export default _default;
//# sourceMappingURL=exportHelper.d.ts.map