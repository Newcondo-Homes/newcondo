'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@newcondo/ui'
import { Button } from '@newcondo/ui'
import { Card, CardContent } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'
import { Separator } from '@newcondo/ui'
import {
  CheckCircle,
  CreditCard,
  MapPin,
  Calendar,
  User,
  Building,
  AlertTriangle,
  Loader2,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  paymentDetails: {
    amount: number
    currency: string
    processingFee?: number
    total: number
    paymentMethod: string
    propertyTitle: string
    propertyAddress: string
    unitNumber?: string
    rentalPeriod?: {
      startDate: string
      endDate?: string
    }
    landlordName?: string
    paymentType: 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING'
    description?: string
  }
  isProcessing?: boolean
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Debit/Credit Card',
  bank_transfer: 'Bank Transfer',
  ussd: 'USSD Code',
  qr: 'QR Code Payment',
}

export default function PaymentConfirmation({
  isOpen,
  onClose,
  onConfirm,
  paymentDetails,
  isProcessing = false,
}: PaymentConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      await onConfirm()
    } catch (error) {
      console.error('Payment confirmation error:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: paymentDetails.currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'RENT':
        return 'Monthly Rent Payment'
      case 'DEPOSIT':
        return 'Security Deposit'
      case 'PROPERTY_MARKING':
        return 'Property Marking Service'
      default:
        return 'Payment'
    }
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'RENT':
        return <Building className="h-5 w-5 text-blue-600" />
      case 'DEPOSIT':
        return <Shield className="h-5 w-5 text-green-600" />
      case 'PROPERTY_MARKING':
        return <MapPin className="h-5 w-5 text-purple-600" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirm Payment
          </DialogTitle>
          <DialogDescription>
            Please review your payment details before proceeding. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getPaymentTypeIcon(paymentDetails.paymentType)}
                  <div>
                    <h4 className="font-medium">
                      {getPaymentTypeLabel(paymentDetails.paymentType)}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {paymentDetails.description || 'Payment for property services'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {PAYMENT_METHOD_LABELS[paymentDetails.paymentMethod] || paymentDetails.paymentMethod}
                </Badge>
              </div>

              <Separator className="my-3" />

              {/* Property Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{paymentDetails.propertyTitle}</p>
                    {paymentDetails.unitNumber && (
                      <p className="text-xs text-muted-foreground">Unit: {paymentDetails.unitNumber}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{paymentDetails.propertyAddress}</p>
                </div>

                {paymentDetails.landlordName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Landlord: {paymentDetails.landlordName}
                    </p>
                  </div>
                )}

                {paymentDetails.rentalPeriod && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {formatDate(paymentDetails.rentalPeriod.startDate)}
                      {paymentDetails.rentalPeriod.endDate && 
                        ` - ${formatDate(paymentDetails.rentalPeriod.endDate)}`
                      }
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-3" />

              {/* Payment Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amount</span>
                  <span>{formatCurrency(paymentDetails.amount)}</span>
                </div>
                
                {paymentDetails.processingFee && paymentDetails.processingFee > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Processing Fee</span>
                    <span>{formatCurrency(paymentDetails.processingFee)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-medium">
                  <span>Total Amount</span>
                  <span className="text-lg">{formatCurrency(paymentDetails.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Secure Payment</p>
                <p className="text-blue-600 text-xs">
                  Your payment will be processed securely through Flutterwave. 
                  Funds will be held in escrow until property confirmation is complete.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Important Notice</p>
                <p className="text-amber-700 text-xs">
                  You have 7 days to confirm your rental arrangement. 
                  If not confirmed within this period, a refund will be processed automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming || isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || isProcessing}
            className={cn(
              "w-full sm:w-auto",
              "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            {(isConfirming || isProcessing) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isConfirming || isProcessing ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}