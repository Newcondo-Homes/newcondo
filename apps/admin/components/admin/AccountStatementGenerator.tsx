'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { generateAccountStatement } from '@/lib/api/virtualAccountAdmin';

interface AccountStatementGeneratorProps {
  accountId: string;
  accountNumber: string;
  accountName: string;
}

type StatementFormat = 'PDF' | 'CSV' | 'EXCEL';
type StatementPeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';

export default function AccountStatementGenerator({
  accountId,
  accountNumber,
  accountName,
}: AccountStatementGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [format, setFormat] = useState<StatementFormat>('PDF');
  const [period, setPeriod] = useState<StatementPeriod>('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerateStatement = async () => {
    try {
      setIsGenerating(true);

      // Validate custom date range
      if (period === 'custom') {
        if (!startDate || !endDate) {
          toast({
            title: 'Validation Error',
            description: 'Please select both start and end dates',
            variant: 'destructive',
          });
          return;
        }

        if (new Date(startDate) > new Date(endDate)) {
          toast({
            title: 'Validation Error',
            description: 'Start date must be before end date',
            variant: 'destructive',
          });
          return;
        }
      }

      const response = await generateAccountStatement({
        accountId,
        format,
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: response.mimeType,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Statement Generated',
        description: `Account statement has been downloaded as ${response.filename}`,
      });
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate account statement',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPeriodLabel = (periodValue: StatementPeriod) => {
    switch (periodValue) {
      case 'last_7_days':
        return 'Last 7 Days';
      case 'last_30_days':
        return 'Last 30 Days';
      case 'last_90_days':
        return 'Last 90 Days';
      case 'custom':
        return 'Custom Date Range';
      default:
        return periodValue;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Account Statement</CardTitle>
        <CardDescription>
          Generate and download account statement for {accountName} ({accountNumber})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Info */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account Name:</span>
            <span className="font-medium">{accountName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account Number:</span>
            <span className="font-mono font-medium">{accountNumber}</span>
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label htmlFor="format">Statement Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as StatementFormat)}>
            <SelectTrigger id="format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">PDF Document</SelectItem>
              <SelectItem value="CSV">CSV (Comma Separated)</SelectItem>
              <SelectItem value="EXCEL">Excel Spreadsheet</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {format === 'PDF' && 'Best for printing and official records'}
            {format === 'CSV' && 'Best for data analysis and import'}
            {format === 'EXCEL' && 'Best for advanced analysis with formulas'}
          </p>
        </div>

        {/* Period Selection */}
        <div className="space-y-2">
          <Label htmlFor="period">Statement Period</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as StatementPeriod)}>
            <SelectTrigger id="period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">{getPeriodLabel('last_7_days')}</SelectItem>
              <SelectItem value="last_30_days">{getPeriodLabel('last_30_days')}</SelectItem>
              <SelectItem value="last_90_days">{getPeriodLabel('last_90_days')}</SelectItem>
              <SelectItem value="custom">{getPeriodLabel('custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  max={endDate || undefined}
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  min={startDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleGenerateStatement}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? 'Generating...' : 'Generate Statement'}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Statement Information:</p>
          <ul className="space-y-1 text-xs">
            <li>• Statements include all transactions for the selected period</li>
            <li>• Opening and closing balances are automatically calculated</li>
            <li>• All amounts are in Nigerian Naira (NGN)</li>
            <li>• Statements are time-stamped with generation date</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}