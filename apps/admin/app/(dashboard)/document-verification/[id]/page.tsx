'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building, 
  ArrowLeft,
  Download,
  Eye,
  AlertTriangle,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Save,
  History
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentViewer } from '@/components/legal-documents/DocumentViewer'
import { DocumentApprovalActions } from '@/components/legal-documents/DocumentApprovalActions'
import { DocumentStatusBadge } from '@/components/legal-documents/DocumentStatusBadge'
import { useDocumentVerification } from '@/hooks/useDocumentVerification'

export default function DocumentVerificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [verificationNotes, setVerificationNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { 
    document, 
    documentHistory,
    isLoading, 
    approveDocument, 
    rejectDocument,
    addVerificationNote 
  } = useDocumentVerification({ documentId })

  useEffect(() => {
    if (document?.verificationNotes) {
      setVerificationNotes(document.verificationNotes)
    }
  }, [document])

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await approveDocument(documentId, verificationNotes)
      router.push('/admin/document-verification')
    } catch (error) {
      console.error('Failed to approve document:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async (reason: string) => {
    setIsSubmitting(true)
    try {
      await rejectDocument(documentId, reason)
      router.push('/admin/document-verification')
    } catch (error) {
      console.error('Failed to reject document:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveNotes = async () => {
    try {
      await addVerificationNote(documentId, verificationNotes)
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading document details...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
          <p>Document not found</p>
          <Link href="/admin/document-verification">
            <Button variant="outline" className="mt-4">
              Back to Verification Queue
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/document-verification">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Queue
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Document Verification</h1>
            <p className="text-muted-foreground">
              Review and verify document: {document.fileName || 'Untitled Document'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Full Screen
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {document.status === 'PENDING' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This document is awaiting verification. Please review all information carefully before making a decision.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Viewer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Document Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentViewer documentUrl={document.fileUrl} />
            </CardContent>
          </Card>

          {/* Tabs for Details, Notes, and History */}
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Document Details</TabsTrigger>
              <TabsTrigger value="notes">Verification Notes</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Information</CardTitle>
                  <CardDescription>Key details about the document.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Document ID</Label>
                      <p className="font-medium text-sm">{document.id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p className="font-medium text-sm">{document.documentType}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <DocumentStatusBadge status={document.status} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date Uploaded</Label>
                      <p className="font-medium text-sm">{new Date(document.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {document.user && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>Information about the user who uploaded the document.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{document.user.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{document.user.email}</p>
                    </div>
                    {document.user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{document.user.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {document.property && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                    <CardDescription>Details of the associated property.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{document.property.address}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Property ID: {document.property.id}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Notes</CardTitle>
                  <CardDescription>Add notes to document for future reference.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add verification notes here..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                    />
                    <Button onClick={handleSaveNotes} disabled={isSubmitting}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Document History</CardTitle>
                  <CardDescription>Timeline of all actions related to this document.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {documentHistory.length > 0 ? (
                    documentHistory.map((history, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <History className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="space-y-1">
                          <p className="font-medium">{history.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(history.timestamp).toLocaleString()} by {history.user?.name || 'System'}
                          </p>
                          {history.notes && (
                            <p className="text-xs italic text-gray-500">Notes: {history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No history found for this document.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Verification Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Actions</CardTitle>
              <CardDescription>Finalize the verification process.</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentApprovalActions
                onApprove={handleApprove}
                onReject={handleReject}
                isSubmitting={isSubmitting}
                canApprove={document.status === 'PENDING'}
                canReject={document.status === 'PENDING'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}