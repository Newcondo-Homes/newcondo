// apps/platform/components/marking/QueueUpdateNotification.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  X,
  Bell,
  MapPin,
} from 'lucide-react';

export type NotificationType =
  | 'POSITION_CHANGED'
  | 'JOB_AVAILABLE'
  | 'ASSIGNED'
  | 'MARKED_IN_PROGRESS'
  | 'MARKED_COMPLETED'
  | 'TIME_SLOT_EXPIRING'
  | 'TIMED_OUT'
  | 'COMPENSATION_AWARDED';

interface QueueUpdateNotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  queuePosition?: number;
  markingFee?: number;
  previousPosition?: number;
  jobId?: string;
  propertyLocation?: string;
  agentName?: string;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  autoClose?: boolean;
  autoCloseDuration?: number; // in milliseconds, default 5000
  isPriority?: boolean;
}

export function QueueUpdateNotification({
  type,
  title,
  message,
  queuePosition,
  markingFee,
  previousPosition,
  jobId,
  propertyLocation,
  agentName,
  onDismiss,
  onAction,
  actionLabel = 'View Details',
  autoClose = true,
  autoCloseDuration = 5000,
  isPriority = false,
}: QueueUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Auto-close notification
  useEffect(() => {
    if (!autoClose || !isVisible) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoClose, autoCloseDuration, isVisible]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!isVisible) return null;

  // Determine notification styling based on type
  const getNotificationStyle = () => {
    const baseStyle = 'transition-all duration-300 ease-in-out';
    const closingStyle = isClosing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0';

    switch (type) {
      case 'ASSIGNED':
        return `${baseStyle} ${closingStyle} border-green-200 bg-green-50`;
      case 'MARKED_COMPLETED':
        return `${baseStyle} ${closingStyle} border-emerald-200 bg-emerald-50`;
      case 'TIME_SLOT_EXPIRING':
        return `${baseStyle} ${closingStyle} border-orange-200 bg-orange-50`;
      case 'TIMED_OUT':
        return `${baseStyle} ${closingStyle} border-red-200 bg-red-50`;
      case 'COMPENSATION_AWARDED':
        return `${baseStyle} ${closingStyle} border-blue-200 bg-blue-50`;
      case 'POSITION_CHANGED':
        return `${baseStyle} ${closingStyle} border-purple-200 bg-purple-50`;
      case 'JOB_AVAILABLE':
        return `${baseStyle} ${closingStyle} border-blue-200 bg-blue-50`;
      case 'MARKED_IN_PROGRESS':
        return `${baseStyle} ${closingStyle} border-cyan-200 bg-cyan-50`;
      default:
        return `${baseStyle} ${closingStyle} border-gray-200 bg-gray-50`;
    }
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'ASSIGNED':
        return {
          icon: <CheckCircle2 size={20} />,
          iconColor: 'text-green-600',
          badgeVariant: 'default' as const,
        };
      case 'MARKED_COMPLETED':
        return {
          icon: <CheckCircle2 size={20} />,
          iconColor: 'text-emerald-600',
          badgeVariant: 'secondary' as const,
        };
      case 'TIME_SLOT_EXPIRING':
        return {
          icon: <Clock size={20} />,
          iconColor: 'text-orange-600',
          badgeVariant: 'outline' as const,
        };
      case 'TIMED_OUT':
        return {
          icon: <AlertCircle size={20} />,
          iconColor: 'text-red-600',
          badgeVariant: 'destructive' as const,
        };
      case 'COMPENSATION_AWARDED':
        return {
          icon: <TrendingUp size={20} />,
          iconColor: 'text-blue-600',
          badgeVariant: 'default' as const,
        };
      case 'POSITION_CHANGED':
        return {
          icon: <TrendingUp size={20} />,
          iconColor: 'text-purple-600',
          badgeVariant: 'outline' as const,
        };
      case 'JOB_AVAILABLE':
        return {
          icon: <Bell size={20} />,
          iconColor: 'text-blue-600',
          badgeVariant: 'default' as const,
        };
      case 'MARKED_IN_PROGRESS':
        return {
          icon: <Clock size={20} />,
          iconColor: 'text-cyan-600',
          badgeVariant: 'secondary' as const,
        };
      default:
        return {
          icon: <Bell size={20} />,
          iconColor: 'text-gray-600',
          badgeVariant: 'outline' as const,
        };
    }
  };

  const { icon, iconColor, badgeVariant } = getIconAndColor();

  // Get status badge label
  const getStatusBadgeLabel = () => {
    const statusMap: Record<NotificationType, string> = {
      POSITION_CHANGED: 'Queue Update',
      JOB_AVAILABLE: 'New Opportunity',
      ASSIGNED: 'Assigned',
      MARKED_IN_PROGRESS: 'In Progress',
      MARKED_COMPLETED: 'Completed',
      TIME_SLOT_EXPIRING: 'Urgent',
      TIMED_OUT: 'Expired',
      COMPENSATION_AWARDED: 'Reward',
    };
    return statusMap[type] || 'Update';
  };

  return (
    <Card
      className={`border-2 p-4 flex gap-4 ${getNotificationStyle()} ${isPriority ? 'shadow-lg' : 'shadow'}`}
    >
      {/* Icon Section */}
      <div className="flex-shrink-0 mt-0.5">
        <div className={iconColor}>{icon}</div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
          </div>
          <Badge variant={badgeVariant} className="text-xs flex-shrink-0">
            {getStatusBadgeLabel()}
          </Badge>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-700 mb-2">{message}</p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          {/* Queue Position */}
          {queuePosition !== undefined && (
            <div className="bg-white/50 rounded px-2 py-1">
              <p className="text-gray-600">Position</p>
              <p className="font-semibold text-gray-900">
                #{queuePosition}
                {previousPosition !== undefined && previousPosition !== queuePosition && (
                  <span className="text-xs ml-1">
                    {queuePosition < previousPosition ? (
                      <span className="text-green-600">↑ moved up</span>
                    ) : (
                      <span className="text-orange-600">↓ moved down</span>
                    )}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Marking Fee */}
          {markingFee !== undefined && (
            <div className="bg-white/50 rounded px-2 py-1">
              <p className="text-gray-600">Fee</p>
              <p className="font-semibold text-gray-900">₦{markingFee.toLocaleString()}</p>
            </div>
          )}

          {/* Property Location */}
          {propertyLocation && (
            <div className="bg-white/50 rounded px-2 py-1 col-span-2">
              <div className="flex items-center gap-1 text-gray-600 mb-0.5">
                <MapPin size={12} />
                <span>Location</span>
              </div>
              <p className="font-semibold text-gray-900 truncate">{propertyLocation}</p>
            </div>
          )}

          {/* Agent Name */}
          {agentName && (
            <div className="bg-white/50 rounded px-2 py-1 col-span-2">
              <p className="text-gray-600">Agent</p>
              <p className="font-semibold text-gray-900">{agentName}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {onAction && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAction}
            className="text-xs h-8"
          >
            {actionLabel}
          </Button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </Card>
  );
}