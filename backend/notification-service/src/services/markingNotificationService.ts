import { 
  MarkingJobCreatedPayload, 
  MarkingJobAssignedPayload,
  MarkingJobCompletedPayload,
  MarkingVerificationReminderPayload,
  MarkingCompensationReleasedPayload,
  MarkingJobExpiredPayload,
  ShareableLinkInvitePayload,
  NotificationChannel
} from '../types/markingNotification';
import { EmailService } from './emailService';
import { SMSService } from './smsService';
import { PushService } from './pushService';
import { TemplateService } from './templateService';

export class MarkingNotificationService {
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushService;
  private templateService: TemplateService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushService();
    this.templateService = new TemplateService();
  }

  /**
   * Send notification when a marking job is created
   */
  async sendJobCreatedNotification(payload: MarkingJobCreatedPayload): Promise<void> {
    const { propertyOwner, markingJob, property } = payload;

    // Prepare email
    const emailHtml = await this.templateService.renderTemplate('marking-job-created', {
      propertyOwnerName: propertyOwner.name,
      jobId: markingJob.id,
      propertyTitle: property.title,
      propertyAddress: property.address,
      markingFee: markingJob.markingFee.toString(),
      markingType: markingJob.markingType,
      contactPersonName: markingJob.contactPersonName,
      contactPersonPhone: markingJob.contactPersonPhone,
      preferredTime: markingJob.preferredTime ? new Date(markingJob.preferredTime).toLocaleString() : 'Not specified',
      dashboardUrl: `${process.env.PLATFORM_URL}/dashboard/properties/${property.id}/marking`
    });

    // Send via multiple channels
    const promises: Promise<any>[] = [];

    // Email notification
    if (propertyOwner.email && payload.channels.includes('email')) {
      promises.push(
        this.emailService.send({
          to: propertyOwner.email,
          subject: 'Property Marking Job Created Successfully',
          html: emailHtml
        })
      );
    }

    // SMS notification
    if (propertyOwner.phone && payload.channels.includes('sms')) {
      const smsMessage = `Your marking job for ${property.title} has been created. Job ID: ${markingJob.id}. Track progress at ${process.env.PLATFORM_URL}`;
      promises.push(
        this.smsService.send({
          to: propertyOwner.phone,
          message: smsMessage
        })
      );
    }

    // Push notification
    if (payload.channels.includes('push')) {
      promises.push(
        this.pushService.send({
          userId: propertyOwner.id,
          title: 'Marking Job Created',
          body: `Your marking job for ${property.title} has been created successfully.`,
          data: {
            type: 'MARKING_JOB_CREATED',
            jobId: markingJob.id,
            propertyId: property.id
          }
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send notification when a marking job is assigned to an agent
   */
  async sendJobAssignedNotification(payload: MarkingJobAssignedPayload): Promise<void> {
    const { agent, markingJob, property, propertyOwner } = payload;

    // Notify agent
    const agentEmailHtml = await this.templateService.renderTemplate('marking-job-assigned', {
      agentName: agent.name,
      jobId: markingJob.id,
      propertyTitle: property.title,
      propertyAddress: property.address,
      contactPersonName: markingJob.contactPersonName,
      contactPersonPhone: markingJob.contactPersonPhone,
      accessInstructions: markingJob.accessInstructions || 'No specific instructions',
      preferredTime: markingJob.preferredTime ? new Date(markingJob.preferredTime).toLocaleString() : 'Flexible',
      compensation: markingJob.agentCompensation.toString(),
      timeSlotExpiry: new Date(markingJob.timeSlotExpiry).toLocaleString(),
      dashboardUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${markingJob.id}`
    });

    const agentPromises: Promise<any>[] = [];

    // Email to agent
    if (agent.email && payload.channels.includes('email')) {
      agentPromises.push(
        this.emailService.send({
          to: agent.email,
          subject: 'New Property Marking Job Assigned to You',
          html: agentEmailHtml
        })
      );
    }

    // SMS to agent
    if (agent.phone && payload.channels.includes('sms')) {
      const smsMessage = `You've been assigned a marking job at ${property.address}. Complete within 3 hours to earn ₦${markingJob.agentCompensation}. Job ID: ${markingJob.id}`;
      agentPromises.push(
        this.smsService.send({
          to: agent.phone,
          message: smsMessage
        })
      );
    }

    // Push to agent
    if (payload.channels.includes('push')) {
      agentPromises.push(
        this.pushService.send({
          userId: agent.id,
          title: 'New Marking Job Assigned',
          body: `Mark property at ${property.address} and earn ₦${markingJob.agentCompensation}`,
          data: {
            type: 'MARKING_JOB_ASSIGNED',
            jobId: markingJob.id,
            propertyId: property.id,
            priority: 'high'
          }
        })
      );
    }

    await Promise.allSettled(agentPromises);

    // Notify property owner
    if (propertyOwner) {
      const ownerPromises: Promise<any>[] = [];

      if (propertyOwner.email && payload.channels.includes('email')) {
        const ownerEmailHtml = await this.templateService.renderTemplate('marking-job-assigned', {
          isOwnerNotification: true,
          propertyOwnerName: propertyOwner.name,
          agentName: agent.name,
          jobId: markingJob.id,
          propertyTitle: property.title,
          expectedCompletionTime: new Date(markingJob.timeSlotExpiry).toLocaleString()
        });

        ownerPromises.push(
          this.emailService.send({
            to: propertyOwner.email,
            subject: 'Agent Assigned to Your Property Marking Job',
            html: ownerEmailHtml
          })
        );
      }

      if (payload.channels.includes('push')) {
        ownerPromises.push(
          this.pushService.send({
            userId: propertyOwner.id,
            title: 'Agent Assigned',
            body: `${agent.name} has been assigned to mark your property at ${property.address}`,
            data: {
              type: 'MARKING_JOB_AGENT_ASSIGNED',
              jobId: markingJob.id,
              agentId: agent.id
            }
          })
        );
      }

      await Promise.allSettled(ownerPromises);
    }
  }

  /**
   * Send notification when a marking job is completed
   */
  async sendJobCompletedNotification(payload: MarkingJobCompletedPayload): Promise<void> {
    const { propertyOwner, agent, markingJob, property } = payload;

    // Notify property owner
    const ownerEmailHtml = await this.templateService.renderTemplate('marking-job-completed', {
      propertyOwnerName: propertyOwner.name,
      agentName: agent.name,
      jobId: markingJob.id,
      propertyTitle: property.title,
      completedAt: new Date(markingJob.completedAt).toLocaleString(),
      verificationDeadline: new Date(markingJob.verificationDeadline).toLocaleString(),
      verificationUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${markingJob.id}/verify`,
      imageCount: markingJob.completionImages?.length || 0
    });

    const ownerPromises: Promise<any>[] = [];

    if (propertyOwner.email && payload.channels.includes('email')) {
      ownerPromises.push(
        this.emailService.send({
          to: propertyOwner.email,
          subject: 'Property Marking Completed - Verification Required',
          html: ownerEmailHtml
        })
      );
    }

    if (propertyOwner.phone && payload.channels.includes('sms')) {
      const smsMessage = `Your property at ${property.address} has been marked. Please verify within ${Math.ceil((new Date(markingJob.verificationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days. Visit ${process.env.PLATFORM_URL}`;
      ownerPromises.push(
        this.smsService.send({
          to: propertyOwner.phone,
          message: smsMessage
        })
      );
    }

    if (payload.channels.includes('push')) {
      ownerPromises.push(
        this.pushService.send({
          userId: propertyOwner.id,
          title: 'Property Marking Completed',
          body: `${agent.name} has completed marking your property. Please verify now.`,
          data: {
            type: 'MARKING_JOB_COMPLETED',
            jobId: markingJob.id,
            requiresAction: true
          }
        })
      );
    }

    await Promise.allSettled(ownerPromises);

    // Notify agent
    const agentPromises: Promise<any>[] = [];

    if (agent.email && payload.channels.includes('email')) {
      const agentEmailHtml = await this.templateService.renderTemplate('marking-job-completed', {
        isAgentNotification: true,
        agentName: agent.name,
        jobId: markingJob.id,
        propertyTitle: property.title,
        initialCompensation: markingJob.initialCompensation.toString(),
        verificationPending: true
      });

      agentPromises.push(
        this.emailService.send({
          to: agent.email,
          subject: 'Marking Job Submitted - Awaiting Verification',
          html: agentEmailHtml
        })
      );
    }

    if (payload.channels.includes('push')) {
      agentPromises.push(
        this.pushService.send({
          userId: agent.id,
          title: 'Marking Job Submitted',
          body: `Your marking for ${property.title} has been submitted. Awaiting owner verification.`,
          data: {
            type: 'MARKING_JOB_SUBMITTED',
            jobId: markingJob.id
          }
        })
      );
    }

    await Promise.allSettled(agentPromises);
  }

  /**
   * Send verification reminder to property owner
   */
  async sendVerificationReminder(payload: MarkingVerificationReminderPayload): Promise<void> {
    const { propertyOwner, markingJob, property, daysRemaining, reminderCount } = payload;

    const emailHtml = await this.templateService.renderTemplate('marking-verification-reminder', {
      propertyOwnerName: propertyOwner.name,
      jobId: markingJob.id,
      propertyTitle: property.title,
      daysRemaining,
      reminderCount,
      verificationUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${markingJob.id}/verify`,
      urgencyLevel: daysRemaining <= 1 ? 'urgent' : 'normal'
    });

    const promises: Promise<any>[] = [];

    if (propertyOwner.email && payload.channels.includes('email')) {
      promises.push(
        this.emailService.send({
          to: propertyOwner.email,
          subject: `Reminder: Verify Property Marking (${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left)`,
          html: emailHtml,
          priority: daysRemaining <= 1 ? 'high' : 'normal'
        })
      );
    }

    if (propertyOwner.phone && payload.channels.includes('sms')) {
      const smsMessage = `Reminder: Verify your property marking for ${property.title}. ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining. Visit ${process.env.PLATFORM_URL}`;
      promises.push(
        this.smsService.send({
          to: propertyOwner.phone,
          message: smsMessage
        })
      );
    }

    if (payload.channels.includes('push')) {
      promises.push(
        this.pushService.send({
          userId: propertyOwner.id,
          title: 'Verification Reminder',
          body: `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left to verify property marking`,
          data: {
            type: 'MARKING_VERIFICATION_REMINDER',
            jobId: markingJob.id,
            daysRemaining,
            priority: daysRemaining <= 1 ? 'high' : 'normal'
          }
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send notification when compensation is released to agent
   */
  async sendCompensationReleasedNotification(payload: MarkingCompensationReleasedPayload): Promise<void> {
    const { agent, markingJob, property, compensationAmount, compensationType } = payload;

    const emailHtml = await this.templateService.renderTemplate('marking-compensation-released', {
      agentName: agent.name,
      jobId: markingJob.id,
      propertyTitle: property.title,
      compensationAmount: compensationAmount.toString(),
      compensationType,
      isFinalPayment: compensationType === 'final',
      newBalance: payload.newWalletBalance?.toString(),
      transactionId: payload.transactionId,
      dashboardUrl: `${process.env.PLATFORM_URL}/dashboard/wallet`
    });

    const promises: Promise<any>[] = [];

    if (agent.email && payload.channels.includes('email')) {
      promises.push(
        this.emailService.send({
          to: agent.email,
          subject: `Payment Released: ₦${compensationAmount} for Marking Job`,
          html: emailHtml
        })
      );
    }

    if (agent.phone && payload.channels.includes('sms')) {
      const smsMessage = `₦${compensationAmount} has been credited to your wallet for marking ${property.title}. ${compensationType === 'final' ? 'Final payment completed!' : 'Partial payment - awaiting verification.'}`;
      promises.push(
        this.smsService.send({
          to: agent.phone,
          message: smsMessage
        })
      );
    }

    if (payload.channels.includes('push')) {
      promises.push(
        this.pushService.send({
          userId: agent.id,
          title: 'Payment Received',
          body: `₦${compensationAmount} credited for marking job`,
          data: {
            type: 'MARKING_COMPENSATION_RELEASED',
            jobId: markingJob.id,
            amount: compensationAmount.toString(),
            compensationType
          }
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send notification when a marking job expires
   */
  async sendJobExpiredNotification(payload: MarkingJobExpiredPayload): Promise<void> {
    const { affectedUsers, markingJob, property, reason } = payload;

    for (const user of affectedUsers) {
      const emailHtml = await this.templateService.renderTemplate('marking-job-expired', {
        userName: user.name,
        userRole: user.role,
        jobId: markingJob.id,
        propertyTitle: property.title,
        propertyAddress: property.address,
        expirationReason: reason,
        nextSteps: this.getExpirationNextSteps(user.role, reason),
        dashboardUrl: `${process.env.PLATFORM_URL}/dashboard`
      });

      const userPromises: Promise<any>[] = [];

      if (user.email && payload.channels.includes('email')) {
        userPromises.push(
          this.emailService.send({
            to: user.email,
            subject: 'Marking Job Expired',
            html: emailHtml
          })
        );
      }

      if (user.phone && payload.channels.includes('sms')) {
        const smsMessage = `Marking job for ${property.title} has expired. Reason: ${reason}. Visit ${process.env.PLATFORM_URL} for details.`;
        userPromises.push(
          this.smsService.send({
            to: user.phone,
            message: smsMessage
          })
        );
      }

      if (payload.channels.includes('push')) {
        userPromises.push(
          this.pushService.send({
            userId: user.id,
            title: 'Marking Job Expired',
            body: `Job for ${property.title} has expired`,
            data: {
              type: 'MARKING_JOB_EXPIRED',
              jobId: markingJob.id,
              reason
            }
          })
        );
      }

      await Promise.allSettled(userPromises);
    }
  }

  /**
   * Send shareable link invite to designated marker
   */
  async sendShareableLinkInvite(payload: ShareableLinkInvitePayload): Promise<void> {
    const { propertyOwner, property, markingLink, markerContact } = payload;

    const emailHtml = await this.templateService.renderTemplate('shareable-link-invite', {
      propertyOwnerName: propertyOwner.name,
      propertyTitle: property.title,
      propertyAddress: property.address,
      markingLink,
      instructions: payload.instructions || 'Please use this link to mark the property when you arrive at the location.',
      expiresAt: payload.linkExpiresAt ? new Date(payload.linkExpiresAt).toLocaleString() : undefined,
      contactPersonName: markerContact?.name,
      contactPersonPhone: markerContact?.phone
    });

    const promises: Promise<any>[] = [];

    // Send to marker if contact provided
    if (markerContact) {
      if (markerContact.email && payload.channels.includes('email')) {
        promises.push(
          this.emailService.send({
            to: markerContact.email,
            subject: `You've been invited to mark a property on Newcondo`,
            html: emailHtml
          })
        );
      }

      if (markerContact.phone && payload.channels.includes('sms')) {
        const smsMessage = `You've been invited to mark ${propertyOwner.name}'s property at ${property.address}. Use this link: ${markingLink}`;
        promises.push(
          this.smsService.send({
            to: markerContact.phone,
            message: smsMessage
          })
        );
      }
    }

    // Confirmation to property owner
    if (propertyOwner.email && payload.channels.includes('email')) {
      const ownerConfirmationHtml = await this.templateService.renderTemplate('shareable-link-invite', {
        isOwnerConfirmation: true,
        propertyOwnerName: propertyOwner.name,
        propertyTitle: property.title,
        markingLink,
        markerContact
      });

      promises.push(
        this.emailService.send({
          to: propertyOwner.email,
          subject: 'Property Marking Link Created',
          html: ownerConfirmationHtml
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Generic notification sender
   */
  async sendNotification(payload: any): Promise<void> {
    // Implementation for generic notification sending
    // This can be used for custom notifications
    console.log('Sending generic notification:', payload);
  }

  /**
   * Helper method to get next steps based on expiration reason
   */
  private getExpirationNextSteps(role: string, reason: string): string {
    if (role === 'OWNER') {
      if (reason === 'VERIFICATION_TIMEOUT') {
        return 'You can create a new marking job and complete verification on time.';
      }
      if (reason === 'AGENT_TIMEOUT') {
        return 'The job has been reassigned to the queue. Another agent will be notified.';
      }
    }
    
    if (role === 'AGENT') {
      if (reason === 'TIME_SLOT_EXPIRED') {
        return 'The 3-hour time slot has expired. The job has been assigned to the next agent in queue.';
      }
    }

    return 'Please check your dashboard for more details.';
  }
}







// // backend/notification-service/src/services/markingNotificationService.ts

// import { emailService } from './emailService';
// import { smsService } from './smsService';
// import { pushService } from './pushService';
// import { templateService } from './templateService';
// import { prisma } from '@newcondo/db';

// interface AssignmentNotificationData {
//   agentId: string;
//   markingJobId: string;
//   propertyDetails: {
//     title: string;
//     address: string;
//     city: string;
//     state: string;
//   };
//   timeSlotExpiry: Date;
// }

// interface CompletionNotificationData {
//   ownerId: string;
//   markingJobId: string;
//   propertyDetails: {
//     title: string;
//     address: string;
//   };
//   agentDetails?: {
//     name: string;
//     phone: string;
//   };
//   completionData?: {
//     images: string[];
//     notes: string;
//   };
// }

// interface ConfirmationRequestData {
//   ownerId: string;
//   markingJobId: string;
//   propertyDetails: {
//     title: string;
//     address: string;
//   };
//   confirmationDeadline: Date;
// }

// interface PaymentReleaseData {
//   agentId: string;
//   markingJobId: string;
//   paymentAmount: number;
//   propertyDetails?: {
//     title: string;
//     address: string;
//   };
// }

// interface QueuePositionData {
//   agentId: string;
//   markingJobId: string;
//   queuePosition: number;
//   estimatedWaitTime?: string;
//   propertyDetails?: {
//     title: string;
//     address: string;
//   };
// }

// interface TimeExpiryWarningData {
//   agentId: string;
//   markingJobId: string;
//   timeRemaining: string;
//   propertyDetails?: {
//     title: string;
//     address: string;
//   };
// }

// interface JobCancellationData {
//   recipientId: string;
//   markingJobId: string;
//   reason?: string;
//   propertyDetails?: {
//     title: string;
//     address: string;
//   };
// }

// interface PartialPaymentData {
//   agentId: string;
//   markingJobId: string;
//   amount: number;
//   reason?: string;
//   propertyDetails?: {
//     title: string;
//     address: string;
//   };
// }

// class MarkingNotificationService {
//   /**
//    * Send marking job assignment notification to agent
//    */
//   async sendAssignmentNotification(data: AssignmentNotificationData) {
//     try {
//       // Get agent details
//       const agent = await prisma.user.findUnique({
//         where: { id: data.agentId },
//         select: {
//           name: true,
//           email: true,
//           phone: true,
//         },
//       });

//       if (!agent) {
//         throw new Error('Agent not found');
//       }

//       const timeSlotHours = Math.ceil(
//         (data.timeSlotExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60)
//       );

//       // Render email template
//       const emailHtml = await templateService.renderTemplate('marking-assignment', {
//         agentName: agent.name || 'Agent',
//         propertyTitle: data.propertyDetails.title,
//         propertyAddress: data.propertyDetails.address,
//         propertyCity: data.propertyDetails.city,
//         propertyState: data.propertyDetails.state,
//         timeSlotHours,
//         timeSlotExpiry: data.timeSlotExpiry.toLocaleString('en-NG'),
//         markingJobId: data.markingJobId,
//         dashboardUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${data.markingJobId}`,
//       });

//       // Send email
//       await emailService.send({
//         to: agent.email,
//         subject: '🎯 New Property Marking Job Assigned',
//         html: emailHtml,
//       });

//       // Send SMS
//       if (agent.phone) {
//         await smsService.send({
//           to: agent.phone,
//           message: `Hi ${agent.name}, you've been assigned a property marking job for ${data.propertyDetails.title} in ${data.propertyDetails.city}. Complete within ${timeSlotHours} hours. Check your dashboard for details.`,
//         });
//       }

//       // Send push notification
//       await pushService.send({
//         userId: data.agentId,
//         title: 'New Marking Job Assigned',
//         body: `Complete marking for ${data.propertyDetails.title} within ${timeSlotHours} hours`,
//         data: {
//           type: 'MARKING_ASSIGNMENT',
//           markingJobId: data.markingJobId,
//         },
//       });

//       console.log(`Assignment notification sent to agent ${data.agentId}`);
//     } catch (error) {
//       console.error('Error sending assignment notification:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send marking completion notification to property owner
//    */
//   async sendCompletionNotification(data: CompletionNotificationData) {
//     try {
//       // Get owner details
//       const owner = await prisma.user.findUnique({
//         where: { id: data.ownerId },
//         select: {
//           name: true,
//           email: true,
//           phone: true,
//         },
//       });

//       if (!owner) {
//         throw new Error('Owner not found');
//       }

//       // Render email template
//       const emailHtml = await templateService.renderTemplate('marking-completion', {
//         ownerName: owner.name || 'Property Owner',
//         propertyTitle: data.propertyDetails.title,
//         propertyAddress: data.propertyDetails.address,
//         agentName: data.agentDetails?.name || 'Agent',
//         agentPhone: data.agentDetails?.phone || 'N/A',
//         completionImages: data.completionData?.images || [],
//         completionNotes: data.completionData?.notes || 'No additional notes',
//         markingJobId: data.markingJobId,
//         confirmationUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${data.markingJobId}/confirm`,
//       });

//       // Send email
//       await emailService.send({
//         to: owner.email,
//         subject: '✅ Property Marking Completed - Confirmation Required',
//         html: emailHtml,
//       });

//       // Send SMS
//       if (owner.phone) {
//         await smsService.send({
//           to: owner.phone,
//           message: `Your property marking for ${data.propertyDetails.title} has been completed. Please confirm the marking within 2-3 days to release payment.`,
//         });
//       }

//       // Send push notification
//       await pushService.send({
//         userId: data.ownerId,
//         title: 'Property Marking Completed',
//         body: `Review and confirm the marking for ${data.propertyDetails.title}`,
//         data: {
//           type: 'MARKING_COMPLETION',
//           markingJobId: data.markingJobId,
//         },
//       });

//       console.log(`Completion notification sent to owner ${data.ownerId}`);
//     } catch (error) {
//       console.error('Error sending completion notification:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send confirmation request reminder to property owner
//    */
//   async sendConfirmationRequest(data: ConfirmationRequestData) {
//     try {
//       const owner = await prisma.user.findUnique({
//         where: { id: data.ownerId },
//         select: {
//           name: true,
//           email: true,
//           phone: true,
//         },
//       });

//       if (!owner) {
//         throw new Error('Owner not found');
//       }

//       const hoursRemaining = Math.ceil(
//         (data.confirmationDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60)
//       );

//       // Render email template
//       const emailHtml = await templateService.renderTemplate('marking-confirmation-request', {
//         ownerName: owner.name || 'Property Owner',
//         propertyTitle: data.propertyDetails.title,
//         propertyAddress: data.propertyDetails.address,
//         hoursRemaining,
//         confirmationDeadline: data.confirmationDeadline.toLocaleString('en-NG'),
//         markingJobId: data.markingJobId,
//         confirmationUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${data.markingJobId}/confirm`,
//       });

//       // Send email
//       await emailService.send({
//         to: owner.email,
//         subject: '⏰ Reminder: Confirm Property Marking',
//         html: emailHtml,
//       });

//       // Send SMS
//       if (owner.phone) {
//         await smsService.send({
//           to: owner.phone,
//           message: `Reminder: Please confirm the property marking for ${data.propertyDetails.title} within ${hoursRemaining} hours to avoid automatic compensation.`,
//         });
//       }

//       // Send push notification
//       await pushService.send({
//         userId: data.ownerId,
//         title: 'Confirmation Reminder',
//         body: `${hoursRemaining} hours left to confirm marking for ${data.propertyDetails.title}`,
//         data: {
//           type: 'MARKING_CONFIRMATION_REMINDER',
//           markingJobId: data.markingJobId,
//         },
//       });

//       console.log(`Confirmation request sent to owner ${data.ownerId}`);
//     } catch (error) {
//       console.error('Error sending confirmation request:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send payment release notification to agent
//    */
//   async sendPaymentReleaseNotification(data: PaymentReleaseData) {
//     try {
//       const agent = await prisma.user.findUnique({
//         where: { id: data.agentId },
//         select: {
//           name: true,
//           email: true,
//           phone: true,
//         },
//       });

//       if (!agent) {
//         throw new Error('Agent not found');
//       }

//       // Render email template
//       const emailHtml = await templateService.renderTemplate('marking-payment-released', {
//         agentName: agent.name || 'Agent',
//         paymentAmount: data.paymentAmount.toLocaleString('en-NG', {
//           style: 'currency',
//           currency: 'NGN',
//         }),
//         propertyTitle: data.propertyDetails?.title || 'Property',
//         propertyAddress: data.propertyDetails?.address || '',
//         markingJobId: data.markingJobId,
//         walletUrl: `${process.env.PLATFORM_URL}/dashboard/wallet`,
//       });

//       // Send email
//       await emailService.send({
//         to: agent.email,
//         subject: '💰 Payment Released for Marking Job',
//         html: emailHtml,
//       });

//       // Send SMS
//       if (agent.phone) {
//         await smsService.send({
//           to: agent.phone,
//           message: `Payment of ₦${data.paymentAmount.toLocaleString()} has been released to your wallet for the marking job. Check your dashboard to withdraw.`,
//         });
//       }

//       // Send push notification
//       await pushService.send({
//         userId: data.agentId,
//         title: 'Payment Released',
//         body: `₦${data.paymentAmount.toLocaleString()} added to your wallet`,
//         data: {
//           type: 'MARKING_PAYMENT_RELEASED',
//           markingJobId: data.markingJobId,
//           amount: data.paymentAmount,
//         },
//       });

//       console.log(`Payment release notification sent to agent ${data.agentId}`);
//     } catch (error) {
//       console.error('Error sending payment release notification:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send queue position update to agent
//    */
//   async sendQueuePositionUpdate(data: QueuePositionData) {
//     try {
//       const agent = await prisma.user.findUnique({
//         where: { id: data.agentId },
//         select: {
//           name: true,
//           email: true,
//           phone: true,
//         },
//       });

//       if (!agent) {
//         throw new Error('Agent not found');
//       }

//       // Render email template
//       const emailHtml = await templateService.renderTemplate('marking-queue-position', {
//         agentName: agent.name || 'Agent',
//         queuePosition: data.queuePosition,
//         estimatedWaitTime: data.estimatedWaitTime || 'TBD',
//         propertyTitle: data.propertyDetails?.title || 'Property',
//         markingJobId: data.markingJobId,
//         queueUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/queue`,
//       });

//       // Send email
//       await emailService.send({
//         to: agent.email,
//         subject: `📍 Queue Position Update - Position #${data.queuePosition}`,
//         html: emailHtml,
//       });

//       // Send push notification
//       await pushService.send({
//         userId: data.agentId,
//         title: 'Queue Position Update',
//         body: `You're now #${data.queuePosition} in the queue`,
//         data: {
//           type: 'MARKING_QUEUE_UPDATE',
//           markingJobId: data.markingJobId,
//           queuePosition: data.queuePosition,
//         },
//       });

//       console.log(`Queue position update sent to agent ${data.agentId}`);
//     } catch (error) {
//       console.error('Error sending queue position update:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send time expiry warning to agent
//    */
//   async sendTimeExpiryWarning(data: TimeExpiryWarningData) {
//     try {
//       const agent = await prisma.user.findUnique({
//         where: { id: data.agentId },
//         select: {
//           name: true,
//           email: true,
//           phone: true,
//         },
//       });

//       if (!agent) {
//         throw new Error('Agent not found');
//       }

//       // Render email template
//       const emailHtml = await templateService.renderTemplate('marking-time-expiry', {
//         agentName: agent.name || 'Agent',
//         timeRemaining: data.timeRemaining,
//         propertyTitle: data.propertyDetails?.title || 'Property',
//         propertyAddress: data.propertyDetails?.address || '',
//         markingJobId: data.markingJobId,
//         jobUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${data.markingJobId}`,
//       });

//       // Send email
//       await emailService.send({
//         to: agent.email,
//         subject: '⚠️ Time Running Out - Complete Marking Job',
//         html: emailHtml,
//       });

//       // Send SMS
//       if (agent.phone) {
//         await smsService.send({
//           to: agent.phone,
//           message: `Urgent: Only ${data.timeRemaining} left to complete the marking job for ${data.propertyDetails?.title}. Complete now to avoid losing the job.`,
//         });
//       }

//       // Send push notification
//       await pushService.send({
//         userId: data.agentId,
//         title: 'Time Running Out',
//         body: `${data.timeRemaining} left to complete marking`,
//         data: {
//           type: 'MARKING_TIME_EXPIRY_WARNING',
//           markingJobId: data.markingJobId,
//         },
//       });

//       console.log(`Time expiry warning sent to agent ${data.agentId}`);
//     } catch (error) {
//       console.error('Error sending time expiry warning:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send job cancellation notification
//    */
//   async sendJobCancellationNotification(data: JobCancellationData) {
//     try {
//       const recipient = await prisma.user.findUnique({
//         where: { id: data.recipientId },
//         select: {
//           name: true,
//           email: true,
//           phone: true,
//         },
//       });

//       if (!recipient) {
//         throw new Error('Recipient not found');
//       }

//       // Send email
//       await emailService.send({
//         to: recipient.email,
//         subject: '❌ Marking Job Cancelled',
//         html: `
//           <p>Hi ${recipient.name || 'there'},</p>
//           <p>The marking job for ${data.propertyDetails?.title || 'a property'} has been cancelled.</p>
//           ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
//           <p>If you have any questions, please contact support.</p>
//         `,
//       });

//       // Send push notification
//       await pushService.send({
//         userId: data.recipientId,
//         title: 'Marking Job Cancelled',
//         body: data.reason || 'The marking job has been cancelled',
//         data: {
//           type: 'MARKING_JOB_CANCELLED',
//           markingJobId: data.markingJobId,
//         },
//       });

//       console.log(`Cancellation notification sent to ${data.recipientId}`);
//     } catch (error) {
//       console.error('Error sending cancellation notification:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send partial payment notification to agent (for timeout compensation)
//    */
//   async sendPartialPaymentNotification(data: PartialPaymentData) {
//     try {
//       const agent = await prisma.user.findUnique({
//         where: { id: data.agentId },
//         select: {
//           name: true,
//           email: true,
//           phone: true,
//         },
//       });

//       if (!agent) {
//         throw new Error('Agent not found');
//       }

//       // Send email
//       await emailService.send({
//         to: agent.email,
//         subject: '💵 Partial Payment Received',
//         html: `
//           <p>Hi ${agent.name || 'Agent'},</p>
//           <p>You've received a partial payment of <strong>₦${data.amount.toLocaleString()}</strong> for the marking job.</p>
//           ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
//           <p>This payment has been added to your wallet.</p>
//         `,
//       });

//       // Send SMS
//       if (agent.phone) {
//         await smsService.send({
//           to: agent.phone,
//           message: `You've received ₦${data.amount.toLocaleString()} partial payment for the marking job. Check your wallet.`,
//         });
//       }

//       // Send push notification
//       await pushService.send({
//         userId: data.agentId,
//         title: 'Partial Payment Received',
//         body: `₦${data.amount.toLocaleString()} added to your wallet`,
//         data: {
//           type: 'MARKING_PARTIAL_PAYMENT',
//           markingJobId: data.markingJobId,
//           amount: data.amount,
//         },
//       });

//       console.log(`Partial payment notification sent to agent ${data.agentId}`);
//     } catch (error) {
//       console.error('Error sending partial payment notification:', error);
//       throw error;
//     }
//   }
// }

// export const markingNotificationService = new MarkingNotificationService();