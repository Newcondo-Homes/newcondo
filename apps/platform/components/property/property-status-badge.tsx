// apps/platform/components/property/property-status-badge.tsx
import React from 'react';
import { Badge } from '@newcondo/ui';
import { cn } from '@/lib/utils';

type PropertyStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'RENTED' | 'UNAVAILABLE';

interface PropertyStatusBadgeProps {
  status: PropertyStatus;
  className?: string;
}

const statusConfig: Record<PropertyStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}> = {
  DRAFT: {
    label: 'Draft',
    variant: 'outline',
    className: 'border-gray-300 text-gray-600 bg-gray-50'
  },
  PENDING: {
    label: 'Pending Review',
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  PUBLISHED: {
    label: 'Published',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  RENTED: {
    label: 'Rented',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200'
  }
};

export const PropertyStatusBadge: React.FC<PropertyStatusBadgeProps> = ({ 
  status, 
  className 
}) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'font-medium px-2.5 py-0.5 text-xs',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};

// Helper function to get status color for other UI elements
export const getStatusColor = (status: PropertyStatus): string => {
  const colorMap: Record<PropertyStatus, string> = {
    DRAFT: 'gray',
    PENDING: 'yellow',
    PUBLISHED: 'green',
    RENTED: 'blue',
    UNAVAILABLE: 'red'
  };
  return colorMap[status];
};

// Helper function to check if property can be edited
export const canEditProperty = (status: PropertyStatus): boolean => {
  return ['DRAFT', 'PENDING'].includes(status);
};

// Helper function to check if property is available for rent
export const isPropertyAvailable = (status: PropertyStatus): boolean => {
  return status === 'PUBLISHED';
};

export default PropertyStatusBadge;