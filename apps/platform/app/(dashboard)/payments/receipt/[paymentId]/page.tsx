// apps/platform/app/(dashboard)/payments/receipt/[paymentId]/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Download, ArrowLeft, Printer, Share2 } from 'lucide-react'
import { Button } from '@newcondo/ui'
import PaymentReceipt from '@/components/payments/PaymentReceipt'
import LoadingSpinner from '@/components/shared/feedback/LoadingSpinner'

interface PageProps {
  params: {
    paymentId: string
  }
}

export const metadata: Metadata = {
  title: 'Payment Receipt | NewCondo',
  description: 'Download and view your payment receipt',
}

export default async function PaymentReceiptPage({ params }: PageProps) {
  const { paymentId } = params

  if (!paymentId) {
    return notFound()
  }

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
      } catch (err) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
    }
  }

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
                Transaction ID: {paymentId}
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
            paymentId={paymentId} 
            showActions={true}
            isFullPage={true}
          />
        </Suspense>
      </div>
    </div>
  )
}