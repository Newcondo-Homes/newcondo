/**
 * Shareable Link Generator Utility
 * Generates secure, unique links for property marking jobs
 * 
 * Location: backend/marking-service/src/utils/linkGenerator.ts
 */

import crypto from 'crypto';
import { sign, verify } from 'jsonwebtoken';

interface MarkingLinkPayload {
  jobId: string;
  propertyId: string;
  ownerId: string;
  markerType: 'SELF' | 'APPOINTED' | 'AGENT';
  expiresAt: Date;
  permissions: string[];
}

interface VerifiedLinkPayload extends MarkingLinkPayload {
  iat: number;
  exp: number;
}

interface LinkGenerationOptions {
  expiryHours?: number;
  markerType: 'SELF' | 'APPOINTED' | 'AGENT';
  permissions?: string[];
  includePropertyDetails?: boolean;
}

const DEFAULT_EXPIRY_HOURS = 72; // 3 days
const JWT_SECRET = process.env.MARKING_LINK_SECRET || 'your-marking-link-secret-key';
const BASE_URL = process.env.FRONTEND_URL || 'https://newcondo.com';

export class LinkGenerator {
  /**
   * Generate a unique marking link for a property marking job
   */
  static generateMarkingLink(
    jobId: string,
    propertyId: string,
    ownerId: string,
    options: LinkGenerationOptions
  ): string {
    const {
      expiryHours = DEFAULT_EXPIRY_HOURS,
      markerType,
      permissions = ['mark_property', 'upload_images', 'submit_marking'],
      includePropertyDetails = true,
    } = options;

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    // Create payload
    const payload: MarkingLinkPayload = {
      jobId,
      propertyId,
      ownerId,
      markerType,
      expiresAt,
      permissions,
    };

    // Sign the payload with JWT
    const token = sign(payload, JWT_SECRET, {
      expiresIn: `${expiryHours}h`,
    });

    // Create the full URL
    const linkPath = markerType === 'SELF' 
      ? '/marking/self'
      : markerType === 'APPOINTED'
      ? '/marking/appointed'
      : '/marking/agent';

    const url = new URL(`${BASE_URL}${linkPath}`);
    url.searchParams.set('token', token);
    
    if (includePropertyDetails) {
      url.searchParams.set('jobId', jobId);
    }

    return url.toString();
  }

  /**
   * Generate a link for property owner to mark themselves
   */
  static generateSelfMarkingLink(
    jobId: string,
    propertyId: string,
    ownerId: string,
    expiryHours: number = DEFAULT_EXPIRY_HOURS
  ): string {
    return this.generateMarkingLink(jobId, propertyId, ownerId, {
      markerType: 'SELF',
      expiryHours,
      permissions: ['mark_property', 'upload_images', 'submit_marking', 'view_property_details'],
    });
  }

  /**
   * Generate a link for appointed person (someone owner knows)
   */
  static generateAppointedMarkingLink(
    jobId: string,
    propertyId: string,
    ownerId: string,
    expiryHours: number = DEFAULT_EXPIRY_HOURS
  ): string {
    return this.generateMarkingLink(jobId, propertyId, ownerId, {
      markerType: 'APPOINTED',
      expiryHours,
      permissions: ['mark_property', 'upload_images', 'submit_marking', 'view_limited_details'],
    });
  }

  /**
   * Generate a link for assigned agent
   */
  static generateAgentMarkingLink(
    jobId: string,
    propertyId: string,
    ownerId: string,
    expiryHours: number = DEFAULT_EXPIRY_HOURS
  ): string {
    return this.generateMarkingLink(jobId, propertyId, ownerId, {
      markerType: 'AGENT',
      expiryHours,
      permissions: [
        'mark_property',
        'upload_images',
        'submit_marking',
        'view_property_details',
        'contact_owner',
        'view_compensation',
      ],
    });
  }

  /**
   * Verify and decode a marking link token
   */
  static verifyMarkingLink(token: string): {
    isValid: boolean;
    payload?: VerifiedLinkPayload;
    error?: string;
  } {
    try {
      const decoded = verify(token, JWT_SECRET) as VerifiedLinkPayload;

      // Check if link has expired
      const now = new Date();
      const expiresAt = new Date(decoded.expiresAt);

      if (now > expiresAt) {
        return {
          isValid: false,
          error: 'Link has expired',
        };
      }

      return {
        isValid: true,
        payload: decoded,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      };
    }
  }

