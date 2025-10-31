// apps/admin/src/app/(dashboard)/marking-jobs/agents/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { AgentList } from '@/components/admin/marking-jobs/AgentList';
import { AgentStats } from '@/components/admin/marking-jobs/AgentStats';
import { AgentFilters } from '@/components/admin/marking-jobs/AgentFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { ArrowLeft, UserPlus } from 'lucide-react';

export const metadata = {
  title: 'Marking Agents | Admin Dashboard',
  description: 'Manage agents available for property marking jobs',
};

export default function AgentsPage({
  searchParams,
}: {
  searchParams: {
    availability?: string;
    state?: string;
    city?: string;
    minRating?: string;
    search?: string;
    page?: string;
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
            <h1 className="text-3xl font-bold tracking-tight">Marking Agents</h1>
            <p className="text-muted-foreground mt-2">
              Manage agents available for property marking services
            </p>
          </div>
        </div>
      </div>

      {/* Agent Stats */}
      <Suspense fallback={<StatsLoading />}>
        <AgentStats />
      </Suspense>

      {/* Agent Information */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">Agent Requirements & Compensation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-purple-800 space-y-2">
          <p>
            • Agents must submit their <strong>location details</strong> to receive marking job alerts
          </p>
          <p>
            • Agents are notified of jobs within their <strong>reasonable proximity</strong> (service areas)
          </p>
          <p>
            • Commission: <strong>₦5,000 (25%)</strong> per completed marking job
          </p>
          <p>
            • Initial payment: <strong>₦1,000</strong> upon marking (held until property owner confirms)
          </p>
          <p>
            • Remaining balance released after property owner confirmation
          </p>
          <p>
            • Agents must complete jobs within <strong>3-hour time slots</strong>
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Agents</CardTitle>
          <CardDescription>
            Search and filter agents by location, availability, and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentFilters />
        </CardContent>
      </Card>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle>All Marking Agents</CardTitle>
          <CardDescription>
            {searchParams.availability && `Showing ${searchParams.availability} agents`}
            {searchParams.state && ` in ${searchParams.state}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AgentListLoading />}>
            <AgentList searchParams={searchParams} />
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

function AgentListLoading() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            <div className="flex gap-2 mt-2">
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}