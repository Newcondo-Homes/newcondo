import { Suspense } from 'react';
import { Metadata } from 'next';
import SystemHealthIndicator from '@/components/analytics/SystemHealthIndicator';
import DateRangeFilter from '@/components/analytics/DateRangeFilter';
import ExportOptions from '@/components/analytics/ExportOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Database, Zap, AlertTriangle, CheckCircle, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
    title: 'System Health | Newcondo Admin',
    description: 'Platform performance and system monitoring',
};

export default function SystemHealthPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
                    <p className="text-muted-foreground">
                        Monitor platform performance and system status
                    </p>
                </div>
                <div className="flex gap-2">
                    <DateRangeFilter />
                    <ExportOptions />
                </div>
            </div>

            {/* System Health Indicator */}
            <Suspense fallback={<Skeleton className="h-64" />}>
                <SystemHealthIndicator />
            </Suspense>

            {/* Service Status */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Services</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">Operational</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Healthy
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            All 8 services running normally
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">Healthy</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                99.9%
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Response time: 12ms
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Gateway</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">Active</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Online
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Flutterwave: Connected
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>API Performance</CardTitle>
                        <CardDescription>Response times and throughput</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Avg. Response Time</span>
                                <span className="text-sm font-semibold">245ms</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Requests/Second</span>
                                <span className="text-sm font-semibold">1,234</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Success Rate</span>
                                <span className="text-sm font-semibold text-green-600">99.7%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Error Rate</span>
                                <span className="text-sm font-semibold text-red-600">0.3%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resource Utilization</CardTitle>
                        <CardDescription>Server and database resources</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">CPU Usage</span>
                                    <span className="text-sm text-muted-foreground">45%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Memory Usage</span>
                                    <span className="text-sm text-muted-foreground">62%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '62%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Storage Usage</span>
                                    <span className="text-sm text-muted-foreground">34%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '34%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Database Connections</span>
                                    <span className="text-sm text-muted-foreground">128/500</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25.6%' }} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Service Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Microservices Status</CardTitle>
                    <CardDescription>Individual service health monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <ServiceStatusRow
                            name="Property Service"
                            status="healthy"
                            uptime="99.9%"
                            responseTime="156ms"
                        />
                        <ServiceStatusRow
                            name="Payment Service"
                            status="healthy"
                            uptime="99.8%"
                            responseTime="234ms"
                        />
                        <ServiceStatusRow
                            name="Booking Service"
                            status="healthy"
                            uptime="99.7%"
                            responseTime="189ms"
                        />
                        <ServiceStatusRow
                            name="Marking Service"
                            status="healthy"
                            uptime="99.9%"
                            responseTime="142ms"
                        />
                        <ServiceStatusRow
                            name="Admin Service"
                            status="healthy"
                            uptime="99.9%"
                            responseTime="167ms"
                        />
                        <ServiceStatusRow
                            name="Referral Service"
                            status="healthy"
                            uptime="99.6%"
                            responseTime="198ms"
                        />
                        <ServiceStatusRow
                            name="Notification Service"
                            status="warning"
                            uptime="98.9%"
                            responseTime="456ms"
                        />
                        <ServiceStatusRow
                            name="Analytics Service"
                            status="healthy"
                            uptime="99.8%"
                            responseTime="223ms"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Recent Incidents */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Incidents</CardTitle>
                    <CardDescription>System alerts and resolved issues</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 pb-4 border-b">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">High Response Time</h4>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        Resolved
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Notification service experienced elevated response times
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    2 hours ago • Resolved in 15 minutes
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 pb-4 border-b">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Database Backup Completed</h4>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Success
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Scheduled database backup completed successfully
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    5 hours ago
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Deployment Completed</h4>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        Info
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    New version deployed to production environment
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    1 day ago
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


function ServiceStatusRow({
    name,
    status,
    uptime,
    responseTime
}: {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    responseTime: string;
}) {
    const statusConfig = {
        healthy: {
            icon: CheckCircle,
            className: 'text-green-600',
            badge: 'bg-green-50 text-green-700 border-green-200'
        },
        warning: {
            icon: AlertTriangle,
            className: 'text-yellow-600',
            badge: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        },
        error: {
            icon: AlertTriangle,
            className: 'text-red-600',
            badge: 'bg-red-50 text-red-700 border-red-200'
        }
    };
    const config = statusConfig[status];
    const StatusIcon = config.icon;
    return (
        <div className="flex items-center justify-between py-3 border-b last:border-0">
            <div className="flex items-center gap-3">
                <StatusIcon className={h - 5 w-5 ${config.className}} />
                <span className="font-medium">{name}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="text-sm font-medium">{uptime}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Response</p>
                    <p className="text-sm font-medium">{responseTime}</p>
                </div>
                <Badge variant="outline" className={config.badge}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
            </div>
        </div>
    );
}