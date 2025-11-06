"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Search,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'critical';
  service: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  endpoint?: string;
  count?: number; // For grouped errors
}

interface ErrorLogFilters {
  level?: string;
  service?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export default function ErrorLogViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ErrorLogFilters>({});
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [groupSimilar, setGroupSimilar] = useState(true);

  const services = [
    'all',
    'property-service',
    'payment-service',
    'booking-service',
    'marking-service',
    'admin-service'
  ];

  const levels = ['all', 'critical', 'error', 'warning', 'info'];

  useEffect(() => {
    fetchLogs();
  }, [filters, page, groupSimilar]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        groupSimilar: groupSimilar.toString(),
        ...filters
      });
      
      const response = await fetch(`/api/admin/system/errors?${params}`);
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/system/errors/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelIcon = (level: ErrorLog['level']) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: ErrorLog['level']) => {
    const variants = {
      critical: 'destructive',
      error: 'destructive',
      warning: 'warning',
      info: 'secondary'
    } as const;

    return (
      <Badge variant={variants[level]}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Error Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {logs.length} errors found
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={fetchLogs} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search errors..."
                  className="pl-10"
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            {/* Level Filter */}
            <Select 
              value={filters.level || 'all'} 
              onValueChange={(value) => setFilters({ ...filters, level: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Service Filter */}
            <Select 
              value={filters.service || 'all'} 
              onValueChange={(value) => setFilters({ ...filters, service: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service === 'all' ? 'All Services' : service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={groupSimilar}
                onChange={(e) => setGroupSimilar(e.target.checked)}
                className="rounded"
              />
              Group similar errors
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <div className="space-y-2">
        {logs.map((log) => {
          const isExpanded = expandedLogs.has(log.id);
          
          return (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-grow">
                      {getLevelIcon(log.level)}
                      
                      <div className="flex-grow space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getLevelBadge(log.level)}
                          <Badge variant="outline">{log.service}</Badge>
                          {log.count && log.count > 1 && (
                            <Badge variant="secondary">{log.count}x</Badge>
                          )}
                          {log.endpoint && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {log.endpoint}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium">{log.message}</p>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatTimestamp(log.timestamp)}</span>
                          {log.requestId && (
                            <span className="font-mono">Req: {log.requestId.slice(0, 8)}</span>
                          )}
                          {log.userId && (
                            <span>User: {log.userId.slice(0, 8)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      
                      {(log.stack || log.metadata) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(log.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="pl-8 space-y-3 border-l-2 border-muted ml-2">
                      {log.stack && (
                        <div>
                          <p className="text-xs font-medium mb-2">Stack Trace:</p>
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2">Metadata:</p>
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
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
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Error Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getLevelIcon(selectedLog.level)}
              Error Details
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatTimestamp(selectedLog.timestamp)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Service</p>
                <Badge variant="outline">{selectedLog.service}</Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Message</p>
                <p className="text-sm">{selectedLog.message}</p>
              </div>
              
              {selectedLog.endpoint && (
                <div>
                  <p className="text-sm font-medium mb-1">Endpoint</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {selectedLog.endpoint}
                  </code>
                </div>
              )}
              
              {selectedLog.requestId && (
                <div>
                  <p className="text-sm font-medium mb-1">Request ID</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {selectedLog.requestId}
                  </code>
                </div>
              )}
              
              {selectedLog.userId && (
                <div>
                  <p className="text-sm font-medium mb-1">User ID</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {selectedLog.userId}
                  </code>
                </div>
              )}
              
              {selectedLog.stack && (
                <div>
                  <p className="text-sm font-medium mb-2">Stack Trace</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
              
              {selectedLog.metadata && (
                <div>
                  <p className="text-sm font-medium mb-2">Metadata</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No errors found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}