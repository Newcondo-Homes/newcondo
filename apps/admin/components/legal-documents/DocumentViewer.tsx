'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@newcondo/ui/components/ui/dialog';
import { Button } from '@newcondo/ui/components/ui/button';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { Separator } from '@newcondo/ui/components/ui/separator';
import { 
  FileText, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Eye,
  Calendar,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Document, DocumentStatus, DocumentType } from '@newcondo/db';
import { cn } from '@newcondo/ui/lib/utils';

interface DocumentViewerProps {
  document: Document & {
    user: {
      id: string;
      name: string;
      email: string;
    };
    property?: {
      id: string;
      title: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function DocumentViewer({ 
  document, 
  isOpen, 
  onClose,
  className 
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
      setIsLoading(true);
      setImageError(false);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    if (document.fileUrl) {
      try {
        const response = await fetch(document.fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.fileName || `document-${document.id}`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Eye className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      NIN: 'National Identity Number',
      BVN: 'Bank Verification Number',
      PASSPORT: 'International Passport',
      VOTERS_CARD: "Voter's Card",
      DRIVERS_LICENSE: "Driver's License",
      SELFIE: 'Selfie Photo',
      OWNERSHIP_DOCUMENT: 'Ownership Document',
      CONSENT_DOCUMENT: 'Consent Document',
      UNDERTAKING_DOCUMENT: 'Undertaking Document',
      BUSINESS_REGISTRATION: 'Business Registration',
      TAX_CERTIFICATE: 'Tax Certificate',
      UTILITY_BILL: 'Utility Bill',
      BANK_STATEMENT: 'Bank Statement',
      OTHER: 'Other Document'
    };
    return labels[type] || type;
  };

  const isImage = document.mimeType?.startsWith('image/');
  const isPDF = document.mimeType === 'application/pdf';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-hidden", className)}>
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {getDocumentTypeLabel(document.documentType)}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(document.status)}>
                {getStatusIcon(document.status)}
                {document.status}
              </Badge>
            </div>
          </div>

          {/* Document Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{document.user.name}</p>
                  <p className="text-gray-600">{document.user.email}</p>
                </div>
              </div>

              {document.property && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Property</p>
                    <p className="text-gray-600">{document.property.title}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Uploaded</p>
                  <p className="text-gray-600">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {document.documentNumber && (
              <div className="pt-2 border-t">
                <p className="text-sm">
                  <span className="font-medium">Document Number:</span>{' '}
                  <span className="font-mono">{document.documentNumber}</span>
                </p>
              </div>
            )}

            {document.verificationNotes && (
              <div className="pt-2 border-t">
                <p className="text-sm">
                  <span className="font-medium">Verification Notes:</span>{' '}
                  {document.verificationNotes}
                </p>
              </div>
            )}

            {document.expiresAt && (
              <div className="pt-2 border-t">
                <p className="text-sm">
                  <span className="font-medium">Expires:</span>{' '}
                  <span className={cn(
                    new Date(document.expiresAt) < new Date() 
                      ? 'text-red-600 font-medium' 
                      : 'text-gray-600'
                  )}>
                    {new Date(document.expiresAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator />

        {/* Document Content */}
        <div className="flex-1 overflow-hidden">
          {document.fileUrl ? (
            <div className="space-y-4">
              {/* Controls */}
              {isImage && (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoom <= 50}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{zoom}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoom >= 300}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotate}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}

              {/* Document Display */}
              <div className="flex justify-center max-h-[60vh] overflow-auto bg-gray-100 rounded-lg p-4">
                {isImage ? (
                  <div className="relative">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    {imageError ? (
                      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                        <AlertCircle className="h-12 w-12 mb-2" />
                        <p>Failed to load image</p>
                      </div>
                    ) : (
                      <img
                        src={document.fileUrl}
                        alt={`Document: ${document.documentType}`}
                        style={{
                          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                          transformOrigin: 'center',
                          transition: 'transform 0.2s ease-in-out'
                        }}
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                          setIsLoading(false);
                          setImageError(true);
                        }}
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>
                ) : isPDF ? (
                  <div className="w-full h-full">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">PDF Document</p>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                    <iframe
                      src={document.fileUrl}
                      className="w-full h-96 border rounded"
                      title="PDF Document"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                    <FileText className="h-12 w-12 mb-2" />
                    <p>Preview not available for this file type</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownload}
                      className="mt-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : document.documentNumber ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <FileText className="h-12 w-12 mb-2" />
              <p>ID-Only Document</p>
              <p className="text-sm mt-2">
                Document Number: <span className="font-mono">{document.documentNumber}</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p>No document file or number available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}