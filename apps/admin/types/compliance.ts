// apps/admin/src/types/compliance.ts

import { DocumentType, DocumentStatus } from '@newcondo/db'

export interface ComplianceReport {
  id: string
  reportType: ComplianceReportType
  title: string
  description?: string
  generatedAt: Date
  generatedBy: string
  period: ReportPeriod
  status: ComplianceReportStatus
  data: ComplianceReportData
  fileUrl?: string
  metadata: Record<string, any>
  scheduledReportId?: string
}

export interface ComplianceReportData {
  summary: ComplianceSummary
  documentCompliance: DocumentComplianceMetrics
  userCompliance: UserComplianceMetrics
  propertyCompliance: PropertyComplianceMetrics
  riskAssessment: RiskAssessmentData
  recommendations: ComplianceRecommendation[]
  trends: ComplianceTrendData[]
}

export interface ComplianceSummary {
  totalUsers: number
  compliantUsers: number
  nonCompliantUsers: number
  partiallyCompliantUsers: number
  overallComplianceRate: number
  complianceByUserType: Record<string, ComplianceByType>
  criticalIssues: number
  highRiskUsers: number
  documentsAwaitingVerification: number
  expiredDocuments: number
}

export interface ComplianceByType {
  total: number
  compliant: number
  nonCompliant: number
  rate: number
}

export interface DocumentComplianceMetrics {
  totalDocuments: number
  verifiedDocuments: number
  pendingDocuments: number
  rejectedDocuments: number
  expiredDocuments: number
  documentsByType: Record<DocumentType, DocumentTypeCompliance>
  averageVerificationTime: number
  complianceRateByType: Record<DocumentType, number>
  expiringDocuments: ExpiringDocumentsData
}

export interface DocumentTypeCompliance {
  total: number
  verified: number
  pending: number
  rejected: number
  expired: number
  complianceRate: number
  averageProcessingTime: number
}

export interface ExpiringDocumentsData {
  next7Days: number
  next30Days: number
  next90Days: number
  overdue: number
}

export interface UserComplianceMetrics {
  verifiedUsers: number
  pendingVerificationUsers: number
  rejectedUsers: number
  incompleteUsers: number
  userComplianceByRole: Record<string, ComplianceByType>
  averageCompletionTime: number
  complianceGaps: ComplianceGap[]
  userRiskProfiles: UserRiskProfile[]
}

