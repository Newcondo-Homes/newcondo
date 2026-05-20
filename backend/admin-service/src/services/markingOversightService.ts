// backend/admin-service/src/services/markingOversightService.ts

import { PrismaClient } from "@newcondo/db";
import {
  MarkingJobStatus,
  User,
  UrgencyLevel,
} from "@newcondo/db";

interface MarkingOversightStats {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  expiredJobs: number;
  averageCompletionTime: number;
  agentPerformanceMetrics: AgentMetrics[];
  overallCompletionRate: number;
}

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalJobsAssigned: number;
  completedJobs: number;
  pendingJobs: number;
  averageCompletionTime: number;
  completionRate: number;
  reliabilityScore: number;
  lastActivity: Date;
}

interface MarkingJobAlert {
  jobId: string;
  propertyId: string;
  status: string;
  assignedAgent: User | null;
  timeSlotExpiry: Date | null;
  urgencyLevel: UrgencyLevel;
  flagged: boolean;
  reason?: string;
}

class MarkingOversightService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get comprehensive marking job oversight statistics
   */
  async getMarkingOversightStats(
    filters?: {
      startDate?: Date;
      endDate?: Date;
      state?: string;
      agentId?: string;
    }
  ): Promise<MarkingOversightStats> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate)
        where.createdAt.gte = filters.startDate;
      if (filters.endDate)
        where.createdAt.lte = filters.endDate;
    }

    if (filters?.agentId) {
      where.assignedAgentId = filters.agentId;
    }

    const allJobs = await this.prisma.propertyMarkingJob.findMany({
      where,
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            agentReliabilityScore: true,
            completedMarkingJobs: true,
            totalMarkingJobs: true,
          },
        },
        property: {
          select: {
            state: true,
            city: true,
          },
        },
      },
    });

    const completedJobs = allJobs.filter(
      (j) => j.status === MarkingJobStatus.COMPLETED
    );
    const pendingJobs = allJobs.filter(
      (j) =>
        j.status === MarkingJobStatus.ASSIGNED ||
        j.status === MarkingJobStatus.IN_PROGRESS
    );
    const expiredJobs = allJobs.filter(
      (j) => j.status === MarkingJobStatus.EXPIRED
    );

    const completionTimes = completedJobs
      .filter((j) => j.completedAt && j.createdAt)
      .map(
        (j) =>
          (new Date(j.completedAt!).getTime() -
            new Date(j.createdAt).getTime()) /
          (1000 * 60 * 60)
      );

    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    const agentMetrics = await this.getAgentPerformanceMetrics(
      allJobs,
      filters?.startDate,
      filters?.endDate
    );

    const completionRate =
      allJobs.length > 0 ? (completedJobs.length / allJobs.length) * 100 : 0;

    return {
      totalJobs: allJobs.length,
      completedJobs: completedJobs.length,
      pendingJobs: pendingJobs.length,
      expiredJobs: expiredJobs.length,
      averageCompletionTime: Math.round(avgCompletionTime * 100) / 100,
      agentPerformanceMetrics: agentMetrics,
      overallCompletionRate:
        Math.round(completionRate * 100) / 100,
    };
  }

  /**
   * Get individual agent performance metrics
   */
  private async getAgentPerformanceMetrics(
    jobs: any[],
    startDate?: Date,
    endDate?: Date
  ): Promise<AgentMetrics[]> {
    const agentMap = new Map<string, AgentMetrics>();

    for (const job of jobs) {
      if (!job.assignedAgent) continue;

      const agentId = job.assignedAgent.id;
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          agentId,
          agentName: job.assignedAgent.name || "Unknown",
          totalJobsAssigned: 0,
          completedJobs: 0,
          pendingJobs: 0,
          averageCompletionTime: 0,
          completionRate: 0,
          reliabilityScore: Number(job.assignedAgent.agentReliabilityScore) || 0,
          lastActivity: new Date(0),
        });
      }

      const metrics = agentMap.get(agentId)!;
      metrics.totalJobsAssigned++;

      if (job.status === MarkingJobStatus.COMPLETED) {
        metrics.completedJobs++;
      } else if (
        job.status === MarkingJobStatus.ASSIGNED ||
        job.status === MarkingJobStatus.IN_PROGRESS
      ) {
        metrics.pendingJobs++;
      }

      if (job.updatedAt > metrics.lastActivity) {
        metrics.lastActivity = job.updatedAt;
      }
    }

    const metricsArray = Array.from(agentMap.values());

    for (const metrics of metricsArray) {
      metrics.completionRate =
        metrics.totalJobsAssigned > 0
          ? (metrics.completedJobs / metrics.totalJobsAssigned) * 100
          : 0;

      const agentJobs = jobs.filter(
        (j) => j.assignedAgent?.id === metrics.agentId
      );
      const completionTimes = agentJobs
        .filter(
          (j) =>
            j.status === MarkingJobStatus.COMPLETED &&
            j.completedAt &&
            j.createdAt
        )
        .map(
          (j) =>
            (new Date(j.completedAt).getTime() -
              new Date(j.createdAt).getTime()) /
            (1000 * 60 * 60)
        );

      metrics.averageCompletionTime =
        completionTimes.length > 0
          ? Math.round(
              (completionTimes.reduce((a, b) => a + b, 0) /
                completionTimes.length) *
                100
            ) / 100
          : 0;
    }

    return metricsArray.sort((a, b) => b.completionRate - a.completionRate);
  }

  /**
   * Identify critical marking jobs requiring admin intervention
   */
  async getAlertedMarkingJobs(): Promise<MarkingJobAlert[]> {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const jobs = await this.prisma.propertyMarkingJob.findMany({
      where: {
        OR: [
          { status: MarkingJobStatus.EXPIRED },
          {
            AND: [
              { timeSlotExpiry: { lte: now } },
              {
                status: {
                  in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
                },
              },
            ],
          },
          {
            AND: [
              { urgencyLevel: UrgencyLevel.URGENT },
              { status: MarkingJobStatus.QUEUED },
            ],
          },
          {
            AND: [
              { maxCompletionTime: { lte: now } },
              {
                status: {
                  in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
                },
              },
            ],
          },
        ],
      },
      include: {
        assignedAgent: true,
      },
    });

    return jobs.map((job) => {
      const reasons: string[] = [];

      if (job.status === MarkingJobStatus.EXPIRED) {
        reasons.push("Job expired");
      }

      if (job.timeSlotExpiry && job.timeSlotExpiry <= now) {
        reasons.push("Time slot expired");
      }

      if (job.maxCompletionTime && job.maxCompletionTime <= now) {
        reasons.push("Max completion time exceeded");
      }

      if (job.urgencyLevel === UrgencyLevel.URGENT && job.status === MarkingJobStatus.QUEUED) {
        reasons.push("Urgent job still queued");
      }

      return {
        jobId: job.id,
        propertyId: job.propertyId,
        status: job.status,
        assignedAgent: job.assignedAgent,
        timeSlotExpiry: job.timeSlotExpiry,
        urgencyLevel: job.urgencyLevel,
        flagged: true,
        reason: reasons.join("; "),
      };
    });
  }

  /**
   * Get marking jobs by agent for performance monitoring
   */
  async getAgentMarkingJobHistory(
    agentId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: MarkingJobStatus;
    }
  ) {
    const jobs = await this.prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        ...(options?.status && { status: options.status }),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
          },
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return jobs;
  }

  /**
   * Calculate agent reliability score based on performance
   */
  async updateAgentReliabilityScore(agentId: string): Promise<number> {
    const agentJobs = await this.prisma.propertyMarkingJob.findMany({
      where: { assignedAgentId: agentId },
    });

    const completedJobs = agentJobs.filter(
      (j) => j.status === MarkingJobStatus.COMPLETED
    ).length;
    const expiredJobs = agentJobs.filter(
      (j) => j.status === MarkingJobStatus.EXPIRED
    ).length;
    const totalJobs = agentJobs.length;

    if (totalJobs === 0) return 0;

    const completionRate = (completedJobs / totalJobs) * 100;
    const reliabilityScore = (completionRate - (expiredJobs / totalJobs) * 100) / 20;

    const clampedScore = Math.max(0, Math.min(5, reliabilityScore));

    await this.prisma.user.update({
      where: { id: agentId },
      data: {
        agentReliabilityScore: clampedScore,
        completedMarkingJobs: completedJobs,
        totalMarkingJobs: totalJobs,
      },
    });

    return clampedScore;
  }

  /**
   * Monitor and flag underperforming agents
   */
  async getUnderperformingAgents(threshold: number = 50): Promise<AgentMetrics[]> {
    const stats = await this.getMarkingOversightStats();
    return stats.agentPerformanceMetrics.filter(
      (agent) => agent.completionRate < threshold
    );
  }

  /**
   * Get marking job distribution by region
   */
  async getMarkingJobDistribution() {
    const distribution = await this.prisma.propertyMarkingJob.groupBy({
      by: ["propertyId"],
      _count: {
        id: true,
      },
    });

    const properties = await this.prisma.property.findMany({
      where: {
        id: {
          in: distribution.map((d) => d.propertyId),
        },
      },
      select: {
        id: true,
        state: true,
        city: true,
      },
    });

    const stateDistribution: Record<string, number> = {};
    for (const prop of properties) {
      const key = `${prop.state} (${prop.city})`;
      stateDistribution[key] =
        (stateDistribution[key] || 0) +
        (distribution.find((d) => d.propertyId === prop.id)?._count.id || 0);
    }

    return stateDistribution;
  }
}

