import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisputesTable } from '@/components/admin/disputes/DisputesTable';
import { DisputeStats } from '@/components/admin/disputes/DisputeStats';
import { DisputeFilters } from '@/components/admin/disputes/DisputeFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function DisputesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispute Management</h1>
        <p className="text-muted-foreground mt-2">
          Handle payment disputes and refund requests
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Service fees are non-refundable. Ensure all disputes are thoroughly
          reviewed before processing refunds.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <DisputeStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Cases</CardTitle>
          <CardDescription>
            All payment disputes requiring admin review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="investigating">Under Investigation</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <DisputeFilters />

            <TabsContent value="pending" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DisputesTable status="PENDING" />
              </Suspense>
            </TabsContent>

            <TabsContent value="investigating" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DisputesTable status="INVESTIGATING" />
              </Suspense>
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DisputesTable status="RESOLVED" />
              </Suspense>
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DisputesTable status="REJECTED" />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}