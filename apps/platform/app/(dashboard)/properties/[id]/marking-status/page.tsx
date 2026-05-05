// File: apps/platform/app/(dashboard)/properties/[id]/marking-status/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import { Separator } from '@newcondo/ui/components/separator';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import {
  Clock,
  CheckCircle,
  MapPin,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  MapPinned,
} from 'lucide-react';
import { format } from 'date-fns';

interface MarkingJob {
  id: string;
  propertyId: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  assignedAgentId?: string;
  assignedAgent?: {
    id: string;
    name: string;
    phone: string;
    reliabilityScore?: number;
  };
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string;
  completionNotes?: string;
  completionImages?: string[];
  queuePosition?: number;
  maxCompletionTime?: string;
  createdAt: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
  };
}

export default function MarkingStatusPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [markingJob, setMarkingJob] = useState<MarkingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkingStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/property-marking/status/${propertyId}`);

      if (!response.ok) throw new Error('Failed to fetch marking status');

      const data = await response.json();
      setMarkingJob(data.markingJob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchMarkingStatus();
  }, [fetchMarkingStatus]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      QUEUED: { variant: 'secondary', label: 'In Queue' },
      ASSIGNED: { variant: 'default', label: 'Assigned' },
      IN_PROGRESS: { variant: 'default', label: 'In Progress' },
      COMPLETED: { variant: 'outline', label: 'Completed' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
      EXPIRED: { variant: 'destructive', label: 'Expired' },
    };

    const config = statusConfig[status] ?? statusConfig['QUEUED'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive'; label: string }
    > = {
      LOW: { variant: 'secondary', label: 'Low Priority' },
      NORMAL: { variant: 'default', label: 'Normal' },
      HIGH: { variant: 'default', label: 'High Priority' },
      URGENT: { variant: 'destructive', label: 'Urgent' },
    };

    const config = urgencyConfig[urgency] ?? urgencyConfig['NORMAL'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const calculateTimeRemaining = (expiryTime?: string) => {
    if (!expiryTime) return null;

    const diff = new Date(expiryTime).getTime() - Date.now();
    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error || !markingJob) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'No marking job found for this property'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button onClick={() => router.back()} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Property
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Property Marking Status</h1>
            <p className="text-muted-foreground">
              Track the progress of your property marking job
            </p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(markingJob.status)}
            {getUrgencyBadge(markingJob.urgencyLevel)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Property</p>
              <p className="font-medium">{markingJob.property.title}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <p className="text-sm">{markingJob.property.address}</p>
              <p className="text-sm text-muted-foreground">
                {markingJob.property.city}, {markingJob.property.state}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Job Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Marking Fee</p>
                <p className="font-medium">₦{markingJob.markingFee.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                <Badge variant={markingJob.paymentStatus === 'SUCCESS' ? 'outline' : 'secondary'}>
                  {markingJob.paymentStatus}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="text-sm">{format(new Date(markingJob.createdAt), 'PPp')}</p>
            </div>
            {markingJob.queuePosition && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Queue Position</p>
                  <p className="font-medium">#{markingJob.queuePosition}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Person
            </CardTitle>
            <CardDescription>Person to contact for property access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="font-medium">{markingJob.contactPersonName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <p className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {markingJob.contactPersonPhone}
              </p>
            </div>
            {markingJob.accessInstructions && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Access Instructions</p>
                  <p className="text-sm">{markingJob.accessInstructions}</p>
                </div>
              </>
            )}
            {markingJob.preferredTime && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Preferred Time</p>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(markingJob.preferredTime), 'PPp')}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assigned Agent */}
        {markingJob.assignedAgent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assigned Agent
              </CardTitle>
              <CardDescription>Agent handling your marking job</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{markingJob.assignedAgent.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {markingJob.assignedAgent.phone}
                </p>
              </div>
              {markingJob.assignedAgent.reliabilityScore && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reliability Score</p>
                    <p className="font-medium">
                      {markingJob.assignedAgent.reliabilityScore}/5.00 ⭐
                    </p>
                  </div>
                </>
              )}
              {markingJob.assignedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned At</p>
                    <p className="text-sm">{format(new Date(markingJob.assignedAt), 'PPp')}</p>
                  </div>
                </>
              )}
              {markingJob.timeSlotExpiry && markingJob.status === 'ASSIGNED' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {calculateTimeRemaining(markingJob.timeSlotExpiry)}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completion Details */}
      {markingJob.status === 'COMPLETED' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Marking Completed
            </CardTitle>
            <CardDescription>
              Review the marking details and verify the property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {markingJob.completedAt && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed At</p>
                <p className="font-medium">{format(new Date(markingJob.completedAt), 'PPp')}</p>
              </div>
            )}

            {markingJob.completionNotes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Agent Notes</p>
                  <p className="text-sm">{markingJob.completionNotes}</p>
                </div>
              </>
            )}

            {markingJob.completionImages && markingJob.completionImages.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Marking Images ({markingJob.completionImages.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {markingJob.completionImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden border"
                      >
                        <Image
                          src={image}
                          alt={`Marking image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex gap-4">
              <Button
                onClick={() =>
                  router.push(`/properties/my-listings/${propertyId}/verify-marking`)
                }
                className="flex-1"
              >
                <MapPinned className="mr-2 h-4 w-4" />
                Verify Marking
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/properties/${propertyId}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Property
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
          <CardDescription>Track the progress of your marking job</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Created */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-primary p-2">
                  <CheckCircle className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="w-px h-full bg-border mt-2" />
              </div>
              <div className="pb-8">
                <p className="font-medium">Job Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(markingJob.createdAt), 'PPp')}
                </p>
              </div>
            </div>

            {/* Assigned */}
            {markingJob.assignedAt && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-primary p-2">
                    <CheckCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                  {markingJob.completedAt && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <p className="font-medium">Agent Assigned</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(markingJob.assignedAt), 'PPp')}
                  </p>
                </div>
              </div>
            )}

            {/* Completed */}
            {markingJob.completedAt && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-primary p-2">
                    <CheckCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">Marking Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(markingJob.completedAt), 'PPp')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}