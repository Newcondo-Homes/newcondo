// backend/admin-service/src/services/queueManagementService.ts

import { PrismaClient } from '@newcondo/db';
import { adminService } from './adminService';

const prisma = new PrismaClient();

interface QueueStats {
  totalInQueue: number;
  avgWaitTime: number;
  avgCompletionTime: number;
  expiredJobs: number;
  activeAgents: number;
}

interface AgentQueueInfo {
  agentId: string;
  name: string;
  email: string;
  currentPosition: number | null;
  totalJobsInQueue: number;
  completionRate: number;
  reliabilityScore: number;
  serviceAreas: string[];
}

class QueueManagementService {
  /**
   * Get queue overview
   */
  async getQueueOverview(adminId: string) {
    await adminService.verifyAdminAccess(adminId);

    const [queueStats, queuedJobs, activeAgents] = await Promise.all([
      this.getQueueStats(),
      this.getQueuedJobs(),
      this.getActiveAgents()
    ]);

    return {
      stats: queueStats,
      queuedJobs,
      activeAgents
    };
  }

  /**
   * Get queue statistics
   */
  private async getQueueStats(): Promise<QueueStats> {
    const [totalInQueue, expiredJobs, activeAgents, waitTimes, completionTimes] = await Promise.all([
      prisma.propertyMarkingJob.count({
        where: { status: { in: ['QUEUED', 'ASSIGNED'] } }
      }),
      prisma.propertyMarkingJob.count({
        where: { status: 'EXPIRED' }
      }),
      prisma.user.count({
        where: {
          role: 'AGENT',
          isAvailableForMarking: true
        }
      }),
      this.calculateAverageWaitTime(),
      this.calculateAverageCompletionTime()
    ]);

    return {
      totalInQueue,
      avgWaitTime: waitTimes,
      avgCompletionTime: completionTimes,
      expiredJobs,
      activeAgents
    };
  }

