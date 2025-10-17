// backend/marking-service/src/services/timeSlotService.ts

import { PrismaClient } from '@newcondo/db';
import { MarkingJobStatus } from '@newcondo/db';

const prisma = new PrismaClient();

export interface TimeSlot {
  id: string;
  startTime: DateTime;
  endTime: DateTime;
  isAvailable: boolean;
  agentId?: string;
  jobId?: string;
}

export interface AgentAvailability {
  agentId: string;
  availableSlots: TimeSlot[];
  currentJob?: string;
}

export class TimeSlotService {
  private static readonly TIME_SLOT_DURATION_HOURS = 3;
  private static readonly MAX_COMPLETION_DAYS = 3;

  /**
   * Create a time slot for a marking job
   */
  static async createTimeSlot(jobId: string, preferredTime?: Date): Promise<Date> {
    const now = new Date();
    const slotStartTime = preferredTime || new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Default to tomorrow
    const slotEndTime = new Date(slotStartTime.getTime() + (this.TIME_SLOT_DURATION_HOURS * 60 * 60 * 1000));
    
    // Update the job with time slot information
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        timeSlotExpiry: slotEndTime,
        maxCompletionTime: new Date(now.getTime() + (this.MAX_COMPLETION_DAYS * 24 * 60 * 60 * 1000))
      }
    });

    return slotEndTime;
  }

  /**
   * Check if agent is available for a time slot
   */
  static async checkAgentAvailability(agentId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const conflictingJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        status: {
          in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
        },
        AND: [
          {
            timeSlotExpiry: {
              gte: startTime
            }
          },
          {
            assignedAt: {
              lte: endTime
            }
          }
        ]
      }
    });

    return conflictingJobs.length === 0;
  }

  /**
   * Get available time slots for an agent
   */
  static async getAgentAvailableSlots(agentId: string, days: number = 7): Promise<TimeSlot[]> {
    const now = new Date();
    const endDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    // Get agent's existing time slots
    const existingJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        status: {
          in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
        },
        timeSlotExpiry: {
          gte: now,
          lte: endDate
        }
      },
      select: {
        id: true,
        assignedAt: true,
        timeSlotExpiry: true
      }
    });

    // Generate available time slots (excluding existing ones)
    const availableSlots: TimeSlot[] = [];
    const currentTime = new Date(now);

    // Generate slots for each day
    for (let day = 0; day < days; day++) {
      const dayStart = new Date(currentTime);
      dayStart.setDate(dayStart.getDate() + day);
      dayStart.setHours(8, 0, 0, 0); // Start at 8 AM

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(18, 0, 0, 0); // End at 6 PM

      // Generate 3-hour slots for the day
      let slotStart = new Date(dayStart);
      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + (this.TIME_SLOT_DURATION_HOURS * 60 * 60 * 1000));
        
        if (slotEnd <= dayEnd) {
          // Check if slot conflicts with existing jobs
          const hasConflict = existingJobs.some(job => {
            const jobStart = job.assignedAt || new Date();
            const jobEnd = job.timeSlotExpiry || new Date();
            return (slotStart < jobEnd && slotEnd > jobStart);
          });

          if (!hasConflict && slotStart > now) {
            availableSlots.push({
              id: `${agentId}_${slotStart.getTime()}`,
              startTime: slotStart as any,
              endTime: slotEnd as any,
              isAvailable: true,
              agentId
            });
          }
        }
        
        slotStart = new Date(slotStart.getTime() + (this.TIME_SLOT_DURATION_HOURS * 60 * 60 * 1000));
      }
    }

    return availableSlots;
  }

  /**
   * Reserve a time slot for a job
   */
  static async reserveTimeSlot(jobId: string, agentId: string, startTime: Date): Promise<boolean> {
    const endTime = new Date(startTime.getTime() + (this.TIME_SLOT_DURATION_HOURS * 60 * 60 * 1000));
    
    // Check availability
    const isAvailable = await this.checkAgentAvailability(agentId, startTime, endTime);
    
    if (!isAvailable) {
      return false;
    }

    // Reserve the slot
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        assignedAgentId: agentId,
        assignedAt: startTime,
        timeSlotExpiry: endTime,
        status: MarkingJobStatus.ASSIGNED
      }
    });

    return true;
  }

  /**
   * Check and handle expired time slots
   */
  static async handleExpiredTimeSlots(): Promise<void> {
    const now = new Date();
    
    // Find expired time slots
    const expiredJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.ASSIGNED,
        timeSlotExpiry: {
          lt: now
        }
      }
    });

    // Release expired slots back to queue
    for (const job of expiredJobs) {
      await prisma.propertyMarkingJob.update({
        where: { id: job.id },
        data: {
          status: MarkingJobStatus.QUEUED,
          assignedAgentId: null,
          assignedAt: null,
          timeSlotExpiry: null
        }
      });
    }
  }

  /**
   * Get agent's current and upcoming time slots
   */
  static async getAgentSchedule(agentId: string): Promise<any[]> {
    const now = new Date();
    const next7Days = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    const schedule = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        status: {
          in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
        },
        timeSlotExpiry: {
          gte: now,
          lte: next7Days
        }
      },
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
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        assignedAt: 'asc'
      }
    });

    return schedule;
  }

  /**
   * Calculate optimal time slots based on agent location and job locations
   */
  static async getOptimalTimeSlots(agentId: string, jobLocation: { lat: number; lng: number }): Promise<TimeSlot[]> {
    // Get agent's service areas
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { agentServiceAreas: true }
    });

    if (!agent?.agentServiceAreas) {
      return [];
    }

    // Get available slots
    const availableSlots = await this.getAgentAvailableSlots(agentId, 7);
    
    // For now, return all available slots
    // In future iterations, we can implement distance-based optimization
    return availableSlots;
  }

  /**
   * Extend time slot if needed (emergency extension)
   */
  static async extendTimeSlot(jobId: string, extensionHours: number = 2): Promise<boolean> {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        timeSlotExpiry: true,
        assignedAgentId: true,
        status: true
      }
    });

    if (!job || !job.timeSlotExpiry || !job.assignedAgentId) {
      return false;
    }

    const newEndTime = new Date(job.timeSlotExpiry.getTime() + (extensionHours * 60 * 60 * 1000));
    
    // Check if extension conflicts with other jobs
    const isAvailable = await this.checkAgentAvailability(
      job.assignedAgentId, 
      job.timeSlotExpiry, 
      newEndTime
    );

    if (!isAvailable) {
      return false;
    }

    // Extend the slot
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        timeSlotExpiry: newEndTime
      }
    });

    return true;
  }

  /**
   * Cancel time slot and release back to queue
   */
  static async cancelTimeSlot(jobId: string, reason?: string): Promise<void> {
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        status: MarkingJobStatus.CANCELLED,
        assignedAgentId: null,
        assignedAt: null,
        timeSlotExpiry: null,
        completionNotes: reason || 'Time slot cancelled'
      }
    });
  }

  /**
   * Get time slot statistics for analytics
   */
  static async getTimeSlotStats(agentId?: string) {
    const whereClause = agentId ? { assignedAgentId: agentId } : {};
    
    const stats = await prisma.propertyMarkingJob.aggregateRaw({
      pipeline: [
        { $match: whereClause },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgCompletionTime: {
              $avg: {
                $subtract: ['$completedAt', '$assignedAt']
              }
            }
          }
        }
      ]
    });

    return stats;
  }
}




