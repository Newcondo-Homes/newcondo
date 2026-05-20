import { prisma, PaymentStatus, RentalStatus, AdminActionType, Prisma } from '@newcondo/db';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} from '@newcondo/backend-shared/';
import { processRefund as flutterwaveProcessRefund } from '@newcondo/backend-shared/';
import { sendEmail as sendEmailRaw } from '@newcondo/backend-shared/';
//TODO: implement sms service at backend-shared
// import { smsService } from '@newcondo/backend-shared/';
import {
  DisputeReason,
  DisputeResolution,
  DisputeDetails,
  DisputeFilters,
  ResolveDisputeParams,
  UpdateDisputeStatusParams,
  AddDisputeNoteParams,
  EscalateDisputeParams,
  SubmitDisputeResult,
  DisputeStats,
  DisputeListItem,
  DisputeListResult,
  DisputeDetailsResult,
  DisputeNote,
  TimelineEvent,
  DisputeTimeline,
  UpdatedDispute
} from '../types/dispute'

interface NotifyEmailParams {
  to: string;
  subject: string;
  body: string;
}


// ── SMS: no sms util exists yet — thin stub so the file compiles ──────────────
// Replace this with a real import once you build backend/shared/src/utils/sms.ts
const smsStub = {
  send: async ({ to, message }: { to: string; message: string }): Promise<void> => {
    // TODO: implement sms.ts in backend-shared and replace this stub
    console.log(`[SMS STUB] To: ${to} | ${message}`);
  },
};

// sendEmailRaw() expects { to, subject, html, text? }.
// We wrap it in two thin helpers to keep the rest of the file clean.

//TODO: the design for the dispute email is bare and plain, design it letter
// to suit newcondo brand and design
async function sendPlainEmail(to: string, subject: string, body: string): Promise<void> {
  await sendEmailRaw({
    to,
    subject,
    html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    text: body,
  });
}

async function sendSms(to: string, message: string): Promise<void> {
  await smsStub.send({ to, message });
}

// ─── Email helpers that previously used emailService.send() ──────────────────
// emailService.send() accepted { to, subject, template, data }.
// Since that object doesn't exist, we fall back to sendPlainEmail().
// When you add HTML templates, replace the body strings with proper HTML.

async function emailAdminOfDispute(
  admin: { name: string | null; email: string },
  propertyTitle: string,
  amount: number,
  reason: string,
  description: string
): Promise<void> {
  await sendPlainEmail(
    admin.email,
    'New Payment Dispute Submitted',
    `Hi ${admin.name ?? 'Admin'},\n\nA new dispute has been submitted for "${propertyTitle}".\nAmount: ₦${amount.toLocaleString()}\nReason: ${reason}\n\n${description}`
  );
}

async function emailOwnerOfDispute(
  owner: { name: string | null; email: string },
  propertyTitle: string,
  reason: string,
  description: string
): Promise<void> {
  await sendPlainEmail(
    owner.email,
    'Payment Dispute Notification',
    `Hi ${owner.name ?? 'Owner'},\n\nA dispute has been raised for your property "${propertyTitle}".\nReason: ${reason}\n\n${description}\n\nThe admin team is reviewing the case.`
  );
}

async function emailRenterOfResolution(
  renter: { name: string | null; email: string },
  propertyTitle: string,
  resolutionOutcome: string,
  refundAmount: number | undefined,
  resolutionReason: string
): Promise<void> {
  const actionText =
    resolutionOutcome === 'FULL_REFUND'
      ? 'approved for full refund'
      : resolutionOutcome === 'PARTIAL_REFUND'
        ? `approved for partial refund of ₦${refundAmount?.toLocaleString()}`
        : 'rejected — payment released to owner';

  await sendPlainEmail(
    renter.email,
    'Dispute Resolution Update',
    `Hi ${renter.name ?? 'User'},\n\nYour dispute for "${propertyTitle}" has been ${actionText}.\nReason: ${resolutionReason}`
  );
}

async function emailOwnerOfResolution(
  owner: { name: string | null; email: string },
  propertyTitle: string,
  resolutionOutcome: string,
  reason: string
): Promise<void> {
  await sendPlainEmail(
    owner.email,
    'Dispute Resolution Update',
    `Hi ${owner.name ?? 'Owner'},\n\nThe dispute for "${propertyTitle}" has been resolved: ${resolutionOutcome}.\n${reason}`
  );
}

export class DisputeService {

