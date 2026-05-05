"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMarkingStore } from "@/store/markingStore";
import { markingApi } from "@/lib/api/marking";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Separator } from "@newcondo/ui/components/separator";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import {
  Clock,
  Phone,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { LoadingSpinner } from "@/components/shared/feedback/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@newcondo/ui/components/dialog";
import type { MarkingJobResponse } from "@/lib/api/marking";
import Image from "next/image";

const statusConfig: Record<
  string,
  { label: string; color: string; hexColor: string; icon: React.ElementType }
> = {
  QUEUED: { label: "Queued", color: "bg-blue-500", hexColor: "#3b82f6", icon: Clock },
  ASSIGNED: { label: "Assigned", color: "bg-purple-500", hexColor: "#a855f7", icon: User },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-500", hexColor: "#eab308", icon: Clock },
  COMPLETED: { label: "Completed", color: "bg-green-500", hexColor: "#22c55e", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500", hexColor: "#6b7280", icon: XCircle },
  EXPIRED: { label: "Expired", color: "bg-red-500", hexColor: "#ef4444", icon: AlertCircle },
};

export default function MarkingJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const {
    selectedJob,
    setSelectedJob,
    isLoadingJobDetails,
    setIsLoadingJobDetails,
    error,
    setError,
  } = useMarkingStore();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchJobDetails = useCallback(async () => {
    try {
      setIsLoadingJobDetails(true);
      setError(null);
      const response = await markingApi.getJobById(jobId);
      setSelectedJob(response as unknown as Parameters<typeof setSelectedJob>[0]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch job details";
      setError(message);
    } finally {
      setIsLoadingJobDetails(false);
    }
  }, [jobId, setIsLoadingJobDetails, setError, setSelectedJob]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleCancelJob = async () => {
    try {
      setIsCancelling(true);
      await markingApi.cancelJob(jobId, "Cancelled by property owner");
      await fetchJobDetails();
      setCancelDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to cancel job";
      setError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoadingJobDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !selectedJob) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Job not found"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/marking-jobs")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  const job = selectedJob as unknown as MarkingJobResponse;

  const config = statusConfig[job.status] ?? statusConfig.QUEUED;
  const StatusIcon = config.icon;

  const timeRemaining =
    job.maxCompletionTime
      ? differenceInHours(new Date(job.maxCompletionTime), new Date())
      : null;

  const completionImages = (job.completionImages ?? []) as string[];

  const canConfirm = job.status === "COMPLETED" && completionImages.length > 0;
  const canCancel = job.status === "QUEUED" || job.status === "ASSIGNED";

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/marking-jobs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
        <div className="flex items-center gap-2">
          {canConfirm && (
            <Button onClick={() => router.push(`/marking-jobs/${jobId}/confirm`)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Marking
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Job
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <Card className="mb-6 border-l-4" style={{ borderLeftColor: config.hexColor }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-6 w-6" />
              <div>
                <CardTitle className="text-2xl">{job.property?.title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  Job ID: {job.id.slice(0, 8).toUpperCase()}
                </CardDescription>
              </div>
            </div>
            <Badge className={`${config.color} text-lg px-4 py-2`}>
              {config.label}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Time Warning */}
      {timeRemaining !== null && timeRemaining > 0 && timeRemaining < 24 && (
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Time Remaining:</strong> {timeRemaining} hours left for completion confirmation
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.property?.images?.[0] && (
                <div className="relative w-full h-64">
                  <Image
                    src={job.property.images[0].url}
                    alt={job.property.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{job.property?.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium">{job.property?.city}, {job.property?.state}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Person</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{job.contactPersonName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{job.contactPersonPhone}</p>
                  </div>
                </div>
              </div>

              {job.accessInstructions && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Access Instructions</p>
                    <p className="text-sm">{job.accessInstructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Completion Evidence */}
          {completionImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Evidence</CardTitle>
                <CardDescription>Photos uploaded by the marking agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {completionImages.map((image: string, index: number) => (
                    <div key={index} className="relative group aspect-video">
                      <Image
                        src={image}
                        alt={`Completion ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(image, "_blank")}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {job.completionNotes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Agent Notes</p>
                      <p className="text-sm">{job.completionNotes as string}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Job Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium">Job Created</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(job.createdAt), "PPp")}
                  </p>
                </div>
              </div>

              {job.assignedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="font-medium">Agent Assigned</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(job.assignedAt), "PPp")}
                    </p>
                  </div>
                </div>
              )}

              {job.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                  <div>
                    <p className="font-medium">Job Completed</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(job.completedAt), "PPp")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Agent */}
          {job.assignedAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{job.assignedAgent.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{job.assignedAgent.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{job.assignedAgent.email}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Marking Fee</p>
                <p className="text-2xl font-bold">
                  ₦{Number(job.markingFee).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <Badge variant={job.paymentStatus === "SUCCESS" ? "default" : "secondary"}>
                  {job.paymentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Urgency Level</p>
                <Badge variant="outline">{job.urgencyLevel}</Badge>
              </div>
              {job.queuePosition && (
                <div>
                  <p className="text-sm text-gray-500">Queue Position</p>
                  <p className="font-medium">#{job.queuePosition}</p>
                </div>
              )}
              {job.preferredTime && (
                <div>
                  <p className="text-sm text-gray-500">Preferred Time</p>
                  <p className="font-medium">
                    {format(new Date(job.preferredTime), "PPp")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Marking Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this marking job? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep Job
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelJob}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}