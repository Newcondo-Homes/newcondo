'use client';

import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/card';
import { Badge } from '@newcondo/ui/badge';
import { Progress } from '@newcondo/ui/progress';
import { Button } from '@newcondo/ui/button';
import { DocumentType, DocumentStatus, VerificationStatus } from '@newcondo/db';

interface DocumentVerificationStatusProps {
  userVerificationStatus: VerificationStatus;
  documents: Array<{
    id: string;
    documentType: DocumentType;
    status: DocumentStatus;
    isRequired: boolean;
    verificationNotes?: string | null;
  }>;
  onUploadDocument?: (documentType: DocumentType) => void;
  onViewDocument?: (documentId: string) => void;
  className?: string;
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

const REQUIRED_DOCUMENTS: DocumentType[] = [
  'NIN',
  'SELFIE',
  'OWNERSHIP_DOCUMENT',
  'CONSENT_DOCUMENT',
  'UNDERTAKING_DOCUMENT'
];

const STATUS_ICONS = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  EXPIRED: AlertTriangle
};

const STATUS_COLORS = {
  PENDING: 'text-yellow-600 bg-yellow-100',
  APPROVED: 'text-green-600 bg-green-100',
  REJECTED: 'text-red-600 bg-red-100',
  EXPIRED: 'text-gray-600 bg-gray-100'
};

const VERIFICATION_STATUS_CONFIG = {
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Verification Pending',
    description: 'Your documents are being reviewed by our team'
  },
  VERIFIED: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Verified',
    description: 'Your account has been successfully verified'
  },
  REJECTED: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Verification Rejected',
    description: 'Some documents were rejected. Please resubmit.'
  }
};

export function DocumentVerificationStatus({
  userVerificationStatus,
  documents,
  onUploadDocument,
  onViewDocument,
  className
}: DocumentVerificationStatusProps) {
  const verificationConfig = VERIFICATION_STATUS_CONFIG[userVerificationStatus];
  const VerificationIcon = verificationConfig.icon;

  // Calculate verification progress
  const requiredDocuments = REQUIRED_DOCUMENTS;
  const submittedDocuments = documents.filter(doc =>
    requiredDocuments.includes(doc.documentType)
  );
  const approvedDocuments = submittedDocuments.filter(doc =>
    doc.status === 'APPROVED'
  );
  
  const progress = requiredDocuments.length > 0
    ? (approvedDocuments.length / requiredDocuments.length) * 100
    : 0;

  const missingDocuments = requiredDocuments.filter(docType =>
    !documents.some(doc => doc.documentType === docType)
  );

  const rejectedDocuments = documents.filter(doc =>
    doc.status === 'REJECTED' && doc.isRequired
  );

  const pendingDocuments = documents.filter(doc =>
    doc.status === 'PENDING' && doc.isRequired
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Document Verification Status</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${verificationConfig.color}`}>
          <div className="flex items-center space-x-3 mb-2">
            <VerificationIcon className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">{verificationConfig.label}</h3>
              <p className="text-sm opacity-90">{verificationConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Verification Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {approvedDocuments.length} of {requiredDocuments.length} required documents approved
          </p>
        </div>

        {/* Missing Documents */}
        {missingDocuments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-red-700">
              Missing Required Documents
            </h4>
            <div className="space-y-2">
              {missingDocuments.map((docType) => (
                <div
                  key={docType}
                  className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {DOCUMENT_TYPE_LABELS[docType]}
                    </span>
                  </div>
                  {onUploadDocument && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUploadDocument(docType)}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Upload
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Documents */}
        {rejectedDocuments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-red-700">
              Rejected Documents
            </h4>
            <div className="space-y-2">
              {rejectedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-red-800">
                          {DOCUMENT_TYPE_LABELS[doc.documentType]}
                        </span>
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {doc.verificationNotes || 'No reason provided.'}
                        </p>
                      </div>
                    </div>
                    {onUploadDocument && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUploadDocument(doc.documentType)}
                        className="text-red-700 border-red-300 hover:bg-red-100"
                      >
                        Re-upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Documents */}
        {pendingDocuments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-yellow-700">
              Documents Under Review
            </h4>
            <div className="space-y-2">
              {pendingDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border border-yellow-200 rounded-lg bg-yellow-50"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Documents */}
        {approvedDocuments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-green-700">
              Approved Documents
            </h4>
            <div className="space-y-2">
              {approvedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border border-green-200 rounded-lg bg-green-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {DOCUMENT_TYPE_LABELS[doc.documentType]}
                      </span>
                    </div>
                    {onViewDocument && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDocument(doc.id)}
                        className="text-green-700 hover:bg-green-100"
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}