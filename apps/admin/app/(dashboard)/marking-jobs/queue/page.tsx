// apps/admin/src/app/(dashboard)/marking-jobs/queue/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { QueueList } from '@/components/admin/marking-jobs/QueueList';
import { QueueStats } from '@/components/admin/marking-jobs/QueueStats';
import { QueueFilters } from '@/components/admin/marking-jobs/QueueFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Agent Queue | Admin Dashboard',
  description: 'Manage agent queue for property marking jobs',
};

export default function QueuePage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    agentId?: string;
    search?: string;
  };
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/marking-jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Queue</h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage the agent queue system for marking jobs
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Queue
        </Button>
      </div>

      {/* Queue Stats */}
      <Suspense fallback={<StatsLoading />}>
        <QueueStats />
      </Suspense>

      {/* How Queue Works */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">How the Queue System Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • Agents are assigned in a <strong>first-come-first-served</strong> order
          </p>
          <p>
            • Each agent has a <strong>3-hour time slot</strong> to complete the marking
          </p>
          <p>
            • If an agent doesn't complete within the time limit, the job is <strong>automatically reassigned</strong> to the next agent in queue
          </p>
          <p>
            • Property owners have a <strong>maximum of 3 days</strong> from the first marking attempt
          </p>
          <p>
            • Agents receive <strong>25% commission</strong> (₦5,000) and platform retains 75% (₦15,000)
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Queue</CardTitle>
          <CardDescription>
            Search and filter queue entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueueFilters />
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Queue</CardTitle>
          <CardDescription>
            Active agents in the marking job queue with time slot information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<QueueListLoading />}>
            <QueueList searchParams={searchParams} />
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

function QueueListLoading() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}