  /**
   * Generate a short code for easy sharing (alternative to full link)
   */
  static generateShortCode(length: number = 8): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
    let shortCode = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      shortCode += characters[randomIndex];
    }

    return shortCode;
  }

  /**
   * Generate a QR-friendly short URL
   */
  static generateQRLink(
    jobId: string,
    propertyId: string,
    ownerId: string,
    markerType: LinkGenerationOptions['markerType']
  ): string {
    const fullLink = this.generateMarkingLink(jobId, propertyId, ownerId, {
      markerType,
      expiryHours: DEFAULT_EXPIRY_HOURS,
    });

    // Generate short code
    const shortCode = this.generateShortCode();

    // In production, you'd store this mapping in Redis/DB
    // For now, return a shortened format
    return `${BASE_URL}/m/${shortCode}`;
  }

  /**
   * Generate confirmation link for property owner to verify marking
   */
  static generateConfirmationLink(
    jobId: string,
    propertyId: string,
    ownerId: string
  ): string {
    const payload = {
      jobId,
      propertyId,
      ownerId,
      action: 'confirm_marking',
    };

    const token = sign(payload, JWT_SECRET, {
      expiresIn: '7d', // 7 days to confirm
    });

    const url = new URL(`${BASE_URL}/marking/confirm`);
    url.searchParams.set('token', token);
    url.searchParams.set('jobId', jobId);

    return url.toString();
  }

  /**
   * Generate rejection link for property owner to reject marking
   */
  static generateRejectionLink(
    jobId: string,
    propertyId: string,
    ownerId: string
  ): string {
    const payload = {
      jobId,
      propertyId,
      ownerId,
      action: 'reject_marking',
    };

    const token = sign(payload, JWT_SECRET, {
      expiresIn: '7d',
    });

    const url = new URL(`${BASE_URL}/marking/reject`);
    url.searchParams.set('token', token);
    url.searchParams.set('jobId', jobId);

    return url.toString();
  }

  /**
   * Check if a link has specific permission
   */
  static hasPermission(payload: VerifiedLinkPayload, permission: string): boolean {
    return payload.permissions.includes(permission);
  }

  /**
   * Get link metadata (without verification)
   */
  static getLinkMetadata(token: string): {
    jobId?: string;
    propertyId?: string;
    markerType?: string;
    expiresAt?: Date;
  } {
    try {
      // Decode without verification (use with caution)
      const decoded = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      ) as MarkingLinkPayload;

      return {
        jobId: decoded.jobId,
        propertyId: decoded.propertyId,
        markerType: decoded.markerType,
        expiresAt: new Date(decoded.expiresAt),
      };
    } catch {
      return {};
    }
  }

  /**
   * Generate deep link for mobile app
   */
  static generateMobileDeepLink(
    jobId: string,
    propertyId: string,
    ownerId: string,
    markerType: LinkGenerationOptions['markerType']
  ): string {
    const token = sign(
      {
        jobId,
        propertyId,
        ownerId,
        markerType,
      },
      JWT_SECRET,
      { expiresIn: '72h' }
    );

    return `newcondo://marking?token=${token}`;
  }

  /**
   * Extract job ID from link
   */
  static extractJobId(link: string): string | null {
    try {
      const url = new URL(link);
      return url.searchParams.get('jobId');
    } catch {
      return null;
    }
  }

  /**
   * Check if link is still valid (by expiry date)
   */
  static isLinkActive(token: string): boolean {
    const verification = this.verifyMarkingLink(token);
    return verification.isValid;
  }

  /**
   * Generate a one-time use link (should be invalidated after first use)
   */
  static generateOneTimeLink(
    jobId: string,
    propertyId: string,
    ownerId: string,
    markerType: LinkGenerationOptions['markerType']
  ): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const payload = {
      jobId,
      propertyId,
      ownerId,
      markerType,
      nonce,
      oneTimeUse: true,
    };

    const token = sign(payload, JWT_SECRET, {
      expiresIn: '24h',
    });

    const url = new URL(`${BASE_URL}/marking/one-time`);
    url.searchParams.set('token', token);

    return url.toString();
  }

  /**
   * Generate tracking link to monitor link clicks
   */
  static generateTrackableLink(
    baseLink: string,
    trackingId: string
  ): string {
    const url = new URL(baseLink);
    url.searchParams.set('tid', trackingId);
    return url.toString();
  }
}

// Export types
export type { MarkingLinkPayload, VerifiedLinkPayload, LinkGenerationOptions };