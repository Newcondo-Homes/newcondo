"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/components/table";
import { Skeleton } from "@newcondo/ui/components/skeleton";
// import { toast } from '@newcondo/ui'

interface MarkingJob {
  id: string;
  propertyId: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
  };
  status: "QUEUED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  markingFee: number;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "HELD" | "RELEASED";
  contactPersonName: string;
  contactPersonPhone: string;
  assignedAgent?: {
    id: string;
    name: string;
  };
  queuePosition?: number;
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string;
}

interface MarkingHistoryListProps {
  userId: string;
  role: "requester" | "agent";
}

export default function MarkingHistoryList({
  userId,
  role,
}: MarkingHistoryListProps) {
  const [_selectedJob, setSelectedJob] = useState<string | null>(null);

  const { data: jobs, isLoading } = useQuery<MarkingJob[]>({
    queryKey: ["marking-jobs", userId, role],
    queryFn: async () => {
      const endpoint =
        role === "requester"
          ? `/api/marking-jobs/requested`
          : `/api/marking-jobs/assigned`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch marking jobs");
      return response.json();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "CANCELLED":
      case "EXPIRED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "QUEUED":
      case "ASSIGNED":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "QUEUED":
        return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "RELEASED":
        return "bg-green-100 text-green-800";
      case "HELD":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {role === "requester" ? "Your Marking Requests" : "Assigned Marking Jobs"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-sm">
              {role === "requester"
                ? "You haven't requested any property marking jobs yet."
                : "You don't have any assigned marking jobs yet."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {role === "requester" ? "Your Marking Requests" : "Assigned Marking Jobs"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fee</TableHead>
                {role === "requester" && <TableHead>Agent</TableHead>}
                {role === "agent" && <TableHead>Queue Position</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{job.property.title}</p>
                      <p className="text-xs text-gray-500">
                        {job.property.city}, {job.property.state}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(job.status)}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(job.status)}
                        {job.status.replace("_", " ")}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getPaymentStatusColor(job.paymentStatus)}
                    >
                      {job.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ₦{job.markingFee.toLocaleString()}
                  </TableCell>
                  {role === "requester" && (
                    <TableCell>
                      {job.assignedAgent ? (
                        <span className="text-sm">{job.assignedAgent.name}</span>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </TableCell>
                  )}
                  {role === "agent" && (
                    <TableCell>
                      {job.queuePosition ? (
                        <Badge variant="outline">#{job.queuePosition}</Badge>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {format(new Date(job.createdAt), "MMM dd, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    //TODO: see how when the button is pressed, it is routed to jobs page
                    {/* router.push(`/marking/my-jobs/${job.id}`) */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedJob(job.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}