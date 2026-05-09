'use client';
// apps/platform/components/property/property-ownership-verification.tsx

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Badge } from '@newcondo/ui/components/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Progress } from '@newcondo/ui/components/progress';
import {
  FileText,
  Check,
  X,
  AlertTriangle,
  Camera,
  Shield,
  Clock,
  Info,
} from 'lucide-react';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';
import { toast } from '@newcondo/ui/';
import { DocumentType, DocumentStatus } from '@/types/enums';

interface Document {
  id: string;
  documentType: DocumentType;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  status: DocumentStatus;
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: Date;
}

interface PropertyOwnershipVerificationProps {
  propertyId?: string;
  onVerificationComplete: (isVerified: boolean) => void;
  onDocumentUpload: (document: Partial<Document>) => void;
  userDocuments: Document[];
  isLoading?: boolean;
  className?: string;
}

const REQUIRED_DOCUMENTS = [
  {
    type: DocumentType.NIN,
    name: 'National Identification Number (NIN)',
    description: 'Your 11-digit NIN for identity verification',
    format: 'ID Number',
    required: true,
    icon: FileText,
  },
  {
    type: DocumentType.OWNERSHIP_DOCUMENT,
    name: 'Property Ownership Document',
    description: 'Certificate of Occupancy, Deed of Assignment, or Purchase Agreement',
    format: 'PDF/Image',
    required: true,
    icon: FileText,
  },
  {
    type: DocumentType.UTILITY_BILL,
    name: 'Utility Bill',
    description: 'Recent electricity, water, or waste bill for the property',
    format: 'PDF/Image',
    required: true,
    icon: FileText,
  },
  {
    type: DocumentType.SELFIE,
    name: 'Selfie Verification',
    description: 'Clear photo of yourself holding your ID document',
    format: 'Image',
    required: true,
    icon: Camera,
  },
];