export interface ComplianceGap {
  type: string
  description: string
  affectedUsers: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

export interface UserRiskProfile {
  userId: string
  userName: string
  email: string
  riskLevel: RiskLevel
  riskFactors: RiskFactor[]
  complianceScore: number
  lastUpdate: Date
}

export interface RiskFactor {
  type: string
  description: string
  weight: number
  impact: 'low' | 'medium' | 'high'
}

export interface PropertyComplianceMetrics {
  totalProperties: number
  compliantProperties: number
  propertiesWithMissingDocs: number
  propertiesPendingApproval: number
  boundaryCompliance: BoundaryComplianceData
  legalDocumentCompliance: LegalDocumentComplianceData
}

export interface BoundaryComplianceData {
  totalWithBoundaries: number
  verifiedBoundaries: number
  pendingBoundaryVerification: number
  boundaryDisputes: number
}

export interface LegalDocumentComplianceData {
  ownershipDocuments: number
  consentDocuments: number
  undertakingDocuments: number
  missingCriticalDocs: number
}

export interface RiskAssessmentData {
  overallRiskScore: number
  riskDistribution: Record<RiskLevel, number>
  topRiskFactors: TopRiskFactor[]
  riskTrends: RiskTrendData[]
  mitigationStrategies: MitigationStrategy[]
}

export interface TopRiskFactor {
  factor: string
  affectedEntities: number
  impact: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface RiskTrendData {
  date: string
  riskScore: number
  newRisks: number
  resolvedRisks: number
}

export interface MitigationStrategy {
  id: string
  name: string
  description: string
  targetRiskFactors: string[]
  implementationComplexity: 'low' | 'medium' | 'high'
  expectedImpact: number
  status: 'proposed' | 'in_progress' | 'implemented'
}

export interface ComplianceRecommendation {
  id: string
  type: RecommendationType
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affectedEntities: number
  estimatedImplementationTime: number
  potentialImpact: string
  actionItems: ActionItem[]
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
}

export interface ActionItem {
  id: string
  description: string
  responsible: string
  dueDate: Date
  status: 'pending' | 'in_progress' | 'completed'
}

export interface ComplianceTrendData {
  date: string
  overallComplianceRate: number
  documentComplianceRate: number
  userComplianceRate: number
  propertyComplianceRate: number
  newIssues: number
  resolvedIssues: number
}

export interface ComplianceAlert {
  id: string
  type: ComplianceAlertType
  severity: AlertSeverity
  title: string
  description: string
  affectedEntities: string[]
  triggeredAt: Date
  resolvedAt?: Date
  resolvedBy?: string
  status: AlertStatus
  metadata: Record<string, any>
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  category: ComplianceRuleCategory
  isActive: boolean
  conditions: ComplianceCondition[]
  actions: ComplianceAction[]
  severity: AlertSeverity
  exemptions: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists'
  value: any
  weight: number
}

export interface ComplianceAction {
  type: 'alert' | 'flag_user' | 'suspend_user' | 'require_document' | 'notify_admin' | 'auto_reject'
  parameters: Record<string, any>
}

export interface ComplianceAudit {
  id: string
  auditType: ComplianceAuditType
  scope: AuditScope
  startDate: Date
  endDate?: Date
  status: AuditStatus
  findings: AuditFinding[]
  recommendations: ComplianceRecommendation[]
  auditedBy: string
  reviewedBy?: string
  metadata: Record<string, any>
}

export interface AuditScope {
  includeUsers: boolean
  includeProperties: boolean
  includeDocuments: boolean
  includePayments: boolean
  userRoles?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface AuditFinding {
  id: string
  type: string
  severity: AlertSeverity
  description: string
  evidence: Evidence[]
  affectedEntities: string[]
  riskLevel: RiskLevel
  recommendations: string[]
}

export interface Evidence {
  type: 'document' | 'data_point' | 'screenshot' | 'log_entry'
  description: string
  url?: string
  data?: Record<string, any>
}

export interface ComplianceMetrics {
  score: number
  grade: ComplianceGrade
  lastUpdated: Date
  breakdown: {
    documentation: number
    userVerification: number
    propertyVerification: number
    legalCompliance: number
    dataProtection: number
  }
  trends: {
    period: string
    score: number
    change: number
  }[]
}

export interface ScheduledReport {
  id: string
  name: string
  reportType: ComplianceReportType
  schedule: ReportSchedule
  recipients: string[]
  isActive: boolean
  lastGenerated?: Date
  nextScheduled: Date
  template: ReportTemplate
  filters: Record<string, any>
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  dayOfWeek?: number
  dayOfMonth?: number
  hour: number
  timezone: string
}

export interface ReportTemplate {
  sections: ReportSection[]
  format: 'pdf' | 'excel' | 'csv' | 'json'
  styling: ReportStyling
}

export interface ReportSection {
  type: string
  title: string
  description?: string
  order: number
  isEnabled: boolean
  configuration: Record<string, any>
}

export interface ReportStyling {
  theme: string
  logoUrl?: string
  primaryColor?: string
  fontFamily?: string
}

export type ComplianceReportType = 
  | 'OVERALL_COMPLIANCE'
  | 'DOCUMENT_COMPLIANCE'
  | 'USER_VERIFICATION'
  | 'RISK_ASSESSMENT'
  | 'LEGAL_COMPLIANCE'
  | 'DATA_PROTECTION'
  | 'AUDIT_FINDINGS'

export type ComplianceReportStatus = 
  | 'GENERATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SCHEDULED'

export type ReportPeriod = {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  startDate: Date
  endDate: Date
}

export type ComplianceAlertType = 
  | 'DOCUMENT_EXPIRED'
  | 'VERIFICATION_OVERDUE'
  | 'COMPLIANCE_VIOLATION'
  | 'RISK_THRESHOLD_EXCEEDED'
  | 'REGULATORY_CHANGE'
  | 'AUDIT_FINDING'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ComplianceGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'

export type ComplianceRuleCategory = 
  | 'DOCUMENT_VERIFICATION'
  | 'USER_VERIFICATION'
  | 'PROPERTY_VERIFICATION'
  | 'LEGAL_REQUIREMENTS'
  | 'DATA_PROTECTION'
  | 'FINANCIAL_COMPLIANCE'

export type ComplianceAuditType = 
  | 'INTERNAL'
  | 'EXTERNAL'
  | 'REGULATORY'
  | 'THIRD_PARTY'

export type AuditStatus = 
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REVIEWED'
  | 'CLOSED'

export type RecommendationType = 
  | 'PROCESS_IMPROVEMENT'
  | 'POLICY_UPDATE'
  | 'TRAINING_REQUIRED'
  | 'SYSTEM_ENHANCEMENT'
  | 'COMPLIANCE_GAP'
  | 'RISK_MITIGATION'