export default MarkingOversightService;










// // backend/admin-service/src/services/markingOversightService.ts

// import { PrismaClient, MarkingJobStatus, AdminActionType, UrgencyLevel } from '@prisma/client';

// const prisma = new PrismaClient();

// interface JobFilters {
//   status?: string;
//   urgencyLevel?: string;
//   assignedAgentId?: string;
//   requestedBy?: string;
//   startDate?: Date;
//   endDate?: Date;
// }

// interface Pagination {
//   page: number;
//   limit: number;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
// }

// interface DisputeResolution {
//   resolution: string;
//   compensateAgent: boolean;
//   refundOwner: boolean;
//   adminId: string;
//   notes?: string;
// }

// class MarkingOversightService {
//   /**
//    * Get all marking jobs with filters and pagination
//    */
//   async getAllMarkingJobs(filters: JobFilters, pagination: Pagination) {
//     const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
//     const skip = (page - 1) * limit;

//     // Build where clause
//     const where: any = {};

//     if (filters.status) {
//       where.status = filters.status;
//     }

//     if (filters.urgencyLevel) {
//       where.urgencyLevel = filters.urgencyLevel;
//     }

//     if (filters.assignedAgentId) {
//       where.assignedAgentId = filters.assignedAgentId;
//     }

//     if (filters.requestedBy) {
//       where.requestedBy = filters.requestedBy;
//     }

