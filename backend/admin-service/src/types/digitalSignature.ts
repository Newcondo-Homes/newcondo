// backend/admin-service/src/types/digitalSignature.ts

export interface DigitalSignature {
  id: string;
  documentId: string;
  signerId: string;
  
  // Signature details
  signatureType: SignatureType;
  signatureMethod: SignatureMethod;
  signatureData: string; // Base64 encoded signature or certificate
  certificateId?: string;
  
  // Biometric data (for advanced signatures)
  biometricHash?: string;
  deviceFingerprint?: string;
  
  // Legal information
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  signerRole: SignerRole;
  
  // Verification
  isVerified: boolean;
  verificationMethod?: VerificationMethod;
  verificationResult?: VerificationResult;
  
  // Timestamp and location
  signedAt: Date;
  timezone: string;
  ipAddress: string;
  location?: GeolocationData;
  
  // Device and browser information
  userAgent: string;
  deviceType: DeviceType;
  browserInfo: BrowserInfo;
  
  // Legal validity
  legalStatus: LegalStatus;
  witnessRequired: boolean;
  witnessInfo?: WitnessInfo;
  notarizationRequired: boolean;
  notarizationInfo?: NotarizationInfo;
  
  // Audit trail
  auditTrail: AuditEntry[];
  
  // Metadata
  metadata?: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum SignatureType {
  SIMPLE_ELECTRONIC = 'SIMPLE_ELECTRONIC',
  ADVANCED_ELECTRONIC = 'ADVANCED_ELECTRONIC',
  QUALIFIED_ELECTRONIC = 'QUALIFIED_ELECTRONIC',
  BIOMETRIC = 'BIOMETRIC',
  DIGITAL_CERTIFICATE = 'DIGITAL_CERTIFICATE'
}

export enum SignatureMethod {
  MOUSE_DRAW = 'MOUSE_DRAW',
  TOUCH_DRAW = 'TOUCH_DRAW',
  STYLUS_DRAW = 'STYLUS_DRAW',
  TYPED_NAME = 'TYPED_NAME',
  UPLOADED_IMAGE = 'UPLOADED_IMAGE',
  CERTIFICATE_BASED = 'CERTIFICATE_BASED',
  BIOMETRIC_SCAN = 'BIOMETRIC_SCAN',
  OTP_CONFIRMATION = 'OTP_CONFIRMATION'
}

export enum SignerRole {
  DOCUMENT_OWNER = 'DOCUMENT_OWNER',
  PROPERTY_OWNER = 'PROPERTY_OWNER',
  AGENT = 'AGENT',
  WITNESS = 'WITNESS',
  NOTARY = 'NOTARY',
  ADMIN = 'ADMIN',
  THIRD_PARTY = 'THIRD_PARTY'
}

export enum VerificationMethod {
  CRYPTOGRAPHIC = 'CRYPTOGRAPHIC',
  BIOMETRIC_MATCH = 'BIOMETRIC_MATCH',
  CERTIFICATE_CHAIN = 'CERTIFICATE_CHAIN',
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  IDENTITY_DOCUMENT = 'IDENTITY_DOCUMENT',
  VIDEO_CALL = 'VIDEO_CALL'
}

export interface VerificationResult {
  isValid: boolean;
  confidence: number; // 0-100
  method: VerificationMethod;
  details: Record<string, any>;
  performedAt: Date;
  error?: string;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  city?: string;
  country?: string;
}

export enum DeviceType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  UNKNOWN = 'UNKNOWN'
}

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  language: string;
  screenResolution: string;
  colorDepth: number;
}

export enum LegalStatus {
  LEGALLY_BINDING = 'LEGALLY_BINDING',
  LEGALLY_VALID = 'LEGALLY_VALID',
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  INVALID = 'INVALID',
  REVOKED = 'REVOKED'
}

export interface WitnessInfo {
  witnessId?: string;
  witnessName: string;
  witnessEmail: string;
  witnessPhone?: string;
  witnessSignature?: string;
  witnessedAt: Date;
  witnessLocation?: GeolocationData;
}

export interface NotarizationInfo {
  notaryId: string;
  notaryName: string;
  notaryLicense: string;
  notaryJurisdiction: string;
  notarySeal: string;
  notarizedAt: Date;
  notaryExpiry: Date;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  userId?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum AuditAction {
  DOCUMENT_OPENED = 'DOCUMENT_OPENED',
  SIGNATURE_STARTED = 'SIGNATURE_STARTED',
  SIGNATURE_COMPLETED = 'SIGNATURE_COMPLETED',
  SIGNATURE_VERIFIED = 'SIGNATURE_VERIFIED',
  SIGNATURE_REJECTED = 'SIGNATURE_REJECTED',
  DOCUMENT_SENT = 'DOCUMENT_SENT',
  DOCUMENT_VIEWED = 'DOCUMENT_VIEWED',
  CERTIFICATE_VALIDATED = 'CERTIFICATE_VALIDATED',
  BIOMETRIC_CAPTURED = 'BIOMETRIC_CAPTURED'
}

// Certificate Management
export interface DigitalCertificate {
  id: string;
  userId: string;
  certificateType: CertificateType;
  
