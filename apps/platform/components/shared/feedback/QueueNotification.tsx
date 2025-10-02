'use client';

import { useEffect, useState } from 'react';
import { Users, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type QueueStatus = 
  | 'waiting' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'timeout';

interface QueueNotificationProps {
  position?: number;
  totalInQueue?: number;
  status: QueueStatus;
  estimatedWaitTime?: number; // in seconds
  message?: string;
  propertyTitle?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
  autoClose?: boolean;
  autoCloseDelay?: number; // milliseconds
}

const statusConfig: Record<QueueStatus, {
  icon: React.ElementType;
  title: string;
  variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning';
  iconColor: string;
  bgColor: string;
}> = {
  waiting: {
    icon: Users,
    title: 'In Queue',
    variant: 'default',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  processing: {
    icon: Clock,
    title: 'Processing',
    variant: 'secondary',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
  completed: {
    icon: CheckCircle2,
    title: 'Completed',
    variant: 'success',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
  },
  failed: {
    icon: XCircle,
    title: 'Failed',
    variant: 'destructive',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
  },
  timeout: {
    icon: AlertCircle,
    title: 'Timeout',
    variant: 'warning',
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
};

export function QueueNotification({
  position,
  totalInQueue,
  status,
  estimatedWaitTime,
  message,
  propertyTitle,
  onCancel,
  onRetry,
  onClose,
  className,
  autoClose = false,
  autoCloseDelay = 3000,
}: QueueNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(
    estimatedWaitTime || null
  );

  const config = statusConfig[status];
  const Icon = config.icon;

  // Handle auto-close for completed/failed status
  useEffect(() => {
    if (autoClose && (status === 'completed' || status === 'failed')) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, status, autoCloseDelay, onClose]);

  // Countdown timer for estimated wait time
  useEffect(() => {
    if (estimatedWaitTime && status === 'waiting') {
      setCountdown(estimatedWaitTime);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [estimatedWaitTime, status]);

  const formatWaitTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isVisible) return null;

  const getStatusMessage = (): string => {
    if (message) return message;

    switch (status) {
      case 'waiting':
        return position
          ? `You are #${position} in the queue`
          : 'Waiting in queue...';
      case 'processing':
        return 'Processing your payment request...';
      case 'completed':
        return 'Payment processed successfully!';
      case 'failed':
        return 'Payment processing failed. Please try again.';
      case 'timeout':
        return 'Request timed out. Please try again.';
      default:
        return '';
    }
  };

  return (
    <Card
      className={cn(
        'border-2 animate-in slide-in-from-top-5 duration-300',
        config.bgColor,
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              status === 'processing' && 'animate-pulse'
            )}>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div>
              <CardTitle className="text-base">{config.title}</CardTitle>
              {propertyTitle && (
                <CardDescription className="text-xs mt-1">
                  {propertyTitle}
                </CardDescription>
              )}
            </div>
          </div>
          
          {status === 'waiting' && (
            <Badge variant="outline" className="font-mono">
              {position ? `#${position}` : 'Queued'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>

        {/* Queue Statistics */}
        {status === 'waiting' && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            {totalInQueue && (
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{totalInQueue} in queue</span>
              </div>
            )}
            {countdown !== null && countdown > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>~{formatWaitTime(countdown)} wait</span>
              </div>
            )}
          </div>
        )}

        {/* Processing indicator */}
        {status === 'processing' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2 w-2 rounded-full bg-orange-600',
                    'animate-pulse'
                  )}
                  style={{
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Please wait...
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {status === 'waiting' && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs"
            >
              Cancel
            </Button>
          )}

          {(status === 'failed' || status === 'timeout') && onRetry && (
            <Button
              variant="default"
              size="sm"
              onClick={onRetry}
              className="text-xs"
            >
              Retry Payment
            </Button>
          )}

          {(status === 'completed' || status === 'failed') && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="text-xs"
            >
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Toast-style compact notification
export function QueueToast({
  status,
  message,
  onClose,
  duration = 5000,
}: {
  status: QueueStatus;
  message: string;
  onClose?: () => void;
  duration?: number;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const config = statusConfig[status];
  const Icon = config.icon;

  useEffect(() => {
    if (status === 'completed' || status === 'failed') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [status, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'border-2 animate-in slide-in-from-bottom-5',
        config.bgColor
      )}
    >
      <Icon className={cn('h-5 w-5', config.iconColor)} />
      <p className="text-sm font-medium">{message}</p>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="h-6 w-6 p-0"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}