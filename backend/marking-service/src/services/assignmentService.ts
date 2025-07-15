// backend/marking-service/src/services/assignmentService.ts

import { PrismaClient, MarkingJobStatus } from '@newcondo/db';
import { MarkingJobService } from './markingJobService';

const prisma = new PrismaClient();
const markingJobService = new MarkingJobService();

export class AssignmentService {
  async tryAutoAssign(jobId: string): Promise<boolean> {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
      },
    });

    if (!job) return false;

    // Get available agents in the property's city
    const availableAgents = await markingJobService.getAvailableAgents(job.property.city);
    
    if (availableAgents.length === 0) return false;

    // Select the best agent based on reliability score and workload
    const bestAgent = this.selectBestAgent(availableAgents);
    
    if (bestAgent) {
      await markingJobService.assignAgentToJob(jobId, bestAgent.id);
      return true;
    }

    return false;
  }

  private selectBestAgent(agents: any[]): any | null {
    if (agents.length === 0) return null;

    // Sort by reliability score (descending) and current workload (ascending)
    const sortedAgents = agents.sort((a, b) => {
      const reliabilityDiff = (b.agentReliabilityScore || 0) - (a.agentReliabilityScore || 0);
      if (reliabilityDiff !== 0) return reliabilityDiff;
      
      // If reliability is equal, prefer agent with fewer active jobs
      const aActiveJobs = a.totalMarkingJobs - a.completedMarkingJobs;
      const bActiveJobs = b.totalMarkingJobs - b.completedMarkingJobs;
      return aActiveJobs - bActiveJobs;
    });

    return sortedAgents[0];
  }

  async getAgentWorkload(agentId: string): Promise<{
    activeJobs: number;
    completedJobs: number;
    reliabilityScore: number;
  }> {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        agentReliabilityScore: true,
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    return {
      activeJobs: agent.totalMarkingJobs - agent.completedMarkingJobs,
      completedJobs: agent.completedMarkingJobs,
      reliabilityScore: agent.agentReliabilityScore?.toNumber() || 0,
    };
  }

  async reassignExpiredJobs(): Promise<void> {
    const expiredJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.ASSIGNED,
        timeSlotExpiry: { lt: new Date() },
      },
    });

    for (const job of expiredJobs) {
      // Mark as expired and try to reassign
      await prisma.propertyMarkingJob.update({
        where: { id: job.id },
        data: {
          status: MarkingJobStatus.QUEUED,
          assignedAgentId: null,
          assignedAt: null,
          timeSlotExpiry: null,
        },
      });

      // Try to auto-assign to another agent
      await this.tryAutoAssign(job.id);
    }
  }
}
