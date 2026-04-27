import { Suspense } from 'react';
import { getServerSession } from '@newcondo/auth';
import { notFound } from 'next/navigation';
import { prisma } from '@newcondo/db';
import { PaymentHistoryTable } from '@/components/payments/PaymentHistoryTable';
import { PaymentStats } from '@/components/payments/PaymentStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';

async function getPaymentHistory(userId: string) {
  const [payments, rentals, stats] = await Promise.all([
    // Get all payments with rental details
    prisma.payment.findMany({
      where: { userId },
      include: {
        rental: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                state: true,
              },
            },
            unit: {
              select: {
                id: true,
                unitNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),

    // Get rentals with confirmation status
    prisma.rental.findMany({
      where: { renterId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        unit: {
          select: {
            unitNumber: true,
          },
        },
        payments: {
          where: {
            status: {
              in: ['HELD', 'RELEASED', 'SUCCESS'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),

    // Get payment statistics
    prisma.payment.groupBy({
      by: ['status'],
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  // Calculate stats
  const totalPaid = stats
    .filter((s) => ['SUCCESS', 'RELEASED'].includes(s.status))
    .reduce((sum, s) => sum + Number(s._sum.amount || 0), 0);

  const totalHeld = stats
    .filter((s) => s.status === 'HELD')
    .reduce((sum, s) => sum + Number(s._sum.amount || 0), 0);

  const totalRefunded = stats
    .filter((s) => s.status === 'REFUNDED')
    .reduce((sum, s) => sum + Number(s._sum.amount || 0), 0);

  const pendingConfirmations = rentals.filter(
    (r) => !r.isConfirmed && r.confirmationDeadline && new Date() < r.confirmationDeadline
  ).length;

  return {
    payments,
    rentals,
    stats: {
      totalPaid,
      totalHeld,
      totalRefunded,
      pendingConfirmations,
      totalTransactions: payments.length,
    },
  };
}

export default async function PaymentHistoryPage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    notFound();
  }

  const { payments, rentals, stats } = await getPaymentHistory(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment History</h1>
        <p className="text-muted-foreground">
          View and manage your payment transactions
        </p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <PaymentStats stats={stats} />
      </Suspense>

      <Tabs defaultValue="all" className="mt-8">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Confirmation ({stats.pendingConfirmations})
          </TabsTrigger>
          <TabsTrigger value="held">Held Funds</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                Complete history of all your payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading payments...</div>}>
                <PaymentHistoryTable payments={payments} rentals={rentals} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Confirmation</CardTitle>
              <CardDescription>
                Rentals awaiting your confirmation within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading...</div>}>
                <PaymentHistoryTable
                  payments={payments.filter((p) => p.status === 'HELD')}
                  rentals={rentals.filter(
                    (r) =>
                      !r.isConfirmed &&
                      r.confirmationDeadline &&
                      new Date() < r.confirmationDeadline
                  )}
                  filterStatus="pending"
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="held" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Held Funds</CardTitle>
              <CardDescription>
                Payments currently held in escrow during confirmation period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading...</div>}>
                <PaymentHistoryTable
                  payments={payments.filter((p) => p.status === 'HELD')}
                  rentals={rentals}
                  filterStatus="held"
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed Payments</CardTitle>
              <CardDescription>
                Successfully completed and released payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading...</div>}>
                <PaymentHistoryTable
                  payments={payments.filter((p) =>
                    ['SUCCESS', 'RELEASED'].includes(p.status)
                  )}
                  rentals={rentals}
                  filterStatus="completed"
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunded" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Refunded Payments</CardTitle>
              <CardDescription>
                Payments that have been refunded to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading...</div>}>
                <PaymentHistoryTable
                  payments={payments.filter((p) => p.status === 'REFUNDED')}
                  rentals={rentals}
                  filterStatus="refunded"
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
    title: 'Payment History | Newcondo',
    description: 'View and manage your payment transactions',
  };
}