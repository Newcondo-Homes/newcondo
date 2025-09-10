// apps/platform/store/legalStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  LegalDocument, 
  LegalDocumentTemplate, 
  LegalAgreement, 
  DigitalSignatureData,
  DocumentUploadProgress,
  LegalDocumentStatus,
  LegalDocumentType
} from '../types/legal';

interface LegalState {
  // Documents
  documents: LegalDocument[];
  activeDocument: LegalDocument | null;
  templates: LegalDocumentTemplate[];
  
  // Agreements
  agreements: LegalAgreement[];
  pendingAgreements: LegalAgreement[];
  
  // Upload state
  uploadProgress: Record<string, DocumentUploadProgress>;
  
  // UI state
  isLoading: boolean;
  isUploading: boolean;
  selectedDocumentType: LegalDocumentType | null;
  
  // Signatures
  signatures: Record<string, DigitalSignatureData>;
  
  // Error state
  error: string | null;
}

interface LegalActions {
  // Document management
  setDocuments: (documents: LegalDocument[]) => void;
  addDocument: (document: LegalDocument) => void;
  updateDocument: (id: string, updates: Partial<LegalDocument>) => void;
  removeDocument: (id: string) => void;
  setActiveDocument: (document: LegalDocument | null) => void;
  
  // Templates
  setTemplates: (templates: LegalDocumentTemplate[]) => void;
  
  // Agreements
  setAgreements: (agreements: LegalAgreement[]) => void;
  addAgreement: (agreement: LegalAgreement) => void;
  updateAgreement: (id: string, updates: Partial<LegalAgreement>) => void;
  acceptAgreement: (id: string, signature: DigitalSignatureData) => void;
  
  // Upload management
  setUploadProgress: (documentId: string, progress: DocumentUploadProgress) => void;
  clearUploadProgress: (documentId: string) => void;
  
  // Signatures
  addSignature: (documentId: string, signature: DigitalSignatureData) => void;
  removeSignature: (documentId: string) => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setSelectedDocumentType: (type: LegalDocumentType | null) => void;
  setError: (error: string | null) => void;
  
  // Utilities
  getDocumentsByType: (type: LegalDocumentType) => LegalDocument[];
  getDocumentsByStatus: (status: LegalDocumentStatus) => LegalDocument[];
  getPendingDocuments: () => LegalDocument[];
  getRequiredDocuments: () => LegalDocument[];
  isDocumentSigned: (documentId: string) => boolean;
  areAllRequiredDocumentsSigned: () => boolean;
  
  // Reset
  reset: () => void;
  resetError: () => void;
}

type LegalStore = LegalState & LegalActions;

const initialState: LegalState = {
  documents: [],
  activeDocument: null,
  templates: [],
  agreements: [],
  pendingAgreements: [],
  uploadProgress: {},
  isLoading: false,
  isUploading: false,
  selectedDocumentType: null,
  signatures: {},
  error: null,
};