//     if (filters.startDate || filters.endDate) {
//       where.createdAt = {};
//       if (filters.startDate) {
//         where.createdAt.gte = filters.startDate;
//       }
//       if (filters.endDate) {
//         where.createdAt.lte = filters.endDate;
//       }
//     }

//     const [jobs, total] = await Promise.all([
//       prisma.propertyMarkingJob.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { [sortBy]: sortOrder },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               city: true,
//               state: true,
//               gpsCoordinates: true
//             }
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               role: true
//             }
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               agentReliabilityScore: true,
//               totalMarkingJobs: true,
//               completedMarkingJobs: true
//             }
//           }
//         }
//       }),
//       prisma.propertyMarkingJob.count({ where })
//     ]);

//     return { jobs, total };
//   }

//   /**
//    * Get marking job by ID with full details
//    */
//   async getMarkingJobById(jobId: string) {
//     return await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         property: {
//           include: {
//             images: true,
//             owner: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true,
//                 verificationStatus: true
//               }
//             }
//           }
//         },
//         requestingUser: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             phone: true,
//             role: true,
//             verificationStatus: true
//           }
//         },
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             phone: true,
//             agentReliabilityScore: true,
//             totalMarkingJobs: true,
//             completedMarkingJobs: true,
//             agentServiceAreas: true
//           }
//         }
//       }
//     });
//   }

