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


// // backend/marking-service/src/services/markingJobService.ts

// import { PrismaClient, MarkingJobStatus, UrgencyLevel } from '@newcondo/db';
// import { AppError } from '../../../shared/src/utils/response';
// import { logger } from '../../../shared/src/middleware/logger';

// interface CreateMarkingJobInput {
//   propertyId: string;
//   requestedBy: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel?: UrgencyLevel;
//   markingFee: number;
// }

// interface UpdateMarkingJobInput {
//   id: string;
//   completionNotes?: string;
//   completionImages?: string[];
//   boundaryData?: Record<string, any>;
//   status?: MarkingJobStatus;
// }

// class MarkingJobService {
//   private prisma: PrismaClient;

//   constructor(prisma: PrismaClient) {
//     this.prisma = prisma;
//   }

//   /**
//    * Create a new marking job request
//    */
//   async createMarkingJob(input: CreateMarkingJobInput) {
//     try {
//       // Validate property exists and belongs to requester
//       const property = await this.prisma.property.findUnique({
//         where: { id: input.propertyId },
//       });

//       if (!property) {
//         throw new AppError('Property not found', 404);
//       }

//       // Verify requester is owner or authorized agent
//       const user = await this.prisma.user.findUnique({
//         where: { id: input.requestedBy },
//       });

//       if (!user) {
//         throw new AppError('User not found', 404);
//       }

//       if (property.ownerId !== input.requestedBy && property.agentId !== input.requestedBy) {
//         throw new AppError('Not authorized to request marking for this property', 403);
//       }

//       // Create marking job
//       const markingJob = await this.prisma.propertyMarkingJob.create({
//         data: {
//           propertyId: input.propertyId,
//           requestedBy: input.requestedBy,
//           contactPersonName: input.contactPersonName,
//           contactPersonPhone: input.contactPersonPhone,
//           accessInstructions: input.accessInstructions,
//           preferredTime: input.preferredTime,
//           urgencyLevel: input.urgencyLevel || UrgencyLevel.NORMAL,
//           markingFee: input.markingFee,
//           status: MarkingJobStatus.QUEUED,
//           maxCompletionTime: this.calculateMaxCompletionTime(),
//         },
//         include: {
//           property: true,
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//             },
//           },
//         },
//       });

//       logger.info('Marking job created', {
//         jobId: markingJob.id,
//         propertyId: input.propertyId,
//         requestedBy: input.requestedBy,
//       });

//       return markingJob;
//     } catch (error) {
//       logger.error('Error creating marking job', { error, input });
//       throw error;
//     }
//   }

//   /**
//    * Get marking job details
//    */
//   async getMarkingJob(jobId: string) {
//     try {
//       const markingJob = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
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
//               email: true,
//               phone: true,
//             },
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               agentReliabilityScore: true,
//             },
//           },
//         },
//       });

//       if (!markingJob) {
//         throw new AppError('Marking job not found', 404);
//       }

//       return markingJob;
//     } catch (error) {
//       logger.error('Error fetching marking job', { error, jobId });
//       throw error;
//     }
//   }

//   /**
//    * Update marking job details
//    */
//   async updateMarkingJob(input: UpdateMarkingJobInput) {
//     try {
//       const markingJob = await this.prisma.propertyMarkingJob.update({
//         where: { id: input.id },
//         data: {
//           ...(input.completionNotes && { completionNotes: input.completionNotes }),
//           ...(input.completionImages && { completionImages: input.completionImages }),
//           ...(input.boundaryData && { boundaryData: input.boundaryData }),
//           ...(input.status && { status: input.status }),
//           ...(input.status === MarkingJobStatus.COMPLETED && {
//             completedAt: new Date(),
//           }),
//         },
//         include: {
//           property: true,
//           requestingUser: true,
//           assignedAgent: true,
//         },
//       });

//       logger.info('Marking job updated', { jobId: input.id, status: input.status });

//       return markingJob;
//     } catch (error) {
//       logger.error('Error updating marking job', { error, input });
//       throw error;
//     }
//   }

//   /**
//    * Get all marking jobs for a property owner
//    */
//   async getPropertyOwnerMarkingJobs(userId: string, filters?: {
//     status?: MarkingJobStatus;
//     limit?: number;
//     offset?: number;
//   }) {
//     try {
//       const limit = filters?.limit || 10;
//       const offset = filters?.offset || 0;

