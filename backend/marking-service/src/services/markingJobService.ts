// backend/marking-service/src/services/markingJobService.ts

import { PrismaClient, PropertyMarkingJob, MarkingJobStatus, UrgencyLevel } from '@newcondo/db';
import { CreateMarkingJobData, UpdateMarkingJobData, MarkingJobFilters } from '../types/markingJob';

const prisma = new PrismaClient();

export class MarkingJobService {
  async createMarkingJob(data: CreateMarkingJobData): Promise<PropertyMarkingJob> {
    const queuePosition = await this.getNextQueuePosition();
    const maxCompletionTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    
    const markingJob = await prisma.propertyMarkingJob.create({
      data: {
        ...data,
        queuePosition,
        maxCompletionTime,
        markingFee: this.calculateMarkingFee(data.urgencyLevel),
      },
      include: {
        property: {
          include: {
            owner: true,
            images: true,
          },
        },
        requestingUser: true,
        assignedAgent: true,
      },
    });

    return markingJob;
  }

  async assignAgentToJob(jobId: string, agentId: string): Promise<PropertyMarkingJob> {
    const job = await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        assignedAgentId: agentId,
        status: MarkingJobStatus.ASSIGNED,
        assignedAt: new Date(),
        timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      },
      include: {
        property: true,
        requestingUser: true,
        assignedAgent: true,
      },
    });

    return job;
  }

  async startJob(jobId: string): Promise<PropertyMarkingJob> {
    const job = await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        status: MarkingJobStatus.IN_PROGRESS,
      },
      include: {
        property: true,
        requestingUser: true,
        assignedAgent: true,
      },
    });

    return job;
  }

  async completeJob(
    jobId: string,
    completionData: {
      completionNotes?: string;
      completionImages: string[];
      boundaryData: any;
    }
  ): Promise<PropertyMarkingJob> {
    const job = await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        status: MarkingJobStatus.COMPLETED,
        completedAt: new Date(),
        completionNotes: completionData.completionNotes,
        completionImages: completionData.completionImages,
        boundaryData: completionData.boundaryData,
      },
      include: {
        property: true,
        requestingUser: true,
        assignedAgent: true,
      },
    });

    // Update agent stats
    await this.updateAgentStats(job.assignedAgentId!);

    // Update property with boundary data
    await prisma.property.update({
      where: { id: job.propertyId },
      data: {
        boundaryCoordinates: completionData.boundaryData,
        boundaryVerified: true,
        boundaryMarkedBy: job.assignedAgentId,
        boundaryMarkedAt: new Date(),
        boundaryImages: completionData.completionImages,
      },
    });

    return job;
  }

  async getJobsByStatus(status: MarkingJobStatus): Promise<PropertyMarkingJob[]> {
    return await prisma.propertyMarkingJob.findMany({
      where: { status },
      include: {
        property: true,
        requestingUser: true,
        assignedAgent: true,
      },
      orderBy: [
        { urgencyLevel: 'desc' },
        { queuePosition: 'asc' },
      ],
    });
  }

  async getJobsForAgent(agentId: string): Promise<PropertyMarkingJob[]> {
    return await prisma.propertyMarkingJob.findMany({
      where: { assignedAgentId: agentId },
      include: {
        property: true,
        requestingUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobsByUser(userId: string): Promise<PropertyMarkingJob[]> {
    return await prisma.propertyMarkingJob.findMany({
      where: { requestedBy: userId },
      include: {
        property: true,
        assignedAgent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelJob(jobId: string): Promise<PropertyMarkingJob> {
    return await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        status: MarkingJobStatus.CANCELLED,
      },
    });
  }

  async expireJob(jobId: string): Promise<PropertyMarkingJob> {
    return await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        status: MarkingJobStatus.EXPIRED,
      },
    });
  }

  async getAvailableAgents(serviceArea: string): Promise<any[]> {
    return await prisma.user.findMany({
      where: {
        role: 'AGENT',
        isAvailableForMarking: true,
        agentServiceAreas: {
          has: serviceArea,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        agentServiceAreas: true,
      },
      orderBy: {
        agentReliabilityScore: 'desc',
      },
    });
  }

  private async getNextQueuePosition(): Promise<number> {
    const lastJob = await prisma.propertyMarkingJob.findFirst({
      where: { status: MarkingJobStatus.QUEUED },
      orderBy: { queuePosition: 'desc' },
    });

    return (lastJob?.queuePosition || 0) + 1;
  }

  private calculateMarkingFee(urgencyLevel: UrgencyLevel): number {
    const baseFee = 5000; // Base fee in NGN
    const multipliers = {
      [UrgencyLevel.LOW]: 1,
      [UrgencyLevel.NORMAL]: 1.2,
      [UrgencyLevel.HIGH]: 1.5,
      [UrgencyLevel.URGENT]: 2,
    };

    return baseFee * multipliers[urgencyLevel];
  }

  private async updateAgentStats(agentId: string): Promise<void> {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        completedMarkingJobs: true,
        totalMarkingJobs: true,
      },
    });

    if (agent) {
      await prisma.user.update({
        where: { id: agentId },
        data: {
          completedMarkingJobs: agent.completedMarkingJobs + 1,
          agentReliabilityScore: this.calculateReliabilityScore(
            agent.completedMarkingJobs + 1,
            agent.totalMarkingJobs
          ),
        },
      });
    }
  }

  private calculateReliabilityScore(completed: number, total: number): number {
    if (total === 0) return 0;
    const completionRate = completed / total;
    return Math.min(5, completionRate * 5);
  }
}
