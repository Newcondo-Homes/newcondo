// backend/referral-service/src/services/promotionLinkService.ts

import crypto from 'crypto';

export class PromotionLinkService {
  private readonly BASE_URL = process.env.FRONTEND_URL || 'https://newcondo.com';

  /**
   * Generate a unique referral code
   */
  generateReferralCode(): string {
    // Generate a random 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate a referral link for a property
   */
  generateReferralLink(referralCode: string, propertyId: string): string {
    return `${this.BASE_URL}/properties/${propertyId}?ref=${referralCode}`;
  }

  /**
   * Generate a shareable link for property owner/listing agent
   */
  generateShareableLink(propertyId: string): string {
    const shareCode = this.generateShareCode(propertyId);
    return `${this.BASE_URL}/properties/${propertyId}?share=${shareCode}`;
  }

  /**
   * Generate a unique share code for property
   */
  private generateShareCode(propertyId: string): string {
    // Create a hash of property ID with timestamp for uniqueness
    const hash = crypto
      .createHash('sha256')
      .update(propertyId + Date.now().toString())
      .digest('hex');
    return hash.substring(0, 12).toUpperCase();
  }

  /**
   * Parse referral code from URL
   */
  parseReferralCode(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('ref');
    } catch {
      return null;
    }
  }

  /**
   * Validate referral code format
   */
  isValidReferralCode(code: string): boolean {
    // Check if code is 8 characters and alphanumeric
    return /^[A-Z0-9]{8}$/.test(code);
  }

  /**
   * Generate promotion link for marking service
   */
  generateMarkingLink(markingJobId: string, token: string): string {
    return `${this.BASE_URL}/marking/${markingJobId}?token=${token}`;
  }

  /**
   * Generate secure token for marking link
   */
  generateMarkingToken(markingJobId: string, contactPersonPhone: string): string {
    const data = `${markingJobId}-${contactPersonPhone}-${Date.now()}`;
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 32);
  }
}

export const promotionLinkService = new PromotionLinkService();