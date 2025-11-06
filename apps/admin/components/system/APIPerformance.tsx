"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface EndpointMetrics {
  path: string;
  method: string;
  calls: number;
  avgResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
}

interface APIMetrics {
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  endpoints: EndpointMetrics[];
  timeline: {
    time: string;
    requests: number;
    errors: number;
    avgTime: number;
  }[];
  statusCodes: {
    code: number;
    count: number;
    percentage: number;
  }[];
  topSlowEndpoints: EndpointMetrics[];
  topErrorEndpoints: EndpointMetrics[];
}

const STATUS_CODE_COLORS: Record<string, string> = {
  '2xx': '#10b981',
  '3xx': '#3b82f6',
  '4xx': '#f59e0b',
  '5xx': '#ef4444',
};

export default function APIPerformance() {
  const [metrics, setMetrics] = useState<APIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const services = [
    'all',
    'property-service',
    'payment-service',
    'booking-service',
    'marking-service',
    'admin-service'
  ];

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange, selectedService]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/system/api/performance?range=${timeRange}&service=${selectedService}`
      );
      const data = await response.json();
      setMetrics(data.metrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch API metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCodeGroup = (code: number) => {
    if (code >= 200 && code < 300) return '2xx';
    if (code >= 300 && code < 400) return '3xx';
    if (code >= 400 && code < 500) return '4xx';
    if (code >= 500) return '5xx';
    return 'Unknown';
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getTrend = (value: number, threshold: number) => {
    if (value > threshold) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  const getPerformanceStatus = (avgTime: number) => {
    if (avgTime < 200) return { color: 'text-green-600', status: 'Excellent' };
    if (avgTime < 500) return { color: 'text-blue-600', status: 'Good' };
    if (avgTime < 1000) return { color: 'text-yellow-600', status: 'Fair' };
    return { color: 'text-red-600', status: 'Poor' };
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading API performance metrics...</span>
        </div>
      </div>
    );
  }

  const performanceStatus = getPerformanceStatus(metrics.avgResponseTime);
  const statusCodeData = Object.entries(
    metrics.statusCodes.reduce((acc, { code, count }) => {
      const group = getStatusCodeGroup(code);
      acc[group] = (acc[group] || 0) + count;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            API Performance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service} value={service}>
                  {service === 'all' ? 'All Services' : service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          
          <Button onClick={fetchMetrics} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {metrics.requestsPerSecond.toFixed(1)} req/s
                </span>
                {getTrend(metrics.requestsPerSecond, 100)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${performanceStatus.color}`}>
                  {formatResponseTime(metrics.avgResponseTime)}
                </span>
              </div>
              <Badge variant={performanceStatus.status === 'Excellent' ? 'default' : 'secondary'}>
                {performanceStatus.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  metrics.errorRate > 5 ? 'text-red-600' : 
                  metrics.errorRate > 1 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {metrics.errorRate.toFixed(2)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.totalErrors.toLocaleString()} errors
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {(100 - metrics.errorRate).toFixed(2)}%
                </span>
              </div>
              <Progress value={100 - metrics.errorRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Request Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Requests" />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Code Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Code Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusCodeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusCodeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_CODE_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Slow Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Slowest Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topSlowEndpoints.slice(0, 5).map((endpoint, index) => (
              <div key={`${endpoint.method}-${endpoint.path}`} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 text-center">
                  <Badge variant="outline">{index + 1}</Badge>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{endpoint.method}</Badge>
                    <span className="font-mono text-sm">{endpoint.path}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{endpoint.calls.toLocaleString()} calls</span>
                    <span>P95: {formatResponseTime(endpoint.p95ResponseTime)}</span>
                    <span>P99: {formatResponseTime(endpoint.p99ResponseTime)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className={`text-lg font-bold ${
                    endpoint.avgResponseTime > 1000 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {formatResponseTime(endpoint.avgResponseTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">avg</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Error Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoints with Most Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topErrorEndpoints.slice(0, 5).map((endpoint, index) => (
              <div key={`${endpoint.method}-${endpoint.path}`} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 text-center">
                  <Badge variant="outline">{index + 1}</Badge>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{endpoint.method}</Badge>
                    <span className="font-mono text-sm">{endpoint.path}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{endpoint.calls.toLocaleString()} calls</span>
                    <span>Success: {endpoint.successRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className={`text-lg font-bold ${
                    endpoint.errorRate > 10 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {endpoint.errorRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">error rate</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}