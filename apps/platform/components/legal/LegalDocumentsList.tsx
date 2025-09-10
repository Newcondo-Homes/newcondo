'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Download, 
  Eye, 
  MoreVertical, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  User,
  Building,
  Shield,
  RefreshCw,
  Trash2
} from 'lucide-react'

interface Document {
  id: string
  documentType: string
  documentSide?: 'FRONT' | 'BACK' | 'SINGLE'
  documentNumber?: string
  fileName?: string
  fileUrl?: string
  fileSizeBytes?: number
  mimeType?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  verificationNotes?: string
  isRequired: boolean
  expiresAt?: string
  createdAt: string
  updatedAt: string
  pageNumber?: number
  propertyId?: string
}

interface Property {
  id: string
  title: string
  address: string
}

interface LegalDocumentsListProps {
  documents: Document[]
  properties: Property[]
  userRole: 'OWNER' | 'AGENT' | 'RENTER'
  onUploadDocument: (documentType: string, propertyId?: string) => void
  onViewDocument: (documentId: string) => void
  onDownloadDocument: (documentId: string) => void
  onDeleteDocument: (documentId: string) => void
  onRetryUpload: (documentId: string) => void
  isLoading?: boolean
}

const DOCUMENT_TYPE_LABELS: Record<string, { label: string; icon: any; category: string }> = {
  'NIN': { label: 'National ID Number', icon: User, category: 'identity' },
  'BVN': { label: 'Bank Verification Number', icon: User, category: 'identity' },
  'PASSPORT': { label: 'International Passport', icon: User, category: 'identity' },
  'VOTERS_CARD': { label: 'Voter\'s Card', icon: User, category: 'identity' },
  'DRIVERS_LICENSE': { label: 'Driver\'s License', icon: User, category: 'identity' },
  'SELFIE': { label: 'Verification Selfie', icon: User, category: 'identity' },
  'OWNERSHIP_DOCUMENT': { label: 'Proof of Ownership', icon: Building, category: 'property' },
  'CONSENT_DOCUMENT': { label: 'Owner Consent Form', icon: FileText, category: 'property' },
  'UNDERTAKING_DOCUMENT': { label: 'Legal Undertaking', icon: Shield, category: 'legal' },
  'BUSINESS_REGISTRATION': { label: 'Business Registration', icon: Building, category: 'business' },
  'TAX_CERTIFICATE': { label: 'Tax Certificate', icon: FileText, category: 'business' },
  'UTILITY_BILL': { label: 'Utility Bill', icon: FileText, category: 'verification' },
  'BANK_STATEMENT': { label: 'Bank Statement', icon: FileText, category: 'verification' },
  'OTHER': { label: 'Other Document', icon: FileText, category: 'other' }
}

