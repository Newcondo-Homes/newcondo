// backend/referral-service/src/services/linkGenerationService.ts

import { PrismaClient } from '@newcondo/db';
import { generateReferralCode } from '../utils/codeGenerator';
import { buildAllShareLinks, buildReferralLink } from '../utils/linkBuilder';

const prisma = new PrismaClient();

export class LinkGenerationService {
  /**
   * Generate unique referral link for a user
   */
  async generateReferralLink(userId: string): Promise<{
    referralCode: string;
    referralLink: string;
    shareLinks: any;
  }> {
    // Get or create referral code
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let referralCode = user.referralCode;

    // Generate new code if doesn't exist
    if (!referralCode) {
      let isUnique = false;
      
      while (!isUnique) {
        referralCode = generateReferralCode();
        const existing = await prisma.user.findUnique({
          where: { referralCode },
        });
        isUnique = !existing;
      }

      // Update user with new code
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode },
      });
    }

    // Build all share links
    const referralLink = buildReferralLink({ referralCode });
    const shareLinks = buildAllShareLinks(referralCode);

    return {
      referralCode,
      referralLink,
      shareLinks,
    };
  }

  /**
   * Generate custom referral link with tracking parameters
   */
  async generateCustomLink(
    userId: string,
    options: {
      channel?: string;
      campaign?: string;
      medium?: string;
    }
  ): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user?.referralCode) {
      throw new Error('User does not have a referral code');
    }

    return buildReferralLink({
      referralCode: user.referralCode,
      ...options,
    });
  }

  /**
   * Regenerate referral code for a user
   */
  async regenerateReferralCode(userId: string): Promise<string> {
    let newCode: string;
    let isUnique = false;

    while (!isUnique) {
      newCode = generateReferralCode();
      const existing = await prisma.user.findUnique({
        where: { referralCode: newCode! },
      });
      isUnique = !existing;
    }

    // Update user with new code
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: newCode! },
    });

    // Update all existing referrals
    await prisma.referral.updateMany({
      where: { referrerId: userId },
      data: { referralCode: newCode! },
    });

    return newCode!;
  }

  /**
   * Get all share links for a user
   */
  async getShareLinks(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user?.referralCode) {
      throw new Error('User does not have a referral code');
    }

    return buildAllShareLinks(user.referralCode);
  }
}

export default new LinkGenerationService();