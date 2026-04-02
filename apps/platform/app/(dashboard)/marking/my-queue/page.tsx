"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Skeleton } from "@newcondo/ui/components/skeleton";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Clock, MapPin, User, Phone, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";

interface QueueJob {
  id: string;
  propertyId: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
  };
  queuePosition: number;
  timeSlotExpiry: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  markingFee: number;
  status: string;
  assignedAt: string;
}

export default function MyQueuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueueJobs();
    const interval = setInterval(fetchQueueJobs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueueJobs = async () => {
    try {
      const response = await fetch("/api/marking/my-queue", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch queue jobs");

      const data = await response.json();
      setQueueJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStartMarking = (jobId: string) => {
    router.push(`/marking/${jobId}/details`);
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to cancel this job? You will lose your queue position.")) {
      return;
    }

    try {
      const response = await fetch(`/api/marking/jobs/${jobId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to cancel job");

      await fetchQueueJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel job");
    }
  };

  const getTimeRemaining = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  const getStatusBadge = (status: string, expiry: string) => {
    const isExpired = new Date(expiry) < new Date();

    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    switch (status) {
      case "ASSIGNED":
        return <Badge variant="default">Active</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Queue</h1>
        <p className="text-muted-foreground">
          Track your active marking jobs and queue positions
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {queueJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Jobs</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any jobs in your queue. Check available jobs to get started.
            </p>
            <Button onClick={() => router.push("/marking/available-jobs")}>
              Browse Available Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queueJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{job.property.title}</CardTitle>
                      {getStatusBadge(job.status, job.timeSlotExpiry)}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {job.property.address}, {job.property.city}, {job.property.state}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ₦{job.markingFee.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Marking Fee</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Contact:</span>
                      <span>{job.contactPersonName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{job.contactPersonPhone}</span>
                    </div>
                    {job.accessInstructions && (
                      <div className="text-sm">
                        <span className="font-medium">Instructions:</span>
                        <p className="text-muted-foreground mt-1">{job.accessInstructions}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Time Remaining:</span>
                      <span className="text-orange-600 font-semibold">
                        {getTimeRemaining(job.timeSlotExpiry)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Queue Position:</span>
                      <Badge variant="outline" className="ml-2">
                        #{job.queuePosition}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Assigned {formatDistanceToNow(new Date(job.assignedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {new Date(job.timeSlotExpiry) < new Date() ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your time slot has expired. This job will be reassigned to the next agent in queue.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex gap-2 pt-2">
                    {job.status === "ASSIGNED" && (
                      <>
                        <Button
                          onClick={() => handleStartMarking(job.id)}
                          className="flex-1"
                        >
                          Start Marking
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCancelJob(job.id)}
                          className="flex-1"
                        >
                          Cancel Job
                        </Button>
                      </>
                    )}
                    {job.status === "IN_PROGRESS" && (
                      <Button
                        onClick={() => handleStartMarking(job.id)}
                        variant="secondary"
                        className="flex-1"
                      >
                        Continue Marking
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}