'use client';

import { useState } from 'react';
import { Button } from '@newcondo/ui/components/ui/button';
import { Textarea } from '@newcondo/ui/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@newcondo/ui/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@newcondo/ui/components/ui/dropdown-menu';
import { Label } from '@newcondo/ui/components/ui/label';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { 
  Check, 
  X, 
  AlertTriangle, 
  MoreVertical, 
  FileText, 
  Clock,
  Eye,
  Download 
} from 'lucide-react';
import { toast } from '@newcondo/ui/components/ui/use-toast';
import { useCompliance } from '../../hooks/useCompliance';
import { Document, DocumentStatus } from '@newcondo/db';

interface DocumentApprovalActionsProps {
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
  onStatusChange?: (documentId: string, status: DocumentStatus) => void;
}

export function DocumentApprovalActions({ 
  document, 
  onStatusChange 
}: DocumentApprovalActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { approveDocument, rejectDocument, downloadDocument } = useCompliance();

  const handleAction = async () => {
    if (!actionType) return;

    setIsLoading(true);
    try {
      if (actionType === 'approve') {
        await approveDocument.mutateAsync({
          documentId: document.id,
          verificationNotes: verificationNotes.trim() || undefined,
        });
        toast({
          title: 'Document Approved',
          description: 'The document has been successfully approved.',
        });
      } else if (actionType === 'reject') {
        if (!verificationNotes.trim()) {
          toast({
            title: 'Rejection Reason Required',
            description: 'Please provide a reason for rejecting this document.',
            variant: 'destructive',
          });
          return;
        }
        
        await rejectDocument.mutateAsync({
          documentId: document.id,
          verificationNotes: verificationNotes.trim(),
        });
        toast({
          title: 'Document Rejected',
          description: 'The document has been rejected.',
        });
      }

      onStatusChange?.(document.id, actionType === 'approve' ? 'APPROVED' : 'REJECTED');
      setIsDialogOpen(false);
      setVerificationNotes('');
      setActionType(null);
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: 'Failed to process the document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (document.fileUrl) {
        await downloadDocument.mutateAsync({
          documentId: document.id,
          fileName: document.fileName || 'document',
        });
      }
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download the document.',
        variant: 'destructive',
      });
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

  const openActionDialog = (action: 'approve' | 'reject') => {
    setActionType(action);
    setIsDialogOpen(true);
  };

  if (document.status === 'APPROVED' || document.status === 'REJECTED') {
    return (
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(document.status)}>
          {document.status}
        </Badge>
        {document.fileUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloadDocument.isPending}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={getStatusColor(document.status)}>
        <Clock className="h-3 w-3 mr-1" />
        {document.status}
      </Badge>

      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openActionDialog('approve')}
          className="text-green-600 hover:text-green-700"
        >
          <Check className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => openActionDialog('reject')}
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {document.fileUrl && (
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              View History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              {actionType === 'approve' ? 'Approve Document' : 'Reject Document'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Document:</strong> {document.documentType}</p>
              <p><strong>User:</strong> {document.user.name} ({document.user.email})</p>
              {document.property && (
                <p><strong>Property:</strong> {document.property.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-notes">
                {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
              </Label>
              <Textarea
                id="verification-notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Add any notes about this approval...'
                    : 'Please explain why this document is being rejected...'
                }
                rows={3}
                className={actionType === 'reject' && !verificationNotes.trim() ? 'border-red-300' : ''}
              />
              {actionType === 'reject' && !verificationNotes.trim() && (
                <p className="text-sm text-red-600">Rejection reason is required</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isLoading || (actionType === 'reject' && !verificationNotes.trim())}
              className={
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isLoading ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}