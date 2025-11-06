import { Suspense } from 'react';
import { Metadata } from 'next';
import TransactionChart from '@/components/analytics/TransactionChart';
import TransactionTable from '@/components/analytics/TransactionTable';
import DateRangeFilter from '@/components/analytics/DateRangeFilter';
import CategoryFilter from '@/components/analytics/CategoryFilter';
import ExportOptions from '@/components/analytics/ExportOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Transaction Analytics | Newcondo Admin',
  description: 'Payment and transaction monitoring',
};

export default function TransactionAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Analytics</h1>
          <p className="text-muted-foreground">
            Monitor payment activity and transaction health
          </p>
        </div>
        <div className="flex gap-2">
          <DateRangeFilter />
          <CategoryFilter />
          <ExportOptions />
        </div>
      </div>

      {/* Transaction KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">15,234</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+1,432</span> this month
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">14,123</div>
              <p className="text-xs text-muted-foreground">
                92.7% success rate
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">892</div>
              <p className="text-xs text-muted-foreground">
                5.9% failure rate
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">219</div>
              <p className="text-xs text-muted-foreground">
                1.4% pending
              </p>
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
          <CardDescription>Daily transaction volume and success rate</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-80" />}>
            <TransactionChart />
          </Suspense>
        </CardContent>
      </Card>

      {/* Transaction Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
            <CardDescription>Breakdown by transaction type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rent Payments</span>
                <span className="text-sm text-muted-foreground">12,456 (81.8%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Property Marking</span>
                <span className="text-sm text-muted-foreground">1,245 (8.2%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Premium Upgrades</span>
                <span className="text-sm text-muted-foreground">987 (6.5%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deposits</span>
                <span className="text-sm text-muted-foreground">546 (3.5%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Card Payment</span>
                <span className="text-sm text-muted-foreground">9,876 (64.8%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bank Transfer</span>
                <span className="text-sm text-muted-foreground">3,456 (22.7%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">USSD</span>
                <span className="text-sm text-muted-foreground">1,234 (8.1%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Virtual Account</span>
                <span className="text-sm text-muted-foreground">668 (4.4%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activities on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96" />}>
            <TransactionTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}