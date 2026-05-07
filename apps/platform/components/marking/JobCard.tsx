// apps/platform/components/marking/JobCard.tsx
'use client';

import React from 'react';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import {
  MapPin,
  Clock,
  AlertCircle,
  ChevronRight,
  Loader2,
  Zap,
  Eye,
} from 'lucide-react';
import type { Job } from '@/types/marking';

interface JobCardProps {
  job: Job;
  onAccept: () => void;
  onViewDetails?: () => void;
  isAccepting?: boolean;
  userLocation?: { lat: number; lng: number };
}

export default function JobCard({
  job,
  onAccept,
  onViewDetails,
  isAccepting = false,
  userLocation,
}: JobCardProps) {
  const urgencyConfig = {
    LOW: { label: 'Low', color: 'bg-blue-100 text-blue-800', icon: null },
    NORMAL: {
      label: 'Normal',
      color: 'bg-green-100 text-green-800',
      icon: null,
    },
    HIGH: {
      label: 'High',
      color: 'bg-orange-100 text-orange-800',
      icon: <AlertCircle className="h-3 w-3" />,
    },
    URGENT: {
      label: 'Urgent',
      color: 'bg-red-100 text-red-800',
      icon: <Zap className="h-3 w-3" />,
    },
  };

  const agentCompensation = (Number(job.markingFee) * 0.25).toLocaleString(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }
  );

  const urgency = urgencyConfig[job.urgencyLevel ?? 'NORMAL'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with Queue Position */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">
              Property Marking Job
            </h3>
            {job.queuePosition && (
              <Badge variant="outline" className="flex-shrink-0">
                Queue #{job.queuePosition}
              </Badge>
            )}
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {job.address}
              </p>
              <p className="text-xs text-gray-600">
                {job.city}, {job.state}
              </p>
              {userLocation && job.distanceFromAgent !== undefined && (
                <p className="text-xs text-blue-600 font-medium">
                  {job.distanceFromAgent.toFixed(1)}km away
                </p>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded bg-gray-50 p-2">
              <p className="text-xs text-gray-600 mb-0.5">Your Compensation</p>
              <p className="text-sm font-semibold text-gray-900">
                {agentCompensation}
              </p>
            </div>

            <div className="rounded bg-gray-50 p-2">
              <p className="text-xs text-gray-600 mb-0.5">Contact Person</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {job.contactPersonName}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 flex-wrap">
            {job.preferredTime && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3.5 w-3.5" />
                Preferred: {new Date(job.preferredTime).toLocaleDateString()}
              </div>
            )}

            {job.maxCompletionTime && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3.5 w-3.5" />
                Due: {new Date(job.maxCompletionTime).toLocaleDateString()}
              </div>
            )}

            {/* Urgency Badge */}
            <Badge className={`${urgency.color} flex items-center gap-1`}>
              {urgency.icon}
              <span>{urgency.label} Priority</span>
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {onViewDetails && (
            <Button
              onClick={onViewDetails}
              size="sm"
              variant="outline"
              className="whitespace-nowrap"
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          )}
          <Button
            onClick={onAccept}
            disabled={isAccepting}
            size="sm"
            className="whitespace-nowrap"
          >
            {isAccepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accepting...
              </>
            ) : (
              <>
                Accept Job
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}