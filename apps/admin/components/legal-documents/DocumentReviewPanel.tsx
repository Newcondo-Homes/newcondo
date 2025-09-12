'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/ui/card';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { Button } from '@newcondo/ui/components/ui/button';
import { Textarea } from '@newcondo/ui/components/ui/textarea';
import { Label } from '@newcondo/ui/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@newcondo/ui/components/ui/select';
import { Separator } from '@newcondo/ui/components/ui/separator';
import { 
  User,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface DocumentDetails {
  id: string;
  userId: string;
  propertyId?: string;
  documentType: string;
  documentSide?: string;
  pageNumber?: number;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    verificationStatus: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
  };
}

interface ReviewAction {
  action: 'approve' | 'reject' | 'request_resubmission';
  notes: string;
  expiryDate?: Date;
}

interface DocumentReviewPanelProps {
  document: DocumentDetails | null;
  loading?: boolean;
  onClose: () => void;
  onReview: (documentId: string, reviewData: ReviewAction) => Promise<void>;
  onDownload: (documentId: string) => void;
  onViewFullScreen: (documentId: string) => void;
}

const DocumentReviewPanel: React.FC<DocumentReviewPanelProps> = ({
  document,
  loading = false,
  onClose,
  onReview,
  onDownload,
  onViewFullScreen
}) => {
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_resubmission'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!document) return;
    
    setSubmitting(true);
    try {
      const reviewData: ReviewAction = {
        action: reviewAction,
        notes: reviewNotes,
        ...(expiryDate && { expiryDate: new Date(expiryDate) })
      };

      await onReview(document.id, reviewData);
      
      // Reset form
      setReviewAction('approve');
      setReviewNotes('');
      setExpiryDate('');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode; color: string }> = {
      PENDING: { 
        variant: 'secondary' as const, 
        icon: <Clock className="w-3 h-3" />,
        color: 'text-yellow-600'
      },
      APPROVED: { 
        variant: 'default' as const, 
        icon: <CheckCircle className="w-3 h-3" />,
        color: 'text-green-600'
      },
      REJECTED: { 
        variant: 'destructive' as const, 
        icon: <XCircle className="w-3 h-3" />,
        color: 'text-red-600'
      },
      EXPIRED: { 
        variant: 'outline' as const, 
        icon: <AlertTriangle className="w-3 h-3" />,
        color: 'text-orange-600'
      }
    };

    const config = variants[status] || variants.PENDING;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading || !document) {
    return (
      <div className="w-96 border-l bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-32 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded flex-1" />
            <div className="h-10 bg-gray-200 rounded flex-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 border-l bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Document Review</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(document.status)}
          {document.isRequired && (
            <Badge variant="outline">Required</Badge>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {document.user.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {document.user.email}
              </div>
              {document.user.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {document.user.phone}
                </div>
              )}
              <div>
                <span className="font-medium">Verification Status:</span>{' '}
                <Badge variant="outline" className="ml-1">
                  {document.user.verificationStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Property Information (if applicable) */}
          {document.property && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Related Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {document.property.title}
                </div>
                <div>
                  <span className="font-medium">Address:</span> {document.property.address}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Type:</span>{' '}
                {getDocumentTypeDisplay(document.documentType)}
              </div>
              {document.documentSide && (
                <div>
                  <span className="font-medium">Side:</span> {document.documentSide}
                </div>
              )}
              {document.pageNumber && (
                <div>
                  <span className="font-medium">Page:</span> {document.pageNumber}
                </div>
              )}
              {document.documentNumber && (
                <div>
                  <span className="font-medium">Document Number:</span> {document.documentNumber}
                </div>
              )}
              {document.fileName && (
                <div>
                  <span className="font-medium">File Name:</span> {document.fileName}
                </div>
              )}
              {document.fileSizeBytes && (
                <div>
                  <span className="font-medium">File Size:</span> {formatFileSize(document.fileSizeBytes)}
                </div>
              )}
              {document.mimeType && (
                <div>
                  <span className="font-medium">File Type:</span> {document.mimeType}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Submitted:</span>{' '}
                {format(new Date(document.createdAt), 'MMM dd, yyyy HH:mm')}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {format(new Date(document.updatedAt), 'MMM dd, yyyy HH:mm')}
              </div>
              {document.expiresAt && (
                <div>
                  <span className="font-medium">Expires:</span>{' '}
                  {format(new Date(document.expiresAt), 'MMM dd, yyyy')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Notes */}
          {document.verificationNotes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Previous Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{document.verificationNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* File Actions */}
          {document.fileUrl && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">File Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onViewFullScreen(document.id)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Screen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onDownload(document.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Review Form */}
          {document.status === 'PENDING' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Review Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="review-action">Action</Label>
                  <Select value={reviewAction} onValueChange={(value: any) => setReviewAction(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Approve
                        </div>
                      </SelectItem>
                      <SelectItem value="reject">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Reject
                        </div>
                      </SelectItem>
                      <SelectItem value="request_resubmission">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-orange-600" />
                          Request Resubmission
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="review-notes">Review Notes</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Add your review comments here..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {reviewAction === 'approve' && document.documentType !== 'SELFIE' && (
                  <div>
                    <Label htmlFor="expiry-date">Document Expiry (Optional)</Label>
                    <input
                      type="date"
                      id="expiry-date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Footer */}
      {document.status === 'PENDING' && (
        <div className="p-6 border-t flex gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmitReview}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentReviewPanel;