import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@newcondo/auth';
import { notFound } from 'next/navigation';
import { prisma } from '@newcondo/db';
import { WalletBalance } from '@/components/profile/WalletBalance';
import { WithdrawalForm } from '@/components/profile/WithdrawalForm';
import { TransactionHistory } from '@/components/profile/TransactionHistory';
import { AutoWithdrawalSettings } from '@/components/profile/AutoWithdrawalSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
import { Wallet, ArrowDownToLine, History, Settings } from 'lucide-react';

async function getWalletData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  // Get virtual account(s)
  const virtualAccounts = await prisma.virtualAccount.findMany({
    where: { userId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          address: true,
        },
      },
    },
  });

  // Get pending releases (payments that will be released soon)
  const pendingReleases = await prisma.payment.findMany({
    where: {
      userId,
      status: 'HELD',
      confirmationPeriodEnd: {
        gte: new Date(),
      },
    },
    include: {
      rental: {
        include: {
          property: {
            select: {
              title: true,
              address: true,
            },
          },
        },
      },
    },
    orderBy: {
      confirmationPeriodEnd: 'asc',
    },
  });

  // Get recent transactions (released payments)
  const recentTransactions = await prisma.payment.findMany({
    where: {
      userId,
      status: {
        in: ['RELEASED', 'SUCCESS'],
      },
    },
    include: {
      rental: {
        include: {
          property: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      releasedAt: 'desc',
    },
    take: 20,
  });

  // Calculate total balance across all virtual accounts
  const totalBalance = virtualAccounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0
  );

  // Calculate pending amount
  const pendingAmount = pendingReleases.reduce(
    (sum, payment) => sum + Number(payment.ownerAmount || payment.agentCommission || 0),
    0
  );

  return {
    user,
    virtualAccounts,
    pendingReleases,
    recentTransactions,
    totalBalance,
    pendingAmount,
  };
}

export default async function WalletPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    notFound();
  }

  const walletData = await getWalletData(session.user.id);

  if (!walletData) {
    notFound();
  }

  const {
    user,
    virtualAccounts,
    pendingReleases,
    recentTransactions,
    totalBalance,
    pendingAmount,
  } = walletData;

  // Check if user has role that can receive payments
  const canReceivePayments = ['OWNER', 'AGENT'].includes(user.role);

  if (!canReceivePayments) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Not Available</CardTitle>
            <CardDescription>
              Virtual wallet is only available for property owners and agents.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
        <p className="text-muted-foreground">
          Manage your virtual account balance and withdrawals
        </p>
      </div>

      <Suspense fallback={<div>Loading wallet...</div>}>
        <WalletBalance
          totalBalance={totalBalance}
          pendingAmount={pendingAmount}
          virtualAccounts={virtualAccounts}
          pendingReleases={pendingReleases}
        />
      </Suspense>

      <Tabs defaultValue="withdraw" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="withdraw" className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Withdraw
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>
                Transfer available balance to your bank account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading form...</div>}>
                <WithdrawalForm
                  virtualAccounts={virtualAccounts}
                  totalBalance={totalBalance}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View your recent payment releases and withdrawals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading history...</div>}>
                <TransactionHistory transactions={recentTransactions} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Withdrawal Settings</CardTitle>
              <CardDescription>
                Configure automatic transfers to your bank account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading settings...</div>}>
                <AutoWithdrawalSettings
                  userId={user.id}
                  virtualAccounts={virtualAccounts}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'My Wallet | Newcondo',
    description: 'Manage your virtual account balance and withdrawals',
  };
}