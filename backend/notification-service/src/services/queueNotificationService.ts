import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';
import { templateService } from './templateService';
import { db } from '../../../shared/src/config/database';

interface QueuePositionUpdateParams {
  agentId: string;
  markingJobId: string;
  queuePosition: number;
  estimatedTime?: Date;
}

interface TimeSlotExpiryParams {
  agentId: string;
  markingJobId: string;
  remainingMinutes: number;
}

interface JobAssignmentParams {
  agentId: string;
  markingJobId: string;
  propertyAddress: string;
  contactPerson: {
    name: string;
    phone: string;
  };
  timeSlotExpiry: Date;
}

interface JobClaimedParams {
  ownerId: string;
  markingJobId: string;
  agentName: string;
  estimatedCompletion: Date;
}

interface CompensationParams {
  agentId: string;
  markingJobId: string;
  compensationAmount: number;
  reason: string;
}

interface QueueReleasedParams {
  agentIds: string[];
  markingJobId: string;
  reason: string;
}

class QueueNotificationService {
  /**
   * Notify agent of queue position update
   */
  async notifyQueuePositionUpdate(
    params: QueuePositionUpdateParams
  ): Promise<void> {
    try {
      const agent = await db.user.findUnique({
        where: { id: params.agentId },
        select: { email: true, phone: true, name: true },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const job = await db.propertyMarkingJob.findUnique({
        where: { id: params.markingJobId },
        include: {
          property: {
            select: { address: true, city: true, state: true },
          },
        },
      });

      if (!job) {
        throw new Error('Marking job not found');
      }

      // Prepare template data
      const templateData = {
        agentName: agent.name || 'Agent',
        queuePosition: params.queuePosition,
        propertyAddress: `${job.property.address}, ${job.property.city}, ${job.property.state}`,
        estimatedTime: params.estimatedTime
          ? new Date(params.estimatedTime).toLocaleString('en-NG')
          : 'Soon',
        markingJobId: params.markingJobId,
      };

      // Send email notification
      const emailHtml = await templateService.renderTemplate(
        'queue-position-update',
        templateData
      );

      await emailService.sendEmail({
        to: agent.email,
        subject: `Queue Update: You're #${params.queuePosition} for Property Marking`,
        html: emailHtml,
      });

      // Send SMS notification
      if (agent.phone) {
        const smsMessage = `Hi ${agent.name}, you're now #${params.queuePosition} in queue for marking job at ${job.property.city}. Est. time: ${templateData.estimatedTime}`;
        await smsService.sendSMS({
          to: agent.phone,
          message: smsMessage,
        });
      }

      // Send push notification
      await pushService.sendPush({
        userId: params.agentId,
        title: 'Queue Position Updated',
        body: `You're now #${params.queuePosition} in the queue`,
        data: {
          type: 'QUEUE_POSITION_UPDATE',
          markingJobId: params.markingJobId,
          queuePosition: params.queuePosition,
        },
      });

      console.log(
        `Queue position update sent to agent ${params.agentId} for job ${params.markingJobId}`
      );
    } catch (error) {
      console.error('Error sending queue position update:', error);
      throw error;
    }
  }

  /**
   * Notify agent of time slot expiry warning
   */
  async notifyTimeSlotExpiry(params: TimeSlotExpiryParams): Promise<void> {
    try {
      const agent = await db.user.findUnique({
        where: { id: params.agentId },
        select: { email: true, phone: true, name: true },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const job = await db.propertyMarkingJob.findUnique({
        where: { id: params.markingJobId },
        include: {
          property: {
            select: { address: true, city: true, state: true },
          },
        },
      });

      if (!job) {
        throw new Error('Marking job not found');
      }

      const templateData = {
        agentName: agent.name || 'Agent',
        remainingMinutes: params.remainingMinutes,
        propertyAddress: `${job.property.address}, ${job.property.city}, ${job.property.state}`,
        markingJobId: params.markingJobId,
      };

      // Send email notification
      const emailHtml = await templateService.renderTemplate(
        'time-slot-expiry-warning',
        templateData
      );

      await emailService.sendEmail({
        to: agent.email,
        subject: `⚠️ Urgent: ${params.remainingMinutes} Minutes Left to Complete Marking`,
        html: emailHtml,
      });

      // Send urgent SMS
      if (agent.phone) {
        const smsMessage = `URGENT: You have ${params.remainingMinutes} minutes left to complete marking at ${job.property.city}. Complete now or lose opportunity!`;
        await smsService.sendSMS({
          to: agent.phone,
          message: smsMessage,
        });
      }

      // Send push notification
      await pushService.sendPush({
        userId: params.agentId,
        title: '⚠️ Time Running Out!',
        body: `${params.remainingMinutes} minutes left to complete marking`,
        data: {
          type: 'TIME_SLOT_EXPIRY_WARNING',
          markingJobId: params.markingJobId,
          remainingMinutes: params.remainingMinutes,
        },
        priority: 'high',
      });

      console.log(
        `Time slot expiry warning sent to agent ${params.agentId} for job ${params.markingJobId}`
      );
    } catch (error) {
      console.error('Error sending time slot expiry warning:', error);
      throw error;
    }
  }

  /**
   * Notify agent of job assignment
   */
  async notifyJobAssignment(params: JobAssignmentParams): Promise<void> {
    try {
      const agent = await db.user.findUnique({
        where: { id: params.agentId },
        select: { email: true, phone: true, name: true },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const templateData = {
        agentName: agent.name || 'Agent',
        propertyAddress: params.propertyAddress,
        contactPersonName: params.contactPerson.name,
        contactPersonPhone: params.contactPerson.phone,
        timeSlotExpiry: new Date(params.timeSlotExpiry).toLocaleString('en-NG'),
        markingJobId: params.markingJobId,
      };

      // Send email notification
      const emailHtml = await templateService.renderTemplate(
        'job-assigned',
        templateData
      );

      await emailService.sendEmail({
        to: agent.email,
        subject: '🎉 Property Marking Job Assigned to You!',
        html: emailHtml,
      });

      // Send SMS notification
      if (agent.phone) {
        const smsMessage = `Congratulations! You've been assigned a marking job at ${params.propertyAddress}. Contact: ${params.contactPerson.name} (${params.contactPerson.phone}). Complete within 3 hours!`;
        await smsService.sendSMS({
          to: agent.phone,
          message: smsMessage,
        });
      }

      // Send push notification
      await pushService.sendPush({
        userId: params.agentId,
        title: 'Job Assigned!',
        body: `You've been assigned to mark property at ${params.propertyAddress}`,
        data: {
          type: 'JOB_ASSIGNMENT',
          markingJobId: params.markingJobId,
        },
      });

      console.log(
        `Job assignment notification sent to agent ${params.agentId} for job ${params.markingJobId}`
      );
    } catch (error) {
      console.error('Error sending job assignment notification:', error);
      throw error;
    }
  }

  /**
   * Notify property owner when job is claimed by agent
   */
  async notifyOwnerJobClaimed(params: JobClaimedParams): Promise<void> {
    try {
      const owner = await db.user.findUnique({
        where: { id: params.ownerId },
        select: { email: true, phone: true, name: true },
      });

      if (!owner) {
        throw new Error('Owner not found');
      }

      const templateData = {
        ownerName: owner.name || 'Property Owner',
        agentName: params.agentName,
        estimatedCompletion: new Date(params.estimatedCompletion).toLocaleString(
          'en-NG'
        ),
        markingJobId: params.markingJobId,
      };

      // Send email notification
      const emailHtml = await templateService.renderTemplate(
        'job-claim-notification',
        templateData
      );

      await emailService.sendEmail({
        to: owner.email,
        subject: '✓ Agent Assigned to Your Property Marking Request',
        html: emailHtml,
      });

      // Send SMS notification
      if (owner.phone) {
        const smsMessage = `Good news! Agent ${params.agentName} has been assigned to mark your property. Est. completion: ${templateData.estimatedCompletion}. Track progress on Newcondo.`;
        await smsService.sendSMS({
          to: owner.phone,
          message: smsMessage,
        });
      }

      // Send push notification
      await pushService.sendPush({
        userId: params.ownerId,
        title: 'Agent Assigned',
        body: `${params.agentName} will mark your property`,
        data: {
          type: 'JOB_CLAIMED',
          markingJobId: params.markingJobId,
        },
      });

      console.log(
        `Job claim notification sent to owner ${params.ownerId} for job ${params.markingJobId}`
      );
    } catch (error) {
      console.error('Error sending job claim notification:', error);
      throw error;
    }
  }

  /**
   * Notify agent of compensation for time expired
   */
  async notifyCompensation(params: CompensationParams): Promise<void> {
    try {
      const agent = await db.user.findUnique({
        where: { id: params.agentId },
        select: { email: true, phone: true, name: true },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const templateData = {
        agentName: agent.name || 'Agent',
        compensationAmount: params.compensationAmount.toLocaleString('en-NG', {
          style: 'currency',
          currency: 'NGN',
        }),
        reason: params.reason,
        markingJobId: params.markingJobId,
      };

      // Send email notification
      const emailHtml = await templateService.renderTemplate(
        'time-expired-compensation',
        templateData
      );

      await emailService.sendEmail({
        to: agent.email,
        subject: 'Compensation Received for Property Marking',
        html: emailHtml,
      });

      // Send SMS notification
      if (agent.phone) {
        const smsMessage = `You've received ${templateData.compensationAmount} compensation for marking job. Reason: ${params.reason}. Check your Newcondo wallet.`;
        await smsService.sendSMS({
          to: agent.phone,
          message: smsMessage,
        });
      }

      // Send push notification
      await pushService.sendPush({
        userId: params.agentId,
        title: 'Compensation Received',
        body: `${templateData.compensationAmount} added to your wallet`,
        data: {
          type: 'COMPENSATION',
          markingJobId: params.markingJobId,
          amount: params.compensationAmount,
        },
      });

      console.log(
        `Compensation notification sent to agent ${params.agentId} for job ${params.markingJobId}`
      );
    } catch (error) {
      console.error('Error sending compensation notification:', error);
      throw error;
    }
  }

  /**
   * Notify agents when queue is released (job completed/cancelled)
   */
  async notifyQueueReleased(params: QueueReleasedParams): Promise<void> {
    try {
      const agents = await db.user.findMany({
        where: { id: { in: params.agentIds } },
        select: { id: true, email: true, phone: true, name: true },
      });

      const notifications = agents.map(async (agent) => {
        const templateData = {
          agentName: agent.name || 'Agent',
          reason: params.reason,
          markingJobId: params.markingJobId,
        };

        // Send push notification (quick)
        await pushService.sendPush({
          userId: agent.id,
          title: 'Job Queue Released',
          body: params.reason,
          data: {
            type: 'QUEUE_RELEASED',
            markingJobId: params.markingJobId,
          },
        });
      });

      await Promise.all(notifications);

      console.log(
        `Queue released notifications sent to ${agents.length} agents for job ${params.markingJobId}`
      );
    } catch (error) {
      console.error('Error sending queue released notifications:', error);
      throw error;
    }
  }

  /**
   * Generic notification sender
   */
  async sendNotification(notification: any): Promise<void> {
    // Implementation for generic notification sending
    console.log('Sending notification:', notification);
  }
}

export const queueNotificationService = new QueueNotificationService();