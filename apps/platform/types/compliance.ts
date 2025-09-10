import { DocumentType, DocumentStatus, Role } from '@newcondo/db'
import { LegalDocument, UndertakingType } from './legal'

// Compliance status and scoring
export interface ComplianceStatus {
  id: string
  userId: string
  propertyId?: string
  overallScore: number
  level: ComplianceLevel
  isCompliant: boolean
  lastCheckedAt: Date
  nextReviewDate: Date
  expirationWarnings: ComplianceWarning[]
  requiredActions: ComplianceAction[]
  completedRequirements: ComplianceRequirement[]
  pendingRequirements: ComplianceRequirement[]
}

export interface ComplianceScore {
  overall: number
  identity: number
  legal: number
  property: number
  business: number
  breakdown: ComplianceScoreBreakdown
}

export interface ComplianceScoreBreakdown {
  totalRequirements: number
  completedRequirements: number
  pendingRequirements: number
  expiredRequirements: number
  criticalIssues: number
  warnings: number
}

// Compliance requirements
export interface ComplianceRequirement {
  id: string
  type: ComplianceRequirementType
  category: ComplianceCategory
  title: string
  description: string
  isRequired: boolean
  isCritical: boolean
  weight: number
  status: ComplianceRequirementStatus
  completedAt?: Date
  expiresAt?: Date
  reminderDays: number[]
  applicableRoles: Role[]
  dependencies: string[] // Other requirement IDs
  documentTypes?: DocumentType[]
  undertakingTypes?: UndertakingType[]
}

export interface ComplianceAction {
  id: string
  type: ComplianceActionType
  priority: CompliancePriority
  title: string
  description: string
  instruction: string
  dueDate?: Date
  estimatedMinutes?: number
  requirementId?: string
  documentType?: DocumentType
  propertyId?: string
  isCompleted: boolean
  completedAt?: Date
}

export interface ComplianceWarning {
  id: string
  type: ComplianceWarningType
  severity: ComplianceWarningLevel
  title: string
  message: string
  documentId?: string
  requirementId?: string
  expiresAt?: Date
  actionRequired: boolean
  dismissible: boolean
  isDismissed: boolean
  createdAt: Date
}

// Role-specific compliance
export interface RoleComplianceProfile {
  role: Role
  requiredDocuments: DocumentType[]
  requiredUndertakings: UndertakingType[]
  complianceThreshold: number
  renewalPeriod: number // days
  gracePeriod: number // days
  restrictionsWhenNonCompliant: ComplianceRestriction[]
}

export interface ComplianceRestriction {
  action: RestrictedAction
  description: string
  canOverride: boolean
  overrideRoles: Role[]
}

// Property-specific compliance
export interface PropertyComplianceProfile {
  propertyId: string
  ownerId: string
  agentId?: string
  ownerCompliance: ComplianceStatus
  agentCompliance?: ComplianceStatus
  propertyDocuments: LegalDocument[]
  isListingCompliant: boolean
  isRentalCompliant: boolean
  lastAuditDate?: Date
  nextAuditDate?: Date
}

export interface PropertyListingCompliance {
  propertyId: string
  canList: boolean
  restrictions: string[]
  missingDocuments: DocumentType[]
  expiringDocuments: LegalDocument[]
  ownerVerificationStatus: DocumentStatus
  agentPermissionStatus?: DocumentStatus
}

// Compliance checklist and wizard
export interface ComplianceChecklist {
  id: string
  userId: string
  role: Role
  propertyId?: string
  steps: ComplianceStep[]
  currentStepIndex: number
  isCompleted: boolean
  completedAt?: Date
  progress: number
}

export interface ComplianceStep {
  id: string
  title: string
  description: string
  type: ComplianceStepType
  isRequired: boolean
  isCompleted: boolean
  completedAt?: Date
  order: number
  requirements: ComplianceRequirement[]
  actions: ComplianceStepAction[]
  validationRules: ComplianceValidationRule[]
}

