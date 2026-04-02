'use client';

import React from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@newcondo/ui/components/tooltip';
import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

interface LegalDocumentCardProps {
  document: {
    id: string;
    documentType: DocumentType;
    documentSide?: DocumentSide | null;
    fileName?: string | null;
    fileUrl?: string | null;
    documentNumber?: string | null;
    status: DocumentStatus;
    verificationNotes?: string | null;
    isRequired: boolean;
    expiresAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    property?: {
      id: string;
      title: string;
    } | null;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  showPropertyInfo?: boolean;
  showUserInfo?: boolean;
  onView?: (documentId: string) => void;
  onDownload?: (documentId: string, fileUrl: string) => void;
  onResubmit?: (documentId: string) => void;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  NIN: 'National Identity Number',
  BVN: 'Bank Verification Number', 
  PASSPORT: 'International Passport',
  VOTERS_CARD: 'Voter\'s Card',
  DRIVERS_LICENSE: 'Driver\'s License',
  SELFIE: 'Verification Selfie',
  OWNERSHIP_DOCUMENT: 'Proof of Ownership',
  CONSENT_DOCUMENT: 'Consent Document',
  UNDERTAKING_DOCUMENT: 'Legal Undertaking',
  BUSINESS_REGISTRATION: 'Business Registration',
  TAX_CERTIFICATE: 'Tax Certificate',
  UTILITY_BILL: 'Utility Bill',
  BANK_STATEMENT: 'Bank Statement',
  OTHER: 'Other Document'
};

const STATUS_CONFIG = {
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending Review'
  },
  APPROVED: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Approved'
  },
  REJECTED: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejected'
  },
  EXPIRED: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertTriangle,
    label: 'Expired'
  }
};

export function LegalDocumentCard({
  document,
  showPropertyInfo = false,
  showUserInfo = false,
  onView,
  onDownload,
  onResubmit
}: LegalDocumentCardProps) {
  const statusConfig = STATUS_CONFIG[document.status];
  const StatusIcon = statusConfig.icon;
  
  const isExpired = document.expiresAt && new Date(document.expiresAt) < new Date();
  const isExpiringSoon = document.expiresAt && 
    new Date(document.expiresAt) > new Date() && 
    new Date(document.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const handleView = () => {
    if (onView) {
      onView(document.id);
    } else if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (onDownload && document.fileUrl) {
      onDownload(document.id, document.fileUrl);
    } else if (document.fileUrl) {
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.fileName || 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {document.isRequired && document.status === 'REJECTED' && (
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {DOCUMENT_TYPE_LABELS[document.documentType]}
                {document.documentSide && (
                  <span className="text-muted-foreground ml-1">
                    ({document.documentSide.toLowerCase()})
                  </span>
                )}
              </h3>
              {document.fileName && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {document.fileName}
                </p>
              )}
              {document.documentNumber && (
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {document.documentNumber}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {document.isRequired && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This document is required for verification</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Badge 
              variant="outline"
              className={`text-xs border ${statusConfig.color}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Info */}
        {showUserInfo && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{document.user.name || document.user.email}</span>
          </div>
        )}

        {/* Property Info */}
        {showPropertyInfo && document.property && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{document.property.title}</span>
          </div>
        )}

        {/* Expiry Warning */}
        {(isExpired || isExpiringSoon) && (
          <div className={`flex items-center space-x-2 p-2 rounded-lg text-sm ${
            isExpired 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            <AlertTriangle className="h-4 w-4" />
            <span>
              {isExpired 
                ? `Expired ${format(document.expiresAt!, 'MMM dd, yyyy')}` 
                : `Expires ${format(document.expiresAt!, 'MMM dd, yyyy')}`
              }
            </span>
          </div>
        )}

        {/* Verification Notes */}
        {document.verificationNotes && document.status === 'REJECTED' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium mb-1">
              Rejection Reason:
            </p>
            <p className="text-sm text-red-600">
              {document.verificationNotes}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Uploaded {format(document.createdAt, 'MMM dd, yyyy')}</span>
          </div>
          {document.updatedAt > document.createdAt && (
            <span>Updated {format(document.updatedAt, 'MMM dd, yyyy')}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
          {document.fileUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </>
          )}
          
          {document.status === 'REJECTED' && onResubmit && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onResubmit(document.id)}
            >
              Resubmit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}