// import { PrismaClient, MarkingJobStatus } from '@prisma/client';

// const prisma = new PrismaClient();

// interface TimeSlot {
//   startTime: Date;
//   endTime: Date;
//   isExpired: boolean;
// }

// interface QueuedAgent {
//   agentId: string;
//   queuePosition: number;
//   timeSlot: TimeSlot;
//   notifiedAt: Date;
// }

// export class TimeSlotService {
//   private static readonly TIME_SLOT_DURATION_HOURS = 3;
//   private static readonly MAX_COMPLETION_DAYS = 3;

//   /**
//    * Calculate time slot for an agent in the queue
//    */
//   static calculateTimeSlot(queuePosition: number, jobCreatedAt: Date): TimeSlot {
//     const slotStartOffset = (queuePosition - 1) * this.TIME_SLOT_DURATION_HOURS;
//     const startTime = new Date(jobCreatedAt);
//     startTime.setHours(startTime.getHours() + slotStartOffset);

//     const endTime = new Date(startTime);
//     endTime.setHours(endTime.getHours() + this.TIME_SLOT_DURATION_HOURS);

//     const now = new Date();
//     const isExpired = now > endTime;

//     return { startTime, endTime, isExpired };
//   }

//   /**
//    * Get current active time slot for a marking job
//    */
//   static async getCurrentActiveSlot(markingJobId: string): Promise<QueuedAgent | null> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         select: {
//           id: true,
//           status: true,
//           queuePosition: true,
//           assignedAgentId: true,
//           timeSlotExpiry: true,
//           createdAt: true,
//         },
//       });

