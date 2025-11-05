// apps/platform/components/properties/PropertyStatusBadge.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface PropertyStatusBadgeProps {
  status: string;
  adminApprovalStatus: string;
  isAvailable: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function PropertyStatusBadge({
  status,
  adminApprovalStatus,
  isAvailable,
  showIcon = true,
  size = 'default',
  className,
}: PropertyStatusBadgeProps) {
  const getStatusConfig = () => {
    // Check admin approval first
    if (adminApprovalStatus === 'REJECTED') {
      return {
        label: 'Rejected',
        icon: XCircle,
        variant: 'destructive' as const,
        className: '',
      };
    }

    if (adminApprovalStatus === 'PENDING') {
      return {
        label: 'Pending Approval',
        icon: Clock,
        variant: 'outline' as const,
        className: 'border-yellow-500 bg-yellow-50 text-yellow-700',
      };
    }

    // Then check property status
    switch (status) {
      case 'PUBLISHED':
        if (!isAvailable) {
          return {
            label: 'Unavailable',
            icon: EyeOff,
            variant: 'outline' as const,
            className: 'border-gray-500 bg-gray-50 text-gray-700',
          };
        }
        return {
          label: 'Published',
          icon: CheckCircle,
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600',
        };

      case 'RENTED':
        return {
          label: 'Rented',
          icon: CheckCircle,
          variant: 'default' as const,
          className: 'bg-blue-500 hover:bg-blue-600',
        };

      case 'DRAFT':
        return {
          label: 'Draft',
          icon: FileText,
          variant: 'outline' as const,
          className: 'border-gray-500 bg-gray-50 text-gray-700',
        };

      case 'PENDING':
        return {
          label: 'Pending',
          icon: Clock,
          variant: 'outline' as const,
          className: 'border-yellow-500 bg-yellow-50 text-yellow-700',
        };

      case 'UNAVAILABLE':
        return {
          label: 'Unavailable',
          icon: EyeOff,
          variant: 'outline' as const,
          className: 'border-orange-500 bg-orange-50 text-orange-700',
        };

      default:
        return {
          label: status,
          icon: AlertCircle,
          variant: 'outline' as const,
          className: '',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs h-5',
    default: 'text-sm h-6',
    lg: 'text-base h-7',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        sizeClasses[size],
        config.className,
        showIcon && 'gap-1',
        className
      )}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {config.label}
    </Badge>
  );
}