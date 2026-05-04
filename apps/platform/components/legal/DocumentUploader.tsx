'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Card } from '@newcondo/ui/components/card';
import { Progress } from '@newcondo/ui/components/progress';
import { Badge } from '@newcondo/ui/components/badge';
import { cn } from '@newcondo/ui/lib/utils';
import { DocumentType, DocumentStatus } from '@/types/enums';

interface DocumentFile extends File {
  preview?: string;
  uploadProgress?: number;
  status?: 'uploading' | 'success' | 'error';
  documentId?: string;
}

interface DocumentUploaderProps {
  documentType: DocumentType;
  propertyId?: string;
  onUploadComplete: (documentId: string, url: string) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  existingDocuments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    status: DocumentStatus;
  }>;
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

const FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export function DocumentUploader({
  documentType,
  propertyId,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  acceptedFileTypes = [...FILE_TYPES.image, ...FILE_TYPES.document],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  existingDocuments = []
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  // const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: DocumentFile) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (propertyId) {
      formData.append('propertyId', propertyId);
    }

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }, [documentType, propertyId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        uploadProgress: 0,
        status: 'uploading' as const
      })
    );

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));

    // Start upload for each file
    newFiles.forEach(async (file) => {
      try {

        // setIsUploading(true);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f =>
            f === file && f.uploadProgress !== undefined && f.uploadProgress < 90
              ? { ...f, uploadProgress: f.uploadProgress + 10 }
              : f
          ));
        }, 200);

        const result = await uploadFile(file);

        clearInterval(progressInterval);

        setFiles(prev => prev.map(f =>
          f === file
            ? { ...f, uploadProgress: 100, status: 'success', documentId: result.documentId }
            : f
        ));

        onUploadComplete(result.documentId, result.fileUrl);
      } catch (error) {
        setFiles(prev => prev.map(f =>
          f === file
            ? { ...f, status: 'error', uploadProgress: 0 }
            : f
        ));

        onUploadError(error instanceof Error ? error.message : 'Upload failed');
      }
    });
  }, [documentType, propertyId, maxFiles, onUploadComplete, onUploadError, uploadFile]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    maxFiles,
    multiple: maxFiles > 1
  });

  const removeFile = (fileToRemove: DocumentFile) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {

    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge variant="outline" className={styles[status]}>
        {status.toLowerCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {DOCUMENT_TYPE_LABELS[documentType]}
        </h3>
        {files.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {files.length}/{maxFiles} files
          </span>
        )}
      </div>

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            Existing Documents
          </h4>
          {existingDocuments.map((doc) => (
            <Card key={doc.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{doc.fileName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(doc.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            "hover:border-primary hover:bg-primary/5"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? (
              "Drop files here..."
            ) : (
              <>
                Drag & drop files here, or <span className="text-primary">click to browse</span>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-500">
              {file.name}: {errors.map(e => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}

      {/* Uploading Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center space-x-3">
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm truncate">{file.name}</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file)}
                        disabled={file.status === 'uploading'}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {file.status === 'uploading' && file.uploadProgress !== undefined && (
                    <Progress value={file.uploadProgress} className="h-1" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}