//       if (!job || !job.assignedAgentId || !job.queuePosition) {
//         return null;
//       }

//       const timeSlot = this.calculateTimeSlot(job.queuePosition, job.createdAt);

//       return {
//         agentId: job.assignedAgentId,
//         queuePosition: job.queuePosition,
//         timeSlot,
//         notifiedAt: job.createdAt,
//       };
//     } catch (error) {
//       console.error('Error getting current active slot:', error);
//       throw new Error('Failed to retrieve active time slot');
//     }
//   }

//   /**
//    * Check if current time slot has expired
//    */
//   static isTimeSlotExpired(timeSlotExpiry: Date): boolean {
//     return new Date() > timeSlotExpiry;
//   }

//   /**
//    * Assign next agent in queue if current slot expired
//    */
//   static async assignNextAgentInQueue(markingJobId: string): Promise<boolean> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         select: {
//           id: true,
//           status: true,
//           queuePosition: true,
//           timeSlotExpiry: true,
//           assignedAgentId: true,
//           createdAt: true,
//           requestedBy: true,
//         },
//       });

//       if (!job || job.status !== MarkingJobStatus.ASSIGNED) {
//         return false;
//       }

//       // Check if time slot expired
//       if (!job.timeSlotExpiry || !this.isTimeSlotExpired(job.timeSlotExpiry)) {
//         return false;
//       }

//       // Find next agent in queue (this would typically be from a separate queue table)
//       // For now, we'll update the queue position and reassign
//       const nextQueuePosition = (job.queuePosition || 0) + 1;
//       const nextTimeSlot = this.calculateTimeSlot(nextQueuePosition, job.createdAt);

//       // Update job with next queue position and time slot
//       await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           queuePosition: nextQueuePosition,
//           timeSlotExpiry: nextTimeSlot.endTime,
//           status: MarkingJobStatus.QUEUED, // Reset to queued for reassignment
//           assignedAgentId: null, // Clear current agent
//         },
//       });

//       console.log(`Time slot expired for job ${markingJobId}. Moving to next queue position.`);
//       return true;
//     } catch (error) {
//       console.error('Error assigning next agent in queue:', error);
//       throw new Error('Failed to assign next agent');
//     }
//   }

//   /**
//    * Calculate maximum completion time (3 days from job creation)
//    */
//   static calculateMaxCompletionTime(jobCreatedAt: Date): Date {
//     const maxTime = new Date(jobCreatedAt);
//     maxTime.setDate(maxTime.getDate() + this.MAX_COMPLETION_DAYS);
//     return maxTime;
//   }

//   /**
//    * Check if job has exceeded maximum completion time
//    */
//   static isJobExpired(maxCompletionTime: Date): boolean {
//     return new Date() > maxCompletionTime;
//   }

//   /**
//    * Expire jobs that exceeded maximum completion time
//    */
//   static async expireOverdueJobs(): Promise<number> {
//     try {
//       const now = new Date();

//       const result = await prisma.propertyMarkingJob.updateMany({
//         where: {
//           maxCompletionTime: {
//             lt: now,
//           },
//           status: {
//             notIn: [MarkingJobStatus.COMPLETED, MarkingJobStatus.CANCELLED, MarkingJobStatus.EXPIRED],
//           },
//         },
//         data: {
//           status: MarkingJobStatus.EXPIRED,
//         },
//       });

//       console.log(`Expired ${result.count} overdue marking jobs`);
//       return result.count;
//     } catch (error) {
//       console.error('Error expiring overdue jobs:', error);
//       throw new Error('Failed to expire overdue jobs');
//     }
//   }

//   /**
//    * Get remaining time in current slot
//    */
//   static getRemainingTimeInSlot(timeSlotExpiry: Date): {
//     hours: number;
//     minutes: number;
//     seconds: number;
//     isExpired: boolean;
//   } {
//     const now = new Date();
//     const diff = timeSlotExpiry.getTime() - now.getTime();

//     if (diff <= 0) {
//       return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
//     }

