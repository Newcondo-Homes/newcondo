import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletBalance } from '@/components/admin/wallet/WalletBalance';
import { TransactionHistory } from '@/components/admin/wallet/TransactionHistory';
import { RevenueChart } from '@/components/admin/wallet/RevenueChart';
import { CommissionBreakdown } from '@/components/admin/wallet/CommissionBreakdown';
import { WithdrawalSettings } from '@/components/admin/wallet/WithdrawalSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, TrendingUp } from 'lucide-react';

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Newcondo Wallet
        </h1>
        <p className="text-muted-foreground mt-2">
          Platform virtual account and revenue tracking
        </p>
      </div>

      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>Revenue Sources</AlertTitle>
        <AlertDescription>
          Platform earns 20% commission on all successful rentals and 100%
          non-refundable service fees on all transactions.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <WalletBalance />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <RevenueChart />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission Breakdown</CardTitle>
            <CardDescription>Revenue by source</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <CommissionBreakdown />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All incoming payments to Newcondo virtual account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="service-fees">Service Fees</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TransactionHistory type="ALL" />
              </Suspense>
            </TabsContent>

            <TabsContent value="commissions" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TransactionHistory type="COMMISSION" />
              </Suspense>
            </TabsContent>

            <TabsContent value="service-fees" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TransactionHistory type="SERVICE_FEE" />
              </Suspense>
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TransactionHistory type="WITHDRAWAL" />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Settings</CardTitle>
          <CardDescription>
            Configure automatic withdrawals to company bank account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <WithdrawalSettings />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}