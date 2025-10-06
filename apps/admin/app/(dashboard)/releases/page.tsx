import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReleasesTable } from '@/components/admin/releases/ReleasesTable';
import { ReleaseStats } from '@/components/admin/releases/ReleaseStats';
import { ReleaseSchedule } from '@/components/admin/releases/ReleaseSchedule';
import { ReleaseFilters } from '@/components/admin/releases/ReleaseFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock } from 'lucide-react';

export default function ReleasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Payment Release Monitoring
        </h1>
        <p className="text-muted-foreground mt-2">
          Track automated commission distribution and fund releases
        </p>
      </div>

      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Automated Process</AlertTitle>
        <AlertDescription>
          Funds are automatically released 24 hours after payment if no dispute is
          filed. Commission distribution happens immediately after release.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <ReleaseStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Release Schedule</CardTitle>
          <CardDescription>
            Upcoming automated fund releases in the next 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <ReleaseSchedule />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Release History</CardTitle>
          <CardDescription>All payment releases and distributions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scheduled" className="space-y-4">
            <TabsList>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="released">Released</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <ReleaseFilters />

            <TabsContent value="scheduled" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ReleasesTable status="SCHEDULED" />
              </Suspense>
            </TabsContent>

            <TabsContent value="released" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ReleasesTable status="RELEASED" />
              </Suspense>
            </TabsContent>

            <TabsContent value="failed" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ReleasesTable status="FAILED" />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}