//   /**
//    * Manually assign a marking job to an agent
//    */
//   async manuallyAssignJob(jobId: string, agentId: string, adminId: string, notes?: string) {
//     // Check if job exists and is assignable
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     if (job.status !== MarkingJobStatus.QUEUED) {
//       throw new Error(`Cannot assign job with status: ${job.status}`);
//     }

//     // Check if agent exists and is available
//     const agent = await prisma.user.findUnique({
//       where: { id: agentId }
//     });

//     if (!agent || !agent.isAvailableForMarking) {
//       throw new Error('Agent not available for marking jobs');
//     }

//     // Calculate time slot expiry (3 hours from now)
//     const timeSlotExpiry = new Date();
//     timeSlotExpiry.setHours(timeSlotExpiry.getHours() + 3);

//     // Update job and create admin action log
//     const [updatedJob] = await prisma.$transaction([
//       prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           assignedAgentId: agentId,
//           status: MarkingJobStatus.ASSIGNED,
//           assignedAt: new Date(),
//           timeSlotExpiry,
//           queuePosition: null
//         },
//         include: {
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true
//             }
//           }
//         }
//       }),
//       prisma.adminAction.create({
//         data: {
//           adminId,
//           action: AdminActionType.PROPERTY_APPROVED,
//           targetType: 'PropertyMarkingJob',
//           targetId: jobId,
//           description: `Manually assigned marking job to agent ${agent.name}`,
//           metadata: { agentId, notes }
//         }
//       })
//     ]);

//     // TODO: Send notification to agent

//     return updatedJob;
//   }

//   /**
//    * Reassign a marking job to another agent
//    */
//   async reassignJob(jobId: string, newAgentId: string, adminId: string, reason?: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: { assignedAgent: true }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     if (job.status === MarkingJobStatus.COMPLETED || job.status === MarkingJobStatus.CANCELLED) {
//       throw new Error(`Cannot reassign job with status: ${job.status}`);
//     }

//     // Check new agent availability
//     const newAgent = await prisma.user.findUnique({
//       where: { id: newAgentId }
//     });

//     if (!newAgent || !newAgent.isAvailableForMarking) {
//       throw new Error('New agent not available for marking jobs');
//     }

//     // Calculate new time slot expiry
//     const timeSlotExpiry = new Date();
//     timeSlotExpiry.setHours(timeSlotExpiry.getHours() + 3);

//     const [updatedJob] = await prisma.$transaction([
//       prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           assignedAgentId: newAgentId,
//           status: MarkingJobStatus.ASSIGNED,
//           assignedAt: new Date(),
//           timeSlotExpiry
//         },
//         include: {
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true
//             }
//           }
//         }
//       }),
//       prisma.adminAction.create({
//         data: {
//           adminId,
//           action: AdminActionType.PROPERTY_APPROVED,
//           targetType: 'PropertyMarkingJob',
//           targetId: jobId,
//           description: `Reassigned marking job from ${job.assignedAgent?.name || 'unassigned'} to ${newAgent.name}`,
//           metadata: { 
//             previousAgentId: job.assignedAgentId,
//             newAgentId,
//             reason 
//           }
//         }
//       })
//     ]);

//     // TODO: Send notifications to both agents

//     return updatedJob;
//   }

//   /**
//    * Cancel a marking job
//    */
//   async cancelJob(jobId: string, adminId: string, reason: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     if (job.status === MarkingJobStatus.COMPLETED) {
//       throw new Error('Cannot cancel completed job');
//     }

//     const [updatedJob] = await prisma.$transaction([
//       prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           status: MarkingJobStatus.CANCELLED,
//           completionNotes: reason
//         }
//       }),
//       prisma.adminAction.create({
//         data: {
//           adminId,
//           action: AdminActionType.PROPERTY_REJECTED,
//           targetType: 'PropertyMarkingJob',
//           targetId: jobId,
//           description: `Cancelled marking job`,
//           metadata: { reason }
//         }
//       })
//     ]);

//     // TODO: Send cancellation notifications and process refund if needed

//     return updatedJob;
//   }

//   /**
//    * Review and approve/reject marking completion
//    */
//   async reviewCompletion(jobId: string, approved: boolean, adminId: string, notes?: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         assignedAgent: true,
//         property: true
//       }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     if (job.status !== MarkingJobStatus.COMPLETED) {
//       throw new Error('Job is not in completed status');
//     }

//     if (approved) {
//       // Approve and update property boundary
//       const [updatedJob] = await prisma.$transaction([
//         prisma.propertyMarkingJob.update({
//           where: { id: jobId },
//           data: {
//             completionNotes: notes || job.completionNotes
//           }
//         }),
//         prisma.property.update({
//           where: { id: job.propertyId },
//           data: {
//             boundaryVerified: true,
//             boundaryCoordinates: job.boundaryData,
//             boundaryMarkedBy: job.assignedAgentId,
//             boundaryMarkedAt: new Date(),
//             boundaryImages: job.completionImages
//           }
//         }),
//         prisma.adminAction.create({
//           data: {
//             adminId,
//             action: AdminActionType.PROPERTY_APPROVED,
//             targetType: 'PropertyMarkingJob',
//             targetId: jobId,
//             description: 'Approved marking job completion',
//             metadata: { notes }
//           }
//         })
//       ]);

//       return updatedJob;
//     } else {
//       // Reject and potentially reassign
//       const [updatedJob] = await prisma.$transaction([
//         prisma.propertyMarkingJob.update({
//           where: { id: jobId },
//           data: {
//             status: MarkingJobStatus.QUEUED,
//             assignedAgentId: null,
//             completionNotes: notes,
//             timeSlotExpiry: null
//           }
//         }),
//         prisma.adminAction.create({
//           data: {
//             adminId,
//             action: AdminActionType.PROPERTY_REJECTED,
//             targetType: 'PropertyMarkingJob',
//             targetId: jobId,
//             description: 'Rejected marking job completion',
//             metadata: { notes }
//           }
//         })
//       ]);

//       // TODO: Notify agent of rejection

//       return updatedJob;
//     }
//   }

//   /**
//    * Handle marking disputes
//    */
//   async handleDispute(jobId: string, resolution: DisputeResolution) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         assignedAgent: true,
//         requestingUser: true
//       }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     const actions: any[] = [];

//     // Handle agent compensation if approved
//     if (resolution.compensateAgent && job.assignedAgentId) {
//       const compensationAmount = job.markingFee * 0.25; // 25% of marking fee

//       actions.push(
//         prisma.virtualAccount.update({
//           where: { userId: job.assignedAgentId },
//           data: {
//             balance: {
//               increment: compensationAmount
//             }
//           }
//         })
//       );
//     }

//     // Handle owner refund if approved
//     if (resolution.refundOwner) {
//       actions.push(
//         prisma.virtualAccount.update({
//           where: { userId: job.requestedBy },
//           data: {
//             balance: {
//               increment: job.markingFee
//             }
//           }
//         })
//       );
//     }

//     // Update job status
//     actions.push(
//       prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           completionNotes: `Dispute resolved: ${resolution.resolution}. ${resolution.notes || ''}`
//         }
//       })
//     );

//     // Log admin action
//     actions.push(
//       prisma.adminAction.create({
//         data: {
//           adminId: resolution.adminId,
//           action: AdminActionType.BOUNDARY_DISPUTE_RESOLVED,
//           targetType: 'PropertyMarkingJob',
//           targetId: jobId,
//           description: 'Resolved marking job dispute',
//           metadata: resolution
//         }
//       })
//     );

//     const results = await prisma.$transaction(actions);

//     // TODO: Send notification to both parties

//     return results[results.length - 2]; // Return updated job
//   }

//   /**
//    * Get queue status
//    */
//   async getQueueStatus(location?: string) {
//     const where: any = {
//       status: MarkingJobStatus.QUEUED
//     };

//     if (location) {
//       where.property = {
//         OR: [
//           { city: { contains: location, mode: 'insensitive' } },
//           { state: { contains: location, mode: 'insensitive' } }
//         ]
//       };
//     }

//     const [totalQueued, byUrgency] = await Promise.all([
//       prisma.propertyMarkingJob.count({ where }),
//       prisma.propertyMarkingJob.groupBy({
//         by: ['urgencyLevel'],
//         where,
//         _count: true
//       })
//     ]);

//     // Get average wait time
//     const queuedJobs = await prisma.propertyMarkingJob.findMany({
//       where,
//       select: {
//         createdAt: true
//       }
//     });

//     const now = new Date();
//     const totalWaitTime = queuedJobs.reduce((sum, job) => {
//       return sum + (now.getTime() - job.createdAt.getTime());
//     }, 0);

//     const averageWaitHours = queuedJobs.length > 0 
//       ? (totalWaitTime / queuedJobs.length) / (1000 * 60 * 60)
//       : 0;

//     return {
//       totalQueued,
//       byUrgency: byUrgency.reduce((acc, item) => {
//         acc[item.urgencyLevel] = item._count;
//         return acc;
//       }, {} as Record<string, number>),
//       averageWaitHours: Math.round(averageWaitHours * 10) / 10
//     };
//   }

//   /**
//    * Get expired jobs
//    */
//   async getExpiredJobs(pagination: Pagination) {
//     const { page, limit } = pagination;
//     const skip = (page - 1) * limit;

//     const now = new Date();

//     const where = {
//       status: {
//         in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
//       },
//       OR: [
//         { timeSlotExpiry: { lte: now } },
//         { maxCompletionTime: { lte: now } }
//       ]
//     };

//     const [jobs, total] = await Promise.all([
//       prisma.propertyMarkingJob.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { timeSlotExpiry: 'asc' },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               city: true,
//               state: true
//             }
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true
//             }
//           }
//         }
//       }),
//       prisma.propertyMarkingJob.count({ where })
//     ]);

//     return { jobs, total };
//   }

//   /**
//    * Update job urgency level
//    */
//   async updateJobUrgency(jobId: string, urgencyLevel: UrgencyLevel, adminId: string, reason?: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     const [updatedJob] = await prisma.$transaction([
//       prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: { urgencyLevel }
//       }),
//       prisma.adminAction.create({
//         data: {
//           adminId,
//           action: AdminActionType.PROPERTY_APPROVED,
//           targetType: 'PropertyMarkingJob',
//           targetId: jobId,
//           description: `Updated job urgency to ${urgencyLevel}`,
//           metadata: { 
//             previousUrgency: job.urgencyLevel,
//             newUrgency: urgencyLevel,
//             reason 
//           }
//         }
//       })
//     ]);

//     return updatedJob;
//   }

//   /**
//    * Extend job deadline
//    */
//   async extendJobDeadline(jobId: string, extensionHours: number, adminId: string, reason?: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     const newExpiry = job.timeSlotExpiry 
//       ? new Date(job.timeSlotExpiry.getTime() + (extensionHours * 60 * 60 * 1000))
//       : new Date(Date.now() + (extensionHours * 60 * 60 * 1000));

//     const newMaxCompletion = job.maxCompletionTime
//       ? new Date(job.maxCompletionTime.getTime() + (extensionHours * 60 * 60 * 1000))
//       : null;

//     const [updatedJob] = await prisma.$transaction([
//       prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           timeSlotExpiry: newExpiry,
//           maxCompletionTime: newMaxCompletion
//         }
//       }),
//       prisma.adminAction.create({
//         data: {
//           adminId,
//           action: AdminActionType.PROPERTY_APPROVED,
//           targetType: 'PropertyMarkingJob',
//           targetId: jobId,
//           description: `Extended job deadline by ${extensionHours} hours`,
//           metadata: { extensionHours, reason }
//         }
//       })
//     ]);

//     return updatedJob;
//   }

//   /**
//    * Get job history/timeline
//    */
//   async getJobHistory(jobId: string) {
//     // Get all admin actions related to this job
//     const adminActions = await prisma.adminAction.findMany({
//       where: {
//         targetType: 'PropertyMarkingJob',
//         targetId: jobId
//       },
//       orderBy: { createdAt: 'desc' },
//       include: {
//         admin: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         }
//       }
//     });

//     // Get job details
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         property: true,
//         requestingUser: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         },
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         }
//       }
//     });

