// apps/admin/src/components/referrals/BulkPayoutProcessor.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { Download, Send, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingPayout {
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

interface PayoutResult {
  id: string;
  success: boolean;
  error?: string;
}

interface BulkPayoutProcessorProps {
  pendingPayouts: PendingPayout[];
  onPayoutsProcessed: () => void;
}

export default function BulkPayoutProcessor({
  pendingPayouts,
  onPayoutsProcessed,
}: BulkPayoutProcessorProps) {
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<PayoutResult[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const { toast } = useToast();

  const totalSelectedAmount = pendingPayouts
    .filter((p) => selectedPayouts.includes(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayouts(pendingPayouts.map((p) => p.id));
    } else {
      setSelectedPayouts([]);
    }
  };

  const handleSelectPayout = (payoutId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayouts((prev) => [...prev, payoutId]);
    } else {
      setSelectedPayouts((prev) => prev.filter((id) => id !== payoutId));
    }
  };

  const handleProcessPayouts = async () => {
    try {
      setProcessing(true);
      setShowConfirmDialog(false);
      setProcessingProgress(0);
      const payoutResults: PayoutResult[] = [];

      for (let i = 0; i < selectedPayouts.length; i++) {
        const payoutId = selectedPayouts[i];
        try {
          await referralAdminAPI.processPayout(payoutId);
          payoutResults.push({ id: payoutId, success: true });
        } catch (error: any) {
          payoutResults.push({
            id: payoutId,
            success: false,
            error: error.message || "Failed to process payout",
          });
        }

        setProcessingProgress(((i + 1) / selectedPayouts.length) * 100);
      }

      setResults(payoutResults);
      setShowResultsDialog(true);
      setSelectedPayouts([]);

      const successCount = payoutResults.filter((r) => r.success).length;
      const failCount = payoutResults.filter((r) => !r.success).length;

      toast({
        title: "Bulk Payout Complete",
        description: `${successCount} successful, ${failCount} failed`,
        variant: successCount === payoutResults.length ? "default" : "destructive",
      });

      onPayoutsProcessed();
    } catch (error) {
      console.error("Failed to process payouts:", error);
      toast({
        title: "Error",
        description: "Failed to process bulk payouts",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleExportSelected = () => {
    const selectedData = pendingPayouts.filter((p) => selectedPayouts.includes(p.id));
    const csv = [
      ["User Name", "Email", "Amount", "Reward Type", "Bank", "Account Number", "Account Name"],
      ...selectedData.map((p) => [
        p.userName,
        p.userEmail,
        p.amount.toString(),
        p.rewardType,
        p.bankDetails?.bankName || "N/A",
        p.bankDetails?.accountNumber || "N/A",
        p.bankDetails?.accountName || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending-payouts-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (pendingPayouts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
          <p className="text-lg font-semibold">No Pending Payouts</p>
          <p className="text-sm text-muted-foreground">All payouts have been processed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Bulk Payout Processor</CardTitle>
              <CardDescription>
                Process multiple referral payouts at once
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                disabled={selectedPayouts.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => setShowConfirmDialog(true)}
                disabled={selectedPayouts.length === 0 || processing}
              >
                <Send className="mr-2 h-4 w-4" />
                Process {selectedPayouts.length} Payouts
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedPayouts.length > 0 && (
            <Alert className="mb-4">
              <AlertTitle>Selected Payouts</AlertTitle>
              <AlertDescription>
                {selectedPayouts.length} payout(s) selected for a total of ₦
                {totalSelectedAmount.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedPayouts.length === pendingPayouts.length &&
                        pendingPayouts.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reward Type</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPayouts.includes(payout.id)}
                        onCheckedChange={(checked) =>
                          handleSelectPayout(payout.id, checked as boolean)
                        }
                      />
                    </TableCell>
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
                      <Badge variant="outline">{payout.rewardType}</Badge>
                    </TableCell>
                    <TableCell>{payout.referralCount}</TableCell>
                    <TableCell>
                      {payout.bankDetails ? (
                        <div className="text-sm">
                          <p>{payout.bankDetails.bankName}</p>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Payout</DialogTitle>
            <DialogDescription>
              You are about to process {selectedPayouts.length} payout(s) for a total of ₦
              {totalSelectedAmount.toLocaleString()}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Please verify all bank details are correct before proceeding. Failed transactions may
              incur additional charges.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleProcessPayouts} disabled={processing}>
              {processing ? "Processing..." : "Confirm & Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Processing Dialog */}
      <Dialog open={processing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Payouts</DialogTitle>
            <DialogDescription>
              Please wait while we process the payouts. Do not close this window.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Progress value={processingProgress} />
            <p className="text-sm text-center text-muted-foreground">
              {Math.round(processingProgress)}% complete
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Results</DialogTitle>
            <DialogDescription>Summary of bulk payout processing</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {results.filter((r) => r.success).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Successful</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {results.filter((r) => !r.success).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {results.some((r) => !r.success) && (
              <div>
                <h4 className="font-semibold mb-2">Failed Payouts:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {results
                    .filter((r) => !r.success)
                    .map((result) => {
                      const payout = pendingPayouts.find((p) => p.id === result.id);
                      return (
                        <div
                          key={result.id}
                          className="border rounded p-2 text-sm bg-red-50"
                        >
                          <p className="font-medium">{payout?.userName}</p>
                          <p className="text-red-600">{result.error}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowResultsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}