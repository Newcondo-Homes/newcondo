// apps/admin/src/components/referrals/ReferralDetailModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface ReferralDetailModalProps {
  referral: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReferralDetailModal({
  referral,
  open,
  onOpenChange,
}: ReferralDetailModalProps) {
  if (!referral) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Referral Details</DialogTitle>
          <DialogDescription>
            Complete information about this referral
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <div className="mt-1">
              <Badge>{referral.status}</Badge>
            </div>
          </div>

          <Separator />

          {/* Referrer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Referrer</Label>
              <p className="font-medium mt-1">{referral.referrerName}</p>
              <p className="text-sm text-muted-foreground">{referral.referrerEmail}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Referred User</Label>
              <p className="font-medium mt-1">{referral.referredName}</p>
              <p className="text-sm text-muted-foreground">{referral.referredEmail}</p>
            </div>
          </div>

          <Separator />

          {/* Referral Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Referral Type</Label>
              <p className="mt-1">{referral.referralType?.replace(/_/g, " → ")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Referral Code</Label>
              <p className="mt-1 font-mono">{referral.referralCode || "N/A"}</p>
            </div>
          </div>

          <Separator />

          {/* Reward Information */}
          {referral.rewardAmount && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Reward Amount</Label>
                  <p className="text-2xl font-bold mt-1">
                    ₦{referral.rewardAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reward Type</Label>
                  <p className="mt-1">{referral.rewardType?.replace(/_/g, " ") || "N/A"}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Tracking Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Clicks</Label>
              <p className="mt-1">{referral.clickCount || 0}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Share Channel</Label>
              <p className="mt-1">{referral.shareChannel || "Direct"}</p>
            </div>
          </div>

          <Separator />

          {/* Qualification Status */}
          {referral.qualificationMet && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Qualified At</Label>
                  <p className="mt-1">
                    {new Date(referral.qualifiedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Transaction Amount</Label>
                  <p className="mt-1">
                    ₦{referral.qualificationAmount?.toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Created At</Label>
              <p className="text-sm mt-1">
                {new Date(referral.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Updated</Label>
              <p className="text-sm mt-1">
                {new Date(referral.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}