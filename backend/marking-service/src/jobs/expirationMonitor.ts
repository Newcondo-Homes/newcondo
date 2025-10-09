// backend/marking-service/src/jobs/expirationMonitor.ts

import { PrismaClient, MarkingJobStatus } from '@prisma/client';
import { notificationService } from '../services/notificationService';
import { compensationService } from '../services/compensationService';

const prisma = new PrismaClient();

interface VerificationWindow {
  jobId: string;
  propertyOwnerId: string;
  agentId: string;
  markedAt: Date;
  verificationDeadline: Date;
  daysRemaining: number;
}

class ExpirationMonitor {
  private readonly VERIFICATION_WINDOW_DAYS = 3; // 2-3 days window
  private readonly WARNING_THRESHOLD_HOURS = 24; // Warn 24 hours before expiry
  private readonly CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring verification windows
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('Expiration monitoring already running');
      return;
    }

    console.log('Starting verification window monitoring...');
    
    // Run immediately
    this.monitorVerificationWindows();

    // Then run at intervals
    this.monitoringInterval = setInterval(() => {
      this.monitorVerificationWindows();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop monitoring verification windows
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Expiration monitoring stopped');
    }
  }

  /**
   * Monitor all verification windows
   */
  async monitorVerificationWindows(): Promise<void> {
    try {
      const now = new Date();

      // Get all completed jobs awaiting verification
      const pendingVerificationJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.COMPLETED,
          completedAt: { not: null },
          maxCompletionTime: { not: null },
        },
        include: {
          requestingUser: true,
          assignedAgent: true,
          property: true,
        },
      });

      const expiringWindows: VerificationWindow[] = [];
      const expiredWindows: string[] = [];

      for (const job of pendingVerificationJobs) {
        if (!job.completedAt || !job.maxCompletionTime || !job.assignedAgent) continue;

        const timeRemaining = job.maxCompletionTime.getTime() - now.getTime();
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
        const daysRemaining = Math.floor(hoursRemaining / 24);

        if (hoursRemaining <= 0) {
          // Verification window expired
          expiredWindows.push(job.id);
        } else if (hoursRemaining <= this.WARNING_THRESHOLD_HOURS) {
          // Window expiring soon
          expiringWindows.push({
            jobId: job.id,
            propertyOwnerId: job.requestingUser.id,
            agentId: job.assignedAgent.id,
            markedAt: job.completedAt,
            verificationDeadline: job.maxCompletionTime,
            daysRemaining,
          });
        }
      }

      // Send warnings for expiring windows
      await this.handleExpiringWindows(expiringWindows);

      // Process expired windows
      await this.handleExpiredWindows(expiredWindows);

      console.log(`Verification monitoring complete: ${expiringWindows.length} warnings, ${expiredWindows.length} expired`);
    } catch (error) {
      console.error('Error monitoring verification windows:', error);
    }
  }

  /**
   * Handle verification windows that are about to expire
   */
  private async handleExpiringWindows(windows: VerificationWindow[]): Promise<void> {
    for (const window of windows) {
      try {
        // Notify property owner
        await notificationService.sendVerificationWindowExpiring({
          userId: window.propertyOwnerId,
          jobId: window.jobId,
          hoursRemaining: Math.floor(
            (window.verificationDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60)
          ),
        });
      } catch (error) {
        console.error(`Error sending expiration warning for job ${window.jobId}:`, error);
      }
    }
  }

  /**
   * Handle expired verification windows
   */
  private async handleExpiredWindows(jobIds: string[]): Promise<void> {
    for (const jobId of jobIds) {
      try {
        const job = await prisma.propertyMarkingJob.findUnique({
          where: { id: jobId },
          include: {
            assignedAgent: true,
            requestingUser: true,
            property: true,
          },
        });

        if (!job || !job.assignedAgent) continue;

        // Calculate partial compensation
        const totalFee = Number(job.markingFee);
        const compensationAmount = this.calculatePartialCompensation(totalFee);

        // Pay partial compensation to agent
        await compensationService.processPartialCompensation({
          jobId: job.id,
          agentId: job.assignedAgent.id,
          reason: 'VERIFICATION_WINDOW_EXPIRED',
          amount: compensationAmount,
        });

        // Update job status
        await prisma.propertyMarkingJob.update({
          where: { id: jobId },
          data: {
            status: MarkingJobStatus.EXPIRED,
          },
        });

        // Notify both parties
        await notificationService.sendVerificationWindowExpired({
          ownerId: job.requestingUser.id,
          agentId: job.assignedAgent.id,
          jobId: job.id,
          agentCompensation: compensationAmount,
        });

        // Check if full fee has been paid out
        const totalCompensationPaid = await this.getTotalCompensationPaid(jobId);
        
        if (totalCompensationPaid >= totalFee) {
          // Full fee exhausted - owner needs to create new job
          await notificationService.sendMarkingFeeExhausted({
            userId: job.requestingUser.id,
            jobId: job.id,
            propertyId: job.property.id,
            totalPaid: totalCompensationPaid,
          });
        }
      } catch (error) {
        console.error(`Error handling expired window for job ${jobId}:`, error);
      }
    }
  }

  /**
   * Calculate partial compensation based on total fee
   */
  private calculatePartialCompensation(totalFee: number): number {
    // Agent gets 25% of 20,000 = 5,000 naira
    // Partial compensation could be 1,000 naira per expiration
    // This can be adjusted based on business logic
    const fullAgentFee = totalFee * 0.25;
    const partialCompensation = Math.min(1000, fullAgentFee);
    return partialCompensation;
  }

  /**
   * Get total compensation paid for a job
   */
  private async getTotalCompensationPaid(jobId: string): Promise<number> {
    // This would query a compensation/payment ledger
    // For now, returning a placeholder
    // TODO: Implement proper compensation tracking
    return 0;
  }

  /**
   * Manually extend verification window (admin action)
   */
  async extendVerificationWindow(jobId: string, additionalDays: number): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        include: {
          requestingUser: true,
          assignedAgent: true,
        },
      });

      if (!job || !job.maxCompletionTime) {
        throw new Error('Job not found or has no verification deadline');
      }

      const newDeadline = new Date(job.maxCompletionTime);
      newDeadline.setDate(newDeadline.getDate() + additionalDays);

      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: { maxCompletionTime: newDeadline },
      });

      // Notify property owner
      if (job.requestingUser) {
        await notificationService.sendVerificationWindowExtended({
          userId: job.requestingUser.id,
          jobId,
          newDeadline,
          additionalDays,
        });
      }
    } catch (error) {
      console.error(`Error extending verification window for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get verification status for a job
   */
  async getVerificationStatus(jobId: string): Promise<{
    status: 'PENDING' | 'WARNING' | 'EXPIRED' | 'VERIFIED';
    hoursRemaining?: number;
    deadline?: Date;
  }> {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        status: true,
        completedAt: true,
        maxCompletionTime: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== MarkingJobStatus.COMPLETED || !job.maxCompletionTime) {
      return { status: 'PENDING' };
    }

    const now = new Date();
    const timeRemaining = job.maxCompletionTime.getTime() - now.getTime();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

    if (hoursRemaining <= 0) {
      return {
        status: 'EXPIRED',
        hoursRemaining: 0,
        deadline: job.maxCompletionTime,
      };
    }

    if (hoursRemaining <= this.WARNING_THRESHOLD_HOURS) {
      return {
        status: 'WARNING',
        hoursRemaining,
        deadline: job.maxCompletionTime,
      };
    }

    return {
      status: 'PENDING',
      hoursRemaining,
      deadline: job.maxCompletionTime,
    };
  }

  /**
   * Get statistics about verification windows
   */
  async getVerificationStatistics(): Promise<{
    pendingVerification: number;
    expiringWithin24Hours: number;
    expiredUnverified: number;
    averageVerificationTime: number;
  }> {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [pending, expiring, expired, verified] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: {
          status: MarkingJobStatus.COMPLETED,
          maxCompletionTime: { gt: twentyFourHoursFromNow },
        },
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: MarkingJobStatus.COMPLETED,
          maxCompletionTime: { lte: twentyFourHoursFromNow, gt: now },
        },
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: MarkingJobStatus.EXPIRED,
        },
      }),
      prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.COMPLETED,
          completedAt: { not: null },
        },
        select: {
          completedAt: true,
          updatedAt: true,
        },
        take: 100,
      }),
    ]);

    // Calculate average verification time
    let avgVerificationTime = 0;
    if (verified.length > 0) {
      const totalTime = verified.reduce((sum, job) => {
        if (job.completedAt) {
          return sum + (job.updatedAt.getTime() - job.completedAt.getTime());
        }
        return sum;
      }, 0);
      avgVerificationTime = Math.floor(totalTime / verified.length / (1000 * 60 * 60)); // in hours
    }

    return {
      pendingVerification: pending,
      expiringWithin24Hours: expiring,
      expiredUnverified: expired,
      averageVerificationTime: avgVerificationTime,
    };
  }
}

export const expirationMonitor = new ExpirationMonitor();