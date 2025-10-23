// apps/platform/components/marking/MarkingJobDetails.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Badge } from "@newcondo/ui/badge";
import { Separator } from "@newcondo/ui/separator";
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Calendar, 
  AlertCircle,
  DollarSign,
  FileText,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface MarkingJobDetailsProps {
  job: {
    id: string;
    status: string;
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions?: string;
    preferredTime?: string;
    urgencyLevel: string;
    markingFee: number;
    paymentStatus: string;
    assignedAt?: string;
    completedAt?: string;
    timeSlotExpiry?: string;
    queuePosition?: number;
    maxCompletionTime?: string;
    completionNotes?: string;
    createdAt: string;
    property: {
      title: string;
      address: string;
      city: string;
      state: string;
      gpsCoordinates?: string;
    };
    assignedAgent?: {
      name: string;
      phone: string;
      email: string;
    };
    requestingUser: {
      name: string;
      phone: string;
      email: string;
    };
  };
}

export function MarkingJobDetails({ job }: MarkingJobDetailsProps) {
  const statusColors = {
    QUEUED: "bg-blue-500",
    ASSIGNED: "bg-yellow-500",
    IN_PROGRESS: "bg-orange-500",
    COMPLETED: "bg-green-500",
    CANCELLED: "bg-gray-500",
    EXPIRED: "bg-red-500",
  };

  const paymentStatusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    SUCCESS: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    HELD: "bg-blue-100 text-blue-800",
    RELEASED: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Job Status</CardTitle>
            <Badge className={`${statusColors[job.status as keyof typeof statusColors]} text-white`}>
              {job.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marking Fee</p>
                <p className="text-lg font-semibold">₦{job.markingFee.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(job.createdAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgency</p>
                <p className="text-sm font-medium">{job.urgencyLevel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Property Title</p>
            <p className="font-semibold">{job.property.title}</p>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-1">Address</p>
            <p className="font-medium">
              {job.property.address}, {job.property.city}, {job.property.state}
            </p>
          </div>

          {job.property.gpsCoordinates && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">GPS Coordinates</p>
                <p className="font-mono text-sm">{job.property.gpsCoordinates}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Property Owner</p>
            <div className="space-y-1">
              <p className="font-medium">{job.requestingUser.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{job.requestingUser.phone}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Contact Person (On-Site)</p>
            <div className="space-y-1">
              <p className="font-medium">{job.contactPersonName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{job.contactPersonPhone}</span>
              </div>
            </div>
          </div>

          {job.assignedAgent && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Assigned Agent</p>
                <div className="space-y-1">
                  <p className="font-medium">{job.assignedAgent.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{job.assignedAgent.phone}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Access Instructions */}
      {job.accessInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Access Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{job.accessInstructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Job Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-green-100 rounded-full mt-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Job Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(job.createdAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            </div>

            {job.assignedAt && (
              <div className="flex items-start gap-3">
                <div className="p-1 bg-yellow-100 rounded-full mt-1">
                  <User className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Agent Assigned</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(job.assignedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            )}

            {job.completedAt && (
              <div className="flex items-start gap-3">
                <div className="p-1 bg-green-100 rounded-full mt-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Job Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(job.completedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            )}

            {job.timeSlotExpiry && job.status === "ASSIGNED" && (
              <div className="flex items-start gap-3">
                <div className="p-1 bg-orange-100 rounded-full mt-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Time Slot Expires</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(job.timeSlotExpiry), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completion Notes */}
      {job.completionNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{job.completionNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payment Status</span>
            <Badge variant="outline" className={paymentStatusColors[job.paymentStatus as keyof typeof paymentStatusColors]}>
              {job.paymentStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}