  // Certificate data
  certificate: string; // PEM encoded certificate
  privateKey?: string; // Encrypted private key
  publicKey: string;
  serialNumber: string;
  fingerprint: string;
  
  // Certificate details
  issuer: CertificateIssuer;
  subject: CertificateSubject;
  validFrom: Date;
  validTo: Date;
  keyUsage: KeyUsage[];
  
  // Status
  status: CertificateStatus;
  revocationReason?: string;
  revokedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export enum CertificateType {
  SELF_SIGNED = 'SELF_SIGNED',
  CA_ISSUED = 'CA_ISSUED',
  QUALIFIED = 'QUALIFIED',
  TEST = 'TEST'
}

export interface CertificateIssuer {
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  country: string;
  state?: string;
  locality?: string;
  email?: string;
}

export interface CertificateSubject {
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  country: string;
  state?: string;
  locality?: string;
  email: string;
  serialNumber?: string;
}

export enum KeyUsage {
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE',
  NON_REPUDIATION = 'NON_REPUDIATION',
  KEY_ENCIPHERMENT = 'KEY_ENCIPHERMENT',
  DATA_ENCIPHERMENT = 'DATA_ENCIPHERMENT',
  KEY_AGREEMENT = 'KEY_AGREEMENT',
  CERTIFICATE_SIGNING = 'CERTIFICATE_SIGNING',
  CRL_SIGNING = 'CRL_SIGNING'
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  SUSPENDED = 'SUSPENDED'
}

// Signature Workflow
export interface SignatureWorkflow {
  id: string;
  documentId: string;
  initiatorId: string;
  
  // Workflow configuration
  title: string;
  description?: string;
  signingOrder: SigningOrder;
  expiresAt?: Date;
  
  // Signers
  signers: SignerConfig[];
  
  // Status
  status: WorkflowStatus;
  currentStep: number;
  completedAt?: Date;
  
  // Notifications
  reminderConfig: ReminderConfig;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum SigningOrder {
  PARALLEL = 'PARALLEL', // All signers can sign simultaneously
  SEQUENTIAL = 'SEQUENTIAL', // Signers must sign in order
  HYBRID = 'HYBRID' // Mix of parallel and sequential steps
}

export interface SignerConfig {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: SignerRole;
  order: number;
  isRequired: boolean;
  
  // Signature requirements
  signatureType: SignatureType;
  authenticationRequired: boolean;
  witnessRequired: boolean;
  
  // Status
  status: SignerStatus;
  signedAt?: Date;
  
  // Notifications
  invitedAt?: Date;
  remindersSent: number;
  lastReminderAt?: Date;
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum SignerStatus {
  PENDING = 'PENDING',
  INVITED = 'INVITED',
  VIEWED = 'VIEWED',
  SIGNED = 'SIGNED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR'
}

export interface ReminderConfig {
  enabled: boolean;
  initialDelay: number; // hours
  reminderInterval: number; // hours
  maxReminders: number;
  escalationEnabled: boolean;
  escalationAfter: number; // hours
  escalationRecipients: string[];
}

// DTOs
export interface CreateSignatureRequest {
  documentId: string;
  signerId: string;
  signatureType: SignatureType;
  signatureMethod: SignatureMethod;
  signatureData: string;
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  signerRole: SignerRole;
  location?: GeolocationData;
  witnessInfo?: WitnessInfo;
}

export interface CreateWorkflowRequest {
  documentId: string;
  title: string;
  description?: string;
  signingOrder: SigningOrder;
  signers: Omit<SignerConfig, 'id' | 'status' | 'signedAt' | 'invitedAt' | 'remindersSent' | 'lastReminderAt'>[];
  expiresAt?: Date;
  reminderConfig?: Partial<ReminderConfig>;
}

export interface SignatureFilter {
  documentId?: string;
  signerId?: string;
  signatureType?: SignatureType;
  signerRole?: SignerRole;
  isVerified?: boolean;
  legalStatus?: LegalStatus;
  signedFrom?: Date;
  signedTo?: Date;
}

export interface SignatureStats {
  total: number;
  byType: Record<SignatureType, number>;
  byMethod: Record<SignatureMethod, number>;
  byStatus: Record<LegalStatus, number>;
  averageSigningTime: number; // minutes
  verificationRate: number; // percentage
}