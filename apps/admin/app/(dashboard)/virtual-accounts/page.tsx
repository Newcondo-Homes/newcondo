import { Suspense } from 'react';
import { VirtualAccountTable } from '@/components/admin/VirtualAccountTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Skeleton } from '@newcondo/ui';

export default function VirtualAccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Virtual Accounts</h1>
        <p className="text-muted-foreground">
          Manage virtual accounts for property owners, agents, and marking services
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-20" />}>
              <AccountStats type="total" />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-20" />}>
              <AccountStats type="active" />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-32" />}>
              <AccountStats type="balance" />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Virtual Accounts</CardTitle>
          <CardDescription>
            View and manage all virtual accounts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableSkeleton />}>
            <VirtualAccountTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function AccountStats({ type }: { type: 'total' | 'active' | 'balance' }) {
  // This would fetch from your API
  const stats = {
    total: '1,234',
    active: '1,156',
    balance: '₦45,678,900.00'
  };

  return (
    <div className="text-2xl font-bold">
      {stats[type]}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}