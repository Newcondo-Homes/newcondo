/**
 * apps/platform/components/marking/MarkingStatusBadge.tsx
 * 
 * Displays the current status of a marking job with visual indicators.
 * Shows status progression, timelines, and action prompts based on job state.
 */

'use client';

import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  AlertTriangle,
  XCircle,
  Hourglass,
} from 'lucide-react';

export type MarkingJobStatus =
  | 'QUEUED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

interface MarkingStatusBadgeProps {
  status: MarkingJobStatus;
  assignedAt?: Date | string;
  completedAt?: Date | string;
  timeSlotExpiry?: Date | string;
  maxCompletionTime?: Date | string;
  isConfirmed?: boolean;
  showTimeline?: boolean;
  compact?: boolean;
}

export function MarkingStatusBadge({
  status,
  assignedAt,
  completedAt,
  timeSlotExpiry,
  maxCompletionTime,
  isConfirmed = false,
  showTimeline = false,
  compact = false,
}: MarkingStatusBadgeProps) {
  const statusConfig = {
    QUEUED: {
      label: 'In Queue',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Hourglass,
      description: 'Waiting for an agent to accept this marking job',
    },
    ASSIGNED: {
      label: 'Assigned',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: MapPin,
      description: 'Agent has been assigned and has 3 hours to mark the property',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: Clock,
      description: 'Agent is currently marking your property',
    },
    COMPLETED: {
      label: isConfirmed ? 'Verified' : 'Awaiting Confirmation',
      color: isConfirmed
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-orange-100 text-orange-800 border-orange-300',
      icon: isConfirmed ? CheckCircle : AlertCircle,
      description: isConfirmed
        ? 'Property marking has been verified'
        : 'Please review and confirm the marking within 2-3 days',
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: XCircle,
      description: 'This marking job has been cancelled',
    },
    EXPIRED: {
      label: 'Expired',
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertTriangle,
      description: 'This marking job has expired and needs to be re-initiated',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const formatTime = (date?: Date | string) => {
    if (!date) return null;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return null;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeRemaining = (expiryDate?: Date | string) => {
    if (!expiryDate) return null;
    const expiry =
      typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${config.color}`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold ${config.color}`}>
        <Icon className="h-5 w-5" />
        <span>{config.label}</span>
      </div>

      {/* Status Description */}
      <p className="text-sm text-gray-600">{config.description}</p>

      {/* Timeline Information */}
      {showTimeline && (
        <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4">
          {/* Assigned At */}
          {assignedAt && (
            <div className="flex items-start justify-between text-sm">
              <span className="text-gray-600">Assigned:</span>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatDate(assignedAt)}
                </p>
                <p className="text-gray-500">{formatTime(assignedAt)}</p>
              </div>
            </div>
          )}

          {/* Time Slot Expiry (3-hour window) */}
          {status === 'ASSIGNED' && timeSlotExpiry && (
            <div className="flex items-start justify-between border-t pt-2 text-sm">
              <span className="text-gray-600">3-Hour Window Expires:</span>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatDate(timeSlotExpiry)}
                </p>
                <p className="text-orange-600 font-semibold">
                  {getTimeRemaining(timeSlotExpiry)}
                </p>
              </div>
            </div>
          )}

          {/* Completion Deadline */}
          {status === 'COMPLETED' && maxCompletionTime && (
            <div className="flex items-start justify-between border-t pt-2 text-sm">
              <span className="text-gray-600">
                {isConfirmed ? 'Verified on:' : 'Confirm by:'}
              </span>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatDate(maxCompletionTime)}
                </p>
                {!isConfirmed && (
                  <p className="text-orange-600 font-semibold">
                    {getTimeRemaining(maxCompletionTime)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Completed At */}
          {completedAt && status === 'COMPLETED' && (
            <div className="flex items-start justify-between border-t pt-2 text-sm">
              <span className="text-gray-600">Completed:</span>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatDate(completedAt)}
                </p>
                <p className="text-gray-500">{formatTime(completedAt)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status-Specific Call-to-Action */}
      {status === 'COMPLETED' && !isConfirmed && (
        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-sm font-medium text-orange-900">
            ⚠️ Action Required: Please verify and confirm this marking within 2-3 days
          </p>
        </div>
      )}

      {status === 'EXPIRED' && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-900">
            This marking job has expired. You&apos;ll need to create a new marking request and pay the fee again.
          </p>
        </div>
      )}

      {status === 'ASSIGNED' && timeSlotExpiry && (
        <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
          <p className="text-sm text-purple-900">
            The assigned agent has{' '}
            <span className="font-semibold">
              {getTimeRemaining(timeSlotExpiry)}
            </span>{' '}
            to mark your property before the time slot expires.
          </p>
        </div>
      )}
    </div>
  );
}











// // apps/platform/components/marking/MarkingStatusBadge.tsx
// 'use client';

// import { Badge } from '@/components/ui/badge';
// import { cn } from '@/lib/utils';
// import {
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   UserCheck,
//   Loader2,
// } from 'lucide-react';

// type MarkingJobStatus =
//   | 'QUEUED'
//   | 'ASSIGNED'
//   | 'IN_PROGRESS'
//   | 'COMPLETED'
//   | 'CANCELLED'
//   | 'EXPIRED';

// interface MarkingStatusBadgeProps {
//   status: MarkingJobStatus;
//   isConfirmed?: boolean;
//   size?: 'sm' | 'default' | 'lg';
//   showIcon?: boolean;
//   className?: string;
// }

// export function MarkingStatusBadge({
//   status,
//   isConfirmed,
//   size = 'default',
//   showIcon = true,
//   className,
// }: MarkingStatusBadgeProps) {
//   const getStatusConfig = () => {
//     switch (status) {
//       case 'COMPLETED':
//         if (isConfirmed) {
//           return {
//             label: 'Confirmed',
//             icon: CheckCircle,
//             className: 'bg-green-500 hover:bg-green-600',
//           };
//         }
//         return {
//           label: 'Awaiting Confirmation',
//           icon: AlertCircle,
//           className: 'bg-yellow-500 hover:bg-yellow-600',
//         };
//       case 'IN_PROGRESS':
//         return {
//           label: 'In Progress',
//           icon: Loader2,
//           className: 'bg-blue-500 hover:bg-blue-600',
//         };
//       case 'ASSIGNED':
//         return {
//           label: 'Assigned',
//           icon: UserCheck,
//           className: 'bg-purple-500 hover:bg-purple-600',
//         };
//       case 'QUEUED':
//         return {
//           label: 'Queued',
//           icon: Clock,
//           className: 'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
//           variant: 'outline' as const,
//         };
//       case 'CANCELLED':
//         return {
//           label: 'Cancelled',
//           icon: XCircle,
//           className: '',
//           variant: 'destructive' as const,
//         };
//       case 'EXPIRED':
//         return {
//           label: 'Expired',
//           icon: Clock,
//           className: 'border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-100',
//           variant: 'outline' as const,
//         };
//     }
//   };

//   const config = getStatusConfig();
//   const Icon = config.icon;

//   const sizeClasses = {
//     sm: 'text-xs h-5',
//     default: 'text-sm h-6',
//     lg: 'text-base h-7',
//   };

//   const iconSizeClasses = {
//     sm: 'h-3 w-3',
//     default: 'h-3.5 w-3.5',
//     lg: 'h-4 w-4',
//   };

//   return (
//     <Badge
//       variant={config.variant || 'default'}
//       className={cn(
//         sizeClasses[size],
//         config.className,
//         showIcon && 'gap-1',
//         className
//       )}
//     >
//       {showIcon && <Icon className={cn(iconSizeClasses[size], status === 'IN_PROGRESS' && 'animate-spin')} />}
//       {config.label}
//     </Badge>
//   );
// }