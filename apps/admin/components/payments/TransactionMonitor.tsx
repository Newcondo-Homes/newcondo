'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@newcondo/ui/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@newcondo/ui/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/ui/select'
import { Button } from '@newcondo/ui/components/ui/button'
import { Input } from '@newcondo/ui/components/ui/input'
import { Badge } from '@newcondo/ui/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@newcondo/ui/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/ui/tabs'
import { 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  User,
  Info,
  Calendar,
  CreditCard,
  CircleAlert
} from 'lucide-react'
import { format } from 'date-fns'
import { adminPaymentsAPI, Payment, PaymentFilters, PaymentStats } from '@/lib/api/payments'
import { useToast } from '@newcondo/ui/components/ui/use-toast'

// Transaction status color mapping
const statusColors: Record<Payment['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-blue-100 text-blue-800',
  HELD: 'bg-orange-100 text-orange-800',
  RELEASED: 'bg-purple-100 text-purple-800'
}

const paymentTypeColors: Record<Payment['paymentType'], string> = {
  RENT: 'bg-emerald-100 text-emerald-800',
  DEPOSIT: 'bg-amber-100 text-amber-800',
  AGENT_COMMISSION: 'bg-indigo-100 text-indigo-800',
  PREMIUM_UPGRADE: 'bg-purple-100 text-purple-800',
  PROPERTY_MARKING: 'bg-cyan-100 text-cyan-800'
}

interface TransactionMonitorProps {
  className?: string
}

