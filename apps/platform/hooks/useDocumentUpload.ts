'use client'

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useUploadThing } from '../lib/uploadthing';
import { documentsApi } from '../lib/api/documents';
import { useLegalStore } from '../store/legalStore';
import type { DocumentType, DocumentSide } from '../types/enums';
import { toast } from '@newcondo/ui';

interface UseDocumentUploadOptions {
  onSuccess?: (uploadedDocument: unknown) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  propertyId?: string;
  userId?: string;
}

interface DocumentUploadOptions {
  documentSide?: DocumentSide;
  pageNumber?: number;
  documentNumber?: string;
  propertyId?: string;
}

interface DocumentFile {
  file: File;
  documentType: DocumentType;
  options?: DocumentUploadOptions;
}

// Align with DocumentUploadProgress.status from the store:
// "uploading" | "processing" | "complete" | "error"
// (NOT "completed" or "failed" — those caused the type errors)
interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  documentType?: DocumentType;
}

export const useDocumentUpload = (options: UseDocumentUploadOptions = {}) => {
  const {
    onSuccess,
    onError,
    maxFileSize = 10,
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    propertyId,
    userId,
  } = options;

  const { setUploadProgress, clearUploadProgress } = useLegalStore();
  const [uploadQueue, setUploadQueue] = useState<DocumentFile[]>([]);

  const { startUpload, routeConfig, isUploading } = useUploadThing('propertyDocuments', {
    onClientUploadComplete: (files) => {
      files.forEach((file) => {
        clearUploadProgress(file.name);
      });
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      onError?.(error);
    },
  });

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${maxFileSize}MB`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`,
      };
    }

    return { isValid: true };
  }, [maxFileSize, allowedTypes]);

  const processDocumentMutation = useMutation({
    mutationFn: async (payload: {
      fileUrl: string;
      documentType: DocumentType;
      documentSide?: DocumentSide;
      pageNumber?: number;
      documentNumber?: string;
      propertyId?: string;
      fileName: string;
      fileSizeBytes: number;
      mimeType: string;
      userId: string;
    }) => {
      return documentsApi.createDocument(payload);
    },
    onSuccess: (document) => {
      toast.success('Document uploaded and processed successfully');
      onSuccess?.(document);
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to process document';
      toast.error(errorMsg);
      onError?.(error as Error);
    },
  });

  const uploadDocument = useCallback(async (
    files: File[],
    documentType: DocumentType,
    uploadOptions: DocumentUploadOptions = {}
  ) => {
    try {
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.error}`);
          return;
        }
      }

      files.forEach((file) => {
        setUploadProgress(file.name, {
          documentId: file.name,
          fileName: file.name,
          progress: 0,
          status: 'uploading', // ✓ matches DocumentUploadProgress
        });
      });

      const uploadedFiles = await startUpload(files);

      if (!uploadedFiles) {
        throw new Error('Upload failed');
      }

      for (let i = 0; i < uploadedFiles.length; i++) {
        const uploadedFile = uploadedFiles[i];
        const originalFile = files[i];

        await processDocumentMutation.mutateAsync({
          fileUrl: uploadedFile.url,
          documentType,
          documentSide: uploadOptions.documentSide,
          pageNumber: uploadOptions.pageNumber || (i + 1),
          documentNumber: uploadOptions.documentNumber,
          propertyId: propertyId || uploadOptions.propertyId,
          fileName: originalFile.name,
          fileSizeBytes: originalFile.size,
          mimeType: originalFile.type,
          userId: userId ?? '',
        });

        setUploadProgress(originalFile.name, {
          documentId: originalFile.name,
          fileName: originalFile.name,
          progress: 100,
          status: 'complete', // ✓ was "completed" — fixed to match DocumentUploadProgress
        });
      }

    } catch (error) {
      files.forEach((file) => {
        setUploadProgress(file.name, {
          documentId: file.name,
          fileName: file.name,
          progress: 0,
          status: 'error', // ✓ was "failed" — fixed to match DocumentUploadProgress
        });
      });

      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMsg);
      onError?.(error as Error);
    }
  }, [
    validateFile,
    startUpload,
    processDocumentMutation,
    setUploadProgress,
    propertyId,
    userId,
    onError,
  ]);

  const uploadSingleDocument = useCallback((
    file: File,
    documentType: DocumentType,
    uploadOptions: DocumentUploadOptions = {}
  ) => {
    return uploadDocument([file], documentType, uploadOptions);
  }, [uploadDocument]);

  const uploadMultiPageDocument = useCallback((
    files: File[],
    documentType: DocumentType,
    uploadOptions: Omit<DocumentUploadOptions, 'pageNumber'> = {}
  ) => {
    return uploadDocument(files, documentType, uploadOptions);
  }, [uploadDocument]);

  const uploadTwoSidedDocument = useCallback(async (
    frontFile: File,
    backFile: File,
    documentType: DocumentType,
    uploadOptions: Omit<DocumentUploadOptions, 'documentSide'> = {}
  ) => {
    try {
      await uploadDocument([frontFile], documentType, {
        ...uploadOptions,
        documentSide: 'FRONT' as DocumentSide,
      });

      await uploadDocument([backFile], documentType, {
        ...uploadOptions,
        documentSide: 'BACK' as DocumentSide,
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [uploadDocument, onError]);

  const addToQueue = useCallback((documentFile: DocumentFile) => {
    setUploadQueue(prev => [...prev, documentFile]);
  }, []);

  const processQueue = useCallback(async () => {
    if (uploadQueue.length === 0) return;

    for (const docFile of uploadQueue) {
      try {
        await uploadDocument([docFile.file], docFile.documentType, docFile.options || {});
      } catch (error) {
        console.error(`Failed to upload ${docFile.file.name}:`, error);
      }
    }

    setUploadQueue([]);
  }, [uploadQueue, uploadDocument]);

  const clearQueue = useCallback(() => {
    setUploadQueue([]);
  }, []);

  const getUploadProgress = useCallback((fileName: string): UploadProgress | null => {
    const entry = useLegalStore.getState().uploadProgress[fileName];
    if (!entry) return null;
    return {
      fileName: entry.fileName,
      progress: entry.progress,
      status: entry.status,
      documentType: undefined,
    };
  }, []);

  return {
    uploadDocument,
    uploadSingleDocument,
    uploadMultiPageDocument,
    uploadTwoSidedDocument,

    addToQueue,
    processQueue,
    clearQueue,
    uploadQueue,

    isUploading: isUploading || processDocumentMutation.isPending,
    isProcessing: processDocumentMutation.isPending,

    validateFile,
    getUploadProgress,
    permittedFileInfo: routeConfig,

    isImageFile: (file: File) => file.type.startsWith('image/'),
    isPDFFile: (file: File) => file.type === 'application/pdf',

    formatFileSize: (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
  };
};

export const useBulkDocumentUpload = (options: UseDocumentUploadOptions = {}) => {
  const [bulkProgress, setBulkProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    inProgress: boolean;
  }>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false,
  });

  const { uploadDocument } = useDocumentUpload(options);

  const uploadBulkDocuments = useCallback(async (
    documentFiles: Array<{
      files: File[];
      documentType: DocumentType;
      options?: DocumentUploadOptions;
    }>
  ) => {
    setBulkProgress({
      total: documentFiles.length,
      completed: 0,
      failed: 0,
      inProgress: true,
    });

    let completed = 0;
    let failed = 0;

    for (const { files, documentType, options: docOptions } of documentFiles) {
      try {
        await uploadDocument(files, documentType, docOptions || {});
        completed++;
      } catch (error) {
        failed++;
        console.error(`Failed to upload documents for type ${documentType}:`, error);
      }

      setBulkProgress(prev => ({
        ...prev,
        completed,
        failed,
      }));
    }

    setBulkProgress(prev => ({
      ...prev,
      inProgress: false,
    }));

    if (failed === 0) {
      toast.success(`All ${completed} document sets uploaded successfully`);
    } else if (completed > 0) {
      toast.warning(`${completed} uploaded, ${failed} failed`);
    } else {
      toast.error('All uploads failed');
    }
  }, [uploadDocument]);

  return {
    uploadBulkDocuments,
    bulkProgress,
    resetBulkProgress: () => setBulkProgress({
      total: 0,
      completed: 0,
      failed: 0,
      inProgress: false,
    }),
  };
};