'use client';

import React from 'react';
import { Calendar, Clock, Lock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Badge } from '@newcondo/ui/components/badge';
import { cn } from '@newcondo/ui/';

interface PropertyAvailabilityBadgeProps {
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED' | 'RENTED' | 'UNAVAILABLE' | 'PAYMENT_LOCKED' | 'PUBLISHED';
  availableFrom?: Date | string;
  paymentLockExpiry?: Date | string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  isAvailable?: boolean;
  structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  availableUnits?: number;
  totalUnits?: number;
}

interface AvailabilityConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  textColor: string;
}

const PropertyAvailabilityBadge: React.FC<PropertyAvailabilityBadgeProps> = ({
  status,
  availableFrom,
  paymentLockExpiry,
  className = '',
  showIcon = true,
  size = 'md',
  variant = 'default'
}) => {
  // Helper function to format date
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Available now';
    } else if (diffDays === 0) {
      return 'Available today';
    } else if (diffDays === 1) {
      return 'Available tomorrow';
    } else if (diffDays <= 7) {
      return `Available in ${diffDays} days`;
    } else {
      return `Available ${dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: diffDays > 365 ? 'numeric' : undefined
      })}`;
    }
  };

  // Helper function to check if payment lock is expiring soon
  const isPaymentLockExpiringSoon = (): boolean => {
    if (!paymentLockExpiry) return false;
    const expiryDate = typeof paymentLockExpiry === 'string' ? new Date(paymentLockExpiry) : paymentLockExpiry;
    const now = new Date();
    const diffMinutes = (expiryDate.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes <= 30 && diffMinutes > 0; // Expiring within 30 minutes
  };

  // Configuration for different availability statuses
  const getStatusConfig = (): AvailabilityConfig => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: availableFrom ? formatDate(availableFrom) : 'Available',
          icon: <CheckCircle className="w-3 h-3" />,
          color: 'bg-green-100 text-green-800 border-green-200',
          bgColor: 'bg-green-500',
          textColor: 'text-green-700'
        };

      case 'PUBLISHED':
        return {
          label: 'Available',
          icon: <CheckCircle className="w-3 h-3" />,
          color: 'bg-green-100 text-green-800 border-green-200',
          bgColor: 'bg-green-500',
          textColor: 'text-green-700'
        };

      case 'PAYMENT_LOCKED':
        const expiringSoon = isPaymentLockExpiringSoon();
        return {
          label: expiringSoon ? 'Payment pending (expires soon)' : 'Payment pending',
          icon: <Lock className="w-3 h-3" />,
          color: expiringSoon
            ? 'bg-orange-100 text-orange-800 border-orange-200'
            : 'bg-yellow-100 text-yellow-800 border-yellow-200',
          bgColor: expiringSoon ? 'bg-orange-500' : 'bg-yellow-500',
          textColor: expiringSoon ? 'text-orange-700' : 'text-yellow-700'
        };

      case 'RESERVED':
        return {
          label: 'Reserved',
          icon: <Clock className="w-3 h-3" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          bgColor: 'bg-blue-500',
          textColor: 'text-blue-700'
        };

      case 'OCCUPIED':
      case 'RENTED':
        return {
          label: 'Occupied',
          icon: <XCircle className="w-3 h-3" />,
          color: 'bg-red-100 text-red-800 border-red-200',
          bgColor: 'bg-red-500',
          textColor: 'text-red-700'
        };

      case 'MAINTENANCE':
        return {
          label: 'Under maintenance',
          icon: <AlertCircle className="w-3 h-3" />,
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          bgColor: 'bg-orange-500',
          textColor: 'text-orange-700'
        };

      case 'UNAVAILABLE':
      default:
        return {
          label: 'Unavailable',
          icon: <XCircle className="w-3 h-3" />,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          bgColor: 'bg-gray-500',
          textColor: 'text-gray-700'
        };
    }
  };

  const config = getStatusConfig();

  // Size configurations
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  // Variant configurations
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return `border ${config.color.replace('bg-', 'border-').replace('text-', 'text-')} bg-transparent`;
      case 'secondary':
        return `bg-gray-100 text-gray-800 border-gray-200`;
      default:
        return config.color;
    }
  };

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border',
        sizeClasses[size],
        getVariantClasses(),
        className
      )}
    >
      {showIcon && config.icon}
      <span className="whitespace-nowrap">{config.label}</span>

      {/* Show countdown for payment lock expiry */}
      {status === 'PAYMENT_LOCKED' && paymentLockExpiry && (
        <PaymentLockCountdown expiryDate={paymentLockExpiry} />
      )}
    </Badge>
  );
};

// Component for payment lock countdown
interface PaymentLockCountdownProps {
  expiryDate: Date | string;
}

const PaymentLockCountdown: React.FC<PaymentLockCountdownProps> = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    const updateCountdown = () => {
      const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
      const now = new Date();
      const diffMs = expiry.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor(diffMs / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  if (!timeLeft || timeLeft === 'Expired') {
    return null;
  }

  return (
    <span className="text-xs font-mono bg-white bg-opacity-50 px-1 rounded">
      {timeLeft}
    </span>
  );
};

export default PropertyAvailabilityBadge;