import { PrismaClient } from '@newcondo/db';
import { emailService } from '../../../shared/src/utils/email';
import { smsService } from '../../../shared/src/utils/sms';

const prisma = new PrismaClient();

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  email?: boolean;
  sms?: boolean;
  push?: boolean;
}

export enum NotificationType {
  MARKING_JOB_ASSIGNED = 'marking_job_assigned',
  MARKING_JOB_COMPLETED = 'marking_job_completed',
  MARKING_JOB_CANCELLED = 'marking_job_cancelled',
  MARKING_JOB_EXPIRED = 'marking_job_expired',
  MARKING_PAYMENT_CONFIRMED = 'marking_payment_confirmed',
  MARKING_AGENT_NEARBY = 'marking_agent_nearby',
  BOUNDARY_DISPUTE_RESOLVED = 'boundary_dispute_resolved',
  DUPLICATE_PROPERTY_DETECTED = 'duplicate_property_detected',
  PROPERTY_MARKED_SUCCESSFULLY = 'property_marked_successfully',
  AGENT_QUEUE_POSITION_UPDATED = 'agent_queue_position_updated'
}

export interface MarkingJobAssignedData {
  jobId: string;
  propertyTitle: string;
  propertyAddress: string;
  contactPersonName: string;
  contactPersonPhone: string;
  preferredTime?: string;
  markingFee: number;
  timeSlotExpiry: string;
  agentName: string;
  agentPhone: string;
}

export interface MarkingJobCompletedData {
  jobId: string;
  propertyTitle: string;
  propertyAddress: string;
  agentName: string;
  completionNotes?: string;
  boundaryVerified: boolean;
}

export interface DuplicateDetectedData {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  originalPropertyId: string;
  originalPropertyTitle: string;
  similarityScore: number;
}

export interface BoundaryDisputeData {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  disputeReason: string;
  resolution: string;
  resolvedBy: string;
}

