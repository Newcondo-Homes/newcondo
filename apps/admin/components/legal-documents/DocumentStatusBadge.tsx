'use client';

import React from 'react';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileX,
  Shield,
  FileCheck,
  Zap
} from 'lucide-react';
import { cn } from '@newcondo/ui/lib/utils';

export type DocumentStatus = 
  | 'PENDING'
  | 'APPROVED' 
  | 'REJECTED'
  | 'EXPIRED'
  | 'UNDER_REVIEW'
  | 'REQUIRES_SIGNATURE'
  | 'SIGNED'
  | 'VERIFIED'
  | 'INCOMPLETE'
  | 'ARCHIVED';

export type DocumentType = 
  | 'NIN'
  | 'BVN'
  | 'PASSPORT'
  | 'VOTERS_CARD'
  | 'DRIVERS_LICENSE'
  | 'SELFIE'
  | 'OWNERSHIP_DOCUMENT'
  | 'CONSENT_DOCUMENT'
  | 'UNDERTAKING_DOCUMENT'
  | 'BUSINESS_REGISTRATION'
  | 'TAX_CERTIFICATE'
  | 'UTILITY_BILL'
  | 'BANK_STATEMENT'
  | 'OTHER';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  documentType?: DocumentType;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
  expiresAt?: Date;
  isUrgent?: boolean;
  isDigitallySigned?: boolean;
}

export default function DocumentStatusBadge({
  status,
  documentType,
  size = 'default',
  showIcon = true,
  className,
  expiresAt,
  isUrgent = false,
  isDigitallySigned = false
}: DocumentStatusBadgeProps) {
  const getStatusConfig = (status: DocumentStatus) => {
    const baseConfig = {
      label: status.replace('_', ' '),
      icon: Clock,
      variant: 'secondary' as const,
      className: ''
    };

    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
        return {
          ...baseConfig,
          label: status === 'VERIFIED' ? 'Verified' : 'Approved',
          icon: CheckCircle2,
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300'
        };

      case 'REJECTED':
        return {
          ...baseConfig,
          label: 'Rejected',
          icon: XCircle,
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
        };

      case 'PENDING':
        return {
          ...baseConfig,
          label: 'Pending Review',
          icon: Clock,
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'
        };

      case 'UNDER_REVIEW':
        return {
          ...baseConfig,
          label: 'Under Review',
          icon: AlertTriangle,
          variant: 'secondary' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300'
        };

      case 'EXPIRED':
        return {
          ...baseConfig,
          label: 'Expired',
          icon: FileX,
          variant: 'secondary' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
        };

      case 'REQUIRES_SIGNATURE':
        return {
          ...baseConfig,
          label: 'Requires Signature',
          icon: FileCheck,
          variant: 'secondary' as const,
          className: 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300'
        };

      case 'SIGNED':
        return {
          ...baseConfig,
          label: 'Signed',
          icon: Shield,
          variant: 'default' as const,
          className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-300'
        };

      case 'INCOMPLETE':
        return {
          ...baseConfig,
          label: 'Incomplete',
          icon: AlertTriangle,
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'
        };

      case 'ARCHIVED':
        return {
          ...baseConfig,
          label: 'Archived',
          icon: FileX,
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
        };

      default:
        return baseConfig;
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  // Check if document is expiring soon
  const isExpiringSoon = expiresAt && expiresAt > new Date() && 
    (expiresAt.getTime() - new Date().getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days

  // Override styling for urgent or expiring documents
  let finalClassName = config.className;
  let finalLabel = config.label;

  if (isUrgent && status === 'PENDING') {
    finalClassName = 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300 animate-pulse';
    finalLabel = 'Urgent Review';
  }

  if (isExpiringSoon && status === 'APPROVED') {
    finalClassName = 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300';
    finalLabel = 'Expiring Soon';
  }

  return (
    <div className="flex items-center gap-1">
      <Badge
        variant={config.variant}
        className={cn(
          finalClassName,
          size === 'sm' && 'px-2 py-0.5 text-xs',
          size === 'lg' && 'px-3 py-1 text-sm',
          className
        )}
      >
        {showIcon && (
          <IconComponent 
            className={cn(
              size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
              'mr-1'
            )} 
          />
        )}
        {finalLabel}
      </Badge>

      {/* Additional indicators */}
      {isDigitallySigned && (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0.5 text-xs"
        >
          <Shield className="h-3 w-3 mr-1" />
          Signed
        </Badge>
      )}

      {isUrgent && status !== 'PENDING' && (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 px-1.5 py-0.5 text-xs animate-pulse"
        >
          <Zap className="h-3 w-3 mr-1" />
          Urgent
        </Badge>
      )}

      {expiresAt && status === 'APPROVED' && (
        <Badge
          variant="outline"
          className={cn(
            "px-1.5 py-0.5 text-xs",
            isExpiringSoon
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : "bg-gray-50 text-gray-700 border-gray-200"
          )}
        >
          Expires: {expiresAt.toLocaleDateString()}
        </Badge>
      )}
    </div>
  );
}

// Helper function to get appropriate document type label
export function getDocumentTypeLabel(documentType: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    'NIN': 'National ID (NIN)',
    'BVN': 'Bank Verification Number',
    'PASSPORT': 'Passport',
    'VOTERS_CARD': "Voter's Card",
    'DRIVERS_LICENSE': "Driver's License",
    'SELFIE': 'Identity Selfie',
    'OWNERSHIP_DOCUMENT': 'Property Ownership',
    'CONSENT_DOCUMENT': 'Consent Form',
    'UNDERTAKING_DOCUMENT': 'Legal Undertaking',
    'BUSINESS_REGISTRATION': 'Business Registration',
    'TAX_CERTIFICATE': 'Tax Certificate',
    'UTILITY_BILL': 'Utility Bill',
    'BANK_STATEMENT': 'Bank Statement',
    'OTHER': 'Other Document'
  };

  return labels[documentType] || documentType;
}

// Helper function to determine if a document type requires expiration tracking
export function requiresExpirationDate(documentType: DocumentType): boolean {
  const expiringDocuments: DocumentType[] = [
    'PASSPORT',
    'DRIVERS_LICENSE',
    'TAX_CERTIFICATE',
    'UTILITY_BILL',
    'BANK_STATEMENT'
  ];

  return expiringDocuments.includes(documentType);
}

// Helper function to get document priority
export function getDocumentPriority(documentType: DocumentType): 'low' | 'medium' | 'high' | 'critical' {
  const priorities: Record<DocumentType, 'low' | 'medium' | 'high' | 'critical'> = {
    'NIN': 'critical',
    'BVN': 'high',
    'PASSPORT': 'high',
    'VOTERS_CARD': 'medium',
    'DRIVERS_LICENSE': 'medium',
    'SELFIE': 'critical',
    'OWNERSHIP_DOCUMENT': 'critical',
    'CONSENT_DOCUMENT': 'high',
    'UNDERTAKING_DOCUMENT': 'high',
    'BUSINESS_REGISTRATION': 'high',
    'TAX_CERTIFICATE': 'medium',
    'UTILITY_BILL': 'low',
    'BANK_STATEMENT': 'low',
    'OTHER': 'low'
  };

  return priorities[documentType] || 'low';
}