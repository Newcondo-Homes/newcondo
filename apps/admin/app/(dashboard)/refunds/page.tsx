'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import RefundManager from '@/components/payments/RefundManager'
import { adminPaymentsApi } from '@/lib/api/payments'

interface RefundablePayment {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  currency: string
  paymentType: 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING'
  transactionId: string
  flutterwaveRef: string
  paidAt: string
  description?: string
  propertyTitle?: string
  rentalId?: string
  refundStatus?: 'NONE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  refundAmount?: number
  refundReason?: string
  refundedAt?: string
}

interface RefundFilters {
  search: string
  paymentType: string
  refundStatus: string
  dateRange: string
}

const PAYMENT_TYPE_OPTIONS = [
  { value: '', label: 'All Payment Types' },
  { value: 'RENT', label: 'Rent Payment' },
  { value: 'DEPOSIT', label: 'Security Deposit' },
  { value: 'PROPERTY_MARKING', label: 'Property Marking' }
]

const REFUND_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'NONE', label: 'No Refund' },
  { value: 'PENDING', label: 'Refund Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Refund Completed' },
  { value: 'FAILED', label: 'Refund Failed' }
]

export default function RefundsPage() {
  const [payments, setPayments] = useState<RefundablePayment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<RefundablePayment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<RefundablePayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<RefundFilters>({
    search: '',
    paymentType: '',
    refundStatus: '',
    dateRange: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    loadRefundablePayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, filters])

  const loadRefundablePayments = async () => {
    try {
      setLoading(true)
      const response = await adminPaymentsApi.getRefundablePayments()
      setPayments(response.data)
    } catch (error) {
      console.error('Failed to load refundable payments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load refundable payments. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = payments

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(payment =>
        payment.userName.toLowerCase().includes(searchLower) ||
        payment.userEmail.toLowerCase().includes(searchLower) ||
        payment.transactionId.toLowerCase().includes(searchLower) ||
        payment.propertyTitle?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.paymentType) {
      filtered = filtered.filter(payment => payment.paymentType === filters.paymentType)
    }

    if (filters.refundStatus) {
      filtered = filtered.filter(payment => (payment.refundStatus || 'NONE') === filters.refundStatus)
    }

    if (filters.dateRange) {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
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

      filtered = filtered.filter(payment =>
        new Date(payment.paidAt) >= startDate
      )
    }

    setFilteredPayments(filtered)
  }

  const getRefundStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'PROCESSING':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Processing</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="outline">No Refund</Badge>
    }
  }

  const formatAmount = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const exportRefundData = async () => {
    try {
      const response = await adminPaymentsApi.exportRefundData(filters)
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `refunds-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: 'Refund data has been exported successfully.'
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export refund data. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleRefundSuccess = (paymentId: string, refundData: any) => {
    setPayments(prev => 
      prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, ...refundData }
          : payment
      )
    )
    setSelectedPayment(null)
    toast({
      title: 'Refund Processed',
      description: 'The refund has been processed successfully.'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-600">Manage payment refunds and process customer requests</p>
        </div>
        <Button onClick={exportRefundData} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select 
              value={filters.paymentType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, paymentType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Type" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.refundStatus}
              onValueChange={(value) => setFilters(prev => ({ ...prev, refundStatus: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Refund Status" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Refundable</div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredPayments.filter(p => !p.refundStatus || p.refundStatus === 'NONE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Pending Refunds</div>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredPayments.filter(p => p.refundStatus === 'PENDING' || p.refundStatus === 'PROCESSING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Completed Refunds</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredPayments.filter(p => p.refundStatus === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Failed Refunds</div>
            <div className="text-2xl font-bold text-red-600">
              {filteredPayments.filter(p => p.refundStatus === 'FAILED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refundable Payments</CardTitle>
          <CardDescription>
            {filteredPayments.length} payments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Payment Type</th>
                  <th className="text-left p-3 font-medium">Transaction ID</th>
                  <th className="text-left p-3 font-medium">Property</th>
                  <th className="text-left p-3 font-medium">Paid At</th>
                  <th className="text-left p-3 font-medium">Refund Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-sm">{payment.userName}</div>
                        <div className="text-xs text-gray-500">{payment.userEmail}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">
                        {formatAmount(payment.amount, payment.currency)}
                      </div>
                      {payment.refundAmount && (
                        <div className="text-xs text-gray-500">
                          Refund: {formatAmount(payment.refundAmount, payment.currency)}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{payment.paymentType}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-xs">
                        {payment.transactionId}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        {payment.propertyTitle || 'N/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3">
                      {getRefundStatusBadge(payment.refundStatus)}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        Manage Refund
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No refundable payments found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Refund Manager Modal */}
      {selectedPayment && (
        <RefundManager
          payment={selectedPayment}
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onRefundSuccess={handleRefundSuccess}
        />
      )}
    </div>
  )
}