export const useLegalStore = create<LegalStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Document management
        setDocuments: (documents) => set((state) => {
          state.documents = documents;
        }),

        addDocument: (document) => set((state) => {
          state.documents.push(document);
        }),

        updateDocument: (id, updates) => set((state) => {
          const index = state.documents.findIndex(doc => doc.id === id);
          if (index !== -1) {
            Object.assign(state.documents[index], updates);
          }
        }),

        removeDocument: (id) => set((state) => {
          state.documents = state.documents.filter(doc => doc.id !== id);
          if (state.activeDocument?.id === id) {
            state.activeDocument = null;
          }
          delete state.signatures[id];
          delete state.uploadProgress[id];
        }),

        setActiveDocument: (document) => set((state) => {
          state.activeDocument = document;
        }),

        // Templates
        setTemplates: (templates) => set((state) => {
          state.templates = templates;
        }),

        // Agreements
        setAgreements: (agreements) => set((state) => {
          state.agreements = agreements;
          state.pendingAgreements = agreements.filter(
            agreement => !agreement.acceptedAt
          );
        }),

        addAgreement: (agreement) => set((state) => {
          state.agreements.push(agreement);
          if (!agreement.acceptedAt) {
            state.pendingAgreements.push(agreement);
          }
        }),

        updateAgreement: (id, updates) => set((state) => {
          const agreementIndex = state.agreements.findIndex(agreement => agreement.id === id);
          if (agreementIndex !== -1) {
            Object.assign(state.agreements[agreementIndex], updates);
          }

          const pendingIndex = state.pendingAgreements.findIndex(agreement => agreement.id === id);
          if (pendingIndex !== -1) {
            if (updates.acceptedAt) {
              state.pendingAgreements.splice(pendingIndex, 1);
            } else {
              Object.assign(state.pendingAgreements[pendingIndex], updates);
            }
          }
        }),

        acceptAgreement: (id, signature) => set((state) => {
          const now = new Date().toISOString();
          
          // Update agreement
          const agreementIndex = state.agreements.findIndex(agreement => agreement.id === id);
          if (agreementIndex !== -1) {
            state.agreements[agreementIndex].acceptedAt = now;
            state.agreements[agreementIndex].signature = signature;
          }

          // Remove from pending
          state.pendingAgreements = state.pendingAgreements.filter(
            agreement => agreement.id !== id
          );

          // Store signature
          state.signatures[id] = signature;
        }),

        // Upload management
        setUploadProgress: (documentId, progress) => set((state) => {
          state.uploadProgress[documentId] = progress;
        }),

        clearUploadProgress: (documentId) => set((state) => {
          delete state.uploadProgress[documentId];
        }),

        // Signatures
        addSignature: (documentId, signature) => set((state) => {
          state.signatures[documentId] = signature;
        }),

        removeSignature: (documentId) => set((state) => {
          delete state.signatures[documentId];
        }),

        // UI state
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),

        setUploading: (uploading) => set((state) => {
          state.isUploading = uploading;
        }),

        setSelectedDocumentType: (type) => set((state) => {
          state.selectedDocumentType = type;
        }),

        setError: (error) => set((state) => {
          state.error = error;
        }),

        // Utilities
        getDocumentsByType: (type) => {
          return get().documents.filter(doc => doc.documentType === type);
        },

        getDocumentsByStatus: (status) => {
          return get().documents.filter(doc => doc.status === status);
        },

        getPendingDocuments: () => {
          return get().documents.filter(doc => 
            doc.status === 'PENDING' && doc.isRequired
          );
        },

        getRequiredDocuments: () => {
          return get().documents.filter(doc => doc.isRequired);
        },

        isDocumentSigned: (documentId) => {
          return documentId in get().signatures;
        },

        areAllRequiredDocumentsSigned: () => {
          const { documents, signatures } = get();
          const requiredDocs = documents.filter(doc => doc.isRequired);
          
          return requiredDocs.every(doc => {
            const isSigned = doc.id in signatures;
            const isApproved = doc.status === 'APPROVED';
            return isSigned && (isApproved || doc.status === 'PENDING');
          });
        },

        // Reset
        reset: () => set((state) => {
          Object.assign(state, initialState);
        }),

        resetError: () => set((state) => {
          state.error = null;
        }),
      })),
      {
        name: 'newcondo-legal-store',
        partialize: (state) => ({
          documents: state.documents,
          templates: state.templates,
          agreements: state.agreements,
          signatures: state.signatures,
        }),
      }
    ),
    {
      name: 'legal-store',
    }
  )
);

// Selectors for better performance
export const useLegalDocuments = () => useLegalStore((state) => state.documents);
export const useActiveDocument = () => useLegalStore((state) => state.activeDocument);
export const useLegalTemplates = () => useLegalStore((state) => state.templates);
export const useLegalAgreements = () => useLegalStore((state) => state.agreements);
export const usePendingAgreements = () => useLegalStore((state) => state.pendingAgreements);
export const useLegalSignatures = () => useLegalStore((state) => state.signatures);
export const useLegalLoading = () => useLegalStore((state) => state.isLoading);
export const useLegalUploading = () => useLegalStore((state) => state.isUploading);
export const useLegalError = () => useLegalStore((state) => state.error);
export const useUploadProgress = () => useLegalStore((state) => state.uploadProgress);