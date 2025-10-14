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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Loader2 } from "lucide-react";

interface MarkingJob {
  id: string;
  propertyId: string;
  propertyTitle: string;
  requestedBy: string;
  requestedByName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  contactPersonName: string;
  status: string;
  paymentStatus: string;
  markingFee: number;
  urgencyLevel: string;
  createdAt: string;
  completedAt?: string;
  timeSlotExpiry?: string;
}

interface MarkingJobTableProps {
  onViewDetails?: (job: MarkingJob) => void;
  compact?: boolean;
}

export default function MarkingJobTable({
  onViewDetails,
  compact = false,
}: MarkingJobTableProps) {
  const [jobs, setJobs] = useState<MarkingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchMarkingJobs();
  }, [statusFilter, page]);

  const fetchMarkingJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: compact ? "10" : "20",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/marking-jobs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch marking jobs");

      const data = await response.json();
      setJobs(data.jobs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load marking jobs");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      QUEUED: "bg-yellow-100 text-yellow-800",
      ASSIGNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-orange-100 text-orange-800",
      SUCCESS: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      HELD: "bg-yellow-100 text-yellow-800",
      RELEASED: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      LOW: "text-blue-600",
      NORMAL: "text-gray-600",
      HIGH: "text-orange-600",
      URGENT: "text-red-600",
    };
    return colors[urgency] || "text-gray-600";
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search by property, owner, or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Agent</TableHead>
              {!compact && <TableHead>Created</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium truncate max-w-xs">
                    {job.propertyTitle}
                  </TableCell>
                  <TableCell>{job.requestedByName}</TableCell>
                  <TableCell>{job.contactPersonName}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(job.paymentStatus)}>
                      {job.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">₦{job.markingFee.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getUrgencyColor(job.urgencyLevel)}`}>
                      {job.urgencyLevel}
                    </span>
                  </TableCell>
                  <TableCell>
                    {job.assignedAgentName ? (
                      <span className="text-sm">{job.assignedAgentName}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  {!compact && (
                    <TableCell className="text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails?.(job)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={compact ? 9 : 10} className="text-center py-8 text-gray-500">
                  No marking jobs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button variant="outline" disabled>
            Page {page}
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={filteredJobs.length < (compact ? 10 : 20)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}