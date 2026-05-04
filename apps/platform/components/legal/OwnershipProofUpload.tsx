'use client';

import { useState } from 'react';
import { UploadDropzone } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { AlertCircle, CheckCircle2, Upload, X, FileText, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@newcondo/ui/components/dialog';
import { Progress } from '@newcondo/ui/components/progress';
import { toast } from '@newcondo/ui/';
import { cn } from '@newcondo/ui/lib/utils';
import Image from 'next/image';

type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
}

interface OwnershipDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  status: DocumentStatus;
  verificationNotes?: string;
  createdAt: string;
  expiresAt?: string;
}

interface OwnershipProofUploadProps {
  propertyId?: string;
  existingDocuments?: OwnershipDocument[];
  onUploadComplete?: (document: OwnershipDocument) => void;
  onRemoveDocument?: (documentId: string) => void;
  className?: string;
  disabled?: boolean;
}

export function OwnershipProofUpload({
  propertyId,
  existingDocuments = [],
  onUploadComplete,
  onRemoveDocument,
  className,
  disabled = false
}: OwnershipProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // const [previewDocument, setPreviewDocument] = useState<OwnershipDocument | null>(null);

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'REJECTED':
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleUploadComplete = async (res: UploadedFile[]) => {
    try {
      setIsUploading(true);

      // Create document record via API
      const response = await fetch('/api/documents/ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          fileName: res[0].name,
          fileUrl: res[0].url,
          fileSizeBytes: res[0].size,
          documentType: 'OWNERSHIP_DOCUMENT'
        })
      });

      if (!response.ok) throw new Error('Failed to save document');

      const document = await response.json();
      onUploadComplete?.(document);

      toast.success('Document uploaded successfully', {
        description: 'Your ownership proof has been submitted for verification.'
      });
    } catch {
      toast.error('Upload failed', {
        description: 'There was an error uploading your document. Please try again.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove document');

      onRemoveDocument?.(documentId);

      toast.success('Document removed', {
        description: 'The document has been successfully removed.'
      });
    } catch {
      toast.error('Removal failde', {
        description: 'There was an error removing the document. Please try again.',
      });
    }
  };

  const hasApprovedDocument = existingDocuments.some(doc => doc.status === 'APPROVED');
  const hasPendingDocument = existingDocuments.some(doc => doc.status === 'PENDING');

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ownership Proof Upload
        </CardTitle>
        <CardDescription>
          Upload documents that prove your ownership of the property. Accepted formats: PDF, JPG, PNG (Max 5MB)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alert for requirements */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Required Documents:</strong> Certificate of Occupancy (C of O),
            Deed of Assignment, or any legal document proving ownership.
          </AlertDescription>
        </Alert>

        {/* Existing Documents */}
        {existingDocuments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Uploaded Documents</h4>
            {existingDocuments.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">{document.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(document.fileSizeBytes)} •
                      Uploaded {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                    {document.verificationNotes && (
                      <p className="text-xs text-red-600 mt-1">{document.verificationNotes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(document.status)}>
                    {getStatusIcon(document.status)}
                    {document.status.toLowerCase().replace('_', ' ')}
                  </Badge>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Document Preview</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center">
                        {document.fileUrl.toLowerCase().includes('.pdf') ? (
                          <iframe
                            src={document.fileUrl}
                            className="w-full h-[60vh]"
                            title="Document Preview"
                          />
                        ) : (
                          <Image
                            src={document.fileUrl}
                            alt="Document"
                            width={800}
                            height={600}
                            className="max-w-full h-auto max-h-[60vh] object-contain"
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {document.status !== 'APPROVED' && !disabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveDocument(document.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Area */}
        {!hasApprovedDocument && !hasPendingDocument && !disabled && (
          <UploadDropzone<OurFileRouter, 'propertyDocuments'>
            endpoint='propertyDocuments'
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => {
              toast.error('Upload failed', {
                description: error.message,
              });
            }}
            onUploadProgress={(progress) => {
              setUploadProgress(progress);
            }}
            appearance={{
              button: "bg-primary text-primary-foreground hover:bg-primary/90",
              allowedContent: "text-muted-foreground",
              label: "text-foreground"
            }}
            content={{
              button: "Upload Ownership Document",
              allowedContent: "PDF, JPG, PNG (Max 5MB)",
              label: "Click to upload or drag and drop your ownership document"
            }}
          />
        )}

        {/* Status Messages */}
        {hasApprovedDocument && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your ownership document has been verified and approved.
            </AlertDescription>
          </Alert>
        )}

        {hasPendingDocument && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your ownership document is under review. This process typically takes 1-2 business days.
            </AlertDescription>
          </Alert>
        )}

        {disabled && (
          <Alert className="border-gray-200 bg-gray-50">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-800">
              Document upload is currently disabled. Please contact support if you need to update your documents.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}