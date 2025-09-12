'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Download,
  Filter,
  Users,
  Building,
  Shield,
  TrendingUp
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DocumentVerificationTable } from '@/components/legal-documents/DocumentVerificationTable'
import { LegalDocumentFilters } from '@/components/legal-documents/LegalDocumentFilters'
import { DocumentSearchInput } from '@/components/legal-documents/DocumentSearchInput'
import { DocumentBulkActions } from '@/components/legal-documents/DocumentBulkActions'
import { useDocumentVerification } from '@/hooks/useDocumentVerification'

export default function DocumentVerificationPage() {
  const [selectedTab, setSelectedTab] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [filters, setFilters] = useState({
    documentType: 'all',
    dateRange: '7days',
    userType: 'all'
  })

  const { 
    documents, 
    isLoading, 
    verificationStats,
    bulkApprove,
    bulkReject,
    exportDocuments
  } = useDocumentVerification({
    status: selectedTab,
    search: searchTerm,
    filters
  })

  const handleBulkAction = async (action: string) => {
    if (selectedDocuments.length === 0) return

    try {
      switch (action) {
        case 'approve':
          await bulkApprove(selectedDocuments)
          break
        case 'reject':
          await bulkReject(selectedDocuments)
          break
        case 'export':
          await exportDocuments(selectedDocuments)
          break
      }
      setSelectedDocuments([])
    } catch (error) {
      console.error('Bulk action failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Document Verification</h1>
          <p className="text-muted-foreground">
            Review and verify user-submitted legal documents
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {verificationStats?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{verificationStats?.pendingIncrease || 0} from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {verificationStats?.approvedToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {verificationStats?.approvalRate || 0}% approval rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {verificationStats?.rejected || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require resubmission
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Review Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {verificationStats?.avgReviewTime || '0h'}
            </div>
            <p className="text-xs text-muted-foreground">
              -12% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between space-x-4">
        <DocumentSearchInput 
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <LegalDocumentFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <DocumentBulkActions
          selectedCount={selectedDocuments.length}
          onBulkAction={handleBulkAction}
        />
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {verificationStats?.pending > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {verificationStats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Priority Review Queue</span>
              </CardTitle>
              <CardDescription>
                Documents requiring immediate attention, sorted by submission date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentVerificationTable
                documents={documents}
                isLoading={isLoading}
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
                showPriorityFirst={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Approved Documents</span>
              </CardTitle>
              <CardDescription>
                Successfully verified and approved documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentVerificationTable
                documents={documents}
                isLoading={isLoading}
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span>Rejected Documents</span>
              </CardTitle>
              <CardDescription>
                Documents that require resubmission or correction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentVerificationTable
                documents={documents}
                isLoading={isLoading}
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
                showRejectionReasons={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Expired Documents</span>
              </CardTitle>
              <CardDescription>
                Documents that have passed their expiration date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentVerificationTable
                documents={documents}
                isLoading={isLoading}
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
                showExpirationDates={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Document Records</CardTitle>
              <CardDescription>
                Complete history of all document verification activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentVerificationTable
                documents={documents}
                isLoading={isLoading}
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
                showAllStatuses={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Users className="h-5 w-5 text-blue-500" />
              <span>User Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review identity documents and user verification status
            </p>
            <Link href="/admin/users/verification">
              <Button variant="outline" size="sm" className="mt-3">
                View Queue
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Building className="h-5 w-5 text-green-500" />
              <span>Property Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Verify property ownership and consent documents
            </p>
            <Link href="/admin/properties/documents">
              <Button variant="outline" size="sm" className="mt-3">
                Review Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Shield className="h-5 w-5 text-purple-500" />
              <span>Compliance Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate compliance reports and audit trails
            </p>
            <Link href="/admin/compliance/reports">
              <Button variant="outline" size="sm" className="mt-3">
                Generate Report
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}