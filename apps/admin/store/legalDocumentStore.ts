import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface LegalDocument {
  id: string
  userId: string
  propertyId?: string
  documentType: DocumentType
  documentSide?: DocumentSide
  pageNumber?: number
  documentNumber?: string
  fileName?: string
  fileUrl?: string
  fileSizeBytes?: number
  mimeType?: string
  status: DocumentStatus
  verificationNotes?: string
  isRequired: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name: string
    email: string
  }
  property?: {
    id: string
    title: string
    address: string
  }
}

export interface DocumentTemplate {
  id: string
  name: string
  documentType: DocumentType
  content: string
  variables: string[]
  isActive: boolean
  category: string
  createdAt: Date
  updatedAt: Date
}

export interface DigitalSignature {
  id: string
  documentId: string
  userId: string
  signatureData: string
  signedAt: Date
  ipAddress: string
  isValid: boolean
}

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
  | 'OTHER'

export type DocumentSide = 'FRONT' | 'BACK' | 'SINGLE'

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export interface DocumentFilters {
  status?: DocumentStatus[]
  documentType?: DocumentType[]
  userId?: string
  propertyId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  verificationStatus?: string
}

interface LegalDocumentStore {
  // State
  documents: LegalDocument[]
  templates: DocumentTemplate[]
  signatures: DigitalSignature[]
  selectedDocument: LegalDocument | null
  selectedTemplate: DocumentTemplate | null
  filters: DocumentFilters
  loading: boolean
  error: string | null
  
  // Pagination & Search
  currentPage: number
  totalPages: number
  totalItems: number
  searchQuery: string
  sortBy: string
  sortOrder: 'asc' | 'desc'

  // Actions
  setDocuments: (documents: LegalDocument[]) => void
  setTemplates: (templates: DocumentTemplate[]) => void
  setSignatures: (signatures: DigitalSignature[]) => void
  setSelectedDocument: (document: LegalDocument | null) => void
  setSelectedTemplate: (template: DocumentTemplate | null) => void
  setFilters: (filters: DocumentFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPagination: (page: number, totalPages: number, totalItems: number) => void
  setSearchQuery: (query: string) => void
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  
  // Document Actions
  approveDocument: (documentId: string, notes?: string) => void
  rejectDocument: (documentId: string, notes: string) => void
  updateDocumentStatus: (documentId: string, status: DocumentStatus, notes?: string) => void
  addDocument: (document: LegalDocument) => void
  updateDocument: (document: LegalDocument) => void
  removeDocument: (documentId: string) => void
  
  // Template Actions
  addTemplate: (template: DocumentTemplate) => void
  updateTemplate: (template: DocumentTemplate) => void
  removeTemplate: (templateId: string) => void
  
  // Bulk Actions
  bulkApproveDocuments: (documentIds: string[]) => void
  bulkRejectDocuments: (documentIds: string[], notes: string) => void
  bulkUpdateStatus: (documentIds: string[], status: DocumentStatus) => void
  
  // Reset
  reset: () => void
}

const initialState = {
  documents: [],
  templates: [],
  signatures: [],
  selectedDocument: null,
  selectedTemplate: null,
  filters: {},
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  searchQuery: '',
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
}

export const useLegalDocumentStore = create<LegalDocumentStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setDocuments: (documents) => set({ documents }),
      setTemplates: (templates) => set({ templates }),
      setSignatures: (signatures) => set({ signatures }),
      setSelectedDocument: (selectedDocument) => set({ selectedDocument }),
      setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
      setFilters: (filters) => set({ filters }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setPagination: (currentPage, totalPages, totalItems) => 
        set({ currentPage, totalPages, totalItems }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

      approveDocument: (documentId, notes) => {
        const { documents } = get()
        const updatedDocuments = documents.map(doc =>
          doc.id === documentId
            ? { ...doc, status: 'APPROVED' as DocumentStatus, verificationNotes: notes }
            : doc
        )
        set({ documents: updatedDocuments })
      },

      rejectDocument: (documentId, notes) => {
        const { documents } = get()
        const updatedDocuments = documents.map(doc =>
          doc.id === documentId
            ? { ...doc, status: 'REJECTED' as DocumentStatus, verificationNotes: notes }
            : doc
        )
        set({ documents: updatedDocuments })
      },

      updateDocumentStatus: (documentId, status, notes) => {
        const { documents } = get()
        const updatedDocuments = documents.map(doc =>
          doc.id === documentId
            ? { ...doc, status, verificationNotes: notes }
            : doc
        )
        set({ documents: updatedDocuments })
      },

      addDocument: (document) => {
        const { documents } = get()
        set({ documents: [document, ...documents] })
      },

      updateDocument: (updatedDocument) => {
        const { documents } = get()
        const updatedDocuments = documents.map(doc =>
          doc.id === updatedDocument.id ? updatedDocument : doc
        )
        set({ documents: updatedDocuments })
      },

      removeDocument: (documentId) => {
        const { documents } = get()
        set({ documents: documents.filter(doc => doc.id !== documentId) })
      },

      addTemplate: (template) => {
        const { templates } = get()
        set({ templates: [template, ...templates] })
      },

      updateTemplate: (updatedTemplate) => {
        const { templates } = get()
        const updatedTemplates = templates.map(template =>
          template.id === updatedTemplate.id ? updatedTemplate : template
        )
        set({ templates: updatedTemplates })
      },

      removeTemplate: (templateId) => {
        const { templates } = get()
        set({ templates: templates.filter(template => template.id !== templateId) })
      },

      bulkApproveDocuments: (documentIds) => {
        const { documents } = get()
        const updatedDocuments = documents.map(doc =>
          documentIds.includes(doc.id)
            ? { ...doc, status: 'APPROVED' as DocumentStatus }
            : doc
        )
        set({ documents: updatedDocuments })
      },

      bulkRejectDocuments: (documentIds, notes) => {
        const { documents } = get()
        const updatedDocuments = documents.map(doc =>
          documentIds.includes(doc.id)
            ? { ...doc, status: 'REJECTED' as DocumentStatus, verificationNotes: notes }
            : doc
        )
        set({ documents: updatedDocuments })
      },

      bulkUpdateStatus: (documentIds, status) => {
        const { documents } = get()
        const updatedDocuments = documents.map(doc =>
          documentIds.includes(doc.id) ? { ...doc, status } : doc
        )
        set({ documents: updatedDocuments })
      },

      reset: () => set(initialState),
    }),
    {
      name: 'legal-document-store',
    }
  )
)