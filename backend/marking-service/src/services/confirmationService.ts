// backend/marking-service/src/services/confirmationService.ts

import { PrismaClient, MarkingJobStatus } from '@prisma/client';
import { NotificationService } from './notificationService';
import { PaymentService } from './paymentService';

const prisma = new PrismaClient();

export class ConfirmationService {
  private notificationService: NotificationService;
  private paymentService: PaymentService;

  constructor() {
    this.notificationService = new NotificationService();
    this.paymentService = new PaymentService();
  }

  /**
   * Get all pending confirmations for a user
   */
  async getUserPendingConfirmations(userId: string) {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        requestedBy: userId,
        status: MarkingJobStatus.COMPLETED,
        property: {
          boundaryVerified: false,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            boundaryImages: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            phone: true,
            agentReliabilityScore: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Add deadline information
    return jobs.map(job => {
      const confirmationDeadline = job.completedAt
        ? new Date(job.completedAt.getTime() + 2 * 24 * 60 * 60 * 1000)
        : null;

      return {
        ...job,
        confirmationDeadline,
        hoursRemaining: confirmationDeadline
          ? Math.max(0, Math.ceil((confirmationDeadline.getTime() - Date.now()) / (1000 * 60 * 60)))
          : null,
        isUrgent: confirmationDeadline
          ? (confirmationDeadline.getTime() - Date.now()) < 24 * 60 * 60 * 1000
          : false,
      };
    });
  }

  /**
   * Process auto-confirmations for expired deadlines
   */
  async processExpiredConfirmations() {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Find jobs completed more than 2 days ago that haven't been confirmed
    const expiredJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.COMPLETED,
        completedAt: {
          lt: twoDaysAgo,
        },
        property: {
          boundaryVerified: false,
        },
      },
      include: {
        property: true,
        assignedAgent: true,
        requestingUser: true,
      },
    });

    let processedCount = 0;

    for (const job of expiredJobs) {
      try {
        await this.autoConfirmMarking(job);
        processedCount++;
      } catch (error) {
        console.error(`Failed to auto-confirm job ${job.id}:`, error);
      }
    }

    return {
      processedCount,
      totalExpired: expiredJobs.length,
    };
  }

  /**
   * Auto-confirm marking after deadline
   */
  private async autoConfirmMarking(job: any) {
    // Update property boundary as verified
    await prisma.property.update({
      where: { id: job.propertyId },
      data: {
        boundaryVerified: true,
        buildingFingerprint: this.generateBuildingFingerprint(job.boundaryData),
      },
    });

    // Update job notes
    await prisma.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        completionNotes: `${job.completionNotes || ''}\n\nAuto-confirmed after deadline.`,
      },
    });

    // Release remaining payment to agent
    await this.paymentService.releaseRemainingPayment(job.id, job.assignedAgentId);

    // Notify both parties
    await this.notificationService.notifyAutoConfirmation(job);

    // Log event
    await prisma.eventLog.create({
      data: {
        userId: job.requestedBy,
        type: 'MARKING_AUTO_CONFIRMED',
        metadata: {
          jobId: job.id,
          propertyId: job.propertyId,
          agentId: job.assignedAgentId,
        },
      },
    });
  }

  /**
   * Send confirmation reminders
   */
  async sendConfirmationReminders() {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find jobs that will expire in approximately 24 hours
    const jobsNeedingReminder = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.COMPLETED,
        completedAt: {
          gte: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          lte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
        property: {
          boundaryVerified: false,
        },
      },
      include: {
        property: true,
        requestingUser: true,
        assignedAgent: true,
      },
    });

    let remindersSent = 0;

    for (const job of jobsNeedingReminder) {
      try {
        await this.notificationService.sendConfirmationReminder(job);
        remindersSent++;
      } catch (error) {
        console.error(`Failed to send reminder for job ${job.id}:`, error);
      }
    }

    return {
      remindersSent,
      totalJobs: jobsNeedingReminder.length,
    };
  }

  /**
   * Generate building fingerprint from boundary data
   */
  private generateBuildingFingerprint(boundaryData: any): string {
    if (!boundaryData || !boundaryData.coordinates) {
      return '';
    }

    // Create a unique fingerprint based on coordinates
    const coords = boundaryData.coordinates;
    const centerLat = coords.reduce((sum: number, c: any) => sum + c.lat, 0) / coords.length;
    const centerLng = coords.reduce((sum: number, c: any) => sum + c.lng, 0) / coords.length;

    // Round to 6 decimal places for consistency
    const lat = centerLat.toFixed(6);
    const lng = centerLng.toFixed(6);

    return `${lat},${lng}`;
  }

  /**
   * Get confirmation statistics
   */
  async getConfirmationStats(userId?: string) {
    const where: any = {
      status: MarkingJobStatus.COMPLETED,
    };

    if (userId) {
      where.requestedBy = userId;
    }

    const [
      totalCompleted,
      awaitingConfirmation,
      confirmed,
      autoConfirmed,
      rejected,
    ] = await Promise.all([
      prisma.propertyMarkingJob.count({ where }),
      prisma.propertyMarkingJob.count({
        where: {
          ...where,
          property: {
            boundaryVerified: false,
          },
        },
      }),
      prisma.eventLog.count({
        where: {
          type: 'MARKING_CONFIRMED_APPROVED',
          ...(userId && { userId }),
        },
      }),
      prisma.eventLog.count({
        where: {
          type: 'MARKING_AUTO_CONFIRMED',
          ...(userId && { userId }),
        },
      }),
      prisma.eventLog.count({
        where: {
          type: 'MARKING_CONFIRMED_REJECTED',
          ...(userId && { userId }),
        },
      }),
    ]);

    return {
      totalCompleted,
      awaitingConfirmation,
      confirmed,
      autoConfirmed,
      rejected,
      confirmationRate: totalCompleted > 0 ? (confirmed / totalCompleted) * 100 : 0,
      autoConfirmRate: totalCompleted > 0 ? (autoConfirmed / totalCompleted) * 100 : 0,
    };
  }

  /**
   * Request extension for confirmation deadline
   */
  async requestConfirmationExtension(jobId: string, userId: string, reason: string) {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        requestingUser: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.requestedBy !== userId) {
      throw new Error('Unauthorized');
    }

    if (job.status !== MarkingJobStatus.COMPLETED) {
      throw new Error('Can only request extension for completed jobs');
    }

    // Check if already past deadline
    const deadline = job.completedAt
      ? new Date(job.completedAt.getTime() + 2 * 24 * 60 * 60 * 1000)
      : null;

    if (deadline && new Date() > deadline) {
      throw new Error('Confirmation deadline has already passed');
    }

    // Create support ticket for extension request
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        title: `Confirmation Extension Request - Job ${jobId}`,
        description: `User requests extension for marking confirmation. Reason: ${reason}`,
        category: 'GENERAL',
        priority: 'MEDIUM',
        status: 'OPEN',
      },
    });

    // Notify admin
    await this.notificationService.notifyAdminExtensionRequest(job, reason, ticket.id);

    return {
      success: true,
      ticketId: ticket.id,
      message: 'Extension request submitted. An admin will review your request.',
    };
  }
}

