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



// // backend/marking-service/src/services/assignmentService.ts
// import { PrismaClient } from '@newcondo/db';
// import { NotificationService } from './notificationService';
// import { ProximityService } from './proximityService';
// import { QueueService } from './queueService';
// import { TimeSlotService } from './timeSlotService';
// import { Logger } from '../utils/logger';

// interface AssignmentResult {
//   success: boolean;
//   assignedAgentId?: string;
//   message: string;
//   queuePosition?: number;
// }

// interface QueuedAgent {
//   agentId: string;
//   distance: number; // in km
//   queuePosition: number;
//   assignedAt: Date;
//   timeSlotExpiry: Date;
// }

// export class AssignmentService {
//   private prisma: PrismaClient;
//   private notificationService: NotificationService;
//   private proximityService: ProximityService;
//   private queueService: QueueService;
//   private timeSlotService: TimeSlotService;
//   private logger: Logger;

//   constructor(
//     prisma: PrismaClient,
//     notificationService: NotificationService,
//     proximityService: ProximityService,
//     queueService: QueueService,
//     timeSlotService: TimeSlotService,
//     logger: Logger
//   ) {
//     this.prisma = prisma;
//     this.notificationService = notificationService;
//     this.proximityService = proximityService;
//     this.queueService = queueService;
//     this.timeSlotService = timeSlotService;
//     this.logger = logger;
//   }

//   /**
//    * Assign marking job to first available agent in queue
//    */
//   async assignToFirstAvailable(
//     markingJobId: string,
//     propertyId: string
//   ): Promise<AssignmentResult> {
//     try {
//       const markingJob = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: {
//           property: true,
//           requestingUser: true,
//         },
//       });

//       if (!markingJob) {
//         return {
//           success: false,
//           message: 'Marking job not found',
//         };
//       }

//       // Get first agent from queue
//       const nextAgent = await this.queueService.getNextAgentInQueue(
//         markingJobId
//       );

//       if (!nextAgent) {
//         return {
//           success: false,
//           message: 'No agents available in proximity',
//         };
//       }

//       // Assign the job
//       const timeSlotExpiry = this.timeSlotService.calculateTimeSlotExpiry();
//       const maxCompletionTime = this.timeSlotService.calculateMaxCompletionTime();

//       const updatedJob = await this.prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           assignedAgentId: nextAgent.agentId,
//           status: 'ASSIGNED',
//           assignedAt: new Date(),
//           timeSlotExpiry,
//           maxCompletionTime,
//         },
//         include: {
//           assignedAgent: true,
//           property: true,
//           requestingUser: true,
//         },
//       });

//       // Remove agent from queue
//       await this.queueService.removeAgentFromQueue(markingJobId, nextAgent.agentId);

//       // Send notification to assigned agent
//       await this.notificationService.notifyAgentAssignment(
//         nextAgent.agentId,
//         markingJob,
//         timeSlotExpiry
//       );

//       // Send notification to property owner
//       await this.notificationService.notifyOwnerAgentAssigned(
//         markingJob.requestedBy,
//         markingJob,
//         nextAgent.agentId
//       );

//       this.logger.info(
//         `Marking job ${markingJobId} assigned to agent ${nextAgent.agentId}`
//       );

//       return {
//         success: true,
//         assignedAgentId: nextAgent.agentId,
//         message: 'Agent assigned successfully',
//       };
//     } catch (error) {
//       this.logger.error('Error assigning marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Find and queue available agents within proximity
//    */
//   async findAndQueueProximityAgents(
//     propertyId: string,
//     markingJobId: string,
//     maxDistance: number = 5 // km
//   ): Promise<QueuedAgent[]> {
//     try {
//       const property = await this.prisma.property.findUnique({
//         where: { id: propertyId },
//       });

//       if (!property || !property.gpsCoordinates) {
//         this.logger.warn(
//           `Property ${propertyId} has no GPS coordinates`
//         );
//         return [];
//       }

//       // Parse GPS coordinates
//       const { lat, lng } = JSON.parse(property.gpsCoordinates);

//       // Find agents within proximity
//       const availableAgents = await this.prisma.user.findMany({
//         where: {
//           role: 'AGENT',
//           isAvailableForMarking: true,
//           isPremium: true, // Only premium agents can mark
//         },
//         select: {
//           id: true,
//           agentServiceAreas: true,
//           city: true,
//           state: true,
//         },
//       });

//       // Filter agents by proximity and service area
//       const proximateAgents = await Promise.all(
//         availableAgents.map(async (agent) => {
//           const distance = await this.proximityService.calculateDistance(
//             { lat, lng },
//             agent
//           );

