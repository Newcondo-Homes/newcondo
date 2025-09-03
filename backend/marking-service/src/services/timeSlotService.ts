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