'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Eye, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

interface Payment {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  currency: string
  paymentType: 'RENT' | 'DEPOSIT' | 'AGENT_COMMISSION' | 'PREMIUM_UPGRADE' | 'PROPERTY_MARKING'
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED'
  paymentMethod?: string
  flutterwaveRef?: string
  transactionId?: string
  description?: string
  propertyTitle?: string
  rentalId?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
  failureReason?: string
  confirmationPeriodEnd?: string
  isReleased: boolean
}

interface PaymentTableProps {
  payments: Payment[]
  loading?: boolean
  onPaymentSelect?: (payment: Payment) => void
  onRefresh?: () => void
  showFilters?: boolean
  showPagination?: boolean
}

interface TableFilters {
  search: string
  status: string
  paymentType: string
  dateRange: string
}

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'HELD', label: 'Held' },
  { value: 'RELEASED', label: 'Released' }
]

const PAYMENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'RENT', label: 'Rent Payment' },
  { value: 'DEPOSIT', label: 'Security Deposit' },
  { value: 'AGENT_COMMISSION', label: 'Agent Commission' },
  { value: 'PREMIUM_UPGRADE', label: 'Premium Upgrade' },
  { value: 'PROPERTY_MARKING', label: 'Property Marking' }
]

const DATE_RANGE_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' }
]

const ITEMS_PER_PAGE = 20

export default function PaymentTable({ 
  payments, 
  loading = false, 
  onPaymentSelect, 
  onRefresh,
  showFilters = true,
  showPagination = true
}: PaymentTableProps) {
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    status: '',
    paymentType: '',
    dateRange: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  // Filter payments based on current filters
  const filteredPayments = payments.filter(payment => {
    const searchLower = filters.search.toLowerCase()
    const matchesSearch = !filters.search || 
      payment.userName.toLowerCase().includes(searchLower) ||
      payment.userEmail.toLowerCase().includes(searchLower) ||
      payment.transactionId?.toLowerCase().includes(searchLower) ||
      payment.propertyTitle?.toLowerCase().includes(searchLower) ||
      payment.description?.toLowerCase().includes(searchLower)

    const matchesStatus = !filters.status || payment.status === filters.status
    const matchesType = !filters.paymentType || payment.paymentType === filters.paymentType

    let matchesDateRange = true
    if (filters.dateRange) {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      matchesDateRange = new Date(payment.createdAt) >= startDate
    }

    return matchesSearch && matchesStatus && matchesType && matchesDateRange
  })

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedPayments = showPagination 
    ? filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    : filteredPayments

  const getStatusBadge = (status: Payment['status'], isReleased: boolean) => {
    switch (status) {
      case 'SUCCESS':
        return isReleased ? (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Released
          </Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success (Held)
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="text-gray-600">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        )
      case 'REFUNDED':
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        )
      case 'HELD':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Held
          </Badge>
        )
      case 'RELEASED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Released
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentTypeBadge = (type: Payment['paymentType']) => {
    const colors = {
      RENT: 'bg-blue-100 text-blue-800',
      DEPOSIT: 'bg-green-100 text-green-800',
      AGENT_COMMISSION: 'bg-purple-100 text-purple-800',
      PREMIUM_UPGRADE: 'bg-yellow-100 text-yellow-800',
      PROPERTY_MARKING: 'bg-orange-100 text-orange-800'
    }

    const labels = {
      RENT: 'Rent',
      DEPOSIT: 'Deposit',
      AGENT_COMMISSION: 'Commission',
      PREMIUM_UPGRADE: 'Premium',
      PROPERTY_MARKING: 'Marking'
    }

    return (
      <Badge variant="secondary" className={colors[type]}>
        {labels[type]}
      </Badge>
    )
  }

  const formatAmount = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const exportPayments = () => {
    try {
      const csvData = filteredPayments.map(payment => ({
        'Transaction ID': payment.transactionId || payment.id,
        'User Name': payment.userName,
        'User Email': payment.userEmail,
        'Amount': payment.amount,
        'Currency': payment.currency,
        'Payment Type': payment.paymentType,
        'Status': payment.status,
        'Property': payment.propertyTitle || 'N/A',
        'Payment Method': payment.paymentMethod || 'N/A',
        'Paid At': payment.paidAt ? new Date(payment.paidAt).toISOString() : 'N/A',
        'Created At': new Date(payment.createdAt).toISOString(),
        'Is Released': payment.isReleased ? 'Yes' : 'No'
      }))

      const headers = Object.keys(csvData[0] || {})
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: `Exported ${csvData.length} payments to CSV`
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export payments data',
        variant: 'destructive'
      })
    }
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentType: '',
      dateRange: ''
    })
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            Payment Transactions
            <Badge variant="secondary">{filteredPayments.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportPayments}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.paymentType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, paymentType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedPayments.length > 0 ? (
            paginatedPayments.map(payment => (
              <TableRow key={payment.id}>
                <TableCell>{format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                <TableCell>
                  <div className="font-medium">{payment.userName}</div>
                  <div className="text-sm text-gray-500">{payment.userEmail}</div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatAmount(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                <TableCell>{getStatusBadge(payment.status, payment.isReleased)}</TableCell>
                <TableCell className="text-sm text-gray-500">{payment.propertyTitle || 'N/A'}</TableCell>
                <TableCell>
                  {onPaymentSelect && (
                    <Button variant="ghost" size="sm" onClick={() => onPaymentSelect(payment)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No payments found matching the filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4 px-6">
          <div className="text-sm text-muted-foreground flex-1">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  )
}