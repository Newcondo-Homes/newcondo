import { PrismaClient } from '@newcondo/db';
import { sendEmail } from '../../../shared/src/utils/email';
import { sendSMS } from '../../../shared/src/utils/sms';

const prisma = new PrismaClient();

interface NotificationRecipient {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export class NotificationService {
  /**
   * Send verification status notification
   */
  async sendVerificationStatusNotification(
    userId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user) return;

    if (status === 'approved') {
      // Send approval email
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Your Account Has Been Verified',
          template: 'verification-approved',
          data: {
            name: user.name || 'User',
          },
        });
      }

      // Send approval SMS
      if (user.phone) {
        await sendSMS({
          to: user.phone,
          message: `Hello ${user.name || 'User'}, your Newcondo account has been verified. You can now access all features.`,
        });
      }
    } else {
      // Send rejection email
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Verification Status Update',
          template: 'verification-rejected',
          data: {
            name: user.name || 'User',
            reason: reason || 'Please review and resubmit your documents.',
          },
        });
      }

      // Send rejection SMS
      if (user.phone) {
        await sendSMS({
          to: user.phone,
          message: `Hello ${user.name || 'User'}, your Newcondo verification was unsuccessful. Please check your email for details.`,
        });
      }
    }
  }

  /**
   * Send property approval notification
   */
  async sendPropertyApprovalNotification(
    propertyId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!property) return;

    if (status === 'approved') {
      // Send approval email
      if (property.owner.email) {
        await sendEmail({
          to: property.owner.email,
          subject: 'Property Listing Approved',
          template: 'property-approved',
          data: {
            name: property.owner.name || 'User',
            propertyTitle: property.title,
            propertyId: property.id,
          },
        });
      }

      // Send approval SMS
      if (property.owner.phone) {
        await sendSMS({
          to: property.owner.phone,
          message: `Your property "${property.title}" has been approved and is now live on Newcondo!`,
        });
      }
    } else {
      // Send rejection email
      if (property.owner.email) {
        await sendEmail({
          to: property.owner.email,
          subject: 'Property Listing Update',
          template: 'property-rejected',
          data: {
            name: property.owner.name || 'User',
            propertyTitle: property.title,
            reason: reason || 'Please review and update your listing.',
          },
        });
      }

      // Send rejection SMS
      if (property.owner.phone) {
        await sendSMS({
          to: property.owner.phone,
          message: `Your property "${property.title}" requires updates. Please check your email for details.`,
        });
      }
    }
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentNotification(paymentId: string, type: 'success' | 'refunded' | 'released') {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        rental: {
          include: {
            property: {
              select: {
                title: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!payment || !payment.user.email) return;

    const emailData = {
      name: payment.user.name || 'User',
      amount: Number(payment.amount).toLocaleString(),
      paymentId: payment.id,
      propertyTitle: payment.rental?.property.title || 'N/A',
      propertyAddress: payment.rental?.property.address || 'N/A',
    };

    switch (type) {
      case 'success':
        await sendEmail({
          to: payment.user.email,
          subject: 'Payment Successful',
          template: 'payment-success',
          data: emailData,
        });
        break;

      case 'refunded':
        await sendEmail({
          to: payment.user.email,
          subject: 'Payment Refunded',
          template: 'payment-refunded',
          data: emailData,
        });
        break;

      case 'released':
        await sendEmail({
          to: payment.user.email,
          subject: 'Payment Released',
          template: 'payment-released',
          data: emailData,
        });
        break;
    }
  }

  /**
   * Send marking job notification
   */
  async sendMarkingJobNotification(
    markingJobId: string,
    type: 'assigned' | 'completed' | 'cancelled'
  ) {
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      include: {
        property: {
          select: {
            title: true,
            address: true,
          },
        },
        requestingUser: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedAgent: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!markingJob) return;

    switch (type) {
      case 'assigned':
        if (markingJob.assignedAgent?.email) {
          await sendEmail({
            to: markingJob.assignedAgent.email,
            subject: 'New Marking Job Assigned',
            template: 'marking-job-assigned',
            data: {
              agentName: markingJob.assignedAgent.name || 'Agent',
              propertyTitle: markingJob.property.title,
              propertyAddress: markingJob.property.address,
              contactPerson: markingJob.contactPersonName,
              contactPhone: markingJob.contactPersonPhone,
            },
          });
        }
        break;

      case 'completed':
        if (markingJob.requestingUser.email) {
          await sendEmail({
            to: markingJob.requestingUser.email,
            subject: 'Property Marking Completed',
            template: 'marking-job-completed',
            data: {
              ownerName: markingJob.requestingUser.name || 'User',
              propertyTitle: markingJob.property.title,
              agentName: markingJob.assignedAgent?.name || 'Agent',
            },
          });
        }
        break;

      case 'cancelled':
        if (markingJob.assignedAgent?.email) {
          await sendEmail({
            to: markingJob.assignedAgent.email,
            subject: 'Marking Job Cancelled',
            template: 'marking-job-cancelled',
            data: {
              agentName: markingJob.assignedAgent.name || 'Agent',
              propertyTitle: markingJob.property.title,
            },
          });
        }
        break;
    }
  }

  /**
   * Send bulk notification to multiple users
   */
  async sendBulkNotification(
    userIds: string[],
    subject: string,
    message: string,
    channel: 'email' | 'sms' | 'both' = 'both'
  ) {
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    const notifications = users.map(async (user) => {
      const promises = [];

      if ((channel === 'email' || channel === 'both') && user.email) {
        promises.push(
          sendEmail({
            to: user.email,
            subject,
            template: 'general-notification',
            data: {
              name: user.name || 'User',
              message,
            },
          })
        );
      }

      if ((channel === 'sms' || channel === 'both') && user.phone) {
        promises.push(
          sendSMS({
            to: user.phone,
            message: `Hello ${user.name || 'User'}, ${message}`,
          })
        );
      }

      return Promise.all(promises);
    });

    await Promise.allSettled(notifications);

    return {
      sent: users.length,
      channel,
    };
  }

  /**
   * Send support ticket update
   */
  async sendSupportTicketUpdate(ticketId: string, status: string, response?: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!ticket || !ticket.user.email) return;

    await sendEmail({
      to: ticket.user.email,
      subject: `Support Ticket Update - ${ticket.title}`,
      template: 'support-ticket-update',
      data: {
        name: ticket.user.name || 'User',
        ticketTitle: ticket.title,
        status,
        response: response || 'Your ticket has been updated.',
        ticketId: ticket.id,
      },
    });
  }

  /**
   * Send dispute resolution notification
   */
  async sendDisputeResolutionNotification(disputeId: string, resolution: string) {
    const dispute = await prisma.propertyDuplicate.findUnique({
      where: { id: disputeId },
      include: {
        originalProperty: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!dispute || !dispute.originalProperty.owner.email) return;

    // Get duplicate property owner
    const duplicateProperty = await prisma.property.findUnique({
      where: { id: dispute.duplicatePropertyId },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const recipients = [
      dispute.originalProperty.owner,
      ...(duplicateProperty ? [duplicateProperty.owner] : []),
    ];

    await Promise.all(
      recipients.map((recipient) =>
        sendEmail({
          to: recipient.email!,
          subject: 'Property Dispute Resolved',
          template: 'dispute-resolved',
          data: {
            name: recipient.name || 'User',
            resolution,
          },
        })
      )
    );
  }
}

export const notificationService = new NotificationService();