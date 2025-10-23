// apps/admin/src/app/(dashboard)/marking-oversight/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, MapPin, Clock, User } from "lucide-react";
import MarkingJobDetails from "@/components/admin/MarkingJobDetails";
import DisputeResolution from "@/components/admin/DisputeResolution";
import { Button } from "@newcondo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Badge } from "@newcondo/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/tabs";
import { Alert, AlertDescription } from "@newcondo/ui/alert";
import { Separator } from "@newcondo/ui/separator";
import { markingOversightApi } from "@/lib/api/markingOversight";
import { formatDate, formatCurrency, formatDuration } from "@/lib/utils/format";
import type { MarkingJobDetail, JobTimeline, DisputeInfo } from "@/types/admin";

export default function MarkingJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<MarkingJobDetail | null>(null);
  const [timeline, setTimeline] = useState<JobTimeline[]>([]);
  const [dispute, setDispute] = useState<DisputeInfo | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobData, timelineData, disputeData] = await Promise.all([
        markingOversightApi.getJobDetails(jobId),
        markingOversightApi.getJobTimeline(jobId),
        markingOversightApi.getJobDispute(jobId).catch(() => null) // Dispute may not exist
      ]);

      setJob(jobData);
      setTimeline(timelineData);
      setDispute(disputeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const handleReassignAgent = async () => {
    try {
      await markingOversightApi.reassignJob(jobId);
      await fetchJobDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign job");
    }
  };

  const handleCancelJob = async () => {
    if (!confirm("Are you sure you want to cancel this job?")) return;

    try {
      await markingOversightApi.cancelJob(jobId);
      router.push("/marking-oversight");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel job");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Marking job not found</AlertDescription>
        </Alert>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push("/marking-oversight")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Job #{job.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              Property marking job details and management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(job.status)}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.property.title}</div>
            <p className="text-xs text-muted-foreground">
              {job.property.city}, {job.property.state}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Agent</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {job.assignedAgent?.name || "Unassigned"}
            </div>
            <p className="text-xs text-muted-foreground">
              {job.assignedAgent?.email || "Waiting in queue"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {job.timeSlotExpiry 
                ? formatDuration(new Date(job.timeSlotExpiry).getTime() - Date.now())
                : "N/A"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {job.maxCompletionTime 
                ? `Deadline: ${formatDate(job.maxCompletionTime)}`
                : "No deadline set"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Job Details</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {dispute && (
            <TabsTrigger value="dispute">
              Dispute
              <Badge variant="destructive" className="ml-2">!</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <MarkingJobDetails 
            job={job}
            onReassign={handleReassignAgent}
            onCancel={handleCancelJob}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Timeline</CardTitle>
              <CardDescription>
                Complete history of this marking job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      {index < timeline.length - 1 && (
                        <div className="absolute left-1/2 top-4 w-px h-full bg-border -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{event.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </p>
                      {event.details && (
                        <p className="text-sm mt-1">{event.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {dispute && (
          <TabsContent value="dispute" className="space-y-4">
            <DisputeResolution 
              dispute={dispute}
              jobId={jobId}
              onResolve={fetchJobDetails}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>
            Administrative controls for this marking job
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button 
            onClick={handleReassignAgent}
            disabled={job.status === "COMPLETED" || job.status === "CANCELLED"}
            variant="outline"
          >
            Reassign Agent
          </Button>
          <Button 
            onClick={handleCancelJob}
            disabled={job.status === "COMPLETED" || job.status === "CANCELLED"}
            variant="destructive"
          >
            Cancel Job
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}