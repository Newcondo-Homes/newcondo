// apps/admin/src/app/(dashboard)/marking-oversight/analytics/page.tsx

import { Suspense } from 'react';
import { Metadata } from 'next';
import QueueAnalytics from '@/components/marking/QueueAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Queue Analytics | NewCondo Admin',
  description: 'Performance analytics for property marking queue system',
};

// Loading skeleton for charts
function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export default function QueueAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queue Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Performance metrics and insights for the property marking queue system
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Queue Time</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Time to assignment</p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">From assignment to completion</p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Completed within 3hr window</p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeout Rate</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 8 10" />
            </svg>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Jobs exceeding 3hr limit</p>
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="agents">Agent Metrics</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Performance Overview</CardTitle>
              <CardDescription>
                Real-time and historical data on queue operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ChartSkeleton />}>
                <QueueAnalytics view="overview" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>
                In-depth analysis of queue efficiency and bottlenecks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ChartSkeleton />}>
                <QueueAnalytics view="performance" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Metrics</CardTitle>
              <CardDescription>
                Individual agent statistics and reliability scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ChartSkeleton />}>
                <QueueAnalytics view="agents" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>
                Queue performance across different regions and service areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ChartSkeleton />}>
                <QueueAnalytics view="geographic" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Queue Health Status</CardTitle>
            <CardDescription>Current system health indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Queue Capacity</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available Agents</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Wait Time</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
              </div>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>System notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <div className="text-sm text-muted-foreground">
                No recent alerts
              </div>
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}