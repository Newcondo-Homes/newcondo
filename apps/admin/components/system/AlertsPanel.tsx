"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  CheckCircle2,
  XCircle,
  Bell,
  BellOff,
  RefreshCw,
  Clock,
  TrendingUp,
  Server,
  Database,
  Activity,
  Zap
} from 'lucide-react';

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'service' | 'database' | 'performance' | 'security' | 'disk' | 'memory';
  title: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  metadata?: Record<string, any>;
  actionRequired?: boolean;
  affectedResources?: string[];
  resolvedAt?: string;
  acknowledgedBy?: string;
}

interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  active: number;
  acknowledged: number;
  resolved: number;
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    active: 0,
    acknowledged: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/system/alerts?filter=${filter}`);
      const data = await response.json();
      setAlerts(data.alerts);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/admin/system/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/admin/system/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: SystemAlert['category']) => {
    switch (category) {
      case 'service':
        return <Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'performance':
        return <Activity className="h-4 w-4" />;
      case 'security':
        return <AlertCircle className="h-4 w-4" />;
      case 'disk':
      case 'memory':
        return <Zap className="h-4 w-4" />;
    }
  };

  const getAlertBadge = (type: SystemAlert['type']) => {
    const variants = {
      critical: 'destructive',
      warning: 'warning',
      info: 'secondary'
    } as const;

    return (
      <Badge variant={variants[type]}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: SystemAlert['status']) => {
    const config = {
      active: { variant: 'destructive' as const, label: 'Active' },
      acknowledged: { variant: 'warning' as const, label: 'Acknowledged' },
      resolved: { variant: 'default' as const, label: 'Resolved' }
    };

    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            System Alerts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.active} active alerts
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={notificationsEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? (
              <Bell className="h-4 w-4 mr-2" />
            ) : (
              <BellOff className="h-4 w-4 mr-2" />
            )}
            Notifications
          </Button>
          
          <Button onClick={fetchAlerts} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-xs text-muted-foreground mt-1">Critical</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
              <p className="text-xs text-muted-foreground mt-1">Warning</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
              <p className="text-xs text-muted-foreground mt-1">Info</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.active}</p>
              <p className="text-xs text-muted-foreground mt-1">Active</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.acknowledged}</p>
              <p className="text-xs text-muted-foreground mt-1">Ack'd</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground mt-1">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'acknowledged', 'resolved'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              alert.type === 'critical' ? 'border-l-4 border-l-red-600' :
              alert.type === 'warning' ? 'border-l-4 border-l-yellow-600' :
              'border-l-4 border-l-blue-600'
            }`}
            onClick={() => setSelectedAlert(alert)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-grow">
                  {getAlertIcon(alert.type)}
                  
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getAlertBadge(alert.type)}
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getCategoryIcon(alert.category)}
                        {alert.category}
                      </Badge>
                      {getStatusBadge(alert.status)}
                      {alert.actionRequired && (
                        <Badge variant="destructive" className="animate-pulse">
                          Action Required
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                      {alert.affectedResources && alert.affectedResources.length > 0 && (
                        <span>{alert.affectedResources.length} resources affected</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        acknowledgeAlert(alert.id);
                      }}
                    >
                      Acknowledge
                    </Button>
                  )}
                  
                  {(alert.status === 'active' || alert.status === 'acknowledged') && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveAlert(alert.id);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getAlertIcon(selectedAlert.type)}
              {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedAlert && formatTimestamp(selectedAlert.timestamp)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getAlertBadge(selectedAlert.type)}
                {getStatusBadge(selectedAlert.status)}
                <Badge variant="outline" className="flex items-center gap-1">
                  {getCategoryIcon(selectedAlert.category)}
                  {selectedAlert.category}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Message</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
              </div>
              
              {selectedAlert.affectedResources && selectedAlert.affectedResources.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Affected Resources</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.affectedResources.map((resource, i) => (
                      <Badge key={i} variant="outline">{resource}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedAlert.metadata && (
                <div>
                  <p className="text-sm font-medium mb-2">Additional Details</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedAlert.acknowledgedBy && (
                <div>
                  <p className="text-sm font-medium">Acknowledged by</p>
                  <p className="text-sm text-muted-foreground">{selectedAlert.acknowledgedBy}</p>
                </div>
              )}
              
              {selectedAlert.resolvedAt && (
                <div>
                  <p className="text-sm font-medium">Resolved at</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAlert.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedAlert?.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    acknowledgeAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                >
                  Acknowledge
                </Button>
                <Button
                  onClick={() => {
                    resolveAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </>
            )}
            
            {selectedAlert?.status === 'acknowledged' && (
              <Button
                onClick={() => {
                  resolveAlert(selectedAlert.id);
                  setSelectedAlert(null);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!loading && alerts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No {filter !== 'all' ? filter : ''} alerts at this time
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}