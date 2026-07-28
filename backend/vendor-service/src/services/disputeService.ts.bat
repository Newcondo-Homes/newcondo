import { PrismaClient, PaymentStatus, RentalStatus } from '@newcondo/db';
import { refundService } from './refundService';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface DisputeRequest {
  paymentId: string;
  userId: string;
  reason: string;
  evidence?: string[];
}

interface DisputeResolution {
  disputeId: string;
  resolution: 'APPROVE_REFUND' | 'REJECT_DISPUTE';
  adminNotes: string;
  adminId: string;
}

class DisputeService {
  /**
   * Create a dispute for a payment
   */
  async createDispute(data: DisputeRequest) {
    const { paymentId, userId, reason, evidence } = data;

    // Verify payment exists and belongs to user
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
        status: PaymentStatus.HELD,
      },
      include: {
        rental: {
          include: {
            property: true,
            unit: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found or not eligible for dispute');
    }

    // Check if still within confirmation period
    if (
      payment.confirmationPeriodEnd &&
      new Date() > payment.confirmationPeriodEnd
    ) {
      throw new Error('Confirmation period has ended. Cannot create dispute.');
    }

    // Check if rental exists
    if (!payment.rental) {
      throw new Error('No rental associated with this payment');
    }

    // Create dispute record (you'd need a Dispute model in Prisma)
    // For now, we'll use EventLog as a temporary solution
    const dispute = await prisma.eventLog.create({
      data: {
        userId,
        type: 'PAYMENT_DISPUTE_CREATED',
        metadata: {
          paymentId,
          rentalId: payment.rentalId,
          propertyId: payment.rental.propertyId,
          unitId: payment.rental.unitId,
          reason,
          evidence,
          amount: payment.amount.toString(),
          status: 'PENDING',
        },
      },
    });

    // Notify admin about new dispute
    await notificationService.notifyAdminOfDispute({
      disputeId: dispute.id,
      paymentId,
      userId,
      propertyTitle: payment.rental.property.title,
      reason,
    });

    // Notify property owner/agent
    await notificationService.notifyOwnerOfDispute({
      ownerId: payment.rental.property.ownerId,
      agentId: payment.rental.property.agentId,
      propertyTitle: payment.rental.property.title,
      renterName: userId,
    });

    return {
      success: true,
      disputeId: dispute.id,
      message: 'Dispute created successfully. Admin will review within 24 hours.',
    };
  }

  /**
   * Get dispute details
   */
  async getDispute(disputeId: string, userId: string) {
    const dispute = await prisma.eventLog.findFirst({
      where: {
        id: disputeId,
        type: 'PAYMENT_DISPUTE_CREATED',
      },
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const metadata = dispute.metadata as any;

    // Verify user has access to this dispute
    if (dispute.userId !== userId) {
      // Check if user is admin or property owner
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'ADMIN') {
        const property = await prisma.property.findFirst({
          where: {
            id: metadata.propertyId,
            OR: [{ ownerId: userId }, { agentId: userId }],
          },
        });

        if (!property) {
          throw new Error('Unauthorized access to dispute');
        }
      }
    }

    return {
      disputeId: dispute.id,
      ...metadata,
      createdAt: dispute.timestamp,
    };
  }

  /**
   * Resolve dispute (Admin only)
   */
  async resolveDispute(data: DisputeResolution) {
    const { disputeId, resolution, adminNotes, adminId } = data;

    // Verify admin user
    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: 'ADMIN',
      },
    });