export default ConfirmationService; Property owner confirms marking
   */
  async confirmMarking(data: {
    jobId: string;
    userId: string;
    isApproved: boolean;
    feedback?: string;
  }) {
    const { jobId, userId, isApproved, feedback } = data;

    // Get the job
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
        assignedAgent: true,
        requestingUser: true,
      },
    });

    if (!job) {
      throw new Error('Marking job not found');
    }

    // Verify user is the property owner
    if (job.requestedBy !== userId) {
      throw new Error('Only the property owner can confirm marking');
    }

    // Verify job is completed
    if (job.status !== MarkingJobStatus.COMPLETED) {
      throw new Error('Job must be completed before confirmation');
    }

    if (isApproved) {
      // Approve the marking
      await this.approveMarking(job, feedback);
    } else {
      // Reject the marking
      await this.rejectMarking(job, feedback || 'Marking not satisfactory');
    }

    return {
      success: true,
      isApproved,
      message: isApproved
        ? 'Marking confirmed successfully'
        : 'Marking rejected. A new marking attempt may be required.',
    };
  }

  /**
   * Approve marking
   */
  private async approveMarking(job: any, feedback?: string) {
    // Update property boundary as verified
    await prisma.property.update({
      where: { id: job.propertyId },
      data: {
        boundaryVerified: true,
        buildingFingerprint: this.generateBuildingFingerprint(job.boundaryData),
      },
    });

    // Update job with approval
    await prisma.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        completionNotes: feedback
          ? `${job.completionNotes || ''}\n\nOwner feedback: ${feedback}`
          : job.completionNotes,
      },
    });

    // Release full payment to agent
    await this.paymentService.releaseRemainingPayment(job.id, job.assignedAgentId);

    // Notify agent of successful completion and payment
    await this.notificationService.notifyAgentPaymentReleased(job);

    // Update agent's reliability score positively
    if (job.assignedAgent) {
      const currentScore = Number(job.assignedAgent.agentReliabilityScore) || 3.0;
      const newScore = Math.min(5.0, currentScore + 0.1);

      await prisma.user.update({
        where: { id: job.assignedAgentId },
        data: {
          agentReliabilityScore: newScore,
        },
      });
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        userId: job.requestedBy,
        type: 'MARKING_CONFIRMED_APPROVED',
        metadata: {
          jobId: job.id,
          propertyId: job.propertyId,
          agentId: job.assignedAgentId,
        },
      },
    });
  }

  /**
   * Reject marking
   */
  private async rejectMarking(job: any, reason: string) {
    // Keep property boundary as unverified
    await prisma.property.update({
      where: { id: job.propertyId },
      data: {
        boundaryVerified: false,
        boundaryCoordinates: null,
        boundaryImages: [],
        boundaryMarkedBy: null,
        boundaryMarkedAt: null,
      },
    });

    // Update job with rejection
    await prisma.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        status: MarkingJobStatus.CANCELLED,
        completionNotes: `Rejected by owner: ${reason}`,
      },
    });

    // Pay agent small compensation for effort (keep initial 1000 naira)
    // No additional payment released

    // Notify agent of rejection
    await this.notificationService.notifyAgentMarkingRejected(job, reason);

    // Penalize agent's reliability score slightly
    if (job.assignedAgent) {
      const currentScore = Number(job.assignedAgent.agentReliabilityScore) || 3.0;
      const newScore = Math.max(0, currentScore - 0.15);

      await prisma.user.update({
        where: { id: job.assignedAgentId },
        data: {
          agentReliabilityScore: newScore,
        },
      });
    }

    // Notify owner that they need to create a new marking job
    await this.notificationService.notifyOwnerRejectionComplete(job);

    // Log event
    await prisma.eventLog.create({
      data: {
        userId: job.requestedBy,
        type: 'MARKING_CONFIRMED_REJECTED',
        metadata: {
          jobId: job.id,
          propertyId: job.propertyId,
          agentId: job.assignedAgentId,
          reason,
        },
      },
    });
  }

  /**
   * Get confirmation details for property owner
   */
  async getConfirmationDetails(jobId: string, userId: string) {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: {
          include: {
            images: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            agentReliabilityScore: true,
            completedMarkingJobs: true,
          },
        },
      },
    });

    if (!job) {
      throw new Error('Marking job not found');
    }

    // Verify user is the property owner
    if (job.requestedBy !== userId) {
      throw new Error('Unauthorized access');
    }

    // Calculate confirmation deadline
    const confirmationDeadline = job.completedAt
      ? new Date(job.completedAt.getTime() + 2 * 24 * 60 * 60 * 1000)
      : null;

    const hoursRemaining = confirmationDeadline
      ? Math.max(0, Math.ceil((confirmationDeadline.getTime() - Date.now()) / (1000 * 60 * 60)))
      : null;

    return {
      job,
      confirmationDeadline,
      hoursRemaining,
      isExpired: confirmationDeadline ? new Date() > confirmationDeadline : false,
      completionImages: job.completionImages,
      boundaryData: job.boundaryData,
    };
  }

 