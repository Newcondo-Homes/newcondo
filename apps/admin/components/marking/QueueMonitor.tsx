"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QueuedAgent {
  id: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  queuePosition: number;
  assignedAt: string;
  timeSlotExpiry: string;
  status: "WAITING" | "ACTIVE" | "EXPIRED" | "COMPLETED";
  distanceFromProperty: string;
  reliabilityScore: number;
  completedJobs: number;
  totalJobs: number;
}

interface MarkingJob {
  id: string;
  propertyId: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  requestedBy: string;
  ownerName: string;
  ownerPhone: string;
  contactPersonName: string;
  contactPersonPhone: string;
  status: "QUEUED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  urgencyLevel: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  markingFee: number;
  paymentStatus: "PENDING" | "SUCCESS" | "HELD" | "RELEASED";
  queuedAgents: QueuedAgent[];
  currentAgentId: string | null;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  maxCompletionTime: string;
  timeRemaining: string;
}

export default function QueueMonitor() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<MarkingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<MarkingJob | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/admin/marking/queue");
      if (!response.ok) throw new Error("Failed to fetch queue data");
      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load queue data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReassignAgent = async (jobId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/marking/queue/${jobId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error("Failed to reassign agent");

      toast({
        title: "Success",
        description: "Agent reassigned successfully",
      });

      fetchQueueData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reassign agent",
        variant: "destructive",
      });
    }
  };

  const handleCancelJob = async (jobId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/marking/queue/${jobId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error("Failed to cancel job");

      toast({
        title: "Success",
        description: "Marking job cancelled successfully",
      });

      fetchQueueData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel job",
        variant: "destructive",
      });
    }
  };

  const handleExtendDeadline = async (jobId: string, hours: number) => {
    try {
      const response = await fetch(`/api/admin/marking/queue/${jobId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extensionHours: hours }),
      });

      if (!response.ok) throw new Error("Failed to extend deadline");

      toast({
        title: "Success",
        description: `Deadline extended by ${hours} hours`,
      });

      fetchQueueData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extend deadline",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      QUEUED: { label: "Queued", variant: "secondary" as const },
      ASSIGNED: { label: "Assigned", variant: "default" as const },
      IN_PROGRESS: { label: "In Progress", variant: "default" as const },
      COMPLETED: { label: "Completed", variant: "default" as const },
      CANCELLED: { label: "Cancelled", variant: "destructive" as const },
      EXPIRED: { label: "Expired", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.QUEUED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      LOW: { label: "Low", variant: "secondary" as const },
      NORMAL: { label: "Normal", variant: "default" as const },
      HIGH: { label: "High", variant: "default" as const },
      URGENT: { label: "Urgent", variant: "destructive" as const },
    };
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.NORMAL;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "EXPIRED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    const matchesUrgency = urgencyFilter === "ALL" || job.urgencyLevel === urgencyFilter;
    const matchesSearch =
      searchTerm === "" ||
      job.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesUrgency && matchesSearch;
  });

  const queueStats = {
    total: jobs.length,
    queued: jobs.filter((j) => j.status === "QUEUED").length,
    assigned: jobs.filter((j) => j.status === "ASSIGNED").length,
    inProgress: jobs.filter((j) => j.status === "IN_PROGRESS").length,
    completed: jobs.filter((j) => j.status === "COMPLETED").length,
    expired: jobs.filter((j) => j.status === "EXPIRED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{queueStats.queued}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{queueStats.assigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{queueStats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{queueStats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Monitor</CardTitle>
          <CardDescription>Monitor and manage property marking job queues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address, owner, or job ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="QUEUED">Queued</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Urgencies</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchQueueData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Jobs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Queue</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No marking jobs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{job.propertyAddress}</div>
                            <div className="text-sm text-muted-foreground">
                              {job.propertyCity}, {job.propertyState}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{job.ownerName}</div>
                            <div className="text-sm text-muted-foreground">{job.ownerPhone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{getUrgencyBadge(job.urgencyLevel)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{job.queuedAgents.length} agents</div>
                          <div className="text-muted-foreground">
                            {job.queuedAgents.filter((a) => a.status === "ACTIVE").length} active
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{job.timeRemaining}</div>
                          <div className="text-xs text-muted-foreground">
                            Max: {new Date(job.maxCompletionTime).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedJob(job)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      {selectedJob && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Job Details: {selectedJob.id.slice(0, 8)}</CardTitle>
                <CardDescription>
                  Created: {new Date(selectedJob.createdAt).toLocaleString()}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Property Information */}
            <div>
              <h3 className="font-semibold mb-3">Property Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium">{selectedJob.propertyAddress}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium">
                    {selectedJob.propertyCity}, {selectedJob.propertyState}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Marking Fee:</span>
                  <p className="font-medium">₦{selectedJob.markingFee.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Status:</span>
                  <p className="font-medium">{selectedJob.paymentStatus}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact Person:</span>
                  <p className="font-medium">{selectedJob.contactPersonName}</p>
                  <p className="text-muted-foreground">{selectedJob.contactPersonPhone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Property Owner:</span>
                  <p className="font-medium">{selectedJob.ownerName}</p>
                  <p className="text-muted-foreground">{selectedJob.ownerPhone}</p>
                </div>
              </div>
            </div>

            {/* Queue Information */}
            <div>
              <h3 className="font-semibold mb-3">Agent Queue ({selectedJob.queuedAgents.length})</h3>
              <div className="space-y-3">
                {selectedJob.queuedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getAgentStatusIcon(agent.status)}
                      <div>
                        <div className="font-medium">
                          Position #{agent.queuePosition} - {agent.agentName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agent.agentPhone} • {agent.distanceFromProperty} away
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Reliability: {agent.reliabilityScore}/5.00 • Completed: {agent.completedJobs}/
                          {agent.totalJobs}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{agent.status}</div>
                      {agent.status === "ACTIVE" && (
                        <div className="text-muted-foreground">
                          Expires: {new Date(agent.timeSlotExpiry).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Actions */}
            <div>
              <h3 className="font-semibold mb-3">Admin Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleReassignAgent(selectedJob.id, "Admin manual reassignment")}
                  disabled={selectedJob.status === "COMPLETED"}
                >
                  Reassign Agent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExtendDeadline(selectedJob.id, 3)}
                  disabled={selectedJob.status === "COMPLETED"}
                >
                  Extend 3 Hours
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExtendDeadline(selectedJob.id, 24)}
                  disabled={selectedJob.status === "COMPLETED"}
                >
                  Extend 24 Hours
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCancelJob(selectedJob.id, "Admin cancelled")}
                  disabled={selectedJob.status === "COMPLETED" || selectedJob.status === "CANCELLED"}
                >
                  Cancel Job
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}