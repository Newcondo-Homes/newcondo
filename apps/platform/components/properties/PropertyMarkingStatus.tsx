"use client";

import { useState } from "react";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@newcondo/ui/components/dialog";
import { CheckCircle2, Clock, XCircle, AlertCircle, MapPin, User, Phone, Calendar, ImageIcon } from "lucide-react";
import { format } from "date-fns";

type MarkingJobStatus = "QUEUED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED";
type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED" | "HELD" | "RELEASED";

interface PropertyMarkingStatusProps {
  markingJob?: {
    id: string;
    status: MarkingJobStatus;
    paymentStatus: PaymentStatus;
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions?: string;
    preferredTime?: string;
    assignedAgent?: {
      id: string;
      name: string;
      phone: string;
      reliabilityScore?: number;
    };
    assignedAt?: string;
    completedAt?: string;
    timeSlotExpiry?: string;
    completionImages?: string[];
    completionNotes?: string;
    queuePosition?: number;
    markingFee: number;
  };
  propertyId: string | undefined;
  onConfirmMarking?: () => void;
  onRejectMarking?: () => void;
  onCancelJob?: () => void;
}

export function PropertyMarkingStatus({
  markingJob,
  propertyId,
  onConfirmMarking,
  onRejectMarking,
  onCancelJob,
}: PropertyMarkingStatusProps) {
  const [showImagesDialog, setShowImagesDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!markingJob) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            Property Marking Status
          </CardTitle>
          <CardDescription>No marking job initiated for this property</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusBadge = (status: MarkingJobStatus) => {
    const statusConfig = {
      QUEUED: { variant: "secondary" as const, icon: Clock, label: "In Queue" },
      ASSIGNED: { variant: "default" as const, icon: User, label: "Agent Assigned" },
      IN_PROGRESS: { variant: "default" as const, icon: Clock, label: "In Progress" },
      COMPLETED: { variant: "default" as const, icon: CheckCircle2, label: "Completed" },
      CANCELLED: { variant: "destructive" as const, icon: XCircle, label: "Cancelled" },
      EXPIRED: { variant: "destructive" as const, icon: AlertCircle, label: "Expired" },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, label: "Payment Pending" },
      SUCCESS: { variant: "default" as const, label: "Paid" },
      FAILED: { variant: "destructive" as const, label: "Payment Failed" },
      CANCELLED: { variant: "destructive" as const, label: "Payment Cancelled" },
      REFUNDED: { variant: "secondary" as const, label: "Refunded" },
      HELD: { variant: "secondary" as const, label: "Payment Held" },
      RELEASED: { variant: "default" as const, label: "Payment Released" },
    };

    const config = statusConfig[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const timeRemaining = markingJob.timeSlotExpiry
    ? new Date(markingJob.timeSlotExpiry).getTime() - Date.now()
    : null;

  const isTimeSlotActive = timeRemaining && timeRemaining > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Marking Status
              </CardTitle>
              <CardDescription>Job ID: {markingJob.id}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(markingJob.status)}
              {getPaymentStatusBadge(markingJob.paymentStatus)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Queue Position */}
          {markingJob.status === "QUEUED" && markingJob.queuePosition && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Queue Position</p>
                  <p className="text-2xl font-bold text-primary">#{markingJob.queuePosition}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Waiting for an agent to accept this job
              </p>
            </div>
          )}

          {/* Contact Person Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Contact Person</h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{markingJob.contactPersonName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <span>{markingJob.contactPersonPhone}</span>
              </div>
              {markingJob.preferredTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Preferred Time:</span>
                  <span>{format(new Date(markingJob.preferredTime), "PPp")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Access Instructions */}
          {markingJob.accessInstructions && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Access Instructions</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {markingJob.accessInstructions}
              </p>
            </div>
          )}

          {/* Assigned Agent Details */}
          {markingJob.assignedAgent && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold text-sm">Assigned Agent</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{markingJob.assignedAgent.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{markingJob.assignedAgent.phone}</span>
                </div>
                {markingJob.assignedAgent.reliabilityScore && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Rating:</span>
                    <span>{markingJob.assignedAgent.reliabilityScore.toFixed(1)}/5.0</span>
                  </div>
                )}
              </div>
              {markingJob.assignedAt && (
                <p className="text-xs text-muted-foreground">
                  Assigned on {format(new Date(markingJob.assignedAt), "PPp")}
                </p>
              )}
            </div>
          )}

          {/* Time Slot Expiry Warning */}
          {isTimeSlotActive && markingJob.status === "IN_PROGRESS" && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Time Slot Active</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Agent has until {format(new Date(markingJob.timeSlotExpiry!), "p")} to complete
                    the marking
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Completion Details */}
          {markingJob.status === "COMPLETED" && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Completion Details</h4>
                {markingJob.completedAt && (
                  <Badge variant="outline">
                    {format(new Date(markingJob.completedAt), "PPp")}
                  </Badge>
                )}
              </div>

              {markingJob.completionNotes && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Agent Notes</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {markingJob.completionNotes}
                  </p>
                </div>
              )}

              {markingJob.completionImages && markingJob.completionImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Property Images</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImagesDialog(true)}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      View All ({markingJob.completionImages.length})
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {markingJob.completionImages.slice(0, 3).map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedImage(image);
                          setShowImagesDialog(true);
                        }}
                      >
                        <img
                          src={image}
                          alt={`Completion image ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmation Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={onConfirmMarking} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Marking
                </Button>
                <Button onClick={onRejectMarking} variant="outline" className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject & Request Remark
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Please verify the property images and marking accuracy
              </p>
            </div>
          )}

          {/* Payment Information */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Marking Fee</span>
              <span className="text-lg font-bold">₦{markingJob.markingFee.toLocaleString()}</span>
            </div>
          </div>

          {/* Cancel Job Button */}
          {(markingJob.status === "QUEUED" || markingJob.status === "ASSIGNED") && (
            <Button variant="destructive" onClick={onCancelJob} className="w-full">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Marking Job
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Images Dialog */}
      <Dialog open={showImagesDialog} onOpenChange={setShowImagesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Property Marking Images</DialogTitle>
            <DialogDescription>
              Images captured by the agent during property marking
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {markingJob.completionImages?.map((image, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image}
                  alt={`Property image ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
          {selectedImage && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300"
              >
                <XCircle className="h-8 w-8" />
              </button>
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}