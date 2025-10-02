import { Metadata } from 'next';
import { Suspense } from 'react';
import { ConflictsTable } from '@/components/admin/payments/ConflictsTable';
import { ConflictStats } from '@/components/admin/payments/ConflictStats';
import { ConflictFilters } from '@/components/admin/payments/ConflictFilters';
import { ConflictTimeline } from '@/components/admin/payments/ConflictTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui';
import { AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Payment Conflicts | Admin Dashboard',
  description: 'Resolve payment conflicts and double booking attempts',
};

export default function PaymentConflictsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Conflict Resolution</h1>
        <p className="text-muted-foreground mt-2">
          Manage and resolve payment conflicts and double booking attempts
        </p>
      </div>

      {/* Alert for urgent conflicts */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Active Conflicts Detected</AlertTitle>
        <AlertDescription>
          There are payment conflicts that require immediate attention. Review and resolve them below.
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      <Suspense fallback={<LoadingSpinner />}>
        <ConflictStats />
      </Suspense>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Conflicts</CardTitle>
          <CardDescription>
            Filter conflicts by severity, property, or resolution status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConflictFilters />
        </CardContent>
      </Card>

      {/* Conflict Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Conflict Timeline</CardTitle>
          <CardDescription>
            Visual timeline of payment attempts and conflicts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSpinner />}>
            <ConflictTimeline />
          </Suspense>
        </CardContent>
      </Card>

      {/* Conflicts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Conflicts</CardTitle>
          <CardDescription>
            Complete list of payment conflicts requiring resolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSpinner />}>
            <ConflictsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}