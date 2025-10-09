// backend/marking-service/src/services/expirationService.ts

import { PrismaClient, MarkingJobStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface ExpirationConfig {
  confirmationWindow: number; // hours for owner confirmation (48-72 hours)
  timeSlotDuration: number; // hours for agent time slot (3 hours)
  maxJobDuration: number; // hours for complete job (72 hours from request)
  compensationIncrement: number; // naira amount per missed confirmation
}

const DEFAULT_CONFIG: ExpirationConfig = {
  confirmationWindow: 60, // 2.5 days in hours
  timeSlotDuration: 3, // 3 hours
  maxJobDuration: 72, // 3 days
  compensationIncrement: 1000, // 1000 naira per missed confirmation
};

interface ExpirationResult {
  expired: boolean;
  reason?: string;
  action: 'cancel' | 'compensate' | 'reassign' | 'complete' | 'none';
  compensationAmount?: number;
  nextSteps?: string;
}

export class ExpirationService {
  private config: ExpirationConfig;

  constructor(config?: Partial<ExpirationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a marking job has expired based on various timeframes
   */
  async checkJobExpiration(jobId: string): Promise<ExpirationResult> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        include: {
          property: true,
          assignedAgent: true,
        },
      });

      if (!job) {
        throw new Error('Marking job not found');
      }

      const now = new Date();
      const createdAt = new Date(job.createdAt);

      // Check time slot expiration (for assigned jobs)
      if (job.status === MarkingJobStatus.ASSIGNED && job.timeSlotExpiry) {
        const timeSlotExpiry = new Date(job.timeSlotExpiry);
        if (now > timeSlotExpiry) {
          return {
            expired: true,
            reason: 'Agent time slot expired',
            action: 'reassign',
            nextSteps: 'Reassign to next agent in queue',
          };
        }
      }

      // Check confirmation window expiration (for completed jobs)
      if (job.status === MarkingJobStatus.COMPLETED && job.completedAt) {
        const completedAt = new Date(job.completedAt);
        const confirmationDeadline = new Date(
          completedAt.getTime() + this.config.confirmationWindow * 60 * 60 * 1000
        );

        if (now > confirmationDeadline) {
          return await this.handleConfirmationExpiration(job);
        }
      }

      // Check maximum job duration
      const maxDuration = new Date(
        createdAt.getTime() + this.config.maxJobDuration * 60 * 60 * 1000
      );

      if (now > maxDuration && job.status !== MarkingJobStatus.COMPLETED) {
        return {
          expired: true,
          reason: 'Maximum job duration exceeded',
          action: 'cancel',
          nextSteps: 'Job cancelled, refund owner minus processing fee',
        };
      }

      return {
        expired: false,
        action: 'none',
      };
    } catch (error) {
      console.error('Error checking job expiration:', error);
      throw new Error('Failed to check job expiration');
    }
  }

  /**
   * Handle confirmation window expiration with incremental compensation
   */
  private async handleConfirmationExpiration(job: any): Promise<ExpirationResult> {
    try {
      const completedAt = new Date(job.completedAt);
      const now = new Date();
      const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

      // Calculate how many confirmation windows have passed
      const windowsPassed = Math.floor(hoursSinceCompletion / this.config.confirmationWindow);

      // Calculate compensation for the agent
      const baseCompensation = job.markingFee * 0.25; // 25% of marking fee
      const incrementalCompensation = windowsPassed * this.config.compensationIncrement;
      const totalCompensation = Math.min(
        baseCompensation + incrementalCompensation,
        Number(job.markingFee) // Cap at full marking fee
      );

      // Check if full fee has been compensated
      if (totalCompensation >= Number(job.markingFee)) {
        return {
          expired: true,
          reason: 'Owner never confirmed - full fee paid to agent',
          action: 'complete',
          compensationAmount: Number(job.markingFee),
          nextSteps: 'Close job, agent compensated fully. Owner must create new marking job.',
        };
      }

      return {
        expired: true,
        reason: `Owner confirmation window ${windowsPassed} expired`,
        action: 'compensate',
        compensationAmount: this.config.compensationIncrement,
        nextSteps: `Pay agent ${this.config.compensationIncrement} NGN. Wait for next confirmation window.`,
      };
    } catch (error) {
      console.error('Error handling confirmation expiration:', error);
      throw error;
    }
  }

  /**
   * Process expired time slots in bulk
   */
  async processExpiredTimeSlots(): Promise<number> {
    try {
      const now = new Date();

      // Find all jobs with expired time slots
      const expiredJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.ASSIGNED,
          timeSlotExpiry: {
            lt: now,
          },
        },
      });

      let processedCount = 0;

      for (const job of expiredJobs) {
        try {
          // Reassign to next agent in queue
          await this.reassignToNextAgent(job.id);
          processedCount++;
        } catch (error) {
          console.error(`Failed to process expired job ${job.id}:`, error);
        }
      }

      return processedCount;
    } catch (error) {
      console.error('Error processing expired time slots:', error);
      throw new Error('Failed to process expired time slots');
    }
  }

  /**
   * Reassign job to next agent in queue
   */
  private async reassignToNextAgent(jobId: string): Promise<void> {
    try {
      // Update job status back to QUEUED
      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          status: MarkingJobStatus.QUEUED,
          assignedAgentId: null,
          assignedAt: null,
          timeSlotExpiry: null,
        },
      });

      // TODO: Trigger notification service to alert next agent in queue
      // This would integrate with the queue management system
    } catch (error) {
      console.error('Error reassigning to next agent:', error);
      throw error;
    }
  }

  /**
   * Process confirmation window expirations in bulk
   */
  async processConfirmationExpirations(): Promise<{
    processed: number;
    compensated: number;
    completed: number;
  }> {
    try {
      const now = new Date();
      const confirmationDeadline = new Date(
        now.getTime() - this.config.confirmationWindow * 60 * 60 * 1000
      );

      // Find completed jobs awaiting confirmation past deadline
      const expiredJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.COMPLETED,
          completedAt: {
            lt: confirmationDeadline,
          },
        },
        include: {
          assignedAgent: true,
        },
      });

      let processed = 0;
      let compensated = 0;
      let completed = 0;

      for (const job of expiredJobs) {
        try {
          const result = await this.handleConfirmationExpiration(job);

          if (result.action === 'compensate') {
            await this.compensateAgent(job.id, result.compensationAmount!);
            compensated++;
          } else if (result.action === 'complete') {
            await this.finalizeJobWithFullCompensation(job.id);
            completed++;
          }

          processed++;
        } catch (error) {
          console.error(`Failed to process confirmation expiration for job ${job.id}:`, error);
        }
      }

      return { processed, compensated, completed };
    } catch (error) {
      console.error('Error processing confirmation expirations:', error);
      throw new Error('Failed to process confirmation expirations');
    }
  }

  /**
   * Compensate agent with incremental payment
   */
  private async compensateAgent(jobId: string, amount: number): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        include: { assignedAgent: true },
      });

      if (!job || !job.assignedAgentId) {
        throw new Error('Job or agent not found');
      }

      // Get or create agent's virtual account
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: {
          userId: job.assignedAgentId,
          propertyId: null,
        },
      });

      if (!virtualAccount) {
        throw new Error('Agent virtual account not found');
      }

      // Update virtual account balance
      await prisma.virtualAccount.update({
        where: { id: virtualAccount.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // TODO: Create payment record and send notification
    } catch (error) {
      console.error('Error compensating agent:', error);
      throw error;
    }
  }

  /**
   * Finalize job with full compensation to agent
   */
  private async finalizeJobWithFullCompensation(jobId: string): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        include: { assignedAgent: true },
      });

      if (!job || !job.assignedAgentId) {
        throw new Error('Job or agent not found');
      }

      // Pay remaining compensation to agent
      const fullFee = Number(job.markingFee);
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: {
          userId: job.assignedAgentId,
          propertyId: null,
        },
      });

      if (virtualAccount) {
        const currentBalance = Number(virtualAccount.balance);
        const remainingAmount = fullFee - currentBalance;

        if (remainingAmount > 0) {
          await prisma.virtualAccount.update({
            where: { id: virtualAccount.id },
            data: {
              balance: {
                increment: remainingAmount,
              },
            },
          });
        }
      }

      // Update job status
      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          status: MarkingJobStatus.COMPLETED,
          // Add metadata indicating auto-completion
        },
      });

      // TODO: Send notifications to both owner and agent
    } catch (error) {
      console.error('Error finalizing job:', error);
      throw error;
    }
  }

  /**
   * Cancel expired jobs
   */
  async cancelExpiredJobs(): Promise<number> {
    try {
      const now = new Date();
      const maxDuration = new Date(
        now.getTime() - this.config.maxJobDuration * 60 * 60 * 1000
      );

      // Find jobs that exceeded max duration
      const expiredJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          createdAt: {
            lt: maxDuration,
          },
          status: {
            notIn: [MarkingJobStatus.COMPLETED, MarkingJobStatus.CANCELLED],
          },
        },
      });

      let cancelledCount = 0;

      for (const job of expiredJobs) {
        try {
          await prisma.propertyMarkingJob.update({
            where: { id: job.id },
            data: {
              status: MarkingJobStatus.CANCELLED,
            },
          });

          // TODO: Process refund (minus processing fee)
          // TODO: Send notification to owner

          cancelledCount++;
        } catch (error) {
          console.error(`Failed to cancel job ${job.id}:`, error);
        }
      }

      return cancelledCount;
    } catch (error) {
      console.error('Error cancelling expired jobs:', error);
      throw new Error('Failed to cancel expired jobs');
    }
  }

  /**
   * Get expiration status for a job
   */
  async getExpirationStatus(jobId: string): Promise<{
    timeSlotRemaining?: number;
    confirmationWindowRemaining?: number;
    maxDurationRemaining?: number;
    isExpired: boolean;
  }> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      const now = new Date();
      const createdAt = new Date(job.createdAt);

      const status: any = { isExpired: false };

      // Calculate time slot remaining
      if (job.timeSlotExpiry) {
        const timeSlotExpiry = new Date(job.timeSlotExpiry);
        const remainingMs = timeSlotExpiry.getTime() - now.getTime();
        status.timeSlotRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60))); // in minutes
        status.isExpired = status.isExpired || remainingMs <= 0;
      }

      // Calculate confirmation window remaining
      if (job.completedAt) {
        const completedAt = new Date(job.completedAt);
        const confirmationDeadline = new Date(
          completedAt.getTime() + this.config.confirmationWindow * 60 * 60 * 1000
        );
        const remainingMs = confirmationDeadline.getTime() - now.getTime();
        status.confirmationWindowRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60))); // in hours
      }

      // Calculate max duration remaining
      const maxDurationDeadline = new Date(
        createdAt.getTime() + this.config.maxJobDuration * 60 * 60 * 1000
      );
      const remainingMs = maxDurationDeadline.getTime() - now.getTime();
      status.maxDurationRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60))); // in hours
      status.isExpired = status.isExpired || remainingMs <= 0;

      return status;
    } catch (error) {
      console.error('Error getting expiration status:', error);
      throw new Error('Failed to get expiration status');
    }
  }
}

export default new ExpirationService();