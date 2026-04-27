'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Separator } from '@newcondo/ui/components/separator';
import {
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Star,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { MarkingTimerCountdown } from './MarkingTimerCountdown';
import { markingApi } from '@/lib/api/marking';
import { toast } from 'sonner';

// Shape returned by prisma in the page — includes all relations
interface JobProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  ownerId: string;
  gpsCoordinates?: string | null;
  images: { url: string; isPrimary: boolean }[];
  owner: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
  };
}

interface JobUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
}

interface JobAgent extends JobUser {
  agentReliabilityScore: any;
  completedMarkingJobs: number;
  totalMarkingJobs: number;
}

interface MarkingJobFull {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId: string | null;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions: string | null;
  preferredTime: Date | null;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  markingFee: any; // Prisma Decimal
  paymentStatus: string;
  status: string;
  assignedAt: Date | null;
  completedAt: Date | null;
  timeSlotExpiry: Date | null;
  completionNotes: string | null;
  completionImages: string[];
  queuePosition: number | null;
  maxCompletionTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property: JobProperty;
  requestingUser: JobUser;
  assignedAgent: JobAgent | null;
}

interface JobPayment {
  id: string;
  amount: any;
  status: string;
  paymentType: string;
  createdAt: Date;
  paidAt: Date | null;
}

interface UserRole {
  isRequester: boolean;
  isAssignedAgent: boolean;
  isPropertyOwner: boolean;
}

interface JobDetailsClientProps {
  job: MarkingJobFull;
  payment: JobPayment | null;
  currentUserId: string;
  userRole: UserRole;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  QUEUED: {
    label: 'Queued',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3 w-3" />,
  },
  ASSIGNED: {
    label: 'Assigned',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <User className="h-3 w-3" />,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Clock className="h-3 w-3" />,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-3 w-3" />,
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const URGENCY_CONFIG: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export function JobDetailsClient({
  job,
  payment,
  currentUserId,
  userRole,
}: JobDetailsClientProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const statusConfig = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.QUEUED;
  const fee = Number(job.markingFee);
  const agentEarning = fee * 0.25;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this marking job?')) return;
    try {
      setIsCancelling(true);
      await markingApi.cancelJob(job.id, 'Cancelled by user');
      toast.success('Marking job cancelled.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel job');
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancel =
    userRole.isRequester &&
    (job.status === 'QUEUED' || job.status === 'ASSIGNED');

  const canComplete =
    userRole.isAssignedAgent &&
    (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS');

  const canConfirm =
    (userRole.isRequester || userRole.isPropertyOwner) &&
    job.status === 'COMPLETED';

  return (
    <div className="mt-6 space-y-6 max-w-4xl">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Job #{job.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Created {format(new Date(job.createdAt), 'MMM dd, yyyy · h:mm a')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`flex items-center gap-1 border ${statusConfig.color}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
          <Badge className={URGENCY_CONFIG[job.urgencyLevel]}>
            {job.urgencyLevel}
          </Badge>
        </div>
      </div>

      {/* Timer — only show when agent is assigned and job not done */}
      {job.timeSlotExpiry && (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS') && (
        <MarkingTimerCountdown
          expiryTime={job.timeSlotExpiry}
          totalDuration={3 * 60 * 60 * 1000}
          variant="detailed"
          showProgress
          onExpire={() => router.refresh()}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.property.images[0] && (
              <img
                src={job.property.images[0].url}
                alt={job.property.title}
                className="w-full h-40 object-cover rounded-md border"
              />
            )}
            <div>
              <p className="font-medium">{job.property.title}</p>
              <p className="text-sm text-muted-foreground">
                {job.property.address}, {job.property.city}, {job.property.state}
              </p>
            </div>
            {job.property.gpsCoordinates && (
              <a
                href={`https://maps.google.com/?q=${job.property.gpsCoordinates}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View on Google Maps
              </a>
            )}
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact &amp; Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contact Person</span>
              <span className="font-medium">{job.contactPersonName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phone</span>
              <a
                href={`tel:${job.contactPersonPhone}`}
                className="font-medium text-primary hover:underline flex items-center gap-1"
              >
                <Phone className="h-3 w-3" />
                {job.contactPersonPhone}
              </a>
            </div>
            {job.preferredTime && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Preferred Time</span>
                <span className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(job.preferredTime), 'MMM dd, yyyy · h:mm a')}
                </span>
              </div>
            )}
            {job.accessInstructions && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Access Instructions</p>
                  <p className="text-sm bg-muted rounded p-2">{job.accessInstructions}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Marking Fee</span>
              <span className="font-semibold text-lg">₦{fee.toLocaleString()}</span>
            </div>
            {(userRole.isAssignedAgent) && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your Earning (25%)</span>
                <span className="font-medium text-green-600">
                  ₦{agentEarning.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge variant="outline">{payment?.status ?? job.paymentStatus}</Badge>
            </div>
            {payment?.paidAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paid At</span>
                <span>{format(new Date(payment.paidAt), 'MMM dd, yyyy')}</span>
              </div>
            )}
            {job.queuePosition && job.status === 'QUEUED' && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Queue Position</span>
                <Badge variant="secondary">#{job.queuePosition}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Agent */}
        {job.assignedAgent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" />
                Assigned Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                {job.assignedAgent.image ? (
                  <img
                    src={job.assignedAgent.image}
                    alt={job.assignedAgent.name ?? 'Agent'}
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{job.assignedAgent.name ?? 'Agent'}</p>
                  <p className="text-muted-foreground text-xs">{job.assignedAgent.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reliability Score</span>
                <span className="font-medium">
                  {job.assignedAgent.agentReliabilityScore
                    ? `${Number(job.assignedAgent.agentReliabilityScore).toFixed(1)} / 5`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed Jobs</span>
                <span className="font-medium">{job.assignedAgent.completedMarkingJobs}</span>
              </div>
              {job.assignedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Assigned At</span>
                  <span>{format(new Date(job.assignedAt), 'MMM dd, h:mm a')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completion Data */}
      {job.status === 'COMPLETED' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completion Details
            </CardTitle>
            {job.completedAt && (
              <CardDescription>
                Completed on {format(new Date(job.completedAt), 'MMM dd, yyyy · h:mm a')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {job.completionNotes && (
              <div>
                <p className="text-sm font-medium mb-1">Notes from Agent</p>
                <p className="text-sm text-muted-foreground bg-muted rounded p-3">
                  {job.completionNotes}
                </p>
              </div>
            )}
            {job.completionImages.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  Completion Photos ({job.completionImages.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {job.completionImages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Completion photo ${i + 1}`}
                      className="w-full h-28 object-cover rounded-md border"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Alert */}
      {canConfirm && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            The marking agent has completed this job. Please review the completion photos and
            confirm if the marking is correct.
            {job.maxCompletionTime && (
              <span className="block mt-1 text-xs">
                Confirmation deadline:{' '}
                {format(new Date(job.maxCompletionTime), 'MMM dd, yyyy · h:mm a')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {canComplete && (
          <Button asChild>
            <Link href={`/marking/my-jobs/${job.id}/complete`}>
              Complete Marking Job
            </Link>
          </Button>
        )}

        {canConfirm && (
          <Button asChild variant="default">
            <Link href={`/properties/my-listings/${job.propertyId}/verify-marking`}>
              Confirm Marking
            </Link>
          </Button>
        )}

        {canCancel && (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Job'}
          </Button>
        )}

        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    </div>
  );
}