//     // Build timeline
//     const timeline = [
//       {
//         event: 'Job Created',
//         timestamp: job?.createdAt,
//         actor: job?.requestingUser,
//         details: {
//           urgencyLevel: job?.urgencyLevel,
//           markingFee: job?.markingFee
//         }
//       },
//       ...adminActions.map(action => ({
//         event: action.action,
//         timestamp: action.createdAt,
//         actor: action.admin,
//         details: action.metadata,
//         description: action.description
//       }))
//     ];

//     if (job?.assignedAt) {
//       timeline.push({
//         event: 'Job Assigned',
//         timestamp: job.assignedAt,
//         actor: job.assignedAgent,
//         details: {
//           timeSlotExpiry: job.timeSlotExpiry
//         }
//       });
//     }

//     if (job?.completedAt) {
//       timeline.push({
//         event: 'Job Completed',
//         timestamp: job.completedAt,
//         actor: job.assignedAgent,
//         details: {
//           completionImages: job.completionImages?.length || 0,
//           boundaryData: !!job.boundaryData
//         }
//       });
//     }

//     // Sort by timestamp descending
//     timeline.sort((a, b) => 
//       (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
//     );

//     return {
//       job,
//       timeline
//     };
//   }

//   /**
//    * Bulk update marking jobs
//    */
//   async bulkUpdateJobs(jobIds: string[], action: string, data: any, adminId: string) {
//     const validActions = ['assign', 'reassign', 'cancel', 'update_urgency', 'extend_deadline'];

