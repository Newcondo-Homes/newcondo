// apps/admin/src/app/(dashboard)/marking/page.tsx
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkingAnalyticsDashboard } from '@/components/marking/MarkingAnalyticsDashboard';
import { QueueMonitor } from '@/components/marking/QueueMonitor';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardList, 
  Users, 
  AlertCircle, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

async function getMarkingOverview() {
  // TODO: Replace with actual API call
  return {
    totalJobs: 156,
    activeJobs: 23,
    completedToday: 12,
    pendingDisputes: 3,
    activeAgents: 45,
    avgCompletionTime: '2.5 hours',
    successRate: 94.5,
    revenue: 2340000
  };
}

async function MarkingOverviewContent() {
  const overview = await getMarkingOverview();

  const stats = [
    {
      title: 'Total Marking Jobs',
      value: overview.totalJobs,
      icon: ClipboardList,
      description: `${overview.activeJobs} active`,
      trend: '+12% from last month'
    },
    {
      title: 'Active Agents',
      value: overview.activeAgents,
      icon: Users,
      description: 'Available for marking',
      trend: '+5 new this week'
    },
    {
      title: 'Pending Disputes',
      value: overview.pendingDisputes,
      icon: AlertCircle,
      description: 'Requires attention',
      trend: '-2 from yesterday'
    },
    {
      title: 'Success Rate',
      value: `${overview.successRate}%`,
      icon: CheckCircle,
      description: 'Job completion',
      trend: '+2.3% improvement'
    },
    {
      title: 'Avg Completion Time',
      value: overview.avgCompletionTime,
      icon: Clock,
      description: 'Per marking job',
      trend: '-15 min from last week'
    },
    {
      title: 'Revenue Today',
      value: `₦${(overview.revenue / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      description: `${overview.completedToday} jobs completed`,
      trend: '+18% from yesterday'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="queue">Queue Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <MarkingAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <QueueMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MarkingOverviewPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Property Marking Service
        </h2>
      </div>

      <Suspense fallback={<MarkingOverviewSkeleton />}>
        <MarkingOverviewContent />
      </Suspense>
    </div>
  );
}

function MarkingOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-3 w-[120px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}