//     const hours = Math.floor(diff / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//     const seconds = Math.floor((diff % (1000 * 60)) / 1000);

//     return { hours, minutes, seconds, isExpired: false };
//   }

//   /**
//    * Assign time slot to agent when accepting job
//    */
//   static async assignTimeSlotToAgent(
//     markingJobId: string,
//     agentId: string,
//     queuePosition: number
//   ): Promise<TimeSlot> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         select: { createdAt: true },
//       });

//       if (!job) {
//         throw new Error('Marking job not found');
//       }

//       const timeSlot = this.calculateTimeSlot(queuePosition, job.createdAt);

//       await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           assignedAgentId: agentId,
//           queuePosition,
//           timeSlotExpiry: timeSlot.endTime,
//           assignedAt: new Date(),
//           status: MarkingJobStatus.ASSIGNED,
//         },
//       });

//       console.log(`Assigned time slot to agent ${agentId} for job ${markingJobId}`);
//       return timeSlot;
//     } catch (error) {
//       console.error('Error assigning time slot to agent:', error);
//       throw new Error('Failed to assign time slot');
//     }
//   }

//   /**
//    * Get all active time slots for a marking job (queue visualization)
//    */
//   static async getJobQueueTimeSlots(markingJobId: string): Promise<TimeSlot[]> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         select: { createdAt: true, queuePosition: true },
//       });

//       if (!job || !job.queuePosition) {
//         return [];
//       }

//       const timeSlots: TimeSlot[] = [];
//       for (let i = 1; i <= job.queuePosition; i++) {
//         timeSlots.push(this.calculateTimeSlot(i, job.createdAt));
//       }

//       return timeSlots;
//     } catch (error) {
//       console.error('Error getting job queue time slots:', error);
//       throw new Error('Failed to retrieve queue time slots');
//     }
//   }
// }

// export default TimeSlotService;










// // backend/marking-service/src/services/timeSlotService.ts
// import { prisma } from '@newcondo/db';
// import { MarkingJobStatus } from '@prisma/client';
// import { logger } from '../utils/logger';

// interface TimeSlotInfo {
//   slotStart: Date;
//   slotEnd: Date;
//   remainingMinutes: number;
//   isExpired: boolean;
//   jobId: string;
// }

// interface SlotRotationResult {
//   rotatedJobId: string;
//   newAssignedAgentId: string | null;
//   reason: string;
// }

// class TimeSlotService {
//   private readonly SLOT_DURATION_MINUTES = 180; // 3 hours
//   private readonly MAX_COMPLETION_DAYS = 3; // 3 days for property owner to confirm

//   /**
//    * Create a new time slot for an assigned agent
//    * Automatically expires after 3 hours
//    */
//   async createTimeSlot(markingJobId: string, assignedAgentId: string): Promise<TimeSlotInfo> {
//     try {
//       const slotStart = new Date();
//       const slotEnd = new Date(slotStart.getTime() + this.SLOT_DURATION_MINUTES * 60 * 1000);
//       const maxCompletionTime = new Date(slotStart.getTime() + this.MAX_COMPLETION_DAYS * 24 * 60 * 60 * 1000);

//       // Update job with time slot information
//       const updatedJob = await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           timeSlotExpiry: slotEnd,
//           maxCompletionTime: maxCompletionTime,
//           status: MarkingJobStatus.ASSIGNED,
//           assignedAt: slotStart,
//         },
//         include: {
//           property: true,
//           assignedAgent: true,
//         },
//       });

//       logger.info(`Time slot created for marking job ${markingJobId}`, {
//         agentId: assignedAgentId,
//         slotEnd: slotEnd.toISOString(),
//       });

//       return {
//         slotStart,
//         slotEnd,
//         remainingMinutes: this.SLOT_DURATION_MINUTES,
//         isExpired: false,
//         jobId: markingJobId,
//       };
//     } catch (error) {
//       logger.error('Error creating time slot', { markingJobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Get current time slot information for an active marking job
//    */
//   async getTimeSlotInfo(markingJobId: string): Promise<TimeSlotInfo | null> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: { assignedAgent: true },
//       });

//       if (!job || !job.timeSlotExpiry) {
//         return null;
//       }

//       const now = new Date();
//       const remainingMs = job.timeSlotExpiry.getTime() - now.getTime();
//       const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
//       const isExpired = remainingMinutes <= 0;