export function LegalDocumentsList({
  documents,
  properties,
  userRole,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onRetryUpload,
  isLoading = false
}: LegalDocumentsListProps) {
  const [selectedTab, setSelectedTab] = useState('all')
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
      case 'PENDING':
        return <Badge variant="default" className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'EXPIRED':
        return <Badge variant="outline" className="text-orange-600"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getDocumentIcon = (documentType: string) => {
    const docInfo = DOCUMENT_TYPE_LABELS[documentType]
    if (docInfo) {
      const Icon = docInfo.icon
      return <Icon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const categorizeDocuments = () => {
    const categories = {
      identity: documents.filter(doc => DOCUMENT_TYPE_LABELS[doc.documentType]?.category === 'identity'),
      property: documents.filter(doc => DOCUMENT_TYPE_LABELS[doc.documentType]?.category === 'property'),
      legal: documents.filter(doc => DOCUMENT_TYPE_LABELS[doc.documentType]?.category === 'legal'),
      business: documents.filter(doc => DOCUMENT_TYPE_LABELS[doc.documentType]?.category === 'business'),
      verification: documents.filter(doc => DOCUMENT_TYPE_LABELS[doc.documentType]?.category === 'verification'),
      other: documents.filter(doc => DOCUMENT_TYPE_LABELS[doc.documentType]?.category === 'other')
    }
    return categories
  }

  const filteredDocuments = () => {
    let filtered = documents

    if (selectedTab !== 'all') {
      const categories = categorizeDocuments()
      filtered = categories[selectedTab as keyof typeof categories] || []
    }

    if (selectedProperty) {
      filtered = filtered.filter(doc => doc.propertyId === selectedProperty)
    }

    return filtered
  }

  const getRequiredDocuments = () => {
    const required = ['NIN', 'SELFIE']
    
    if (userRole === 'OWNER') {
      required.push('OWNERSHIP_DOCUMENT', 'UNDERTAKING_DOCUMENT')
    } else if (userRole === 'AGENT') {
      required.push('CONSENT_DOCUMENT')
    }
    
    return required
  }

  const getMissingRequiredDocuments = () => {
    const required = getRequiredDocuments()
    const uploaded = documents.map(doc => doc.documentType)
    return required.filter(type => !uploaded.includes(type))
  }

  const categories = categorizeDocuments()
  const missingRequired = getMissingRequiredDocuments()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Legal Documents
          </CardTitle>
          <div className="flex items-center gap-2">
            {properties.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {selectedProperty ? 
                      properties.find(p => p.id === selectedProperty)?.title || 'Select Property' 
                      : 'All Properties'
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedProperty(null)}>
                    All Properties
                  </DropdownMenuItem>
                  {properties.map(property => (
                    <DropdownMenuItem 
                      key={property.id}
                      onClick={() => setSelectedProperty(property.id)}
                    >
                      {property.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={() => onUploadDocument('OTHER')} size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Missing Required Documents Alert */}
        {missingRequired.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Missing Required Documents:</strong> {missingRequired.map(type => 
                DOCUMENT_TYPE_LABELS[type]?.label || type
              ).join(', ')}. Please upload these documents to complete your compliance.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
            <TabsTrigger value="identity">Identity ({categories.identity.length})</TabsTrigger>
            <TabsTrigger value="property">Property ({categories.property.length})</TabsTrigger>
            <TabsTrigger value="legal">Legal ({categories.legal.length})</TabsTrigger>
            <TabsTrigger value="business">Business ({categories.business.length})</TabsTrigger>
            <TabsTrigger value="verification">Verification ({categories.verification.length})</TabsTrigger>
            <TabsTrigger value="other">Other ({categories.other.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading documents...
              </div>
            ) : filteredDocuments().length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Documents Found</h3>
                <p className="text-gray-500 mb-4">
                  {selectedTab === 'all' ? 'You haven\'t uploaded any documents yet.' : `No ${selectedTab} documents found.`}
                </p>
                <Button onClick={() => onUploadDocument('OTHER')} variant="outline">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Your First Document
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>File Info</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments().map((document) => {
                      const docInfo = DOCUMENT_TYPE_LABELS[document.documentType]
                      const property = properties.find(p => p.id === document.propertyId)
                      
                      return (
                        <TableRow key={document.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDocumentIcon(document.documentType)}
                              <div>
                                <div className="font-medium">
                                  {docInfo?.label || document.documentType}
                                  {document.isRequired && (
                                    <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                                  )}
                                </div>
                                {document.documentSide && document.documentSide !== 'SINGLE' && (
                                  <div className="text-xs text-gray-500">
                                    {document.documentSide} Side
                                  </div>
                                )}
                                {document.documentNumber && (
                                  <div className="text-xs text-gray-500">
                                    ID: {document.documentNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              {getStatusBadge(document.status)}
                              {document.status === 'REJECTED' && document.verificationNotes && (
                                <div className="text-xs text-red-600">
                                  {document.verificationNotes}
                                </div>
                              )}
                              {document.expiresAt && (
                                <div className="text-xs text-orange-600">
                                  Expires: {new Date(document.expiresAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {property ? (
                              <div>
                                <div className="font-medium text-sm">{property.title}</div>
                                <div className="text-xs text-gray-500">{property.address}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">General</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {document.fileName ? (
                              <div className="text-sm">
                                <div className="font-medium">{document.fileName}</div>
                                <div className="text-xs text-gray-500">
                                  {formatFileSize(document.fileSizeBytes)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">ID Only</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(document.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {document.fileUrl && (
                                  <>
                                    <DropdownMenuItem onClick={() => onViewDocument(document.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDownloadDocument(document.id)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {document.status === 'REJECTED' && (
                                  <DropdownMenuItem onClick={() => onRetryUpload(document.id)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Re-upload
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => onDeleteDocument(document.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Upload Buttons for Missing Required Documents */}
        {missingRequired.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Upload Required Documents</h4>
            <div className="flex flex-wrap gap-2">
              {missingRequired.map(docType => (
                <Button
                  key={docType}
                  variant="outline"
                  size="sm"
                  onClick={() => onUploadDocument(docType)}
                  className="border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {DOCUMENT_TYPE_LABELS[docType]?.label || docType}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}