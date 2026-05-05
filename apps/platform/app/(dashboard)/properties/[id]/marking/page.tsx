// apps/platform/app/(dashboard)/properties/[id]/marking/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { AlertCircle, Clock, CheckCircle, XCircle, MapPin, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';

interface MarkingJob {
  id: string;
  propertyId: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'HELD' | 'RELEASED';
  requestedBy: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentPhone?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  queuePosition?: number;
  timeSlotExpiry?: string;
  completedAt?: string;
  completionNotes?: string;
  completionImages?: string[];
  maxCompletionTime?: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  boundaryVerified: boolean;
  status: string;
}

export default function MarkingJobManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();

  const propertyId = params.id as string;
  const [markingJobs, setMarkingJobs] = useState<MarkingJob[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkingJobs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/properties/${propertyId}/marking-jobs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch marking jobs');
        }

        const data = await response.json();
        setMarkingJobs(data.jobs || []);
        setProperty(data.property);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchMarkingJobs();
    }
  }, [propertyId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'QUEUED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'RELEASED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
      case 'HELD':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Property not found</p>
      </div>
    );
  }

  const activeJobs = markingJobs.filter(
    (job) => job.status !== 'COMPLETED' && job.status !== 'CANCELLED'
  );
  const completedJobs = markingJobs.filter((job) => job.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{property.title}</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {property.address}, {property.city}, {property.state}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/properties/${propertyId}/marking/request`)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          New Marking Job
        </Button>
      </div>

      {/* Property Status Alert */}
      {!property.boundaryVerified && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            This property has not been marked yet. Complete a marking job to verify the property boundary.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active Jobs ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Jobs Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No active marking jobs</p>
              </CardContent>
            </Card>
          ) : (
            activeJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Marking Job #{job.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Created {formatDate(job.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline">{job.urgencyLevel}</Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-gray-600">Contact Person</p>
                      <p className="font-medium">{job.contactPersonName}</p>
                      <p className="text-sm flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4" />
                        {job.contactPersonPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Marking Fee</p>
                      <p className="font-medium">₦{job.markingFee.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPaymentStatusIcon(job.paymentStatus)}
                        <span className="text-sm">{job.paymentStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Queue Information */}
                  {job.status === 'QUEUED' && job.queuePosition && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b bg-gray-50 p-3 rounded">
                      <div>
                        <p className="text-sm text-gray-600">Queue Position</p>
                        <p className="font-bold text-lg">#{job.queuePosition}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Slot Expires</p>
                        {job.timeSlotExpiry ? (
                          <p className="font-medium text-sm">
                            {formatDate(job.timeSlotExpiry)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Not assigned yet</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Agent Information */}
                  {job.assignedAgentId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b bg-blue-50 p-3 rounded">
                      <div>
                        <p className="text-sm text-gray-600">Assigned Agent</p>
                        <p className="font-medium">{job.assignedAgentName}</p>
                        <p className="text-sm flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" />
                          {job.assignedAgentPhone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Deadline</p>
                        {job.maxCompletionTime ? (
                          <p className="font-medium text-sm">
                            {formatDate(job.maxCompletionTime)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Calculating...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Access Instructions */}
                  {job.accessInstructions && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Access Instructions</p>
                      <p className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
                        {job.accessInstructions}
                      </p>
                    </div>
                  )}

                  {/* Completion Notes */}
                  {job.completionNotes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Completion Notes</p>
                      <p className="text-sm bg-green-50 p-3 rounded border border-green-200">
                        {job.completionNotes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() =>
                        router.push(
                          `/properties/${propertyId}/marking/queue-status?jobId=${job.id}`
                        )
                      }
                      variant="outline"
                      size="sm"
                    >
                      View Queue Status
                    </Button>
                    {job.status === 'COMPLETED' && (
                      <Button size="sm" variant="outline">
                        Confirm Marking
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Completed Jobs Tab */}
        <TabsContent value="completed" className="space-y-4">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No completed marking jobs</p>
              </CardContent>
            </Card>
          ) : (
            completedJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Marking Job #{job.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Completed {formatDate(job.completedAt || job.updatedAt)}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">COMPLETED</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Agent</p>
                      <p className="font-medium">{job.assignedAgentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion Notes</p>
                      <p className="text-sm">{job.completionNotes || 'No notes'}</p>
                    </div>
                  </div>

                  {job.completionImages && job.completionImages.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Completion Photos ({job.completionImages.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {job.completionImages.map((image, idx) => (
                          <div key={idx} className="relative h-24 w-full">
                            <Image
                              src={image}
                              alt={`Completion ${idx + 1}`}
                              fill
                              className="object-cover rounded border border-gray-200"
                              sizes="(max-width: 768px) 33vw, 20vw"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}