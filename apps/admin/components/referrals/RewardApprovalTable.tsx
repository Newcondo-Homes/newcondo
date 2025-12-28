// apps/admin/src/components/referrals/RewardApprovalTable.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Reward {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  rewardType: string;
  referralId: string;
  createdAt: string;
}

interface RewardApprovalTableProps {
  rewards: Reward[];
  loading: boolean;
  onApprove?: (rewardId: string) => void;
  onReject?: (rewardId: string, reason: string) => void;
  onBulkApprove?: (rewardIds: string[]) => void;
  onRefresh: () => void;
  showActions?: boolean;
}

export default function RewardApprovalTable({
  rewards,
  loading,
  onApprove,
  onReject,
  onBulkApprove,
  onRefresh,
  showActions = true,
}: RewardApprovalTableProps) {
  const [selectedRewards, setSelectedRewards] = useState<string[]>([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingReward, setRejectingReward] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRewards(rewards.map((r) => r.id));
    } else {
      setSelectedRewards([]);
    }
  };

  const handleSelectReward = (rewardId: string, checked: boolean) => {
    if (checked) {
      setSelectedRewards((prev) => [...prev, rewardId]);
    } else {
      setSelectedRewards((prev) => prev.filter((id) => id !== rewardId));
    }
  };

  const handleRejectClick = (rewardId: string) => {
    setRejectingReward(rewardId);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (rejectingReward && onReject && rejectReason) {
      onReject(rejectingReward, rejectReason);
      setShowRejectDialog(false);
      setRejectingReward(null);
      setRejectReason("");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No rewards to display
      </div>
    );
  }

  return (
    <>
      {showActions && selectedRewards.length > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedRewards.length} reward(s) selected
          </span>
          <Button
            size="sm"
            onClick={() => onBulkApprove?.(selectedRewards)}
          >
            Approve Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showActions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedRewards.length === rewards.length && rewards.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reward Type</TableHead>
              <TableHead>Date</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.map((reward) => (
              <TableRow key={reward.id}>
                {showActions && (
                  <TableCell>
                    <Checkbox
                      checked={selectedRewards.includes(reward.id)}
                      onCheckedChange={(checked) =>
                        handleSelectReward(reward.id, checked as boolean)
                      }
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <p className="font-medium">{reward.userName}</p>
                    <p className="text-xs text-muted-foreground">{reward.userEmail}</p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  ₦{reward.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {reward.rewardType.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(reward.createdAt).toLocaleDateString()}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApprove?.(reward.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(reward.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reward</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this reward
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}