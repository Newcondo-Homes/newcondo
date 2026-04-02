import React from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  Calendar,
  Clock,
  Users,
  Lock
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@newcondo/ui/components/dialog';

export type ConflictType = 
  | 'PAYMENT_IN_PROGRESS'
  | 'ALREADY_RENTED'
  | 'DUPLICATE_PROPERTY'
  | 'BOUNDARY_DISPUTE'
  | 'PENDING_CONFIRMATION'
  | 'QUEUE_FULL'
  | 'TIME_SLOT_EXPIRED';

interface ConflictWarningProps {
  type: ConflictType;
  severity?: 'warning' | 'error' | 'info';
  propertyId?: string;
  details?: {
    lockedUntil?: Date;
    rentedUntil?: Date;
    conflictingPropertyId?: string;
    queuePosition?: number;
    estimatedWaitTime?: number;
    [key: string]: any;
  };
  onDismiss?: () => void;
  onAction?: () => void;
  className?: string;
}

export const ConflictWarning: React.FC<ConflictWarningProps> = ({
  type,
  severity = 'warning',
  details,
  onDismiss,
  onAction,
  className = '',
}) => {
  const getConflictConfig = () => {
    switch (type) {
      case 'PAYMENT_IN_PROGRESS':
        return {
          icon: Lock,
          title: 'Payment in Progress',
          description: details?.lockedUntil 
            ? `Another user is completing a payment for this property. It will become available at ${new Date(details.lockedUntil).toLocaleTimeString()} if the transaction isn't completed.`
            : 'Another user is currently completing a payment for this property.',
          action: details?.queuePosition ? 'Join Queue' : null,
          color: 'orange',
        };
      
      case 'ALREADY_RENTED':
        return {
          icon: XCircle,
          title: 'Property Already Rented',
          description: details?.rentedUntil
            ? `This property is currently rented until ${new Date(details.rentedUntil).toLocaleDateString()}.`
            : 'This property is no longer available for rent.',
          action: 'Browse Similar',
          color: 'red',
        };
      
      case 'DUPLICATE_PROPERTY':
        return {
          icon: AlertTriangle,
          title: 'Potential Duplicate Listing',
          description: 'This property appears to be listed multiple times. We recommend verifying the property details before proceeding.',
          action: 'View Original',
          color: 'yellow',
        };
      
      case 'BOUNDARY_DISPUTE':
        return {
          icon: AlertTriangle,
          title: 'Boundary Dispute Reported',
          description: 'There is an ongoing boundary dispute for this property. Payment is temporarily suspended pending resolution.',
          action: null,
          color: 'red',
        };
      
      case 'PENDING_CONFIRMATION':
        return {
          icon: Clock,
          title: 'Awaiting Tenant Confirmation',
          description: 'A previous tenant has 7 days to confirm occupancy. This property will become available if they don\'t confirm.',
          action: details?.queuePosition ? 'Join Waitlist' : null,
          color: 'blue',
        };
      
      case 'QUEUE_FULL':
        return {
          icon: Users,
          title: 'Queue at Capacity',
          description: 'The payment queue for this property is currently full. Please check back later or explore other properties.',
          action: 'Browse Similar',
          color: 'orange',
        };
      
      case 'TIME_SLOT_EXPIRED':
        return {
          icon: Clock,
          title: 'Time Slot Expired',
          description: 'Your payment time slot has expired. The property has been released for other users.',
          action: 'Rejoin Queue',
          color: 'red',
        };
      
      default:
        return {
          icon: Info,
          title: 'Notice',
          description: 'There is an issue with this property.',
          action: null,
          color: 'gray',
        };
    }
  };

  const config = getConflictConfig();
  const Icon = config.icon;

  const severityStyles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <Alert className={`${severityStyles[severity]} ${className}`}>
      <Icon className={`h-5 w-5 ${iconColors[severity]}`} />
      <AlertTitle className="font-semibold mb-1">{config.title}</AlertTitle>
      <AlertDescription>
        <p className="mb-3">{config.description}</p>
        
        {details?.queuePosition && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Badge variant="secondary">
              Queue Position: #{details.queuePosition}
            </Badge>
            {details.estimatedWaitTime && (
              <span className="text-xs">
                Est. wait: {details.estimatedWaitTime} min
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {config.action && onAction && (
            <Button 
              size="sm" 
              onClick={onAction}
              variant={severity === 'error' ? 'destructive' : 'default'}
            >
              {config.action}
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="outline" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ConflictType;
  details?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  open,
  onOpenChange,
  type,
  details,
  onConfirm,
  onCancel,
}) => {
  const config = React.useMemo(() => {
    switch (type) {
      case 'PAYMENT_IN_PROGRESS':
        return {
          title: 'Property Payment in Progress',
          description: 'Another user is currently completing a payment for this property. Would you like to join the queue?',
          confirmText: 'Join Queue',
          cancelText: 'Cancel',
        };
      
      case 'TIME_SLOT_EXPIRED':
        return {
          title: 'Payment Time Expired',
          description: 'Your 15-minute payment window has expired. Would you like to rejoin the queue?',
          confirmText: 'Rejoin Queue',
          cancelText: 'Go Back',
        };
      
      case 'DUPLICATE_PROPERTY':
        return {
          title: 'Duplicate Property Detected',
          description: 'This property may already be listed. Proceeding may result in double payment. Are you sure you want to continue?',
          confirmText: 'Continue Anyway',
          cancelText: 'Cancel',
        };
      
      default:
        return {
          title: 'Conflict Detected',
          description: 'There is a conflict with this property. Please review before proceeding.',
          confirmText: 'Continue',
          cancelText: 'Cancel',
        };
    }
  }, [type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {details && (
          <div className="space-y-2 py-4">
            {details.queuePosition && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Queue Position</span>
                <Badge>#{details.queuePosition}</Badge>
              </div>
            )}
            
            {details.estimatedWaitTime && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Estimated Wait</span>
                <span className="text-sm font-medium">{details.estimatedWaitTime} minutes</span>
              </div>
            )}
            
            {details.lockedUntil && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Available After</span>
                <span className="text-sm font-medium">
                  {new Date(details.lockedUntil).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
          >
            {config.cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
          >
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ConflictBannerProps {
  conflicts: Array<{
    type: ConflictType;
    severity: 'warning' | 'error' | 'info';
    message: string;
  }>;
  onDismiss?: (index: number) => void;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  conflicts,
  onDismiss,
}) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="space-y-2">
      {conflicts.map((conflict, index) => (
        <Alert
          key={index}
          className={
            conflict.severity === 'error'
              ? 'bg-red-50 border-red-200'
              : conflict.severity === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }
        >
          <AlertTriangle
            className={`h-4 w-4 ${
              conflict.severity === 'error'
                ? 'text-red-600'
                : conflict.severity === 'warning'
                ? 'text-yellow-600'
                : 'text-blue-600'
            }`}
          />
          <AlertDescription className="flex items-center justify-between">
            <span>{conflict.message}</span>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(index)}
              >
                Dismiss
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};