import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@newcondo/auth';
import { prisma } from '@newcondo/db';
import QueuePosition from '@/components/payments/QueuePosition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert';
import { Badge } from '@newcondo/ui/components/badge';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getPaymentQueue(userId: string) {
  const attempts = await prisma.paymentAttemptLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      unit: {
        select: {
          id: true,
          unitNumber: true,
          floor: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get active locks across the platform
  const activeLocks = await prisma.paymentAttemptLog.findMany({
    where: {
      status: 'LOCKED',
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000),
      },
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return { attempts, activeLocks };
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'FAILED':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'LOCKED':
      return <Clock className="h-5 w-5 text-blue-600" />;
    case 'TIMEOUT':
      return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
}

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    SUCCESS: 'default',
    FAILED: 'destructive',
    LOCKED: 'secondary',
    TIMEOUT: 'outline',
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {status}
    </Badge>
  );
}

export default async function PaymentQueuePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/payments/queue');
  }

  const { attempts, activeLocks } = await getPaymentQueue(session.user.id);

  // Check if user has any active locks
  const userActiveLock = attempts.find(
    (attempt) => attempt.status === 'LOCKED' && attempt.lockAcquired
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Payment Queue</h1>
        <p className="text-muted-foreground mb-6">
          Track your payment attempts and view active payment locks
        </p>

        {/* Active Lock Alert */}
        {userActiveLock && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertTitle>You have an active payment lock</AlertTitle>
            <AlertDescription>
              Complete your payment for{' '}
              <Link
                href={`/properties/${userActiveLock.propertyId}`}
                className="font-medium underline"
              >
                {userActiveLock.property?.title}
              </Link>{' '}
              within the next 15 minutes or the lock will expire.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Attempts */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Recent Payment Attempts</CardTitle>
                <CardDescription>
                  Payment attempts from the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attempts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent payment attempts</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <div className="mt-1">{getStatusIcon(attempt.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <Link
                                href={`/properties/${attempt.propertyId}`}
                                className="font-medium hover:underline"
                              >
                                {attempt.property?.title || 'Unknown Property'}
                              </Link>
                              {attempt.unit && (
                                <p className="text-sm text-muted-foreground">
                                  Unit {attempt.unit.unitNumber}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(attempt.status)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Amount: {attempt.amount.toString()} NGN
                            </p>
                            <p>
                              {new Date(attempt.createdAt).toLocaleString()}
                            </p>
                            {attempt.lockDuration && (
                              <p>Lock duration: {attempt.lockDuration}ms</p>
                            )}
                            {attempt.failureReason && (
                              <p className="text-red-600">
                                Reason: {attempt.failureReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Locks Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Payment Locks</CardTitle>
                <CardDescription>
                  Properties currently locked for payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeLocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active locks
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeLocks.slice(0, 10).map((lock, index) => (
                      <div
                        key={lock.id}
                        className="text-sm p-3 bg-secondary/50 rounded-md"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Position {index + 1}</span>
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <p className="text-muted-foreground truncate">
                          {lock.property?.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.floor(
                            (Date.now() - new Date(lock.createdAt).getTime()) / 1000 / 60
                          )}{' '}
                          min ago
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">How Payment Locks Work</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>
                  When you start a payment, the property is locked for 15 minutes
                </p>
                <p>
                  Only one person can pay for a property at a time
                </p>
                <p>
                  After successful payment, the property is automatically delisted
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}