"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMarkingStore } from "@/store/markingStore";
import { markingJobsApi } from "@/lib/api/markingJobs";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Textarea } from "@newcondo/ui/components/textarea";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { RadioGroup, RadioGroupItem } from "@newcondo/ui/components/radio-group";
import { Label } from "@newcondo/ui/components/label";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import {LoadingSpinner} from "@/components/shared/feedback/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@newcondo/ui/components/dialog";

type ConfirmationDecision = "accept" | "reject" | "";

export default function MarkingJobConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { currentJob, setCurrentJob, isLoading, setLoading, error, setError } = useMarkingStore();
  
  const [decision, setDecision] = useState<ConfirmationDecision>("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await markingJobsApi.getJobById(jobId);
      
      if (response.data.status !== "COMPLETED") {
        router.push(`/marking-jobs/${jobId}`);
        return;
      }
      
      setCurrentJob(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitConfirmation = async () => {
    if (!decision) {
      setError("Please select a decision");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (decision === "accept") {
        await markingJobsApi.confirmJob(jobId, { feedback });
      } else {
        await markingJobsApi.rejectJob(jobId, { 
          reason: feedback || "Property marking did not meet expectations" 
        });
      }

      setConfirmDialogOpen(false);
      router.push(`/marking-jobs/${jobId}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit confirmation");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push(`/marking-jobs/${jobId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Details
        </Button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Confirm Property Marking</h1>
        <p className="text-gray-600">
          Review the marking evidence and confirm if this is your property
        </p>
      </div>

      {/* Property Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{currentJob.property?.title}</CardTitle>
          <CardDescription>
            {currentJob.property?.address}, {currentJob.property?.city}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Agent</p>
              <p className="font-medium">{currentJob.assignedAgent?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Completed At</p>
              <p className="font-medium">
                {currentJob.completedAt && format(new Date(currentJob.completedAt), "PPp")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Images */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Marking Evidence</CardTitle>
          <CardDescription>
            Photos and boundary data submitted by the agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentJob.completionImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {currentJob.completionImages.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square cursor-pointer group"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No images uploaded by agent</AlertDescription>
            </Alert>
          )}

          {currentJob.completionNotes && (
            <div className="mt-4">
              <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Agent Notes</p>
                  <p className="text-sm text-gray-700">{currentJob.completionNotes}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Confirmation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Decision</CardTitle>
          <CardDescription>
            Confirm if this marking accurately represents your property
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={decision} onValueChange={(value) => setDecision(value as ConfirmationDecision)}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="accept" id="accept" />
              <Label htmlFor="accept" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Accept Marking</p>
                    <p className="text-sm text-gray-600">
                      This marking accurately represents my property
                    </p>
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="reject" id="reject" />
              <Label htmlFor="reject" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Reject Marking</p>
                    <p className="text-sm text-gray-600">
                      This is not my property or marking is inaccurate
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div>
            <Label htmlFor="feedback">
              Feedback {decision === "reject" && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                decision === "accept"
                  ? "Optional: Add any comments about the marking quality..."
                  : "Please explain why you're rejecting this marking..."
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="mt-2"
            />
            {decision === "reject" && !feedback && (
              <p className="text-sm text-red-500 mt-1">Feedback is required when rejecting</p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/marking-jobs/${jobId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setConfirmDialogOpen(true)}
              disabled={!decision || (decision === "reject" && !feedback) || isSubmitting}
            >
              {decision === "accept" ? "Confirm & Release Payment" : "Submit Rejection"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "accept" ? "Confirm Property Marking" : "Reject Property Marking"}
            </DialogTitle>
            <DialogDescription>
              {decision === "accept" ? (
                <>
                  By confirming, you acknowledge that this marking is accurate and the full payment 
                  will be released to the agent. This action cannot be undone.
                </>
              ) : (
                <>
                  By rejecting, you indicate that this marking does not represent your property. 
                  The agent will receive partial compensation and you may need to request a new marking job.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Go Back
            </Button>
            <Button
              variant={decision === "accept" ? "default" : "destructive"}
              onClick={handleSubmitConfirmation}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : decision === "accept" ? "Confirm" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-auto rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}