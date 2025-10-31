"use client";

import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Separator } from "@newcondo/ui/components/separator";
import {
  MapPin,
  User,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface MarkingJobDetailsProps {
  job: {
    id: string;
    propertyId: string;
    property: {
      title: string;
      address: string;
      city: string;
      state: string;
      gpsCoordinates?: string;
    };
    requestedBy: string;
    requester: {
      name: string;
      email: string;
      phone?: string;
    };
    assignedAgentId?: string;
    assignedAgent?: {
      name: string;
      email: string;
      phone?: string;
    };
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions?: string;
    preferredTime?: string;
    urgencyLevel: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    markingFee: number;
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "HELD" | "RELEASED";
    status: "QUEUED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED";
    queuePosition?: number;
    assignedAt?: string;
    completedAt?: string;
    timeSlotExpiry?: string;
    maxCompletionTime?: string;
    completionNotes?: string;
    createdAt: string;
    updatedAt: string;
  };
  onReassign?: () => void;
  onCancel?: () => void;
}

const statusConfig = {
  QUEUED: {
    icon: Clock,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Queued"
  },
  ASSIGNED: {
    icon: User,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Assigned"
  },
  IN_PROGRESS: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "In Progress"
  },
  COMPLETED: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Completed"
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Cancelled"
  },
  EXPIRED: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Expired"
  }
};

const urgencyConfig = {
  LOW: { color: "bg-gray-100 text-gray-600", label: "Low Priority" },
  NORMAL: { color: "bg-blue-100 text-blue-600", label: "Normal Priority" },
  HIGH: { color: "bg-orange-100 text-orange-600", label: "High Priority" },
  URGENT: { color: "bg-red-100 text-red-600", label: "Urgent" },
};

export default function MarkingJobDetails({ job, onReassign, onCancel }: MarkingJobDetailsProps) {
  const statusInfo = statusConfig[job.status];
  const StatusIcon = statusInfo.icon;
  const urgencyInfo = urgencyConfig[job.urgencyLevel];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Marking Job Details</CardTitle>
              <p className="text-sm text-gray-500 mt-1">ID: {job.id}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={`${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-2`}>
                <StatusIcon className="h-4 w-4" />
                {statusInfo.label}
              </Badge>
              <Badge className={urgencyInfo.color}>
                {urgencyInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(job.createdAt), "PPP 'at' p")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {job.maxCompletionTime && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Max Completion Time</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(job.maxCompletionTime), "PPP 'at' p")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(job.maxCompletionTime), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Marking Fee</p>
                <p className="text-lg font-bold text-gray-900">
                  ₦{job.markingFee.toLocaleString()}
                </p>
                <Badge className="mt-1" variant="outline">
                  {job.paymentStatus}
                </Badge>
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
            <h3 className="font-semibold text-lg">{job.property.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {job.property.address}, {job.property.city}, {job.property.state}
            </p>
          </div>

          {job.property.gpsCoordinates && (
            <div>
              <p className="text-sm font-medium mb-2">GPS Coordinates</p>
              <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {job.property.gpsCoordinates}
              </p>
            </div>
          )}

          <Button variant="outline" size="sm" asChild>
            <a href={`/dashboard/properties/${job.propertyId}`} target="_blank">
              View Property Details
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Requester & Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requester */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Requester Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-gray-600">{job.requester.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-gray-600">{job.requester.email}</p>
            </div>
            {job.requester.phone && (
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-gray-600">{job.requester.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              On-Site Contact Person
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-gray-600">{job.contactPersonName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-gray-600">{job.contactPersonPhone}</p>
            </div>
            {job.accessInstructions && (
              <div>
                <p className="text-sm font-medium">Access Instructions</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {job.accessInstructions}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assigned Agent */}
      {job.assignedAgent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigned Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-gray-600">{job.assignedAgent.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">{job.assignedAgent.email}</p>
              </div>
              {job.assignedAgent.phone && (
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-gray-600">{job.assignedAgent.phone}</p>
                </div>
              )}
            </div>

            {job.assignedAt && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Assigned {formatDistanceToNow(new Date(job.assignedAt), { addSuffix: true })}
                </p>
              </div>
            )}

            {job.timeSlotExpiry && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time slot expires {formatDistanceToNow(new Date(job.timeSlotExpiry), { addSuffix: true })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Queue Position */}
      {job.status === "QUEUED" && job.queuePosition && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Queue Position</p>
              <p className="text-4xl font-bold text-blue-600">#{job.queuePosition}</p>
              <p className="text-sm text-gray-500 mt-2">Waiting for agent assignment</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Notes */}
      {job.completionNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Completion Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.completionNotes}</p>
            {job.completedAt && (
              <p className="text-sm text-gray-500 mt-4">
                Completed {format(new Date(job.completedAt), "PPP 'at' p")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {(job.status === "ASSIGNED" || job.status === "IN_PROGRESS") && (
        <div className="flex gap-3">
          {onReassign && (
            <Button variant="outline" onClick={onReassign}>
              Reassign Job
            </Button>
          )}
          {onCancel && (
            <Button variant="destructive" onClick={onCancel}>
              Cancel Job
            </Button>
          )}
        </div>
      )}
    </div>
  );
}