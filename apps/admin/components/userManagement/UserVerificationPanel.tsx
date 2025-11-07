"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Download,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  documentType: string;
  documentSide?: string;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationNotes?: string;
  createdAt: string;
}

interface UserVerificationPanelProps {
  userId: string;
  onVerificationComplete?: () => void;
}

export default function UserVerificationPanel({ 
  userId, 
  onVerificationComplete 
}: UserVerificationPanelProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/documents`);
      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDocument = async (docId: string) => {
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/users/${userId}/documents/${docId}/approve`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to approve document');

      toast({
        title: 'Success',
        description: 'Document approved successfully.',
      });

      fetchDocuments();
      onVerificationComplete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve document.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDocument = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/users/${userId}/documents/${selectedDoc.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (!response.ok) throw new Error('Failed to reject document');

      toast({
        title: 'Success',
        description: 'Document rejected.',
      });

      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedDoc(null);
      fetchDocuments();
      onVerificationComplete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject document.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    const pendingDocs = documents.filter(d => d.status === 'PENDING');
    
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/users/${userId}/documents/approve-all`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to approve all documents');

      toast({
        title: 'Success',
        description: `${pendingDocs.length} documents approved.`,
      });

      fetchDocuments();
      onVerificationComplete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve all documents.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    const config = {
      PENDING: { variant: 'warning' as const, label: 'Pending', icon: AlertCircle },
      APPROVED: { variant: 'default' as const, label: 'Approved', icon: CheckCircle2 },
      REJECTED: { variant: 'destructive' as const, label: 'Rejected', icon: XCircle },
      EXPIRED: { variant: 'secondary' as const, label: 'Expired', icon: XCircle }
    };

    const { variant, label, icon: Icon } = config[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      NIN: 'National ID (NIN)',
      BVN: 'Bank Verification Number',
      PASSPORT: 'Passport',
      VOTERS_CARD: "Voter's Card",
      DRIVERS_LICENSE: "Driver's License",
      SELFIE: 'Selfie',
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

  const pendingCount = documents.filter(d => d.status === 'PENDING').length;
  const approvedCount = documents.filter(d => d.status === 'APPROVED').length;
  const rejectedCount = documents.filter(d => d.status === 'REJECTED').length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Verification
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingCount} pending · {approvedCount} approved · {rejectedCount} rejected
              </p>
            </div>

            {pendingCount > 0 && (
              <Button onClick={handleApproveAll} disabled={processing}>
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve All
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                >
                  {/* Document Icon */}
                  <div className="flex-shrink-0">
                    {doc.fileUrl ? (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Document Details */}
                  <div className="flex-grow space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{getDocumentTypeLabel(doc.documentType)}</p>
                        {doc.documentSide && (
                          <p className="text-xs text-muted-foreground">{doc.documentSide}</p>
                        )}
                        {doc.documentNumber && (
                          <p className="text-sm text-muted-foreground">
                            ID: {doc.documentNumber}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {doc.fileName && (
                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                    )}

                    {doc.verificationNotes && (
                      <div className="p-2 bg-muted rounded text-sm">
                        <p className="font-medium text-xs mb-1">Notes:</p>
                        <p className="text-muted-foreground">{doc.verificationNotes}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Uploaded {format(new Date(doc.createdAt), 'PPp')}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {doc.fileUrl && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowImageModal(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-2" />
                            Download
                          </Button>
                        </>
                      )}

                      {doc.status === 'PENDING' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveDocument(doc.id)}
                            disabled={processing}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-2" />
                            Approve
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowRejectModal(true);
                            }}
                            disabled={processing}
                          >
                            <XCircle className="h-3 w-3 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDoc && getDocumentTypeLabel(selectedDoc.documentType)}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc?.documentSide && `${selectedDoc.documentSide} side`}
            </DialogDescription>
          </DialogHeader>

          {selectedDoc?.fileUrl && (
            <div className="relative">
              <img
                src={selectedDoc.fileUrl}
                alt={getDocumentTypeLabel(selectedDoc.documentType)}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageModal(false)}>
              Close
            </Button>
            {selectedDoc?.fileUrl && (
              <Button onClick={() => window.open(selectedDoc.fileUrl, '_blank')}>
                <ZoomIn className="h-4 w-4 mr-2" />
                Open Full Size
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this document. The user will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Document is not clear, expired, or doesn't match user details"
                className="mt-2"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setSelectedDoc(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectDocument}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}