// apps/platform/app/(dashboard)/payments/success/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Download, Home, Receipt, Clock } from 'lucide-react'
import { Button } from '@newcondo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'

export const metadata: Metadata = {
  title: 'Payment Successful | NewCondo',
  description: 'Your payment has been processed successfully',
}

interface PageProps {
  searchParams: Promise<{
    paymentId?: string
    amount?: string
    propertyId?: string
    transactionId?: string
  }>
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const { paymentId, amount, transactionId } = await searchParams

  // Format amount for display
  const formattedAmount = amount ?
    `₦${parseInt(amount).toLocaleString()}` :
    '₦0'

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900">Payment Successful!</h1>
            <p className="text-lg text-muted-foreground">
              Your payment of {formattedAmount} has been processed successfully
            </p>
          </div>
        </div>

        {/* Payment Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Your transaction has been completed
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
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="text-lg font-bold">{formattedAmount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Status</span>
              <Badge className="bg-green-100 text-green-800">
                Successful
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="text-sm">Flutterwave</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="text-sm">{new Date().toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Period Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Confirmation Period
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <p className="text-sm">
              Your payment is now in a 7-day confirmation period. During this time:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Your funds are held securely</li>
              <li>The landlord will confirm the rental arrangement</li>
              <li>You&apos;ll receive a confirmation notification once complete</li>
              <li>If no issues arise, funds will be released automatically</li>
            </ul>
            {paymentId && (
              <div className="mt-4">
                <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800">
                  <Link href={`/dashboard/payments/confirmation/${paymentId}`}>
                    Go to Confirmation Page
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {paymentId && (
            <Button asChild className="flex-1">
              <Link href={`/dashboard/payments/receipt/${paymentId}`}>
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Link>
            </Button>
          )}

          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard/payments">
              <Receipt className="h-4 w-4 mr-2" />
              View All Payments
            </Link>
          </Button>

          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {[
                `You'll receive email and SMS confirmations shortly`,
                'The landlord will be notified of your payment',
                'Visit the confirmation page to verify your property within 24 hours',
                'Contact support if you have any questions',
              ].map((step) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5 shrink-0">
                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}