export interface ComplianceStepAction {
  id: string
  type: ComplianceStepActionType
  title: string
  description: string
  url?: string
  documentType?: DocumentType
  isCompleted: boolean
  completedAt?: Date
}

export interface ComplianceValidationRule {
  field: string
  rule: ValidationRuleType
  value?: any
  errorMessage: string
}

// Compliance monitoring and alerts
export interface ComplianceMonitor {
  userId: string
  propertyId?: string
  isActive: boolean
  monitoringRules: ComplianceMonitoringRule[]
  alertSettings: ComplianceAlertSettings
  lastCheckedAt: Date
  nextCheckAt: Date
}

export interface ComplianceMonitoringRule {
  id: string
  type: ComplianceMonitoringType
  threshold: number
  condition: ComplianceCondition
  isActive: boolean
  alertLevel: ComplianceAlertLevel
}

export interface ComplianceAlertSettings {
  emailAlerts: boolean
  smsAlerts: boolean
  pushNotifications: boolean
  reminderDays: number[]
  escalationRules: ComplianceEscalationRule[]
}

export interface ComplianceEscalationRule {
  afterDays: number
  alertLevel: ComplianceAlertLevel
  recipients: string[] // user IDs or roles
  message: string
}

// Compliance reporting and analytics
export interface ComplianceReport {
  id: string
  reportType: ComplianceReportType
  generatedBy: string
  generatedAt: Date
  period: ComplianceReportPeriod
  scope: ComplianceReportScope
  data: ComplianceReportData
  summary: ComplianceReportSummary
}

export interface ComplianceReportData {
  totalUsers: number
  compliantUsers: number
  nonCompliantUsers: number
  documentStats: DocumentComplianceStats
  complianceByRole: Record<Role, ComplianceRoleStats>
  trendData: ComplianceTrendData[]
  topIssues: ComplianceIssue[]
}

export interface ComplianceReportSummary {
  overallComplianceRate: number
  criticalIssues: number
  warnings: number
  improvements: string[]
  recommendations: string[]
}

export interface DocumentComplianceStats {
  totalDocuments: number
  verifiedDocuments: number
  expiredDocuments: number
  pendingDocuments: number
  rejectedDocuments: number
  averageProcessingDays: number
}

export interface ComplianceRoleStats {
  role: Role
  totalUsers: number
  compliantUsers: number
  averageScore: number
  commonIssues: string[]
}

export interface ComplianceTrendData {
  date: string
  complianceRate: number
  newUsers: number
  completedRequirements: number
  expiredDocuments: number
}

export interface ComplianceIssue {
  type: string
  count: number
  affectedUsers: number
  severity: ComplianceWarningLevel
  description: string
}

// Enums
export enum ComplianceLevel {
  CRITICAL = 'CRITICAL', // 0-40%
  LOW = 'LOW', // 41-60%
  MEDIUM = 'MEDIUM', // 61-80%
  HIGH = 'HIGH', // 81-95%
  EXCELLENT = 'EXCELLENT' // 96-100%
}

export enum ComplianceRequirementType {
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  LEGAL_ACCEPTANCE = 'LEGAL_ACCEPTANCE',
  BUSINESS_VERIFICATION = 'BUSINESS_VERIFICATION',
  PROPERTY_VERIFICATION = 'PROPERTY_VERIFICATION',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  FINANCIAL_VERIFICATION = 'FINANCIAL_VERIFICATION'
}

export enum ComplianceCategory {
  IDENTITY = 'IDENTITY',
  LEGAL = 'LEGAL',
  PROPERTY = 'PROPERTY',
  BUSINESS = 'BUSINESS',
  FINANCIAL = 'FINANCIAL',
  BACKGROUND = 'BACKGROUND'
}

export enum ComplianceRequirementStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

