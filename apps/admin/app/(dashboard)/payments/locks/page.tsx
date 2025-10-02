import { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentLocksTable } from '@/components/admin/payments/PaymentLocksTable';
import { PaymentLockStats } from '@/components/admin/payments/PaymentLockStats';
import { PaymentLockFilters } from '@/components/admin/payments/PaymentLockFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Payment Locks Monitoring | Admin Dashboard',
  description: 'Monitor and manage payment locks to prevent double bookings',
};

export default function PaymentLocksPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Lock Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Real-time monitoring of property payment locks and booking attempts
        </p>
      </div>

      {/* Statistics Cards */}
      <Suspense fallback={<LoadingSpinner />}>
        <PaymentLockStats />
      </Suspense>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Locks</CardTitle>
          <CardDescription>
            Filter payment locks by property, status, or time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentLockFilters />
        </CardContent>
      </Card>

      {/* Payment Locks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active & Recent Payment Locks</CardTitle>
          <CardDescription>
            View all payment locks and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSpinner />}>
            <PaymentLocksTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}