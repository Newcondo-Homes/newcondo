// apps/platform/components/analytics/AnalyticsExport.tsx
'use client';

import { useState } from 'react';
import { Button } from '@newcondo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@newcondo/ui/components/dropdown-menu';
import { Download, FileText, Sheet, Image } from 'lucide-react';
import { toast } from '@newcondo/ui/';


interface AnalyticsExportProps {
  propertyId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  disabled?: boolean;
}

export function AnalyticsExport({
  propertyId,
  dateRange,
  disabled,
}: AnalyticsExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf' | 'png') => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (dateRange) {
        params.append('from', dateRange.from.toISOString());
        params.append('to', dateRange.to.toISOString());
      }
      params.append('format', format);

      const response = await fetch(
        `/api/analytics/export?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export successful', {
        description: `Analytics exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: 'An error occurred while exporting analytics.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <Sheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <Image className="h-4 w-4 mr-2" />
          Export as PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}