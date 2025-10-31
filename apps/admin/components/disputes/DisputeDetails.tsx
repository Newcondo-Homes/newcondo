"use client";

import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Separator } from "@newcondo/ui/components/separator";
import { 
  MapPin, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface DisputeDetailsProps {
  dispute: {
    id: string;
    originalPropertyId: string;
    duplicatePropertyId: string;
    status: "PENDING" | "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "RESOLVED";
    reportedBy?: string;
    reporterName?: string;
    reporterEmail?: string;
    reporterPhone?: string;
    resolution?: string;
    resolvedBy?: string;
    resolvedByName?: string;
    resolvedAt?: string;
    originalProperty: {
      title: string;
      address: string;
      city: string;
      state: string;
      ownerName: string;
      ownerEmail: string;
      gpsCoordinates?: string;
      images: string[];
    };
    duplicateProperty: {
      title: string;
      address: string;
      city: string;
      state: string;
      ownerName: string;
      ownerEmail: string;
      gpsCoordinates?: string;
      images: string[];
    };
    createdAt: string;
    updatedAt: string;
  };
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Pending Review"
  },
  CONFIRMED_DUPLICATE: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Confirmed Duplicate"
  },
  NOT_DUPLICATE: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Not Duplicate"
  },
  RESOLVED: {
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Resolved"
  }
};

export default function DisputeDetails({ dispute }: DisputeDetailsProps) {
  const statusInfo = statusConfig[dispute.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Boundary Dispute Details</CardTitle>
              <p className="text-sm text-gray-500 mt-1">ID: {dispute.id}</p>
            </div>
            <Badge className={`${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-2`}>
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Reported On</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(dispute.createdAt), "PPP 'at' p")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Reported By</p>
                <p className="text-sm text-gray-600">
                  {dispute.reporterName || "System Detection"}
                </p>
                {dispute.reporterEmail && (
                  <p className="text-xs text-gray-500">{dispute.reporterEmail}</p>
                )}
              </div>
            </div>
            {dispute.resolvedAt && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Resolved On</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(dispute.resolvedAt), "PPP 'at' p")}
                  </p>
                  {dispute.resolvedByName && (
                    <p className="text-xs text-gray-500">By {dispute.resolvedByName}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Properties Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Original Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{dispute.originalProperty.title}</h3>
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">
                  {dispute.originalProperty.address}, {dispute.originalProperty.city}, {dispute.originalProperty.state}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Owner Information</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{dispute.originalProperty.ownerName}</p>
                <p className="text-sm text-gray-500">{dispute.originalProperty.ownerEmail}</p>
              </div>
            </div>

            {dispute.originalProperty.gpsCoordinates && (
              <div>
                <p className="text-sm font-medium mb-2">GPS Coordinates</p>
                <p className="text-xs text-gray-600 font-mono">
                  {dispute.originalProperty.gpsCoordinates}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Property ID</p>
              <p className="text-xs text-gray-600 font-mono">{dispute.originalPropertyId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Disputed Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{dispute.duplicateProperty.title}</h3>
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">
                  {dispute.duplicateProperty.address}, {dispute.duplicateProperty.city}, {dispute.duplicateProperty.state}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Owner Information</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{dispute.duplicateProperty.ownerName}</p>
                <p className="text-sm text-gray-500">{dispute.duplicateProperty.ownerEmail}</p>
              </div>
            </div>

            {dispute.duplicateProperty.gpsCoordinates && (
              <div>
                <p className="text-sm font-medium mb-2">GPS Coordinates</p>
                <p className="text-xs text-gray-600 font-mono">
                  {dispute.duplicateProperty.gpsCoordinates}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Property ID</p>
              <p className="text-xs text-gray-600 font-mono">{dispute.duplicatePropertyId}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Details */}
      {dispute.resolution && (
        <Card>
          <CardHeader>
            <CardTitle>Resolution Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{dispute.resolution}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}