"use strict";
/**
 * Export Helper Utility
 * Handles exporting data to various formats (CSV, PDF)
 * Location: backend/shared/src/utils/exportHelper.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCSVStream = exports.sanitizeExportData = exports.exportFormatCurrency = exports.generateFilename = exports.dataToTableFormat = exports.exportToPDF = exports.exportToCSVBuffer = exports.exportToCSV = void 0;
const json2csv_1 = require("json2csv");
const pdfkit_1 = __importDefault(require("pdfkit"));
const stream_1 = require("stream");
const formatting_1 = require("./formatting");
/**
 * Export data to CSV format
 */
const exportToCSV = (data, columns) => {
    try {
        // Transform data based on column definitions
        const transformedData = data.map((item) => {
            const row = {};
            columns.forEach((col) => {
                const value = item[col.key];
                row[col.label] = col.format ? col.format(value) : value;
            });
            return row;
        });
        // Create CSV parser
        const fields = columns.map((col) => col.label);
        const json2csvParser = new json2csv_1.Parser({ fields });
        const csv = json2csvParser.parse(transformedData);
        return csv;
    }
    catch (error) {
        console.error('Error exporting to CSV:', error);
        throw new Error('Failed to export data to CSV');
    }
};
exports.exportToCSV = exportToCSV;
/**
 * Export data to CSV and return as buffer
 */
const exportToCSVBuffer = (data, columns) => {
    const csv = (0, exports.exportToCSV)(data, columns);
    return Buffer.from(csv, 'utf-8');
};
exports.exportToCSVBuffer = exportToCSVBuffer;
/**
 * Create a PDF document with table data
 */
const exportToPDF = async (tableData, options) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                size: options.pageSize || 'A4',
                layout: options.orientation || 'portrait',
                margin: 50,
            });
            const chunks = [];
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
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.exportToPDF = exportToPDF;
/**
 * Convert data array to table format for PDF export
 */
const dataToTableFormat = (data, columns) => {
    const headers = columns.map((col) => col.label);
    const rows = data.map((item) => columns.map((col) => {
        const value = item[col.key];
        return col.format ? col.format(value) : String(value ?? '');
    }));
    return { headers, rows };
};
exports.dataToTableFormat = dataToTableFormat;
/**
 * Generate filename with timestamp
 */
const generateFilename = (baseName, extension) => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${baseName}_${timestamp}.${extension}`;
};
exports.generateFilename = generateFilename;
/**
 * Format currency for exports
 */
const exportFormatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.exportFormatCurrency = exportFormatCurrency;
/**
 * Sanitize data for export (remove sensitive fields)
 */
const sanitizeExportData = (data, excludeFields = []) => {
    const defaultExclude = ['passwordHash', 'refreshToken', 'token'];
    const fieldsToExclude = [...defaultExclude, ...excludeFields];
    return data.map((item) => {
        const sanitized = { ...item };
        fieldsToExclude.forEach((field) => {
            delete sanitized[field];
        });
        return sanitized;
    });
};
exports.sanitizeExportData = sanitizeExportData;
/**
 * Create CSV stream for large datasets
 */
const createCSVStream = (columns) => {
    const parser = new json2csv_1.Parser({
        fields: columns.map((col) => col.label),
    });
    const stream = new stream_1.Readable({
        read() { },
    });
    let isFirstWrite = true;
    return {
        write: (data) => {
            const transformedData = columns.reduce((acc, col) => {
                const value = data[col.key];
                acc[col.label] = col.format ? col.format(value) : value;
                return acc;
            }, {});
            const csv = parser.parse([transformedData]);
            // Only include header on first write
            if (isFirstWrite) {
                stream.push(csv + '\n');
                isFirstWrite = false;
            }
            else {
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
exports.createCSVStream = createCSVStream;
exports.default = {
    exportToCSV: exports.exportToCSV,
    exportToCSVBuffer: exports.exportToCSVBuffer,
    exportToPDF: exports.exportToPDF,
    dataToTableFormat: exports.dataToTableFormat,
    generateFilename: exports.generateFilename,
    exportFormatCurrency: exports.exportFormatCurrency,
    formatDateUtil: formatting_1.formatDateUtil,
    formatDateTime: formatting_1.formatDateTime,
    sanitizeExportData: exports.sanitizeExportData,
    createCSVStream: exports.createCSVStream,
};
//# sourceMappingURL=exportHelper.js.map