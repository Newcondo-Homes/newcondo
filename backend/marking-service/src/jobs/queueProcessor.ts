// backend/marking-service/src/jobs/queueProcessor.ts

import { PrismaClient, MarkingJobStatus } from '@prisma/client';
import { notificationService } from '../services/notificationService';
import { compensationService } from '../services/compensationService';

const prisma = new PrismaClient();

interface QueueItem {
  agentId: string;
  position: number;
  assignedAt: Date;
  timeSlotExpiry: Date;
}

class QueueProcessor {
  private processingJobs = new Set<string>();

  /**
   * Process queue assignments and move to next agent if current one expires
   */
  async processQueueAssignments(): Promise<void> {
    try {
      const now = new Date();

      // Find jobs with expired time slots that are still assigned
      const expiredJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.ASSIGNED,
          timeSlotExpiry: {
            lte: now,
          },
        },
        include: {
          assignedAgent: true,
          requestingUser: true,
          property: true,
        },
      });

      for (const job of expiredJobs) {
        if (this.processingJobs.has(job.id)) {
          continue; // Skip if already processing
        }

        this.processingJobs.add(job.id);

        try {
          await this.handleExpiredTimeSlot(job);
        } finally {
          this.processingJobs.delete(job.id);
        }
      }
    } catch (error) {
      console.error('Error processing queue assignments:', error);
      throw error;
    }
  }

  /**
   * Handle expired time slot - compensate agent and move to next in queue
   */
  private async handleExpiredTimeSlot(job: any): Promise<void> {
    try {
      // Pay small compensation to the agent who had the time slot
      if (job.assignedAgent) {
        await compensationService.processPartialCompensation({
          jobId: job.id,
          agentId: job.assignedAgent.id,
          reason: 'TIME_SLOT_EXPIRED',
          amount: 1000, // 1000 naira compensation
        });

        // Notify agent about expiration
        await notificationService.sendMarkingTimeSlotExpired({
          agentId: job.assignedAgent.id,
          jobId: job.id,
          propertyAddress: job.property.address,
          compensationAmount: 1000,
        });
      }

      // Get next agent in queue
      const nextAgent = await this.getNextAgentInQueue(job.id);

      if (nextAgent) {
        // Assign to next agent
        await this.assignToNextAgent(job.id, nextAgent);
      } else {
        // No more agents in queue - mark job as expired
        await prisma.propertyMarkingJob.update({
          where: { id: job.id },
          data: {
            status: MarkingJobStatus.EXPIRED,
          },
        });

        // Notify property owner
        await notificationService.sendMarkingJobExpired({
          userId: job.requestingUser.id,
          jobId: job.id,
          propertyAddress: job.property.address,
        });
      }
    } catch (error) {
      console.error(`Error handling expired time slot for job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Get next agent in queue for a marking job
   */
  private async getNextAgentInQueue(jobId: string): Promise<any | null> {
    // This would typically query a separate queue table
    // For now, we'll use a simplified approach
    // In production, implement a proper queue management system (Redis, Bull, etc.)
    
    // TODO: Implement proper queue system with Redis
    // This is a placeholder for the actual queue logic
    return null;
  }

  /**
   * Assign job to next agent in queue
   */
  private async assignToNextAgent(jobId: string, agent: any): Promise<void> {
    const timeSlotExpiry = new Date();
    timeSlotExpiry.setHours(timeSlotExpiry.getHours() + 3); // 3-hour time slot

    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        assignedAgentId: agent.id,
        status: MarkingJobStatus.ASSIGNED,
        assignedAt: new Date(),
        timeSlotExpiry,
        queuePosition: (agent.queuePosition || 0) + 1,
      },
    });

    // Notify newly assigned agent
    await notificationService.sendMarkingJobAssigned({
      agentId: agent.id,
      jobId,
      timeSlotExpiry,
    });
  }

  /**
   * Requeue failed marking job
   */
  async requeueMarkingJob(jobId: string): Promise<void> {
    try {
      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        include: {
          property: true,
        },
      });

      if (!job) {
        throw new Error('Marking job not found');
      }

      // Reset job status and broadcast to available agents
      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          status: MarkingJobStatus.QUEUED,
          assignedAgentId: null,
          assignedAt: null,
          timeSlotExpiry: null,
          queuePosition: null,
        },
      });

      // Broadcast job to available agents again
      // This would trigger the broadcast service
      console.log(`Marking job ${jobId} requeued for assignment`);
    } catch (error) {
      console.error(`Error requeueing marking job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Process queue priorities and reorder based on urgency
   */
  async processQueuePriorities(): Promise<void> {
    try {
      // Get all queued jobs
      const queuedJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.QUEUED,
        },
        orderBy: [
          { urgencyLevel: 'desc' },
          { createdAt: 'asc' },
        ],
      });

      // Update queue positions
      for (let i = 0; i < queuedJobs.length; i++) {
        await prisma.propertyMarkingJob.update({
          where: { id: queuedJobs[i].id },
          data: { queuePosition: i + 1 },
        });
      }
    } catch (error) {
      console.error('Error processing queue priorities:', error);
      throw error;
    }
  }

  /**
   * Clean up stale queue entries
   */
  async cleanupStaleQueueEntries(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean up old completed or cancelled jobs
      await prisma.propertyMarkingJob.deleteMany({
        where: {
          status: {
            in: [MarkingJobStatus.COMPLETED, MarkingJobStatus.CANCELLED],
          },
          updatedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      console.log('Stale queue entries cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up stale queue entries:', error);
      throw error;
    }
  }
}

export const queueProcessor = new QueueProcessor();