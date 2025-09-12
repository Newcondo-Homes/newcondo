'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { FileText, Download, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react'

interface ComplianceMetrics {
  totalDocuments: number
  pendingReview: number
  approved: number
  rejected: number
  expired: number
  complianceRate: number
  criticalIssues: number
}

interface ComplianceIssue {
  id: string
  type: 'EXPIRED' | 'MISSING' | 'REJECTED' | 'UNSIGNED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId: string
  userName: string
  propertyId?: string
  propertyTitle?: string
  documentType: string
  description: string
  dueDate?: string
  createdAt: string
}

interface ComplianceReportProps {
  dateRange?: { start: Date; end: Date }
  userType?: 'ALL' | 'OWNER' | 'AGENT' | 'RENTER'
  onExport?: (format: 'PDF' | 'CSV' | 'EXCEL') => void
}

const ComplianceReport: React.FC<ComplianceReportProps> = ({
  dateRange,
  userType = 'ALL',
  onExport
}) => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null)
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedSeverity, setSelectedSeverity] = useState('ALL')

  useEffect(() => {
    fetchComplianceData()
  }, [dateRange, userType, selectedPeriod])

  const fetchComplianceData = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockMetrics: ComplianceMetrics = {
        totalDocuments: 1250,
        pendingReview: 89,
        approved: 1065,
        rejected: 76,
        expired: 20,
        complianceRate: 85.2,
        criticalIssues: 12
      }

      const mockIssues: ComplianceIssue[] = [
        {
          id: '1',
          type: 'EXPIRED',
          severity: 'CRITICAL',
          userId: 'user1',
          userName: 'John Doe',
          propertyId: 'prop1',
          propertyTitle: '3 Bedroom Apartment in VI',
          documentType: 'OWNERSHIP_DOCUMENT',
          description: 'Property ownership document has expired',
          dueDate: '2024-01-15',
          createdAt: '2024-01-01'
        },
        {
          id: '2',
          type: 'MISSING',
          severity: 'HIGH',
          userId: 'user2',
          userName: 'Jane Smith',
          documentType: 'CONSENT_DOCUMENT',
          description: 'Agent consent document not provided',
          dueDate: '2024-02-01',
          createdAt: '2024-01-20'
        },
        {
          id: '3',
          type: 'REJECTED',
          severity: 'MEDIUM',
          userId: 'user3',
          userName: 'Mike Johnson',
          propertyId: 'prop2',
          propertyTitle: 'Office Space in Lekki',
          documentType: 'UNDERTAKING_DOCUMENT',
          description: 'Undertaking document signature unclear',
          createdAt: '2024-01-25'
        }
      ]

      setMetrics(mockMetrics)
      setIssues(mockIssues)
    } catch (error) {
      console.error('Failed to fetch compliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredIssues = issues.filter(issue => 
    selectedSeverity === 'ALL' || issue.severity === selectedSeverity
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'secondary'
      case 'MEDIUM': return 'outline'
      case 'LOW': return 'default'
      default: return 'default'
    }
  }

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'EXPIRED': return <Clock className="h-4 w-4" />
      case 'MISSING': return <AlertTriangle className="h-4 w-4" />
      case 'REJECTED': return <FileText className="h-4 w-4" />
      case 'UNSIGNED': return <Shield className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Compliance Report...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Compliance Report</h2>
          <p className="text-muted-foreground">
            Legal documents and compliance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => onExport?.('PDF')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalDocuments.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.complianceRate}%</div>
              <Progress value={metrics.complianceRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingReview}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Report */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Compliance Issues</TabsTrigger>
          <TabsTrigger value="overview">Document Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Compliance Issues</CardTitle>
                  <CardDescription>
                    Documents requiring immediate attention
                  </CardDescription>
                </div>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getIssueTypeIcon(issue.type)}
                          <div>
                            <p className="font-medium">{issue.type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {issue.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{issue.userName}</TableCell>
                      <TableCell>
                        {issue.propertyTitle || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {issue.documentType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(issue.severity) as any}>
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            Resolve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Status Overview</CardTitle>
              <CardDescription>
                Breakdown of document statuses across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.approved}
                    </div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {metrics.pendingReview}
                    </div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {metrics.rejected}
                    </div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {metrics.expired}
                    </div>
                    <p className="text-sm text-muted-foreground">Expired</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trends</CardTitle>
              <CardDescription>
                Historical compliance data and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Chart component would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ComplianceReport