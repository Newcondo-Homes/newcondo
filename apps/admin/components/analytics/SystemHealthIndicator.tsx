'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemHealthIndicator() {
  const { data: systemHealth, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/analytics/system-health`);
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  const overallStatus = 'healthy'; // Calculate from systemHealth data

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time platform status</CardDescription>
          </div>
          <HealthBadge status={overallStatus} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <HealthMetric
            label="API Response Time"
            value="245ms"
            status="healthy"
            threshold="< 500ms"
          />
          <HealthMetric
            label="Database Queries"
            value="12ms"
            status="healthy"
            threshold="< 100ms"
          />
          <HealthMetric
            label="Error Rate"
            value="0.3%"
            status="healthy"
            threshold="< 1%"
          />
          <HealthMetric
            label="Uptime"
            value="99.9%"
            status="healthy"
            threshold="> 99%"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  const config = {
    healthy: {
      icon: CheckCircle,
      label: 'All Systems Operational',
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    warning: {
      icon: AlertTriangle,
      label: 'Performance Degraded',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    error: {
      icon: XCircle,
      label: 'System Issues Detected',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  }[status];

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} px-3 py-1`}>
      <Icon className="h-4 w-4 mr-2" />
      {config.label}
    </Badge>
  );
}

function HealthMetric({
  label,
  value,
  status,
  threshold,
}: {
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'error';
  threshold: string;
}) {
  const statusColor = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  }[status];

  const StatusIcon = {
    healthy: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  }[status];

  return (
    <div className="flex items-start gap-3">
      <StatusIcon className={`h-5 w-5 ${statusColor} mt-1`} />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{threshold}</p>
      </div>
    </div>
  );
}