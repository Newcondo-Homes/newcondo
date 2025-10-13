// apps/platform/components/marking/MarkingJobCard.tsx

import { Card, CardContent, CardFooter, CardHeader } from '@newcondo/ui/card';
import { Badge } from '@newcondo/ui/badge';
import { Button } from '@newcondo/ui/button';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@newcondo/ui/dropdown-menu';
import { formatDate, formatTimeRemaining } from '@/lib/utils/format';
import { MarkingStatusBadge } from './MarkingStatusBadge';

interface MarkingJobCardProps {
  job: {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyImages?: string[];
    status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions?: string;
    preferredTime?: string;
    markingFee: number;
    paymentStatus: 'PENDING' | 'SUCCESS' | 'HELD' | 'RELEASED';
    assignedAgent?: {
      id: string;
      name: string;
      image?: string;
      phone?: string;
    };
    assignedAt?: string;
    completedAt?: string;
    timeSlotExpiry?: string;
    queuePosition?: number;
    createdAt: string;
  };
  viewType: 'owner' | 'agent';
  onViewDetails?: () => void;
  onVerify?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
}

export function MarkingJobCard({
  job,
  viewType,
  onViewDetails,
  onVerify,
  onCancel,
  onComplete,
}: MarkingJobCardProps) {
  const isOwner = viewType === 'owner';
  const isAgent = viewType === 'agent';

  const getTimeRemaining = () => {
    if (!job.timeSlotExpiry) return null;
    const expiry = new Date(job.timeSlotExpiry);
    const now = new Date();
    if (expiry <= now) return 'Expired';
    return formatTimeRemaining(expiry);
  };

  const getActionButtons = () => {
    if (isOwner) {
      if (job.status === 'COMPLETED' && job.paymentStatus === 'HELD') {
        return (
          <Button onClick={onVerify} size="sm" className="w-full">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Verify Marking
          </Button>
        );
      }

      if (job.status === 'QUEUED' || job.status === 'ASSIGNED') {
        return (
          <Button 
            onClick={onCancel} 
            variant="destructive" 
            size="sm" 
            className="w-full"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Job
          </Button>
        );
      }
    }

    if (isAgent && job.status === 'ASSIGNED' && job.assignedAgent?.id) {
      return (
        <Button onClick={onComplete} size="sm" className="w-full">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Complete Marking
        </Button>
      );
    }

    return null;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{job.propertyTitle}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.propertyAddress}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MarkingStatusBadge status={job.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {isOwner && (job.status === 'QUEUED' || job.status === 'ASSIGNED') && (
                  <DropdownMenuItem onClick={onCancel} className="text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Job
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Property Image */}
        {job.propertyImages && job.propertyImages.length > 0 && (
          <div className="relative h-40 w-full rounded-md overflow-hidden bg-muted">
            <img
              src={job.propertyImages[0]}
              alt={job.propertyTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Job Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Marking Fee</p>
            <p className="font-semibold">₦{job.markingFee.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground">Payment Status</p>
            <Badge
              variant={
                job.paymentStatus === 'SUCCESS' || job.paymentStatus === 'RELEASED'
                  ? 'success'
                  : job.paymentStatus === 'HELD'
                  ? 'warning'
                  : 'secondary'
              }
            >
              {job.paymentStatus}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(job.createdAt)}
            </p>
          </div>

          {job.queuePosition && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Queue Position</p>
              <p className="font-medium">#{job.queuePosition}</p>
            </div>
          )}
        </div>

        {/* Time Slot Expiry Warning */}
        {job.status === 'ASSIGNED' && timeRemaining && timeRemaining !== 'Expired' && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Time Remaining</p>
              <p className="text-xs text-muted-foreground">{timeRemaining}</p>
            </div>
          </div>
        )}

        {/* Contact Information (for agents) */}
        {isAgent && job.status === 'ASSIGNED' && (
          <div className="space-y-2 p-3 border rounded-md">
            <h4 className="font-medium text-sm">Contact Person</h4>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <User className="h-3 w-3" />
                {job.contactPersonName}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <a 
                  href={`tel:${job.contactPersonPhone}`}
                  className="text-primary hover:underline"
                >
                  {job.contactPersonPhone}
                </a>
              </p>
            </div>
            {job.accessInstructions && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {job.accessInstructions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Assigned Agent (for owners) */}
        {isOwner && job.assignedAgent && (
          <div className="flex items-center gap-3 p-3 border rounded-md">
            {job.assignedAgent.image ? (
              <img
                src={job.assignedAgent.image}
                alt={job.assignedAgent.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Assigned Agent</p>
              <p className="text-sm text-muted-foreground">{job.assignedAgent.name}</p>
            </div>
            {job.assignedAgent.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${job.assignedAgent.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/50 pt-4">
        {getActionButtons()}
      </CardFooter>
    </Card>
  );
}