export enum ComplianceActionType {
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  VERIFY_IDENTITY = 'VERIFY_IDENTITY',
  ACCEPT_TERMS = 'ACCEPT_TERMS',
  SIGN_UNDERTAKING = 'SIGN_UNDERTAKING',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  SCHEDULE_VERIFICATION = 'SCHEDULE_VERIFICATION'
}

export enum CompliancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  URGENT = 'URGENT'
}

export enum ComplianceWarningType {
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  DOCUMENT_EXPIRED = 'DOCUMENT_EXPIRED',
  REQUIREMENT_OVERDUE = 'REQUIREMENT_OVERDUE',
  COMPLIANCE_DROPPING = 'COMPLIANCE_DROPPING',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  MISSING_CRITICAL = 'MISSING_CRITICAL'
}

export enum ComplianceWarningLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum RestrictedAction {
  CREATE_LISTING = 'CREATE_LISTING',
  RENT_PROPERTY = 'RENT_PROPERTY',
  RECEIVE_PAYMENTS = 'RECEIVE_PAYMENTS',
  MANAGE_PROPERTIES = 'MANAGE_PROPERTIES',
  ACCESS_PREMIUM = 'ACCESS_PREMIUM',
  AGENT_ACTIVITIES = 'AGENT_ACTIVITIES'
}

export enum ComplianceStepType {
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  INFORMATION_INPUT = 'INFORMATION_INPUT',
  VERIFICATION = 'VERIFICATION',
  ACCEPTANCE = 'ACCEPTANCE',
  REVIEW = 'REVIEW',
  CONFIRMATION = 'CONFIRMATION'
}

export enum ComplianceStepActionType {
  UPLOAD = 'UPLOAD',
  FILL_FORM = 'FILL_FORM',
  READ_TERMS = 'READ_TERMS',
  VERIFY_OTP = 'VERIFY_OTP',
  SCHEDULE_CALL = 'SCHEDULE_CALL',
  DOWNLOAD = 'DOWNLOAD',
  SIGN = 'SIGN'
}

export enum ValidationRuleType {
  REGEX = 'REGEX',
  MIN_LENGTH = 'MIN_LENGTH',
  MAX_LENGTH = 'MAX_LENGTH',
  REQUIRED = 'REQUIRED',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  DATE_FORMAT = 'DATE_FORMAT',
  IS_TRUE = 'IS_TRUE',
  IS_FALSE = 'IS_FALSE',
  IN_ARRAY = 'IN_ARRAY'
}

export enum ComplianceMonitoringType {
  DOCUMENT_EXPIRY = 'DOCUMENT_EXPIRY',
  SCORE_THRESHOLD = 'SCORE_THRESHOLD',
  INCOMPLETE_REQUIREMENTS = 'INCOMPLETE_REQUIREMENTS',
  PROFILE_CHANGE = 'PROFILE_CHANGE',
  ACTIVITY_PATTERN = 'ACTIVITY_PATTERN'
}

export enum ComplianceCondition {
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  EXPIRES_IN_DAYS = 'EXPIRES_IN_DAYS',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY'
}

export enum ComplianceAlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export enum ComplianceReportType {
  OVERALL_COMPLIANCE = 'OVERALL_COMPLIANCE',
  USER_COMPLIANCE = 'USER_COMPLIANCE',
  PROPERTY_COMPLIANCE = 'PROPERTY_COMPLIANCE',
  DOCUMENT_STATUS = 'DOCUMENT_STATUS',
  COMPLIANCE_TRENDS = 'COMPLIANCE_TRENDS'
}

export enum ComplianceReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
  CUSTOM = 'CUSTOM'
}

export enum ComplianceReportScope {
  ALL_USERS = 'ALL_USERS',
  ROLE_BASED = 'ROLE_BASED',
  PROPERTY_BASED = 'PROPERTY_BASED',
  INDIVIDUAL_USER = 'INDIVIDUAL_USER'
}