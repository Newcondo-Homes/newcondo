'use client';

import { AlertCircle, XCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert';
import { Button } from '@newcondo/ui/components/button';
import { cn } from '@newcondo/ui';

export type ConflictType = 
  | 'payment_in_progress' 
  | 'property_locked' 
  | 'already_rented' 
  | 'unavailable'
  | 'booking_conflict'
  | 'boundary_duplicate';

interface ConflictAlertProps {
  type: ConflictType;
  message?: string;
  propertyTitle?: string;
  lockedUntil?: Date;
  onDismiss?: () => void;
  onViewAlternatives?: () => void;
  className?: string;
  showActions?: boolean;
}

const conflictConfig: Record<ConflictType, {
  icon: React.ElementType;
  title: string;
  defaultMessage: string;
  variant: 'default' | 'destructive';
  iconColor: string;
}> = {
  payment_in_progress: {
    icon: Clock,
    title: 'Payment in Progress',
    defaultMessage: 'Another user is currently processing payment for this property. Please wait or check back shortly.',
    variant: 'default',
    iconColor: 'text-yellow-600',
  },
  property_locked: {
    icon: AlertCircle,
    title: 'Property Temporarily Locked',
    defaultMessage: 'This property is temporarily locked while another user completes their payment.',
    variant: 'default',
    iconColor: 'text-orange-600',
  },
  already_rented: {
    icon: XCircle,
    title: 'Property Already Rented',
    defaultMessage: 'This property has been rented to another tenant.',
    variant: 'destructive',
    iconColor: 'text-red-600',
  },
  unavailable: {
    icon: XCircle,
    title: 'Property Unavailable',
    defaultMessage: 'This property is currently unavailable for rent.',
    variant: 'destructive',
    iconColor: 'text-red-600',
  },
  booking_conflict: {
    icon: AlertCircle,
    title: 'Booking Conflict Detected',
    defaultMessage: 'There is a conflict with your booking request. Please try a different property or time.',
    variant: 'default',
    iconColor: 'text-orange-600',
  },
  boundary_duplicate: {
    icon: AlertCircle,
    title: 'Potential Duplicate Property',
    defaultMessage: 'This property may be a duplicate of another listing. Please verify before proceeding.',
    variant: 'default',
    iconColor: 'text-yellow-600',
  },
};

export function ConflictAlert({
  type,
  message,
  propertyTitle,
  lockedUntil,
  onDismiss,
  onViewAlternatives,
  className,
  showActions = true,
}: ConflictAlertProps) {
  const config = conflictConfig[type];
  const Icon = config.icon;

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Alert 
      variant={config.variant}
      className={cn(
        'border-2 animate-in fade-in-50 slide-in-from-top-2 duration-300',
        className
      )}
    >
      <Icon className={cn('h-5 w-5', config.iconColor)} />
      <AlertTitle className="font-semibold text-base">
        {config.title}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {message || config.defaultMessage}
        </p>
        
        {propertyTitle && (
          <p className="text-sm font-medium">
            Property: <span className="text-muted-foreground">{propertyTitle}</span>
          </p>
        )}
        
        {lockedUntil && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              Lock expires in: <span className="font-semibold">{formatTimeRemaining(lockedUntil)}</span>
            </span>
          </div>
        )}
        
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2">
            {onViewAlternatives && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAlternatives}
                className="text-xs"
              >
                View Similar Properties
              </Button>
            )}
            
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-xs"
              >
                Dismiss
              </Button>
            )}
            
            {type === 'payment_in_progress' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-xs"
              >
                Refresh Status
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Preset conflict alerts for common scenarios
export const ConflictPresets = {
  PaymentInProgress: (props: Partial<ConflictAlertProps>) => (
    <ConflictAlert type="payment_in_progress" {...props} />
  ),
  
  PropertyLocked: (lockedUntil: Date, props?: Partial<ConflictAlertProps>) => (
    <ConflictAlert 
      type="property_locked" 
      lockedUntil={lockedUntil}
      {...props} 
    />
  ),
  
  AlreadyRented: (propertyTitle: string, props?: Partial<ConflictAlertProps>) => (
    <ConflictAlert 
      type="already_rented" 
      propertyTitle={propertyTitle}
      showActions={false}
      {...props} 
    />
  ),
  
  BoundaryDuplicate: (props: Partial<ConflictAlertProps>) => (
    <ConflictAlert 
      type="boundary_duplicate"
      message="Our system detected that this property may already be listed. Please verify the property boundaries and details."
      {...props} 
    />
  ),
};