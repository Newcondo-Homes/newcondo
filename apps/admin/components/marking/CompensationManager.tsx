// apps/admin/src/components/marking/CompensationManager.tsx

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Eye,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Compensation {
  id: string;
  markingJobId: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  paymentType: "FULL" | "PARTIAL" | "INITIAL_DEPOSIT";
  completedAt: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  paymentReference?: string;
  agentBankDetails?: {
    accountNumber: string;
    accountName: string;
    bankName: string;
  };
}

interface CompensationStats {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  totalRejected: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  avgProcessingTime: number; // in hours
}

interface CompensationFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  agentId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export function CompensationManager() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CompensationFilters>({});
  const [selectedCompensation, setSelectedCompensation] =
    useState<Compensation | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);

  // Fetch compensation stats
  const { data: stats } = useQuery<CompensationStats>({
    queryKey: ["compensation-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/marking/compensations/stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Fetch compensations with filters
  const { data: compensations, isLoading } = useQuery<Compensation[]>({
    queryKey: ["compensations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(
        `/api/admin/marking/compensations?${params.toString()}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch compensations");
      return response.json();
    },
  });

  // Approve compensation mutation
  const approveMutation = useMutation({
    mutationFn: async (compensationId: string) => {
      const response = await fetch(
        `/api/admin/marking/compensations/${compensationId}/approve`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to approve compensation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensations"] });
      queryClient.invalidateQueries({ queryKey: ["compensation-stats"] });
      toast.success("Compensation approved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve compensation");
    },
  });

  // Reject compensation mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      compensationId,
      reason,
    }: {
      compensationId: string;
      reason: string;
    }) => {
      const response = await fetch(
        `/api/admin/marking/compensations/${compensationId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to reject compensation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensations"] });
      queryClient.invalidateQueries({ queryKey: ["compensation-stats"] });
      setShowRejectDialog(false);
      setRejectReason("");
      setSelectedCompensation(null);
      toast.success("Compensation rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject compensation");
    },
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async ({
      compensationId,
      reference,
    }: {
      compensationId: string;
      reference: string;
    }) => {
      const response = await fetch(
        `/api/admin/marking/compensations/${compensationId}/mark-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentReference: reference }),
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to mark as paid");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensations"] });
      queryClient.invalidateQueries({ queryKey: ["compensation-stats"] });
      setShowPayDialog(false);
      setPaymentReference("");
      setSelectedCompensation(null);
      toast.success("Marked as paid successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark as paid");
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (compensationIds: string[]) => {
      const response = await fetch(
        "/api/admin/marking/compensations/bulk-approve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ compensationIds }),
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to bulk approve");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensations"] });
      queryClient.invalidateQueries({ queryKey: ["compensation-stats"] });
      toast.success("Compensations approved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to bulk approve");
    },
  });

  // Export compensations mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(
        `/api/admin/marking/compensations/export?${params.toString()}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to export");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compensations-${new Date().toISOString()}.csv`;
      a.click();
      toast.success("Export successful");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export");
    },
  });

  const getStatusBadge = (status: Compensation["status"]) => {
    const variants: Record<Compensation["status"], string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      REJECTED: "bg-red-100 text-red-800",
      PAID: "bg-green-100 text-green-800",
    };

    const icons: Record<Compensation["status"], React.ReactNode> = {
      PENDING: <Clock className="h-3 w-3" />,
      APPROVED: <CheckCircle className="h-3 w-3" />,
      REJECTED: <XCircle className="h-3 w-3" />,
      PAID: <DollarSign className="h-3 w-3" />,
    };

    return (
      <Badge className={`${variants[status]} flex items-center gap-1`}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const getPaymentTypeBadge = (type: Compensation["paymentType"]) => {
    const variants: Record<Compensation["paymentType"], string> = {
      FULL: "bg-green-100 text-green-800",
      PARTIAL: "bg-yellow-100 text-yellow-800",
      INITIAL_DEPOSIT: "bg-blue-100 text-blue-800",
    };

    return <Badge className={variants[type]}>{type.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Compensations
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.pendingAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Compensations
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalApproved || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.approvedAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paid Compensations
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPaid || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.paidAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Processing Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgProcessingTime || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to process
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Compensation Management</CardTitle>
              <CardDescription>
                Manage and process agent marking compensations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({})}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Agent name, property..."
                    className="pl-8"
                    value={filters.search || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      status: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Compensations Table */}
            <Tabs defaultValue="pending" className="w-full">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending ({stats?.totalPending || 0})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({stats?.totalApproved || 0})
                </TabsTrigger>
                <TabsTrigger value="paid">
                  Paid ({stats?.totalPaid || 0})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({stats?.totalRejected || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading compensations...
                  </div>
                ) : compensations?.filter((c) => c.status === "PENDING")
                    .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending compensations
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const pendingIds =
                            compensations
                              ?.filter((c) => c.status === "PENDING")
                              .map((c) => c.id) || [];
                          if (pendingIds.length > 0) {
                            bulkApproveMutation.mutate(pendingIds);
                          }
                        }}
                        disabled={bulkApproveMutation.isPending}
                      >
                        Approve All Pending
                      </Button>
                    </div>
                    <CompensationTable
                      compensations={
                        compensations?.filter((c) => c.status === "PENDING") ||
                        []
                      }
                      onApprove={(id) => approveMutation.mutate(id)}
                      onReject={(comp) => {
                        setSelectedCompensation(comp);
                        setShowRejectDialog(true);
                      }}
                      onViewDetails={(comp) => {
                        setSelectedCompensation(comp);
                        setShowDetailsDialog(true);
                      }}
                      getStatusBadge={getStatusBadge}
                      getPaymentTypeBadge={getPaymentTypeBadge}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="approved">
                {compensations?.filter((c) => c.status === "APPROVED")
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No approved compensations
                  </div>
                ) : (
                  <CompensationTable
                    compensations={
                      compensations?.filter((c) => c.status === "APPROVED") ||
                      []
                    }
                    onMarkPaid={(comp) => {
                      setSelectedCompensation(comp);
                      setShowPayDialog(true);
                    }}
                    onViewDetails={(comp) => {
                      setSelectedCompensation(comp);
                      setShowDetailsDialog(true);
                    }}
                    getStatusBadge={getStatusBadge}
                    getPaymentTypeBadge={getPaymentTypeBadge}
                  />
                )}
              </TabsContent>

              <TabsContent value="paid">
                {compensations?.filter((c) => c.status === "PAID").length ===
                0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No paid compensations
                  </div>
                ) : (
                  <CompensationTable
                    compensations={
                      compensations?.filter((c) => c.status === "PAID") || []
                    }
                    onViewDetails={(comp) => {
                      setSelectedCompensation(comp);
                      setShowDetailsDialog(true);
                    }}
                    getStatusBadge={getStatusBadge}
                    getPaymentTypeBadge={getPaymentTypeBadge}
                  />
                )}
              </TabsContent>

              <TabsContent value="rejected">
                {compensations?.filter((c) => c.status === "REJECTED")
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No rejected compensations
                  </div>
                ) : (
                  <CompensationTable
                    compensations={
                      compensations?.filter((c) => c.status === "REJECTED") ||
                      []
                    }
                    onViewDetails={(comp) => {
                      setSelectedCompensation(comp);
                      setShowDetailsDialog(true);
                    }}
                    getStatusBadge={getStatusBadge}
                    getPaymentTypeBadge={getPaymentTypeBadge}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compensation Details</DialogTitle>
            <DialogDescription>
              View complete compensation information
            </DialogDescription>
          </DialogHeader>
          {selectedCompensation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Agent</Label>
                  <p className="font-medium">
                    {selectedCompensation.agentName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCompensation.agentEmail}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedCompensation.amount)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Property</Label>
                <p className="font-medium">
                  {selectedCompensation.propertyTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedCompensation.propertyAddress}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedCompensation.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Type</Label>
                  <div className="mt-1">
                    {getPaymentTypeBadge(selectedCompensation.paymentType)}
                  </div>
                </div>
              </div>

              {selectedCompensation.agentBankDetails && (
                <div>
                  <Label className="text-muted-foreground">Bank Details</Label>
                  <div className="bg-muted p-3 rounded-md mt-1">
                    <p className="text-sm">
                      <strong>Account Name:</strong>{" "}
                      {selectedCompensation.agentBankDetails.accountName}
                    </p>
                    <p className="text-sm">
                      <strong>Account Number:</strong>{" "}
                      {selectedCompensation.agentBankDetails.accountNumber}
                    </p>
                    <p className="text-sm">
                      <strong>Bank:</strong>{" "}
                      {selectedCompensation.agentBankDetails.bankName}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    Completed At
                  </Label>
                  <p className="text-sm">
                    {formatDate(selectedCompensation.completedAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Requested At
                  </Label>
                  <p className="text-sm">
                    {formatDate(selectedCompensation.requestedAt)}
                  </p>
                </div>
              </div>

              {selectedCompensation.rejectionReason && (
                <div>
                  <Label className="text-muted-foreground">
                    Rejection Reason
                  </Label>
                  <p className="text-sm bg-red-50 text-red-900 p-3 rounded-md">
                    {selectedCompensation.rejectionReason}
                  </p>
                </div>
              )}

              {selectedCompensation.paymentReference && (
                <div>
                  <Label className="text-muted-foreground">
                    Payment Reference
                  </Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {selectedCompensation.paymentReference}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Compensation</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this compensation request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this compensation is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
                setSelectedCompensation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error("Please provide a rejection reason");
                  return;
                }
                if (selectedCompensation) {
                  rejectMutation.mutate({
                    compensationId: selectedCompensation.id,
                    reason: rejectReason,
                  });
                }
              }}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              Reject Compensation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Confirm payment by providing a payment reference
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCompensation && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm">
                  <strong>Agent:</strong> {selectedCompensation.agentName}
                </p>
                <p className="text-sm">
                  <strong>Amount:</strong>{" "}
                  {formatCurrency(selectedCompensation.amount)}
                </p>
              </div>
            )}
            <div>
              <Label>Payment Reference *</Label>
              <Input
                placeholder="Enter payment reference or transaction ID"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPayDialog(false);
                setPaymentReference("");
                setSelectedCompensation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!paymentReference.trim()) {
                  toast.error("Please provide a payment reference");
                  return;
                }
                if (selectedCompensation) {
                  markPaidMutation.mutate({
                    compensationId: selectedCompensation.id,
                    reference: paymentReference,
                  });
                }
              }}
              disabled={markPaidMutation.isPending || !paymentReference.trim()}
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Compensation Table Component
interface CompensationTableProps {
  compensations: Compensation[];
  onApprove?: (id: string) => void;
  onReject?: (compensation: Compensation) => void;
  onMarkPaid?: (compensation: Compensation) => void;
  onViewDetails: (compensation: Compensation) => void;
  getStatusBadge: (status: Compensation["status"]) => React.ReactNode;
  getPaymentTypeBadge: (type: Compensation["paymentType"]) => React.ReactNode;
}

function CompensationTable({
  compensations,
  onApprove,
  onReject,
  onMarkPaid,
  onViewDetails,
  getStatusBadge,
  getPaymentTypeBadge,
}: CompensationTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {compensations.map((compensation) => (
            <TableRow key={compensation.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{compensation.agentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {compensation.agentEmail}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">
                    {compensation.propertyTitle}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {compensation.propertyAddress}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-semibold">
                  {formatCurrency(compensation.amount)}
                </p>
              </TableCell>
              <TableCell>{getPaymentTypeBadge(compensation.paymentType)}</TableCell>
              <TableCell>{getStatusBadge(compensation.status)}</TableCell>
              <TableCell>
                <p className="text-sm">{formatDate(compensation.completedAt)}</p>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(compensation)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {compensation.status === "PENDING" && onApprove && onReject && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(compensation.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReject(compensation)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {compensation.status === "APPROVED" && onMarkPaid && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkPaid(compensation)}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Mark Paid
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}