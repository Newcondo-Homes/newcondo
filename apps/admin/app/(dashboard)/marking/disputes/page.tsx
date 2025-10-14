/**
 * apps/admin/src/app/(dashboard)/marking/disputes/page.tsx
 * Admin page for viewing and managing marking job disputes
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import MarkingDisputeList from '@/components/marking/MarkingDisputeList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Marking Disputes | Admin Dashboard',
  description: 'Manage property marking job disputes and conflicts',
};

// Stats component
function DisputeStats() {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+3 from last week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Review</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">Being investigated</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">145</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
          <Clock className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2.3h</div>
          <p className="text-xs text-muted-foreground">-0.5h from last week</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading component
function DisputeListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MarkingDisputesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marking Disputes</h1>
        <p className="text-muted-foreground mt-2">
          Review and resolve disputes related to property marking jobs
        </p>
      </div>

      {/* Stats */}
      <DisputeStats />

      {/* Disputes List with Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Open Disputes</TabsTrigger>
          <TabsTrigger value="review">In Review</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Disputes</CardTitle>
              <CardDescription>
                Disputes that require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<DisputeListSkeleton />}>
                <MarkingDisputeList status="OPEN" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disputes Under Review</CardTitle>
              <CardDescription>
                Disputes currently being investigated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<DisputeListSkeleton />}>
                <MarkingDisputeList status="IN_REVIEW" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Disputes</CardTitle>
              <CardDescription>
                Previously resolved dispute cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<DisputeListSkeleton />}>
                <MarkingDisputeList status="RESOLVED" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Disputes</CardTitle>
              <CardDescription>
                Complete list of all marking disputes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<DisputeListSkeleton />}>
                <MarkingDisputeList />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}