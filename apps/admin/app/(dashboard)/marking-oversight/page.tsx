// apps/admin/src/app/(dashboard)/marking-oversight/page.tsx

import { Suspense } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Users, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Stats overview component
async function MarkingStatsOverview() {
  // TODO: Fetch from API
  const stats = {
    totalJobs: 156,
    queuedJobs: 23,
    inProgress: 12,
    completedToday: 8,
    averageCompletionTime: '4.2 hours',
    activeAgents: 45,
    pendingConfirmations: 6,
    expiringSoon: 3
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalJobs}</div>
          <p className="text-xs text-muted-foreground">
            All marking jobs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Queued</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.queuedJobs}</div>
          <p className="text-xs text-muted-foreground">
            Waiting for agents
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <AlertCircle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
          <p className="text-xs text-muted-foreground">
            Currently being marked
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedToday}</div>
          <p className="text-xs text-muted-foreground">
            Avg: {stats.averageCompletionTime}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAgents}</div>
          <p className="text-xs text-muted-foreground">
            Available for marking
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingConfirmations}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting owner verification
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.expiringSoon}</div>
          <p className="text-xs text-muted-foreground">
            {'<'} 24 hours remaining
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">94.2%</div>
          <p className="text-xs text-muted-foreground">
            Success rate this week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick actions component
function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Manage property marking operations</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/marking-oversight/queue">
          <Button variant="outline" className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            View Queue
          </Button>
        </Link>
        <Link href="/marking-oversight/agents">
          <Button variant="outline" className="w-full">
            <Users className="mr-2 h-4 w-4" />
            Agent Performance
          </Button>
        </Link>
        <Link href="/marking-oversight/jobs?status=PENDING">
          <Button variant="outline" className="w-full">
            <AlertCircle className="mr-2 h-4 w-4" />
            Pending Confirmations
          </Button>
        </Link>
        <Link href="/marking-oversight/analytics">
          <Button variant="outline" className="w-full">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Recent activity component
async function RecentActivity() {
  // TODO: Fetch from API
  const activities = [
    {
      id: '1',
      type: 'completed',
      message: 'Agent John Doe completed marking job #MJ-1234',
      time: '5 minutes ago',
      icon: CheckCircle2,
      iconColor: 'text-green-600'
    },
    {
      id: '2',
      type: 'assigned',
      message: 'Job #MJ-1235 assigned to Agent Jane Smith',
      time: '12 minutes ago',
      icon: Users,
      iconColor: 'text-blue-600'
    },
    {
      id: '3',
      type: 'expired',
      message: 'Job #MJ-1220 time slot expired, reassigning',
      time: '1 hour ago',
      icon: XCircle,
      iconColor: 'text-red-600'
    },
    {
      id: '4',
      type: 'queued',
      message: 'New marking job #MJ-1236 added to queue',
      time: '2 hours ago',
      icon: Clock,
      iconColor: 'text-yellow-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest marking job updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <Icon className={`h-5 w-5 mt-0.5 ${activity.iconColor}`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Main page component
export default function MarkingOversightPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marking Oversight</h1>
        <p className="text-muted-foreground">
          Monitor and manage property marking operations
        </p>
      </div>

      <Suspense fallback={<StatsLoadingSkeleton />}>
        <MarkingStatsOverview />
      </Suspense>

      <QuickActions />

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<CardLoadingSkeleton />}>
          <RecentActivity />
        </Suspense>
        
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Marking service status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Queue Processing</span>
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Agent Notifications</span>
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Processing</span>
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">GPS Services</span>
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Operational
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading skeletons
function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
















// // apps/admin/src/app/(dashboard)/marking-oversight/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
// import MarkingJobsTable from "@/components/admin/MarkingJobsTable";
// import QueueMonitor from "@/components/admin/QueueMonitor";
// import AgentPerformanceTable from "@/components/admin/AgentPerformanceTable";
// import { Button } from "@newcondo/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/tabs";
// import { Alert, AlertDescription } from "@newcondo/ui/alert";
// import { markingOversightApi } from "@/lib/api/markingOversight";
// import type { 
//   MarkingJobOverview, 
//   QueueStats, 
//   AgentPerformanceMetrics 
// } from "@/types/admin";

// export default function MarkingOversightPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState("jobs");

//   // Data states
//   const [jobs, setJobs] = useState<MarkingJobOverview[]>([]);
//   const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
//   const [agentMetrics, setAgentMetrics] = useState<AgentPerformanceMetrics[]>([]);
//   const [stats, setStats] = useState({
//     totalJobs: 0,
//     activeJobs: 0,
//     completedJobs: 0,
//     queuedJobs: 0,
//     averageCompletionTime: 0,
//     successRate: 0
//   });

//   // Filters
//   const [filters, setFilters] = useState({
//     status: "all",
//     dateRange: "7d",
//     urgency: "all"
//   });

//   useEffect(() => {
//     fetchData();
//   }, [filters]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const [jobsData, queueData, metricsData, statsData] = await Promise.all([
//         markingOversightApi.getMarkingJobs(filters),
//         markingOversightApi.getQueueStats(),
//         markingOversightApi.getAgentMetrics(),
//         markingOversightApi.getOverviewStats()
//       ]);

//       setJobs(jobsData);
//       setQueueStats(queueData);
//       setAgentMetrics(metricsData);
//       setStats(statsData);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await fetchData();
//     setRefreshing(false);
//   };

//   const handleJobClick = (jobId: string) => {
//     router.push(`/marking-oversight/${jobId}`);
//   };

//   if (loading && !refreshing) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <Loader2 className="w-8 h-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 p-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Marking Oversight</h1>
//           <p className="text-muted-foreground">
//             Monitor and manage property marking jobs and agent performance
//           </p>
//         </div>
//         <Button 
//           onClick={handleRefresh} 
//           disabled={refreshing}
//           variant="outline"
//         >
//           <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
//           Refresh
//         </Button>
//       </div>

//       {/* Error Alert */}
//       {error && (
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       {/* Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalJobs}</div>
//             <p className="text-xs text-muted-foreground">
//               All time marking jobs
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.activeJobs}</div>
//             <p className="text-xs text-muted-foreground">
//               Currently in progress
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.successRate}%</div>
//             <p className="text-xs text-muted-foreground">
//               Completed successfully
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.averageCompletionTime}h</div>
//             <p className="text-xs text-muted-foreground">
//               Average completion time
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Main Content Tabs */}
//       <Tabs value={activeTab} onValueChange={setActiveTab}>
//         <TabsList>
//           <TabsTrigger value="jobs">Marking Jobs</TabsTrigger>
//           <TabsTrigger value="queue">Queue Monitor</TabsTrigger>
//           <TabsTrigger value="agents">Agent Performance</TabsTrigger>
//         </TabsList>

//         <TabsContent value="jobs" className="space-y-4">
//           <MarkingJobsTable 
//             jobs={jobs}
//             onJobClick={handleJobClick}
//             onFilterChange={setFilters}
//             filters={filters}
//           />
//         </TabsContent>

//         <TabsContent value="queue" className="space-y-4">
//           {queueStats && <QueueMonitor stats={queueStats} />}
//         </TabsContent>

//         <TabsContent value="agents" className="space-y-4">
//           <AgentPerformanceTable metrics={agentMetrics} />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }