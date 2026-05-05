// apps/platform/app/(dashboard)/payments/receipt/[paymentId]/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Share2 } from 'lucide-react'
import { Button } from '@newcondo/ui'
import { prisma } from '@newcondo/db';
import { getServerSession } from '@newcondo/auth';
import { PaymentReceipt } from '@/components/payments/PaymentReceipt'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'

interface PageProps {
  params: {
    paymentId: string
  }
}

export const metadata: Metadata = {
  title: 'Payment Receipt | NewCondo',
  description: 'Download and view your payment receipt',
}

async function getPayment(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      rental: {
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          unit: {
            select: { id: true, unitNumber: true },
          },
        },
      },
    },
  });

  if (!payment || payment.userId !== userId) return null;
  return payment;
}


export default async function PaymentReceiptPage({ params }: PageProps) {
  const { paymentId } = params

  const session = await getServerSession();
  if (!session?.user?.id) notFound();

  const payment = await getPayment(paymentId, session.user.id);
  if (!payment) notFound();


  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Receipt',
          text: `Payment receipt for transaction ${paymentId}`,
          url: window.location.href
        })
      } catch {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Shape data into the flat paymentData format the component accepts
  const paymentData = {
    id: payment.id,
    transactionId: payment.transactionId ?? payment.id,
    flutterwaveRef: payment.flutterwaveRef ?? '',
    amount: typeof payment.amount === 'object'
      ? payment.amount.toNumber()
      : Number(payment.amount),
    processingFee: typeof payment.platformFee === 'object'
      ? payment.platformFee?.toNumber()
      : payment.platformFee
        ? Number(payment.platformFee)
        : undefined,
    total: typeof payment.amount === 'object'
      ? payment.amount.toNumber()
      : Number(payment.amount),
    currency: payment.currency,
    paymentMethod: payment.paymentMethod ?? 'bank_transfer',
    paymentType: payment.paymentType as 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING',
    status: payment.status as 'SUCCESS' | 'PENDING' | 'FAILED',
    paidAt: payment.paidAt
      ? payment.paidAt.toISOString()
      : payment.createdAt.toISOString(),
    description: payment.description ?? undefined,
    property: {
      title: payment.rental?.property.title ?? 'N/A',
      address: payment.rental?.property.address ?? 'N/A',
      unitNumber: payment.rental?.unit?.unitNumber,
    },
    landlord: payment.rental?.property.owner
      ? {
        name: payment.rental.property.owner.name ?? 'Property Owner',
        email: payment.rental.property.owner.email,
      }
      : undefined,
    tenant: {
      name: payment.user.name ?? 'Tenant',
      email: payment.user.email,
    },
    rental: payment.rental
      ? {
        startDate: payment.rental.startDate.toISOString(),
        endDate: payment.rental.endDate?.toISOString(),
        monthlyRent: typeof payment.rental.monthlyRent === 'object'
          ? payment.rental.monthlyRent.toNumber()
          : Number(payment.rental.monthlyRent),
      }
      : undefined,
  } satisfies Parameters<typeof PaymentReceipt>[0]['paymentData'];

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/payments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Payment Receipt</h1>
              <p className="text-muted-foreground">
                Transaction ID: {payment.transactionId ?? payment.id}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="print:hidden"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="print:hidden"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Receipt Content */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <PaymentReceipt
            paymentData={paymentData}
            onPrint={() => window.print()}
          />
        </Suspense>
      </div>
    </div>
  )
}