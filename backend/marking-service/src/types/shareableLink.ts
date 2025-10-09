// backend/marking-service/src/types/shareableLink.ts

export interface ShareableLink {
  id: string;
  markingJobId: string;
  token: string;
  url: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  usedBy?: string;
  maxUses: number;
  currentUses: number;
}

export interface CreateShareableLinkParams {
  markingJobId: string;
  createdBy: string;
  expiresInHours?: number; // Default 72 hours (3 days)
  maxUses?: number; // Default 1
}

export interface ShareableLinkValidation {
  isValid: boolean;
  reason?: string;
  link?: ShareableLink;
}

export interface ShareableLinkUsage {
  linkId: string;
  usedBy: string;
  usedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export enum ShareableLinkStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
  REVOKED = 'REVOKED'
}

export interface ShareableLinkMetadata {
  propertyAddress: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  propertyImages?: string[];
}