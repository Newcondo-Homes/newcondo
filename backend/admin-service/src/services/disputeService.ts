import { PrismaClient, PaymentStatus, RentalStatus, AdminActionType } from '@newcondo/db';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../shared/src/utils/errors';
import { flutterwaveService } from '../../../shared/src/utils/flutterwave';
import { emailService } from '../../../shared/src/utils/email';
import { smsService } from '../../../shared/src/utils/sms';

const prisma = new PrismaClient();

interface DisputeReason {
  category: 'PROPERTY_MISMATCH' | 'UNAVAILABLE' | 'FRAUD' | 'OTHER';
  description: string;
  evidence?: string[]; // URLs to uploaded evidence
}

interface DisputeResolution {
  action: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND';
  refundAmount?: number;
  reason: string;
  compensationToOwner?: number;
}

interface DisputeDetails {
  id: string;
  paymentId: string;
  rentalId: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  propertyId: string;
  unitId?: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  disputeReason: DisputeReason;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  submittedAt: Date;
  reviewedBy?: string;
  resolvedAt?: Date;
  resolution?: DisputeResolution;
}

export class DisputeService {
  /**
   * Submit a dispute for a payment during the confirmation period
   */
  async submitDispute(
    paymentId: string,
    renterId: string,
    disputeReason: DisputeReason
  ): Promise<DisputeDetails> {
    // Fetch payment with all related data
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        rental: {
          include: {
            property: true,
            unit: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== renterId) {
      throw new ForbiddenError('You can only dispute your own payments');
    }

    // Check if payment is in HELD status (within confirmation period)
    if (payment.status !== PaymentStatus.HELD) {
      throw new BadRequestError('Payment is not in confirmation period. Disputes can only be raised for held payments.');
    }

    // Check if confirmation period has not expired
    if (payment.confirmationPeriodEnd && new Date() > payment.confirmationPeriodEnd) {
      throw new BadRequestError('Confirmation period has expired. Cannot raise a dispute.');
    }

    if (!payment.rental) {
      throw new BadRequestError('No rental associated with this payment');
    }

    // Create support ticket for the dispute
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: renterId,
        title: `Payment Dispute - ${payment.rental.property.title}`,
        description: JSON.stringify({
          paymentId,
          rentalId: payment.rentalId,
          propertyId: payment.rental.propertyId,
          unitId: payment.rental.unitId,
          disputeReason,
        }),
        category: 'BILLING',
        priority: 'HIGH',
        status: 'OPEN',
      },
    });

    // Update rental status
    await prisma.rental.update({
      where: { id: payment.rentalId! },
      data: {
        status: RentalStatus.PENDING_CONFIRMATION,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        userId: renterId,
        type: 'DISPUTE_SUBMITTED',
        metadata: {
          paymentId,
          rentalId: payment.rentalId,
          ticketId: ticket.id,
          category: disputeReason.category,
        },
      },
    });

    // Notify admin
    await this.notifyAdminOfDispute(payment, disputeReason);

    // Notify property owner/agent
    await this.notifyOwnerOfDispute(payment.rental, disputeReason);

    return {
      id: ticket.id,
      paymentId: payment.id,
      rentalId: payment.rental.id,
      renterId: payment.userId,
      renterName: payment.user.name || 'Unknown',
      renterEmail: payment.user.email,
      renterPhone: payment.user.phone || '',
      propertyId: payment.rental.propertyId,
      unitId: payment.rental.unitId || undefined,
      propertyTitle: payment.rental.property.title,
      propertyAddress: payment.rental.property.address,
      amount: parseFloat(payment.amount.toString()),
      disputeReason,
      status: 'PENDING',
      submittedAt: ticket.createdAt,
    };
  }

  /**
   * Get all pending disputes for admin review
   */
  async getPendingDisputes(adminId: string): Promise<DisputeDetails[]> {
    // Verify admin role
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can view disputes');
    }

    const tickets = await prisma.supportTicket.findMany({
      where: {
        category: 'BILLING',
        priority: 'HIGH',
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const disputes: DisputeDetails[] = [];

    for (const ticket of tickets) {
      try {
        const metadata = JSON.parse(ticket.description);
        
        if (!metadata.disputeReason) continue; // Skip non-dispute tickets

        const payment = await prisma.payment.findUnique({
          where: { id: metadata.paymentId },
          include: {
            rental: {
              include: {
                property: true,
              },
            },
          },
        });

        if (!payment || !payment.rental) continue;

        disputes.push({
          id: ticket.id,
          paymentId: payment.id,
          rentalId: payment.rentalId!,
          renterId: ticket.userId,
          renterName: ticket.user.name || 'Unknown',
          renterEmail: ticket.user.email,
          renterPhone: ticket.user.phone || '',
          propertyId: metadata.propertyId,
          unitId: metadata.unitId,
          propertyTitle: payment.rental.property.title,
          propertyAddress: payment.rental.property.address,
          amount: parseFloat(payment.amount.toString()),
          disputeReason: metadata.disputeReason,
          status: ticket.status === 'OPEN' ? 'PENDING' : 'UNDER_REVIEW',
          submittedAt: ticket.createdAt,
          reviewedBy: ticket.resolvedBy || undefined,
          resolvedAt: ticket.resolvedAt || undefined,
        });
      } catch (error) {
        console.error('Error parsing ticket metadata:', error);
      }
    }

    return disputes;
  }

  /**
   * Resolve a dispute with admin decision
   */
  async resolveDispute(
    ticketId: string,
    adminId: string,
    resolution: DisputeResolution
  ): Promise<DisputeDetails> {
    // Verify admin role
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can resolve disputes');
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
      },
    });

    if (!ticket) {
      throw new NotFoundError('Dispute ticket not found');
    }

    const metadata = JSON.parse(ticket.description);
    const payment = await prisma.payment.findUnique({
      where: { id: metadata.paymentId },
      include: {
        rental: {
          include: {
            property: {
              include: {
                owner: true,
                agent: true,
              },
            },
            unit: true,
          },
        },
      },
    });

    if (!payment || !payment.rental) {
      throw new NotFoundError('Payment or rental not found');
    }

    // Process refund if applicable
    let refundSuccessful = false;
    if (resolution.action === 'FULL_REFUND' || resolution.action === 'PARTIAL_REFUND') {
      const refundAmount = resolution.action === 'FULL_REFUND' 
        ? parseFloat(payment.amount.toString())
        : resolution.refundAmount!;

      try {
        refundSuccessful = await this.processRefund(payment.id, refundAmount, resolution.reason);
      } catch (error) {
        console.error('Refund processing failed:', error);
        throw new BadRequestError('Failed to process refund. Please try again.');
      }
    }

    // Update ticket
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        adminResponse: JSON.stringify(resolution),
      },
    });

    // Update rental status
    const newRentalStatus = resolution.action === 'NO_REFUND' 
      ? RentalStatus.ACTIVE 
      : RentalStatus.TERMINATED;

    await prisma.rental.update({
      where: { id: payment.rentalId! },
      data: {
        status: newRentalStatus,
      },
    });

    // Update payment status
    if (refundSuccessful) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });
    } else if (resolution.action === 'NO_REFUND') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: new Date(),
        },
      });
    }

    // Release property/unit lock if refunded
    if (refundSuccessful) {
      if (payment.rental.unitId) {
        await prisma.propertyUnit.update({
          where: { id: payment.rental.unitId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null,
          },
        });
      } else {
        await prisma.property.update({
          where: { id: payment.rental.propertyId },
          data: {
            isPaymentLocked: false,
            paymentLockExpiry: null,
          },
        });
      }
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.PAYMENT_REFUNDED,
        targetType: 'Payment',
        targetId: payment.id,
        description: `Dispute resolved: ${resolution.action}`,
        metadata: {
          ticketId,
          resolution,
          refundAmount: resolution.refundAmount,
        },
      },
    });

    // Notify renter of resolution
    await this.notifyRenterOfResolution(ticket.user, payment.rental, resolution);

    // Notify owner/agent of resolution
    await this.notifyOwnerOfResolution(payment.rental, resolution);

    return {
      id: ticket.id,
      paymentId: payment.id,
      rentalId: payment.rental.id,
      renterId: ticket.userId,
      renterName: ticket.user.name || 'Unknown',
      renterEmail: ticket.user.email,
      renterPhone: ticket.user.phone || '',
      propertyId: payment.rental.propertyId,
      unitId: payment.rental.unitId || undefined,
      propertyTitle: payment.rental.property.title,
      propertyAddress: payment.rental.property.address,
      amount: parseFloat(payment.amount.toString()),
      disputeReason: metadata.disputeReason,
      status: 'RESOLVED',
      submittedAt: ticket.createdAt,
      reviewedBy: adminId,
      resolvedAt: new Date(),
      resolution,
    };
  }

  /**
   * Process refund through Flutterwave
   */
  private async processRefund(
    paymentId: string,
    refundAmount: number,
    reason: string
  ): Promise<boolean> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || !payment.transactionId) {
      throw new BadRequestError('Payment transaction not found');
    }

    try {
      // Process refund through Flutterwave
      const refundResponse = await flutterwaveService.processRefund({
        transactionId: payment.transactionId,
        amount: refundAmount,
        comments: reason,
      });

      if (refundResponse.status === 'success') {
        // Update payment record
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.REFUNDED,
            description: `Refunded: ${reason}`,
          },
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Flutterwave refund error:', error);
      throw error;
    }
  }

  /**
   * Notify admin of new dispute
   */
  private async notifyAdminOfDispute(payment: any, disputeReason: DisputeReason): Promise<void> {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    for (const admin of admins) {
      if (admin.email) {
        await emailService.send({
          to: admin.email,
          subject: 'New Payment Dispute Submitted',
          template: 'dispute-notification',
          data: {
            adminName: admin.name,
            propertyTitle: payment.rental.property.title,
            amount: parseFloat(payment.amount.toString()),
            category: disputeReason.category,
            description: disputeReason.description,
          },
        });
      }
    }
  }

  /**
   * Notify property owner/agent of dispute
   */
  private async notifyOwnerOfDispute(rental: any, disputeReason: DisputeReason): Promise<void> {
    const owner = rental.property.owner;
    const agent = rental.property.agent;

    const message = `A dispute has been raised for your property "${rental.property.title}". Reason: ${disputeReason.category}. The admin team is reviewing the case.`;

    // Notify owner
    if (owner.email) {
      await emailService.send({
        to: owner.email,
        subject: 'Payment Dispute Notification',
        template: 'owner-dispute-notification',
        data: {
          ownerName: owner.name,
          propertyTitle: rental.property.title,
          category: disputeReason.category,
          description: disputeReason.description,
        },
      });
    }

    if (owner.phone) {
      await smsService.send({
        to: owner.phone,
        message,
      });
    }

    // Notify agent if exists
    if (agent) {
      if (agent.email) {
        await emailService.send({
          to: agent.email,
          subject: 'Payment Dispute Notification',
          template: 'agent-dispute-notification',
          data: {
            agentName: agent.name,
            propertyTitle: rental.property.title,
            category: disputeReason.category,
            description: disputeReason.description,
          },
        });
      }

      if (agent.phone) {
        await smsService.send({
          to: agent.phone,
          message,
        });
      }
    }
  }

  /**
   * Notify renter of dispute resolution
   */
  private async notifyRenterOfResolution(
    renter: any,
    rental: any,
    resolution: DisputeResolution
  ): Promise<void> {
    const actionText = resolution.action === 'FULL_REFUND' 
      ? 'approved for full refund'
      : resolution.action === 'PARTIAL_REFUND'
      ? `approved for partial refund of ₦${resolution.refundAmount?.toLocaleString()}`
      : 'rejected';

    const message = `Your dispute for "${rental.property.title}" has been ${actionText}. Reason: ${resolution.reason}`;

    if (renter.email) {
      await emailService.send({
        to: renter.email,
        subject: 'Dispute Resolution Update',
        template: 'dispute-resolution',
        data: {
          renterName: renter.name,
          propertyTitle: rental.property.title,
          action: resolution.action,
          refundAmount: resolution.refundAmount,
          reason: resolution.reason,
        },
      });
    }

    if (renter.phone) {
      await smsService.send({
        to: renter.phone,
        message,
      });
    }
  }

  /**
   * Notify owner/agent of dispute resolution
   */
  private async notifyOwnerOfResolution(
    rental: any,
    resolution: DisputeResolution
  ): Promise<void> {
    const owner = rental.property.owner;
    const agent = rental.property.agent;

    const message = `The dispute for "${rental.property.title}" has been resolved: ${resolution.action}. ${resolution.reason}`;

    // Notify owner
    if (owner.email) {
      await emailService.send({
        to: owner.email,
        subject: 'Dispute Resolution Update',
        template: 'owner-resolution-notification',
        data: {
          ownerName: owner.name,
          propertyTitle: rental.property.title,
          action: resolution.action,
          compensationToOwner: resolution.compensationToOwner,
          reason: resolution.reason,
        },
      });
    }

    if (owner.phone) {
      await smsService.send({
        to: owner.phone,
        message,
      });
    }

    // Notify agent if exists
    if (agent) {
      if (agent.email) {
        await emailService.send({
          to: agent.email,
          subject: 'Dispute Resolution Update',
          template: 'agent-resolution-notification',
          data: {
            agentName: agent.name,
            propertyTitle: rental.property.title,
            action: resolution.action,
            reason: resolution.reason,
          },
        });
      }

      if (agent.phone) {
        await smsService.send({
          to: agent.phone,
          message,
        });
      }
    }
  }

  /**
   * Get dispute details by ticket ID
   */
  async getDisputeDetails(ticketId: string, adminId: string): Promise<DisputeDetails> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can view dispute details');
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
      },
    });

    if (!ticket) {
      throw new NotFoundError('Dispute ticket not found');
    }

    const metadata = JSON.parse(ticket.description);
    const payment = await prisma.payment.findUnique({
      where: { id: metadata.paymentId },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payment || !payment.rental) {
      throw new NotFoundError('Payment or rental not found');
    }

    let resolution: DisputeResolution | undefined;
    if (ticket.adminResponse) {
      try {
        resolution = JSON.parse(ticket.adminResponse);
      } catch (error) {
        console.error('Error parsing admin response:', error);
      }
    }

    return {
      id: ticket.id,
      paymentId: payment.id,
      rentalId: payment.rentalId!,
      renterId: ticket.userId,
      renterName: ticket.user.name || 'Unknown',
      renterEmail: ticket.user.email,
      renterPhone: ticket.user.phone || '',
      propertyId: metadata.propertyId,
      unitId: metadata.unitId,
      propertyTitle: payment.rental.property.title,
      propertyAddress: payment.rental.property.address,
      amount: parseFloat(payment.amount.toString()),
      disputeReason: metadata.disputeReason,
      status: ticket.status === 'RESOLVED' ? 'RESOLVED' : ticket.status === 'IN_PROGRESS' ? 'UNDER_REVIEW' : 'PENDING',
      submittedAt: ticket.createdAt,
      reviewedBy: ticket.resolvedBy || undefined,
      resolvedAt: ticket.resolvedAt || undefined,
      resolution,
    };
  }
}

export const disputeService = new DisputeService();