//           const inServiceArea = this.proximityService.isInServiceArea(
//             property.city,
//             property.state,
//             agent.agentServiceAreas
//           );

//           return {
//             agentId: agent.id,
//             distance,
//             inServiceArea,
//           };
//         })
//       );

//       // Filter and sort by distance
//       const qualifiedAgents = proximateAgents
//         .filter(
//           (agent) =>
//             agent.inServiceArea && agent.distance <= maxDistance
//         )
//         .sort((a, b) => a.distance - b.distance);

//       // Queue agents
//       const queuedAgents: QueuedAgent[] = [];

//       for (let i = 0; i < qualifiedAgents.length; i++) {
//         const agent = qualifiedAgents[i];
//         const queuePosition = i + 1;

//         await this.queueService.addAgentToQueue(
//           markingJobId,
//           agent.agentId,
//           queuePosition
//         );

//         const timeSlotExpiry = this.timeSlotService.calculateTimeSlotExpiry();

//         queuedAgents.push({
//           agentId: agent.agentId,
//           distance: agent.distance,
//           queuePosition,
//           assignedAt: new Date(),
//           timeSlotExpiry,
//         });

//         // Notify agent of queued job
//         await this.notificationService.notifyAgentQueuedForJob(
//           agent.agentId,
//           markingJobId,
//           queuePosition,
//           propertyId
//         );
//       }

//       this.logger.info(
//         `${queuedAgents.length} agents queued for marking job ${markingJobId}`
//       );

//       return queuedAgents;
//     } catch (error) {
//       this.logger.error('Error finding and queuing proximity agents:', error);
//       throw error;
//     }
//   }

//   /**
//    * Reassign job to next agent if current agent fails to complete
//    */
//   async reassignToNextAgent(
//     markingJobId: string
//   ): Promise<AssignmentResult> {
//     try {
//       const markingJob = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//       });

//       if (!markingJob) {
//         return {
//           success: false,
//           message: 'Marking job not found',
//         };
//       }

//       // Increment queue position for current agent
//       await this.queueService.incrementQueuePosition(markingJobId);

//       // Assign to next available agent
//       return await this.assignToFirstAvailable(
//         markingJobId,
//         markingJob.propertyId
//       );
//     } catch (error) {
//       this.logger.error('Error reassigning marking job:', error);
//       throw error;
//     }
//   }

//   /**
//    * Manually assign job to specific agent (admin/owner action)
//    */
//   async manuallyAssignAgent(
//     markingJobId: string,
//     agentId: string
//   ): Promise<AssignmentResult> {
//     try {
//       // Verify agent is available and qualified
//       const agent = await this.prisma.user.findUnique({
//         where: { id: agentId },
//         select: {
//           id: true,
//           isAvailableForMarking: true,
//           isPremium: true,
//           role: true,
//         },
//       });

//       if (
//         !agent ||
//         agent.role !== 'AGENT' ||
//         !agent.isAvailableForMarking ||
//         !agent.isPremium
//       ) {
//         return {
//           success: false,
//           message: 'Agent is not available or not qualified for marking',
//         };
//       }

//       const markingJob = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: {
//           property: true,
//           requestingUser: true,
//         },
//       });

//       if (!markingJob) {
//         return {
//           success: false,
//           message: 'Marking job not found',
//         };
//       }

//       // Update job with manual assignment
//       const timeSlotExpiry = this.timeSlotService.calculateTimeSlotExpiry();
//       const maxCompletionTime = this.timeSlotService.calculateMaxCompletionTime();

//       await this.prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           assignedAgentId: agentId,
//           status: 'ASSIGNED',
//           assignedAt: new Date(),
//           timeSlotExpiry,
//           maxCompletionTime,
//         },
//       });

//       // Clear any existing queue
//       await this.queueService.clearQueueForJob(markingJobId);

//       // Notify agent
//       await this.notificationService.notifyAgentManualAssignment(
//         agentId,
//         markingJob,
//         timeSlotExpiry
//       );

//       // Notify owner
//       await this.notificationService.notifyOwnerAgentAssigned(
//         markingJob.requestedBy,
//         markingJob,
//         agentId
//       );

//       this.logger.info(
//         `Marking job ${markingJobId} manually assigned to agent ${agentId}`
//       );

//       return {
//         success: true,
//         assignedAgentId: agentId,
//         message: 'Agent manually assigned successfully',
//       };
//     } catch (error) {
//       this.logger.error('Error manually assigning agent:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get current assignment status
//    */
//   async getAssignmentStatus(markingJobId: string) {
//     try {
//       const markingJob = await this.prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: {
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               phone: true,
//               agentReliabilityScore: true,
//               completedMarkingJobs: true,
//             },
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//         },
//       });

