'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui'
import { Button } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'
import { Input } from '@newcondo/ui'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@newcondo/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui'
import { 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  FileText,
  Users,
  Building,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ComplianceRecord {
  id: string
  userId: string
  userName: string
  userEmail: string
  documentType: string
  propertyId?: string
  propertyTitle?: string
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXPIRED'
  lastChecked: string
  expiryDate?: string
  issues: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  actions: string[]
}

interface ComplianceStats {
  totalRecords: number
  compliant: number
  nonCompliant: number
  pending: number
  expired: number
  highRisk: number
  criticalRisk: number
}

export default function LegalCompliancePage() {
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([])
  const [stats, setStats] = useState<ComplianceStats>({
    totalRecords: 0,
    compliant: 0,
    nonCompliant: 0,
    pending: 0,
    expired: 0,
    highRisk: 0,
    criticalRisk: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    try {
      const [recordsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/legal-compliance/records'),
        fetch('/api/admin/legal-compliance/stats')
      ])

      if (!recordsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch compliance data')
      }

      const recordsData = await recordsResponse.json()
      const statsData = await statsResponse.json()

      setComplianceRecords(recordsData)
      setStats(statsData)
    } catch (error) {
      toast.error('Failed to load compliance data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCompliance = async () => {
    try {
      const response = await fetch('/api/admin/legal-compliance/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            status: statusFilter,
            riskLevel: riskFilter,
            documentType: typeFilter,
            search: searchQuery
          }
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Compliance report exported successfully')
    } catch (error) {
      toast.error('Failed to export compliance report')
    }
  }

  const handleMarkCompliant = async (recordId: string) => {
    try {
      const response = await fetch(`/api/admin/legal-compliance/${recordId}/mark-compliant`, {
        method: 'PUT'
      })

      if (!response.ok) throw new Error('Failed to mark as compliant')

      setComplianceRecords(prev =>
        prev.map(record =>
          record.id === recordId
            ? { ...record, status: 'COMPLIANT' as const, lastChecked: new Date().toISOString() }
            : record
        )
      )

      toast.success('Record marked as compliant')
    } catch (error) {
      toast.error('Failed to update compliance status')
    }
  }

  const getStatusBadge = (status: ComplianceRecord['status']) => {
    const variants = {
      COMPLIANT: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      NON_COMPLIANT: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
      PENDING: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      EXPIRED: { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' }
    }
    
    const config = variants[status]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getRiskBadge = (riskLevel: ComplianceRecord['riskLevel']) => {
    const variants = {
      LOW: { variant: 'outline' as const, color: 'text-green-600' },
      MEDIUM: { variant: 'secondary' as const, color: 'text-yellow-600' },
      HIGH: { variant: 'destructive' as const, color: 'text-orange-600' },
      CRITICAL: { variant: 'destructive' as const, color: 'text-red-600' }
    }
    
    const config = variants[riskLevel]
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {riskLevel}
      </Badge>
    )
  }

  const filteredRecords = complianceRecords.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.documentType.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    const matchesRisk = riskFilter === 'all' || record.riskLevel === riskFilter
    const matchesType = typeFilter === 'all' || record.documentType === typeFilter

    return matchesSearch && matchesStatus && matchesRisk && matchesType
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Legal Compliance</h1>
          <p className="text-gray-600">Monitor and manage legal document compliance</p>
        </div>
        <Button onClick={handleExportCompliance}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliant</p>
                <p className="text-2xl font-bold text-green-600">{stats.compliant}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-600">{stats.nonCompliant}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-orange-600">{stats.criticalRisk}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLIANT">Compliant</SelectItem>
                <SelectItem value="NON_COMPLIANT">Non-Compliant</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CONSENT">Consent</SelectItem>
                <SelectItem value="OWNERSHIP">Ownership</SelectItem>
                <SelectItem value="UNDERTAKING">Undertaking</SelectItem>
                <SelectItem value="PERMISSION">Permission</SelectItem>
                <SelectItem value="TERMS">Terms</SelectItem>
                <SelectItem value="PRIVACY">Privacy</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setRiskFilter('all')
                setTypeFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance Records</CardTitle>
            <p className="text-sm text-gray-600">
              Showing {filteredRecords.length} of {complianceRecords.length} records
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.userName}</p>
                        <p className="text-sm text-gray-500">{record.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {record.documentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.propertyTitle ? (
                        <div>
                          <p className="font-medium text-sm">{record.propertyTitle}</p>
                          <p className="text-xs text-gray-500">Property ID: {record.propertyId}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell>
                      {getRiskBadge(record.riskLevel)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{new Date(record.lastChecked).toLocaleDateString()}</p>
                        {record.expiryDate && (
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(record.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.issues.length > 0 ? (
                        <div className="space-y-1">
                          {record.issues.slice(0, 2).map((issue, index) => (
                            <p key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              {issue}
                            </p>
                          ))}
                          {record.issues.length > 2 && (
                            <p className="text-xs text-gray-500">+{record.issues.length - 2} more</p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          None
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.status !== 'COMPLIANT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkCompliant(record.id)}
                        >
                          Mark as Compliant
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}