//       return {
//         slotStart: job.assignedAt || now,
//         slotEnd: job.timeSlotExpiry,
//         remainingMinutes: Math.max(0, remainingMinutes),
//         isExpired,
//         jobId: markingJobId,
//       };
//     } catch (error) {
//       logger.error('Error getting time slot info', { markingJobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Check if a time slot has expired and rotate to next agent if needed
//    */
//   async checkAndRotateExpiredSlots(): Promise<SlotRotationResult[]> {
//     const results: SlotRotationResult[] = [];

//     try {
//       const now = new Date();

//       // Find all jobs with expired time slots
//       const expiredJobs = await prisma.propertyMarkingJob.findMany({
//         where: {
//           status: MarkingJobStatus.ASSIGNED,
//           timeSlotExpiry: {
//             lt: now,
//           },
//         },
//         include: {
//           property: true,
//           assignedAgent: true,
//         },
//       });

//       for (const job of expiredJobs) {
//         const rotationResult = await this.rotateToNextAgent(job.id);
//         if (rotationResult) {
//           results.push(rotationResult);
//         }
//       }

//       return results;
//     } catch (error) {
//       logger.error('Error checking and rotating expired slots', { error });
//       throw error;
//     }
//   }

//   /**
//    * Rotate to next agent in queue when current slot expires
//    */
//   private async rotateToNextAgent(markingJobId: string): Promise<SlotRotationResult | null> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: { property: true, assignedAgent: true },
//       });

//       if (!job) return null;

//       // Check if max completion time has passed
//       const now = new Date();
//       if (job.maxCompletionTime && now > job.maxCompletionTime) {
//         // Mark job as expired - property owner didn't confirm within deadline
//         await prisma.propertyMarkingJob.update({
//           where: { id: markingJobId },
//           data: {
//             status: MarkingJobStatus.EXPIRED,
//             timeSlotExpiry: null,
//             assignedAgentId: null,
//           },
//         });

//         // Compensate the last agent who attempted marking
//         if (job.assignedAgent) {
//           await this.compensateAgent(job.assignedAgentId!, job.markingFee);
//         }

//         logger.info(`Marking job ${markingJobId} expired - max completion time exceeded`, {
//           propertyId: job.propertyId,
//         });

//         return {
//           rotatedJobId: markingJobId,
//           newAssignedAgentId: null,
//           reason: 'Max completion time exceeded - job expired',
//         };
//       }

//       // Otherwise, reset to QUEUED for next assignment
//       const updatedJob = await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           status: MarkingJobStatus.QUEUED,
//           timeSlotExpiry: null,
//           assignedAgentId: null,
//           queuePosition: 1, // Back to queue
//         },
//       });

//       // Give partial compensation to previous agent
//       if (job.assignedAgent) {
//         await this.compensateAgent(job.assignedAgentId!, job.markingFee);
//       }

//       logger.info(`Marking job ${markingJobId} rotated back to queue`, {
//         previousAgent: job.assignedAgentId,
//         propertyId: job.propertyId,
//       });

//       return {
//         rotatedJobId: markingJobId,
//         newAssignedAgentId: null,
//         reason: 'Time slot expired - returned to queue',
//       };
//     } catch (error) {
//       logger.error('Error rotating to next agent', { markingJobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Complete a time slot when marking is done
//    */
//   async completeTimeSlot(
//     markingJobId: string,
//     completionData: {
//       completionNotes: string;
//       completionImages: string[];
//       boundaryData: Record<string, any>;
//     }
//   ): Promise<TimeSlotInfo> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//       });

//       if (!job) {
//         throw new Error(`Marking job ${markingJobId} not found`);
//       }

//       // Check if time slot is still valid
//       if (job.timeSlotExpiry && new Date() > job.timeSlotExpiry) {
//         throw new Error('Time slot has expired');
//       }

//       // Update job to IN_PROGRESS with completion data
//       await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           status: MarkingJobStatus.IN_PROGRESS,
//           completionNotes: completionData.completionNotes,
//           completionImages: completionData.completionImages,
//           boundaryData: completionData.boundaryData,
//         },
//       });

//       logger.info(`Time slot completed for marking job ${markingJobId}`, {
//         imagesCount: completionData.completionImages.length,
//       });

