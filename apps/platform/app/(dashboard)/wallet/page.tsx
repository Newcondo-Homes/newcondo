import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Skeleton } from '@newcondo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { ArrowRight, Wallet, TrendingUp, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wallet | Newcondo',
  description: 'Manage your virtual account and transactions',
};

export default function WalletPage() {
  return (
    <div className="container max-w-7xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground mt-2">
            Manage your virtual account and view transaction history
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/wallet/withdraw">Withdraw Funds</Link>
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Suspense fallback={<BalanceCardSkeleton />}>
          <BalanceCard
            title="Total Balance"
            icon={<Wallet className="h-4 w-4" />}
            type="total"
          />
        </Suspense>
        <Suspense fallback={<BalanceCardSkeleton />}>
          <BalanceCard
            title="Available Balance"
            icon={<TrendingUp className="h-4 w-4" />}
            type="available"
          />
        </Suspense>
        <Suspense fallback={<BalanceCardSkeleton />}>
          <BalanceCard
            title="Pending Balance"
            icon={<Clock className="h-4 w-4" />}
            type="pending"
          />
        </Suspense>
      </div>

      {/* Transactions Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View all your wallet transactions including marking payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="rent">Rent</TabsTrigger>
              <TabsTrigger value="marking">Marking</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <Suspense fallback={<TransactionsSkeleton />}>
                <AllTransactions />
              </Suspense>
            </TabsContent>
            <TabsContent value="rent" className="space-y-4">
              <Suspense fallback={<TransactionsSkeleton />}>
                <RentTransactions />
              </Suspense>
            </TabsContent>
            <TabsContent value="marking" className="space-y-4">
              <Suspense fallback={<TransactionsSkeleton />}>
                <MarkingTransactionsLink />
              </Suspense>
            </TabsContent>
            <TabsContent value="withdrawals" className="space-y-4">
              <Suspense fallback={<TransactionsSkeleton />}>
                <WithdrawalTransactions />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder component for balance card
function BalanceCard({ 
  title, 
  icon, 
  type 
}: { 
  title: string; 
  icon: React.ReactNode; 
  type: 'total' | 'available' | 'pending';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₦0.00</div>
        <p className="text-xs text-muted-foreground mt-1">
          {type === 'pending' && 'Awaiting confirmation'}
        </p>
      </CardContent>
    </Card>
  );
}

// Placeholder components
function AllTransactions() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center py-8">
        No transactions yet
      </p>
    </div>
  );
}

function RentTransactions() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center py-8">
        No rent transactions yet
      </p>
    </div>
  );
}

function MarkingTransactionsLink() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        View detailed marking service transactions
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard/wallet/marking-transactions">
          View Marking Transactions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function WithdrawalTransactions() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center py-8">
        No withdrawal transactions yet
      </p>
    </div>
  );
}

// Loading skeletons
function BalanceCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-24 mt-1" />
      </CardContent>
    </Card>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}