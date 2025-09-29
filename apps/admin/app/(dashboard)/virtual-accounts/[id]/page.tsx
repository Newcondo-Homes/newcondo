import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { VirtualAccountDetails } from '@/components/admin/VirtualAccountDetails';
import { VirtualAccountAudit } from '@/components/admin/VirtualAccountAudit';
import { AccountStatementGenerator } from '@/components/admin/AccountStatementGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
import { Skeleton } from '@newcondo/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default function VirtualAccountDetailPage({ params }: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/virtual-accounts"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Virtual Accounts
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Virtual Account Details</h1>
        <p className="text-muted-foreground">
          View and manage virtual account information
        </p>
      </div>

      <Suspense fallback={<DetailsSkeleton />}>
        <VirtualAccountDetails accountId={params.id} />
      </Suspense>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TransactionHistory accountId={params.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <VirtualAccountAudit accountId={params.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="statements" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <AccountStatementGenerator accountId={params.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function TransactionHistory({ accountId }: { accountId: string }) {
  // Fetch transaction history from API
  return (
    <div className="text-sm text-muted-foreground">
      Transaction history will be displayed here
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
