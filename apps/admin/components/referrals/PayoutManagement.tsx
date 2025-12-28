// apps/admin/src/components/referrals/PayoutManagement.tsx
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
import { Send, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { useToast } from "@/hooks/use-toast";

interface Payout {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  rewardType: string;
  referralCount: number;
  createdAt: string;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

interface PayoutManagementProps {
  payouts: Payout[];
  loading: boolean;
  onRefresh: () => void;
}

export default function PayoutManagement({
  payouts,
  loading,
  onRefresh,
}: PayoutManagementProps) {
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!selectedPayout) return;

    try {
      setProcessing(true);
      await referralAdminAPI.processPayout(selectedPayout.id);

      toast({
        title: "Success",
        description: "Payout processed successfully",
      });

      setShowConfirmDialog(false);
      setSelectedPayout(null);
      onRefresh();
    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        title: "Error",
        description: "Failed to process payout",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending payouts
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Referrals</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{payout.userName}</p>
                    <p className="text-xs text-muted-foreground">{payout.userEmail}</p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  ₦{payout.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {payout.rewardType.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>{payout.referralCount}</TableCell>
                <TableCell>
                  {payout.bankDetails ? (
                    <div className="text-sm">
                      <p className="font-medium">{payout.bankDetails.bankName}</p>
                      <p className="text-muted-foreground">
                        {payout.bankDetails.accountNumber}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="destructive">Missing</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(payout.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedPayout(payout);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedPayout(payout);
                        setShowConfirmDialog(true);
                      }}
                      disabled={!payout.bankDetails}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Process
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>Complete payout information</DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">User</p>
                <p className="text-lg">{selectedPayout.userName}</p>
                <p className="text-sm text-muted-foreground">{selectedPayout.userEmail}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-2xl font-bold">
                    ₦{selectedPayout.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Referrals</p>
                  <p className="text-2xl font-bold">{selectedPayout.referralCount}</p>
                </div>
              </div>

              {selectedPayout.bankDetails && (
                <div>
                  <p className="text-sm font-medium mb-2">Bank Details</p>
                  <div className="border rounded p-3 space-y-1">
                    <p><strong>Bank:</strong> {selectedPayout.bankDetails.bankName}</p>
                    <p><strong>Account:</strong> {selectedPayout.bankDetails.accountNumber}</p>
                    <p><strong>Name:</strong> {selectedPayout.bankDetails.accountName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payout</DialogTitle>
            <DialogDescription>
              Are you sure you want to process this payout?
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="border rounded p-4 space-y-2">
              <p><strong>Amount:</strong> ₦{selectedPayout.amount.toLocaleString()}</p>
              <p><strong>Recipient:</strong> {selectedPayout.userName}</p>
              {selectedPayout.bankDetails && (
                <p><strong>Bank:</strong> {selectedPayout.bankDetails.bankName} - {selectedPayout.bankDetails.accountNumber}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? "Processing..." : "Confirm & Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}