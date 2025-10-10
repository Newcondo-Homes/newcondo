"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Clock,
  User,
  Phone,
  Image as ImageIcon,
  Map,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface MarkingJobDetails {
  id: string;
  propertyId: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
  assignedAgent: {
    id: string;
    name: string;
    phone: string;
    reliabilityScore: number;
    totalMarkingJobs: number;
    completedMarkingJobs: number;
  };
  status: string;
  completionNotes: string;
  completionImages: string[];
  boundaryData: {
    coordinates: Array<{ lat: number; lng: number }>;
    area: number;
  };
  completedAt: string;
  confirmationDeadline: string;
  markingFee: number;
}

export default function VerifyMarkingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const propertyId = params.id as string;

  const [job, setJob] = useState<MarkingJobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchMarkingJob();
  }, [propertyId]);

  const fetchMarkingJob = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/marking/properties/${propertyId}/verification`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch marking job");
      }

      const data = await response.json();
      setJob(data.job);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load marking job details",
        variant: "destructive",
      });
      router.push(`/properties/my-listings`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMarking = async () => {
    if (!job) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/marking/jobs/${job.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to confirm marking");
      }

      toast({
        title: "Success",
        description: "Property marking confirmed successfully",
      });

      router.push(`/properties/my-listings/${propertyId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm marking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectMarking = async () => {
    if (!job || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/marking/jobs/${job.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject marking");
      }

      toast({
        title: "Marking Rejected",
        description: "The agent has been notified. A new marking job will be created.",
      });

      router.push(`/properties/my-listings/${propertyId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject marking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h remaining`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No marking job found for this property</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isExpired =
    new Date(job.confirmationDeadline).getTime() < new Date().getTime();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Verify Property Marking</h1>
            <p className="text-muted-foreground">
              Review and confirm the property boundary marking
            </p>
          </div>
          <Badge
            variant={isExpired ? "destructive" : "default"}
            className="text-sm"
          >
            <Clock className="mr-1 h-3 w-3" />
            {getTimeRemaining(job.confirmationDeadline)}
          </Badge>
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpired && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The confirmation deadline has passed. The agent has received partial
            payment. You'll need to create a new marking job if you want to remark
            this property.
          </AlertDescription>
        </Alert>
      )}

      {/* Property Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Property Title</p>
              <p className="font-medium">{job.property.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <p className="font-medium">
                {job.property.address}, {job.property.city}, {job.property.state}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agent Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Agent Name</p>
              <p className="font-medium">{job.assignedAgent.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Contact</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{job.assignedAgent.phone}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Reliability Score</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <span className="font-bold text-lg mr-1">
                    {job.assignedAgent.reliabilityScore.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">/5.0</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({job.assignedAgent.completedMarkingJobs}/
                  {job.assignedAgent.totalMarkingJobs} jobs)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marking Details */}
      <Tabs defaultValue="images" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images">
            <ImageIcon className="mr-2 h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="boundary">
            <Map className="mr-2 h-4 w-4" />
            Boundary
          </TabsTrigger>
          <TabsTrigger value="notes">
            <AlertCircle className="mr-2 h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
              <p className="text-sm text-muted-foreground">
                Images captured by the agent during marking
              </p>
            </CardHeader>
            <CardContent>
              {job.completionImages.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No images uploaded by the agent</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {job.completionImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                    >
                      <Image
                        src={image}
                        alt={`Property image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boundary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Boundary</CardTitle>
              <p className="text-sm text-muted-foreground">
                Marked boundary coordinates and area
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Boundary Points
                    </p>
                    <p className="font-medium">
                      {job.boundaryData.coordinates.length} points
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Estimated Area
                    </p>
                    <p className="font-medium">
                      {job.boundaryData.area.toFixed(2)} sqm
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Map placeholder - integrate with Google Maps */}
                <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Map className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Map view showing marked boundary
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Notes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Additional information from the agent
              </p>
            </CardHeader>
            <CardContent>
              {job.completionNotes ? (
                <p className="text-sm whitespace-pre-wrap">{job.completionNotes}</p>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No notes provided by the agent</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {!isExpired && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Marking</CardTitle>
            <p className="text-sm text-muted-foreground">
              Confirm if the marking is accurate or request a remark
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleConfirmMarking}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Confirm Marking
              </Button>

              <Button
                onClick={() => {
                  // Show rejection form
                }}
                disabled={isSubmitting}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Marking
              </Button>
            </div>

            {/* Rejection Form */}
            <div className="space-y-4">
              <Separator />
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Rejection Reason (Required)
                </label>
                <Textarea
                  placeholder="Explain why you're rejecting this marking..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={handleRejectMarking}
                disabled={isSubmitting || !rejectionReason.trim()}
                variant="destructive"
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Submit Rejection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Property image"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}