"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMarkingStore } from "@/store/markingStore";
import { markingJobsApi } from "@/lib/api/markingJobs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  MapPin,
  Phone,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Eye,
  Download,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import LoadingSpinner from "@/components/shared/feedback/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig = {
  QUEUED: { label: "Queued", color: "bg-blue-500", icon: Clock },
  ASSIGNED: { label: "Assigned", color: "bg-purple-500", icon: User },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-500", icon: Clock },
  COMPLETED: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500", icon: XCircle },
  EXPIRED: { label: "Expired", color: "bg-red-500", icon: AlertCircle },
};

export default function MarkingJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { currentJob, setCurrentJob, isLoading, setLoading, error, setError } = useMarkingStore();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await markingJobsApi.getJobById(jobId);
      setCurrentJob(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async () => {
    try {
      setIsCancelling(true);
      await markingJobsApi.cancelJob(jobId);
      await fetchJobDetails();
      setCancelDialogOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to cancel job");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !currentJob) {
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

  const StatusIcon = statusConfig[currentJob.status].icon;
  const timeRemaining = currentJob.maxCompletionTime
    ? differenceInHours(new Date(currentJob.maxCompletionTime), new Date())
    : null;

  const canConfirm = currentJob.status === "COMPLETED" && currentJob.completionImages.length > 0;
  const canCancel = currentJob.status === "QUEUED" || currentJob.status === "ASSIGNED";

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
      <Card className="mb-6 border-l-4" style={{ borderLeftColor: statusConfig[currentJob.status].color.replace('bg-', '#') }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-6 w-6" />
              <div>
                <CardTitle className="text-2xl">{currentJob.property?.title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  Job ID: {currentJob.id.slice(0, 8).toUpperCase()}
                </CardDescription>
              </div>
            </div>
            <Badge className={`${statusConfig[currentJob.status].color} text-lg px-4 py-2`}>
              {statusConfig[currentJob.status].label}
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
              {currentJob.property?.images?.[0] && (
                <img
                  src={currentJob.property.images[0].url}
                  alt={currentJob.property.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{currentJob.property?.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium">{currentJob.property?.city}, {currentJob.property?.state}</p>
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
                    <p className="font-medium">{currentJob.contactPersonName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{currentJob.contactPersonPhone}</p>
                  </div>
                </div>
              </div>

              {currentJob.accessInstructions && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Access Instructions</p>
                    <p className="text-sm">{currentJob.accessInstructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Completion Evidence */}
          {currentJob.completionImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Evidence</CardTitle>
                <CardDescription>Photos uploaded by the marking agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {currentJob.completionImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Completion ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
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

                {currentJob.completionNotes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Agent Notes</p>
                      <p className="text-sm">{currentJob.completionNotes}</p>
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
                    {format(new Date(currentJob.createdAt), "PPp")}
                  </p>
                </div>
              </div>

              {currentJob.assignedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="font-medium">Agent Assigned</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(currentJob.assignedAt), "PPp")}
                    </p>
                  </div>
                </div>
              )}

              {currentJob.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                  <div>
                    <p className="font-medium">Job Completed</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(currentJob.completedAt), "PPp")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Agent */}
          {currentJob.assignedAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{currentJob.assignedAgent.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{currentJob.assignedAgent.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{currentJob.assignedAgent.email}</p>
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
                <p className="text-2xl font-bold">₦{currentJob.markingFee.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <Badge variant={currentJob.paymentStatus === "SUCCESS" ? "default" : "secondary"}>
                  {currentJob.paymentStatus}
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
                <Badge variant="outline">{currentJob.urgencyLevel}</Badge>
              </div>
              {currentJob.queuePosition && (
                <div>
                  <p className="text-sm text-gray-500">Queue Position</p>
                  <p className="font-medium">#{currentJob.queuePosition}</p>
                </div>
              )}
              {currentJob.preferredTime && (
                <div>
                  <p className="text-sm text-gray-500">Preferred Time</p>
                  <p className="font-medium">
                    {format(new Date(currentJob.preferredTime), "PPp")}
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