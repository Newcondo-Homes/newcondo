import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmationsTable } from '@/components/admin/confirmations/ConfirmationsTable';
import { ConfirmationStats } from '@/components/admin/confirmations/ConfirmationStats';
import { ConfirmationFilters } from '@/components/admin/confirmations/ConfirmationFilters';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConfirmationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Confirmations</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage payment confirmation periods
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <ConfirmationStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Confirmation Tracking</CardTitle>
          <CardDescription>
            All payments in confirmation period (24 hours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pending Confirmation</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>

            <ConfirmationFilters />

            <TabsContent value="pending" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ConfirmationsTable status="PENDING" />
              </Suspense>
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ConfirmationsTable status="CONFIRMED" />
              </Suspense>
            </TabsContent>

            <TabsContent value="disputed" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ConfirmationsTable status="DISPUTED" />
              </Suspense>
            </TabsContent>

            <TabsContent value="expired" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ConfirmationsTable status="EXPIRED" />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}