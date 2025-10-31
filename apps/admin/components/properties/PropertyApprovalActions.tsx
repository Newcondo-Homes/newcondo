'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PropertyApprovalActionsProps {
  propertyId: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  onApprove: (propertyId: string) => Promise<void>;
  onReject: (propertyId: string, reason: string) => Promise<void>;
  disabled?: boolean;
  boundaryVerified?: boolean;
  hasImages?: boolean;
  hasLegalDocs?: boolean;
}

export function PropertyApprovalActions({
  propertyId,
  approvalStatus,
  onApprove,
  onReject,
  disabled = false,
  boundaryVerified = false,
  hasImages = false,
  hasLegalDocs = false,
}: PropertyApprovalActionsProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonRejectionReasons = [
    'Incomplete property information',
    'Images are unclear or of poor quality',
    'Property boundary not properly marked',
    'Missing or invalid legal documents',
    'Property address cannot be verified',
    'Duplicate property listing detected',
    'Price seems unreasonable for the location',
    'Property appears to be fraudulent',
  ];

  const approvalChecks = [
    {
      label: 'Boundary Verified',
      checked: boundaryVerified,
      required: true,
    },
    {
      label: 'Has Images',
      checked: hasImages,
      required: true,
    },
    {
      label: 'Has Legal Documents',
      checked: hasLegalDocs,
      required: false,
    },
  ];

  const canApprove = approvalChecks
    .filter((check) => check.required)
    .every((check) => check.checked);

  const handleApprove = async () => {
    if (!canApprove) {
      toast({
        title: 'Cannot Approve',
        description: 'Please ensure all required checks are completed',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove(propertyId);
      toast({
        title: 'Property Approved',
        description: 'The property listing has been successfully approved.',
      });
      setShowApproveDialog(false);
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve property',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a clear reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(propertyId, rejectionReason);
      toast({
        title: 'Property Rejected',
        description: 'The property listing has been rejected.',
      });
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject property',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (approvalStatus !== 'PENDING') {
    return (
      <div className="flex items-center gap-2">
        {approvalStatus === 'APPROVED' ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Approved</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Rejected</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setShowApproveDialog(true)}
          disabled={disabled || isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve Property
        </Button>
        <Button
          onClick={() => setShowRejectDialog(true)}
          disabled={disabled || isSubmitting}
          variant="destructive"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject Property
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Property Listing</DialogTitle>
            <DialogDescription>
              Review the checklist below before approving this property listing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Approval Checklist */}
            <div className="space-y-2">
              {approvalChecks.map((check, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    check.checked ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {check.checked ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">{check.label}</span>
                  </div>
                  {check.required && (
                    <span className="text-xs text-red-600">Required</span>
                  )}
                </div>
              ))}
            </div>

            {!canApprove && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All required checks must be completed before approval. Please verify the
                  property boundary and ensure images are uploaded.
                </AlertDescription>
              </Alert>
            )}

            {canApprove && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Once approved, this property will be published and visible to all users.
                  The owner will be notified.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || !canApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property Listing</DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejecting this property. The owner will
              receive this feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Provide a clear and specific reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-500">Common Reasons (click to use):</Label>
              <div className="space-y-1">
                {commonRejectionReasons.map((reason, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className="block w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The property owner will be notified and can resubmit after making corrections.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              variant="destructive"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}