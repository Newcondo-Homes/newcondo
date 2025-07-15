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
