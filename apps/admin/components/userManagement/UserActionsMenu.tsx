"use client";

import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  MoreVertical,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  Ban,
  Unlock,
  Mail,
  MessageSquare,
  Shield,
  ShieldOff,
  UserX,
  History,
  CreditCard,
  FileText
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  verificationStatus: string;
  isPremium: boolean;
}

interface UserActionsMenuProps {
  user: User;
  onViewDetails: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onRefresh: () => void;
}

export default function UserActionsMenu({
  user,
  onViewDetails,
  onEditUser,
  onRefresh
}: UserActionsMenuProps) {
  const { toast } = useToast();
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerifyUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to verify user');

      toast({
        title: 'Success',
        description: `${user.name || user.email} has been verified.`,
      });

      setShowVerifyDialog(false);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Document verification failed',
        }),
      });

      if (!response.ok) throw new Error('Failed to reject user');

      toast({
        title: 'Success',
        description: `${user.name || user.email} verification has been rejected.`,
      });

      setShowRejectDialog(false);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to suspend user');

      toast({
        title: 'Success',
        description: `${user.name || user.email} has been suspended.`,
      });

      setShowSuspendDialog(false);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMakePremium = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}/premium`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to upgrade user');

      toast({
        title: 'Success',
        description: `${user.name || user.email} is now a premium user.`,
      });

      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to make user premium. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to change role');

      toast({
        title: 'Success',
        description: `User role changed to ${newRole}.`,
      });

      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change user role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = () => {
    window.location.href = `mailto:${user.email}`;
  };

  const handleSendSMS = async () => {
    toast({
      title: 'SMS Feature',
      description: 'SMS notification will be sent to the user.',
    });
  };

  const isVerified = user.verificationStatus === 'VERIFIED';
  const isPending = user.verificationStatus === 'PENDING';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onViewDetails(user.id)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onEditUser(user.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => window.open(`/admin/users/${user.id}/activity`, '_blank')}>
            <History className="h-4 w-4 mr-2" />
            View Activity
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Verification</DropdownMenuLabel>
          
          {isPending && (
            <>
              <DropdownMenuItem onClick={() => setShowVerifyDialog(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Verify User
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                Reject Verification
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuItem onClick={() => window.open(`/admin/users/${user.id}/documents`, '_blank')}>
            <FileText className="h-4 w-4 mr-2" />
            View Documents
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Account Management</DropdownMenuLabel>
          
          {!user.isPremium && (
            <DropdownMenuItem onClick={handleMakePremium} disabled={loading}>
              <Shield className="h-4 w-4 mr-2" />
              Make Premium
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={() => window.open(`/admin/users/${user.id}/payments`, '_blank')}>
            <CreditCard className="h-4 w-4 mr-2" />
            View Payments
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
          
          {user.role !== 'OWNER' && (
            <DropdownMenuItem onClick={() => handleChangeRole('OWNER')} disabled={loading}>
              Make Owner
            </DropdownMenuItem>
          )}
          
          {user.role !== 'AGENT' && (
            <DropdownMenuItem onClick={() => handleChangeRole('AGENT')} disabled={loading}>
              Make Agent
            </DropdownMenuItem>
          )}
          
          {user.role !== 'RENTER' && (
            <DropdownMenuItem onClick={() => handleChangeRole('RENTER')} disabled={loading}>
              Make Renter
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Communication</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSendSMS}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Send SMS
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-red-600">Danger Zone</DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => setShowSuspendDialog(true)}
            className="text-red-600"
          >
            <Ban className="h-4 w-4 mr-2" />
            Suspend User
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <UserX className="h-4 w-4 mr-2" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Verify Dialog */}
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {user.name || user.email}? This will grant them full access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerifyUser} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the verification for {user.name || user.email}? They will be notified of the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectUser} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {user.name || user.email}? This will prevent them from accessing the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspendUser} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Suspending...' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {user.name || user.email}'s account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                toast({
                  title: 'Feature Coming Soon',
                  description: 'User deletion requires additional confirmation steps.',
                });
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}