export default function PropertyOwnershipVerification({
  onVerificationComplete,
  onDocumentUpload,
  userDocuments,
  isLoading = false,
  className = '',
}: PropertyOwnershipVerificationProps) {
  const [ninNumber, setNinNumber] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState<DocumentType | null>(null);

  const getDocumentStatus = (docType: DocumentType) =>
    userDocuments.find((doc) => doc.documentType === docType);

  const getVerificationProgress = () => {
    const completed = REQUIRED_DOCUMENTS.filter((doc) => {
      const userDoc = getDocumentStatus(doc.type);
      return (
        userDoc &&
        (userDoc.status === DocumentStatus.APPROVED ||
          userDoc.documentNumber ||
          userDoc.fileUrl)
      );
    });
    return (completed.length / REQUIRED_DOCUMENTS.length) * 100;
  };

  // Wrapped in useCallback so it can be listed as a stable dependency
  const isVerificationComplete = useCallback(() => {
    return REQUIRED_DOCUMENTS.every((doc) => {
      const userDoc = userDocuments.find((d) => d.documentType === doc.type);
      return (
        userDoc &&
        (userDoc.status === DocumentStatus.APPROVED ||
          userDoc.documentNumber ||
          userDoc.fileUrl)
      );
    });
  }, [userDocuments]);

  const handleNinSubmit = async () => {
    if (!ninNumber || ninNumber.length !== 11) {
      toast.error('Invalid NIN', {
        description: 'Please enter a valid 11-digit NIN',
      });
      return;
    }

    try {
      await onDocumentUpload({
        documentType: DocumentType.NIN,
        documentNumber: ninNumber,
        status: DocumentStatus.PENDING,
        isRequired: true,
      });

      toast('NIN Submitted', {
        description: 'Your NIN has been submitted for verification',
      });
    } catch {
      toast.error('Submission Failed', {
        description: 'Failed to submit NIN. Please try again.',
      });
    }
  };

  const handleFileUpload = async (
    docType: DocumentType,
    url: string,
    fileName: string
  ) => {
    try {
      setUploadingDocument(docType);

      await onDocumentUpload({
        documentType: docType,
        fileName,
        fileUrl: url,
        status: DocumentStatus.PENDING,
        isRequired: true,
      });

      toast.success('Document Uploaded', {
        description: `${REQUIRED_DOCUMENTS.find((d) => d.type === docType)?.name} uploaded successfully`,
      });

      setUploadingDocument(null);
    } catch {
      toast.error('Upload Failed', {
        description: 'Failed to upload document. Please try again.',
      });
      setUploadingDocument(null);
    }
  };

  const renderDocumentStatus = (docType: DocumentType) => {
    const userDoc = getDocumentStatus(docType);

    if (!userDoc) return <Badge variant="secondary">Not Submitted</Badge>;

    switch (userDoc.status) {
      case DocumentStatus.APPROVED:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case DocumentStatus.PENDING:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case DocumentStatus.REJECTED:
        return (
          <Badge variant="destructive">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">Not Submitted</Badge>;
    }
  };

  const renderDocumentItem = (doc: (typeof REQUIRED_DOCUMENTS)[0]) => {
    const userDoc = getDocumentStatus(doc.type);
    const Icon = doc.icon;
    const isUploading = uploadingDocument === doc.type;

    return (
      <div key={doc.type} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{doc.name}</h4>
              <p className="text-sm text-gray-500">{doc.description}</p>
              <p className="text-xs text-gray-400 mt-1">Format: {doc.format}</p>
            </div>
          </div>
          <div className="flex-shrink-0">{renderDocumentStatus(doc.type)}</div>
        </div>

        {userDoc?.status === DocumentStatus.REJECTED && userDoc.verificationNotes && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Rejection Reason:</strong> {userDoc.verificationNotes}
            </AlertDescription>
          </Alert>
        )}

        {(!userDoc || userDoc.status === DocumentStatus.REJECTED) && (
          <div className="space-y-2">
            {doc.type === DocumentType.NIN ? (
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter your 11-digit NIN"
                  value={ninNumber}
                  onChange={(e) =>
                    setNinNumber(e.target.value.replace(/\D/g, '').slice(0, 11))
                  }
                  maxLength={11}
                  className="flex-1"
                />
                <Button
                  onClick={handleNinSubmit}
                  disabled={ninNumber.length !== 11 || isLoading}
                  size="sm"
                >
                  Submit
                </Button>
              </div>
            ) : (
              <UploadButton<OurFileRouter, 'propertyDocuments'>
                endpoint="propertyDocuments"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) {
                    handleFileUpload(doc.type, res[0].url, res[0].name);
                  }
                }}
                onUploadError={(error) => {
                  toast.error('Upload Error', { description: error.message });
                }}
                appearance={{
                  button:
                    'w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50',
                  allowedContent: 'text-xs text-gray-500 mt-1',
                }}
                content={{
                  button: isUploading ? 'Uploading...' : 'Upload Document',
                  allowedContent: 'Max file size: 10MB. Supported: PDF, JPG, PNG',
                }}
              />
            )}
          </div>
        )}

        {userDoc?.fileUrl && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{userDoc.fileName}</span>
            <a
              href={userDoc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              View
            </a>
          </div>
        )}
      </div>
    );
  };

  // isVerificationComplete is now stable (useCallback) so it's safe in the dep array
  useEffect(() => {
    if (isVerificationComplete()) {
      onVerificationComplete(true);
    }
  }, [isVerificationComplete, onVerificationComplete]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Property Ownership Verification</span>
              </CardTitle>
              <CardDescription>
                Verify your identity and property ownership to use the marking service
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(getVerificationProgress())}%
              </div>
            </div>
          </div>
          <Progress value={getVerificationProgress()} className="mt-2" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Required Documents</CardTitle>
          <CardDescription>
            Please provide the following documents for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">{REQUIRED_DOCUMENTS.map(renderDocumentItem)}</div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> All documents will be reviewed by our verification team within
          24-48 hours. You&apos;ll receive an email notification once the verification is complete.
        </AlertDescription>
      </Alert>

      {isVerificationComplete() && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Verification Complete!</strong> You can now proceed with the property marking
            service.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}