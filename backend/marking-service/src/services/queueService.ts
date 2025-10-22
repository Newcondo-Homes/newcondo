// backend/marking-service/src/services/queueService.ts

import { PrismaClient, MarkingJobStatus, UrgencyLevel } from '@newcondo/db';

const prisma = new PrismaClient();

export class QueueService {
  async addToQueue(jobId: string): Promise<void> {
    // Queue is automatically managed by the database queuePosition field
    // This method can be used for additional queue management logic
    console.log(`Job ${jobId} added to queue`);
  }

  async getQueuedJobs(): Promise<any[]> {
    return await prisma.propertyMarkingJob.findMany({
      where: { status: MarkingJobStatus.QUEUED },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
        requestingUser: true,
      },
      orderBy: [
        { urgencyLevel: 'desc' },
        { queuePosition: 'asc' },
      ],
    });
  }

  async updateQueuePositions(): Promise<void> {
    const queuedJobs = await prisma.propertyMarkingJob.findMany({
      where: { status: MarkingJobStatus.QUEUED },
      orderBy: [
        { urgencyLevel: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    for (let i = 0; i < queuedJobs.length; i++) {
      await prisma.propertyMarkingJob.update({
        where: { id: queuedJobs[i].id },
        data: { queuePosition: i + 1 },
      });
    }
  }

  async removeFromQueue(jobId: string): Promise<void> {
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: { queuePosition: null },
    });

    // Reorder remaining jobs
    await this.updateQueuePositions();
  }

  async getQueueStats(): Promise<{
    totalQueued: number;
    totalInProgress: number;
    totalCompleted: number;
    averageWaitTime: number;
  }> {
    const [queued, inProgress, completed] = await Promise.all([
      prisma.propertyMarkingJob.count({ where: { status: MarkingJobStatus.QUEUED } }),
      prisma.propertyMarkingJob.count({ where: { status: MarkingJobStatus.IN_PROGRESS } }),
      prisma.propertyMarkingJob.count({ where: { status: MarkingJobStatus.COMPLETED } }),
    ]);

    // Calculate average wait time
    const completedJobs = await prisma.propertyMarkingJob.findMany({
      where: { 
        status: MarkingJobStatus.COMPLETED,
        assignedAt: { not: null },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      },
      select: {
        createdAt: true,
        assignedAt: true,
      },
    });

    const totalWaitTime = completedJobs.reduce((sum, job) => {
      if (job.assignedAt) {
        return sum + (job.assignedAt.getTime() - job.createdAt.getTime());
      }
      return sum;
    }, 0);

    const averageWaitTime = completedJobs.length > 0 ? totalWaitTime / completedJobs.length : 0;

    return {
      totalQueued: queued,
      totalInProgress: inProgress,
      totalCompleted: completed,
      averageWaitTime: Math.round(averageWaitTime / (1000 * 60 * 60)), // Convert to hours
    };
  }
}


// // backend/marking-service/src/services/queueService.ts

// import { PrismaClient, MarkingJobStatus } from '@newcondo/db';
// import { AppError } from '../../../shared/src/utils/response';
// import { logger } from '../../../shared/src/middleware/logger';

// interface QueuePosition {
//   jobId: string;
//   position: number;
//   assignedAt: Date | null;
//   estimatedWaitTime: number; // in minutes
// }

// class QueueService {
//   private prisma: PrismaClient;
//   private readonly AVERAGE_JOB_TIME = 60; // 60 minutes per job on average

//   constructor(prisma: PrismaClient) {
//     this.prisma = prisma;
//   }

//   /**
//    * Add a job to the queue (FIFO)
//    */
//   async enqueueJob(jobId: string, propertyId: string) {
//     try {
//       // Get current highest queue position
//       const lastQueuedJob = await this.prisma.propertyMarkingJob.findFirst({
//         where: {
//           status: { in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED] },
//         },
//         orderBy: { queuePosition: 'desc' },
//       });

//       const nextPosition = (lastQueuedJob?.queuePosition || 0) + 1;

//       // Update job with queue position
//       const updatedJob = await this.prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           queuePosition: nextPosition,
//           status: MarkingJobStatus.QUEUED,
//         },
//       });

//       logger.info('Job enqueued', {
//         jobId,
//         queuePosition: nextPosition,
//         propertyId,
//       });

//       return {
//         jobId,
//         queuePosition: nextPosition,
//       };
//     } catch (error) {
//       logger.error('Error enqueuing job', { error, jobId });
//       throw error;
//     }
//   }

//   /**
//    * Get queue position for a specific job
//    */
//   async getQueuePosition(jobId: string): Promise<QueuePosition> {
//     try {
//       const job = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//       });

//       if (!job || !job.queuePosition) {
//         throw new AppError('Job not found in queue', 404);
//       }

//       // Calculate jobs ahead in queue
//       const jobsAhead = await this.prisma.propertyMarkingJob.count({
//         where: {
//           queuePosition: { lt: job.queuePosition },
//           status: { in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED] },
//         },
//       });

//       const estimatedWaitTime = jobsAhead * this.AVERAGE_JOB_TIME;

//       return {
//         jobId,
//         position: job.queuePosition,
//         assignedAt: job.assignedAt,
//         estimatedWaitTime,
//       };
//     } catch (error) {
//       logger.error('Error getting queue position', { error, jobId });
//       throw error;
//     }
//   }

//   /**
//    * Get next job in queue (FIFO)
//    */
//   async getNextJobInQueue(agentId?: string) {
//     try {
//       const nextJob = await this.prisma.propertyMarkingJob.findFirst({
//         where: {
//           status: MarkingJobStatus.QUEUED,
//         },
//         orderBy: { queuePosition: 'asc' },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               gpsCoordinates: true,
//             },
//           },
//           requestingUser: {
//             select: {
//               name: true,
//               phone: true,
//               email: true,
//             },
//           },
//         },
//       });

//       if (!nextJob) {
//         return null;
//       }

//       logger.info('Retrieved next job from queue', {
//         jobId: nextJob.id,
//         agentId: agentId || 'system',
//       });

//       return nextJob;
//     } catch (error) {
//       logger.error('Error getting next job in queue', { error, agentId });
//       throw error;
//     }
//   }

//   /**
//    * Remove job from queue (when assigned or completed)
//    */
//   async dequeueJob(jobId: string) {
//     try {
//       const job = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//       });

//       if (!job) {
//         throw new AppError('Job not found', 404);
//       }

//       const currentPosition = job.queuePosition;

//       // Update job: remove from queue
//       await this.prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: { queuePosition: null },
//       });

//       // Shift all jobs after this position down by 1
//       if (currentPosition) {
//         await this.prisma.propertyMarkingJob.updateMany({
//           where: {
//             queuePosition: { gt: currentPosition },
//             status: { in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED] },
//           },
//           data: {
//             queuePosition: {
//               decrement: 1,
//             },
//           },
//         });
//       }

//       logger.info('Job dequeued and queue shifted', {
//         jobId,
//         previousPosition: currentPosition,
//       });

//       return { success: true };
//     } catch (error) {
//       logger.error('Error dequeuing job', { error, jobId });
//       throw error;
//     }
//   }

//   /**
//    * Get entire queue for monitoring
//    */
//   async getQueueList(limit = 50, offset = 0) {
//     try {
//       const queuedJobs = await this.prisma.propertyMarkingJob.findMany({
//         where: {
//           status: { in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED] },
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//             },
//           },
//           requestingUser: {
//             select: {
//               name: true,
//             },
//           },
//           assignedAgent: {
//             select: {
//               name: true,
//               id: true,
//             },
//           },
//         },
//         orderBy: { queuePosition: 'asc' },
//         take: limit,
//         skip: offset,
//       });

//       const total = await this.prisma.propertyMarkingJob.count({
//         where: {
//           status: { in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED] },
//         },
//       });

//       return {
//         queue: queuedJobs,
//         total,
//         limit,
//         offset,
//       };
//     } catch (error) {
//       logger.error('Error fetching queue list', { error });
//       throw error;
//     }
//   }

//   /**
//    * Get queue statistics
//    */
//   async getQueueStats() {
//     try {
//       const totalQueued = await this.prisma.propertyMarkingJob.count({
//         where: { status: MarkingJobStatus.QUEUED },
//       });

//       const totalAssigned = await this.prisma.propertyMarkingJob.count({
//         where: { status: MarkingJobStatus.ASSIGNED },
//       });

//       const totalInProgress = await this.prisma.propertyMarkingJob.count({
//         where: { status: MarkingJobStatus.IN_PROGRESS },
//       });

//       const avgWaitTime = totalQueued > 0 
//         ? (totalQueued * this.AVERAGE_JOB_TIME) / 2
//         : 0;

//       return {
//         totalQueued,
//         totalAssigned,
//         totalInProgress,
//         estimatedAverageWaitTime: Math.round(avgWaitTime),
//         queueHealthy: totalQueued < 100, // flag if queue is getting too large
//       };
//     } catch (error) {
//       logger.error('Error fetching queue stats', { error });
//       throw error;
//     }
//   }

//   /**
//    * Reorder queue based on urgency (admin function)
//    */
//   async prioritizeJob(jobId: string) {
//     try {
//       const job = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//       });

//       if (!job || !job.queuePosition) {
//         throw new AppError('Job not found in queue', 404);
//       }

//       // Move job to position 2 (after current position 1)
//       const currentPos = job.queuePosition;

//       // Shift jobs from position 2 to current position down
//       await this.prisma.propertyMarkingJob.updateMany({
//         where: {
//           queuePosition: { gte: 2, lt: currentPos },
//         },
//         data: {
//           queuePosition: {
//             increment: 1,
//           },
//         },
//       });

//       // Update the prioritized job to position 2
//       await this.prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: { queuePosition: 2 },
//       });

//       logger.info('Job prioritized', {
//         jobId,
//         previousPosition: currentPos,
//         newPosition: 2,
//       });

//       return { success: true, newPosition: 2 };
//     } catch (error) {
//       logger.error('Error prioritizing job', { error, jobId });
//       throw error;
//     }
//   }
// }

// export default QueueService;












// // backend/marking-service/src/services/queueService.ts
// import { PrismaClient } from '@newcondo/db';
// import { MarkingJobStatus } from '@newcondo/db';
// import { logger } from '../middleware/logger';
// import { AppError } from '../middleware/errorHandler';

// interface QueuePosition {
//   jobId: string;
//   position: number;
//   assignedAgentId?: string;
//   timeSlotExpiry?: Date;
//   status: MarkingJobStatus;
// }

// export class QueueService {
//   constructor(private prisma: PrismaClient) {}

//   /**
//    * Add job to queue - returns queue position
//    */
//   async enqueueMarkingJob(jobId: string): Promise<QueuePosition> {
//     try {
//       const job = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//       });

//       if (!job) {
//         throw new AppError('Marking job not found', 404);
//       }

//       if (job.status !== MarkingJobStatus.QUEUED) {
//         throw new AppError(`Job must be in QUEUED status to enqueue, current status: ${job.status}`, 409);
//       }

//       // Get current queue length for this urgency level
//       const queueCount = await this.prisma.propertyMarkingJob.count({
//         where: {
//           status: MarkingJobStatus.QUEUED,
//           urgencyLevel: job.urgencyLevel,
//         },
//       });

//       const position = queueCount + 1;

//       // Update job with queue position
//       await this.prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           queuePosition: position,
//         },
//       });

//       logger.info(`Job ${jobId} added to queue at position ${position}`);

//       return {
//         jobId,
//         position,
//         status: MarkingJobStatus.QUEUED,
//       };
//     } catch (error) {
//       logger.error('Error enqueueing marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get queue position for a job
//    */
//   async getQueuePosition(jobId: string): Promise<QueuePosition | null> {
//     try {
//       const job = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         select: {
//           id: true,
//           queuePosition: true,
//           assignedAgentId: true,
//           timeSlotExpiry: true,
//           status: true,
//         },
//       });

//       if (!job) {
//         throw new AppError('Marking job not found', 404);
//       }

//       return {
//         jobId: job.id,
//         position: job.queuePosition ?? 0,
//         assignedAgentId: job.assignedAgentId || undefined,
//         timeSlotExpiry: job.timeSlotExpiry || undefined,
//         status: job.status,
//       };
//     } catch (error) {
//       logger.error('Error getting queue position:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get entire queue for a property location
//    */
//   async getQueueByLocation(city: string, urgencyLevel?: string) {
//     try {
//       const query: any = {
//         where: {
//           status: MarkingJobStatus.QUEUED,
//           property: {
//             city,
//           },
//         },
//       };

//       if (urgencyLevel) {
//         query.where.urgencyLevel = urgencyLevel;
//       }

//       const queue = await this.prisma.propertyMarkingJob.findMany({
//         ...query,
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               gpsCoordinates: true,
//             },
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//         },
//         orderBy: [
//           { urgencyLevel: 'desc' }, // Higher urgency first
//           { createdAt: 'asc' }, // Then by creation time (FCFS)
//         ],
//       });

//       // Add queue positions
//       return queue.map((job, index) => ({
//         ...job,
//         queuePosition: index + 1,
//       }));
//     } catch (error) {
//       logger.error('Error fetching queue by location:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get available queue jobs (unassigned, queued)
//    */
//   async getAvailableQueue(limit: number = 50) {
//     try {
//       const queue = await this.prisma.propertyMarkingJob.findMany({
//         where: {
//           status: MarkingJobStatus.QUEUED,
//           assignedAgentId: null,
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               city: true,
//               state: true,
//               gpsCoordinates: true,
//             },
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               contactPersonPhone: true,
//             },
//           },
//         },
//         orderBy: [
//           { urgencyLevel: 'desc' },
//           { createdAt: 'asc' },
//         ],
//         take: limit,
//       });

//       return queue.map((job, index) => ({
//         ...job,
//         queuePosition: index + 1,
//       }));
//     } catch (error) {
//       logger.error('Error fetching available queue:', error);
//       throw error;
//     }
//   }

//   /**
//    * Remove job from queue (either assigned or cancelled)
//    */
//   async dequeueMarkingJob(jobId: string): Promise<void> {
//     try {
//       const job = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//       });

//       if (!job) {
//         throw new AppError('Marking job not found', 404);
//       }

//       // Update job to remove queue position
//       await this.prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           queuePosition: null,
//         },
//       });

//       // Re-order remaining queue items
//       await this.reorderQueue(job.urgencyLevel, job.property?.city || '');

//       logger.info(`Job ${jobId} removed from queue`);
//     } catch (error) {
//       logger.error('Error dequeueing marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get queue statistics
//    */
//   async getQueueStats(city?: string) {
//     try {
//       const query: any = {
//         status: MarkingJobStatus.QUEUED,
//       };

//       if (city) {
//         query.property = { city };
//       }

//       const [total, byUrgency] = await Promise.all([
//         this.prisma.propertyMarkingJob.count({
//           where: query,
//         }),
//         this.prisma.propertyMarkingJob.groupBy({
//           by: ['urgencyLevel'],
//           where: query,
//           _count: true,
//         }),
//       ]);

//       return {
//         totalQueued: total,
//         byUrgency: byUrgency.map(item => ({
//           urgencyLevel: item.urgencyLevel,
//           count: item._count,
//         })),
//         location: city || 'All',
//       };
//     } catch (error) {
//       logger.error('Error fetching queue stats:', error);
//       throw error;
//     }
//   }

//   /**
//    * Clear expired queue items
//    */
//   async clearExpiredQueueItems(): Promise<number> {
//     try {
//       const now = new Date();

//       // Find expired items (max completion time exceeded)
//       const expiredJobs = await this.prisma.propertyMarkingJob.findMany({
//         where: {
//           status: MarkingJobStatus.QUEUED,
//           maxCompletionTime: {
//             lt: now,
//           },
//         },
//       });

//       if (expiredJobs.length === 0) {
//         logger.info('No expired queue items to clear');
//         return 0;
//       }

//       // Mark them as expired
//       const result = await this.prisma.propertyMarkingJob.updateMany({
//         where: {
//           id: {
//             in: expiredJobs.map(job => job.id),
//           },
//         },
//         data: {
//           status: MarkingJobStatus.EXPIRED,
//           queuePosition: null,
//         },
//       });

//       logger.info(`Cleared ${result.count} expired queue items`);

//       return result.count;
//     } catch (error) {
//       logger.error('Error clearing expired queue items:', error);
//       throw error;
//     }
//   }

//   /**
//    * Re-order queue after removal
//    */
//   private async reorderQueue(urgencyLevel: string, city: string): Promise<void> {
//     try {
//       const queueJobs = await this.prisma.propertyMarkingJob.findMany({
//         where: {
//           status: MarkingJobStatus.QUEUED,
//           urgencyLevel,
//           property: {
//             city,
//           },
//         },
//         orderBy: {
//           createdAt: 'asc',
//         },
//       });

//       // Update positions for remaining jobs
//       for (let i = 0; i < queueJobs.length; i++) {
//         await this.prisma.propertyMarkingJob.update({
//           where: { id: queueJobs[i].id },
//           data: {
//             queuePosition: i + 1,
//           },
//         });
//       }

//       logger.info(`Re-ordered ${queueJobs.length} queue positions for ${city}`);
//     } catch (error) {
//       logger.error('Error re-ordering queue:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get queue depth analysis for capacity planning
//    */
//   async getQueueDepthAnalysis(city?: string) {
//     try {
//       const query: any = {
//         status: MarkingJobStatus.QUEUED,
//       };

//       if (city) {
//         query.property = { city };
//       }

//       const jobs = await this.prisma.propertyMarkingJob.findMany({
//         where: query,
//         select: {
//           id: true,
//           createdAt: true,
//           urgencyLevel: true,
//           queuePosition: true,
//         },
//       });

//       const now = new Date();

//       // Calculate wait times
//       const analysis = {
//         totalQueued: jobs.length,
//         avgWaitTime: this.calculateAverageWaitTime(jobs, now),
//         maxWaitTime: this.calculateMaxWaitTime(jobs, now),
//         minWaitTime: this.calculateMinWaitTime(jobs, now),
//         urgencyDistribution: this.getUrgencyDistribution(jobs),
//       };

//       return analysis;
//     } catch (error) {
//       logger.error('Error analyzing queue depth:', error);
//       throw error;
//     }
//   }

//   /**
//    * Calculate average wait time in minutes
//    */
//   private calculateAverageWaitTime(jobs: any[], now: Date): number {
//     if (jobs.length === 0) return 0;

//     const totalWaitTime = jobs.reduce((sum, job) => {
//       return sum + (now.getTime() - job.createdAt.getTime());
//     }, 0);

//     return Math.round(totalWaitTime / jobs.length / 60000);
//   }

//   /**
//    * Calculate max wait time in minutes
//    */
//   private calculateMaxWaitTime(jobs: any[], now: Date): number {
//     if (jobs.length === 0) return 0;

//     return Math.round(
//       Math.max(...jobs.map(job => now.getTime() - job.createdAt.getTime())) / 60000
//     );
//   }

//   /**
//    * Calculate min wait time in minutes
//    */
//   private calculateMinWaitTime(jobs: any[], now: Date): number {
//     if (jobs.length === 0) return 0;

//     return Math.round(
//       Math.min(...jobs.map(job => now.getTime() - job.createdAt.getTime())) / 60000
//     );
//   }

//   /**
//    * Get urgency distribution in queue
//    */
//   private getUrgencyDistribution(jobs: any[]): Record<string, number> {
//     return jobs.reduce((dist, job) => {
//       dist[job.urgencyLevel] = (dist[job.urgencyLevel] || 0) + 1;
//       return dist;
//     }, {} as Record<string, number>);
//   }
// }









// // backend/marking-service/src/services/queueService.ts

// import { PrismaClient, MarkingJobStatus } from '@prisma/client';
// import { ProximityService } from './proximityService';
// import { NotificationService } from './notificationService';

// const prisma = new PrismaClient();

// export class QueueService {
//   private proximityService: ProximityService;
//   private notificationService: NotificationService;

//   constructor() {
//     this.proximityService = new ProximityService();
//     this.notificationService = new NotificationService();
//   }

//   /**
//    * Add marking job to queue and broadcast to eligible agents
//    */
//   async addToQueue(jobId: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         property: true,
//         requestingUser: true,
//       },
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     // Get property coordinates
//     const coordinates = job.property.gpsCoordinates
//       ? JSON.parse(job.property.gpsCoordinates)
//       : null;

//     if (!coordinates) {
//       throw new Error('Property must have GPS coordinates for queue assignment');
//     }

//     // Find eligible agents within reasonable proximity
//     const eligibleAgents = await this.proximityService.findEligibleAgents(
//       coordinates.lat,
//       coordinates.lng,
//       job.property.city,
//       job.property.state
//     );

//     if (eligibleAgents.length === 0) {
//       throw new Error('No agents available in the property area');
//     }

//     // Get current queue size
//     const currentQueueSize = await prisma.propertyMarkingJob.count({
//       where: {
//         status: MarkingJobStatus.QUEUED,
//         queuePosition: { not: null },
//       },
//     });

//     // Set queue position (last in queue)
//     await prisma.propertyMarkingJob.update({
//       where: { id: jobId },
//       data: {
//         queuePosition: currentQueueSize + 1,
//       },
//     });

//     // Broadcast to eligible agents
//     await this.notificationService.broadcastMarkingJobToAgents(job, eligibleAgents);

//     return {
//       jobId,
//       queuePosition: currentQueueSize + 1,
//       eligibleAgents: eligibleAgents.length,
//     };
//   }

//   /**
//    * Remove job from queue and adjust positions
//    */
//   async removeFromQueue(jobId: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//     });

//     if (!job || job.queuePosition === null) {
//       return;
//     }

//     // Remove from queue
//     await prisma.propertyMarkingJob.update({
//       where: { id: jobId },
//       data: {
//         queuePosition: null,
//       },
//     });

//     // Adjust positions of jobs after this one
//     await prisma.propertyMarkingJob.updateMany({
//       where: {
//         queuePosition: { gt: job.queuePosition },
//         status: MarkingJobStatus.QUEUED,
//       },
//       data: {
//         queuePosition: { decrement: 1 },
//       },
//     });
//   }

//   /**
//    * Get current queue for a specific location
//    */
//   async getQueueForLocation(city: string, state: string) {
//     const jobs = await prisma.propertyMarkingJob.findMany({
//       where: {
//         status: MarkingJobStatus.QUEUED,
//         queuePosition: { not: null },
//         property: {
//           city,
//           state,
//         },
//       },
//       include: {
//         property: {
//           select: {
//             id: true,
//             address: true,
//             city: true,
//             state: true,
//             gpsCoordinates: true,
//           },
//         },
//         requestingUser: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         queuePosition: 'asc',
//       },
//     });

//     return jobs;
//   }

//   /**
//    * Get queue position for a specific job
//    */
//   async getQueuePosition(jobId: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       select: {
//         queuePosition: true,
//         status: true,
//         property: {
//           select: {
//             city: true,
//             state: true,
//           },
//         },
//       },
//     });

//     if (!job) {
//       throw new Error('Job not found');
//     }

//     // Count jobs ahead in queue for same location
//     const jobsAhead = await prisma.propertyMarkingJob.count({
//       where: {
//         status: MarkingJobStatus.QUEUED,
//         queuePosition: { lt: job.queuePosition || 0 },
//         property: {
//           city: job.property.city,
//           state: job.property.state,
//         },
//       },
//     });

//     return {
//       queuePosition: job.queuePosition,
//       jobsAhead,
//       status: job.status,
//     };
//   }

//   /**
//    * Move job to front of queue (urgent marking)
//    */
//   async prioritizeJob(jobId: string, adminId: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//     });

//     if (!job || job.queuePosition === null) {
//       throw new Error('Job not found or not in queue');
//     }

//     // Update all jobs that were ahead to move back
//     await prisma.propertyMarkingJob.updateMany({
//       where: {
//         queuePosition: { lt: job.queuePosition },
//         status: MarkingJobStatus.QUEUED,
//       },
//       data: {
//         queuePosition: { increment: 1 },
//       },
//     });

//     // Move this job to position 1
//     await prisma.propertyMarkingJob.update({
//       where: { id: jobId },
//       data: {
//         queuePosition: 1,
//         urgencyLevel: 'URGENT',
//       },
//     });

//     // Log admin action
//     await prisma.adminAction.create({
//       data: {
//         adminId,
//         action: 'MARKING_JOB_PRIORITIZED',
//         targetType: 'PropertyMarkingJob',
//         targetId: jobId,
//         description: 'Marking job moved to front of queue',
//       },
//     });

//     return { success: true, newPosition: 1 };
//   }

//   /**
//    * Get queue statistics
//    */
//   async getQueueStats(city?: string, state?: string) {
//     const where: any = {
//       status: MarkingJobStatus.QUEUED,
//       queuePosition: { not: null },
//     };

//     if (city && state) {
//       where.property = { city, state };
//     }

//     const [totalInQueue, avgWaitTime] = await Promise.all([
//       prisma.propertyMarkingJob.count({ where }),
//       this.calculateAverageWaitTime(city, state),
//     ]);

//     return {
//       totalInQueue,
//       avgWaitTime,
//       estimatedTimeToCompletion: avgWaitTime * totalInQueue,
//     };
//   }

//   /**
//    * Calculate average wait time for queue
//    */
//   private async calculateAverageWaitTime(city?: string, state?: string): Promise<number> {
//     const where: any = {
//       status: MarkingJobStatus.COMPLETED,
//       assignedAt: { not: null },
//       completedAt: { not: null },
//     };

//     if (city && state) {
//       where.property = { city, state };
//     }

//     const completedJobs = await prisma.propertyMarkingJob.findMany({
//       where,
//       select: {
//         createdAt: true,
//         assignedAt: true,
//       },
//       take: 50, // Last 50 completed jobs
//       orderBy: { completedAt: 'desc' },
//     });

//     if (completedJobs.length === 0) {
//       return 180; // Default 3 hours in minutes
//     }

//     const totalWaitMinutes = completedJobs.reduce((sum, job) => {
//       const waitTime = job.assignedAt!.getTime() - job.createdAt.getTime();
//       return sum + waitTime / (1000 * 60); // Convert to minutes
//     }, 0);

//     return Math.round(totalWaitMinutes / completedJobs.length);
//   }

//   /**
//    * Rebalance queue (remove expired, adjust positions)
//    */
//   async rebalanceQueue() {
//     // Find jobs that should no longer be in queue
//     const expiredJobs = await prisma.propertyMarkingJob.findMany({
//       where: {
//         status: MarkingJobStatus.QUEUED,
//         queuePosition: { not: null },
//         OR: [
//           { maxCompletionTime: { lt: new Date() } },
//           { paymentStatus: 'FAILED' },
//         ],
//       },
//     });

//     // Remove expired jobs
//     for (const job of expiredJobs) {
//       await this.removeFromQueue(job.id);
//       await prisma.propertyMarkingJob.update({
//         where: { id: job.id },
//         data: {
//           status: MarkingJobStatus.EXPIRED,
//         },
//       });
//     }

//     // Reorder remaining jobs
//     const remainingJobs = await prisma.propertyMarkingJob.findMany({
//       where: {
//         status: MarkingJobStatus.QUEUED,
//         queuePosition: { not: null },
//       },
//       orderBy: {
//         queuePosition: 'asc',
//       },
//     });

//     // Update positions to be sequential
//     for (let i = 0; i < remainingJobs.length; i++) {
//       await prisma.propertyMarkingJob.update({
//         where: { id: remainingJobs[i].id },
//         data: {
//           queuePosition: i + 1,
//         },
//       });
//     }

//     return {
//       expiredRemoved: expiredJobs.length,
//       totalInQueue: remainingJobs.length,
//     };
//   }
// }

// export default QueueService;