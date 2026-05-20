// backend/admin-service/src/services/referralAuditService.ts

import { prisma } from '@newcondo/db';

interface AuditLogEntry {
  userId?: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

class ReferralAuditService {
  /**
   * Log referral creation
   */
  async logReferralCreation(data: {
    referralId: string;
    referrerId: string;
    referredId: string;
    referralCode: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.createAuditLog({
      userId: data.referrerId,
      action: 'REFERRAL_CREATED',
      targetType: 'Referral',
      targetId: data.referralId,
      details: {
        referralCode: data.referralCode,
        referredUserId: data.referredId,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Log referral click
   */
  async logReferralClick(data: {
    referralCode: string;
    ipAddress?: string;
    userAgent?: string;
    referrerUrl?: string;
  }): Promise<void> {
    await this.createAuditLog({
      action: 'REFERRAL_CLICK',
      targetType: 'ReferralClick',
      targetId: data.referralCode,
      details: {
        referralCode: data.referralCode,
        referrerUrl: data.referrerUrl,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Log referral qualification
   */
  async logReferralQualification(data: {
    referralId: string;
    referrerId: string;
    referredId: string;
    rewardAmount: number;
  }): Promise<void> {
    await this.createAuditLog({
      userId: data.referrerId,
      action: 'REFERRAL_QUALIFIED',
      targetType: 'Referral',
      targetId: data.referralId,
      details: {
        referredUserId: data.referredId,
        rewardAmount: data.rewardAmount,
      },
    });
  }

  /**
   * Log reward issuance
   */
  async logRewardIssued(data: {
    rewardId: string;
    userId: string;
    amount: number;
    rewardType: string;
    source: string;
  }): Promise<void> {
    await this.createAuditLog({
      userId: data.userId,
      action: 'REWARD_ISSUED',
      targetType: 'Reward',
      targetId: data.rewardId,
      details: {
        amount: data.amount,
        rewardType: data.rewardType,
        source: data.source,
      },
    });
  }

  /**
   * Log reward redemption
   */
  async logRewardRedemption(data: {
    rewardId: string;
    userId: string;
    amount: number;
    method: string;
    transactionId?: string;
  }): Promise<void> {
    await this.createAuditLog({
      userId: data.userId,
      action: 'REWARD_REDEEMED',
      targetType: 'Reward',
      targetId: data.rewardId,
      details: {
        amount: data.amount,
        method: data.method,
        transactionId: data.transactionId,
      },
    });
  }

  /**
   * Log payout processing
   */
  async logPayoutProcessed(data: {
    payoutId: string;
    userId: string;
    amount: number;
    status: string;
    reference?: string;
  }): Promise<void> {
    await this.createAuditLog({
      userId: data.userId,
      action: 'PAYOUT_PROCESSED',
      targetType: 'Payout',
      targetId: data.payoutId,
      details: {
        amount: data.amount,
        status: data.status,
        reference: data.reference,
      },
    });
  }

  /**
   * Log admin action
   */
  async logAdminAction(data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await prisma.adminAction.create({
      data: {
        adminId: data.adminId,
        action: data.action as any,
        targetType: data.targetType,
        targetId: data.targetId,
        description: data.description,
        metadata: data.metadata,
      },
    });

    await this.createAuditLog({
      userId: data.adminId,
      action: `ADMIN_${data.action}`,
      targetType: data.targetType,
      targetId: data.targetId,
      details: {
        description: data.description,
        ...data.metadata,
      },
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(data: {
    userId?: string;
    activityType: string;
    details: Record<string, any>;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    ipAddress?: string;
  }): Promise<void> {
    await this.createAuditLog({
      userId: data.userId,
      action: 'SUSPICIOUS_ACTIVITY_DETECTED',
      targetType: 'SecurityAlert',
      targetId: `ALERT_${Date.now()}`,
      details: {
        activityType: data.activityType,
        severity: data.severity,
        ...data.details,
      },
      ipAddress: data.ipAddress,
      metadata: {
        severity: data.severity,
      },
    });
  }

  /**
   * Log commission distribution
   */
  async logCommissionDistribution(data: {
    rentalId: string;
    propertyId: string;
    ownerId: string;
    listingAgentId?: string;
    subAgentId?: string;
    amounts: {
      total: number;
      owner: number;
      listingAgent?: number;
      subAgent?: number;
      platform: number;
    };
  }): Promise<void> {
    await this.createAuditLog({
      action: 'COMMISSION_DISTRIBUTED',
      targetType: 'Rental',
      targetId: data.rentalId,
      details: {
        propertyId: data.propertyId,
        ownerId: data.ownerId,
        listingAgentId: data.listingAgentId,
        subAgentId: data.subAgentId,
        amounts: data.amounts,
      },
    });
  }

  /**
   * Log fraud detection event
   */
  async logFraudDetection(data: {
    userId?: string;
    fraudType: string;
    details: Record<string, any>;
    actionTaken: string;
  }): Promise<void> {
    await this.createAuditLog({
      userId: data.userId,
      action: 'FRAUD_DETECTED',
      targetType: 'FraudAlert',
      targetId: `FRAUD_${Date.now()}`,
      details: {
        fraudType: data.fraudType,
        actionTaken: data.actionTaken,
        ...data.details,
      },
      metadata: {
        severity: 'CRITICAL',
      },
    });
  }

  /**
   * Get audit logs for user
   */
  async getUserAuditLogs(params: {
    userId: string;
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
    actions?: string[];
  }): Promise<any> {
    const where: any = { userId: params.userId };

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = params.startDate;
      if (params.endDate) where.timestamp.lte = params.endDate;
    }

    if (params.actions?.length) {
      where.type = { in: params.actions };
    }

    const [logs, total] = await Promise.all([
      prisma.eventLog.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.eventLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Get audit logs for referral
   */
  async getReferralAuditLogs(referralId: string): Promise<any[]> {
    return await prisma.eventLog.findMany({
      where: {
        metadata: {
          path: ['referralId'],
          equals: referralId,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get suspicious activity logs
   */
  async getSuspiciousActivityLogs(params: {
    page: number;
    limit: number;
    severity?: string;
  }): Promise<any> {
    const where: any = {
      type: 'SUSPICIOUS_ACTIVITY_DETECTED',
    };

    if (params.severity) {
      where.metadata = {
        path: ['severity'],
        equals: params.severity,
      };
    }

    const [logs, total] = await Promise.all([
      prisma.eventLog.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.eventLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Get admin action logs
   */
  async getAdminActionLogs(params: {
    adminId?: string;
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const where: any = {};

    if (params.adminId) {
      where.adminId = params.adminId;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminAction.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(params: {
    startDate: Date;
    endDate: Date;
    format: 'json' | 'csv';
    types?: string[];
  }): Promise<string> {
    const where: any = {
      timestamp: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.types?.length) {
      where.type = { in: params.types };
    }

    const logs = await prisma.eventLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    if (params.format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(entry: AuditLogEntry): Promise<void> {
    await prisma.eventLog.create({
      data: {
        userId: entry.userId,
        type: entry.action,
        metadata: {
          targetType: entry.targetType,
          targetId: entry.targetId,
          ...entry.details,
          ...entry.metadata,
        },
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  /**
   * Helper: Convert to CSV
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = ['timestamp', 'userId', 'type', 'ipAddress', 'details'].join(',');
    const rows = data
      .map((row) => {
        return [
          row.timestamp,
          row.userId || '',
          row.type,
          row.ipAddress || '',
          JSON.stringify(row.metadata || {}),
        ].join(',');
      })
      .join('\n');

    return `${headers}\n${rows}`;
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(params: {
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    const logs = await prisma.eventLog.groupBy({
      by: ['type'],
      where: {
        timestamp: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      _count: { id: true },
    });

    return logs.map((log) => ({
      action: log.type,
      count: log._count.id,
    }));
  }
}

export const referralAuditService = new ReferralAuditService();