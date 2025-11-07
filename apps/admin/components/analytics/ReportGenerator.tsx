"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Download,
  Eye,
  Loader2,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportConfig {
  name: string;
  type: string;
  format: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  metrics: string[];
  filters: {
    role?: string;
    verificationStatus?: string;
    propertyStatus?: string;
    paymentStatus?: string;
  };
  groupBy?: string;
  includeCharts: boolean;
  includeRawData: boolean;
}

const REPORT_TYPES = [
  { value: 'users', label: 'User Analytics Report', description: 'User registration, verification, and activity metrics' },
  { value: 'properties', label: 'Property Performance Report', description: 'Property listings, views, and rental statistics' },
  { value: 'payments', label: 'Financial Report', description: 'Revenue, transactions, and commission breakdown' },
  { value: 'agents', label: 'Agent Performance Report', description: 'Agent listings, marking jobs, and commissions' },
  { value: 'rentals', label: 'Rental Activity Report', description: 'Active rentals, confirmations, and cancellations' },
  { value: 'marking', label: 'Property Marking Report', description: 'Marking jobs, completion rates, and agent performance' },
  { value: 'referrals', label: 'Referral Report', description: 'Referral tracking and conversion metrics' },
  { value: 'platform', label: 'Platform Overview Report', description: 'Comprehensive platform statistics and KPIs' }
];

const REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'excel', label: 'Excel (XLSX)', icon: '📊' },
  { value: 'csv', label: 'CSV', icon: '📋' },
  { value: 'json', label: 'JSON', icon: '{ }' }
];

const METRICS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  users: [
    { value: 'totalUsers', label: 'Total Users' },
    { value: 'newRegistrations', label: 'New Registrations' },
    { value: 'verifiedUsers', label: 'Verified Users' },
    { value: 'premiumUsers', label: 'Premium Users' },
    { value: 'usersByRole', label: 'Users by Role' },
    { value: 'usersByLocation', label: 'Users by Location' },
    { value: 'activeUsers', label: 'Active Users' }
  ],
  properties: [
    { value: 'totalProperties', label: 'Total Properties' },
    { value: 'newListings', label: 'New Listings' },
    { value: 'propertiesByType', label: 'Properties by Type' },
    { value: 'propertiesByLocation', label: 'Properties by Location' },
    { value: 'averagePrice', label: 'Average Price' },
    { value: 'viewsAndEngagement', label: 'Views & Engagement' },
    { value: 'availabilityRate', label: 'Availability Rate' }
  ],
  payments: [
    { value: 'totalRevenue', label: 'Total Revenue' },
    { value: 'transactionCount', label: 'Transaction Count' },
    { value: 'averageTransactionValue', label: 'Average Transaction Value' },
    { value: 'commissionEarned', label: 'Commission Earned' },
    { value: 'paymentsByMethod', label: 'Payments by Method' },
    { value: 'successRate', label: 'Success Rate' },
    { value: 'refundRate', label: 'Refund Rate' }
  ],
  agents: [
    { value: 'totalAgents', label: 'Total Agents' },
    { value: 'activeAgents', label: 'Active Agents' },
    { value: 'agentListings', label: 'Agent Listings' },
    { value: 'markingJobsCompleted', label: 'Marking Jobs Completed' },
    { value: 'commissionEarned', label: 'Commission Earned' },
    { value: 'reliabilityScores', label: 'Reliability Scores' },
    { value: 'topPerformers', label: 'Top Performers' }
  ],
  rentals: [
    { value: 'activeRentals', label: 'Active Rentals' },
    { value: 'newRentals', label: 'New Rentals' },
    { value: 'completedRentals', label: 'Completed Rentals' },
    { value: 'confirmationRate', label: 'Confirmation Rate' },
    { value: 'cancellationRate', label: 'Cancellation Rate' },
    { value: 'averageRentalDuration', label: 'Average Rental Duration' }
  ],
  marking: [
    { value: 'totalJobs', label: 'Total Jobs' },
    { value: 'completedJobs', label: 'Completed Jobs' },
    { value: 'pendingJobs', label: 'Pending Jobs' },
    { value: 'completionRate', label: 'Completion Rate' },
    { value: 'averageCompletionTime', label: 'Average Completion Time' },
    { value: 'agentPerformance', label: 'Agent Performance' }
  ],
  referrals: [
    { value: 'totalReferrals', label: 'Total Referrals' },
    { value: 'conversionRate', label: 'Conversion Rate' },
    { value: 'topReferrers', label: 'Top Referrers' },
    { value: 'rewardsDistributed', label: 'Rewards Distributed' }
  ],
  platform: [
    { value: 'overallMetrics', label: 'Overall Metrics' },
    { value: 'growthTrends', label: 'Growth Trends' },
    { value: 'revenueBreakdown', label: 'Revenue Breakdown' },
    { value: 'userEngagement', label: 'User Engagement' },
    { value: 'topPerformingAreas', label: 'Top Performing Areas' }
  ]
};

