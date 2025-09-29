import { Suspense } from 'react';
import { AccountReconciliationPanel } from '@/components/admin/AccountReconciliationPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Skeleton } from '@newcondo/ui';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui';

export default function ReconciliationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Reconciliation</h1>
        <p className="text-muted-foreground">
          Reconcile virtual accounts with payment gateway records
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Reconciliation compares virtual account balances with Flutterwave records.
          Discrepancies should be investigated and resolved promptly.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconciled Today</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-20" />}>
              <ReconciliationStats type="reconciled" />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-20" />}>
              <ReconciliationStats type="pending" />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-20" />}>
              <ReconciliationStats type="discrepancies" />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<PanelSkeleton />}>
        <AccountReconciliationPanel />
      </Suspense>
    </div>
  );
}

async function ReconciliationStats({ type }: { type: 'reconciled' | 'pending' | 'discrepancies' }) {
  const stats = {
    reconciled: '234',
    pending: '12',
    discrepancies: '3'
  };

  return (
    <div className="text-2xl font-bold">
      {stats[type]}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
  );
}