'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card'
import { Button } from '@newcondo/ui/components/button'
import { Badge } from '@newcondo/ui/components/badge'
import { Separator } from '@newcondo/ui/components/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@newcondo/ui/components/dialog'
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs'
import { ScrollArea } from '@newcondo/ui/components/scroll-area'
import { Input } from '@newcondo/ui/components/input'
import { Textarea } from '@newcondo/ui/components/textarea'
import { Label } from '@newcondo/ui/components/label'
import { 
  CreditCard,
  User,
  Building2,
  Calendar,
  DollarSign,
  Hash,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  Eye,
  ExternalLink,
  Activity,
  TrendingUp,
  Shield,
  Banknote,
  Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'

interface PaymentDetail {
  id: string
  userId: string
  rentalId?: string
  markingJobId?: string
  amount: number
  currency: string
  paymentType: 'RENT' | 'DEPOSIT' | 'AGENT_COMMISSION' | 'PREMIUM_UPGRADE' | 'PROPERTY_MARKING'
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED'
  paymentMethod?: string
  flutterwaveRef?: string
  transactionId?: string
  agentCommission?: number
  platformFee?: number
  ownerAmount?: number
  confirmationPeriodEnd?: string
  isReleased: boolean
  releasedAt?: string
  description?: string
  failureReason?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name?: string
    email: string
    phone?: string
    role: string
  }
  rental?: {
    id: string
    startDate: string
    endDate?: string
    monthlyRent: number
    property: {
      id: string
      title: string
      address: string
    }
  }
  markingJob?: {
    id: string
    contactPersonName: string
    contactPersonPhone: string
    property: {
      id: string
      title: string
      address: string
    }
  }
}

interface PaymentDetailsProps {
  payment: PaymentDetail
  onRefund?: (paymentId: string, reason: string) => Promise<void>
  onRelease?: (paymentId: string) => Promise<void>
  onViewFlutterwave?: (flutterwaveRef: string) => void
  isLoading?: boolean
}

