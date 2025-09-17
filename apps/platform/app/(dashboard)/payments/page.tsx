// apps/platform/app/(dashboard)/payments/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import PaymentHistory from '@/components/payments/PaymentHistory'
import LoadingSpinner from '@/components/shared/feedback/LoadingSpinner'

export const metadata: Metadata = {
  title: 'Payment History | NewCondo',
  description: 'View your payment history and transaction records',
}

export default function PaymentsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">
            View all your payment transactions and receipts
          </p>
        </div>
        
        <Suspense 
          fallback={
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <PaymentHistory />
        </Suspense>
      </div>
    </div>
  )
}