// apps/admin/src/components/marking/MarkingJobDetails.tsx

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, MapPin, Phone, Clock, DollarSign, User } from "lucide-react";

interface MarkingJobDetailsProps {
  jobId: string;
  job: {
    id: string;
    propertyId: string;
    propertyTitle: string;
    requestedBy: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
    assignedAgent?: {
      id: string;
      name: string;
      email: string;
      phone: string;
      completedJobs: number;
      reliabilityScore: number;
    };
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions?: string;
    preferredTime?: string;
    urgencyLevel: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    markingFee: number;
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
    status:
      | "QUEUED"
      | "ASSIGNED"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED"
      | "EXPIRED";
    queuePosition?: number;
    assignedAt?: string;
    completedAt?: string;
    timeSlotExpiry?: string;
    completionNotes?: string;
    completionImages?: string[];
    boundaryData?: {
      coordinates: Array<[number, number]>;
      area: number;
    };
    createdAt: string;
    updatedAt: string;
  };
  onStatusChange?: (newStatus: string) => void;
  onAssignAgent?: () => void;
  onReassign?: () => void;
}

export function MarkingJobDetails({
  job,
  onStatusChange,
  onAssignAgent,
  onReassign,
}: MarkingJobDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      QUEUED: "bg-blue-100 text-blue-800",
      ASSIGNED: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getUrgencyColor = (level: string) => {
    const colors: { [key: string]: string } = {
      LOW: "bg-green-100 text-green-800",
      NORMAL: "bg-blue-100 text-blue-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      SUCCESS: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const timeRemaining = job.timeSlotExpiry
    ? new Date(job.timeSlotExpiry).getTime() - new Date().getTime()
    : null;
  const hoursRemaining = timeRemaining ? Math.floor(timeRemaining / 3600000) : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{job.propertyTitle}</CardTitle>
              <CardDescription>
                Marking Job #{job.id.slice(0, 8)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(job.status)}>
                {job.status}
              </Badge>
              <Badge className={getUrgencyColor(job.urgencyLevel)}>
                {job.urgencyLevel}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Job ID</p>
                  <p className="font-mono text-sm">{job.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Created Date
                  </p>
                  <p className="text-sm">
                    {new Date(job.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-500">
                    Urgency Level
                  </p>
                </div>
                <p className="text-sm">{job.urgencyLevel}</p>
              </div>

              {job.queuePosition && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Queue Position
                  </p>
                  <p className="text-sm">#{job.queuePosition}</p>
                </div>
              )}

              {job.timeSlotExpiry && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-medium text-gray-500">
                      Time Slot Expiry
                    </p>
                  </div>
                  <p className="text-sm">
                    {new Date(job.timeSlotExpiry).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {hoursRemaining > 0 && (
                    <p className="text-xs text-orange-600">
                      {hoursRemaining} hours remaining
                    </p>
                  )}
                </div>
              )}

              {job.preferredTime && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Preferred Time
                  </p>
                  <p className="text-sm">{job.preferredTime}</p>
                </div>
              )}

              {job.accessInstructions && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Access Instructions
                  </p>
                  <p className="text-sm text-gray-700">
                    {job.accessInstructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parties Tab */}
        <TabsContent value="parties">
          <div className="space-y-4">
            {/* Property Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">{job.requestedBy.name}</p>
                    <p className="text-sm text-gray-500">{job.requestedBy.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a
                    href={`tel:${job.requestedBy.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {job.requestedBy.phone}
                  </a>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{job.requestedBy.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Person */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Person</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <p className="font-medium">{job.contactPersonName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a
                    href={`tel:${job.contactPersonPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {job.contactPersonPhone}
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Agent */}
            {job.assignedAgent && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg">Assigned Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">{job.assignedAgent.name}</p>
                      <p className="text-sm text-gray-500">
                        {job.assignedAgent.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a
                      href={`tel:${job.assignedAgent.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {job.assignedAgent.phone}
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500">
                        Completed Jobs
                      </p>
                      <p className="text-lg font-semibold">
                        {job.assignedAgent.completedJobs}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500">
                        Reliability Score
                      </p>
                      <p className="text-lg font-semibold">
                        {job.assignedAgent.reliabilityScore.toFixed(2)}/5
                      </p>
                    </div>
                  </div>
                  {onReassign && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReassign}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      Reassign
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {!job.assignedAgent && job.status === "QUEUED" && onAssignAgent && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-900">
                    No Agent Assigned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={onAssignAgent}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    Assign Agent
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Marking Fee
                    </p>
                    <p className="text-2xl font-bold">
                      ₦{job.markingFee.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
                <Badge className={getPaymentStatusColor(job.paymentStatus)}>
                  {job.paymentStatus}
                </Badge>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-sm">Payment Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Commission (25%)</span>
                    <span className="font-medium">
                      ₦{(job.markingFee * 0.25).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee (75%)</span>
                    <span className="font-medium">
                      ₦{(job.markingFee * 0.75).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>
                      ₦{job.markingFee.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completion Tab */}
        <TabsContent value="completion">
          {job.status === "COMPLETED" || job.completionNotes ? (
            <div className="space-y-4">
              {job.completionNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Completion Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">
                      {job.completionNotes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {job.completionImages && job.completionImages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Completion Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {job.completionImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                        >
                          <img
                            src={image}
                            alt={`Completion photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {job.boundaryData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Boundary Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Area Marked
                      </p>
                      <p className="text-lg font-semibold">
                        {job.boundaryData.area.toFixed(2)} sq meters
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Coordinates
                      </p>
                      <div className="bg-gray-50 p-3 rounded text-xs font-mono space-y-1">
                        {job.boundaryData.coordinates.map((coord, idx) => (
                          <div key={idx}>
                            {coord[0].toFixed(6)}, {coord[1].toFixed(6)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {job.completedAt && (
                <Card>
                  <CardHeader>
                    <CardTitle>Completion Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created</span>
                      <span>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned</span>
                      <span>
                        {job.assignedAt
                          ? new Date(job.assignedAt).toLocaleDateString()
                          : "Not assigned"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed</span>
                      <span>{new Date(job.completedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center">
                  No completion data available. Job is still in progress.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}