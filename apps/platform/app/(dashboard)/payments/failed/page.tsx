// apps/platform/app/(dashboard)/payments/failed/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { XCircle, RefreshCcw, Home, HelpCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@newcondo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'
import PaymentRetry from '@/components/payments/PaymentRetry'

export const metadata: Metadata = {
  title: 'Payment Failed | NewCondo',
  description: 'Payment could not be processed',
}

interface PageProps {
  searchParams: Promise<{
    paymentId?: string
    amount?: string
    propertyId?: string
    transactionId?: string
    error?: string
    reason?: string
  }>
}

export default async function PaymentFailedPage({ searchParams }: PageProps) {
  const { paymentId, amount, propertyId, transactionId, error, reason } = await searchParams

  const formattedAmount = amount ?
    `₦${parseInt(amount).toLocaleString()}` :
    '₦0'

  // Common failure reasons and their user-friendly messages
  const getFailureMessage = (error?: string, reason?: string) => {
    if (reason) {
      switch (reason.toLowerCase()) {
        case 'insufficient_funds':
          return 'Insufficient funds in your account'
        case 'card_declined':
          return 'Your card was declined by the bank'
        case 'expired_card':
          return 'Your card has expired'
        case 'invalid_cvv':
          return 'Invalid CVV code entered'
        case 'network_error':
          return 'Network connection error occurred'
        case 'bank_error':
          return 'Bank processing error'
        case 'timeout':
          return 'Payment request timed out'
        default:
          return reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }
    }
    return error || 'Payment could not be processed'
  }

  const failureMessage = getFailureMessage(error, reason)

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="space-y-6">
        {/* Failure Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-red-900">Payment Failed</h1>
            <p className="text-lg text-muted-foreground">
              Your payment of {formattedAmount} could not be processed
            </p>
          </div>
        </div>

        {/* Error Details Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Information about the failed transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactionId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm">{transactionId}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">{formattedAmount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="destructive">
                Failed
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Failure Reason</span>
              <span className="text-sm text-red-700">{failureMessage}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="text-sm">{new Date().toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Retry Payment Section */}
        {propertyId && paymentId && (
          <PaymentRetry
            payment={{
              id: paymentId,
              userId: '',           // not available from search params, backend will resolve
              amount: amount ? parseInt(amount) : 0,
              currency: 'NGN',
              paymentType: 'RENT',
              status: 'FAILED',
              isReleased: false,
              failureReason: failureMessage,
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
          />
        )}

        {/* Troubleshooting Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Troubleshooting Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium">Check your account balance</p>
                  <p className="text-muted-foreground">Ensure you have sufficient funds for this payment</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium">Verify your card details</p>
                  <p className="text-muted-foreground">Make sure your card number, expiry date, and CVV are correct</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium">Check your internet connection</p>
                  <p className="text-muted-foreground">A stable connection is required for payment processing</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium">Contact your bank</p>
                  <p className="text-muted-foreground">Your bank might have blocked the transaction for security reasons</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium">Try a different payment method</p>
                  <p className="text-muted-foreground">Use another card or bank transfer if available</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {propertyId && (
            <Button asChild className="flex-1">
              <Link href={`/dashboard/payments/rent/${propertyId}`}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Link>
            </Button>
          )}

          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard/payments">
              View Payment History
            </Link>
          </Button>

          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Support Contact */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700">
            <p className="text-sm mb-3">
              If you continue to experience issues with your payment, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" variant="outline" asChild className="border-amber-300 text-amber-800 hover:bg-amber-100">
                <Link href="mailto:support@newcondo.com">
                  Email Support
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="border-amber-300 text-amber-800 hover:bg-amber-100">
                <Link href="tel:+2348012345678">
                  Call Support
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="border-amber-300 text-amber-800 hover:bg-amber-100">
                <Link href="/dashboard/support">
                  Create Ticket
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}