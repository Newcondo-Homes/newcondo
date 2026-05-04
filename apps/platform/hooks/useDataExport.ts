// apps/platform/hooks/useDataExport.ts
'use client'

import { useState } from 'react';
import { toast } from '@newcondo/ui';

export type ExportFormat = 'csv' | 'pdf' | 'json' | 'xlsx';

export interface ExportOptions {
  filename?: string;
  format: ExportFormat;
  data: any[];
  headers?: string[];
  title?: string;
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
    try {
      // Get headers from first object if not provided
      const csvHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);
      
      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...data.map(row =>
          csvHeaders.map(header => {
            const value = row[header];
            // Handle values with commas or quotes
            const stringValue = String(value || '');
            return stringValue.includes(',') || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('CSV export error:', error);
      return false;
    }
  };

  const exportToJSON = (data: any[], filename: string) => {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('JSON export error:', error);
      return false;
    }
  };

  const exportToPDF = async (data: any[], filename: string, title?: string) => {
    try {
      // This is a placeholder - would need to integrate with a PDF library
      // like jsPDF or pdfmake for actual PDF generation
      toast('Coming Soon',{
        description: 'PDF export will be available in the next update',
      });
      return false;
    } catch (error) {
      console.error('PDF export error:', error);
      return false;
    }
  };

  const exportData = async (options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      const filename = options.filename || `export_${Date.now()}`;
      let success = false;

      switch (options.format) {
        case 'csv':
          success = exportToCSV(options.data, filename, options.headers);
          break;
        case 'json':
          success = exportToJSON(options.data, filename);
          break;
        case 'pdf':
          success = await exportToPDF(options.data, filename, options.title);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      if (success) {
        toast.success('Success',{
          description: `Data exported successfully as ${options.format.toUpperCase()}`,
        });
      } else {
        throw new Error('Export failed');
      }

      return success;
    } catch (error: any) {
      toast.error('Export Failed',{
        description: error.message || 'Failed to export data',
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    exportToCSV,
    exportToJSON,
    exportToPDF,
    isExporting,
  };
};

// Helper hook for exporting property data
export const usePropertyDataExport = () => {
  const { exportData, isExporting } = useDataExport();

  const exportProperties = (properties: any[], format: ExportFormat = 'csv') => {
    const formattedData = properties.map(property => ({
      Title: property.title,
      Type: property.propertyType,
      Price: property.price,
      City: property.city,
      State: property.state,
      Bedrooms: property.bedrooms,
      Bathrooms: property.bathrooms,
      Status: property.status,
      Views: property.viewCount,
      'Created At': new Date(property.createdAt).toLocaleDateString(),
    }));

    return exportData({
      data: formattedData,
      format,
      filename: `properties_${Date.now()}`,
      title: 'Property Listings',
    });
  };

  return {
    exportProperties,
    isExporting,
  };
};

// Helper hook for exporting earnings data
export const useEarningsDataExport = () => {
  const { exportData, isExporting } = useDataExport();

  const exportEarnings = (earnings: any[], format: ExportFormat = 'csv') => {
    const formattedData = earnings.map(earning => ({
      Date: new Date(earning.createdAt).toLocaleDateString(),
      Type: earning.type,
      Amount: earning.amount,
      Status: earning.status,
      Property: earning.propertyTitle || 'N/A',
      Description: earning.description || '',
    }));

    return exportData({
      data: formattedData,
      format,
      filename: `earnings_${Date.now()}`,
      title: 'Earnings Report',
    });
  };

  return {
    exportEarnings,
    isExporting,
  };
};