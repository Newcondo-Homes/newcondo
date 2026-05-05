'use client'

import { useState } from 'react'
import { Badge } from '@newcondo/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card'
import { Progress } from '@newcondo/ui/components/progress'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Clock, FileText, Shield, Upload, User, Building } from 'lucide-react'
import { Alert, AlertDescription } from '@newcondo/ui/components/alert'
import { type LucideIcon } from 'lucide-react'

type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected'

interface DocumentRequirement {
  type: string
  label: string
  required: boolean
  status: DocumentStatus
  rejectionReason?: string
  uploadedAt?: string
  approvedAt?: string
  icon: LucideIcon
}

interface ComplianceStatusProps {
  userRole: 'OWNER' | 'AGENT' | 'RENTER'
  userVerificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  documents: Array<{
    id: string
    documentType: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    createdAt: string
    verificationNotes?: string
  }>
  onUploadDocument: (documentType: string) => void
  onViewDetails: () => void
}

export function ComplianceStatus({ 
  userRole, 
  userVerificationStatus, 
  documents, 
  onUploadDocument, 
  onViewDetails 
}: ComplianceStatusProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getRequiredDocuments = (role: string): DocumentRequirement[] => {
    const baseRequirements: DocumentRequirement[] = [
      {
        type: 'NIN',
        label: 'National Identification Number',
        required: true,
        status: 'pending',
        icon: User
      },
      {
        type: 'SELFIE',
        label: 'Verification Selfie',
        required: true,
        status: 'pending',
        icon: User
      }
    ]

    if (role === 'OWNER') {
      return [
        ...baseRequirements,
        {
          type: 'OWNERSHIP_DOCUMENT',
          label: 'Proof of Ownership',
          required: true,
          status: 'pending',
          icon: Building
        },
        {
          type: 'UNDERTAKING_DOCUMENT',
          label: 'Legal Undertaking',
          required: true,
          status: 'pending',
          icon: FileText
        }
      ]
    }

    if (role === 'AGENT') {
      return [
        ...baseRequirements,
        {
          type: 'CONSENT_DOCUMENT',
          label: 'Property Owner Consent',
          required: true,
          status: 'pending',
          icon: FileText
        },
        {
          type: 'BUSINESS_REGISTRATION',
          label: 'Business Registration',
          required: false,
          status: 'pending',
          icon: Building
        }
      ]
    }

    return baseRequirements
  }

  const requirements = getRequiredDocuments(userRole)

  const updatedRequirements = requirements.map(req => {
    const uploadedDoc = documents.find(doc => doc.documentType === req.type)
    if (uploadedDoc) {
      return {
        ...req,
        status: uploadedDoc.status.toLowerCase() as DocumentStatus,
        rejectionReason: uploadedDoc.verificationNotes,
        uploadedAt: uploadedDoc.createdAt,
        approvedAt: uploadedDoc.status === 'APPROVED' ? uploadedDoc.createdAt : undefined
      }
    }
    return req
  })

  const totalRequired = updatedRequirements.filter(req => req.required).length
  const completedRequired = updatedRequirements.filter(
    req => req.required && (req.status === 'approved' || req.status === 'uploaded')
  ).length
  const progressPercentage = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'uploaded': case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Upload className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-green-500">Approved</Badge>
      case 'uploaded': return <Badge variant="default" className="bg-yellow-500">Under Review</Badge>
      case 'pending': return <Badge variant="outline">Pending Upload</Badge>
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>
      default: return <Badge variant="outline">Not Uploaded</Badge>
    }
  }

  const overallComplianceStatus = () => {
    if (userVerificationStatus === 'VERIFIED' && progressPercentage === 100) {
      return { status: 'compliant', label: 'Fully Compliant', color: 'text-green-600' }
    } else if (progressPercentage >= 50) {
      return { status: 'partial', label: 'Partially Compliant', color: 'text-yellow-600' }
    } else {
      return { status: 'non-compliant', label: 'Non-Compliant', color: 'text-red-600' }
    }
  }

  const compliance = overallComplianceStatus()

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Legal Compliance Status</CardTitle>
          </div>
          <Badge 
            variant={compliance.status === 'compliant' ? 'default' : 'outline'} 
            className={compliance.status === 'compliant' ? 'bg-green-500' : ''}
          >
            {compliance.label}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Document Compliance Progress</span>
            <span>{completedRequired}/{totalRequired} Required Documents</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {userVerificationStatus !== 'VERIFIED' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userVerificationStatus === 'PENDING' 
                ? 'Your identity verification is pending admin approval.'
                : 'Your identity verification was rejected. Please upload correct documents.'
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {updatedRequirements.slice(0, 4).map((req) => (
            <div key={req.type} className="flex flex-col items-center p-3 border rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <req.icon className="h-4 w-4 text-gray-500" />
                {getStatusIcon(req.status)}
              </div>
              <span className="text-xs font-medium text-center">{req.label}</span>
              <span className={`text-xs ${req.required ? 'text-red-500' : 'text-gray-500'}`}>
                {req.required ? 'Required' : 'Optional'}
              </span>
            </div>
          ))}
        </div>

        {showDetails && (
          <div className="space-y-3 pt-4 border-t">
            {updatedRequirements.map((req) => (
              <div key={req.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <req.icon className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{req.label}</div>
                    {req.rejectionReason && (
                      <div className="text-xs text-red-600 mt-1">
                        Rejection reason: {req.rejectionReason}
                      </div>
                    )}
                    {req.uploadedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Uploaded: {new Date(req.uploadedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(req.status)}
                  {(req.status === 'pending' || req.status === 'rejected') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onUploadDocument(req.type)}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </Button>
          <Button onClick={onViewDetails} className="flex-1">
            Manage Documents
          </Button>
        </div>

        {progressPercentage < 100 && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> Complete all required document uploads to achieve full compliance. 
              This will enable you to list properties and participate fully on the platform.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}