  private async verifyAdmin(adminId: string): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });
    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Admin access required');
    }
  }

  /**
 * get disputes
 */
  async getDisputes(filters: DisputeFilters): Promise<DisputeListResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {};

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status as Prisma.EnumDisputeStatusFilter;
    }

    const sortField = filters.sortBy === 'priority'
      ? 'reason'
      : filters.sortBy || 'createdAt';

    const orderBy: Prisma.DisputeOrderByWithRelationInput = {
      [sortField]: filters.sortOrder || 'desc',
    };

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                },
              },
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
            },
          },
          renter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    const disputeList: DisputeListItem[] = disputes.map((d) => ({
      id: d.id,
      rentalId: d.rentalId,
      paymentId: d.paymentId,
      renterId: d.renterId,
      renterName: d.renter.name,
      renterEmail: d.renter.email,
      propertyTitle: d.rental.property.title,
      propertyAddress: d.rental.property.address,
      amount: Number(d.payment.amount),
      reason: d.reason,
      description: d.description,
      preferredResolution: d.preferredResolution,
      status: d.status,
      assignedAdminId: d.assignedAdminId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return {
      disputes: disputeList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
 * Get dispute stats
 */
  async getDisputeStats(): Promise<DisputeStats> {
    const [total, pending, investigating, resolved, rejected, refundedPayments] =
      await Promise.all([
        prisma.dispute.count(),
        prisma.dispute.count({ where: { status: 'PENDING' } }),
        prisma.dispute.count({ where: { status: 'INVESTIGATING' } }),
        prisma.dispute.count({ where: { status: 'RESOLVED' } }),
        prisma.dispute.count({ where: { status: 'REJECTED' } }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.REFUNDED },
          _sum: { amount: true },
        }),
      ]);

    return {
      total,
      pending,
      investigating,
      resolved,
      rejected,
      totalRefunded: Number(refundedPayments._sum.amount || 0),
    };
  }

  /**
   * Submit a dispute for a payment during the confirmation period
   */
  async submitDispute(
    paymentId: string,
    renterId: string,
    disputeReason: DisputeReason
  ): Promise<SubmitDisputeResult> {
    // Fetch payment with all related data
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        rental: {
          include: {
            property: {
              include: {
                owner: {
                  select: { id: true, name: true, email: true, phone: true },
                },
                agent: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
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

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { name: true, email: true },
    });

    // Notify admin
    await this.notifyAdminOfDispute(
      admins,
      payment.rental.property.title,
      parseFloat(payment.amount.toString()),
      disputeReason.category,
      disputeReason.description
    );

    // Notify property owner/agent
    await this.notifyOwnerOfDispute(
      payment.rental.property.owner,
      payment.rental.property.agent,
      payment.rental.property.title,
      disputeReason.category,
      disputeReason.description
    );

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
  async getPendingDisputes(adminId: string): Promise<DisputeListResult> {
    // Verify admin role
    await this.verifyAdmin(adminId);

    return this.getDisputes({ status: 'PENDING', sortBy: 'createdAt', sortOrder: 'desc' });
  }

  /**
   * Resolve a dispute with admin decision
   */
  async resolveDispute({
    disputeId,
    adminId,
    resolution,
    refundAmount,
    reason,
    additionalNotes,
  }: ResolveDisputeParams): Promise<DisputeDetails> {
    // Verify admin role
    await this.verifyAdmin(adminId);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        payment: true,
        renter: {
          select: { id: true, name: true, email: true, phone: true },
        },
        rental: {
          include: {
            property: {
              include: {
                owner: {
                  select: { id: true, name: true, email: true, phone: true },
                },
                agent: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
            unit: true,
          },
        },
      },
    });

    if (!dispute) throw new Error('Dispute not found');
    if (dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') {
      throw new Error('Dispute already closed');
    }

    let resolutionOutcome: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND' | 'DISMISSED';
    let newPaymentStatus: typeof PaymentStatus[keyof typeof PaymentStatus];
    let newRentalStatus: typeof RentalStatus[keyof typeof RentalStatus];

    if (resolution === 'REFUND_FULL') {
      resolutionOutcome = 'FULL_REFUND';
      newPaymentStatus = PaymentStatus.REFUNDED;
      newRentalStatus = RentalStatus.TERMINATED;
    } else if (resolution === 'REFUND_PARTIAL') {
      resolutionOutcome = 'PARTIAL_REFUND';
      newPaymentStatus = PaymentStatus.REFUNDED;
      newRentalStatus = RentalStatus.TERMINATED;
    } else if (resolution === 'RELEASE_PAYMENT') {
      resolutionOutcome = 'NO_REFUND';
      newPaymentStatus = PaymentStatus.RELEASED;
      newRentalStatus = RentalStatus.ACTIVE;
    } else {
      resolutionOutcome = 'DISMISSED';
      newPaymentStatus = PaymentStatus.RELEASED;
      newRentalStatus = RentalStatus.ACTIVE;
    }

    // Update dispute
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolutionOutcome,
        resolutionNotes: additionalNotes
          ? `${reason}\n\n${additionalNotes}`
          : reason,
        refundAmount: refundAmount ?? null,
        resolvedAt: new Date(),
        assignedAdminId: adminId,
      },
    });

    // Update payment
    await prisma.payment.update({
      where: { id: dispute.paymentId },
      data: {
        status: newPaymentStatus,
        isReleased: newPaymentStatus === PaymentStatus.RELEASED,
        releasedAt:
          newPaymentStatus === PaymentStatus.RELEASED ? new Date() : undefined,
      },
    });

    // Update rental
    await prisma.rental.update({
      where: { id: dispute.rentalId },
      data: { status: newRentalStatus },
    });

    // Release property lock if refunded
    if (
      resolutionOutcome === 'FULL_REFUND' ||
      resolutionOutcome === 'PARTIAL_REFUND'
    ) {
      if (dispute.rental.unitId) {
        await prisma.propertyUnit.update({
          where: { id: dispute.rental.unitId },
          data: { isPaymentLocked: false, paymentLockExpiry: null },
        });
      } else {
        await prisma.property.update({
          where: { id: dispute.rental.propertyId },
          data: { isPaymentLocked: false, paymentLockExpiry: null },
        });
      }
    }

    // Log admin action — cast metadata to Prisma.InputJsonValue
    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.PAYMENT_REFUNDED,
        targetType: 'Dispute',
        targetId: disputeId,
        description: `Dispute resolved: ${resolutionOutcome}. Reason: ${reason}`,
        metadata: {
          disputeId,
          resolution,
          resolutionOutcome,
          refundAmount: refundAmount ?? null,
          reason,
          additionalNotes: additionalNotes ?? null,
        } satisfies Prisma.InputJsonValue,
      },
    });

    // Notify renter of resolution
    await this.notifyRenterOfResolution(
      dispute.renter,
      dispute.rental.property.title,
      resolutionOutcome,
      refundAmount,
      reason
    );

    // Notify owner/agent of resolution
    await this.notifyOwnerOfResolution(
      dispute.rental.property.owner,
      dispute.rental.property.agent,
      dispute.rental.property.title,
      resolutionOutcome,
      reason
    );

    // return updatedDispute;
    return this.getDisputeDetails(disputeId, adminId);

  }

  async updateDisputeStatus({
    disputeId,
    status,
    adminId,
    notes,
  }: UpdateDisputeStatusParams): Promise<UpdatedDispute> {
    await this.verifyAdmin(adminId);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        renter: { select: { name: true, email: true, phone: true } },
        rental: {
          include: {
            property: { select: { title: true } },
          },
        },
      },
    });

    if (!dispute) throw new Error('Dispute not found');

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        assignedAdminId: adminId,
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
        ...(notes && { resolutionNotes: notes }),
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.TICKET_RESOLVED,
        targetType: 'Dispute',
        targetId: disputeId,
        description: `Dispute status updated to ${status}`,
        metadata: {
          status,
          notes: notes ?? null,
        } satisfies Prisma.InputJsonValue,
      },
    });

    await this.notifyRenterOfStatusChange(
      dispute.renter,
      dispute.rental.property.title,
      status
    );

    return updatedDispute;
  }

  async addDisputeNote({
    disputeId,
    adminId,
    note,
    isInternal,
  }: AddDisputeNoteParams): Promise<DisputeNote> {
    await this.verifyAdmin(adminId);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) throw new Error('Dispute not found');

    const comment = await prisma.disputeComment.create({
      data: {
        disputeId,
        authorId: adminId,
        authorRole: 'ADMIN',
        comment: isInternal ? `[INTERNAL] ${note}` : note,
      },
    });

    return {
      id: comment.id,
      disputeId: comment.disputeId,
      authorId: comment.authorId,
      comment: comment.comment,
      authorRole: comment.authorRole,
      createdAt: comment.createdAt,
    };
  }


  async escalateDispute({
    disputeId,
    priority,
    adminId,
    reason,
  }: EscalateDisputeParams): Promise<UpdatedDispute> {
    await this.verifyAdmin(adminId);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        renter: { select: { name: true, email: true, phone: true } },
        rental: {
          include: {
            property: {
              include: {
                owner: { select: { name: true, email: true, phone: true } },
                agent: { select: { name: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!dispute) throw new Error('Dispute not found');
    if (dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') {
      throw new Error('Cannot escalate a closed dispute');
    }

    // Move to INVESTIGATING if still PENDING
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dispute.status === 'PENDING' ? 'INVESTIGATING' : dispute.status,
        assignedAdminId: adminId,
      },
    });

    // Add escalation comment
    await prisma.disputeComment.create({
      data: {
        disputeId,
        authorId: adminId,
        authorRole: 'ADMIN',
        comment: `[ESCALATED to ${priority}] ${reason}`,
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.TICKET_RESOLVED,
        targetType: 'Dispute',
        targetId: disputeId,
        description: `Dispute escalated to ${priority} priority`,
        metadata: {
          priority,
          reason,
        } satisfies Prisma.InputJsonValue,
      },
    });

    await this.notifyPartiesOfEscalation(
      dispute.renter,
      dispute.rental.property.owner,
      dispute.rental.property.agent,
      dispute.rental.property.title,
      priority
    );

    return updatedDispute;
  }

  async getDisputeTimeline(disputeId: string): Promise<DisputeTimeline> {
    const [dispute, comments, adminActions, eventLogs] = await Promise.all([
      prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          renter: { select: { name: true } },
        },
      }),
      prisma.disputeComment.findMany({
        where: { disputeId },
        include: {
          author: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.adminAction.findMany({
        where: { targetType: 'Dispute', targetId: disputeId },
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.eventLog.findMany({
        where: {
          metadata: { path: ['disputeId'], equals: disputeId },
        },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    if (!dispute) throw new Error('Dispute not found');

    const events: TimelineEvent[] = [];

    // Dispute created
    events.push({
      timestamp: dispute.createdAt,
      type: 'DISPUTE_CREATED',
      description: `Dispute submitted: ${dispute.reason}`,
      actor: dispute.renter.name || 'Renter',
    });

    // Comments
    comments.forEach((c) => {
      events.push({
        timestamp: c.createdAt,
        type: 'COMMENT_ADDED',
        description: c.comment,
        actor: c.author.name || c.author.role,
      });
    });

    // Event logs
    eventLogs.forEach((log) => {
      events.push({
        timestamp: log.timestamp,
        type: log.type,
        description: log.type.replace(/_/g, ' ').toLowerCase(),
        metadata: log.metadata,
      });
    });

    // Admin actions
    adminActions.forEach((action) => {
      events.push({
        timestamp: action.createdAt,
        type: action.action,
        description: action.description || action.action,
        actor: action.admin.name || 'Admin',
        metadata: action.metadata,
      });
    });

    // Resolution
    if (dispute.resolvedAt) {
      events.push({
        timestamp: dispute.resolvedAt,
        type: 'DISPUTE_RESOLVED',
        description: `Resolved: ${dispute.resolutionOutcome || 'N/A'}. ${dispute.resolutionNotes || ''}`,
      });
    }

    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return { disputeId, events };
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
      const refundResponse = await flutterwaveProcessRefund(payment.transactionId, {
        id: payment.transactionId,
        amount: refundAmount,
        reason: reason,
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
  private async notifyAdminOfDispute(
    admins: { name: string | null; email: string }[],
    propertyTitle: string,
    amount: number,
    reason: string,
    description: string
  ): Promise<void> {

    for (const admin of admins) {
      if (admin.email) {
        await emailAdminOfDispute(admin, propertyTitle, amount, reason, description);
      }
    }
  }

  /**
   * Notify property owner/agent of dispute
   */
  private async notifyOwnerOfDispute(
    owner: { name: string | null; email: string; phone: string | null },
    agent: { name: string | null; email: string; phone: string | null } | null,
    propertyTitle: string,
    reason: string,
    description: string
  ): Promise<void> {


    const smsMessage = `A dispute has been raised for your property "${propertyTitle}". Reason: ${reason}. The admin team is reviewing the case.`;
    // Notify owner
    if (owner.email) await emailOwnerOfDispute(owner, propertyTitle, reason, description);
    if (owner.phone) await sendSms(owner.phone, smsMessage);

    // Notify agent if exists
    if (agent) {
      if (agent.email) await emailOwnerOfDispute(agent, propertyTitle, reason, description);
      if (agent.phone) await sendSms(agent.phone, smsMessage);
    }


  }

  private async notifyPartiesOfEscalation(
    renter: { name: string | null; email: string; phone: string | null },
    owner: { name: string | null; email: string; phone: string | null },
    agent: { name: string | null; email: string; phone: string | null } | null,
    propertyTitle: string,
    priority: string
  ): Promise<void> {
    const message = `The dispute for "${propertyTitle}" has been escalated to ${priority} priority and is under urgent review.`;

    if (renter.email) await sendPlainEmail(renter.email, 'Dispute Escalated', message);
    if (renter.phone) await sendSms(renter.phone, message);

    if (owner.email) await sendPlainEmail(owner.email, 'Dispute Escalated', message);
    if (owner.phone) await sendSms(owner.phone, message);

    if (agent?.email) await sendPlainEmail(agent.email, 'Dispute Escalated', message);
    if (agent?.phone) await sendSms(agent.phone, message);
  }

  private async notifyRenterOfStatusChange(
    renter: { name: string | null; email: string; phone: string | null },
    propertyTitle: string,
    status: string
  ): Promise<void> {
    const message = `Your dispute for "${propertyTitle}" status has been updated to: ${status}.`;

    if (renter.email) await sendPlainEmail(renter.email, 'Dispute Status Update', message);
    if (renter.phone) await sendSms(renter.phone, message);
  }

  /**
   * Notify renter of dispute resolution
   */
  private async notifyRenterOfResolution(
    renter: { name: string | null; email: string; phone: string | null },
    propertyTitle: string,
    resolutionOutcome: string,
    refundAmount: number | undefined,
    resolutionReason: string
  ): Promise<void> {
    const actionText = resolutionOutcome === 'FULL_REFUND'
      ? 'approved for full refund'
      : resolutionOutcome === 'PARTIAL_REFUND'
        ? `approved for partial refund of ₦${refundAmount?.toLocaleString()}`
        : 'rejected — payment released to owner';

    const smsMessage = `Your dispute for "${propertyTitle}" has been ${actionText}. Reason: ${resolutionReason}`;


    if (renter.email) {
      await emailRenterOfResolution(renter, propertyTitle, resolutionOutcome, refundAmount, resolutionReason);
    }

    if (renter.phone) await sendSms(renter.phone, smsMessage);
  }

  /**
   * Notify owner/agent of dispute resolution
   */
  private async notifyOwnerOfResolution(
    owner: { name: string | null; email: string; phone: string | null },
    agent: { name: string | null; email: string; phone: string | null } | null,
    propertyTitle: string,
    resolutionOutcome: string,
    reason: string
  ): Promise<void> {

    const message = `The dispute for "${propertyTitle}" has been resolved: ${resolutionOutcome}. ${reason}`;
    const smsMessage = `The dispute for "${propertyTitle}" has been resolved: ${resolutionOutcome}. ${reason}`;

    // Notify owner
    if (owner.email) await emailOwnerOfResolution(owner, propertyTitle, resolutionOutcome, reason);

    if (owner.phone) await sendSms(owner.phone, smsMessage);


    // Notify agent if exists
    if (agent) {
      if (agent.email) await emailOwnerOfResolution(agent, propertyTitle, resolutionOutcome, reason);
      if (agent.phone) await sendSms(agent.phone, smsMessage);

    }
  }

  /**
   * Get dispute details by ticket ID
   */
  async getDisputeDetails(disputeId: string, adminId: string): Promise<DisputeDetails> {
    await this.verifyAdmin(adminId);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        rental: {
          include: {
            property: {
              include: {
                owner: {
                  select: { id: true, name: true, email: true, phone: true },
                },
                agent: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
            unit: true,
          },
        },
        payment: true,
        renter: {
          select: { id: true, name: true, email: true, phone: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        evidence: true,
      },
    });

    if (!dispute) throw new Error('Dispute not found');


    const adminActions = await prisma.adminAction.findMany({
      where: { targetType: 'Dispute', targetId: disputeId },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { dispute, adminActions };
  }
}

export const disputeService = new DisputeService();