    if (!admin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get dispute
    const dispute = await prisma.eventLog.findFirst({
      where: {
        id: disputeId,
        type: 'PAYMENT_DISPUTE_CREATED',
      },
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const metadata = dispute.metadata as any;

    if (metadata.status !== 'PENDING') {
      throw new Error('Dispute already resolved');
    }

    if (resolution === 'APPROVE_REFUND') {
      // Process refund
      const refundResult = await refundService.processRefund({
        paymentId: metadata.paymentId,
        reason: `Dispute approved: ${adminNotes}`,
        requestedBy: adminId,
        isAdminApproved: true,
      });

      // Update dispute status
      await prisma.eventLog.update({
        where: { id: disputeId },
        data: {
          metadata: {
            ...metadata,
            status: 'APPROVED',
            resolution: 'REFUND_PROCESSED',
            adminNotes,
            resolvedBy: adminId,
            resolvedAt: new Date().toISOString(),
            refundId: refundResult.refundId,
          },
        },
      });

      // Notify renter
      await notificationService.notifyRenterOfDisputeResolution({
        userId: dispute.userId!,
        disputeId,
        resolution: 'APPROVED',
        refundAmount: refundResult.refundAmount,
      });

      return {
        success: true,
        message: 'Dispute approved and refund processed',
        refundId: refundResult.refundId,
      };
    } else {
      // Reject dispute - payment will be released normally
      await prisma.eventLog.update({
        where: { id: disputeId },
        data: {
          metadata: {
            ...metadata,
            status: 'REJECTED',
            resolution: 'DISPUTE_REJECTED',
            adminNotes,
            resolvedBy: adminId,
            resolvedAt: new Date().toISOString(),
          },
        },
      });

      // Notify renter
      await notificationService.notifyRenterOfDisputeResolution({
        userId: dispute.userId!,
        disputeId,
        resolution: 'REJECTED',
        adminNotes,
      });

      return {
        success: true,
        message: 'Dispute rejected. Payment will be released as scheduled.',
      };
    }
  }

  /**
   * Get all disputes for admin dashboard
   */
  async getAllDisputes(filters?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    userId?: string;
    propertyId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      type: 'PAYMENT_DISPUTE_CREATED',
    };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    const disputes = await prisma.eventLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    // Filter by status and propertyId if needed (from metadata)
    let filteredDisputes = disputes;

    if (filters?.status) {
      filteredDisputes = disputes.filter((d) => {
        const metadata = d.metadata as any;
        return metadata.status === filters.status;
      });
    }

    if (filters?.propertyId) {
      filteredDisputes = filteredDisputes.filter((d) => {
        const metadata = d.metadata as any;
        return metadata.propertyId === filters.propertyId;
      });
    }

    return {
      disputes: filteredDisputes.map((d) => ({
        disputeId: d.id,
        ...(d.metadata as any),
        createdAt: d.timestamp,
      })),
      total: filteredDisputes.length,
    };
  }

  /**
   * Auto-reject disputes after confirmation period
   */
  async autoRejectExpiredDisputes() {
    const disputes = await prisma.eventLog.findMany({
      where: {
        type: 'PAYMENT_DISPUTE_CREATED',
      },
    });

    const expiredDisputes = disputes.filter((d) => {
      const metadata = d.metadata as any;
      if (metadata.status !== 'PENDING') return false;

      const payment = metadata.paymentId;
      // Check if confirmation period has ended
      return true; // Implement actual check
    });

    for (const dispute of expiredDisputes) {
      const metadata = dispute.metadata as any;

      await prisma.eventLog.update({
        where: { id: dispute.id },
        data: {
          metadata: {
            ...metadata,
            status: 'AUTO_REJECTED',
            resolution: 'CONFIRMATION_PERIOD_EXPIRED',
            resolvedAt: new Date().toISOString(),
          },
        },
      });

      // Notify renter
      await notificationService.notifyRenterOfDisputeResolution({
        userId: dispute.userId!,
        disputeId: dispute.id,
        resolution: 'AUTO_REJECTED',
        reason: 'Confirmation period expired',
      });
    }

    return {
      processed: expiredDisputes.length,
    };
  }
}

export const disputeService = new DisputeService();

// Notification service placeholder
const notificationService = {
  async notifyAdminOfDispute(data: any) {
    console.log('Notify admin of dispute:', data);
  },
  async notifyOwnerOfDispute(data: any) {
    console.log('Notify owner of dispute:', data);
  },
  async notifyRenterOfDisputeResolution(data: any) {
    console.log('Notify renter of dispute resolution:', data);
  },
};