"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Activity, 
  HardDrive, 
  Zap, 
  Users, 
  Clock,
  TrendingUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Line, Bar } from 'recharts';
import { 
  LineChart, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface DatabaseMetrics {
  connections: {
    active: number;
    idle: number;
    total: number;
    max: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    qps: number; // Queries per second
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  tables: {
    name: string;
    rows: number;
    size: string;
    lastVacuum?: string;
  }[];
  queryStats: {
    time: string;
    queries: number;
    avgTime: number;
  }[];
}

export default function DatabaseMetrics() {
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/system/database/metrics?range=${timeRange}`);
      const data = await response.json();
      setMetrics(data.metrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch database metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStorageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'text-red-600', variant: 'destructive' as const };
    if (percentage >= 75) return { color: 'text-yellow-600', variant: 'warning' as const };
    return { color: 'text-green-600', variant: 'default' as const };
  };

  const getConnectionStatus = (active: number, max: number) => {
    const percentage = (active / max) * 100;
    if (percentage >= 90) return { color: 'text-red-600', status: 'Critical' };
    if (percentage >= 75) return { color: 'text-yellow-600', status: 'Warning' };
    return { color: 'text-green-600', status: 'Healthy' };
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading database metrics...</span>
        </div>
      </div>
    );
  }

  const storageStatus = getStorageStatus(metrics.storage.percentage);
  const connectionStatus = getConnectionStatus(metrics.connections.active, metrics.connections.max);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Metrics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
        {/* Connections */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metrics.connections.active}</span>
                <span className="text-sm text-muted-foreground">/ {metrics.connections.max}</span>
              </div>
              <Progress 
                value={(metrics.connections.active / metrics.connections.max) * 100} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Idle: {metrics.connections.idle}</span>
                <Badge variant={connectionStatus.status === 'Healthy' ? 'default' : 'destructive'} className="text-xs">
                  {connectionStatus.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Query Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Query Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metrics.performance.avgQueryTime.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">ms avg</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">QPS:</span>
                  <span className="font-medium">{metrics.performance.qps.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slow queries:</span>
                  <span className={`font-medium ${metrics.performance.slowQueries > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.performance.slowQueries}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${storageStatus.color}`}>
                  {metrics.storage.percentage.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">used</span>
              </div>
              <Progress 
                value={metrics.storage.percentage} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {formatBytes(metrics.storage.used)} / {formatBytes(metrics.storage.total)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Tables */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Database Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metrics.tables.length}</span>
                <span className="text-sm text-muted-foreground">tables</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Total rows: {metrics.tables.reduce((sum, t) => sum + t.rows, 0).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Query Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.queryStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" label={{ value: 'Queries', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Time (ms)', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="queries" stroke="#8884d8" name="Queries" />
              <Line yAxisId="right" type="monotone" dataKey="avgTime" stroke="#82ca9d" name="Avg Time" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Table Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Table Name</th>
                  <th className="text-right py-3 px-4 font-medium">Rows</th>
                  <th className="text-right py-3 px-4 font-medium">Size</th>
                  <th className="text-right py-3 px-4 font-medium">Last Vacuum</th>
                </tr>
              </thead>
              <tbody>
                {metrics.tables
                  .sort((a, b) => b.rows - a.rows)
                  .slice(0, 10)
                  .map((table) => (
                    <tr key={table.name} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{table.name}</td>
                      <td className="py-3 px-4 text-right">{table.rows.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{table.size}</td>
                      <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                        {table.lastVacuum || 'Never'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {(metrics.storage.percentage > 80 || metrics.performance.slowQueries > 10) && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              Performance Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.storage.percentage > 80 && (
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Storage usage is at {metrics.storage.percentage.toFixed(1)}%. Consider increasing storage capacity.
              </p>
            )}
            {metrics.performance.slowQueries > 10 && (
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ {metrics.performance.slowQueries} slow queries detected. Review query performance.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}