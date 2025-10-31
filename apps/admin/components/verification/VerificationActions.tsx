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
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface VerificationActionsProps {
  userId: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string, reason: string) => Promise<void>;
  disabled?: boolean;
}

export function VerificationActions({
  userId,
  verificationStatus,
  onApprove,
  onReject,
  disabled = false,
}: VerificationActionsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(userId);
      toast({
        title: 'User Verified',
        description: 'The user has been successfully verified.',
      });
      setShowApproveDialog(false);
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Failed to verify user',
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
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(userId, rejectionReason);
      toast({
        title: 'User Rejected',
        description: 'The user verification has been rejected.',
      });
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationStatus !== 'PENDING') {
    return (
      <div className="flex items-center gap-2">
        {verificationStatus === 'VERIFIED' ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Verified</span>
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
          Approve
        </Button>
        <Button
          onClick={() => setShowRejectDialog(true)}
          disabled={disabled || isSubmitting}
          variant="destructive"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User Verification</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this user's verification? This action will grant
              them full access to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              Please ensure all documents have been thoroughly reviewed before approving.
            </p>
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
              disabled={isSubmitting}
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
            <DialogTitle>Reject User Verification</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for rejecting this verification. The user will receive
              this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., ID document is blurry, selfie doesn't match ID, document has expired..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                The user will be notified and can resubmit their documents.
              </p>
            </div>
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