"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ServiceMetrics {
  uptime: number;
  responseTime: number;
  requestCount: number;
  errorRate: number;
  lastChecked: string;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  url: string;
  metrics: ServiceMetrics;
  dependencies?: string[];
}

const SERVICES = [
  'property-service',
  'payment-service',
  'booking-service',
  'marking-service',
  'admin-service',
  'referral-service',
  'notification-service',
  'analytics-service'
];

export default function ServiceStatusGrid() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchServiceStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchServiceStatus, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchServiceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system/services/status');
      const data = await response.json();
      setServices(data.services);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch service status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    const variants = {
      operational: 'default',
      degraded: 'warning',
      down: 'destructive',
      maintenance: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return 'text-green-600';
    if (uptime >= 99) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getOverallStatus = () => {
    if (services.length === 0) return 'unknown';
    
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    if (downServices > 0) return 'down';
    if (degradedServices > 0) return 'degraded';
    return 'operational';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Status</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'On' : 'Off'}
            </Button>
          </div>
          
          <Button 
            onClick={fetchServiceStatus} 
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(overallStatus as ServiceStatus['status'])}
              <div>
                <h3 className="text-lg font-semibold">Overall System Status</h3>
                <p className="text-sm text-muted-foreground">
                  {services.filter(s => s.status === 'operational').length} of {services.length} services operational
                </p>
              </div>
            </div>
            {getStatusBadge(overallStatus as ServiceStatus['status'])}
          </div>
        </CardContent>
      </Card>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {services.map((service) => (
          <Card key={service.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <CardTitle className="text-base">
                    {service.name.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </CardTitle>
                </div>
                {getStatusBadge(service.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Metrics */}
              <div className="space-y-2">
                {/* Uptime */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className={`font-medium ${getUptimeColor(service.metrics.uptime)}`}>
                    {service.metrics.uptime.toFixed(2)}%
                  </span>
                </div>

                {/* Response Time */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-medium">
                    {formatResponseTime(service.metrics.responseTime)}
                  </span>
                </div>

                {/* Request Count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requests (24h)</span>
                  <div className="flex items-center gap-1">
                    {service.metrics.requestCount > 1000 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-gray-400" />
                    )}
                    <span className="font-medium">
                      {service.metrics.requestCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Error Rate */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Error Rate</span>
                  <span className={`font-medium ${
                    service.metrics.errorRate > 1 ? 'text-red-600' : 
                    service.metrics.errorRate > 0.1 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {service.metrics.errorRate.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Dependencies */}
              {service.dependencies && service.dependencies.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Dependencies:</p>
                  <div className="flex flex-wrap gap-1">
                    {service.dependencies.map(dep => (
                      <Badge key={dep} variant="outline" className="text-xs">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Checked */}
              <div className="pt-2 text-xs text-muted-foreground">
                Last checked: {new Date(service.metrics.lastChecked).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading && services.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading service status...</span>
          </div>
        </div>
      )}
    </div>
  );
}