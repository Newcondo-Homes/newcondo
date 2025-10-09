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

interface JobAssignmentData {
  propertyTitle: string;
  propertyAddress: string;
  contactPersonName: string;
  contactPersonPhone: string;
  preferredTime?: Date;
  accessInstructions?: string;
  timeSlotExpiry: Date;
  markingFee: number;
}

interface JobCompletionData {
  propertyTitle: string;
  agentName: string;
  completionTime: Date;
  boundaryData: any;
}

interface JobApprovalData {
  propertyTitle: string;
  approvedAt: Date;
}

interface JobRejectionData {
  propertyTitle: string;
  rejectionReason: string;
  rejectedAt: Date;
}

interface JobCancellationData {
  propertyTitle: string;
  cancellationReason: string;
  cancelledAt: Date;
}

interface AdminNotificationData {
  [key: string]: any;
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
   * High-level method to notify a user that a job has started.
   */
  async notifyJobStarted(job: Job) {
    try {
      const agent = await prisma.user.findUnique({ where: { id: job.agentId } });
      const propertyOwner = await prisma.user.findUnique({ where: { id: job.userId } });

      if (!agent || !propertyOwner) throw new Error('User data missing.');

      await this.sendJobStartedNotification(propertyOwner.email, propertyOwner.phone, {
        propertyTitle: job.propertyTitle,
        agentName: agent.name,
        startTime: new Date()
      });
    } catch (error) {
      console.error('Failed to notify job started:', error);
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
   * High-level method to notify a user about a cancelled job.
   */
  async notifyJobCancelled(cancellation: any) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: cancellation.jobId },
        include: { property: true, user: true }
      });
      if (!job) throw new Error('Job not found.');

      const data: JobCancellationData = {
        propertyTitle: job.property.title,
        cancellationReason: cancellation.reason,
        cancelledAt: cancellation.cancelledAt
      };

      // Notify both property owner and agent
      await this.sendJobCancellationNotification(job.user.email, job.user.phone, data);
      const agent = await prisma.user.findUnique({ where: { id: cancellation.agentId } });
      if (agent) {
        await this.sendJobCancellationNotification(agent.email, agent.phone, data);
      }
    } catch (error) {
      console.error('Failed to notify job cancellation:', error);
    }
  }
  /**
   * Send notification when job is cancelled
   */
  async sendJobCancellationNotification(
    userEmail: string,
    userPhone: string | null,
    data: JobCancellationData
  ) {
    try {
      const emailContent = this.generateJobCancellationEmail(data);
      const smsContent = this.generateJobCancellationSMS(data);

      await this.sendEmail(userEmail, 'Property Marking Job Cancelled', emailContent);

      if (userPhone) {
        await this.sendSMS(userPhone, smsContent);
      }

      await this.logNotification('JOB_CANCELLATION', userEmail, data);

    } catch (error) {
      console.error('Send job cancellation notification error:', error);
      throw error;
    }
  }

  /**
   * High-level method to notify a user about a new assignment.
   */
  async notifyJobAssigned(assignment: Assignment) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: assignment.jobId },
        include: { property: true, user: true }
      });
      if (!job) throw new Error('Job not found.');

      const agent = await prisma.user.findUnique({
        where: { id: assignment.agentId }
      });
      if (!agent) throw new Error('Agent not found.');

      const data: JobAssignmentData = {
        propertyTitle: job.property.title,
        propertyAddress: job.property.address,
        contactPersonName: job.user.name,
        contactPersonPhone: job.user.phone,
        preferredTime: job.preferredTime || undefined,
        accessInstructions: job.accessInstructions || undefined,
        timeSlotExpiry: assignment.timeSlotExpiry,
        markingFee: job.markingFee
      };

      await this.sendJobAssignmentNotification(agent.email, agent.phone, data);
    } catch (error) {
      console.error('Failed to notify job assignment:', error);
    }
  }

  /**
   * High-level method to notify a user that a job has started.
   */
  async notifyJobStarted(job: Job) {
    try {
      const agent = await prisma.user.findUnique({ where: { id: job.agentId } });
      const propertyOwner = await prisma.user.findUnique({ where: { id: job.userId } });

      if (!agent || !propertyOwner) throw new Error('User data missing.');

      await this.sendJobStartedNotification(propertyOwner.email, propertyOwner.phone, {
        propertyTitle: job.propertyTitle,
        agentName: agent.name,
        startTime: new Date()
      });
    } catch (error) {
      console.error('Failed to notify job started:', error);
    }
  }

  /**
   * High-level method to notify a user about a completed job.
   */
  async notifyJobCompleted(completedJob: any) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: completedJob.jobId },
        include: { property: true, user: true, agent: true }
      });
      if (!job) throw new Error('Job not found.');

      const data: JobCompletionData = {
        propertyTitle: job.property.title,
        agentName: job.agent.name,
        completionTime: completedJob.completionTime,
        boundaryData: completedJob.boundaryData
      };

      await this.sendJobCompletionNotification(job.user.email, job.user.phone, data);
    } catch (error) {
      console.error('Failed to notify job completion:', error);
    }
  }

  /**
   * High-level method to notify a user about a cancelled job.
   */
  async notifyJobCancelled(cancellation: any) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: cancellation.jobId },
        include: { property: true, user: true }
      });
      if (!job) throw new Error('Job not found.');

      const data: JobCancellationData = {
        propertyTitle: job.property.title,
        cancellationReason: cancellation.reason,
        cancelledAt: cancellation.cancelledAt
      };

      // Notify both property owner and agent
      await this.sendJobCancellationNotification(job.user.email, job.user.phone, data);
      const agent = await prisma.user.findUnique({ where: { id: cancellation.agentId } });
      if (agent) {
        await this.sendJobCancellationNotification(agent.email, agent.phone, data);
      }
    } catch (error) {
      console.error('Failed to notify job cancellation:', error);
    }
  }

  /**
   * High-level method to notify admin about a reported issue.
   */
  async notifyAdminIssue(issue: any) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: issue.jobId },
        include: { property: true, user: true, agent: true }
      });
      if (!job) throw new Error('Job not found.');

      const data = {
        jobId: job.id,
        propertyTitle: job.property.title,
        agentName: job.agent.name,
        issueType: issue.issueType,
        description: issue.description,
        severity: issue.severity
      };

      await this.sendAdminNotification('JOB_ISSUE', data);
    } catch (error) {
      console.error('Failed to notify admin of issue:', error);
    }
  }

  /**
   * Send notification when job is assigned to agent
   */
  async sendJobAssignmentNotification(
    agentEmail: string,
    agentPhone: string | null,
    data: JobAssignmentData
  ) {
    try {
      const emailContent = this.generateJobAssignmentEmail(data);
      const smsContent = this.generateJobAssignmentSMS(data);

      // Send email notification
      await this.sendEmail(agentEmail, 'New Property Marking Job Assigned', emailContent);

      // Send SMS notification if phone is available
      if (agentPhone) {
        await this.sendSMS(agentPhone, smsContent);
      }

      // Log notification
      await this.logNotification('JOB_ASSIGNMENT', agentEmail, data);

    } catch (error) {
      console.error('Send job assignment notification error:', error);
      throw error;
    }
  }

  /**
   * Send notification when job is completed
   */
  async sendJobCompletionNotification(
    userEmail: string,
    userPhone: string | null,
    data: JobCompletionData
  ) {
    try {
      const emailContent = this.generateJobCompletionEmail(data);
      const smsContent = this.generateJobCompletionSMS(data);

      await this.sendEmail(userEmail, 'Property Marking Completed', emailContent);

      if (userPhone) {
        await this.sendSMS(userPhone, smsContent);
      }

      await this.logNotification('JOB_COMPLETION', userEmail, data);

    } catch (error) {
      console.error('Send job completion notification error:', error);
      throw error;
    }
  }

  /**
   * Send notification when job is approved by admin
   */
  async sendJobApprovalNotification(
    userEmail: string,
    userPhone: string | null,
    data: JobApprovalData
  ) {
    try {
      const emailContent = this.generateJobApprovalEmail(data);
      const smsContent = this.generateJobApprovalSMS(data);

      await this.sendEmail(userEmail, 'Property Boundary Approved', emailContent);

      if (userPhone) {
        await this.sendSMS(userPhone, smsContent);
      }

      await this.logNotification('JOB_APPROVAL', userEmail, data);

    } catch (error) {
      console.error('Send job approval notification error:', error);
      throw error;
    }
  }

  /**
   * Send notification when job is rejected by admin
   */
  async sendJobRejectionNotification(
    userEmail: string,
    userPhone: string | null,
    data: JobRejectionData
  ) {
    try {
      const emailContent = this.generateJobRejectionEmail(data);
      const smsContent = this.generateJobRejectionSMS(data);

      await this.sendEmail(userEmail, 'Property Boundary Marking Rejected', emailContent);

      if (userPhone) {
        await this.sendSMS(userPhone, smsContent);
      }

      await this.logNotification('JOB_REJECTION', userEmail, data);

    } catch (error) {
      console.error('Send job rejection notification error:', error);
      throw error;
    }
  }

  /**
   * Send notification when job is cancelled
   */
  async sendJobCancellationNotification(
    userEmail: string,
    userPhone: string | null,
    data: JobCancellationData
  ) {
    try {
      const emailContent = this.generateJobCancellationEmail(data);
      const smsContent = this.generateJobCancellationSMS(data);

      await this.sendEmail(userEmail, 'Property Marking Job Cancelled', emailContent);

      if (userPhone) {
        await this.sendSMS(userPhone, smsContent);
      }

      await this.logNotification('JOB_CANCELLATION', userEmail, data);

    } catch (error) {
      console.error('Send job cancellation notification error:', error);
      throw error;
    }
  }

  /**
   * Send time slot expiry warning to agent
   */
  async sendTimeSlotWarning(
    agentEmail: string,
    agentPhone: string | null,
    jobId: string,
    remainingMinutes: number
  ) {
    try {
      const emailContent = this.generateTimeSlotWarningEmail(jobId, remainingMinutes);
      const smsContent = this.generateTimeSlotWarningSMS(jobId, remainingMinutes);

      await this.sendEmail(agentEmail, 'Time Slot Expiring Soon', emailContent);

      if (agentPhone) {
        await this.sendSMS(agentPhone, smsContent);
      }

      await this.logNotification('TIME_SLOT_WARNING', agentEmail, { jobId, remainingMinutes });

    } catch (error) {
      console.error('Send time slot warning error:', error);
      throw error;
    }
  }

  /**
   * Send admin notifications
   */
  async sendAdminNotification(type: string, data: AdminNotificationData) {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN'
        },
        select: {
          email: true,
          phone: true
        }
      });

      for (const admin of admins) {
        const emailContent = this.generateAdminNotificationEmail(type, data);
        const smsContent = this.generateAdminNotificationSMS(type, data);

        await this.sendEmail(admin.email, `Admin Alert: ${type}`, emailContent);

        if (admin.phone) {
          await this.sendSMS(admin.phone, smsContent);
        }

        await this.logNotification(`ADMIN_${type}`, admin.email, data);
      }
    } catch (error) {
      console.error('Send admin notification error:', error);
      throw error;
    }
  }

  /**
   * Private helper method to send an email.
   * This would typically be an API call to a service like SendGrid, Nodemailer, etc.
   */
  private async sendEmail(to: string, subject: string, htmlContent: string) {
    console.log(`Sending email to ${to} with subject: ${subject}`);
    // Await your email service provider's API call here.
    return true; // Placeholder for success
  }

  /**
   * Private helper method to send an SMS.
   * This would typically be an API call to a service like Twilio, Vonage, etc.
   */
  private async sendSMS(to: string, content: string) {
    console.log(`Sending SMS to ${to} with content: ${content}`);
    // Await your SMS service provider's API call here.
    return true; // Placeholder for success
  }

  /**
   * Private helper method to log notifications to the database.
   */
  private async logNotification(type: string, recipient: string, payload: any) {
    try {
      await prisma.notificationLog.create({
        data: {
          type,
          recipient,
          payload: JSON.stringify(payload)
        }
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Private helper methods for email content generation.
   */
  private generateJobAssignmentEmail(data: JobAssignmentData): string {
    return `
      <h1>New Job Assignment!</h1>
      <p>You have been assigned a new property marking job at ${data.propertyAddress} (${data.propertyTitle}).</p>
      <p>The job must be accepted by ${data.timeSlotExpiry}.</p>
      <p>Contact person: ${data.contactPersonName} (${data.contactPersonPhone})</p>
      <p>Marking fee: $${data.markingFee}</p>
    `;
  }

  private generateJobCompletionEmail(data: JobCompletionData): string {
    return `
      <h1>Job Completed</h1>
      <p>The property marking at ${data.propertyTitle} has been completed by ${data.agentName}.</p>
      <p>View the boundary data here...</p>
    `;
  }

  private generateJobApprovalEmail(data: JobApprovalData): string {
    return `
      <h1>Job Approved</h1>
      <p>The boundary marking for ${data.propertyTitle} has been approved.</p>
    `;
  }

  private generateJobRejectionEmail(data: JobRejectionData): string {
    return `
      <h1>Job Rejected</h1>
      <p>The boundary marking for ${data.propertyTitle} was rejected.</p>
      <p>Reason: ${data.rejectionReason}</p>
    `;
  }

  private generateJobCancellationEmail(data: JobCancellationData): string {
    return `
      <h1>Job Cancelled</h1>
      <p>The job for ${data.propertyTitle} has been cancelled.</p>
      <p>Reason: ${data.cancellationReason}</p>
    `;
  }

  private generateTimeSlotWarningEmail(jobId: string, remainingMinutes: number): string {
    return `
      <h1>Time Slot Expiring</h1>
      <p>Your time slot for job ${jobId} is expiring in ${remainingMinutes} minutes. Please act now to accept the job.</p>
    `;
  }

  private generateAdminNotificationEmail(type: string, data: AdminNotificationData): string {
    return `
      <h1>Admin Alert: ${type}</h1>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
  }

  /**
   * Private helper methods for SMS content generation.
   */
  private generateJobAssignmentSMS(data: JobAssignmentData): string {
    return `New Job! ${data.propertyTitle} at ${data.propertyAddress}. Fee: $${data.markingFee}. Accept by ${data.timeSlotExpiry.toLocaleString()}.`;
  }

  private generateJobCompletionSMS(data: JobCompletionData): string {
    return `Job at ${data.propertyTitle} completed by ${data.agentName}.`;
  }

  private generateJobApprovalSMS(data: JobApprovalData): string {
    return `Property boundary for ${data.propertyTitle} approved.`;
  }

  private generateJobRejectionSMS(data: JobRejectionData): string {
    return `Boundary marking for ${data.propertyTitle} rejected. Reason: ${data.rejectionReason}`;
  }

  private generateJobCancellationSMS(data: JobCancellationData): string {
    return `Job for ${data.propertyTitle} has been cancelled. Reason: ${data.cancellationReason}`;
  }

  private generateTimeSlotWarningSMS(jobId: string, remainingMinutes: number): string {
    return `Warning: Your time slot for job ${jobId} expires in ${remainingMinutes} mins.`;
  }

  private generateAdminNotificationSMS(type: string, data: AdminNotificationData): string {
    return `Admin Alert: ${type} on ${data.propertyTitle}. Details: ${data.description}`;
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




// // backend/marking-service/src/services/notificationService.ts
// import { PrismaClient, PropertyMarkingJob, User } from '@newcondo/db';
// import { EmailService } from '../utils/emailService';
// import { SMSService } from '../utils/smsService';
// import { Logger } from '../utils/logger';

// interface NotificationPayload {
//   userId: string;
//   type: NotificationType;
//   title: string;
//   message: string;
//   data: Record<string, any>;
// }

// enum NotificationType {
//   MARKING_JOB_QUEUED = 'MARKING_JOB_QUEUED',
//   MARKING_JOB_ASSIGNED = 'MARKING_JOB_ASSIGNED',
//   MARKING_JOB_COMPLETED = 'MARKING_JOB_COMPLETED',
//   MARKING_VERIFICATION_NEEDED = 'MARKING_VERIFICATION_NEEDED',
//   MARKING_JOB_EXPIRED = 'MARKING_JOB_EXPIRED',
//   COMPENSATION_RELEASED = 'COMPENSATION_RELEASED',
//   OWNER_AGENT_ASSIGNED = 'OWNER_AGENT_ASSIGNED',
//   TIME_SLOT_EXPIRING = 'TIME_SLOT_EXPIRING',
// }

// export class NotificationService {
//   private prisma: PrismaClient;
//   private emailService: EmailService;
//   private smsService: SMSService;
//   private logger: Logger;

//   constructor(
//     prisma: PrismaClient,
//     emailService: EmailService,
//     smsService: SMSService,
//     logger: Logger
//   ) {
//     this.prisma = prisma;
//     this.emailService = emailService;
//     this.smsService = smsService;
//     this.logger = logger;
//   }

//   /**
//    * Notify agent when added to marking job queue
//    */
//   async notifyAgentQueuedForJob(
//     agentId: string,
//     markingJobId: string,
//     queuePosition: number,
//     propertyId: string
//   ): Promise<void> {
//     try {
//       const agent = await this.prisma.user.findUnique({
//         where: { id: agentId },
//       });

//       const property = await this.prisma.property.findUnique({
//         where: { id: propertyId },
//       });

//       if (!agent || !property) {
//         this.logger.warn('Agent or property not found for notification');
//         return;
//       }

//       const message = `You have been added to marking job queue for property at ${property.address}. Position: ${queuePosition}`;

//       // Send email notification
//       if (agent.email) {
//         await this.emailService.sendMarkingJobQueueNotification({
//           to: agent.email,
//           agentName: agent.name || 'Agent',
//           propertyAddress: property.address,
//           queuePosition,
//           markingJobId,
//         });
//       }

//       // Send SMS notification
//       if (agent.phone) {
//         await this.smsService.sendMessage({
//           phone: agent.phone,
//           message: `You're in queue for marking job at ${property.address}. Position: ${queuePosition}. Check your email for details.`,
//         });
//       }

//       // Log notification
//       await this.logNotification({
//         userId: agentId,
//         type: NotificationType.MARKING_JOB_QUEUED,
//         title: 'Marking Job Added to Queue',
//         message,
//         data: {
//           markingJobId,
//           propertyId,
//           queuePosition,
//           propertyAddress: property.address,
//         },
//       });

//       this.logger.info(
//         `Queued job notification sent to agent ${agentId}`
//       );
//     } catch (error) {
//       this.logger.error('Error sending queued job notification:', error);
//     }
//   }

//   /**
//    * Notify agent when assigned a marking job
//    */
//   async notifyAgentAssignment(
//     agentId: string,
//     markingJob: PropertyMarkingJob & { property: any; requestingUser: User },
//     timeSlotExpiry: Date
//   ): Promise<void> {
//     try {
//       const agent = await this.prisma.user.findUnique({
//         where: { id: agentId },
//       });

//       if (!agent) {
//         this.logger.warn(`Agent ${agentId} not found for notification`);
//         return;
//       }

//       const hoursRemaining = Math.floor(
//         (timeSlotExpiry.getTime() - Date.now()) / (1000 * 60 * 60)
//       );

//       const message = `You have been assigned a marking job for property at ${markingJob.property.address}. Complete within ${hoursRemaining} hours.`;

//       // Send email notification with property details
//       if (agent.email) {
//         await this.emailService.sendMarkingJobAssignmentNotification({
//           to: agent.email,
//           agentName: agent.name || 'Agent',
//           propertyAddress: markingJob.property.address,
//           contactPersonName: markingJob.contactPersonName,
//           contactPersonPhone: markingJob.contactPersonPhone,
//           accessInstructions: markingJob.accessInstructions,
//           timeSlotExpiry,
//           markingJobId: markingJob.id,
//           compensationAmount: markingJob.markingFee,
//         });
//       }

//       // Send SMS notification
//       if (agent.phone) {
//         await this.smsService.sendMessage({
//           phone: agent.phone,
//           message: `Marking job assigned! Property: ${markingJob.property.address}. Complete within ${hoursRemaining} hours. Contact: ${markingJob.contactPersonPhone}`,
//         });
//       }

//       // Log notification
//       await this.logNotification({
//         userId: agentId,
//         type: NotificationType.MARKING_JOB_ASSIGNED,
//         title: 'Marking Job Assigned',
//         message,
//         data: {
//           markingJobId: markingJob.id,
//           propertyAddress: markingJob.property.address,
//           contactPerson: markingJob.contactPersonName,
//           hoursRemaining,
//           timeSlotExpiry,
//         },
//       });

//       this.logger.info(`Assignment notification sent to agent ${agentId}`);
//     } catch (error) {
//       this.logger.error('Error sending assignment notification:', error);
//     }
//   }

//   /**
//    * Notify agent of manual assignment
//    */
//   async notifyAgentManualAssignment(
//     agentId: string,
//     markingJob: PropertyMarkingJob & { property: any },
//     timeSlotExpiry: Date
//   ): Promise<void> {
//     try {
//       const agent = await this.prisma.user.findUnique({
//         where: { id: agentId },
//       });

//       if (!agent) return;

//       const message = `You have been directly assigned a marking job for ${markingJob.property.address}`;

//       if (agent.email) {
//         await this.emailService.sendMarkingJobAssignmentNotification({
//           to: agent.email,
//           agentName: agent.name || 'Agent',
//           propertyAddress: markingJob.property.address,
//           contactPersonName: markingJob.contactPersonName,
//           contactPersonPhone: markingJob.contactPersonPhone,
//           accessInstructions: markingJob.accessInstructions,
//           timeSlotExpiry,
//           markingJobId: markingJob.id,
//           compensationAmount: markingJob.markingFee,
//           isManualAssignment: true,
//         });
//       }

//       this.logger.info(
//         `Manual assignment notification sent to agent ${agentId}`
//       );
//     } catch (error) {
//       this.logger.error('Error sending manual assignment notification:', error);
//     }
//   }

//   /**
//    * Notify property owner when agent is assigned
//    */
//   async notifyOwnerAgentAssigned(
//     ownerId: string,
//     markingJob: PropertyMarkingJob & { property: any },
//     agentId: string
//   ): Promise<void> {
//     try {
//       const owner = await this.prisma.user.findUnique({
//         where: { id: ownerId },
//       });

//       const agent = await this.prisma.user.findUnique({
//         where: { id: agentId },
//         select: { id: true, name: true, phone: true, email: true },
//       });

//       if (!owner || !agent) {
//         this.logger.warn('Owner or agent not found for notification');
//         return;
//       }

//       const message = `Your marking job for ${markingJob.property.address} has been assigned to agent ${agent.name}. They will contact you shortly.`;

//       if (owner.email) {
//         await this.emailService.sendOwnerAgentAssignedNotification({
//           to: owner.email,
//           ownerName: owner.name || 'Owner',
//           propertyAddress: markingJob.property.address,
//           agentName: agent.name || 'Agent',
//           agentPhone: agent.phone || '',
//           markingJobId: markingJob.id,
//         });
//       }

//       if (owner.phone) {
//         await this.smsService.sendMessage({
//           phone: owner.phone,
//           message: `Marking agent assigned! Agent: ${agent.name}, Phone: ${agent.phone}. They'll contact you soon.`,
//         });
//       }

//       await this.logNotification({
//         userId: ownerId,
//         type: NotificationType.OWNER_AGENT_ASSIGNED,
//         title: 'Agent Assigned to Your Marking Job',
//         message,
//         data: {
//           markingJobId: markingJob.id,
//           agentId,
//           agentName: agent.name,
//           agentPhone: agent.phone,
//         },
//       });

//       this.logger.info(
//         `Agent assignment notification sent to owner ${ownerId}`
//       );
//     } catch (error) {
//       this.logger.error('Error sending owner assignment notification:', error);
//     }
//   }

//   /**
//    * Notify owner when marking is completed and needs verification
//    */
//   async notifyOwnerMarkingCompleted(
//     ownerId: string,
//     markingJob: PropertyMarkingJob & { property: any; assignedAgent: any },
//     completionDetails: {
//       completionNotes?: string;
//       completionImages: string[];
//     }
//   ): Promise<void> {
//     try {
//       const owner = await this.prisma.user.findUnique({
//         where: { id: ownerId },
//       });

//       if (!owner) return;

//       const verificationDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

//       const message = `Your property at ${markingJob.property.address} has been marked by ${markingJob.assignedAgent.name}. Please verify the marking within 3 days.`;

//       if (owner.email) {
//         await this.emailService.sendOwnerMarkingCompletedNotification({
//           to: owner.email,
//           ownerName: owner.name || 'Owner',
//           propertyAddress: markingJob.property.address,
//           agentName: markingJob.assignedAgent.name,
//           completionImages: completionDetails.completionImages,
//           completionNotes: completionDetails.completionNotes,
//           verificationDeadline,
//           markingJobId: markingJob.id,
//         });
//       }

//       if (owner.phone) {
//         await this.smsService.sendMessage({
//           phone: owner.phone,
//           message: `Your property marking is complete! Please verify within 3 days. Check your email for details.`,
//         });
//       }

//       await this.logNotification({
//         userId: ownerId,
//         type: NotificationType.MARKING_VERIFICATION_NEEDED,
//         title: 'Property Marking Complete - Verification Required',
//         message,
//         data: {
//           markingJobId: markingJob.id,
//           verificationDeadline,
//           imageCount: completionDetails.completionImages.length,
//         },
//       });

//       this.logger.info(
//         `Marking completion notification sent to owner ${ownerId}`
//       );
//     } catch (error) {
//       this.logger.error('Error sending marking completion notification:', error);
//     }
//   }

//   /**
//    * Notify agent when compensation is released
//    */
//   async notifyAgentCompensationReleased(
//     agentId: string,
//     amount: number,
//     markingJobId: string,
//     propertyAddress: string
//   ): Promise<void> {
//     try {
//       const agent = await this.prisma.user.findUnique({
//         where: { id: agentId },
//       });

//       if (!agent) return;

//       const message = `You have received ₦${amount.toLocaleString()} for completing marking job at ${propertyAddress}`;

//       if (agent.email) {
//         await this.emailService.sendAgentCompensationNotification({
//           to: agent.email,
//           agentName: agent.name || 'Agent',
//           amount,
//           propertyAddress,
//           markingJobId,
//         });
//       }

//       if (agent.phone) {
//         await this.smsService.sendMessage({
//           phone: agent.phone,
//           message: `You've received ₦${amount.toLocaleString()} for marking. Check your virtual account.`,
//         });
//       }

//       await this.logNotification({
//         userId: agentId,
//         type: NotificationType.COMPENSATION_RELEASED,
//         title: 'Compensation Released',
//         message,
//         data: {
//           markingJobId,
//           amount,
//           propertyAddress,
//         },
//       });

//       this.logger.info(
//         `Compensation notification sent to agent ${agentId}`
//       );
//     } catch (error) {
//       this.logger.error('Error sending compensation notification:', error);
//     }
//   }

//   /**
//    * Notify agent when time slot is about to expire
//    */
//   async notifyAgentTimeSlotExpiring(
//     agentId: string,
//     markingJobId: string,
//     propertyAddress: string,
//     hoursRemaining: number
//   ): Promise<void> {
//     try {
//       const agent = await this.prisma.user.findUnique({
//         where: { id: agentId },
//       });

//       if (!agent) return;

//       const message = `Time slot for marking job at ${propertyAddress} expires in ${hoursRemaining} hours. Complete marking immediately.`;

//       if (agent.phone) {
//         await this.smsService.sendMessage({
//           phone: agent.phone,
//           message,
//         });
//       }

//       await this.logNotification({
//         userId: agentId,
//         type: NotificationType.TIME_SLOT_EXPIRING,
//         title: 'Time Slot Expiring Soon',
//         message,
//         data: {
//           markingJobId,
//           propertyAddress,
//           hoursRemaining,
//         },
//       });

//       this.logger.info(
//         `Time slot expiring notification sent to agent ${agentId}`
//       );
//     } catch (error) {
//       this.logger.error(
//         'Error sending time slot expiring notification:',
//         error
//       );
//     }
//   }

//   /**
//    * Notify owner when marking job expires
//    */
//   async notifyOwnerMarkingExpired(
//     ownerId: string,
//     markingJobId: string,
//     propertyAddress: string
//   ): Promise<void> {
//     try {
//       const owner = await this.prisma.user.findUnique({
//         where: { id: ownerId },
//       });

//       if (!owner) return;

//       const message = `Your marking job for ${propertyAddress} has expired. Please initiate a new marking request if needed.`;

//       if (owner.email) {
//         await this.emailService.sendOwnerMarkingExpiredNotification({
//           to: owner.email,
//           ownerName: owner.name || 'Owner',
//           propertyAddress,
//           markingJobId,
//         });
//       }

//       if (owner.phone) {
//         await this.smsService.sendMessage({
//           phone: owner.phone,
//           message: `Marking job expired. Please request a new marking if needed.`,
//         });
//       }

//       await this.logNotification({
//         userId: ownerId,
//         type: NotificationType.MARKING_JOB_EXPIRED,
//         title: 'Marking Job Expired',
//         message,
//         data: {
//           markingJobId,
//           propertyAddress,
//         },
//       });

//       this.logger.info(`Marking expired notification sent to owner ${ownerId}`);
//     } catch (error) {
//       this.logger.error('Error sending marking expired notification:', error);
//     }
//   }

//   /**
//    * Log notification in database for audit trail
//    */
//   private async logNotification(payload: NotificationPayload): Promise<void> {
//     try {
//       // Note: You may need to create a Notification model in Prisma schema
//       // For now, this logs the notification data for audit purposes
//       this.logger.info('Notification logged', {
//         userId: payload.userId,
//         type: payload.type,
//         title: payload.title,
//         timestamp: new Date(),
//       });
//     } catch (error) {
//       this.logger.error('Error logging notification:', error);
//     }
//   }
// }

// export { NotificationType };