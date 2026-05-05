"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMarkingStore, type MarkingJob } from "@/store/markingStore";
import { useAuth } from "@/hooks/useAuth";
import { markingApi } from "@/lib/api/marking";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/components/select";
import { Clock, MapPin, Plus, Filter, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/shared/feedback/LoadingSpinner";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";

const statusConfig: Record<MarkingJob["status"], { label: string; color: string }> = {
  QUEUED: { label: "Queued", color: "bg-blue-500" },
  ASSIGNED: { label: "Assigned", color: "bg-purple-500" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-500" },
  COMPLETED: { label: "Completed", color: "bg-green-500" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500" },
  EXPIRED: { label: "Expired", color: "bg-red-500" },
};

const urgencyConfig: Record<MarkingJob["urgencyLevel"], { label: string; color: string }> = {
  LOW: { label: "Low", color: "text-gray-600" },
  NORMAL: { label: "Normal", color: "text-blue-600" },
  HIGH: { label: "High", color: "text-orange-600" },
  URGENT: { label: "Urgent", color: "text-red-600" },
};

type UrgencyFilter = MarkingJob["urgencyLevel"] | "all";

export default function MarkingJobsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    markingJobs,
    setMarkingJobs,
    isLoadingJobs,
    setIsLoadingJobs,
    error,
    setError,
  } = useMarkingStore();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");

  const fetchMarkingJobs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingJobs(true);
      setError(null);
      const response = await markingApi.getUserJobs(user.id, "requested");
      setMarkingJobs(response.jobs as unknown as MarkingJob[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch marking jobs");
    } finally {
      setIsLoadingJobs(false);
    }
  }, [user?.id, setIsLoadingJobs, setError, setMarkingJobs]);

  useEffect(() => {
    fetchMarkingJobs();
  }, [fetchMarkingJobs]);

  // Apply urgency filter first, then tab filter
  const filteredJobs = markingJobs
    .filter((job: MarkingJob) =>
      urgencyFilter === "all" ? true : job.urgencyLevel === urgencyFilter
    )
    .filter((job: MarkingJob) => {
      if (activeTab === "all") return true;
      if (activeTab === "pending") return job.status === "QUEUED" || job.status === "ASSIGNED";
      if (activeTab === "active") return job.status === "IN_PROGRESS";
      if (activeTab === "completed") return job.status === "COMPLETED";
      return true;
    });

  const stats = {
    total: markingJobs.length,
    pending: markingJobs.filter((j: MarkingJob) => j.status === "QUEUED" || j.status === "ASSIGNED").length,
    active: markingJobs.filter((j: MarkingJob) => j.status === "IN_PROGRESS").length,
    completed: markingJobs.filter((j: MarkingJob) => j.status === "COMPLETED").length,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Property Marking Jobs</h1>
          <p className="text-gray-600 mt-1">Manage your property marking requests</p>
        </div>
        <Button onClick={() => router.push("/marking-jobs/create")}>
          <Plus className="mr-2 h-4 w-4" />
          New Marking Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Jobs</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Select
          value={urgencyFilter}
          onValueChange={(value) => setUrgencyFilter(value as UrgencyFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Urgency Level" />
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoadingJobs ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 mb-4">No marking jobs found</p>
                <Button onClick={() => router.push("/marking-jobs/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Marking Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/marking-jobs/${job.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={statusConfig[job.status].color}>
                            {statusConfig[job.status].label}
                          </Badge>
                          <Badge variant="outline" className={urgencyConfig[job.urgencyLevel].color}>
                            {urgencyConfig[job.urgencyLevel].label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>Job #{job.id.slice(-6).toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Contact Person:</span>
                            <p className="font-medium">{job.contactPersonName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Fee:</span>
                            <p className="font-medium">₦{job.markingFee.toLocaleString()}</p>
                          </div>
                          {job.assignedAgentId && (
                            <div>
                              <span className="text-gray-500">Assigned Agent:</span>
                              <p className="font-medium text-purple-600">Yes</p>
                            </div>
                          )}
                          {job.queuePosition && (
                            <div>
                              <span className="text-gray-500">Queue Position:</span>
                              <p className="font-medium">#{job.queuePosition}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}