  /**
   * Calculate average wait time (time from creation to assignment)
   */
  private async calculateAverageWaitTime(): Promise<number> {
    const assignedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: { in: ['ASSIGNED', 'COMPLETED'] },
        assignedAt: { not: null }
      },
      select: {
        createdAt: true,
        assignedAt: true
      },
      take: 100,
      orderBy: { assignedAt: 'desc' }
    });

    if (assignedJobs.length === 0) return 0;

    const totalWaitTime = assignedJobs.reduce((sum, job) => {
      if (!job.assignedAt) return sum;
      const waitTime = job.assignedAt.getTime() - job.createdAt.getTime();
      return sum + waitTime;
    }, 0);

    // Return average in minutes
    return totalWaitTime / assignedJobs.length / (1000 * 60);
  }

  /**
   * Calculate average completion time
   */
  private async calculateAverageCompletionTime(): Promise<number> {
    const completedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { not: null }
      },
      select: {
        assignedAt: true,
        completedAt: true
      },
      take: 100,
      orderBy: { completedAt: 'desc' }
    });

    if (completedJobs.length === 0) return 0;

    const totalCompletionTime = completedJobs.reduce((sum, job) => {
      if (!job.assignedAt || !job.completedAt) return sum;
      const completionTime = job.completedAt.getTime() - job.assignedAt.getTime();
      return sum + completionTime;
    }, 0);

    // Return average in minutes
    return totalCompletionTime / completedJobs.length / (1000 * 60);
  }

  /**
   * Get queued jobs
   */
  private async getQueuedJobs() {
    return prisma.propertyMarkingJob.findMany({
      where: { status: { in: ['QUEUED', 'ASSIGNED'] } },
      orderBy: { queuePosition: 'asc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true
          }
        },
        requestingUser: {
          select: {
            name: true,
            email: true
          }
        },
        assignedAgent: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Get active agents
   */
  private async getActiveAgents(): Promise<AgentQueueInfo[]> {
    const agents = await prisma.user.findMany({
      where: {
        role: 'AGENT',
        isAvailableForMarking: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        agentServiceAreas: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        assignedMarkingJobs: {
          where: {
            status: { in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'] }
          },
          orderBy: { queuePosition: 'asc' },
          take: 1
        }
      },
      orderBy: { agentReliabilityScore: 'desc' }
    });

    return agents.map(agent => ({
      agentId: agent.id,
      name: agent.name || 'Unknown',
      email: agent.email,
      currentPosition: agent.assignedMarkingJobs[0]?.queuePosition || null,
      totalJobsInQueue: agent.assignedMarkingJobs.length,
      completionRate: agent.totalMarkingJobs > 0
        ? (agent.completedMarkingJobs / agent.totalMarkingJobs) * 100
        : 0,
      reliabilityScore: Number(agent.agentReliabilityScore || 0),
      serviceAreas: agent.agentServiceAreas
    }));
  }

  /**
   * Manually adjust queue position
   */
  async adjustQueuePosition(
    adminId: string,
    jobId: string,
    newPosition: number,
    reason: string
  ) {
    await adminService.verifyAdminAccess(adminId);

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: { queuePosition: true, status: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'QUEUED' && job.status !== 'ASSIGNED') {
      throw new Error('Job is not in queue');
    }

    const oldPosition = job.queuePosition;

    // Update the job's position
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: { queuePosition: newPosition }
    });

    // Reorder other jobs
    if (oldPosition && newPosition < oldPosition) {
      // Moving up in queue - shift others down
      await prisma.propertyMarkingJob.updateMany({
        where: {
          status: { in: ['QUEUED', 'ASSIGNED'] },
          queuePosition: {
            gte: newPosition,
            lt: oldPosition
          },
          id: { not: jobId }
        },
        data: {
          queuePosition: { increment: 1 }
        }
      });
    } else if (oldPosition && newPosition > oldPosition) {
      // Moving down in queue - shift others up
      await prisma.propertyMarkingJob.updateMany({
        where: {
          status: { in: ['QUEUED', 'ASSIGNED'] },
          queuePosition: {
            gt: oldPosition,
            lte: newPosition
          },
          id: { not: jobId }
        },
        data: {
          queuePosition: { decrement: 1 }
        }
      });
    }

    // Log action
    await adminService.logAction(
      adminId,
      'AGENT_SUSPENDED' as any, // Using closest available type
      'PropertyMarkingJob',
      jobId,
      `Queue position adjusted: ${oldPosition} -> ${newPosition}`,
      { reason, oldPosition, newPosition }
    );

    return { success: true };
  }

  /**
   * Priority boost for urgent jobs
   */
  async boostJobPriority(adminId: string, jobId: string, reason: string) {
    await adminService.verifyAdminAccess(adminId);

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: { status: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'QUEUED' && job.status !== 'ASSIGNED') {
      throw new Error('Job is not in queue');
    }

    // Move to position 1 (highest priority)
    await this.adjustQueuePosition(adminId, jobId, 1, `Priority boost: ${reason}`);

    // Update urgency level
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: { urgencyLevel: 'URGENT' }
    });

    return { success: true };
  }

  /**
   * Clear expired jobs from queue
   */
  async clearExpiredJobs(adminId: string) {
    await adminService.verifyAdminAccess(adminId);

    const now = new Date();

    // Find expired jobs
    const expiredJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: { in: ['QUEUED', 'ASSIGNED'] },
        OR: [
          { timeSlotExpiry: { lt: now } },
          { maxCompletionTime: { lt: now } }
        ]
      },
      select: { id: true }
    });

    // Update to expired status
    await prisma.propertyMarkingJob.updateMany({
      where: {
        id: { in: expiredJobs.map(j => j.id) }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    // Log action
    await adminService.logAction(
      adminId,
      'AGENT_SUSPENDED' as any,
      'PropertyMarkingJob',
      'bulk',
      `Cleared ${expiredJobs.length} expired jobs`,
      { count: expiredJobs.length }
    );

    return {
      success: true,
      clearedCount: expiredJobs.length
    };
  }

  /**
   * Pause/Resume queue for agent
   */
  async toggleAgentQueueStatus(
    adminId: string,
    agentId: string,
    pause: boolean,
    reason: string
  ) {
    await adminService.verifyAdminAccess(adminId);

    // Update agent availability
    await prisma.user.update({
      where: { id: agentId },
      data: {
        isAvailableForMarking: !pause
      }
    });

    // If pausing, reassign their current jobs
    if (pause) {
      const agentJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          assignedAgentId: agentId,
          status: { in: ['QUEUED', 'ASSIGNED'] }
        },
        select: { id: true }
      });

      // Reset jobs to queued
      await prisma.propertyMarkingJob.updateMany({
        where: {
          id: { in: agentJobs.map(j => j.id) }
        },
        data: {
          status: 'QUEUED',
          assignedAgentId: null,
          assignedAt: null
        }
      });
    }

    // Log action
    await adminService.logAction(
      adminId,
      'AGENT_SUSPENDED' as any,
      'User',
      agentId,
      `Agent queue ${pause ? 'paused' : 'resumed'}: ${reason}`,
      { pause, reason }
    );

    return { success: true };
  }

  /**
   * Get queue analytics
   */
  async getQueueAnalytics(adminId: string, days: number = 30) {
    await adminService.verifyAdminAccess(adminId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        status: true,
        createdAt: true,
        assignedAt: true,
        completedAt: true,
        urgencyLevel: true
      }
    });

    // Group by status
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by urgency
    const urgencyCounts = jobs.reduce((acc, job) => {
      acc[job.urgencyLevel] = (acc[job.urgencyLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily job creation trend
    const dailyTrend = jobs.reduce((acc, job) => {
      const date = job.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: `Last ${days} days`,
      total: jobs.length,
      byStatus: statusCounts,
      byUrgency: urgencyCounts,
      dailyTrend: Object.entries(dailyTrend).map(([date, count]) => ({
        date,
        count
      }))
    };
  }

  /**
   * Force reassign job to next available agent
   */
  async forceReassignJob(adminId: string, jobId: string, reason: string) {
    await adminService.verifyAdminAccess(adminId);

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: {
          select: {
            city: true,
            state: true
          }
        }
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Find next available agent in same service area
    const nextAgent = await prisma.user.findFirst({
      where: {
        role: 'AGENT',
        isAvailableForMarking: true,
        agentServiceAreas: {
          hasSome: [job.property.city, job.property.state]
        }
      },
      orderBy: {
        agentReliabilityScore: 'desc'
      }
    });

    if (!nextAgent) {
      throw new Error('No available agents found');
    }

    // Reassign job
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        assignedAgentId: nextAgent.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
        timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
      }
    });

    // Log action
    await adminService.logAction(
      adminId,
      'AGENT_SUSPENDED' as any,
      'PropertyMarkingJob',
      jobId,
      `Force reassigned to ${nextAgent.name}: ${reason}`,
      { newAgentId: nextAgent.id, reason }
    );

    return {
      success: true,
      newAgent: {
        id: nextAgent.id,
        name: nextAgent.name,
        email: nextAgent.email
      }
    };
  }
}

export const queueManagementService = new QueueManagementService();