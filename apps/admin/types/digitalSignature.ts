// apps/admin/src/types/digitalSignature.ts

export interface DigitalSignature {
  id: string
  documentId: string
  templateId?: string
  signerEmail: string
  signerName: string
  signerPhone?: string
  signedAt: Date
  expiresAt: Date
  ipAddress: string
  userAgent: string
  signatureData: string // Base64 encoded signature image
  signatureMethod: SignatureMethod
  isValid: boolean
  isRevoked: boolean
  revokedAt?: Date
  revokedBy?: string
  revokedReason?: string
  metadata: SignatureMetadata
  auditTrail: SignatureAuditEntry[]
  certificate?: SignatureCertificate
  createdAt: Date
  updatedAt: Date
}

export interface SignatureMetadata {
  browserInfo: string
  deviceType: string
  geoLocation?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  signatureDimensions: {
    width: number
    height: number
  }
  signaturePoints: SignaturePoint[]
  timeToSign: number // milliseconds
  retries: number
}

export interface SignaturePoint {
  x: number
  y: number
  timestamp: number
  pressure?: number
}

export interface SignatureAuditEntry {
  id: string
  action: SignatureAuditAction
  timestamp: Date
  performedBy: string
  details: Record<string, any>
  ipAddress: string
}

export interface SignatureCertificate {
  id: string
  issuer: string
  subject: string
  serialNumber: string
  issuedAt: Date
  expiresAt: Date
  algorithm: string
  fingerprint: string
  keyUsage: string[]
  isValid: boolean
}

export interface SignatureRequest {
  id: string
  documentId: string
  templateId?: string
  signerEmail: string
  signerName: string
  signerPhone?: string
  requestedBy: string
  requestedAt: Date
  expiresAt: Date
  status: SignatureRequestStatus
  remindersSent: number
  lastReminderAt?: Date
  completedAt?: Date
  declinedAt?: Date
  declineReason?: string
  signatureFields: SignatureField[]
  metadata: Record<string, any>
}

export interface SignatureField {
  id: string
  name: string
  type: SignatureFieldType
  label: string
  x: number // Position on document
  y: number
  width: number
  height: number
  page: number
  isRequired: boolean
  value?: string
  validationRules?: FieldValidationRule[]
}

export interface FieldValidationRule {
  type: 'required' | 'email' | 'phone' | 'date' | 'regex' | 'minLength' | 'maxLength'
  value?: any
  message: string
}

export interface SignatureTemplate {
  id: string
  name: string
  description: string
  documentType: string
  version: string
  isActive: boolean
  fields: SignatureField[]
  settings: SignatureTemplateSettings
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface SignatureTemplateSettings {
  allowDecline: boolean
  requireAllFields: boolean
  expirationDays: number
  reminderIntervals: number[] // Days after initial request
  authenticationMethod: AuthenticationMethod
  signatureStyle: SignatureStyle
  brandingOptions: BrandingOptions
}

export interface BrandingOptions {
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  companyName?: string
  customMessage?: string
}

export interface SignatureVerificationResult {
  isValid: boolean
  signatureId: string
  verifiedAt: Date
  issues: SignatureIssue[]
  certificate?: SignatureCertificate
  trustLevel: TrustLevel
  verificationMethod: string
}

export interface SignatureIssue {
  type: 'expired' | 'revoked' | 'tampered' | 'invalid_certificate' | 'untrusted_issuer'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendation?: string
}

export interface SignatureAnalytics {
  totalSignatures: number
  successRate: number
  averageSigningTime: number
  signaturesByStatus: Record<SignatureRequestStatus, number>
  signaturesByMethod: Record<SignatureMethod, number>
  geographicDistribution: GeographicData[]
  deviceDistribution: DeviceData[]
  timeToSignMetrics: {
    average: number
    median: number
    p95: number
    p99: number
  }
  completionRates: {
    daily: CompletionRateData[]
    weekly: CompletionRateData[]
    monthly: CompletionRateData[]
  }
}

export interface GeographicData {
  country: string
  region: string
  count: number
  successRate: number
}

export interface DeviceData {
  deviceType: string
  count: number
  successRate: number
  averageSigningTime: number
}

export interface CompletionRateData {
  period: string
  requested: number
  completed: number
  declined: number
  expired: number
  rate: number
}

export interface SignatureBulkAction {
  action: 'verify' | 'revoke' | 'resend' | 'expire' | 'delete'
  signatureIds: string[]
  reason?: string
  notes?: string
}

export interface SignatureReminder {
  id: string
  signatureRequestId: string
  type: 'email' | 'sms'
  scheduledFor: Date
  sentAt?: Date
  status: 'pending' | 'sent' | 'failed'
  message: string
}

export type SignatureMethod = 
  | 'DRAWN'
  | 'TYPED'
  | 'UPLOADED'
  | 'BIOMETRIC'
  | 'CERTIFICATE'

export type SignatureRequestStatus = 
  | 'PENDING'
  | 'SENT'
  | 'OPENED'
  | 'COMPLETED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED'

export type SignatureFieldType = 
  | 'signature'
  | 'initial'
  | 'text'
  | 'date'
  | 'email'
  | 'checkbox'

export type AuthenticationMethod = 
  | 'email'
  | 'phone'
  | 'email_and_phone'
  | 'id_verification'
  | 'biometric'

export type SignatureStyle = 
  | 'handwritten'
  | 'typed'
  | 'digital_certificate'

export type TrustLevel = 
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'UNTRUSTED'

export type SignatureAuditAction = 
  | 'CREATED'
  | 'SENT'
  | 'OPENED'
  | 'SIGNED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'VERIFIED'
  | 'REVOKED'
  | 'REMINDED'