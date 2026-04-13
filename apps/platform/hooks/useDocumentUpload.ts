import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
// import { useUploadThing } from '@uploadthing/react';
import { useUploadThing } from '@/lib/uploadthing';
import { documentsApi } from '@/lib/api/documents';
import { useLegalStore } from '@/store/legalStore';
import type { OurFileRouter } from '@/lib/uploadthing';
import type {
  DocumentUpload,
  DocumentFilter,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentVerificationRequest,
  DocumentShareRequest,
  DocumentSignature,
  DocumentMetadata,
  DocumentUploadProgress,
} from '@/types/documents';
import type { DocumentType, DocumentSide } from '@newcondo/db';
import { toast } from '@newcondo/ui';

interface UseDocumentUploadOptions {
  onSuccess?: (uploadedDocument: any) => void;
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

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  documentType?: DocumentType;
}

export const useDocumentUpload = (options: UseDocumentUploadOptions = {}) => {
  const {
    onSuccess,
    onError,
    maxFileSize = 10, // 10MB default
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    propertyId,
    userId,
  } = options;

  const { setUploadProgress, clearUploadProgress } = useLegalStore();
  const [uploadQueue, setUploadQueue] = useState<DocumentFile[]>([]);

  // UploadThing hook for file uploads permittedFileInfo: routeConfig
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

  // Validate file before upload
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${maxFileSize}MB`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }, [maxFileSize, allowedTypes]);

  // Process document metadata
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
    }
  });

  // Main upload function
  const uploadDocument = useCallback(async (
    files: File[],
    documentType: DocumentType,
    options: DocumentUploadOptions = {}
  ) => {
    try {
      // Validate all files first
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.error}`);
          return;
        }
      }

      // Add to upload progress tracking
      files.forEach((file) => {
        setUploadProgress(file.name, {
          documentId: file.name,
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        });
      });

      // Upload files to UploadThing
      const uploadedFiles = await startUpload(files);

      if (!uploadedFiles) {
        throw new Error('Upload failed');
      }

      // Process each uploaded file
      for (let i = 0; i < uploadedFiles.length; i++) {
        const uploadedFile = uploadedFiles[i];
        const originalFile = files[i];

        await processDocumentMutation.mutateAsync({
          fileUrl: uploadedFile.url,
          documentType,
          documentSide: options.documentSide,
          pageNumber: options.pageNumber || (i + 1),
          documentNumber: options.documentNumber,
          propertyId: propertyId || options.propertyId,
          fileName: originalFile.name,
          fileSizeBytes: originalFile.size,
          mimeType: originalFile.type,
          userId: userId ?? '',
        });

        // updateUploadProgress(originalFile.name, 100, 'completed');

        setUploadProgress(originalFile.name, {
          documentId: originalFile.name,
          fileName: originalFile.name,
          progress: 100,
          status: 'completed',
        });
      }

    } catch (error) {
      files.forEach((file) => {
        setUploadProgress(file.name, {
          documentId: file.name,
          fileName: file.name,
          progress: 0,
          status: 'failed',
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
    onError
  ]);

  // Upload single document
  const uploadSingleDocument = useCallback((
    file: File,
    documentType: DocumentType,
    options: DocumentUploadOptions = {}
  ) => {
    return uploadDocument([file], documentType, options);
  }, [uploadDocument]);

  // Upload multiple pages of the same document
  const uploadMultiPageDocument = useCallback((
    files: File[],
    documentType: DocumentType,
    options: Omit<DocumentUploadOptions, 'pageNumber'> = {}
  ) => {
    return uploadDocument(files, documentType, options);
  }, [uploadDocument]);

  // Upload document with front and back sides
  const uploadTwoSidedDocument = useCallback(async (
    frontFile: File,
    backFile: File,
    documentType: DocumentType,
    options: Omit<DocumentUploadOptions, 'documentSide'> = {}
  ) => {
    try {
      // Upload front side
      await uploadDocument([frontFile], documentType, {
        ...options,
        documentSide: 'FRONT' as DocumentSide
      });

      // Upload back side
      await uploadDocument([backFile], documentType, {
        ...options,
        documentSide: 'BACK' as DocumentSide
      });
    } catch (error) {
      onError?.(error as Error);
    }
  }, [uploadDocument, onError]);

  // Add to upload queue
  const addToQueue = useCallback((documentFile: DocumentFile) => {
    setUploadQueue(prev => [...prev, documentFile]);
  }, []);

  // Process upload queue
  const processQueue = useCallback(async () => {
    if (uploadQueue.length === 0) return;

    for (const docFile of uploadQueue) {
      try {
        await uploadDocument([docFile.file], docFile.documentType, docFile.options);
      } catch (error) {
        console.error(`Failed to upload ${docFile.file.name}:`, error);
      }
    }

    setUploadQueue([]);
  }, [uploadQueue, uploadDocument]);

  // Clear upload queue
  const clearQueue = useCallback(() => {
    setUploadQueue([]);
  }, []);

  // Get upload progress for a specific file
  const getUploadProgress = useCallback((fileName: string): UploadProgress | null => {
    return useLegalStore.getState().uploadProgress[fileName] || null;
  }, []);

  return {
    // Main upload functions
    uploadDocument,
    uploadSingleDocument,
    uploadMultiPageDocument,
    uploadTwoSidedDocument,

    // Queue management
    addToQueue,
    processQueue,
    clearQueue,
    uploadQueue,

    // State
    isUploading: isUploading || processDocumentMutation.isPending,
    isProcessing: processDocumentMutation.isPending,

    // Utilities
    validateFile,
    getUploadProgress,
    permittedFileInfo: routeConfig,

    // File type helpers
    isImageFile: (file: File) => file.type.startsWith('image/'),
    isPDFFile: (file: File) => file.type === 'application/pdf',

    // Size helpers
    formatFileSize: (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  };
};

// Hook for bulk document operations
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
    inProgress: false
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
      inProgress: true
    });

    let completed = 0;
    let failed = 0;

    for (const { files, documentType, options } of documentFiles) {
      try {
        await uploadDocument(files, documentType, options || {});
        completed++;
      } catch (error) {
        failed++;
        console.error(`Failed to upload documents for type ${documentType}:`, error);
      }

      setBulkProgress(prev => ({
        ...prev,
        completed,
        failed
      }));
    }

    setBulkProgress(prev => ({
      ...prev,
      inProgress: false
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
      inProgress: false
    })
  };
};