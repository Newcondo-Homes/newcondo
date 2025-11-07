"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle2, 
  XCircle, 
  Mail, 
  MessageSquare, 
  Ban,
  Shield,
  UserCheck,
  Download,
  Loader2,
  ChevronDown
} from 'lucide-react';

interface BulkUserActionsProps {
  selectedUsers: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

interface BulkActionProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
}

export default function BulkUserActions({
  selectedUsers,
  onClearSelection,
  onRefresh
}: BulkUserActionsProps) {
  const { toast } = useToast();
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  
  const [progress, setProgress] = useState<BulkActionProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle'
  });

  const processBulkAction = async (
    action: string,
    endpoint: string,
    payload?: any
  ) => {
    setProgress({
      total: selectedUsers.length,
      completed: 0,
      failed: 0,
      status: 'processing'
    });
    setShowProgressDialog(true);

    let completed = 0;
    let failed = 0;

    for (const userId of selectedUsers) {
      try {
        const response = await fetch(`/api/admin/users/${userId}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload ? JSON.stringify(payload) : undefined,
        });

        if (response.ok) {
          completed++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }

      setProgress({
        total: selectedUsers.length,
        completed,
        failed,
        status: 'processing'
      });
    }

    setProgress(prev => ({
      ...prev,
      status: failed === 0 ? 'completed' : 'failed'
    }));

    toast({
      title: failed === 0 ? 'Success' : 'Partially Completed',
      description: `${completed} users processed successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
      variant: failed === 0 ? 'default' : 'destructive',
    });

    setTimeout(() => {
      setShowProgressDialog(false);
      onClearSelection();
      onRefresh();
    }, 2000);
  };

  const handleBulkVerify = async () => {
    setShowVerifyDialog(false);
    await processBulkAction('verify', '/verify');
  };

  const handleBulkReject = async () => {
    setShowRejectDialog(false);
    await processBulkAction('reject', '/reject', {
      reason: 'Bulk rejection by admin'
    });
  };

  const handleBulkSuspend = async () => {
    setShowSuspendDialog(false);
    await processBulkAction('suspend', '/suspend');
  };

  const handleBulkEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast({
        title: 'Error',
        description: 'Please provide both subject and message.',
        variant: 'destructive',
      });
      return;
    }

    setShowEmailDialog(false);
    await processBulkAction('email', '/send-email', {
      subject: emailSubject,
      body: emailBody
    });

    setEmailSubject('');
    setEmailBody('');
  };

  const handleBulkSMS = async () => {
    if (!smsMessage) {
      toast({
        title: 'Error',
        description: 'Please provide a message.',
        variant: 'destructive',
      });
      return;
    }

    setShowSMSDialog(false);
    await processBulkAction('sms', '/send-sms', {
      message: smsMessage
    });

    setSmsMessage('');
  };

  const handleBulkMakePremium = async () => {
    await processBulkAction('premium', '/premium');
  };

  const handleExportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Users exported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export users.',
        variant: 'destructive',
      });
    }
  };

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-base px-3 py-1">
            {selectedUsers.length} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Clear Selection
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              Bulk Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Verification Actions</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => setShowVerifyDialog(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              Verify All
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Reject All
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={handleBulkMakePremium}>
              <Shield className="h-4 w-4 mr-2" />
              Make Premium
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Communication</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => setShowEmailDialog(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowSMSDialog(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send SMS
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={handleExportUsers}>
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-red-600">Danger Zone</DropdownMenuLabel>
            
            <DropdownMenuItem 
              onClick={() => setShowSuspendDialog(true)}
              className="text-red-600"
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Verify Dialog */}
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify {selectedUsers.length} Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify all {selectedUsers.length} selected users? This will grant them full access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkVerify}>
              Verify All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {selectedUsers.length} Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject verification for all {selectedUsers.length} selected users? They will be notified of the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {selectedUsers.length} Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend all {selectedUsers.length} selected users? This will prevent them from accessing the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkSuspend}
              className="bg-red-600 hover:bg-red-700"
            >
              Suspend All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to {selectedUsers.length} Users</DialogTitle>
            <DialogDescription>
              Compose an email that will be sent to all selected users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <input
                id="subject"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                className="mt-1 min-h-[200px]"
                placeholder="Email body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS Dialog */}
      <Dialog open={showSMSDialog} onOpenChange={setShowSMSDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS to {selectedUsers.length} Users</DialogTitle>
            <DialogDescription>
              Compose an SMS that will be sent to all selected users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="sms">Message (Max 160 characters)</Label>
              <Textarea
                id="sms"
                className="mt-1"
                placeholder="SMS message"
                maxLength={160}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {smsMessage.length}/160 characters
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSMSDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkSMS}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processing Bulk Action</DialogTitle>
            <DialogDescription>
              Please wait while we process {progress.total} users...
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{progress.completed + progress.failed} / {progress.total}</span>
              </div>
              <Progress 
                value={((progress.completed + progress.failed) / progress.total) * 100} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{progress.completed}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
            
            {progress.status === 'processing' && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {progress.status === 'completed' && (
              <div className="flex items-center justify-center py-4 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}