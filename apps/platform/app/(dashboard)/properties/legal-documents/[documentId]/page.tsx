'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Separator } from '@newcondo/ui/components/separator';
import {
  FileText,
  Download,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Upload
} from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@newcondo/ui/components/dialog';
import { Textarea } from '@newcondo/ui/components/textarea';
import { Label } from '@newcondo/ui/components/label';
import { toast } from '@newcondo/ui/';
import { DocumentStatus, DocumentType, DocumentSide } from '@newcondo/db';

interface DocumentData {
  id: string;
  documentType: DocumentType;
  documentSide?: DocumentSide;
  pageNumber?: number;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  status: DocumentStatus;
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  property?: {
    id: string;
    title: string;
  };
}

export default function LegalDocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reuploadDialogOpen, setReuploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/legal-documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      setDocument(data.document);
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/legal-documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast.success("Document Deleted", {
        description: "The document has been successfully deleted.",
      });

      router.push('/dashboard/properties/legal-documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error("Error"{
        description: "Failed to delete document. Please try again.",
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDownload = async () => {
    if (!document?.fileUrl) return;

    try {
      const response = await fetch(document.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.fileName || `document-${documentId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case DocumentStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      case DocumentStatus.EXPIRED:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case DocumentStatus.REJECTED:
        return <X className="h-4 w-4" />;
      case DocumentStatus.EXPIRED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDocumentType = (type: DocumentType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading document details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Document not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Details</h1>
          <p className="text-muted-foreground">
            View and manage your legal document
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>{formatDocumentType(document.documentType)}</CardTitle>
                    <CardDescription>
                      {document.property ? `For ${document.property.title}` : 'User document'}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(document.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(document.status)}
                    {document.status}
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document Number */}
              {document.documentNumber && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Document Number
                  </Label>
                  <p className="mt-1 font-mono">{document.documentNumber}</p>
                </div>
              )}

              {/* File Information */}
              {document.fileName && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      File Name
                    </Label>
                    <p className="mt-1">{document.fileName}</p>
                  </div>
                  {document.fileSizeBytes && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        File Size
                      </Label>
                      <p className="mt-1">{formatFileSize(document.fileSizeBytes)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Document Side & Page */}
              <div className="grid grid-cols-2 gap-4">
                {document.documentSide && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Document Side
                    </Label>
                    <p className="mt-1 capitalize">{document.documentSide.toLowerCase()}</p>
                  </div>
                )}
                {document.pageNumber && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Page Number
                    </Label>
                    <p className="mt-1">{document.pageNumber}</p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Uploaded
                  </Label>
                  <p className="mt-1">{new Date(document.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </Label>
                  <p className="mt-1">{new Date(document.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Expiration */}
              {document.expiresAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Expires On
                  </Label>
                  <p className="mt-1">{new Date(document.expiresAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Notes */}
          {document.verificationNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">{document.verificationNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {document.fileUrl && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(document.fileUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </>
              )}

              {document.status !== DocumentStatus.APPROVED && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setReuploadDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Re-upload
                </Button>
              )}

              <Separator />

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle>Document Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Required</span>
                <Badge variant={document.isRequired ? "default" : "secondary"}>
                  {document.isRequired ? "Yes" : "No"}
                </Badge>
              </div>

              {document.status === DocumentStatus.PENDING && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your document is under review. This may take 1-3 business days.
                  </AlertDescription>
                </Alert>
              )}

              {document.status === DocumentStatus.REJECTED && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    Your document has been rejected. Please check the verification notes and upload a new version.
                  </AlertDescription>
                </Alert>
              )}

              {document.status === DocumentStatus.EXPIRED && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This document has expired. Please upload a new version.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-upload Dialog */}
      <Dialog open={reuploadDialogOpen} onOpenChange={setReuploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-upload Document</DialogTitle>
            <DialogDescription>
              Navigate to upload a new version of this document.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReuploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => router.push('/dashboard/properties/legal-documents/upload')}>
              Go to Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}