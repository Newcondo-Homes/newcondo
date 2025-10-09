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