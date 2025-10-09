// backend/marking-service/src/jobs/timeSlotMonitor.ts

import { PrismaClient, MarkingJobStatus } from '@prisma/client';
import { notificationService } from '../services/notificationService';
import { queueProcessor } from './queueProcessor';

const prisma = new PrismaClient();

interface TimeSlotWarning {
  jobId: string;
  agentId: string;
  remainingMinutes: number;
}

class TimeSlotMonitor {
  private readonly WARNING_THRESHOLD_MINUTES = 30; // Warn 30 minutes before expiry
  private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring time slots
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('Time slot monitoring already running');
      return;
    }

    console.log('Starting time slot monitoring...');
    
    // Run immediately
    this.monitorTimeSlots();

    // Then run at intervals
    this.monitoringInterval = setInterval(() => {
      this.monitorTimeSlots();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop monitoring time slots
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Time slot monitoring stopped');
    }
  }

  /**
   * Monitor all active time slots
   */
  async monitorTimeSlots(): Promise<void> {
    try {
      const now = new Date();

      // Get all assigned jobs with time slots
      const assignedJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.ASSIGNED,
          timeSlotExpiry: {
            not: null,
          },
        },
        include: {
          assignedAgent: true,
          property: true,
        },
      });

      const expiringJobs: TimeSlotWarning[] = [];
      const expiredJobs: string[] = [];

      for (const job of assignedJobs) {
        if (!job.timeSlotExpiry || !job.assignedAgent) continue;

        const timeRemaining = job.timeSlotExpiry.getTime() - now.getTime();
        const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

        if (minutesRemaining <= 0) {
          // Time slot expired
          expiredJobs.push(job.id);
        } else if (minutesRemaining <= this.WARNING_THRESHOLD_MINUTES) {
          // Time slot expiring soon
          expiringJobs.push({
            jobId: job.id,
            agentId: job.assignedAgent.id,
            remainingMinutes: minutesRemaining,
          });
        }
      }

      // Send warnings for expiring time slots
      await this.handleExpiringTimeSlots(expiringJobs);

      // Process expired time slots
      await this.handleExpiredTimeSlots(expiredJobs);

      console.log(`Time slot monitoring complete: ${expiringJobs.length} warnings, ${expiredJobs.length} expired`);
    } catch (error) {
      console.error('Error monitoring time slots:', error);
    }
  }

  /**
   * Handle time slots that are about to expire
   */
  private async handleExpiringTimeSlots(warnings: TimeSlotWarning[]): Promise<void> {
    for (const warning of warnings) {
      try {
        await notificationService.sendMarkingTimeSlotWarning({
          agentId: warning.agentId,
          jobId: warning.jobId,
          remainingMinutes: warning.remainingMinutes,
        });
      } catch (error) {
        console.error(`Error sending warning for job ${warning.jobId}:`, error);
      }
    }
  }

  /**
   * Handle expired time slots
   */
  private async handleExpiredTimeSlots(jobIds: string[]): Promise<void> {
    for (const jobId of jobIds) {
      try {
        // Queue processor will handle compensation and reassignment
        await queueProcessor.processQueueAssignments();
      } catch (error) {
        console.error(`Error handling expired time slot for job ${jobId}:`, error);
      }
    }
  }

  /**
   * Get time slot status for a specific job
   */
  async getTimeSlotStatus(jobId: string): Promise<{
    status: 'ACTIVE' | 'WARNING' | 'EXPIRED' | 'NO_SLOT';
    remainingMinutes?: number;
    expiryTime?: Date;
  }> {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        timeSlotExpiry: true,
        status: true,
      },
    });

    if (!job || !job.timeSlotExpiry) {
      return { status: 'NO_SLOT' };
    }

    const now = new Date();
    const timeRemaining = job.timeSlotExpiry.getTime() - now.getTime();
    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

    if (minutesRemaining <= 0) {
      return {
        status: 'EXPIRED',
        remainingMinutes: 0,
        expiryTime: job.timeSlotExpiry,
      };
    }

    if (minutesRemaining <= this.WARNING_THRESHOLD_MINUTES) {
      return {
        status: 'WARNING',
        remainingMinutes,
        expiryTime: job.timeSlotExpiry,
      };
    }

    return {
      status: 'ACTIVE',
      remainingMinutes,
      expiryTime: job.timeSlotExpiry,
    };
  }

  /**
   * Extend time slot for a marking job (admin override)
   */
  async extendTimeSlot(jobId: string, additionalHours: number): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
      });

      if (!job || !job.timeSlotExpiry) {
        throw new Error('Job not found or has no time slot');
      }

      const newExpiry = new Date(job.timeSlotExpiry);
      newExpiry.setHours(newExpiry.getHours() + additionalHours);

      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: { timeSlotExpiry: newExpiry },
      });

      // Notify agent
      if (job.assignedAgentId) {
        await notificationService.sendMarkingTimeSlotExtended({
          agentId: job.assignedAgentId,
          jobId,
          newExpiryTime: newExpiry,
          additionalHours,
        });
      }
    } catch (error) {
      console.error(`Error extending time slot for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get statistics about time slot usage
   */
  async getTimeSlotStatistics(): Promise<{
    activeSlots: number;
    expiringSlots: number;
    expiredSlots: number;
    averageCompletionTime: number;
  }> {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + this.WARNING_THRESHOLD_MINUTES * 60 * 1000);

    const [active, expiring, expired, completed] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: {
          status: MarkingJobStatus.ASSIGNED,
          timeSlotExpiry: { gt: warningThreshold },
        },
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: MarkingJobStatus.ASSIGNED,
          timeSlotExpiry: { lte: warningThreshold, gt: now },
        },
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: MarkingJobStatus.ASSIGNED,
          timeSlotExpiry: { lte: now },
        },
      }),
      prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.COMPLETED,
          assignedAt: { not: null },
          completedAt: { not: null },
        },
        select: {
          assignedAt: true,
          completedAt: true,
        },
        take: 100, // Last 100 completed jobs
      }),
    ]);

    // Calculate average completion time
    let avgCompletionTime = 0;
    if (completed.length > 0) {
      const totalTime = completed.reduce((sum, job) => {
        if (job.assignedAt && job.completedAt) {
          return sum + (job.completedAt.getTime() - job.assignedAt.getTime());
        }
        return sum;
      }, 0);
      avgCompletionTime = Math.floor(totalTime / completed.length / (1000 * 60)); // in minutes
    }

    return {
      activeSlots: active,
      expiringSlots: expiring,
      expiredSlots: expired,
      averageCompletionTime: avgCompletionTime,
    };
  }
}

export const timeSlotMonitor = new TimeSlotMonitor();