//       const jobs = await this.prisma.propertyMarkingJob.findMany({
//         where: {
//           requestedBy: userId,
//           ...(filters?.status && { status: filters.status }),
//         },
//         include: {
//           property: true,
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               agentReliabilityScore: true,
//             },
//           },
//         },
//         take: limit,
//         skip: offset,
//         orderBy: { createdAt: 'desc' },
//       });

//       const total = await this.prisma.propertyMarkingJob.count({
//         where: {
//           requestedBy: userId,
//           ...(filters?.status && { status: filters.status }),
//         },
//       });

//       return { jobs, total, limit, offset };
//     } catch (error) {
//       logger.error('Error fetching marking jobs', { error, userId });
//       throw error;
//     }
//   }

//   /**
//    * Get all marking jobs for an agent
//    */
//   async getAgentMarkingJobs(agentId: string, filters?: {
//     status?: MarkingJobStatus;
//     limit?: number;
//     offset?: number;
//   }) {
//     try {
//       const limit = filters?.limit || 10;
//       const offset = filters?.offset || 0;

//       const jobs = await this.prisma.propertyMarkingJob.findMany({
//         where: {
//           assignedAgentId: agentId,
//           ...(filters?.status && { status: filters.status }),
//         },
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
//               email: true,
//               phone: true,
//             },
//           },
//         },
//         take: limit,
//         skip: offset,
//         orderBy: { createdAt: 'desc' },
//       });

//       const total = await this.prisma.propertyMarkingJob.count({
//         where: {
//           assignedAgentId: agentId,
//           ...(filters?.status && { status: filters.status }),
//         },
//       });

//       return { jobs, total, limit, offset };
//     } catch (error) {
//       logger.error('Error fetching agent marking jobs', { error, agentId });
//       throw error;
//     }
//   }

//   /**
//    * Cancel a marking job
//    */
//   async cancelMarkingJob(jobId: string, reason: string) {
//     try {
//       const markingJob = await this.prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           status: MarkingJobStatus.CANCELLED,
//           completionNotes: reason,
//         },
//       });

//       logger.info('Marking job cancelled', { jobId, reason });

//       return markingJob;
//     } catch (error) {
//       logger.error('Error cancelling marking job', { error, jobId });
//       throw error;
//     }
//   }

//   /**
//    * Helper: Calculate max completion time (3 days from now)
//    */
//   private calculateMaxCompletionTime(): Date {
//     const now = new Date();
//     return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
//   }
// }

// export default MarkingJobService;











// // backend/marking-service/src/services/markingJobService.ts
// import { PrismaClient } from '@newcondo/db';
// import { MarkingJobStatus, PaymentStatus, UrgencyLevel } from '@newcondo/db';
// import { logger } from '../middleware/logger';
// import { AppError } from '../middleware/errorHandler';

// interface CreateMarkingJobDTO {
//   propertyId: string;
//   requestedBy: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel?: UrgencyLevel;
//   markingFee: number;
// }

// interface MarkingJobUpdate {
//   assignedAgentId?: string;
//   status?: MarkingJobStatus;
//   completionNotes?: string;
//   completionImages?: string[];
//   boundaryData?: Record<string, any>;
// }

// export class MarkingJobService {
//   constructor(private prisma: PrismaClient) {}

//   /**
//    * Create a new marking job
//    */
//   async createMarkingJob(data: CreateMarkingJobDTO) {
//     try {
//       // Verify property exists and belongs to requester
//       const property = await this.prisma.property.findUnique({
//         where: { id: data.propertyId },
//       });

//       if (!property) {
//         throw new AppError('Property not found', 404);
//       }

//       // Only property owners and agents can request marking jobs
//       const user = await this.prisma.user.findUnique({
//         where: { id: data.requestedBy },
//       });

//       if (!user || (user.role !== 'OWNER' && user.role !== 'AGENT')) {
//         throw new AppError('Only property owners and agents can request marking jobs', 403);
//       }

//       // Verify ownership or agent relationship
//       if (property.ownerId !== data.requestedBy && property.agentId !== data.requestedBy) {
//         throw new AppError('User not authorized for this property', 403);
//       }

//       // Check if there's an active/pending marking job for this property
//       const existingJob = await this.prisma.propertyMarkingJob.findFirst({
//         where: {
//           propertyId: data.propertyId,
//           status: {
//             in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
//           },
//         },
//       });

