"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface DisputeDetails {
  id: string;
  rentalId: string;
  paymentId: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  unitNumber?: string;
  amount: number;
  disputeReason: string;
  disputeDescription: string;
  evidenceUrls: string[];
  status: "PENDING" | "INVESTIGATING" | "APPROVED" | "REJECTED";
  createdAt: string;
  confirmationDeadline: string;
  hoursRemaining: number;
}

interface DisputeResolutionProps {
  className?: string;
}

export default function DisputeResolution({ className }: DisputeResolutionProps) {
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetails | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionAction, setResolutionAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const queryClient = useQueryClient();

  // Fetch disputes
  const { data: disputes, isLoading } = useQuery({
    queryKey: ["admin", "disputes", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      
      const response = await fetch(`/api/admin/disputes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch disputes");
      return response.json() as Promise<DisputeDetails[]>;
    },
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: async (data: {
      disputeId: string;
      action: "APPROVE" | "REJECT";
      notes: string;
    }) => {
      const response = await fetch(`/api/admin/disputes/${data.disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: data.action,
          resolutionNotes: data.notes,
        }),
      });
      if (!response.ok) throw new Error("Failed to resolve dispute");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
      toast.success(
        variables.action === "APPROVE" 
          ? "Dispute approved - Refund will be processed" 
          : "Dispute rejected - Payment will be released"
      );
      setSelectedDispute(null);
      setResolutionNotes("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to resolve dispute: ${error.message}`);
    },
  });

  const handleResolveDispute = () => {
    if (!selectedDispute) return;
    if (!resolutionNotes.trim()) {
      toast.error("Please provide resolution notes");
      return;
    }

    resolveDisputeMutation.mutate({
      disputeId: selectedDispute.id,
      action: resolutionAction,
      notes: resolutionNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      PENDING: { variant: "outline", icon: Clock },
      INVESTIGATING: { variant: "secondary", icon: AlertCircle },
      APPROVED: { variant: "default", icon: CheckCircle },
      REJECTED: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getUrgencyBadge = (hoursRemaining: number) => {
    if (hoursRemaining < 6) {
      return <Badge variant="destructive">Critical - {hoursRemaining}h left</Badge>;
    } else if (hoursRemaining < 12) {
      return <Badge variant="secondary">Urgent - {hoursRemaining}h left</Badge>;
    }
    return <Badge variant="outline">{hoursRemaining}h remaining</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Disputes</CardTitle>
            <CardDescription>
              Review and resolve payment disputes within the 24-hour confirmation period
            </CardDescription>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Disputes</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INVESTIGATING">Investigating</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : disputes && disputes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Renter</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time Left</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{dispute.renterName}</span>
                      <span className="text-sm text-muted-foreground">{dispute.renterEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{dispute.propertyTitle}</span>
                      <span className="text-sm text-muted-foreground">
                        {dispute.unitNumber ? `Unit ${dispute.unitNumber}` : dispute.propertyAddress}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₦{dispute.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{dispute.disputeReason}</span>
                  </TableCell>
                  <TableCell>{getUrgencyBadge(dispute.hoursRemaining)}</TableCell>
                  <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDispute(dispute)}
                      disabled={dispute.status !== "PENDING" && dispute.status !== "INVESTIGATING"}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No disputes found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterStatus === "all" 
                ? "All payment disputes have been resolved" 
                : `No ${filterStatus.toLowerCase()} disputes`}
            </p>
          </div>
        )}
      </CardContent>

      {/* Dispute Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resolve Payment Dispute</DialogTitle>
            <DialogDescription>
              Review the dispute details and make a decision
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Urgency Alert */}
              {selectedDispute.hoursRemaining < 6 && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium">
                    Critical: Only {selectedDispute.hoursRemaining} hours remaining before auto-release
                  </span>
                </div>
              )}

              {/* Dispute Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Renter</Label>
                  <p className="font-medium">{selectedDispute.renterName}</p>
                  <p className="text-sm text-muted-foreground">{selectedDispute.renterEmail}</p>
                  <p className="text-sm text-muted-foreground">{selectedDispute.renterPhone}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Property</Label>
                  <p className="font-medium">{selectedDispute.propertyTitle}</p>
                  <p className="text-sm text-muted-foreground">{selectedDispute.propertyAddress}</p>
                  {selectedDispute.unitNumber && (
                    <p className="text-sm text-muted-foreground">Unit: {selectedDispute.unitNumber}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Dispute Amount</Label>
                  <p className="text-2xl font-bold">₦{selectedDispute.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Confirmation Deadline</Label>
                  <p className="font-medium">
                    {new Date(selectedDispute.confirmationDeadline).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDispute.hoursRemaining} hours remaining
                  </p>
                </div>
              </div>

              {/* Dispute Reason */}
              <div>
                <Label className="text-sm text-muted-foreground">Dispute Reason</Label>
                <p className="font-medium mt-1">{selectedDispute.disputeReason}</p>
              </div>

              {/* Dispute Description */}
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedDispute.disputeDescription}
                </p>
              </div>

              {/* Evidence */}
              {selectedDispute.evidenceUrls.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Evidence Submitted</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDispute.evidenceUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg border overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Action */}
              <div className="space-y-4">
                <div>
                  <Label>Resolution Decision</Label>
                  <Select value={resolutionAction} onValueChange={(v) => setResolutionAction(v as "APPROVE" | "REJECT")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVE">Approve Dispute - Issue Refund</SelectItem>
                      <SelectItem value="REJECT">Reject Dispute - Release Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Resolution Notes</Label>
                  <Textarea
                    placeholder="Explain your decision and any actions taken..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDispute(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolveDispute}
              disabled={resolveDisputeMutation.isPending || !resolutionNotes.trim()}
            >
              {resolveDisputeMutation.isPending ? "Processing..." : "Submit Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}