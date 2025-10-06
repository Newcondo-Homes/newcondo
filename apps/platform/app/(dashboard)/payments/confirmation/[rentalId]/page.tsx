import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@newcondo/auth';
import { prisma } from '@newcondo/db';
import { ConfirmationInterface } from '@/components/payments/ConfirmationInterface';
import { ConfirmationSkeleton } from '@/components/payments/ConfirmationSkeleton';

interface PageProps {
  params: {
    rentalId: string;
  };
}

async function getRentalDetails(rentalId: string, userId: string) {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: {
      property: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      unit: {
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      renter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        where: {
          status: {
            in: ['HELD', 'SUCCESS'],
          },
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

  return rental;
}

export default async function ConfirmationPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    notFound();
  }

  const rental = await getRentalDetails(params.rentalId, session.user.id);

  if (!rental) {
    notFound();
  }

  // Calculate time remaining in confirmation period
  const now = new Date();
  const confirmationDeadline = rental.confirmationDeadline;
  const timeRemaining = confirmationDeadline
    ? Math.max(0, confirmationDeadline.getTime() - now.getTime())
    : 0;

  // Check if confirmation period has expired
  const isExpired = timeRemaining === 0 && !rental.isConfirmed;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Suspense fallback={<ConfirmationSkeleton />}>
        <ConfirmationInterface
          rental={rental}
          timeRemaining={timeRemaining}
          isExpired={isExpired}
        />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: 'Confirm Property | Newcondo',
    description: 'Confirm your property rental within 24 hours',
  };
}