//       if (existingJob) {
//         throw new AppError('An active marking job already exists for this property', 409);
//       }

//       // Calculate max completion time (3 days from now)
//       const maxCompletionTime = new Date();
//       maxCompletionTime.setDate(maxCompletionTime.getDate() + 3);

//       // Create marking job
//       const markingJob = await this.prisma.propertyMarkingJob.create({
//         data: {
//           propertyId: data.propertyId,
//           requestedBy: data.requestedBy,
//           contactPersonName: data.contactPersonName,
//           contactPersonPhone: data.contactPersonPhone,
//           accessInstructions: data.accessInstructions,
//           preferredTime: data.preferredTime,
//           urgencyLevel: data.urgencyLevel || UrgencyLevel.NORMAL,
//           markingFee: data.markingFee,
//           paymentStatus: PaymentStatus.PENDING,
//           status: MarkingJobStatus.QUEUED,
//           maxCompletionTime,
//         },
//         include: {
//           property: true,
//           requestingUser: true,
//         },
//       });

//       logger.info(`Marking job created: ${markingJob.id} for property ${data.propertyId}`);

//       return markingJob;
//     } catch (error) {
//       logger.error('Error creating marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get marking job details
//    */
//   async getMarkingJob(jobId: string) {
//     try {
//       const job = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: {
//           property: true,
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//             },
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               agentReliabilityScore: true,
//               completedMarkingJobs: true,
//             },
//           },
//         },
//       });

//       if (!job) {
//         throw new AppError('Marking job not found', 404);
//       }

//       return job;
//     } catch (error) {
//       logger.error('Error fetching marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get all marking jobs for a property owner
//    */
//   async getMarkingJobsByOwner(userId: string) {
//     try {
//       const jobs = await this.prisma.propertyMarkingJob.findMany({
//         where: {
//           requestedBy: userId,
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               city: true,
//             },
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       });

//       return jobs;
//     } catch (error) {
//       logger.error('Error fetching marking jobs for owner:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get all marking jobs assigned to an agent
//    */
//   async getMarkingJobsByAgent(agentId: string) {
//     try {
//       const jobs = await this.prisma.propertyMarkingJob.findMany({
//         where: {
//           assignedAgentId: agentId,
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               city: true,
//               gpsCoordinates: true,
//             },
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               phone: true,
//               email: true,
//             },
//           },
//         },
//         orderBy: {
//           assignedAt: 'desc',
//         },
//       });

//       return jobs;
//     } catch (error) {
//       logger.error('Error fetching marking jobs for agent:', error);
//       throw error;
//     }
//   }

//   /**
//    * Update marking job status
//    */
//   async updateMarkingJob(jobId: string, updates: MarkingJobUpdate) {
//     try {
//       const job = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//       });

//       if (!job) {
//         throw new AppError('Marking job not found', 404);
//       }

//       // Validate state transitions
//       if (updates.status) {
//         this.validateStatusTransition(job.status, updates.status);
//       }

//       const updateData: any = { ...updates };

//       // If transitioning to IN_PROGRESS, set the start time
//       if (updates.status === MarkingJobStatus.IN_PROGRESS && job.status !== MarkingJobStatus.IN_PROGRESS) {
//         updateData.assignedAt = new Date();
//       }

//       // If transitioning to COMPLETED, set the completion time
//       if (updates.status === MarkingJobStatus.COMPLETED) {
//         updateData.completedAt = new Date();
//       }

//       const updatedJob = await this.prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: updateData,
//         include: {
//           property: true,
//           assignedAgent: true,
//           requestingUser: true,
//         },
//       });

//       logger.info(`Marking job ${jobId} updated to status ${updates.status}`);

//       return updatedJob;
//     } catch (error) {
//       logger.error('Error updating marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Complete marking job with boundary data and images
//    */
//   async completeMarkingJob(jobId: string, data: {
//     boundaryData: Record<string, any>;
//     completionImages: string[];
//     completionNotes?: string;
//   }) {
//     try {
//       const job = await this.getMarkingJob(jobId);

//       if (job.status === MarkingJobStatus.COMPLETED) {
//         throw new AppError('Marking job already completed', 409);
//       }

