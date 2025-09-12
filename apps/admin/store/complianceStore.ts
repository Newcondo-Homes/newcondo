import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface ComplianceRule {
  id: string
  name: string
  description: string
  ruleType: ComplianceRuleType
  documentTypes: string[]
  conditions: ComplianceCondition[]
  actions: ComplianceAction[]
  severity: ComplianceSeverity
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceCondition {
  id: string
  field: string
  operator: ComplianceOperator
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface ComplianceAction {
  id: string
  actionType: ComplianceActionType
  parameters: Record<string, any>
  escalationLevel?: number
}

export interface ComplianceViolation {
  id: string
  ruleId: string
  documentId: string
  userId: string
  propertyId?: string
  severity: ComplianceSeverity
  status: ComplianceViolationStatus
  description: string
  detectedAt: Date
  resolvedAt?: Date
  resolvedBy?: string
  resolutionNotes?: string
  automaticAction?: string
  manualReview?: boolean
}

export interface ComplianceAudit {
  id: string
  auditType: ComplianceAuditType
  scope: ComplianceAuditScope
  startDate: Date
  endDate?: Date
  status: ComplianceAuditStatus
  findings: ComplianceFinding[]
  recommendations: string[]
  auditedBy: string
  reportGeneratedAt?: Date
}

export interface ComplianceFinding {
  id: string
  category: ComplianceFindingCategory
  severity: ComplianceSeverity
  description: string
  affectedDocuments: string[]
  affectedUsers: string[]
  recommendedAction: string
}

export interface ComplianceMetrics {
  totalDocuments: number
  compliantDocuments: number
  nonCompliantDocuments: number
  violationsThisMonth: number
  criticalViolations: number
  averageResolutionTime: number
  complianceRate: number
  trendsOverTime: Array<{
    period: string
    complianceRate: number
    violations: number
  }>
}

export type ComplianceRuleType =
  | 'DOCUMENT_VALIDITY'
  | 'SIGNATURE_VERIFICATION'
  | 'IDENTITY_VERIFICATION'
  | 'DATA_QUALITY'
  | 'RETENTION_POLICY'
  | 'PRIVACY_COMPLIANCE'
  | 'LEGAL_REQUIREMENT'

export type ComplianceOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IS_NULL'
  | 'IS_NOT_NULL'
  | 'MATCHES_REGEX'

export type ComplianceActionType =
  | 'FLAG_FOR_REVIEW'
  | 'AUTO_REJECT'
  | 'REQUEST_RESUBMISSION'
  | 'ESCALATE_TO_ADMIN'
  | 'SEND_NOTIFICATION'
  | 'ARCHIVE_DOCUMENT'
  | 'MARK_FOR_DELETION'

export type ComplianceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ComplianceViolationStatus =
  | 'ACTIVE'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'ESCALATED'

export type ComplianceAuditType =
  | 'REGULAR_AUDIT'
  | 'COMPLIANCE_REVIEW'
  | 'INCIDENT_INVESTIGATION'
  | 'REGULATORY_AUDIT'

export type ComplianceAuditScope =
  | 'PLATFORM_WIDE'
  | 'DOCUMENT_TYPE'
  | 'USER_SEGMENT'
  | 'TIME_PERIOD'
  | 'SPECIFIC_DOCUMENTS'

export type ComplianceAuditStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type ComplianceFindingCategory =
  | 'DOCUMENT_INTEGRITY'
  | 'PROCESS_VIOLATION'
  | 'DATA_PRIVACY'
  | 'RETENTION_POLICY'
  | 'ACCESS_CONTROL'
  | 'AUDIT_TRAIL'

interface ComplianceStore {
  // State
  rules: ComplianceRule[]
  violations: ComplianceViolation[]
  audits: ComplianceAudit[]
  metrics: ComplianceMetrics | null
  selectedRule: ComplianceRule | null
  selectedViolation: ComplianceViolation | null
  selectedAudit: ComplianceAudit | null
  loading: boolean
  error: string | null

  // Filters
  violationFilters: {
    severity?: ComplianceSeverity[]
    status?: ComplianceViolationStatus[]
    dateRange?: { start: Date; end: Date }
    ruleType?: ComplianceRuleType[]
  }

  auditFilters: {
    status?: ComplianceAuditStatus[]
    auditType?: ComplianceAuditType[]
    dateRange?: { start: Date; end: Date }
  }

  // Actions
  setRules: (rules: ComplianceRule[]) => void
  setViolations: (violations: ComplianceViolation[]) => void
  setAudits: (audits: ComplianceAudit[]) => void
  setMetrics: (metrics: ComplianceMetrics) => void
  setSelectedRule: (rule: ComplianceRule | null) => void
  setSelectedViolation: (violation: ComplianceViolation | null) => void
  setSelectedAudit: (audit: ComplianceAudit | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setViolationFilters: (filters: ComplianceStore['violationFilters']) => void
  setAuditFilters: (filters: ComplianceStore['auditFilters']) => void

  // Rule Management
  createRule: (rule: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRule: (rule: ComplianceRule) => Promise<void>
  deleteRule: (ruleId: string) => Promise<void>
  activateRule: (ruleId: string) => Promise<void>
  deactivateRule: (ruleId: string) => Promise<void>

  // Violation Management
  resolveViolation: (violationId: string, resolutionNotes: string, resolvedBy: string) => Promise<void>
  dismissViolation: (violationId: string, notes: string, dismissedBy: string) => Promise<void>
  escalateViolation: (violationId: string, notes: string, escalatedBy: string) => Promise<void>

  // Audit Management
  createAudit: (audit: Omit<ComplianceAudit, 'id' | 'status' | 'findings' | 'recommendations' | 'reportGeneratedAt'>) => Promise<void>
  updateAuditStatus: (auditId: string, status: ComplianceAuditStatus) => Promise<void>
  generateAuditReport: (auditId: string) => Promise<void>

  // Data Fetching
  fetchRules: () => Promise<void>
  fetchViolations: () => Promise<void>
  fetchAudits: () => Promise<void>
  fetchMetrics: () => Promise<void>
}

export const useComplianceStore = create<ComplianceStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      rules: [],
      violations: [],
      audits: [],
      metrics: null,
      selectedRule: null,
      selectedViolation: null,
      selectedAudit: null,
      loading: false,
      error: null,
      violationFilters: {},
      auditFilters: {},

      // Actions
      setRules: (rules) => set({ rules }),
      setViolations: (violations) => set({ violations }),
      setAudits: (audits) => set({ audits }),
      setMetrics: (metrics) => set({ metrics }),
      setSelectedRule: (rule) => set({ selectedRule: rule }),
      setSelectedViolation: (violation) => set({ selectedViolation: violation }),
      setSelectedAudit: (audit) => set({ selectedAudit: audit }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setViolationFilters: (filters) => set({ violationFilters: filters }),
      setAuditFilters: (filters) => set({ auditFilters: filters }),

      // Rule Management
      createRule: async (newRule) => {
        set({ loading: true, error: null });
        try {
          // Placeholder API call
          const response = await fetch('/api/compliance/rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRule),
          });
          if (!response.ok) throw new Error('Failed to create rule.');
          const createdRule = await response.json();
          set((state) => ({
            rules: [...state.rules, createdRule],
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      updateRule: async (updatedRule) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/rules/${updatedRule.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedRule),
          });
          if (!response.ok) throw new Error('Failed to update rule.');
          set((state) => ({
            rules: state.rules.map((rule) =>
              rule.id === updatedRule.id ? updatedRule : rule
            ),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      deleteRule: async (ruleId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/rules/${ruleId}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete rule.');
          set((state) => ({
            rules: state.rules.filter((rule) => rule.id !== ruleId),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      activateRule: async (ruleId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/rules/${ruleId}/activate`, {
            method: 'PUT',
          });
          if (!response.ok) throw new Error('Failed to activate rule.');
          set((state) => ({
            rules: state.rules.map((rule) =>
              rule.id === ruleId ? { ...rule, isActive: true } : rule
            ),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      deactivateRule: async (ruleId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/rules/${ruleId}/deactivate`, {
            method: 'PUT',
          });
          if (!response.ok) throw new Error('Failed to deactivate rule.');
          set((state) => ({
            rules: state.rules.map((rule) =>
              rule.id === ruleId ? { ...rule, isActive: false } : rule
            ),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      // Violation Management
      resolveViolation: async (violationId, resolutionNotes, resolvedBy) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/violations/${violationId}/resolve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolutionNotes, resolvedBy }),
          });
          if (!response.ok) throw new Error('Failed to resolve violation.');
          const resolvedViolation = await response.json();
          set((state) => ({
            violations: state.violations.map((violation) =>
              violation.id === violationId ? resolvedViolation : violation
            ),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      dismissViolation: async (violationId, notes, dismissedBy) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/violations/${violationId}/dismiss`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes, dismissedBy }),
          });
          if (!response.ok) throw new Error('Failed to dismiss violation.');
          const dismissedViolation = await response.json();
          set((state) => ({
            violations: state.violations.map((violation) =>
              violation.id === violationId ? dismissedViolation : violation
            ),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      escalateViolation: async (violationId, notes, escalatedBy) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/violations/${violationId}/escalate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes, escalatedBy }),
          });
          if (!response.ok) throw new Error('Failed to escalate violation.');
          const escalatedViolation = await response.json();
          set((state) => ({
            violations: state.violations.map((violation) =>
              violation.id === violationId ? escalatedViolation : violation
            ),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      // Audit Management
      createAudit: async (newAudit) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/compliance/audits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAudit),
          });
          if (!response.ok) throw new Error('Failed to create audit.');
          const createdAudit = await response.json();
          set((state) => ({
            audits: [...state.audits, createdAudit],
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      updateAuditStatus: async (auditId, status) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/audits/${auditId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          if (!response.ok) throw new Error('Failed to update audit status.');
          const updatedAudit = await response.json();
          set((state) => ({
            audits: state.audits.map((audit) =>
              audit.id === auditId ? updatedAudit : audit
            ),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      generateAuditReport: async (auditId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/compliance/audits/${auditId}/report`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('Failed to generate audit report.');
          // Logic for handling file download or report generation status update
          toast.success('Audit report generation initiated.');
          set({ loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      // Data Fetching
      fetchRules: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/compliance/rules');
          if (!response.ok) throw new Error('Failed to fetch rules.');
          const data = await response.json();
          set({ rules: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      fetchViolations: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/compliance/violations');
          if (!response.ok) throw new Error('Failed to fetch violations.');
          const data = await response.json();
          set({ violations: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      fetchAudits: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/compliance/audits');
          if (!response.ok) throw new Error('Failed to fetch audits.');
          const data = await response.json();
          set({ audits: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
      fetchMetrics: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/compliance/metrics');
          if (!response.ok) throw new Error('Failed to fetch metrics.');
          const data = await response.json();
          set({ metrics: data, loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },
    }),
    { name: 'ComplianceStore' }
  )
);