"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  Ban, 
  Unlock, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface UserSuspensionModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  currentlySuspended?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SUSPENSION_REASONS = [
  'Fraudulent Activity',
  'Policy Violation',
  'Spam / Abuse',
  'Multiple Reports',
  'Payment Issues',
  'Verification Fraud',
  'Other'
];

const SUSPENSION_DURATIONS = [
  { value: '7', label: '7 Days' },
  { value: '14', label: '14 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
  { value: 'permanent', label: 'Permanent' }
];

export default function UserSuspensionModal({
  userId,
  userName,
  isOpen,
  currentlySuspended = false,
  onClose,
  onSuccess
}: UserSuspensionModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [duration, setDuration] = useState('30');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [notifyUser, setNotifyUser] = useState('email');
  const [processing, setProcessing] = useState(false);

  const handleSuspend = async () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    
    if (!finalReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for suspension.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          duration,
          additionalNotes,
          notifyVia: notifyUser
        }),
      });

      if (!response.ok) throw new Error('Failed to suspend user');

      toast({
        title: 'Success',
        description: `${userName} has been suspended.`,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsuspend = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to unsuspend user');

      toast({
        title: 'Success',
        description: `${userName} has been unsuspended.`,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unsuspend user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setCustomReason('');
    setDuration('30');
    setAdditionalNotes('');
    setNotifyUser('email');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentlySuspended ? (
              <>
                <Unlock className="h-5 w-5 text-green-600" />
                Unsuspend User
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-red-600" />
                Suspend User
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentlySuspended
              ? `Restore access for ${userName}`
              : `Temporarily or permanently restrict ${userName}'s access to the platform`
            }
          </DialogDescription>
        </DialogHeader>

        {currentlySuspended ? (
          // Unsuspend Confirmation
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm">
                This will immediately restore full access to the platform for {userName}.
              </p>
            </div>
          </div>
        ) : (
          // Suspension Form
          <div className="space-y-4">
            {/* Warning */}
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  This action will immediately restrict user access
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  The user will be logged out and unable to access their account until unsuspended.
                </p>
              </div>
            </div>

            {/* Reason Selection */}
            <div>
              <Label>Suspension Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {SUSPENSION_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Reason */}
            {reason === 'Other' && (
              <div>
                <Label htmlFor="customReason">Specify Reason *</Label>
                <Textarea
                  id="customReason"
                  placeholder="Please provide details..."
                  className="mt-2"
                  rows={3}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              </div>
            )}

            {/* Duration */}
            <div>
              <Label>Suspension Duration *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUSPENSION_DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {duration === 'permanent' && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Permanent suspension requires manual unsuspension by an admin
                </p>
              )}
            </div>

            {/* Additional Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes (Internal)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional context for other admins..."
                className="mt-2"
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            {/* Notification Method */}
            <div>
              <Label>Notify User Via</Label>
              <RadioGroup 
                value={notifyUser} 
                onValueChange={setNotifyUser}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="font-normal cursor-pointer">
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="font-normal cursor-pointer">
                    SMS
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal cursor-pointer">
                    Both Email and SMS
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="font-normal cursor-pointer">
                    Do not notify
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Suspension Summary:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• User: {userName}</li>
                <li>• Reason: {reason === 'Other' ? customReason || 'Not specified' : reason || 'Not specified'}</li>
                <li>• Duration: {SUSPENSION_DURATIONS.find(d => d.value === duration)?.label || 'Not specified'}</li>
                <li>• Notification: {notifyUser === 'none' ? 'None' : notifyUser.toUpperCase()}</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={processing}
          >
            Cancel
          </Button>
          
          {currentlySuspended ? (
            <Button 
              onClick={handleUnsuspend}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4 mr-2" />
              )}
              Unsuspend User
            </Button>
          ) : (
            <Button 
              variant="destructive"
              onClick={handleSuspend}
              disabled={processing || !reason || (reason === 'Other' && !customReason.trim())}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Suspend User
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}