// backend/referral-service/src/services/fraudDetectionService.ts

import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

interface FraudCheckResult {
  isFraudulent: boolean;
  reason?: string;
  riskScore: number; // 0-100
  flags: string[];
}

/**
 * Fraud Detection Service
 * Prevents referral fraud and gaming of the system
 */
class FraudDetectionService {
  // Risk thresholds
  private readonly HIGH_RISK_THRESHOLD = 70;
  private readonly MEDIUM_RISK_THRESHOLD = 40;

  // Fraud detection rules
  private readonly MAX_REFERRALS_PER_DAY = 10;
  private readonly MAX_REFERRALS_PER_HOUR = 3;
  private readonly MAX_SAME_IP_REFERRALS = 5;
  private readonly MIN_TIME_BETWEEN_REFERRALS_MS = 60000; // 1 minute

  /**
   * Check if a referral is fraudulent
   */
  async checkReferral(params: {
    referrerId: string;
    referredEmail?: string;
    referredPhone?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<FraudCheckResult> {
    const { referrerId, referredEmail, referredPhone, ipAddress, userAgent } = params;

    const flags: string[] = [];
    let riskScore = 0;

    // Check 1: Self-referral
    if (await this.isSelfReferral(referrerId, referredEmail, referredPhone)) {
      flags.push('SELF_REFERRAL');
      riskScore += 100; // Instant fraud
    }

    // Check 2: Rate limiting - too many referrals
    const recentReferralCount = await this.getRecentReferralCount(referrerId);
    if (recentReferralCount.lastHour >= this.MAX_REFERRALS_PER_HOUR) {
      flags.push('EXCESSIVE_HOURLY_REFERRALS');
      riskScore += 50;
    }
    if (recentReferralCount.lastDay >= this.MAX_REFERRALS_PER_DAY) {
      flags.push('EXCESSIVE_DAILY_REFERRALS');
      riskScore += 40;
    }

    // Check 3: Same IP address abuse
    if (ipAddress) {
      const sameIpCount = await this.countSameIpReferrals(referrerId, ipAddress);
      if (sameIpCount >= this.MAX_SAME_IP_REFERRALS) {
        flags.push('SAME_IP_ABUSE');
        riskScore += 60;
      }
    }

    // Check 4: Suspicious timing patterns
    const timingFraud = await this.checkTimingPatterns(referrerId);
    if (timingFraud.isSuspicious) {
      flags.push('SUSPICIOUS_TIMING');
      riskScore += 30;
    }

    // Check 5: Device fingerprinting
    if (userAgent) {
      const deviceFraud = await this.checkDeviceFingerprint(referrerId, userAgent);
      if (deviceFraud.isSuspicious) {
        flags.push('DEVICE_FINGERPRINT_MATCH');
        riskScore += 35;
      }
    }

    // Check 6: Email/phone patterns
    if (referredEmail || referredPhone) {
      const patternFraud = await this.checkContactPatterns(
        referrerId,
        referredEmail,
        referredPhone
      );
      if (patternFraud.isSuspicious) {
        flags.push('SUSPICIOUS_CONTACT_PATTERN');
        riskScore += 25;
      }
    }

    // Check 7: Circular referrals
    if (await this.isCircularReferral(referrerId, referredEmail, referredPhone)) {
      flags.push('CIRCULAR_REFERRAL');
      riskScore += 70;
    }

    // Check 8: Duplicate account detection
    if (await this.isDuplicateAccount(referredEmail, referredPhone)) {
      flags.push('DUPLICATE_ACCOUNT');
      riskScore += 80;
    }

    // Check 9: Velocity check - too fast signups from same referrer
    const velocityCheck = await this.checkVelocity(referrerId);
    if (velocityCheck.isSuspicious) {
      flags.push('HIGH_VELOCITY');
      riskScore += 40;
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    const isFraudulent = riskScore >= this.HIGH_RISK_THRESHOLD;
    const reason = isFraudulent
      ? `High risk score (${riskScore}): ${flags.join(', ')}`
      : undefined;

    // Log fraud check
    await this.logFraudCheck({
      referrerId,
      riskScore,
      flags,
      isFraudulent,
      ipAddress,
      userAgent,
    });

    return {
      isFraudulent,
      reason,
      riskScore,
      flags,
    };
  }

  /**
   * Check if user is trying to refer themselves
   */
  private async isSelfReferral(
    referrerId: string,
    referredEmail?: string,
    referredPhone?: string
  ): Promise<boolean> {
    const referrer = await prisma.user.findUnique({
      where: { id: referrerId },
      select: { email: true, phone: true },
    });

    if (!referrer) return false;

    return (
      (referredEmail && referrer.email === referredEmail) ||
      (referredPhone && referrer.phone === referredPhone)
    );
  }

  /**
   * Get count of recent referrals
   */
  private async getRecentReferralCount(referrerId: string) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [lastHour, lastDay] = await Promise.all([
      prisma.referral.count({
        where: {
          referrerId,
          createdAt: { gte: oneHourAgo },
        },
      }),
      prisma.referral.count({
        where: {
          referrerId,
          createdAt: { gte: oneDayAgo },
        },
      }),
    ]);

    return { lastHour, lastDay };
  }

  /**
   * Count referrals from same IP address
   */
  private async countSameIpReferrals(
    referrerId: string,
    ipAddress: string
  ): Promise<number> {
    const count = await prisma.referralClick.count({
      where: {
        referrerId,
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    return count;
  }

  /**
   * Check timing patterns for suspicious behavior
   */
  private async checkTimingPatterns(referrerId: string) {
    const recentReferrals = await prisma.referral.findMany({
      where: {
        referrerId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    if (recentReferrals.length < 2) {
      return { isSuspicious: false };
    }

    // Check for referrals created too quickly (within 1 minute)
    let quickReferrals = 0;
    for (let i = 1; i < recentReferrals.length; i++) {
      const timeDiff =
        recentReferrals[i].createdAt.getTime() -
        recentReferrals[i - 1].createdAt.getTime();
      if (timeDiff < this.MIN_TIME_BETWEEN_REFERRALS_MS) {
        quickReferrals++;
      }
    }

    return {
      isSuspicious: quickReferrals >= 3,
      quickReferrals,
    };
  }

  /**
   * Check device fingerprint for suspicious patterns
   */
  private async checkDeviceFingerprint(referrerId: string, userAgent: string) {
    const sameDeviceCount = await prisma.referralClick.count({
      where: {
        referrerId,
        userAgent,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      isSuspicious: sameDeviceCount >= 5,
      count: sameDeviceCount,
    };
  }

  /**
   * Check for suspicious contact patterns
   */
  private async checkContactPatterns(
    referrerId: string,
    email?: string,
    phone?: string
  ) {
    // Check for similar email/phone patterns (e.g., user+1@example.com, user+2@example.com)
    const referrals = await prisma.referral.findMany({
      where: { referrerId },
      include: {
        referred: {
          select: { email: true, phone: true },
        },
      },
    });

    if (referrals.length < 3) {
      return { isSuspicious: false };
    }

    // Check email pattern
    let suspiciousEmailCount = 0;
    if (email) {
      const baseEmail = email.split('+')[0];
      suspiciousEmailCount = referrals.filter((r) =>
        r.referred.email?.startsWith(baseEmail)
      ).length;
    }

    // Check phone pattern (sequential numbers)
    let suspiciousPhoneCount = 0;
    if (phone) {
      const basePhone = phone.substring(0, phone.length - 2);
      suspiciousPhoneCount = referrals.filter((r) =>
        r.referred.phone?.startsWith(basePhone)
      ).length;
    }

    return {
      isSuspicious: suspiciousEmailCount >= 3 || suspiciousPhoneCount >= 3,
      suspiciousEmailCount,
      suspiciousPhoneCount,
    };
  }

  /**
   * Check for circular referrals (A refers B, B refers A)
   */
  private async isCircularReferral(
    referrerId: string,
    referredEmail?: string,
    referredPhone?: string
  ): Promise<boolean> {
    if (!referredEmail && !referredPhone) return false;

    // Check if the person being referred has previously referred the referrer
    const potentialReferredUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: referredEmail },
          { phone: referredPhone },
        ].filter(Boolean),
      },
    });

    if (!potentialReferredUser) return false;

    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: potentialReferredUser.id,
        referredId: referrerId,
      },
    });

    return !!existingReferral;
  }

  /**
   * Check for duplicate accounts
   */
  private async isDuplicateAccount(
    email?: string,
    phone?: string
  ): Promise<boolean> {
    if (!email && !phone) return false;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone },
        ].filter(Boolean),
      },
    });

    return !!existingUser;
  }

  /**
   * Check velocity (rapid signups)
   */
  private async checkVelocity(referrerId: string) {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);

    const recentCount = await prisma.referral.count({
      where: {
        referrerId,
        createdAt: { gte: last5Minutes },
      },
    });

    return {
      isSuspicious: recentCount >= 3,
      count: recentCount,
    };
  }

  /**
   * Log fraud check for audit trail
   */
  private async logFraudCheck(data: {
    referrerId: string;
    riskScore: number;
    flags: string[];
    isFraudulent: boolean;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await prisma.eventLog.create({
      data: {
        userId: data.referrerId,
        type: 'REFERRAL_FRAUD_CHECK',
        metadata: {
          riskScore: data.riskScore,
          flags: data.flags,
          isFraudulent: data.isFraudulent,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Flag user for manual review
   */
  async flagForReview(userId: string, reason: string) {
    // Create support ticket for admin review
    await prisma.supportTicket.create({
      data: {
        userId,
        title: 'Suspicious Referral Activity',
        description: `User flagged for suspicious referral activity. Reason: ${reason}`,
        category: 'GENERAL',
        priority: 'HIGH',
        status: 'OPEN',
      },
    });
  }

  /**
   * Block user from referral program
   */
  async blockFromProgram(userId: string, reason: string) {
    // Deactivate all user's referrals
    await prisma.referral.updateMany({
      where: {
        OR: [{ referrerId: userId }, { referredId: userId }],
      },
      data: {
        isActive: false,
        status: 'CANCELLED',
      },
    });

    // Log the action
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'REFERRAL_PROGRAM_BLOCKED',
        metadata: { reason },
      },
    });
  }
}

export const fraudDetectionService = new FraudDetectionService();