//     if (!validActions.includes(action)) {
//       throw new Error(`Invalid bulk action: ${action}`);
//     }

//     const results = [];

//     for (const jobId of jobIds) {
//       try {
//         let result;

//         switch (action) {
//           case 'assign':
//             result = await this.manuallyAssignJob(jobId, data.agentId, adminId, data.notes);
//             break;
//           case 'reassign':
//             result = await this.reassignJob(jobId, data.newAgentId, adminId, data.reason);
//             break;
//           case 'cancel':
//             result = await this.cancelJob(jobId, adminId, data.reason);
//             break;
//           case 'update_urgency':
//             result = await this.updateJobUrgency(jobId, data.urgencyLevel, adminId, data.reason);
//             break;
//           case 'extend_deadline':
//             result = await this.extendJobDeadline(jobId, data.extensionHours, adminId, data.reason);
//             break;
//         }

//         results.push({
//           jobId,
//           success: true,
//           data: result
//         });
//       } catch (error) {
//         results.push({
//           jobId,
//           success: false,
//           error: error instanceof Error ? error.message : 'Unknown error'
//         });
//       }
//     }

//     return {
//       total: jobIds.length,
//       successful: results.filter(r => r.success).length,
//       failed: results.filter(r => !r.success).length,
//       results
//     };
//   }
// }

// export const markingOversightService = new MarkingOversightService();





















// // backend/admin-service/src/services/markingOversightService.ts

// import { PrismaClient, MarkingJobStatus, AdminActionType } from '@newcondo/db';
// import { adminService } from './adminService';
// import { notificationService } from './notificationService';

// const prisma = new PrismaClient();

// interface MarkingJobFilters {
//   status?: MarkingJobStatus;
//   state?: string;
//   city?: string;
//   agentId?: string;
//   dateFrom?: Date;
//   dateTo?: Date;
//   page?: number;
//   limit?: number;
// }

// interface JobQualityReview {
//   jobId: string;
//   quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
//   adminId: string;
//   feedback: string;
//   action?: 'APPROVE' | 'REJECT' | 'REQUEST_REDO';
// }

// class MarkingOversightService {
//   /**
//    * Get all marking jobs for oversight
//    */
//   async getMarkingJobs(adminId: string, filters: MarkingJobFilters = {}) {
//     await adminService.verifyAdminAccess(adminId);

//     const {
//       status,
//       state,
//       city,
//       agentId,
//       dateFrom,
//       dateTo,
//       page = 1,
//       limit = 20
//     } = filters;

//     const where: any = {};

//     if (status) where.status = status;
//     if (agentId) where.assignedAgentId = agentId;

//     if (dateFrom || dateTo) {
//       where.createdAt = {};
//       if (dateFrom) where.createdAt.gte = dateFrom;
//       if (dateTo) where.createdAt.lte = dateTo;
//     }

//     // Location filter requires join
//     if (state || city) {
//       where.property = {};
//       if (state) where.property.state = state;
//       if (city) where.property.city = city;
//     }

//     const [jobs, total] = await Promise.all([
//       prisma.propertyMarkingJob.findMany({
//         where,
//         skip: (page - 1) * limit,
//         take: limit,
//         orderBy: { createdAt: 'desc' },
//         include: {
//           property: {
//             include: {
//               owner: {
//                 select: {
//                   id: true,
//                   name: true,
//                   email: true,
//                   phone: true
//                 }
//               },
//               images: {
//                 where: { isPrimary: true },
//                 take: 1
//               }
//             }
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true
//             }
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               agentReliabilityScore: true,
//               totalMarkingJobs: true,
//               completedMarkingJobs: true
//             }
//           }
//         }
//       }),
//       prisma.propertyMarkingJob.count({ where })
//     ]);

//     return {
//       jobs,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit)
//       }
//     };
//   }

