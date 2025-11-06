import { Suspense } from 'react';
import { Metadata } from 'next';
import AgentPerformanceChart from '@/components/analytics/AgentPerformanceChart';
import AgentLeaderboard from '@/components/analytics/AgentLeaderboard';
import DateRangeFilter from '@/components/analytics/DateRangeFilter';
import MetricFilter from '@/components/analytics/MetricFilter';
import ExportOptions from '@/components/analytics/ExportOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Award, TrendingUp, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agent Analytics | Newcondo Admin',
  description: 'Agent performance and commission tracking',
};

export default function AgentAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Analytics</h1>
          <p className="text-muted-foreground">
            Track agent performance, commissions, and activity
          </p>
        </div>
        <div className="flex gap-2">
          <DateRangeFilter />
          <MetricFilter />
          <ExportOptions />
        </div>
      </div>

      {/* Agent KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">8,721</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+342</span> this month
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">3,456</div>
              <p className="text-xs text-muted-foreground">
                39.6% of total agents
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">₦1,245,000</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8.2%</span> from last month
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">4.7</div>
              <p className="text-xs text-muted-foreground">
                Out of 5.0
              </p>
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Trend</CardTitle>
          <CardDescription>Agent activity and commission earnings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-80" />}>
            <AgentPerformanceChart />
          </Suspense>
        </CardContent>
      </Card>

      {/* Agent Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Distribution</CardTitle>
            <CardDescription>Agents by activity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Highly Active (10+ listings)</span>
                <span className="text-sm text-muted-foreground">892 agents</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Moderately Active (5-9 listings)</span>
                <span className="text-sm text-muted-foreground">1,534 agents</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low Activity (1-4 listings)</span>
                <span className="text-sm text-muted-foreground">2,453 agents</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inactive (0 listings)</span>
                <span className="text-sm text-muted-foreground">3,842 agents</span>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card>
      <CardHeader>
        <CardTitle>Marking Service Stats</CardTitle>
        <CardDescription>Property marking activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Marking Jobs</span>
            <span className="text-sm text-muted-foreground">1,245</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Completed Jobs</span>
            <span className="text-sm text-muted-foreground">1,089 (87.5%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Average Completion Time</span>
            <span className="text-sm text-muted-foreground">2.3 hours</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Available Agents</span>
            <span className="text-sm text-muted-foreground">456</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

    {/* Agent Leaderboard */}
    <Card>
        <CardHeader>
        <CardTitle>Top Performing Agents</CardTitle>
        <CardDescription>Agents ranked by performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
        <Suspense fallback={<Skeleton className="h-96" />}>
            <AgentLeaderboard />
        </Suspense>
        </CardContent>
    </Card>
    </div>
 );
}