//       if (!markingJob) {
//         return null;
//       }

//       const queueLength = await this.queueService.getQueueLength(markingJobId);

//       return {
//         jobId: markingJob.id,
//         status: markingJob.status,
//         assignedAgent: markingJob.assignedAgent,
//         timeSlotExpiry: markingJob.timeSlotExpiry,
//         maxCompletionTime: markingJob.maxCompletionTime,
//         queueLength,
//         assignedAt: markingJob.assignedAt,
//       };
//     } catch (error) {
//       this.logger.error('Error fetching assignment status:', error);
//       throw error;
//     }
//   }
// }








// // backend/marking-service/src/services/assignmentService.ts
// import { PrismaClient, MarkingJobStatus, PropertyMarkingJob, User } from '@newcondo/db';
// import { standardResponse } from '../../../shared/src/utils/response';
// import { AppError } from '../../../shared/src/utils/errors';
// import { timeSlotService } from './timeSlotService';
// import { notificationService } from './notificationService';
// import { performanceService } from './performanceService';
// import { agentGeolocationService } from './agentGeolocationService';

// const prisma = new PrismaClient();

// interface AssignmentQueueItem {
//   agentId: string;
//   queuePosition: number;
//   addedAt: Date;
// }

// interface AssignmentResult {
//   assignedAgent: User;
//   queuePosition: number;
//   timeSlotExpiry: Date;
//   estimatedCompletionTime: Date;
// }

// class AssignmentService {
//   /**
//    * Get available agents near a property (FCFS eligible)
//    */
//   async getEligibleAgentsNearProperty(
//     propertyId: string,
//     maxRadius: number = 15 // km
//   ): Promise<User[]> {
//     const property = await prisma.property.findUnique({
//       where: { id: propertyId },
//       select: {
//         gpsCoordinates: true,
//         city: true,
//         state: true,
//       },
//     });

//     if (!property?.gpsCoordinates) {
//       throw new AppError('Property location not found', 400);
//     }

//     const coords = JSON.parse(property.gpsCoordinates);

//     // Get agents available for marking with good reliability score
//     const eligibleAgents = await prisma.user.findMany({
//       where: {
//         role: 'AGENT',
//         isAvailableForMarking: true,
//         agentReliabilityScore: {
//           gte: 3.0, // Minimum 3.0 rating
//         },
//         // Agent operates in property state or nearby areas
//         agentServiceAreas: {
//           hasSome: [property.city, property.state],
//         },
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         phone: true,
//         agentServiceAreas: true,
//         agentReliabilityScore: true,
//         totalMarkingJobs: true,
//         completedMarkingJobs: true,
//       },
//     });

//     // Filter by geolocation distance
//     const nearbyAgents = await Promise.all(
//       eligibleAgents.map(async (agent) => {
//         const distance = await agentGeolocationService.calculateDistance(
//           coords.lat,
//           coords.lng,
//           agent // Agent's location will be fetched from their profile
//         );

//         return {
//           agent,
//           distance,
//         };
//       })
//     );

//     return nearbyAgents
//       .filter((item) => item.distance <= maxRadius)
//       .sort((a, b) => a.distance - b.distance)
//       .map((item) => item.agent);
//   }

//   /**
//    * Assign marking job to first available agent (FCFS)
//    */
//   async assignJobToNextAgent(
//     markingJobId: string,
//     candidateAgents: User[]
//   ): Promise<AssignmentResult> {
//     if (candidateAgents.length === 0) {
//       throw new AppError('No eligible agents available in the area', 404);
//     }

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: { property: true },
//     });

//     if (!job) {
//       throw new AppError('Marking job not found', 404);
//     }

//     if (job.status !== MarkingJobStatus.QUEUED) {
//       throw new AppError('Job is not in queued status', 400);
//     }

//     // Assign to first agent in the list (best combination of reliability + proximity)
//     const assignedAgent = candidateAgents[0];
//     const timeSlotExpiry = new Date();
//     timeSlotExpiry.setHours(timeSlotExpiry.getHours() + 3);

//     const maxCompletionTime = new Date();
//     maxCompletionTime.setDate(maxCompletionTime.getDate() + 3);

//     // Update marking job with assignment
//     const updatedJob = await prisma.propertyMarkingJob.update({
//       where: { id: markingJobId },
//       data: {
//         assignedAgentId: assignedAgent.id,
//         status: MarkingJobStatus.ASSIGNED,
//         assignedAt: new Date(),
//         timeSlotExpiry,
//         maxCompletionTime,
//         queuePosition: 1, // First assignment
//       },
//       include: { property: true },
//     });