//   /**
//    * Get detailed marking job information
//    */
//   async getMarkingJobDetails(adminId: string, jobId: string) {
//     await adminService.verifyAdminAccess(adminId);

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         property: {
//           include: {
//             owner: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true,
//                 verificationStatus: true
//               }
//             },
//             images: true,
//             documents: true
//           }
//         },
//         requestingUser: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             phone: true
//           }
//         },
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             phone: true,
//             agentReliabilityScore: true,
//             totalMarkingJobs: true,
//             completedMarkingJobs: true,
//             agentServiceAreas: true
//           }
//         }
//       }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     // Get agent's recent job history
//     const agentHistory = job.assignedAgentId
//       ? await this.getAgentJobHistory(job.assignedAgentId, 10)
//       : null;

//     // Quality assessment
//     const qualityMetrics = this.assessJobQuality(job);

//     return {
//       job,
//       agentHistory,
//       qualityMetrics
//     };
//   }

//   /**
//    * Get agent job history
//    */
//   private async getAgentJobHistory(agentId: string, limit: number = 10) {
//     return prisma.propertyMarkingJob.findMany({
//       where: {
//         assignedAgentId: agentId,
//         status: 'COMPLETED'
//       },
//       take: limit,
//       orderBy: { completedAt: 'desc' },
//       select: {
//         id: true,
//         status: true,
//         createdAt: true,
//         completedAt: true,
//         markingFee: true,
//         property: {
//           select: {
//             title: true,
//             city: true,
//             state: true
//           }
//         }
//       }
//     });
//   }

//   /**
//    * Assess job quality
//    */
//   private assessJobQuality(job: any) {
//     const metrics: any = {
//       hasCompletionImages: job.completionImages && job.completionImages.length > 0,
//       imageCount: job.completionImages ? job.completionImages.length : 0,
//       hasBoundaryData: !!job.boundaryData,
//       hasCompletionNotes: !!job.completionNotes,
//       completionTimeHours: null,
//       withinTimeLimit: null
//     };

//     if (job.completedAt) {
//       const timeDiff = job.completedAt.getTime() - job.createdAt.getTime();
//       metrics.completionTimeHours = timeDiff / (1000 * 60 * 60);
      
//       // 3-hour time limit
//       metrics.withinTimeLimit = metrics.completionTimeHours <= 3;
//     }

//     // Calculate quality score
//     let qualityScore = 0;
//     if (metrics.hasCompletionImages) qualityScore += 25;
//     if (metrics.imageCount >= 5) qualityScore += 25;
//     if (metrics.hasBoundaryData) qualityScore += 25;
//     if (metrics.withinTimeLimit) qualityScore += 25;

//     metrics.qualityScore = qualityScore;
//     metrics.qualityRating = this.getQualityRating(qualityScore);

//     return metrics;
//   }

//   /**
//    * Get quality rating from score
//    */
//   private getQualityRating(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
//     if (score >= 90) return 'EXCELLENT';
//     if (score >= 70) return 'GOOD';
//     if (score >= 50) return 'FAIR';
//     return 'POOR';
//   }

//   /**
//    * Review marking job quality
//    */
//   async reviewJobQuality(review: JobQualityReview) {
//     const { jobId, quality, adminId, feedback, action } = review;

//     await adminService.verifyAdminAccess(adminId);

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             agentReliabilityScore: true,
//             totalMarkingJobs: true,
//             completedMarkingJobs: true
//           }
//         },
//         requestingUser: {
//           select: {
//             id: true,
//             email: true,
//             name: true
//           }
//         }
//       }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     // Update agent reliability score
//     if (job.assignedAgent) {
//       await this.updateAgentReliabilityScore(
//         job.assignedAgent.id,
//         quality
//       );
//     }

//     // Execute action
//     if (action) {
//       await this.executeOversightAction(jobId, action, adminId, feedback);
//     }

//     // Log admin action
//     await adminService.logAction(
//       adminId,
//       AdminActionType.AGENT_SUSPENDED,
//       'PropertyMarkingJob',
//       jobId,
//       `Marking job reviewed: ${quality}`,
//       { quality, feedback, action }
//     );

//     // Send notification to agent
//     if (job.assignedAgent?.email) {
//       await notificationService.sendJobQualityFeedback({
//         userId: job.assignedAgent.id,
//         email: job.assignedAgent.email,
//         name: job.assignedAgent.name || 'Agent',
//         quality,
//         feedback,
//         jobId
//       });
//     }

//     return { success: true };
//   }

//   /**
//    * Update agent reliability score
//    */
//   private async updateAgentReliabilityScore(
//     agentId: string,
//     quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
//   ) {
//     const agent = await prisma.user.findUnique({
//       where: { id: agentId },
//       select: {
//         agentReliabilityScore: true,
//         completedMarkingJobs: true
//       }
//     });

//     if (!agent) return;

//     // Quality to score mapping
//     const qualityScores = {
//       EXCELLENT: 5.0,
//       GOOD: 4.0,
//       FAIR: 3.0,
//       POOR: 2.0
//     };

//     const newScore = qualityScores[quality];
//     const currentScore = Number(agent.agentReliabilityScore || 0);
//     const completedJobs = agent.completedMarkingJobs;

//     // Calculate weighted average (gives more weight to recent performance)
//     const updatedScore = completedJobs === 0
//       ? newScore
//       : (currentScore * completedJobs + newScore) / (completedJobs + 1);

//     await prisma.user.update({
//       where: { id: agentId },
//       data: {
//         agentReliabilityScore: Math.round(updatedScore * 100) / 100
//       }
//     });
//   }

//   /**
//    * Execute oversight action
//    */
//   private async executeOversightAction(
//     jobId: string,
//     action: 'APPROVE' | 'REJECT' | 'REQUEST_REDO',
//     adminId: string,
//     feedback: string
//   ) {
//     switch (action) {
//       case 'APPROVE':
//         // Mark job as completed if not already
//         await prisma.propertyMarkingJob.update({
//           where: { id: jobId },
//           data: {
//             status: 'COMPLETED',
//             completionNotes: `${feedback} [Admin approved]`
//           }
//         });
//         break;

//       case 'REJECT':
//         // Mark job as cancelled
//         await prisma.propertyMarkingJob.update({
//           where: { id: jobId },
//           data: {
//             status: 'CANCELLED',
//             completionNotes: `${feedback} [Admin rejected]`
//           }
//         });
//         break;

//       case 'REQUEST_REDO':
//         // Reset job to assigned status
//         await prisma.propertyMarkingJob.update({
//           where: { id: jobId },
//           data: {
//             status: 'ASSIGNED',
//             completionNotes: `${feedback} [Admin requested redo]`
//           }
//         });
//         break;
//     }
//   }

//   /**
//    * Get marking job statistics
//    */
//   async getMarkingJobStats(adminId: string) {
//     await adminService.verifyAdminAccess(adminId);

//     const [queued, assigned, inProgress, completed, cancelled, expired] = await Promise.all([
//       prisma.propertyMarkingJob.count({ where: { status: 'QUEUED' } }),
//       prisma.propertyMarkingJob.count({ where: { status: 'ASSIGNED' } }),
//       prisma.propertyMarkingJob.count({ where: { status: 'IN_PROGRESS' } }),
//       prisma.propertyMarkingJob.count({ where: { status: 'COMPLETED' } }),
//       prisma.propertyMarkingJob.count({ where: { status: 'CANCELLED' } }),
//       prisma.propertyMarkingJob.count({ where: { status: 'EXPIRED' } })
//     ]);

//     // Get jobs by location
//     const jobsByLocation = await prisma.propertyMarkingJob.findMany({
//       include: {
//         property: {
//           select: {
//             state: true,
//             city: true
//           }
//         }
//       }
//     });

//     const locationCounts = jobsByLocation.reduce((acc, job) => {
//       const key = `${job.property.city}, ${job.property.state}`;
//       acc[key] = (acc[key] || 0) + 1;
//       return acc;
//     }, {} as Record<string, number>);

//     // Calculate average completion time
//     const completedJobs = await prisma.propertyMarkingJob.findMany({
//       where: {
//         status: 'COMPLETED',
//         completedAt: { not: null }
//       },
//       select: {
//         createdAt: true,
//         completedAt: true
//       },
//       take: 100,
//       orderBy: { completedAt: 'desc' }
//     });

//     const avgCompletionTime = completedJobs.length > 0
//       ? completedJobs.reduce((sum, job) => {
//           const timeDiff = job.completedAt!.getTime() - job.createdAt.getTime();
//           return sum + timeDiff;
//         }, 0) / completedJobs.length / (1000 * 60 * 60)
//       : 0;

//     return {
//       counts: {
//         queued,
//         assigned,
//         inProgress,
//         completed,
//         cancelled,
//         expired,
//         total: queued + assigned + inProgress + completed + cancelled + expired
//       },
//       topLocations: Object.entries(locationCounts)
//         .map(([location, count]) => ({ location, count }))
//         .sort((a, b) => b.count - a.count)
//         .slice(0, 10),
//       avgCompletionTimeHours: Math.round(avgCompletionTime * 100) / 100
//     };
//   }

//   /**
//    * Flag problematic marking job
//    */
//   async flagJob(adminId: string, jobId: string, reason: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM') {
//     await adminService.verifyAdminAccess(adminId);

//     // Log the flag
//     await adminService.logAction(
//       adminId,
//       AdminActionType.AGENT_SUSPENDED,
//       'PropertyMarkingJob',
//       jobId,
//       `Job flagged: ${reason}`,
//       { priority }
//     );

//     return { success: true };
//   }

//   /**
//    * Reassign marking job
//    */
//   async reassignJob(adminId: string, jobId: string, newAgentId: string, reason: string) {
//     await adminService.verifyAdminAccess(adminId);

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       select: {
//         assignedAgentId: true
//       }
//     });

//     if (!job) {
//       throw new Error('Marking job not found');
//     }

//     // Verify new agent exists and is available
//     const newAgent = await prisma.user.findUnique({
//       where: { id: newAgentId },
//       select: {
//         role: true,
//         isAvailableForMarking: true
//       }
//     });

//     if (!newAgent || newAgent.role !== 'AGENT' || !newAgent.isAvailableForMarking) {
//       throw new Error('Invalid agent or agent not available');
//     }

//     // Reassign job
//     await prisma.propertyMarkingJob.update({
//       where: { id: jobId },
//       data: {
//         assignedAgentId: newAgentId,
//         status: 'ASSIGNED',
//         assignedAt: new Date(),
//         timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
//       }
//     });

//     // Log action
//     await adminService.logAction(
//       adminId,
//       AdminActionType.AGENT_SUSPENDED,
//       'PropertyMarkingJob',
//       jobId,
//       `Job reassigned: ${reason}`,
//       { oldAgentId: job.assignedAgentId, newAgentId, reason }
//     );

//     return { success: true };
//   }
// }

// export const markingOversightService = new MarkingOversightService();