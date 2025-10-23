// apps/admin/src/components/admin/MarkingJobsTable.tsx
"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  UserPlus, 
  XCircle,
  Clock,
  MapPin
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/table";
import { Button } from "@newcondo/ui/button";
import { Input } from "@newcondo/ui/input";
import { Badge } from "@newcondo/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@newcondo/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
import { formatDate, formatCurrency, formatDuration } from "@/lib/utils/format";
import type { MarkingJobOverview } from "@/types/admin";

interface MarkingJobsTableProps {
  jobs: MarkingJobOverview[];
  onJobClick: (jobId: string) => void;
  onFilterChange: (filters: any) => void;
  filters: {
    status: string;
    dateRange: string;
    urgency: string;
  };
}

export default function MarkingJobsTable({
  jobs,
  onJobClick,
  onFilterChange,
  filters
}: MarkingJobsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "status" | "urgency">("date");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      QUEUED: "secondary",
      ASSIGNED: "default",
      IN_PROGRESS: "default",
      COMPLETED: "outline",
      CANCELLED: "destructive",
      EXPIRED: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      LOW: "secondary",
      NORMAL: "default",
      HIGH: "default",
      URGENT: "destructive"
    };
    return <Badge variant={variants[urgency] || "default"}>{urgency}</Badge>;
  };

  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = 
        job.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.requestingUser.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filters.status === "all" || job.status === filters.status;
      const matchesUrgency = filters.urgency === "all" || job.urgencyLevel === filters.urgency;

      return matchesSearch && matchesStatus && matchesUrgency;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      } else {
        return a.urgencyLevel.localeCompare(b.urgencyLevel);
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marking Jobs</CardTitle>
        <CardDescription>
          Manage and monitor all property marking jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by property, job ID, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="urgency">Urgency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Select 
              value={filters.status} 
              onValueChange={(value) => onFilterChange({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[180px]">
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

            <Select 
              value={filters.urgency} 
              onValueChange={(value) => onFilterChange({ ...filters, urgency: value })}
            >
              <SelectTrigger className="w-[180px]">
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

            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => onFilterChange({ ...filters, dateRange: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Time Remaining</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <p className="text-muted-foreground">No marking jobs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow 
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onJobClick(job.id)}
                  >
                    <TableCell className="font-mono text-sm">
                      {job.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{job.property.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.property.city}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.requestingUser.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.requestingUser.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.assignedAgent ? (
                        <div>
                          <p className="font-medium">{job.assignedAgent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.assignedAgent.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{getUrgencyBadge(job.urgencyLevel)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(job.markingFee)}
                    </TableCell>
                    <TableCell>
                      {job.timeSlotExpiry ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDuration(
                              new Date(job.timeSlotExpiry).getTime() - Date.now()
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onJobClick(job.id);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {!job.assignedAgent && (
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign Agent
                            </DropdownMenuItem>
                          )}
                          {job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                            <DropdownMenuItem 
                              onClick={(e) => e.stopPropagation()}
                              className="text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
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

        {/* Pagination Info */}
        {filteredJobs.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </div>
        )}
      </CardContent>
    </Card>
  );
}