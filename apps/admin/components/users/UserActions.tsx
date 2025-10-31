"use client";

import { useState } from "react";
import { Button } from "@newcondo/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@newcondo/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@newcondo/ui/dropdown-menu";
import { 
  MoreVertical, UserCheck, UserX, Shield, 
  Ban, CheckCircle, Mail, MessageSquare 
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useToast } from "@newcondo/ui/use-toast";
import { useRouter } from "next/navigation";

interface UserActionsProps {
  userId: string;
  currentStatus: string;
  userRole: string;
  onActionComplete?: () => void;
}

export function UserActions({ 
  userId, 
  currentStatus, 
  userRole,
  onActionComplete 
}: UserActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerifyUser = () => {
    setCurrentAction("verify");
    setActionDialogOpen(true);
  };

  const handleRejectUser = () => {
    setCurrentAction("reject");
    setActionDialogOpen(true);
  };

  const handleSuspendUser = () => {
    setCurrentAction("suspend");
    setActionDialogOpen(true);
  };

  const handleActivateUser = () => {
    setCurrentAction("activate");
    setActionDialogOpen(true);
  };

  const handleMakeAdmin = () => {
    setCurrentAction("make_admin");
    setActionDialogOpen(true);
  };

  const handleSendEmail = () => {
    router.push(`/admin/communications/email?userId=${userId}`);
  };

  const executeAction = async () => {
    try {
      setLoading(true);
      
      switch (currentAction) {
        case "verify":
          await adminApi.verifyUser(userId);
          toast({
            title: "User Verified",
            description: "User has been successfully verified",
          });
          break;
          
        case "reject":
          await adminApi.rejectUser(userId, "Failed verification requirements");
          toast({
            title: "User Rejected",
            description: "User verification has been rejected",
            variant: "destructive",
          });
          break;
          
        case "suspend":
          await adminApi.suspendUser(userId);
          toast({
            title: "User Suspended",
            description: "User account has been suspended",
            variant: "destructive",
          });
          break;
          
        case "activate":
          await adminApi.activateUser(userId);
          toast({
            title: "User Activated",
            description: "User account has been activated",
          });
          break;
          
        case "make_admin":
          await adminApi.promoteToAdmin(userId);
          toast({
            title: "User Promoted",
            description: "User has been promoted to admin",
          });
          break;
      }
      
      setActionDialogOpen(false);
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to perform action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionDialogContent = () => {
    switch (currentAction) {
      case "verify":
        return {
          title: "Verify User",
          description: "Are you sure you want to verify this user? This will grant them full access to the platform.",
          confirmText: "Verify User",
        };
      case "reject":
        return {
          title: "Reject User",
          description: "Are you sure you want to reject this user's verification? They will need to resubmit documents.",
          confirmText: "Reject User",
        };
      case "suspend":
        return {
          title: "Suspend User",
          description: "Are you sure you want to suspend this user? They will lose access to their account.",
          confirmText: "Suspend User",
        };
      case "activate":
        return {
          title: "Activate User",
          description: "Are you sure you want to activate this user's account?",
          confirmText: "Activate User",
        };
      case "make_admin":
        return {
          title: "Promote to Admin",
          description: "Are you sure you want to promote this user to admin? This will grant them administrative privileges.",
          confirmText: "Promote to Admin",
        };
      default:
        return {
          title: "",
          description: "",
          confirmText: "",
        };
    }
  };

  const dialogContent = getActionDialogContent();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {currentStatus === "PENDING" && (
            <>
              <DropdownMenuItem onClick={handleVerifyUser}>
                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                Verify User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRejectUser}>
                <UserX className="mr-2 h-4 w-4 text-red-600" />
                Reject Verification
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuItem onClick={handleSuspendUser}>
            <Ban className="mr-2 h-4 w-4 text-orange-600" />
            Suspend Account
          </DropdownMenuItem>
          
          {currentStatus === "REJECTED" && (
            <DropdownMenuItem onClick={handleActivateUser}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Activate Account
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {userRole !== "ADMIN" && (
            <DropdownMenuItem onClick={handleMakeAdmin}>
              <Shield className="mr-2 h-4 w-4 text-purple-600" />
              Promote to Admin
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => router.push(`/admin/users/${userId}/messages`)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Message
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} disabled={loading}>
              {loading ? "Processing..." : dialogContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}