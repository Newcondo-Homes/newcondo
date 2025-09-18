'use client'

import { forwardRef, useState } from 'react'
import { Card, CardContent, CardHeader } from '@newcondo/ui/components/ui/card'
import { Button } from '@newcondo/ui/components/ui/button'
import { Badge } from '@newcondo/ui/components/ui/badge'
import { Separator } from '@newcondo/ui/components/ui/separator'
import {
  Download,
  Print,
  Check,
  Building,
  MapPin,
  User,
  Calendar,
  CreditCard,
  Receipt,
  Share2,
  Copy,
  Mail,
  Home,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentReceiptProps {
  paymentData: {
    id: string
    transactionId: string
    flutterwaveRef: string
    amount: number
    processingFee?: number
    total: number
    currency: string
    paymentMethod: string
    paymentType: 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING'
    status: 'SUCCESS' | 'PENDING' | 'FAILED'
    paidAt: string
    description?: string
    property: {
      title: string
      address: string
      unitNumber?: string
    }
    landlord?: {
      name: string
      email?: string
    }
    tenant: {
      name: string
      email: string
    }
    rental?: {
      startDate: string
      endDate?: string
      monthlyRent: number
    }
  }
  onDownload?: () => void
  onPrint?: () => void
  onShare?: () => void
  className?: string
}

const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ paymentData, onDownload, onPrint, onShare, className }, ref) => {
    const [copied, setCopied] = useState(false)

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: paymentData.currency,
        minimumFractionDigits: 2,
      }).format(amount)
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'SUCCESS':
          return (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Check className="h-3 w-3 mr-1" />
              Successful
            </Badge>
          )
        case 'PENDING':
          return (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Pending
            </Badge>
          )
        case 'FAILED':
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              Failed
            </Badge>
          )
        default:
          return <Badge variant="outline">{status}</Badge>
      }
    }

    const copyTransactionId = () => {
      navigator.clipboard.writeText(paymentData.transactionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return (
      <div className={cn('max-w-2xl mx-auto', className)}>
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Print className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>

        <Card ref={ref} className="receipt-card">
          <CardHeader className="text-center pb-6">
            {/* Company Header */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Home className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">NewCondo</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Property Rental Platform - Payment Receipt
              </p>
            </div>

            {/* Receipt Header */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Payment Receipt</h2>
            </div>

            {/* Status and Date */}
            <div className="flex items-center justify-between">
              {getStatusBadge(paymentData.status)}
              <p className="text-sm text-muted-foreground">
                {formatDate(paymentData.paidAt)}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transaction Details
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs">
                      {paymentData.transactionId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyTransactionId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flutterwave Ref:</span>
                  <code className="bg-white px-2 py-1 rounded text-xs">
                    {paymentData.flutterwaveRef}
                  </code>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="capitalize">{paymentData.paymentMethod.replace('_', ' ')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Type:</span>
                  <span>{getPaymentTypeLabel(paymentData.paymentType)}</span>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Property Information
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">{paymentData.property.title}</p>
                  {paymentData.property.unitNumber && (
                    <p className="text-muted-foreground text-xs">
                      Unit: {paymentData.property.unitNumber}
                    </p>
                  )}
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-muted-foreground">{paymentData.property.address}</p>
                </div>
              </div>
            </div>

            {/* Parties Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tenant */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tenant
                </h4>
                <div className="text-sm space-y-1">
                  <p>{paymentData.tenant.name}</p>
                  <p className="text-muted-foreground">{paymentData.tenant.email}</p>
                </div>
              </div>

              {/* Landlord */}
              {paymentData.landlord && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Landlord
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>{paymentData.landlord.name}</p>
                    {paymentData.landlord.email && (
                      <p className="text-muted-foreground">{paymentData.landlord.email}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rental Period (if applicable) */}
            {paymentData.rental && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rental Period
                </h3>
                
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span>{new Date(paymentData.rental.startDate).toLocaleDateString('en-NG')}</span>
                  </div>
                  
                  {paymentData.rental.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{new Date(paymentData.rental.endDate).toLocaleDateString('en-NG')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <span>{formatCurrency(paymentData.rental.monthlyRent)}</span>
                  </div>
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Amount Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span>Payment Amount:</span>
                <span>{formatCurrency(paymentData.amount)}</span>
              </div>
              
              {paymentData.processingFee !== undefined && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing Fee:</span>
                  <span>{formatCurrency(paymentData.processingFee)}</span>
                </div>
              )}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Paid:</span>
                <span>{formatCurrency(paymentData.total)}</span>
              </div>
            </div>
            
            {paymentData.description && (
              <div className="text-sm text-center italic text-muted-foreground pt-4">
                <p>"{paymentData.description}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
)

PaymentReceipt.displayName = 'PaymentReceipt'

export { PaymentReceipt }