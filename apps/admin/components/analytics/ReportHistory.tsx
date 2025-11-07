"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  History, 
  Download, 
  Eye, 
  Trash2, 
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportHistoryItem {
  id: string;
  name: string;
  type: string;
  format: string;
  status: 'completed' | 'processing' | 'failed';
  fileSize?: string;
  fileUrl?: string;
  generatedBy: string;
  generatedByName: string;
  dateRange: {
    from: string;
    to: string;
  };
  metricsIncluded: string[];
  createdAt: string;
  downloadCount: number;
  errorMessage?: string;
}

export default function ReportHistory() {
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReportHistory();
  }, [statusFilter, typeFilter, page]);

  const fetchReportHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        status: statusFilter,
        type: typeFilter,
        search: searchQuery
      });

      const response = await fetch(`/api/admin/reports/history?${params}`);
      const data = await response.json();
      setReports(data.reports);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch report history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update download count
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, downloadCount: r.downloadCount + 1 } : r
      ));
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete report');

      setReports(reports.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const handlePreview = (reportId: string) => {
    window.open(`/admin/reports/preview/${reportId}`, '_blank');
  };

  const getStatusBadge = (status: ReportHistoryItem['status']) => {
    const config = {
      completed: { variant: 'default' as const, icon: CheckCircle2, label: 'Completed' },
      processing: { variant: 'warning' as const, icon: Loader2, label: 'Processing' },
      failed: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' }
    };

    const { variant, icon: Icon, label } = config[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      users: 'User Analytics',
      properties: 'Property Performance',
      payments: 'Financial',
      agents: 'Agent Performance',
      rentals: 'Rental Activity',
      marking: 'Property Marking',
      referrals: 'Referrals',
      platform: 'Platform Overview'
    };
    return labels[type] || type;
  };

  const getFormatIcon = (format: string) => {
    const icons: Record<string, string> = {
      pdf: '📄',
      excel: '📊',
      csv: '📋',
      json: '{ }'
    };
    return icons[format] || '📄';
  };

  const filteredReports = reports.filter(report => {
    if (searchQuery && !report.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const completedCount = reports.filter(r => r.status === 'completed').length;
  const processingCount = reports.filter(r => r.status === 'processing').length;
  const failedCount = reports.filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Report History
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {completedCount} completed · {processingCount} processing · {failedCount} failed
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="users">User Analytics</SelectItem>
                <SelectItem value="properties">Property Performance</SelectItem>
                <SelectItem value="payments">Financial</SelectItem>
                <SelectItem value="agents">Agent Performance</SelectItem>
                <SelectItem value="rentals">Rental Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={fetchReportHistory}
            disabled={loading}
            className="mt-4"
          >
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Report List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading report history...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reports found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-2xl">
                      {getFormatIcon(report.format)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-grow space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{report.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getTypeLabel(report.type)} • {report.format.toUpperCase()}
                          {report.fileSize && ` • ${report.fileSize}`}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.dateRange.from), 'PP')} - {format(new Date(report.dateRange.to), 'PP')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {report.generatedByName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(report.createdAt), 'PPp')}
                      </span>
                      {report.downloadCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {report.downloadCount} downloads
                        </span>
                      )}
                    </div>

                    {report.metricsIncluded.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {report.metricsIncluded.slice(0, 3).map((metric, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {metric}
                          </Badge>
                        ))}
                        {report.metricsIncluded.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{report.metricsIncluded.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {report.status === 'failed' && report.errorMessage && (
                      <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-200">
                        <p className="font-medium">Error:</p>
                        <p>{report.errorMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {report.status === 'completed' && (
                        <>
                          <DropdownMenuItem onClick={() => handlePreview(report.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleDownload(report.id, report.name)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}