//       return await this.getTimeSlotInfo(markingJobId) as TimeSlotInfo;
//     } catch (error) {
//       logger.error('Error completing time slot', { markingJobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Extend time slot by specified minutes (admin use case)
//    */
//   async extendTimeSlot(markingJobId: string, extensionMinutes: number): Promise<TimeSlotInfo> {
//     try {
//       if (extensionMinutes <= 0) {
//         throw new Error('Extension minutes must be positive');
//       }

//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//       });

//       if (!job || !job.timeSlotExpiry) {
//         throw new Error('No active time slot found');
//       }

//       const newExpiry = new Date(job.timeSlotExpiry.getTime() + extensionMinutes * 60 * 1000);

//       await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           timeSlotExpiry: newExpiry,
//         },
//       });

//       logger.info(`Time slot extended for marking job ${markingJobId}`, {
//         extensionMinutes,
//         newExpiry: newExpiry.toISOString(),
//       });

//       return await this.getTimeSlotInfo(markingJobId) as TimeSlotInfo;
//     } catch (error) {
//       logger.error('Error extending time slot', { markingJobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Cancel time slot and return job to queue
//    */
//   async cancelTimeSlot(markingJobId: string, reason: string): Promise<void> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//       });

//       if (!job) {
//         throw new Error(`Marking job ${markingJobId} not found`);
//       }

//       await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           status: MarkingJobStatus.QUEUED,
//           timeSlotExpiry: null,
//           assignedAgentId: null,
//           queuePosition: 1,
//         },
//       });

//       // Compensate agent if one was assigned
//       if (job.assignedAgentId) {
//         await this.compensateAgent(job.assignedAgentId, job.markingFee);
//       }

//       logger.info(`Time slot cancelled for marking job ${markingJobId}`, {
//         reason,
//         agentId: job.assignedAgentId,
//       });
//     } catch (error) {
//       logger.error('Error cancelling time slot', { markingJobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Get all active time slots for an agent
//    */
//   async getAgentActiveTimeSlots(agentId: string): Promise<TimeSlotInfo[]> {
//     try {
//       const activeJobs = await prisma.propertyMarkingJob.findMany({
//         where: {
//           assignedAgentId: agentId,
//           status: {
//             in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
//           },
//           timeSlotExpiry: {
//             gt: new Date(),
//           },
//         },
//       });

//       const slots: TimeSlotInfo[] = [];

//       for (const job of activeJobs) {
//         const slot = await this.getTimeSlotInfo(job.id);
//         if (slot) {
//           slots.push(slot);
//         }
//       }

//       return slots;
//     } catch (error) {
//       logger.error('Error getting agent active time slots', { agentId, error });
//       throw error;
//     }
//   }

//   /**
//    * Get time slot statistics for a property marking job
//    */
//   async getTimeSlotStats(markingJobId: string): Promise<{
//     totalTime: number;
//     elapsedTime: number;
//     remainingTime: number;
//     percentageUsed: number;
//   }> {
//     try {
//       const slot = await this.getTimeSlotInfo(markingJobId);

//       if (!slot) {
//         throw new Error('No time slot found');
//       }

//       const totalMs = slot.slotEnd.getTime() - slot.slotStart.getTime();
//       const elapsedMs = new Date().getTime() - slot.slotStart.getTime();
//       const remainingMs = totalMs - elapsedMs;

//       return {
//         totalTime: Math.floor(totalMs / 1000 / 60), // minutes
//         elapsedTime: Math.floor(elapsedMs / 1000 / 60), // minutes
//         remainingTime: Math.max(0, Math.floor(remainingMs / 1000 / 60)), // minutes
//         percentageUsed: Math.min(100, Math.floor((elapsedMs / totalMs) * 100)),
//       };
//     } catch (error) {
//       logger.error('Error getting time slot stats', { markingJobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Compensate agent with partial fee for incomplete work
//    */
//   private async compensateAgent(agentId: string, originalFee: any): Promise<void> {
//     try {
//       const partialCompensation = originalFee * 0.05; // 5% of marking fee as compensation

//       // Add to agent's virtual account
//       await prisma.virtualAccount.update({
//         where: { userId: agentId },
//         data: {
//           balance: {
//             increment: partialCompensation,
//           },
//         },
//       });

//       logger.info(`Agent ${agentId} compensated with ${partialCompensation}`, {
//         originalFee,
//       });
//     } catch (error) {
//       logger.error('Error compensating agent', { agentId, error });
//       // Don't throw - compensation failure shouldn't block job rotation
//     }
//   }
// }

// export default new TimeSlotService();