// apps/admin/src/components/admin/MarkingJobDetails.tsx
"use client";

import { useState } from "react";
import { 
  MapPin, 
  User, 
  Phone, 
  Clock, 
  DollarSign, 
  Calendar,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Button } from "@newcondo/ui/button";
import { Badge } from "@newcondo/ui/badge";
import { Separator } from "@newcondo/ui/separator";
import { Alert, AlertDescription } from "@newcondo/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@newcondo/ui/dialog";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import type { MarkingJobDetail } from "@/types/admin";

interface MarkingJobDetailsProps {
  job: MarkingJobDetail;
  onReassign: () => void;
  onCancel: () => void;
}

export default function MarkingJobDetails({ 
  job, 
  onReassign, 
  onCancel 
}: MarkingJobDetailsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isActive = job.status === "ASSIGNED" || job.status === "IN_PROGRESS";
  const isCompleted = job.status === "COMPLETED";

  return (
    <div className="space-y-6">
      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
          <CardDescription>Details about the property to be marked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Property Title</p>
              <p className="text-lg font-semibold">{job.property.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Property Type</p>
              <p className="text-lg">{job.property.propertyType}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="text-sm">{job.property.address}</p>
            <p className="text-sm text-muted-foreground">
              {job.property.city}, {job.property.state}
            </p>
          </div>

          {job.property.gpsCoordinates && (
            <div className="space-y-2">
              <p className="text-sm font-medium">GPS Coordinates</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {job.property.gpsCoordinates}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Property access and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Contact Person</span>
              </div>
              <p className="text-lg">{job.contactPersonName}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone Number</span>
              </div>
              <p className="text-lg">{job.contactPersonPhone}</p>
            </div>
          </div>

          {job.accessInstructions && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Access Instructions</p>
                <p className="text-sm text-muted-foreground">
                  {job.accessInstructions}
                </p>
              </div>
            </>
          )}

          {job.preferredTime && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Preferred Time</span>
              </div>
              <p className="text-sm">{formatDate(job.preferredTime)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Marking job information and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Marking Fee</span>
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(job.markingFee)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Payment Status</p>
              <Badge variant={job.paymentStatus === "SUCCESS" ? "default" : "secondary"}>
                {job.paymentStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Urgency Level</p>
              <Badge variant={
                job.urgencyLevel === "URGENT" ? "destructive" : 
                job.urgencyLevel === "HIGH" ? "default" : "secondary"
              }>
                {job.urgencyLevel}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Requested By</p>
              <p className="text-sm">{job.requestingUser.name}</p>
              <p className="text-xs text-muted-foreground">{job.requestingUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Requested On</p>
              <p className="text-sm">{formatDate(job.createdAt)}</p>
            </div>
          </div>

          {job.assignedAgent && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned Agent</p>
                  <p className="text-sm">{job.assignedAgent.name}</p>
                  <p className="text-xs text-muted-foreground">{job.assignedAgent.email}</p>
                </div>
                {job.assignedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned On</p>
                    <p className="text-sm">{formatDate(job.assignedAt)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {isActive && job.timeSlotExpiry && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Time slot expires on {formatDate(job.timeSlotExpiry)}
              </AlertDescription>
            </Alert>
          )}

          {job.maxCompletionTime && (
            <Alert variant={new Date(job.maxCompletionTime) < new Date() ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Maximum completion deadline: {formatDate(job.maxCompletionTime)}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Completion Details (if completed) */}
      {isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Completion Details
            </CardTitle>
            <CardDescription>Property marking completion information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.completedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed On</p>
                <p className="text-sm">{formatDate(job.completedAt)}</p>
              </div>
            )}

            {job.completionNotes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Completion Notes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.completionNotes}
                  </p>
                </div>
              </>
            )}

            {job.completionImages && job.completionImages.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Completion Photos</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {job.completionImages.map((image, index) => (
                      <Dialog key={index}>
                        <DialogTrigger asChild>
                          <div 
                            className="relative aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(image)}
                          >
                            <img
                              src={image}
                              alt={`Completion photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Completion Photo {index + 1}</DialogTitle>
                          </DialogHeader>
                          <img
                            src={image}
                            alt={`Completion photo ${index + 1}`}
                            className="w-full h-auto rounded-md"
                          />
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
              </>
            )}

            {job.boundaryData && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Boundary Data</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                    {JSON.stringify(job.boundaryData, null, 2)}
                  </code>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Queue Information */}
      {job.queuePosition && (
        <Card>
          <CardHeader>
            <CardTitle>Queue Information</CardTitle>
            <CardDescription>Current position in marking queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-primary">
                #{job.queuePosition}
              </div>
              <div>
                <p className="text-sm font-medium">Position in Queue</p>
                <p className="text-xs text-muted-foreground">
                  Waiting for agent assignment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}