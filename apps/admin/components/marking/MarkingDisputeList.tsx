"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@newcondo/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/table";
import { Badge } from "@newcondo/ui/badge";
import { Button } from "@newcondo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@newcondo/ui/dialog";
import { Textarea } from "@newcondo/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/select";
import { Input } from "@newcondo/ui/input";
import { Label } from "@newcondo/ui/label";
import { AlertCircle, CheckCircle, XCircle, Eye, Search } from "lucide-react";
import { format } from "date-fns";

interface MarkingDispute {
  id: string;
  markingJobId: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  agentId: string;
  agentName: string;
  ownerId: string;
  ownerName: string;
  disputeType: "INCORRECT_MARKING" | "DELAYED_COMPLETION" | "PROPERTY_ACCESS" | "PAYMENT_ISSUE" | "OTHER";
  description: string;
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "ESCALATED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  compensationAmount?: number;
}

interface MarkingDisputeListProps {
  disputes?: MarkingDispute[];
  onResolveDispute?: (disputeId: string, resolution: string, compensationAmount?: number) => Promise<void>;
  onEscalateDispute?: (disputeId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

const disputeTypeLabels: Record<MarkingDispute["disputeType"], string> = {
  INCORRECT_MARKING: "Incorrect Marking",
  DELAYED_COMPLETION: "Delayed Completion",
  PROPERTY_ACCESS: "Property Access Issue",
  PAYMENT_ISSUE: "Payment Issue",
  OTHER: "Other",
};

const statusColors: Record<MarkingDispute["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  ESCALATED: "bg-red-100 text-red-800 border-red-200",
};

const priorityColors: Record<MarkingDispute["priority"], string> = {
  LOW: "bg-gray-100 text-gray-800 border-gray-200",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  URGENT: "bg-red-100 text-red-800 border-red-200",
};

export default function MarkingDisputeList({
  disputes = [],
  onResolveDispute,
  onEscalateDispute,
  isLoading = false,
}: MarkingDisputeListProps) {
  const [selectedDispute, setSelectedDispute] = useState<MarkingDispute | null>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isEscalateDialogOpen, setIsEscalateDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [compensationAmount, setCompensationAmount] = useState<number | undefined>();
  const [escalationReason, setEscalationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter disputes
  const filteredDisputes = disputes.filter((dispute) => {
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || dispute.priority === priorityFilter;
    const matchesSearch =
      searchQuery === "" ||
      dispute.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleViewDetails = (dispute: MarkingDispute) => {
    setSelectedDispute(dispute);
  };

  const handleResolveClick = (dispute: MarkingDispute) => {
    setSelectedDispute(dispute);
    setIsResolveDialogOpen(true);
    setResolution("");
    setCompensationAmount(undefined);
  };

  const handleEscalateClick = (dispute: MarkingDispute) => {
    setSelectedDispute(dispute);
    setIsEscalateDialogOpen(true);
    setEscalationReason("");
  };

  const handleResolveSubmit = async () => {
    if (!selectedDispute || !resolution.trim()) return;

    setIsSubmitting(true);
    try {
      await onResolveDispute?.(selectedDispute.id, resolution, compensationAmount);
      setIsResolveDialogOpen(false);
      setSelectedDispute(null);
      setResolution("");
      setCompensationAmount(undefined);
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalateSubmit = async () => {
    if (!selectedDispute || !escalationReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onEscalateDispute?.(selectedDispute.id, escalationReason);
      setIsEscalateDialogOpen(false);
      setSelectedDispute(null);
      setEscalationReason("");
    } catch (error) {
      console.error("Failed to escalate dispute:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisputeStats = () => {
    const stats = {
      total: disputes.length,
      pending: disputes.filter((d) => d.status === "PENDING").length,
      underReview: disputes.filter((d) => d.status === "UNDER_REVIEW").length,
      resolved: disputes.filter((d) => d.status === "RESOLVED").length,
      escalated: disputes.filter((d) => d.status === "ESCALATED").length,
    };
    return stats;
  };

  const stats = getDisputeStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Disputes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
              <p className="text-xs text-muted-foreground">Under Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.escalated}</div>
              <p className="text-xs text-muted-foreground">Escalated</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>Property Marking Disputes</CardTitle>
            <CardDescription>
              Manage disputes related to property marking jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by property, agent, owner, or dispute ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {filteredDisputes.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No disputes found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your filters"
                    : "There are no marking disputes at the moment"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispute ID</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-mono text-xs">
                          {dispute.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="font-medium truncate">{dispute.propertyTitle}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {dispute.propertyAddress}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{disputeTypeLabels[dispute.disputeType]}</span>
                        </TableCell>
                        <TableCell>{dispute.agentName}</TableCell>
                        <TableCell>{dispute.ownerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityColors[dispute.priority]}>
                            {dispute.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[dispute.status]}>
                            {dispute.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(dispute.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(dispute)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {dispute.status !== "RESOLVED" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResolveClick(dispute)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                                {dispute.status !== "ESCALATED" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEscalateClick(dispute)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Escalate
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      {selectedDispute && !isResolveDialogOpen && !isEscalateDialogOpen && (
        <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dispute Details</DialogTitle>
              <DialogDescription>
                Dispute ID: {selectedDispute.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Property</Label>
                  <p className="text-sm">{selectedDispute.propertyTitle}</p>
                  <p className="text-xs text-muted-foreground">{selectedDispute.propertyAddress}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Dispute Type</Label>
                  <p className="text-sm">{disputeTypeLabels[selectedDispute.disputeType]}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Agent</Label>
                  <p className="text-sm">{selectedDispute.agentName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner</Label>
                  <p className="text-sm">{selectedDispute.ownerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge variant="outline" className={priorityColors[selectedDispute.priority]}>
                    {selectedDispute.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="outline" className={statusColors[selectedDispute.status]}>
                    {selectedDispute.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedDispute.description}</p>
              </div>
              {selectedDispute.resolution && (
                <div>
                  <Label className="text-sm font-medium">Resolution</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedDispute.resolution}</p>
                  {selectedDispute.compensationAmount && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      Compensation: ₦{selectedDispute.compensationAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>Created: {format(new Date(selectedDispute.createdAt), "PPpp")}</div>
                {selectedDispute.resolvedAt && (
                  <div>Resolved: {format(new Date(selectedDispute.resolvedAt), "PPpp")}</div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDispute(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide resolution details and optional compensation amount
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">Resolution Details</Label>
              <Textarea
                id="resolution"
                placeholder="Describe how the dispute was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="compensation">Compensation Amount (Optional)</Label>
              <Input
                id="compensation"
                type="number"
                placeholder="Enter amount in Naira"
                value={compensationAmount || ""}
                onChange={(e) => setCompensationAmount(e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResolveDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveSubmit}
              disabled={!resolution.trim() || isSubmitting}
            >
              {isSubmitting ? "Resolving..." : "Resolve Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={isEscalateDialogOpen} onOpenChange={setIsEscalateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Dispute</DialogTitle>
            <DialogDescription>
              Provide a reason for escalating this dispute
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="escalation-reason">Escalation Reason</Label>
              <Textarea
                id="escalation-reason"
                placeholder="Explain why this dispute needs escalation..."
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEscalateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEscalateSubmit}
              disabled={!escalationReason.trim() || isSubmitting}
            >
              {isSubmitting ? "Escalating..." : "Escalate Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}