//     // Update agent performance metrics
//     await performanceService.recordJobAssignment(assignedAgent.id);

//     // Send assignment notification
//     await notificationService.notifyAgentAssignment({
//       agent: assignedAgent,
//       job: updatedJob,
//       timeSlotExpiry,
//     });

//     return {
//       assignedAgent,
//       queuePosition: 1,
//       timeSlotExpiry,
//       estimatedCompletionTime: maxCompletionTime,
//     };
//   }

//   /**
//    * Build a queue for agents to bid for the job (FCFS queue)
//    */
//   async buildAgentQueue(
//     markingJobId: string,
//     agentIds: string[]
//   ): Promise<AssignmentQueueItem[]> {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//     });

//     if (!job) {
//       throw new AppError('Marking job not found', 404);
//     }

//     // Create queue items with timestamps
//     const queueItems: AssignmentQueueItem[] = agentIds.map((agentId, index) => ({
//       agentId,
//       queuePosition: index + 1,
//       addedAt: new Date(),
//     }));

//     return queueItems;
//   }

//   /**
//    * Auto-reassign job if current agent fails to complete in time
//    */
//   async handleTimeSlotExpiry(markingJobId: string): Promise<void> {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: { property: true, assignedAgent: true },
//     });

//     if (!job) {
//       throw new AppError('Marking job not found', 404);
//     }

//     if (
//       job.timeSlotExpiry &&
//       new Date() > job.timeSlotExpiry &&
//       job.status === MarkingJobStatus.ASSIGNED
//     ) {
//       // Reassign to next agent in queue
//       const availableAgents = await this.getEligibleAgentsNearProperty(job.propertyId);

//       // Filter out the agent who just failed
//       const filteredAgents = availableAgents.filter(
//         (agent) => agent.id !== job.assignedAgentId
//       );

//       if (filteredAgents.length > 0) {
//         // Pay the previous agent a small percentage (1,000 NGN equivalent)
//         const smallCompensation = 1000;
//         await prisma.payment.create({
//           data: {
//             userId: job.assignedAgentId!,
//             markingJobId,
//             amount: smallCompensation,
//             currency: 'NGN',
//             paymentType: 'PROPERTY_MARKING',
//             status: 'HELD', // Payment held until further confirmation
//             description: 'Time slot expiry compensation',
//           },
//         });

//         // Notify previous agent
//         const previousAgent = job.assignedAgent;
//         await notificationService.notifyTimeSlotExpiry({
//           agent: previousAgent!,
//           job,
//           compensation: smallCompensation,
//         });

//         // Reassign to next agent
//         await this.assignJobToNextAgent(markingJobId, filteredAgents);
//       } else {
//         // No more agents available - mark job as expired
//         await prisma.propertyMarkingJob.update({
//           where: { id: markingJobId },
//           data: {
//             status: MarkingJobStatus.EXPIRED,
//             assignedAgentId: null,
//           },
//         });

//         // Notify property owner
//         await notificationService.notifyJobExpired({
//           job,
//         });
//       }
//     }
//   }

//   /**
//    * Move agent up or down in queue based on performance metrics
//    */
//   async updateQueueBasedOnPerformance(markingJobId: string): Promise<void> {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: { assignedAgent: true },
//     });

//     if (!job?.assignedAgent) {
//       return;
//     }

//     const performance = await performanceService.getAgentMetrics(job.assignedAgentId!);

//     // Dynamic prioritization based on reliability
//     if (performance.reliabilityScore >= 4.5) {
//       // High performers get priority in future assignments
//       await prisma.user.update({
//         where: { id: job.assignedAgentId! },
//         data: {
//           agentReliabilityScore: performance.reliabilityScore,
//         },
//       });
//     }
//   }

//   /**
//    * Cancel assignment and reassign job
//    */
//   async cancelAssignmentAndReassign(
//     markingJobId: string,
//     reason: string
//   ): Promise<void> {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: { property: true },
//     });

//     if (!job) {
//       throw new AppError('Marking job not found', 404);
//     }

//     // Reset assignment
//     await prisma.propertyMarkingJob.update({
//       where: { id: markingJobId },
//       data: {
//         assignedAgentId: null,
//         status: MarkingJobStatus.QUEUED,
//         assignedAt: null,
//         timeSlotExpiry: null,
//         queuePosition: null,
//       },
//     });

//     // Get new available agents
//     const availableAgents = await this.getEligibleAgentsNearProperty(job.propertyId);

//     if (availableAgents.length > 0) {
//       await this.assignJobToNextAgent(markingJobId, availableAgents);
//     } else {
//       throw new AppError('No available agents for reassignment', 404);
//     }
//   }
// }

// export const assignmentService = new AssignmentService();