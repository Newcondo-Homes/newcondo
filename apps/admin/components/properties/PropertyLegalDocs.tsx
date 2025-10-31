'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface Document {
  id: string;
  documentType: string;
  fileName?: string | null;
  fileUrl?: string | null;
  documentNumber?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationNotes?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

interface PropertyLegalDocsProps {
  documents: Document[];
  propertyId: string;
  isOwnerListing: boolean;
  onApproveDocument?: (documentId: string) => void;
  onRejectDocument?: (documentId: string, reason: string) => void;
}

export function PropertyLegalDocs({
  documents,
  propertyId,
  isOwnerListing,
  onApproveDocument,
  onRejectDocument,
}: PropertyLegalDocsProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const propertyDocuments = documents.filter((doc) =>
    ['OWNERSHIP_DOCUMENT', 'CONSENT_DOCUMENT', 'UNDERTAKING_DOCUMENT'].includes(doc.documentType)
  );

  const getDocumentTypeName = (type: string) => {
    const names: Record<string, string> = {
      OWNERSHIP_DOCUMENT: 'Proof of Ownership',
      CONSENT_DOCUMENT: 'Consent Document',
      UNDERTAKING_DOCUMENT: 'Undertaking Document',
    };
    return names[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            <AlertCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentIcon = (type: string) => {
    return <FileText className="h-5 w-5 text-blue-600" />;
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Required documents based on listing type
  const requiredDocs = isOwnerListing
    ? ['OWNERSHIP_DOCUMENT', 'UNDERTAKING_DOCUMENT']
    : ['CONSENT_DOCUMENT', 'UNDERTAKING_DOCUMENT'];

  const missingDocs = requiredDocs.filter(
    (reqDoc) => !propertyDocuments.some((doc) => doc.documentType === reqDoc)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Legal Documents</CardTitle>
          <CardDescription>
            Property ownership and consent documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Missing Documents Alert */}
          {missingDocs.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing Required Documents:</strong>
                <ul className="mt-2 list-inside list-disc">
                  {missingDocs.map((doc) => (
                    <li key={doc}>{getDocumentTypeName(doc)}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Document List */}
          {propertyDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
              <FileText className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-500">No legal documents uploaded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {propertyDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getDocumentIcon(document.documentType)}</div>
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {getDocumentTypeName(document.documentType)}
                        </h4>
                        {document.fileName && (
                          <p className="text-sm text-gray-500">{document.fileName}</p>
                        )}
                        {document.documentNumber && (
                          <p className="text-sm text-gray-500">
                            Document #: {document.documentNumber}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(document.status)}
                        {document.expiresAt && (
                          <Badge
                            variant="outline"
                            className={isExpired(document.expiresAt) ? 'text-red-600' : ''}
                          >
                            Expires: {new Date(document.expiresAt).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>

                      {document.verificationNotes && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-600">{document.verificationNotes}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        Uploaded: {new Date(document.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {document.fileUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={document.fileUrl}
                            download={document.fileName || 'document'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Document Requirements Info */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Required Documents:</strong>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                {isOwnerListing ? (
                  <>
                    <li>Proof of Ownership (e.g., Certificate of Occupancy, Deed of Assignment)</li>
                    <li>Signed Undertaking Document</li>
                  </>
                ) : (
                  <>
                    <li>Consent Document from Property Owner</li>
                    <li>Signed Undertaking Document</li>
                  </>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument && getDocumentTypeName(selectedDocument.documentType)}
            </DialogTitle>
          </DialogHeader>

          {selectedDocument?.fileUrl && (
            <div className="space-y-4">
              {/* Document Info */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    {getStatusBadge(selectedDocument.status)}
                  </div>
                  {selectedDocument.fileName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">File:</span>
                      <span className="font-medium">{selectedDocument.fileName}</span>
                    </div>
                  )}
                  {selectedDocument.documentNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Document Number:</span>
                      <span className="font-mono text-xs">
                        {selectedDocument.documentNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Preview */}
              <div className="relative overflow-hidden rounded-lg border bg-gray-100">
                <iframe
                  src={selectedDocument.fileUrl}
                  className="h-[600px] w-full"
                  title="Document Preview"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  asChild
                >
                  <a
                    href={selectedDocument.fileUrl}
                    download={selectedDocument.fileName || 'document'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
                {selectedDocument.status === 'PENDING' && onApproveDocument && (
                  <>
                    <Button
                      onClick={() => {
                        onApproveDocument(selectedDocument.id);
                        setViewerOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Please provide a reason for rejection:');
                        if (reason && onRejectDocument) {
                          onRejectDocument(selectedDocument.id, reason);
                          setViewerOpen(false);
                        }
                      }}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}