export default function PaymentDetails({
  payment,
  onRefund,
  onRelease,
  onViewFlutterwave,
  isLoading = false
}: PaymentDetailsProps) {
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      SUCCESS: { variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
      FAILED: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      CANCELLED: { variant: 'secondary' as const, icon: XCircle, color: 'text-gray-600' },
      REFUNDED: { variant: 'outline' as const, icon: RefreshCcw, color: 'text-blue-600' },
      HELD: { variant: 'secondary' as const, icon: Shield, color: 'text-orange-600' },
      RELEASED: { variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={cn("h-3 w-3", config.color)} />
        {status}
      </Badge>
    )
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'RENT':
        return Building2
      case 'DEPOSIT':
        return Shield
      case 'AGENT_COMMISSION':
        return User
      case 'PREMIUM_UPGRADE':
        return TrendingUp
      case 'PROPERTY_MARKING':
        return Activity
      default:
        return CreditCard
    }
  }

  const handleRefund = async () => {
    if (!onRefund || !refundReason.trim()) return
    
    setIsProcessing(true)
    try {
      await onRefund(payment.id, refundReason)
      setShowRefundDialog(false)
      setRefundReason('')
    } catch (error) {
      // Error handling would be done by parent component
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRelease = async () => {
    if (!onRelease) return
    
    setIsProcessing(true)
    try {
      await onRelease(payment.id)
    } catch (error) {
      // Error handling would be done by parent component
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      // Silently fail
    }
  }

  const PaymentTypeIcon = getPaymentTypeIcon(payment.paymentType)
  
  const timelineEvents = [
    { 
      date: new Date(payment.createdAt), 
      label: 'Payment initiated', 
      icon: <CreditCard className="h-4 w-4" />,
      color: 'bg-primary'
    },
    ...(payment.paidAt ? [{ 
      date: new Date(payment.paidAt), 
      label: 'Payment received by platform', 
      icon: <Banknote className="h-4 w-4" />,
      color: 'bg-green-500'
    }] : []),
    ...(payment.status === 'HELD' ? [{ 
      date: new Date(payment.createdAt), 
      label: 'Funds held in escrow', 
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-orange-500'
    }] : []),
    ...(payment.releasedAt ? [{ 
      date: new Date(payment.releasedAt), 
      label: 'Funds released to owner', 
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'bg-green-500'
    }] : []),
    ...(payment.status === 'REFUNDED' ? [{ 
      date: new Date(payment.updatedAt), 
      label: 'Payment refunded', 
      icon: <RefreshCcw className="h-4 w-4" />,
      color: 'bg-blue-500'
    }] : []),
    ...(payment.status === 'FAILED' ? [{ 
      date: new Date(payment.updatedAt), 
      label: 'Payment failed', 
      icon: <XCircle className="h-4 w-4" />,
      color: 'bg-red-500'
    }] : []),
    ...(payment.status === 'CANCELLED' ? [{ 
      date: new Date(payment.updatedAt), 
      label: 'Payment cancelled', 
      icon: <XCircle className="h-4 w-4" />,
      color: 'bg-gray-500'
    }] : []),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="space-y-6">
      {/* Payment Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PaymentTypeIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Payment Details</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Transaction ID: {payment.id}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(payment.status)}
          {payment.flutterwaveRef && onViewFlutterwave && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewFlutterwave(payment.flutterwaveRef!)}
              className="gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Flutterwave
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">
                    {payment.paymentType.replace('_', ' ')}
                  </p>
                </div>
                {payment.paymentMethod && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Method</p>
                    <p className="text-sm font-medium capitalize">
                      {payment.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
              </div>

              {payment.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{payment.description}</p>
                </div>
              )}

              {payment.failureReason && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Failure Reason:</strong> {payment.failureReason}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{payment.user.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{payment.user.email}</p>
                  {payment.user.phone && (
                    <p className="text-sm text-muted-foreground">{payment.user.phone}</p>
                  )}
                </div>
                <Badge variant="outline">{payment.user.role}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          {(payment.rental || payment.markingJob) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payment.rental && (
                  <div className="space-y-2">
                    <p className="font-medium">{payment.rental.property.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.rental.property.address}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span>
                        <strong>Start:</strong> {formatDate(payment.rental.startDate)}
                      </span>
                      {payment.rental.endDate && (
                        <span>
                          <strong>End:</strong> {formatDate(payment.rental.endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {payment.markingJob && (
                  <div className="space-y-2">
                    <p className="font-medium">{payment.markingJob.property.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.markingJob.property.address}
                    </p>
                    <div className="text-sm">
                      <p><strong>Contact:</strong> {payment.markingJob.contactPersonName}</p>
                      <p><strong>Phone:</strong> {payment.markingJob.contactPersonPhone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4 mt-4">
          {/* Financial Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                </div>
                
                {payment.platformFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span>-{formatCurrency(payment.platformFee, payment.currency)}</span>
                  </div>
                )}
                
                {payment.agentCommission && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Agent Commission</span>
                    <span>-{formatCurrency(payment.agentCommission, payment.currency)}</span>
                  </div>
                )}
                
                {payment.ownerAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Owner Amount</span>
                    <span className="font-medium">
                      {formatCurrency(payment.ownerAmount, payment.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Release Information */}
              {payment.status === 'HELD' && !payment.isReleased && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Payment Status</span>
                    <Badge variant="secondary">Held</Badge>
                  </div>
                  {payment.confirmationPeriodEnd && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Confirmation period ends: {formatDate(payment.confirmationPeriodEnd)}
                    </p>
                  )}
                  {onRelease && (
                    <Button 
                      onClick={handleRelease}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Release Payment
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction References */}
          {(payment.flutterwaveRef || payment.transactionId) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Transaction References
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payment.flutterwaveRef && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Flutterwave Reference</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {payment.flutterwaveRef}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(payment.flutterwaveRef!)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {payment.transactionId && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Transaction ID</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {payment.transactionId}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(payment.transactionId!)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Refund Actions (conditional) */}
          {(payment.status === 'SUCCESS' || payment.status === 'HELD' || payment.status === 'RELEASED') && onRefund && (
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-4">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Initiate Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initiate Refund</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to refund this payment? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      Refunding this payment will revert the transaction. This action should only be performed in accordance with platform policy.
                    </AlertDescription>
                  </Alert>
                  <div>
                    <Label htmlFor="refund-reason">Refund Reason</Label>
                    <Textarea 
                      id="refund-reason"
                      placeholder="Enter a reason for the refund..." 
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRefund} 
                    disabled={isProcessing || !refundReason.trim()}
                  >
                    {isProcessing ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4 mr-2" />
                    )}
                    Confirm Refund
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 mt-4">
          {/* Payment Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Payment Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5", event.color)} />
                      {index < timelineEvents.length - 1 && (
                        <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">{event.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.date.toISOString())}
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        {formatDistanceToNow(event.date, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}