export default function ReportGenerator() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>({
    name: '',
    type: '',
    format: 'pdf',
    dateRange: {
      from: undefined,
      to: undefined
    },
    metrics: [],
    filters: {},
    groupBy: undefined,
    includeCharts: true,
    includeRawData: false
  });
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handleMetricToggle = (metric: string) => {
    setConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  const handleGenerateReport = async (preview: boolean = false) => {
    if (!config.type) {
      toast({
        title: 'Error',
        description: 'Please select a report type.',
        variant: 'destructive',
      });
      return;
    }

    if (config.metrics.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one metric.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (preview) {
        setPreviewing(true);
      } else {
        setGenerating(true);
      }

      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          preview
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      if (preview) {
        const data = await response.json();
        // Open preview in new window or modal
        window.open(`/admin/reports/preview/${data.reportId}`, '_blank');
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = config.name || `report-${config.type}-${format(new Date(), 'yyyy-MM-dd')}`;
        a.download = `${fileName}.${config.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: 'Success',
        description: preview ? 'Report preview opened in new window.' : 'Report generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setPreviewing(false);
    }
  };

  const selectedReportType = REPORT_TYPES.find(t => t.value === config.type);
  const availableMetrics = config.type ? METRICS_BY_TYPE[config.type] || [] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Custom Report
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Report Name */}
          <div>
            <Label htmlFor="reportName">Report Name (Optional)</Label>
            <Input
              id="reportName"
              placeholder="e.g., Q4 2024 User Growth Report"
              className="mt-2"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>

          {/* Report Type */}
          <div>
            <Label>Report Type *</Label>
            <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value, metrics: [] })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <Label>Date Range *</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.from ? format(config.dateRange.from, 'PP') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.from}
                    onSelect={(date) => setConfig({
                      ...config,
                      dateRange: { ...config.dateRange, from: date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.to ? format(config.dateRange.to, 'PP') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.to}
                    onSelect={(date) => setConfig({
                      ...config,
                      dateRange: { ...config.dateRange, to: date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Metrics Selection */}
          {config.type && (
            <div>
              <Label>Select Metrics *</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                {availableMetrics.map((metric) => (
                  <div key={metric.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.value}
                      checked={config.metrics.includes(metric.value)}
                      onCheckedChange={() => handleMetricToggle(metric.value)}
                    />
                    <Label
                      htmlFor={metric.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {metric.label}
                    </Label>
                  </div>
                ))}
              </div>
              {config.metrics.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {config.metrics.length} metric(s) selected
                </p>
              )}
            </div>
          )}

          {/* Report Format */}
          <div>
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {REPORT_FORMATS.map((format) => (
                <Button
                  key={format.value}
                  variant={config.format === format.value ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setConfig({ ...config, format: format.value })}
                >
                  <span className="mr-2">{format.icon}</span>
                  {format.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3 p-4 border rounded-lg">
            <Label>Additional Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={config.includeCharts}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, includeCharts: checked as boolean })
                }
              />
              <Label htmlFor="includeCharts" className="text-sm font-normal cursor-pointer">
                Include charts and visualizations
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeRawData"
                checked={config.includeRawData}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, includeRawData: checked as boolean })
                }
              />
              <Label htmlFor="includeRawData" className="text-sm font-normal cursor-pointer">
                Include raw data tables
              </Label>
            </div>
          </div>

          {/* Summary */}
          {config.type && config.metrics.length > 0 && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">Report Summary:</p>
              <div className="space-y-1 text-sm">
                <p><strong>Type:</strong> {selectedReportType?.label}</p>
                <p><strong>Period:</strong> {
                  config.dateRange.from && config.dateRange.to
                    ? `${format(config.dateRange.from, 'PP')} - ${format(config.dateRange.to, 'PP')}`
                    : 'Not specified'
                }</p>
                <p><strong>Metrics:</strong> {config.metrics.length} selected</p>
                <p><strong>Format:</strong> {REPORT_FORMATS.find(f => f.value === config.format)?.label}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleGenerateReport(true)}
              disabled={!config.type || config.metrics.length === 0 || previewing}
              variant="outline"
              className="flex-1"
            >
              {previewing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Preview
            </Button>

            <Button
              onClick={() => handleGenerateReport(false)}
              disabled={!config.type || config.metrics.length === 0 || generating}
              className="flex-1"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}