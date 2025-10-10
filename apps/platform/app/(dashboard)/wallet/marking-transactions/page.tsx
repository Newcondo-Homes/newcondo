import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Skeleton } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { Badge } from '@newcondo/ui';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { CompensationBreakdown } from '@/components/marking/CompensationBreakdown';
import { MarkingStatusBadge } from '@/components/marking/MarkingStatusBadge';

export const metadata: Metadata = {
  title: 'Marking Transactions | Newcondo',
  description: 'View your property marking service earnings and transactions',
};

export default function MarkingTransactionsPage() {
  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/wallet">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Marking Transactions</h1>
          </div>
          <p className="text-muted-foreground">
            Track your property marking service earnings and payment history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Suspense fallback={<SummaryCardSkeleton />}>
          <SummaryCard title="Total Earned" amount="₦0.00" />
        </Suspense>
        <Suspense fallback={<SummaryCardSkeleton />}>
          <SummaryCard title="Pending" amount="₦0.00" variant="warning" />
        </Suspense>
        <Suspense fallback={<SummaryCardSkeleton />}>
          <SummaryCard title="Completed Jobs" count={0} />
        </Suspense>
        <Suspense fallback={<SummaryCardSkeleton />}>
          <SummaryCard title="Success Rate" percentage="0%" />
        </Suspense>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All marking service payments and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TransactionsListSkeleton />}>
            <MarkingTransactionsList />
          </Suspense>
        </CardContent>
      </Card>

      {/* Compensation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Structure</CardTitle>
          <CardDescription>
            Understand how marking service compensation works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompensationBreakdown />
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder components
function SummaryCard({ 
  title, 
  amount, 
  count, 
  percentage, 
  variant 
}: { 
  title: string;
  amount?: string;
  count?: number;
  percentage?: string;
  variant?: 'default' | 'warning';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variant === 'warning' ? 'text-yellow-600' : ''}`}>
          {amount || count?.toString() || percentage || '—'}
        </div>
      </CardContent>
    </Card>
  );
}

function MarkingTransactionsList() {
  // This will be replaced with actual data fetching
  const transactions: any[] = [];

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-muted-foreground">No marking transactions yet</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/marking/queue">View Available Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{transaction.propertyTitle}</p>
          <MarkingStatusBadge status={transaction.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(transaction.createdAt).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">₦{transaction.amount.toLocaleString()}</p>
        <Badge variant={transaction.isReleased ? 'default' : 'secondary'} className="mt-1">
          {transaction.isReleased ? 'Released' : 'Pending'}
        </Badge>
      </div>
    </div>
  );
}

// Loading skeletons
function SummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  );
}

function TransactionsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}