//       // Update property with boundary data
//       await this.prisma.property.update({
//         where: { id: job.propertyId },
//         data: {
//           boundaryCoordinates: data.boundaryData,
//           boundaryMarkedBy: job.assignedAgentId,
//           boundaryMarkedAt: new Date(),
//           boundaryImages: data.completionImages,
//           boundaryVerified: false, // Awaiting property owner confirmation
//         },
//       });

//       // Update marking job
//       const completedJob = await this.updateMarkingJob(jobId, {
//         status: MarkingJobStatus.COMPLETED,
//         boundaryData: data.boundaryData,
//         completionImages: data.completionImages,
//         completionNotes: data.completionNotes,
//       });

//       logger.info(`Marking job ${jobId} completed with boundary data`);

//       return completedJob;
//     } catch (error) {
//       logger.error('Error completing marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Validate job completion (property owner confirmation)
//    */
//   async validateMarkingJob(jobId: string, isValid: boolean) {
//     try {
//       const job = await this.getMarkingJob(jobId);

//       if (job.status !== MarkingJobStatus.COMPLETED) {
//         throw new AppError('Can only validate completed marking jobs', 409);
//       }

//       if (isValid) {
//         // Mark boundary as verified
//         await this.prisma.property.update({
//           where: { id: job.propertyId },
//           data: {
//             boundaryVerified: true,
//           },
//         });

//         logger.info(`Marking job ${jobId} validated by property owner`);
//         return { validated: true, message: 'Property marking validated successfully' };
//       } else {
//         // Reset marking job for re-assignment
//         const resetJob = await this.prisma.propertyMarkingJob.update({
//           where: { id: jobId },
//           data: {
//             status: MarkingJobStatus.QUEUED,
//             assignedAgentId: null,
//             assignedAt: null,
//             completedAt: null,
//             boundaryData: null,
//             completionImages: [],
//             completionNotes: null,
//           },
//         });

//         logger.info(`Marking job ${jobId} reset for re-marking`);
//         return { validated: false, message: 'Property marking rejected, reset for re-assignment' };
//       }
//     } catch (error) {
//       logger.error('Error validating marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Cancel marking job
//    */
//   async cancelMarkingJob(jobId: string, reason: string) {
//     try {
//       const job = await this.getMarkingJob(jobId);

//       if ([MarkingJobStatus.COMPLETED, MarkingJobStatus.CANCELLED, MarkingJobStatus.EXPIRED].includes(job.status)) {
//         throw new AppError(`Cannot cancel job with status ${job.status}`, 409);
//       }

//       const cancelledJob = await this.prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           status: MarkingJobStatus.CANCELLED,
//           completionNotes: `Cancelled: ${reason}`,
//         },
//       });

//       logger.info(`Marking job ${jobId} cancelled: ${reason}`);

//       return cancelledJob;
//     } catch (error) {
//       logger.error('Error cancelling marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get marking jobs by status
//    */
//   async getMarkingJobsByStatus(status: MarkingJobStatus) {
//     try {
//       const jobs = await this.prisma.propertyMarkingJob.findMany({
//         where: { status },
//         include: {
//           property: true,
//           assignedAgent: true,
//           requestingUser: true,
//         },
//         orderBy: {
//           createdAt: 'asc',
//         },
//       });

//       return jobs;
//     } catch (error) {
//       logger.error('Error fetching marking jobs by status:', error);
//       throw error;
//     }
//   }

//   /**
//    * Validate marking job status transitions
//    */
//   private validateStatusTransition(currentStatus: MarkingJobStatus, newStatus: MarkingJobStatus): void {
//     const validTransitions: Record<MarkingJobStatus, MarkingJobStatus[]> = {
//       [MarkingJobStatus.QUEUED]: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.CANCELLED],
//       [MarkingJobStatus.ASSIGNED]: [MarkingJobStatus.IN_PROGRESS, MarkingJobStatus.CANCELLED],
//       [MarkingJobStatus.IN_PROGRESS]: [MarkingJobStatus.COMPLETED, MarkingJobStatus.CANCELLED],
//       [MarkingJobStatus.COMPLETED]: [MarkingJobStatus.QUEUED], // For re-marking
//       [MarkingJobStatus.CANCELLED]: [],
//       [MarkingJobStatus.EXPIRED]: [MarkingJobStatus.QUEUED], // Re-queue after expiry
//     };

//     if (!validTransitions[currentStatus]?.includes(newStatus)) {
//       throw new AppError(`Cannot transition from ${currentStatus} to ${newStatus}`, 409);
//     }
//   }
// }