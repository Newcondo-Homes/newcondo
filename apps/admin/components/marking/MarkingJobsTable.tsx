"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Phone,
} from "lucide-react";
import { formatDistance } from "date-fns";

interface MarkingJob {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  requestedBy: string;
  requesterName: string;
  requesterPhone: string;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  assignedAgentPhone: string | null;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions: string | null;
  preferredTime: string | null;
  urgencyLevel: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  markingFee: number;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "HELD" | "RELEASED";
  status: "QUEUED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  queuePosition: number | null;
  assignedAt: string | null;
  completedAt: string | null;
  timeSlotExpiry: string | null;
  maxCompletionTime: string | null;
  completionNotes: string | null;
  completionImages: string[];
  createdAt: string;
  updatedAt: string;
}

interface MarkingJobsTableProps {
  initialJobs?: MarkingJob[];
}

export function MarkingJobsTable({ initialJobs = [] }: MarkingJobsTableProps) {
  const [jobs, setJobs] = useState<MarkingJob[]>(initialJobs);
  const [filteredJobs, setFilteredJobs] = useState<MarkingJob[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL");
  const [selectedJob, setSelectedJob] = useState<MarkingJob | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Fetch marking jobs
  useEffect(() => {
    fetchMarkingJobs();
  }, []);

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.assignedAgentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Urgency filter
    if (urgencyFilter !== "ALL") {
      filtered = filtered.filter((job) => job.urgencyLevel === urgencyFilter);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, urgencyFilter, jobs]);

  const fetchMarkingJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/marking-jobs");
      if (!response.ok) throw new Error("Failed to fetch marking jobs");
      const data = await response.json();
      setJobs(data.jobs);
      setFilteredJobs(data.jobs);
    } catch (error) {
      toast.error("Failed to load marking jobs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewJob = (job: MarkingJob) => {
    setSelectedJob(job);
    setViewDialogOpen(true);
  };

  const handleCancelJob = async () => {
    if (!selectedJob || !cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      const response = await fetch(`/api/admin/marking-jobs/${selectedJob.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) throw new Error("Failed to cancel job");

      toast.success("Marking job cancelled successfully");
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedJob(null);
      fetchMarkingJobs();
    } catch (error) {
      toast.error("Failed to cancel marking job");
      console.error(error);
    }
  };

  const handleReassignJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/marking-jobs/${jobId}/reassign`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to reassign job");

      toast.success("Job reassigned successfully");
      fetchMarkingJobs();
    } catch (error) {
      toast.error("Failed to reassign job");
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredJobs.map((job) => ({
      ID: job.id,
      Property: job.propertyTitle,
      Address: job.propertyAddress,
      Requester: job.requesterName,
      "Assigned Agent": job.assignedAgentName || "Unassigned",
      Status: job.status,
      Urgency: job.urgencyLevel,
      "Marking Fee": job.markingFee,
      "Payment Status": job.paymentStatus,
      "Created At": new Date(job.createdAt).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marking-jobs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      QUEUED: "secondary",
      ASSIGNED: "default",
      IN_PROGRESS: "default",
      COMPLETED: "outline",
      CANCELLED: "destructive",
      EXPIRED: "destructive",
    };

    const icons: Record<string, JSX.Element> = {
      QUEUED: <Clock className="h-3 w-3 mr-1" />,
      ASSIGNED: <User className="h-3 w-3 mr-1" />,
      IN_PROGRESS: <AlertCircle className="h-3 w-3 mr-1" />,
      COMPLETED: <CheckCircle className="h-3 w-3 mr-1" />,
      CANCELLED: <XCircle className="h-3 w-3 mr-1" />,
      EXPIRED: <XCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status] || "default"} className="flex items-center w-fit">
        {icons[status]}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      NORMAL: "bg-blue-100 text-blue-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={colors[urgency] || "bg-gray-100 text-gray-800"}>
        {urgency}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      SUCCESS: "outline",
      FAILED: "destructive",
      HELD: "default",
      RELEASED: "outline",
    };

    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, requester, agent, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="QUEUED">Queued</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Urgency</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">
            {jobs.filter((j) => j.status === "QUEUED").length}
          </div>
          <div className="text-sm text-blue-600">Queued</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length}
          </div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700">
            {jobs.filter((j) => j.status === "COMPLETED").length}
          </div>
          <div className="text-sm text-purple-600">Completed</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-700">
            {jobs.filter((j) => j.urgencyLevel === "URGENT").length}
          </div>
          <div className="text-sm text-orange-600">Urgent</div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Queue Pos.</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No marking jobs found
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{job.propertyTitle}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.propertyAddress}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{job.requesterName}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {job.requesterPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.assignedAgentName ? (
                      <div className="space-y-1">
                        <div className="font-medium">{job.assignedAgentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.assignedAgentPhone}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>{getUrgencyBadge(job.urgencyLevel)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getPaymentStatusBadge(job.paymentStatus)}
                      <div className="text-sm font-medium">
                        ₦{job.markingFee.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.queuePosition ? (
                      <Badge variant="outline">#{job.queuePosition}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDistance(new Date(job.createdAt), new Date(), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewJob(job)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {(job.status === "ASSIGNED" || job.status === "IN_PROGRESS") && (
                          <DropdownMenuItem onClick={() => handleReassignJob(job.id)}>
                            <User className="h-4 w-4 mr-2" />
                            Reassign Agent
                          </DropdownMenuItem>
                        )}
                        {job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedJob(job);
                              setCancelDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Job
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Job Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marking Job Details</DialogTitle>
            <DialogDescription>
              Complete information about this marking job
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              {/* Property Info */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">Property Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Title:</span>{" "}
                    <span className="font-medium">{selectedJob.propertyTitle}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Address:</span>{" "}
                    <span className="font-medium">{selectedJob.propertyAddress}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Contact Person</div>
                    <div className="font-medium">{selectedJob.contactPersonName}</div>
                    <div className="text-muted-foreground">{selectedJob.contactPersonPhone}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Requester</div>
                    <div className="font-medium">{selectedJob.requesterName}</div>
                    <div className="text-muted-foreground">{selectedJob.requesterPhone}</div>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">Job Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {getStatusBadge(selectedJob.status)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Urgency:</span>{" "}
                    {getUrgencyBadge(selectedJob.urgencyLevel)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Marking Fee:</span>{" "}
                    <span className="font-medium">₦{selectedJob.markingFee.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment:</span>{" "}
                    {getPaymentStatusBadge(selectedJob.paymentStatus)}
                  </div>
                  {selectedJob.queuePosition && (
                    <div>
                      <span className="text-muted-foreground">Queue Position:</span>{" "}
                      <Badge variant="outline">#{selectedJob.queuePosition}</Badge>
                    </div>
                  )}
                </div>
                {selectedJob.accessInstructions && (
                  <div className="mt-2">
                    <div className="text-muted-foreground text-sm mb-1">Access Instructions:</div>
                    <div className="text-sm bg-muted p-2 rounded">
                      {selectedJob.accessInstructions}
                    </div>
                  </div>
                )}
              </div>

              {/* Completion Info */}
              {selectedJob.completionNotes && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold">Completion Details</h3>
                  <div className="text-sm bg-muted p-2 rounded">
                    {selectedJob.completionNotes}
                  </div>
                  {selectedJob.completionImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedJob.completionImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Completion ${idx + 1}`}
                          className="rounded border w-full h-24 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Job Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Marking Job</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this job. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter cancellation reason..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelJob}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}