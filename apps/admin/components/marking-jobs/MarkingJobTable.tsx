"use client";

import { useState } from "react";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Input } from "@newcondo/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/components/select";
import { Search, Eye, Filter, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface MarkingJob {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  requestedBy: string;
  requestedByName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: "QUEUED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  urgencyLevel: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  markingFee: number;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "HELD" | "RELEASED";
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string;
  createdAt: string;
  maxCompletionTime?: string;
}

interface MarkingJobTableProps {
  jobs: MarkingJob[];
  isLoading?: boolean;
}

const statusColors = {
  QUEUED: "bg-gray-100 text-gray-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-red-100 text-red-800",
};

const urgencyColors = {
  LOW: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

const paymentColors = {
  PENDING: "bg-gray-100 text-gray-800",
  SUCCESS: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  HELD: "bg-yellow-100 text-yellow-800",
  RELEASED: "bg-blue-100 text-blue-800",
};

export default function MarkingJobTable({ jobs, isLoading }: MarkingJobTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.requestedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.assignedAgentName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || job.urgencyLevel === urgencyFilter;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const isExpiringSoon = (job: MarkingJob) => {
    if (!job.timeSlotExpiry) return false;
    const expiryTime = new Date(job.timeSlotExpiry).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    return expiryTime - now < thirtyMinutes && expiryTime > now;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by property, requester, or agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  No marking jobs found
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id} className={isExpiringSoon(job) ? "bg-yellow-50" : ""}>
                  <TableCell className="font-mono text-xs">
                    {job.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="font-medium text-sm truncate">{job.propertyTitle}</p>
                      <p className="text-xs text-gray-500 truncate">{job.propertyAddress}</p>
                    </div>
                  </TableCell>
                  <TableCell>{job.requestedByName}</TableCell>
                  <TableCell>
                    {job.assignedAgentName || (
                      <span className="text-gray-400 text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[job.status]}>
                        {job.status.replace(/_/g, " ")}
                      </Badge>
                      {isExpiringSoon(job) && (
                        <AlertCircle className="h-4 w-4 text-yellow-600" title="Expiring soon" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={urgencyColors[job.urgencyLevel]}>
                      {job.urgencyLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{job.markingFee.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={paymentColors[job.paymentStatus]}>
                      {job.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      {job.timeSlotExpiry && (
                        <p className="text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires {formatDistanceToNow(new Date(job.timeSlotExpiry), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/marking-jobs/${job.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="text-center">
          <p className="text-gray-500">Total</p>
          <p className="text-2xl font-bold">{jobs.length}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Queued</p>
          <p className="text-2xl font-bold text-gray-600">
            {jobs.filter((j) => j.status === "QUEUED").length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">
            {jobs.filter((j) => j.status === "IN_PROGRESS").length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {jobs.filter((j) => j.status === "COMPLETED").length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-red-600">
            {jobs.filter((j) => j.status === "EXPIRED").length}
          </p>
        </div>
      </div>
    </div>
  );
}