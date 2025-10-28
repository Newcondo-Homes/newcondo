// apps/admin/src/app/(dashboard)/marking-jobs/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { MarkingJobList } from '@/components/admin/marking-jobs/MarkingJobList';
import { MarkingJobFilters } from '@/components/admin/marking-jobs/MarkingJobFilters';
import { MarkingJobStats } from '@/components/admin/marking-jobs/MarkingJobStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { Users, Clock } from 'lucide-react';

export const metadata = {
  title: 'Marking Jobs | Admin Dashboard',
  description: 'Manage property marking jobs and agent assignments',
};

export default function MarkingJobsPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    urgency?: string;
    dateFrom?: string;
    dateTo?: string;
    assignedAgent?: string;
    search?: string;
    page?: string;
  };
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Marking Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Oversee property marking requests, agent assignments, and job completion
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/marking-jobs/queue">
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              View Queue
            </Button>
          </Link>
          <Link href="/admin/marking-jobs/agents">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Manage Agents
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <Suspense fallback={<StatsLoading />}>
        <MarkingJobStats />
      </Suspense>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Marking Jobs</CardTitle>
          <CardDescription>
            Search and filter jobs by status, urgency, agent, and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarkingJobFilters />
        </CardContent>
      </Card>

      {/* Marking Job List */}
      <Card>
        <CardHeader>
          <CardTitle>All Marking Jobs</CardTitle>
          <CardDescription>
            {searchParams.status && `Showing ${searchParams.status.toLowerCase()} jobs`}
            {searchParams.urgency && ` • ${searchParams.urgency} urgency`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<MarkingJobListLoading />}>
            <MarkingJobList searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MarkingJobListLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <div className="h-12 w-12 bg-muted animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}