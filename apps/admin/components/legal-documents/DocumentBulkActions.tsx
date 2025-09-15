"use client";

import { useState } from "react";
import {
  Check,
  X,
  Download,
  Mail,
  AlertTriangle,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@newcondo/ui";
import { Badge } from "@newcondo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@newcondo/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@newcondo/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@newcondo/ui";
import { Textarea } from "@newcondo/ui";
import { DocumentStatus } from "@newcondo/db";
import { toast } from "sonner";

interface BulkActionItem {
  id: string;
  documentType: string;
  documentNumber?: string;
  fileName?: string;
  userName: string;
  status: DocumentStatus;
}

interface DocumentBulkActionsProps {
  selectedItems: BulkActionItem[];
  onClearSelection: () => void;
  onApprove: (ids: string[], notes?: string) => Promise<void>;
  onReject: (ids: string[], reason: string) => Promise<void>;
  onDelete: (ids: string[]) => Promise<void>;
  onExport: (ids: string[]) => Promise<void>;
  onSendNotification: (ids: string[], message: string) => Promise<void>;
  loading?: boolean;
}

export function DocumentBulkActions({
  selectedItems,
  onClearSelection,
  onApprove,
  onReject,
  onDelete,
  onExport,
  onSendNotification,
  loading = false,
}: DocumentBulkActionsProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const selectedCount = selectedItems.length;

  if (selectedCount === 0) {
    return null;
  }

  const pendingItems = selectedItems.filter(item => item.status === "PENDING");
  const canApprove = pendingItems.length > 0;
  const canReject = pendingItems.length > 0;

  const handleApprove = async () => {
    if (pendingItems.length === 0) {
      toast.error("No pending documents to approve");
      return;
    }

    setActionLoading("approve");
    try {
      await onApprove(
        pendingItems.map(item => item.id),
        approvalNotes || undefined
      );
      toast.success(`Approved ${pendingItems.length} document(s)`);
      setShowApprovalDialog(false);
      setApprovalNotes("");
      onClearSelection();
    } catch (error) {
      console.error("Error approving documents:", error);
      toast.error("Failed to approve documents");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (pendingItems.length === 0) {
      toast.error("No pending documents to reject");
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setActionLoading("reject");
    try {
      await onReject(
        pendingItems.map(item => item.id),
        rejectionReason
      );
      toast.success(`Rejected ${pendingItems.length} document(s)`);
      setShowRejectionDialog(false);
      setRejectionReason("");
      onClearSelection();
    } catch (error) {
      console.error("Error rejecting documents:", error);
      toast.error("Failed to reject documents");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading("delete");
    try {
      await onDelete(selectedItems.map(item => item.id));
      toast.success(`Deleted ${selectedCount} document(s)`);
      setShowDeleteDialog(false);
      onClearSelection();
    } catch (error) {
      console.error("Error deleting documents:", error);
      toast.error("Failed to delete documents");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    setActionLoading("export");
    try {
      await onExport(selectedItems.map(item => item.id));
      toast.success(`Exported ${selectedCount} document(s)`);
    } catch (error) {
      console.error("Error exporting documents:", error);
      toast.error("Failed to export documents");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      toast.error("Please enter a notification message");
      return;
    }

    setActionLoading("notify");
    try {
      await onSendNotification(
        selectedItems.map(item => item.id),
        notificationMessage
      );
      toast.success(`Sent notifications for ${selectedCount} document(s)`);
      setShowNotificationDialog(false);
      setNotificationMessage("");
      onClearSelection();
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-muted/50 border rounded-lg">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {canApprove && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowApprovalDialog(true)}
              disabled={loading || actionLoading !== null}
              className="h-8"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve ({pendingItems.length})
            </Button>
          )}

          {canReject && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRejectionDialog(true)}
              disabled={loading || actionLoading !== null}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Reject ({pendingItems.length})
            </Button>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || actionLoading !== null}
                className="h-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={handleExport}
                disabled={actionLoading === "export"}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Documents
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => setShowNotificationDialog(true)}
                disabled={actionLoading === "notify"}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Notification
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                disabled={actionLoading === "delete"}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Approve Documents
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to approve {pendingItems.length} document(s). 
              This action will notify the respective users.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Approval Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any notes for the approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={actionLoading === "approve"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading === "approve"}
                loading={actionLoading === "approve"}
              >
                Approve Documents
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              Reject Documents
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to reject {pendingItems.length} document(s). 
              Please provide a reason for rejection.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please specify why these documents are being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectionDialog(false)}
                disabled={actionLoading === "reject"}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading === "reject" || !rejectionReason.trim()}
                loading={actionLoading === "reject"}
              >
                Reject Documents
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a notification to the users associated with {selectedCount} selected document(s).
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter your notification message..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNotificationDialog(false)}
                disabled={actionLoading === "notify"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={actionLoading === "notify" || !notificationMessage.trim()}
                loading={actionLoading === "notify"}
              >
                Send Notification
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Documents
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} document(s)? 
              This action cannot be undone and will permanently remove the documents 
              and their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === "delete"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading === "delete"}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === "delete" ? "Deleting..." : "Delete Documents"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}