export default function TransactionMonitor({ className }: TransactionMonitorProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // State management
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<PaymentFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | undefined>()

  // Fetch payments data
  const { 
    data: paymentsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['admin-payments', currentPage, pageSize, filters, searchTerm],
    queryFn: () => adminPaymentsAPI.getPayments(currentPage, pageSize, {
      ...filters,
      search: searchTerm || undefined
    }),
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  })

  // Fetch payment statistics
  const { data: paymentStats } = useQuery({
    queryKey: ['payment-stats', dateRange],
    queryFn: () => adminPaymentsAPI.getPaymentStats(dateRange),
    refetchInterval: 60000, // Auto-refetch every minute
  })

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Handle filter changes
  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }))
    setCurrentPage(1)
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await adminPaymentsAPI.exportPayments({
        ...filters,
        search: searchTerm || undefined,
        format
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments-${format === 'csv' ? 'export.csv' : 'export.xlsx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Export successful',
        description: `Payments data exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export payments data',
        variant: 'destructive',
      })
    }
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const payments = paymentsData?.data || []
  const totalCount = paymentsData?.pagination?.total || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(paymentStats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentStats.monthlyGrowth >= 0 ? '+' : ''}
                {paymentStats.monthlyGrowth.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {paymentStats.successfulTransactions} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((paymentStats.successfulTransactions / paymentStats.totalTransactions) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentStats.failedTransactions} failed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(paymentStats.averageTransactionValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per transaction average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <CardTitle>Transaction Monitor</CardTitle>
              <CardDescription>
                Monitor and manage all payment transactions in real-time
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Select onValueChange={(value) => handleExport(value as 'csv' | 'excel')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Excel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="HELD">Held</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.paymentType || ''}
                onValueChange={(value) => handleFilterChange('paymentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="RENT">Rent</SelectItem>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="AGENT_COMMISSION">Commission</SelectItem>
                  <SelectItem value="PREMIUM_UPGRADE">Premium</SelectItem>
                  <SelectItem value="PROPERTY_MARKING">Marking</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Min Amount"
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              />

              <Input
                placeholder="Max Amount"
                type="number"
                value={filters.maxAmount || ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              />

              <Input
                placeholder="Date From"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="animate-pulse bg-gray-100 h-8"></TableCell>
                      <TableCell className="animate-pulse bg-gray-100 h-8"></TableCell>
                      <TableCell className="animate-pulse bg-gray-100 h-8"></TableCell>
                      <TableCell className="animate-pulse bg-gray-100 h-8"></TableCell>
                      <TableCell className="animate-pulse bg-gray-100 h-8"></TableCell>
                      <TableCell className="animate-pulse bg-gray-100 h-8"></TableCell>
                      <TableCell className="animate-pulse bg-gray-100 h-8"></TableCell>
                      <TableCell className="animate-pulse bg-gray-100 h-8"></TableCell>
                    </TableRow>
                  ))
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.transactionId || payment.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.user.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{payment.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentTypeColors[payment.paymentType]}>
                          {payment.paymentType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[payment.status]}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.paymentMethod || 'N/A'}</TableCell>
                      <TableCell>
                        {format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Dialog onOpenChange={(open) => !open && setSelectedPayment(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                              <DialogDescription>
                                Transaction ID: {payment.transactionId || payment.id}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedPayment && (
                              <TransactionDetailsModal payment={selectedPayment} />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                    if (page > totalPages) return null
                    
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Transaction Details Modal Component
function TransactionDetailsModal({ payment }: { payment: Payment }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReasonInput, setShowReasonInput] = useState(false)
  const [reason, setReason] = useState('')

  const handleAction = async (action: 'release' | 'fail' | 'retry') => {
    setIsSubmitting(true)
    try {
      switch (action) {
        case 'release':
          await adminPaymentsAPI.releasePayment(payment.id)
          toast({
            title: 'Payment released',
            description: 'Payment has been released successfully',
          })
          break
        case 'fail':
          if (!reason) {
            toast({
              title: 'Reason required',
              description: 'Please provide a reason for marking as failed',
              variant: 'destructive',
            })
            setIsSubmitting(false)
            return
          }
          await adminPaymentsAPI.markPaymentFailed(payment.id, reason)
          toast({
            title: 'Payment marked as failed',
            description: 'Payment has been marked as failed successfully',
          })
          break
        case 'retry':
          await adminPaymentsAPI.retryPayment(payment.id)
          toast({
            title: 'Payment retried',
            description: 'Payment retry has been initiated successfully',
          })
          break
      }
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      setIsSubmitting(false)
      // This is a simple way to close the modal after an action
      // In a real app, you might lift the state up
      const dialogCloseButton = document.querySelector('[aria-label="Close"]') as HTMLButtonElement | null
      if (dialogCloseButton) {
        dialogCloseButton.click()
      }
    } catch (error) {
      toast({
        title: 'Action failed',
        description: `Failed to ${action} payment. Please try again.`,
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'SUCCESS':
      case 'RELEASED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PENDING':
      case 'HELD':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'REFUNDED':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">User</p>
            <p className="font-medium">{payment.user.name || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">{payment.user.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-bold">{formatCurrency(payment.amount, payment.currency)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(payment.status)}
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={statusColors[payment.status]}>{payment.status}</Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="font-medium">{payment.paymentMethod || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{format(new Date(payment.createdAt), 'PPP p')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <Badge className={paymentTypeColors[payment.paymentType]}>
              {payment.paymentType.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-lg font-semibold">Payment Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><strong>Transaction ID:</strong> <span className="font-mono">{payment.transactionId || 'N/A'}</span></p>
          <p><strong>Bank Reference:</strong> <span className="font-mono">{payment.bankReference || 'N/A'}</span></p>
          <p><strong>User ID:</strong> <span className="font-mono">{payment.userId}</span></p>
          <p><strong>Reason:</strong> {payment.reason || 'N/A'}</p>
        </div>
      </div>
      
      {payment.status !== 'SUCCESS' && payment.status !== 'FAILED' && (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold">Actions</h4>
          <div className="flex items-center gap-2">
            {payment.status === 'HELD' && (
              <Button 
                onClick={() => handleAction('release')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Releasing...' : 'Release Payment'}
              </Button>
            )}
            {payment.status === 'PENDING' && (
              <Button 
                variant="outline"
                onClick={() => handleAction('retry')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Retrying...' : 'Retry Payment'}
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowReasonInput(!showReasonInput)}
              disabled={isSubmitting}
            >
              Mark as Failed
            </Button>
          </div>
          {showReasonInput && (
            <div className="flex items-end gap-2 mt-2">
              <Input
                placeholder="Reason for failure"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex-grow"
              />
              <Button 
                variant="destructive"
                onClick={() => handleAction('fail')}
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? 'Failing...' : 'Confirm Fail'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
