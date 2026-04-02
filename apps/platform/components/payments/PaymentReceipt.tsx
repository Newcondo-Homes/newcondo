'use client'

import { forwardRef, useState } from 'react'
import { Card, CardContent, CardHeader } from '@newcondo/ui/components/card'
import { Button } from '@newcondo/ui/components/button'
import { Badge } from '@newcondo/ui/components/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@newcondo/ui/components/dialog'
import { Separator } from '@newcondo/ui/components/separator'
import {
  Download,
  Printer,
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
  onClose?: () => void
  isOpen?: boolean
  className?: string
}

const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ payment, isOpen, onClose, paymentData: paymentDataProp, onDownload, onPrint, onShare, className }, ref) => {
    const [copied, setCopied] = useState(false)

    // Normalize data — support both usage modes
    const data = paymentDataProp ?? (payment ? {
      id: payment.id,
      transactionId: payment.transactionId ?? payment.id,
      flutterwaveRef: (payment as any).flutterwaveRef ?? '',
      amount: payment.amount,
      processingFee: undefined,
      total: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod ?? 'N/A',
      paymentType: payment.paymentType as 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING',
      status: payment.status as 'SUCCESS' | 'PENDING' | 'FAILED',
      paidAt: payment.paidAt ? String(payment.paidAt) : payment.createdAt ? String(payment.createdAt) : new Date().toISOString(),
      description: payment.description ?? undefined,
      property: {
        title: payment.rental?.property.title ?? 'N/A',
        address: payment.rental?.property.address ?? 'N/A',
        unitNumber: undefined,
      },
      landlord: undefined,
      tenant: {
        name: 'N/A',
        email: 'N/A',
      },
      rental: undefined,
    } : null)

    if (!data) return null

    const formatAmount = (amount: number) =>
      new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: data.currency,
        minimumFractionDigits: 2,
      }).format(amount)

    const formatReceiptDate = (dateString: string) =>
      new Date(dateString).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

    const getPaymentTypeLabel = (type: string) => {
      switch (type) {
        case 'RENT': return 'Monthly Rent Payment'
        case 'DEPOSIT': return 'Security Deposit'
        case 'PROPERTY_MARKING': return 'Property Marking Service'
        default: return 'Payment'
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
          return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
        case 'FAILED':
          return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
        default:
          return <Badge variant="outline">{status}</Badge>
      }
    }

    const copyTransactionId = () => {
      navigator.clipboard.writeText(data.transactionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    const receiptContent = (
      <div className={cn('max-w-2xl mx-auto', className)} ref={ref}>
        {/* Action Buttons — only show in standalone mode */}
        {!isOpen && (
          <div className="flex justify-end gap-2 mb-4 print:hidden">
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            {onPrint && (
              <Button variant="outline" size="sm" onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />
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
        )}

        <Card className="receipt-card">
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

            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Payment Receipt</h2>
            </div>

            <div className="flex items-center justify-between">
              {getStatusBadge(data.status)}
              <p className="text-sm text-muted-foreground">
                {formatReceiptDate(data.paidAt)}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Transaction Details */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transaction Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded text-xs">
                      {data.transactionId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyTransactionId}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {data.flutterwaveRef && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flutterwave Ref:</span>
                    <code className="bg-background px-2 py-1 rounded text-xs">
                      {data.flutterwaveRef}
                    </code>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="capitalize">{data.paymentMethod.replace('_', ' ')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Type:</span>
                  <span>{getPaymentTypeLabel(data.paymentType)}</span>
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
                  <p className="font-medium">{data.property.title}</p>
                  {data.property.unitNumber && (
                    <p className="text-muted-foreground text-xs">
                      Unit: {data.property.unitNumber}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">{data.property.address}</p>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tenant
                </h4>
                <div className="text-sm space-y-1">
                  <p>{data.tenant.name}</p>
                  <p className="text-muted-foreground">{data.tenant.email}</p>
                </div>
              </div>

              {data.landlord && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Landlord
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>{data.landlord.name}</p>
                    {data.landlord.email && (
                      <p className="text-muted-foreground">{data.landlord.email}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rental Period */}
            {data.rental && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rental Period
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span>{new Date(data.rental.startDate).toLocaleDateString('en-NG')}</span>
                  </div>
                  {data.rental.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{new Date(data.rental.endDate).toLocaleDateString('en-NG')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <span>{formatAmount(data.rental.monthlyRent)}</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Amount Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span>Payment Amount:</span>
                <span>{formatAmount(data.amount)}</span>
              </div>
              {data.processingFee !== undefined && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing Fee:</span>
                  <span>{formatAmount(data.processingFee)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Paid:</span>
                <span>{formatAmount(data.total)}</span>
              </div>
            </div>

            {data.description && (
              <p className="text-sm text-center italic text-muted-foreground pt-4">
                "{data.description}"
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )

    // Modal mode
    if (isOpen !== undefined) {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="sr-only">Payment Receipt</DialogTitle>
                <div className="flex items-center gap-2 ml-auto print:hidden">
                  {onDownload && (
                    <Button variant="outline" size="sm" onClick={onDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                  {onPrint && (
                    <Button variant="outline" size="sm" onClick={onPrint}>
                      <Printer className="h-4 w-4 mr-2" />
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
              </div>
            </DialogHeader>
            {receiptContent}
          </DialogContent>
        </Dialog>
      )
    }

    // Standalone mode
    return receiptContent
  }
)

PaymentReceipt.displayName = 'PaymentReceipt'

export { PaymentReceipt }