class NotificationService {
  /**
   * Send notification when marking job is assigned to an agent
   */
  async sendMarkingJobAssigned(data: MarkingJobAssignedData): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: data.jobId },
        include: {
          assignedAgent: true,
          requestingUser: true,
          property: true
        }
      });

      if (!job || !job.assignedAgent) return;

      // Notify assigned agent
      await this.sendNotification({
        userId: job.assignedAgent.id,
        type: NotificationType.MARKING_JOB_ASSIGNED,
        title: 'New Property Marking Job Assigned',
        message: `You have been assigned to mark property "${data.propertyTitle}" at ${data.propertyAddress}`,
        metadata: {
          jobId: data.jobId,
          propertyId: job.propertyId,
          contactPersonName: data.contactPersonName,
          contactPersonPhone: data.contactPersonPhone,
          preferredTime: data.preferredTime,
          markingFee: data.markingFee,
          timeSlotExpiry: data.timeSlotExpiry
        },
        email: true,
        sms: true,
        push: true
      });

      // Notify requesting user
      await this.sendNotification({
        userId: job.requestingUser.id,
        type: NotificationType.MARKING_JOB_ASSIGNED,
        title: 'Agent Assigned to Your Property',
        message: `${data.agentName} has been assigned to mark your property "${data.propertyTitle}"`,
        metadata: {
          jobId: data.jobId,
          propertyId: job.propertyId,
          agentName: data.agentName,
          agentPhone: data.agentPhone,
          expectedCompletion: data.timeSlotExpiry
        },
        email: true,
        sms: false,
        push: true
      });
    } catch (error) {
      console.error('Error sending marking job assigned notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when marking job is completed
   */
  async sendMarkingJobCompleted(data: MarkingJobCompletedData): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: data.jobId },
        include: {
          assignedAgent: true,
          requestingUser: true,
          property: true
        }
      });

      if (!job) return;

      // Notify property owner
      await this.sendNotification({
        userId: job.requestingUser.id,
        type: NotificationType.MARKING_JOB_COMPLETED,
        title: 'Property Marking Completed',
        message: `Your property "${data.propertyTitle}" has been successfully marked by ${data.agentName}`,
        metadata: {
          jobId: data.jobId,
          propertyId: job.propertyId,
          agentName: data.agentName,
          completionNotes: data.completionNotes,
          boundaryVerified: data.boundaryVerified
        },
        email: true,
        sms: true,
        push: true
      });

      // Notify agent (confirmation)
      if (job.assignedAgent) {
        await this.sendNotification({
          userId: job.assignedAgent.id,
          type: NotificationType.MARKING_JOB_COMPLETED,
          title: 'Marking Job Completed Successfully',
          message: `You have successfully completed marking for "${data.propertyTitle}"`,
          metadata: {
            jobId: data.jobId,
            propertyId: job.propertyId,
            completionNotes: data.completionNotes,
            boundaryVerified: data.boundaryVerified
          },
          email: false,
          sms: false,
          push: true
        });
      }
    } catch (error) {
      console.error('Error sending marking job completed notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when duplicate property is detected
   */
  async sendDuplicatePropertyDetected(data: DuplicateDetectedData): Promise<void> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        include: { owner: true }
      });

      if (!property) return;

      await this.sendNotification({
        userId: property.owner.id,
        type: NotificationType.DUPLICATE_PROPERTY_DETECTED,
        title: 'Duplicate Property Detected',
        message: `Your property "${data.propertyTitle}" appears to be similar to an existing listing`,
        metadata: {
          propertyId: data.propertyId,
          originalPropertyId: data.originalPropertyId,
          originalPropertyTitle: data.originalPropertyTitle,
          similarityScore: data.similarityScore
        },
        email: true,
        sms: false,
        push: true
      });
    } catch (error) {
      console.error('Error sending duplicate property notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when boundary dispute is resolved
   */
  async sendBoundaryDisputeResolved(data: BoundaryDisputeData): Promise<void> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        include: { owner: true }
      });

      if (!property) return;

      await this.sendNotification({
        userId: property.owner.id,
        type: NotificationType.BOUNDARY_DISPUTE_RESOLVED,
        title: 'Boundary Dispute Resolved',
        message: `The boundary dispute for your property "${data.propertyTitle}" has been resolved`,
        metadata: {
          propertyId: data.propertyId,
          disputeReason: data.disputeReason,
          resolution: data.resolution,
          resolvedBy: data.resolvedBy
        },
        email: true,
        sms: false,
        push: true
      });
    } catch (error) {
      console.error('Error sending boundary dispute resolved notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when payment is confirmed for marking job
   */
  async sendMarkingPaymentConfirmed(jobId: string): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        include: {
          requestingUser: true,
          property: true
        }
      });

      if (!job) return;

      await this.sendNotification({
        userId: job.requestingUser.id,
        type: NotificationType.MARKING_PAYMENT_CONFIRMED,
        title: 'Payment Confirmed - Property Marking',
        message: `Your payment of ₦${job.markingFee} for property marking has been confirmed`,
        metadata: {
          jobId: jobId,
          propertyId: job.propertyId,
          markingFee: job.markingFee,
          propertyTitle: job.property.title
        },
        email: true,
        sms: true,
        push: true
      });
    } catch (error) {
      console.error('Error sending marking payment confirmed notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when marking job expires
   */
  async sendMarkingJobExpired(jobId: string): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        include: {
          requestingUser: true,
          assignedAgent: true,
          property: true
        }
      });

      if (!job) return;

      // Notify property owner
      await this.sendNotification({
        userId: job.requestingUser.id,
        type: NotificationType.MARKING_JOB_EXPIRED,
        title: 'Property Marking Job Expired',
        message: `The marking job for your property "${job.property.title}" has expired`,
        metadata: {
          jobId: jobId,
          propertyId: job.propertyId,
          propertyTitle: job.property.title
        },
        email: true,
        sms: false,
        push: true
      });

      // Notify agent if assigned
      if (job.assignedAgent) {
        await this.sendNotification({
          userId: job.assignedAgent.id,
          type: NotificationType.MARKING_JOB_EXPIRED,
          title: 'Marking Job Expired',
          message: `The marking job for "${job.property.title}" has expired`,
          metadata: {
            jobId: jobId,
            propertyId: job.propertyId,
            propertyTitle: job.property.title
          },
          email: false,
          sms: false,
          push: true
        });
      }
    } catch (error) {
      console.error('Error sending marking job expired notification:', error);
      throw error;
    }
  }

  /**
   * Update agent queue position notification
   */
  async sendAgentQueuePositionUpdated(userId: string, newPosition: number): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return;

      await this.sendNotification({
        userId: userId,
        type: NotificationType.AGENT_QUEUE_POSITION_UPDATED,
        title: 'Queue Position Updated',
        message: `Your position in the marking job queue has been updated to #${newPosition}`,
        metadata: {
          queuePosition: newPosition
        },
        email: false,
        sms: false,
        push: true
      });
    } catch (error) {
      console.error('Error sending queue position update notification:', error);
      throw error;
    }
  }

  /**
   * Core notification sender - handles different channels
   */
  private async sendNotification(data: NotificationData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      });

      if (!user) return;

      // Send email notification
      if (data.email && user.email) {
        await this.sendEmailNotification(user.email, data);
      }

      // Send SMS notification
      if (data.sms && user.phone) {
        await this.sendSMSNotification(user.phone, data);
      }

      // Send push notification (implement based on your push service)
      if (data.push) {
        await this.sendPushNotification(data);
      }

      // Log notification in database (optional)
      await this.logNotification(data);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(email: string, data: NotificationData): Promise<void> {
    try {
      const template = this.getEmailTemplate(data.type);
      const subject = data.title;
      const content = this.generateEmailContent(data);

      await emailService.sendEmail({
        to: email,
        subject,
        html: content,
        template
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(phone: string, data: NotificationData): Promise<void> {
    try {
      const message = this.generateSMSContent(data);
      
      await smsService.sendSMS({
        to: phone,
        message
      });
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification (placeholder - implement based on your push service)
   */
  private async sendPushNotification(data: NotificationData): Promise<void> {
    // Implement push notification logic here
    // This could use Firebase Cloud Messaging, OneSignal, etc.
    console.log('Push notification sent:', data.title);
  }

  /**
   * Get email template based on notification type
   */
  private getEmailTemplate(type: NotificationType): string {
    const templates = {
      [NotificationType.MARKING_JOB_ASSIGNED]: 'marking-assignment',
      [NotificationType.MARKING_JOB_COMPLETED]: 'marking-completion',
      [NotificationType.MARKING_PAYMENT_CONFIRMED]: 'payment-confirmation',
      [NotificationType.DUPLICATE_PROPERTY_DETECTED]: 'duplicate-detection',
      [NotificationType.BOUNDARY_DISPUTE_RESOLVED]: 'dispute-resolution'
    };

    return templates[type] || 'default';
  }

  /**
   * Generate email content
   */
  private generateEmailContent(data: NotificationData): string {
    // Generate HTML content based on notification type and data
    // This is a simplified version - you'd want proper HTML templates
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${data.title}</h2>
        <p>${data.message}</p>
        ${data.metadata ? this.generateMetadataHTML(data.metadata) : ''}
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from Newcondo. Please do not reply to this email.
        </p>
      </div>
    `;
  }

  /**
   * Generate SMS content
   */
  private generateSMSContent(data: NotificationData): string {
    // Keep SMS content short and concise
    return `Newcondo: ${data.title} - ${data.message}`;
  }

  /**
   * Generate metadata HTML for email
   */
  private generateMetadataHTML(metadata: Record<string, any>): string {
    const items = Object.entries(metadata)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('');
    
    return `<ul>${items}</ul>`;
  }

  /**
   * Log notification in database
   */
  private async logNotification(data: NotificationData): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          userId: data.userId,
          type: `NOTIFICATION_${data.type.toUpperCase()}`,
          metadata: {
            title: data.title,
            message: data.message,
            ...data.metadata
          }
        }
      });
    } catch (error) {
      console.error('Error logging notification:', error);
      // Don't throw here - logging failure shouldn't break notification
    }
  }
}

export const notificationService = new NotificationService();