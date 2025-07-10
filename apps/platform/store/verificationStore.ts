// apps/platform/store/verificationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { VerificationDocument, VerificationProgress, FileUploadState } from '../types/verification';
import { DocumentType, DocumentStatus, VerificationStatus } from '@newcondo/db';
import { verificationAPI } from '../lib/api/verification';

interface VerificationStore {
  // State
  verificationProgress: VerificationProgress | null;
  documents: VerificationDocument[];
  uploadStates: Record<string, FileUploadState>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchVerificationStatus: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, documentType: DocumentType, documentSide?: string) => Promise<string>;
  submitDocumentNumber: (documentType: DocumentType, documentNumber: string) => Promise<void>;
  submitVerification: (documents: any[]) => Promise<void>;
  reSubmitDocuments: (rejectedDocumentIds: string[], documents: any[]) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  updateUploadState: (key: string, state: Partial<FileUploadState>) => void;
  clearError: () => void;
  reset: () => void;
}

const initialUploadState: FileUploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  uploadedUrl: null,
};

export const useVerificationStore = create<VerificationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      verificationProgress: null,
      documents: [],
      uploadStates: {},
      isLoading: false,
      error: null,

      // Actions
      fetchVerificationStatus: async () => {
        try {
          set({ isLoading: true, error: null });
          const progress = await verificationAPI.getVerificationStatus();
          set({ verificationProgress: progress });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch verification status' });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchDocuments: async () => {
        try {
          set({ isLoading: true, error: null });
          const documents = await verificationAPI.getDocuments();
          set({ documents });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch documents' });
        } finally {
          set({ isLoading: false });
        }
      },

      uploadDocument: async (file: File, documentType: DocumentType, documentSide?: string) => {
        const uploadKey = `${documentType}${documentSide ? `_${documentSide}` : ''}`;
        
        try {
          // Initialize upload state
          set(state => ({
            uploadStates: {
              ...state.uploadStates,
              [uploadKey]: { ...initialUploadState, isUploading: true }
            }
          }));

          const result = await verificationAPI.uploadFile(file, documentType, documentSide);
          
          // Update upload state with success
          set(state => ({
            uploadStates: {
              ...state.uploadStates,
              [uploadKey]: {
                ...initialUploadState,
                uploadedUrl: result.fileUrl
              }
            }
          }));

          return result.fileUrl;
        } catch (error) {
          // Update upload state with error
          set(state => ({
            uploadStates: {
              ...state.uploadStates,
              [uploadKey]: {
                ...initialUploadState,
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            }
          }));
          throw error;
        }
      },

      submitDocumentNumber: async (documentType: DocumentType, documentNumber: string) => {
        try {
          set({ isLoading: true, error: null });
          await verificationAPI.submitDocumentNumber(documentType, documentNumber);
          
          // Refresh documents and status
          await Promise.all([
            get().fetchDocuments(),
            get().fetchVerificationStatus()
          ]);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to submit document number' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      submitVerification: async (documents: any[]) => {
        try {
          set({ isLoading: true, error: null });
          await verificationAPI.submitDocuments(documents);
          
          // Refresh documents and status
          await Promise.all([
            get().fetchDocuments(),
            get().fetchVerificationStatus()
          ]);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to submit verification' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      reSubmitDocuments: async (rejectedDocumentIds: string[], documents: any[]) => {
        try {
          set({ isLoading: true, error: null });
          await verificationAPI.reSubmitDocuments(rejectedDocumentIds, documents);
          
          // Refresh documents and status
          await Promise.all([
            get().fetchDocuments(),
            get().fetchVerificationStatus()
          ]);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to re-submit documents' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteDocument: async (documentId: string) => {
        try {
          set({ isLoading: true, error: null });
          await verificationAPI.deleteDocument(documentId);
          
          // Remove document from state
          set(state => ({
            documents: state.documents.filter(doc => doc.id !== documentId)
          }));
          
          // Refresh verification status
          await get().fetchVerificationStatus();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete document' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateUploadState: (key: string, state: Partial<FileUploadState>) => {
        set(currentState => ({
          uploadStates: {
            ...currentState.uploadStates,
            [key]: {
              ...currentState.uploadStates[key],
              ...state
            }
          }
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          verificationProgress: null,
          documents: [],
          uploadStates: {},
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'verification-store',
    }
  )
);