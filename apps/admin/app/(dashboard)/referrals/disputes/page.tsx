// apps/admin/src/app/(dashboard)/referrals/disputes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Dispute {
  id: string;
  referralId: string;
  disputeType: "REWARD_NOT_RECEIVED" | "INCORRECT_AMOUNT" | "UNAUTHORIZED_REFERRAL" | "OTHER";
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  evidence?: string[];
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "REJECTED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReferralDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const response = await referralAdminAPI.getDisputes();
      setDisputes(response.data);
    } catch (error) {
      console.error("Failed to load disputes:", error);
      toast({
        title: "Error",
        description: "Failed to load referral disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, status: "RESOLVED" | "REJECTED") => {
    try {
      setResolving(true);
      await referralAdminAPI.resolveDispute(disputeId, {
        status,
        resolution,
      });

      toast({
        title: "Success",
        description: `Dispute ${status.toLowerCase()} successfully`,
      });

      setShowResolveDialog(false);
      setResolution("");
      setSelectedDispute(null);
      loadDisputes();
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  const handleAssignDispute = async (disputeId: string) => {
    try {
      await referralAdminAPI.assignDispute(disputeId);
      toast({
        title: "Success",
        description: "Dispute assigned to you",
      });
      loadDisputes();
    } catch (error) {
      console.error("Failed to assign dispute:", error);
      toast({
        title: "Error",
        description: "Failed to assign dispute",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "INVESTIGATING":
        return <AlertCircle className="h-4 w-4" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "INVESTIGATING":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-orange-100 text-orange-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const pendingDisputes = disputes.filter((d) => d.status === "PENDING");
  const investigatingDisputes = disputes.filter((d) => d.status === "INVESTIGATING");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral Disputes</h1>
          <p className="text-muted-foreground">
            Manage and resolve referral-related disputes
          </p>
        </div>
        <Button onClick={loadDisputes} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDisputes.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Under Investigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investigatingDisputes.length}</div>
            <p className="text-xs text-muted-foreground">Being reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disputes.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Disputes</CardTitle>
          <CardDescription>
            Review and resolve referral disputes from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No disputes found
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {dispute.disputeType.replace(/_/g, " ")}
                        </h3>
                        <Badge className={getPriorityColor(dispute.priority)}>
                          {dispute.priority}
                        </Badge>
                        <Badge className={getStatusColor(dispute.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(dispute.status)}
                            <span>{dispute.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reported by {dispute.reportedBy.name} ({dispute.reportedBy.email})
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm mb-3">{dispute.description}</p>

                  {dispute.resolution && (
                    <div className="bg-muted p-3 rounded-md mb-3">
                      <p className="text-sm font-medium mb-1">Resolution:</p>
                      <p className="text-sm">{dispute.resolution}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {dispute.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAssignDispute(dispute.id)}
                          variant="outline"
                        >
                          Assign to Me
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowResolveDialog(true);
                          }}
                        >
                          Review
                        </Button>
                      </>
                    )}
                    {dispute.status === "INVESTIGATING" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowResolveDialog(true);
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dispute Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide resolution details for this dispute
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">Resolution Details</Label>
              <Textarea
                id="resolution"
                placeholder="Explain how this dispute was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResolveDialog(false)}
              disabled={resolving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedDispute && handleResolveDispute(selectedDispute.id, "REJECTED")
              }
              disabled={resolving || !resolution}
            >
              Reject
            </Button>
            <Button
              onClick={() =>
                selectedDispute && handleResolveDispute(selectedDispute.id, "RESOLVED")
              }
              disabled={resolving || !resolution}
            >
              {resolving ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}