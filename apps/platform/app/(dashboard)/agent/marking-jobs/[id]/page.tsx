"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { queueApi } from "@/lib/api/queue";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Separator } from "@newcondo/ui/components/separator";
import {
  MapPin,
  Phone,
  User,
  AlertCircle,
  Navigation,
  ArrowLeft,
  CheckCircle,
  ImageIcon,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { LoadingSpinner } from "@/components/shared/feedback/LoadingSpinner";
import { Progress } from "@newcondo/ui/components/progress";

interface PropertyImage {
  url: string;
}

interface JobDetails {
  status: string;
  markingFee: number;
  urgencyLevel: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  timeSlotStart?: string;
  timeSlotEnd?: string;
  maxCompletionTime?: string;
  assignedAt?: string;
  createdAt: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
    images: PropertyImage[];
  };
}

export default function AgentJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await queueApi.getJobDetails(jobId);
      setJob(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch job details";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobDetails();

    // Poll for updates
    const interval = setInterval(fetchJobDetails, 30000);
    return () => clearInterval(interval);
  }, [fetchJobDetails]);

  const handleStartJob = async () => {
    try {
      await queueApi.startJob(jobId);
      router.push(`/agent/marking-jobs/${jobId}/complete`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start job";
      setError(message);
    }
  };

  const handleNavigate = () => {
    if (job?.property) {
      const address = encodeURIComponent(
        `${job.property.address}, ${job.property.city}, ${job.property.state}`
      );
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Job not found"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/agent/marking-jobs")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  const timeSlotProgress = job.timeSlotStart && job.timeSlotEnd
    ? Math.min(
        100,
        Math.max(
          0,
          (differenceInMinutes(new Date(), new Date(job.timeSlotStart)) /
            differenceInMinutes(new Date(job.timeSlotEnd), new Date(job.timeSlotStart))) *
            100
        )
      )
    : 0;

  const timeRemaining = job.timeSlotEnd
    ? differenceInMinutes(new Date(job.timeSlotEnd), new Date())
    : null;

  const canStart = job.status === "ASSIGNED" && timeSlotProgress > 0;
  const isExpired = timeRemaining !== null && timeRemaining < 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/agent/marking-jobs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
        {canStart && (
          <Button onClick={handleStartJob} size="lg">
            <CheckCircle className="mr-2 h-4 w-4" />
            Start Marking Job
          </Button>
        )}
      </div>

      {/* Time Slot Warning */}
      {job.timeSlotEnd && !isExpired && timeRemaining && timeRemaining < 60 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Time slot expiring soon!</strong> You have {timeRemaining} minutes remaining to complete this job.
          </AlertDescription>
        </Alert>
      )}

      {isExpired && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your time slot has expired. The job will be reassigned to the next agent in queue.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{job.property.title}</CardTitle>
                <Badge className="text-lg px-4 py-2">
                  ₦{job.markingFee.toLocaleString()}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.property.address}, {job.property.city}, {job.property.state}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* fix lines 172 & 173: typed image param, replaced <img> with <Image /> */}
              {job.property.images && job.property.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {job.property.images.slice(0, 4).map((image: PropertyImage, index: number) => (
                    <div key={index} className="relative w-full h-48">
                      <Image
                        src={image.url}
                        alt={`Property ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Navigation Button */}
              <Button onClick={handleNavigate} className="w-full" size="lg">
                <Navigation className="mr-2 h-5 w-5" />
                Navigate to Property
              </Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Person to contact when you arrive at the property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{job.contactPersonName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a
                      href={`tel:${job.contactPersonPhone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {job.contactPersonPhone}
                    </a>
                  </div>
                </div>
              </div>

              {job.accessInstructions && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Access Instructions</p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm">{job.accessInstructions}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Marking Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-sm">
                  <strong>Arrive at the property</strong> and contact the person listed above
                </li>
                <li className="text-sm">
                  <strong>Verify property identity</strong> using the images provided
                </li>
                <li className="text-sm">
                  <strong>Take photos</strong> of key parts of the building (exterior, entrance, unique features)
                </li>
                <li className="text-sm">
                  <strong>Mark the property boundary</strong> on the satellite map view in the next step
                </li>
                <li className="text-sm">
                  <strong>Submit completion</strong> with photos and boundary data
                </li>
              </ol>

              <Alert className="mt-4">
                <ImageIcon className="h-4 w-4" />
                <AlertDescription>
                  Take at least 5 clear photos showing different angles of the property.
                  This helps the property owner verify the marking.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Slot Progress */}
          {job.timeSlotStart && job.timeSlotEnd && (
            <Card>
              <CardHeader>
                <CardTitle>Time Slot Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{Math.round(timeSlotProgress)}%</span>
                  </div>
                  <Progress value={timeSlotProgress} className="h-2" />
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Time:</span>
                    <span className="font-medium">
                      {format(new Date(job.timeSlotStart), "p")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Time:</span>
                    <span className="font-medium">
                      {format(new Date(job.timeSlotEnd), "p")}
                    </span>
                  </div>
                  {timeRemaining !== null && timeRemaining > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Remaining:</span>
                      <span className="font-medium text-orange-600">
                        {timeRemaining < 60
                          ? `${timeRemaining}m`
                          : `${Math.floor(timeRemaining / 60)}h ${timeRemaining % 60}m`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Status */}
          <Card>
            <CardHeader>
              <CardTitle>Job Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <Badge className="mt-1">
                  {job.status.replace("_", " ")}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-500">Urgency Level</p>
                <Badge variant="outline" className="mt-1">
                  {job.urgencyLevel}
                </Badge>
              </div>

              {job.preferredTime && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Preferred Time</p>
                    <p className="text-sm font-medium mt-1">
                      {format(new Date(job.preferredTime), "PPp")}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Total Fee</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{job.markingFee.toLocaleString()}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-500">Your Earnings (25%)</p>
                <p className="text-xl font-semibold">
                  ₦{(job.markingFee * 0.25).toLocaleString()}
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Payment will be released after property owner confirms the marking
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Job Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium text-sm">Job Created</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(job.createdAt), "PPp")}
                  </p>
                </div>
              </div>

              {job.assignedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="font-medium text-sm">Assigned to You</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(job.assignedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}

              {job.maxCompletionTime && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                  <div>
                    <p className="font-medium text-sm">Deadline</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(job.maxCompletionTime), "PPp")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}