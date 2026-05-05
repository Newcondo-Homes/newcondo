import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@newcondo/auth';
import { prisma } from '@newcondo/db';
import { DisputeForm } from '@/components/payments/DisputeForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui';

interface PageProps {
  params: {
    rentalId: string;
  };
}

async function getRentalForDispute(rentalId: string, userId: string) {
  //TODO: send this to the proper express backend
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
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
      payments: {
        where: {
          status: 'HELD',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!rental) {
    return null;
  }

  // Verify the user is the renter
  if (rental.renterId !== userId) {
    return null;
  }

  // Check if rental is in valid state for disputes
  if (rental.isConfirmed) {
    return { rental, canDispute: false, reason: 'already_confirmed' };
  }

  // Check if confirmation period has expired
  if (rental.confirmationDeadline && new Date() > rental.confirmationDeadline) {
    return { rental, canDispute: false, reason: 'period_expired' };
  }

  // Check if there's a held payment
  if (!rental.payments || rental.payments.length === 0) {
    return { rental, canDispute: false, reason: 'no_payment' };
  }

  return { rental, canDispute: true };
}

export default async function DisputePage({ params }: PageProps) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    notFound();
  }

  const result = await getRentalForDispute(params.rentalId, session.user.id);

  if (!result) {
    notFound();
  }

  const { rental, canDispute, reason } = result;

  // Redirect if cannot dispute
  if (!canDispute) {
    if (reason === 'already_confirmed') {
      redirect(`/dashboard/payments/confirmation/${params.rentalId}?error=already_confirmed`);
    } else if (reason === 'period_expired') {
      redirect(`/dashboard/payments/confirmation/${params.rentalId}?error=expired`);
    } else if (reason === 'no_payment') {
      redirect(`/dashboard/payments/history?error=no_payment`);
    }
  }

  const timeRemaining = rental.confirmationDeadline
    ? Math.max(0, rental.confirmationDeadline.getTime() - new Date().getTime())
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Submit Dispute</h1>
        <p className="text-muted-foreground">
          Request a refund for your rental payment
        </p>
      </div>

      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Please note that the platform service fee is non-refundable. Only the rental amount
          will be refunded if your dispute is approved. You have{' '}
          {Math.floor(timeRemaining / (1000 * 60 * 60))} hours and{' '}
          {Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))} minutes remaining
          to submit a dispute.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
          <CardDescription>
            {rental.property.title} - {rental.property.address}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">
                {rental.property.city}, {rental.property.state}
              </span>
            </div>
            {rental.unit && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit:</span>
                <span className="font-medium">{rental.unit.unitNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Amount:</span>
              <span className="font-medium">
                ₦{rental.monthlyRent.toLocaleString()}
              </span>
            </div>
          </div>

          <Suspense fallback={<div>Loading form...</div>}>
            <DisputeForm
              rentalId={rental.id}
              paymentId={rental.payments[0]?.id}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Submit Dispute | Newcondo',
    description: 'Submit a dispute for your rental payment',
  };
}