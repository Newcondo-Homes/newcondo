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