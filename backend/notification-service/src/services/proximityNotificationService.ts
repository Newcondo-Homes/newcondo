// backend/notification-service/src/services/proximityNotificationService.ts

import { PrismaClient } from '@newcondo/db';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';
import { 
  ProximityNotificationPayload, 
  ProximitySearchResult,
  BroadcastResult 
} from '../types/markingNotification';

const prisma = new PrismaClient();

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find agents within proximity of a property location
 */
export async function findAgentsInProximity(
  propertyCoordinates: { lat: number; lng: number },
  maxDistanceKm: number = 20,
  filters?: {
    minReliabilityScore?: number;
    isPremiumOnly?: boolean;
  }
): Promise<ProximitySearchResult[]> {
  try {
    // Get all available agents with service areas and premium renters
    const agents = await prisma.user.findMany({
      where: {
        OR: [
          {
            role: 'AGENT',
            isAvailableForMarking: true,
          },
          {
            role: 'RENTER',
            isPremium: true,
            isAvailableForMarking: true,
          }
        ],
        ...(filters?.minReliabilityScore && {
          agentReliabilityScore: {
            gte: filters.minReliabilityScore
          }
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isPremium: true,
        agentServiceAreas: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
      }
    });

    const agentsInProximity: ProximitySearchResult[] = [];

    // For each agent, check if they're within proximity
    for (const agent of agents) {
      // If agent has service areas defined, check those
      if (agent.agentServiceAreas && agent.agentServiceAreas.length > 0) {
        // Service areas are stored as strings like "Lagos,Ikeja" or coordinates
        // For now, we'll parse and check if the property is in their service area
        // This is a simplified version - in production, you'd have proper geocoding
        const isInServiceArea = agent.agentServiceAreas.some(area => 
          area.toLowerCase().includes('lagos') // Placeholder logic
        );

        if (isInServiceArea) {
          agentsInProximity.push({
            userId: agent.id,
            name: agent.name || 'Unknown',
            email: agent.email,
            phone: agent.phone,
            role: agent.role,
            isPremium: agent.isPremium,
            distance: 0, // Would be calculated with proper coordinates
            reliabilityScore: agent.agentReliabilityScore?.toNumber() || 0,
            completionRate: agent.totalMarkingJobs > 0 
              ? (agent.completedMarkingJobs / agent.totalMarkingJobs) * 100 
              : 0,
          });
        }
      }
    }

    // Sort by reliability score and completion rate
    agentsInProximity.sort((a, b) => {
      const scoreA = a.reliabilityScore + (a.completionRate / 100);
      const scoreB = b.reliabilityScore + (b.completionRate / 100);
      return scoreB - scoreA;
    });

    return agentsInProximity;
  } catch (error) {
    console.error('Error finding agents in proximity:', error);
    throw new Error('Failed to find agents in proximity');
  }
}

/**
 * Broadcast marking job notification to nearby agents
 */
export async function broadcastMarkingJob(
  payload: ProximityNotificationPayload
): Promise<BroadcastResult> {
  try {
    const { 
      markingJobId, 
      propertyDetails, 
      compensation,
      propertyCoordinates,
      maxDistanceKm 
    } = payload;

    // Find agents within proximity
    const nearbyAgents = await findAgentsInProximity(
      propertyCoordinates,
      maxDistanceKm || 20,
      { minReliabilityScore: 3.0 } // Only notify agents with good ratings
    );

    if (nearbyAgents.length === 0) {
      return {
        success: true,
        notifiedCount: 0,
        failedCount: 0,
        agents: [],
        message: 'No agents found within proximity'
      };
    }

    const notificationResults = [];
    const failedNotifications = [];

    // Send notifications to all nearby agents
    for (const agent of nearbyAgents) {
      try {
        // Send email notification
        if (agent.email) {
          await emailService.sendEmail({
            to: agent.email,
            subject: `🏠 New Property Marking Job Available - ₦${compensation.toLocaleString()}`,
            template: 'marking-job-broadcast',
            data: {
              agentName: agent.name,
              propertyAddress: propertyDetails.address,
              propertyCity: propertyDetails.city,
              propertyState: propertyDetails.state,
              compensation: compensation.toLocaleString(),
              distance: agent.distance.toFixed(2),
              markingJobId,
              acceptJobUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${markingJobId}/accept`,
              viewDetailsUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${markingJobId}`,
            }
          });
        }

        // Send SMS notification
        if (agent.phone) {
          await smsService.sendSMS({
            to: agent.phone,
            message: `New marking job in ${propertyDetails.city}! Earn ₦${compensation.toLocaleString()}. Distance: ${agent.distance.toFixed(1)}km. View: ${process.env.PLATFORM_URL}/marking-jobs/${markingJobId}`
          });
        }

        // Send push notification if available
        await pushService.sendPush({
          userId: agent.userId,
          title: '🏠 New Marking Job Available',
          body: `Earn ₦${compensation.toLocaleString()} - ${propertyDetails.city}, ${agent.distance.toFixed(1)}km away`,
          data: {
            type: 'MARKING_JOB_BROADCAST',
            markingJobId,
            propertyAddress: propertyDetails.address
          }
        });

        notificationResults.push({
          userId: agent.userId,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          success: true
        });
      } catch (error) {
        console.error(`Failed to notify agent ${agent.userId}:`, error);
        failedNotifications.push({
          userId: agent.userId,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: true,
      notifiedCount: notificationResults.length,
      failedCount: failedNotifications.length,
      agents: notificationResults,
      message: `Notified ${notificationResults.length} agents in proximity`
    };
  } catch (error) {
    console.error('Error broadcasting marking job:', error);
    throw new Error('Failed to broadcast marking job');
  }
}

/**
 * Notify next agent in queue when previous agent's time expires
 */
export async function notifyNextAgentInQueue(
  markingJobId: string,
  agentId: string,
  queuePosition: number
): Promise<void> {
  try {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        name: true,
        email: true,
        phone: true,
      }
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      include: {
        property: {
          select: {
            address: true,
            city: true,
            state: true,
          }
        }
      }
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    // Send email
    if (agent.email) {
      await emailService.sendEmail({
        to: agent.email,
        subject: '⏰ Your Turn! Property Marking Job Available',
        template: 'marking-job-assigned',
        data: {
          agentName: agent.name || 'Agent',
          propertyAddress: markingJob.property.address,
          propertyCity: markingJob.property.city,
          propertyState: markingJob.property.state,
          queuePosition,
          timeLimit: '3 hours',
          compensation: markingJob.markingFee.toNumber().toLocaleString(),
          markingJobId,
          startJobUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${markingJobId}/start`,
        }
      });
    }

    // Send SMS
    if (agent.phone) {
      await smsService.sendSMS({
        to: agent.phone,
        message: `Your turn! You have 3 hours to complete marking job at ${markingJob.property.city}. Start now: ${process.env.PLATFORM_URL}/marking-jobs/${markingJobId}/start`
      });
    }

    // Send push notification
    await pushService.sendPush({
      userId: agentId,
      title: '⏰ Your Turn to Mark Property',
      body: `You have 3 hours to complete this job in ${markingJob.property.city}`,
      data: {
        type: 'MARKING_JOB_YOUR_TURN',
        markingJobId,
        timeLimit: 3 * 60 * 60 * 1000 // 3 hours in milliseconds
      }
    });
  } catch (error) {
    console.error('Error notifying next agent in queue:', error);
    throw error;
  }
}

/**
 * Send proximity-based reminders to agents who haven't responded
 */
export async function sendProximityReminder(
  markingJobId: string,
  agentIds: string[]
): Promise<void> {
  try {
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      include: {
        property: {
          select: {
            address: true,
            city: true,
            state: true,
          }
        }
      }
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    for (const agentId of agentIds) {
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          name: true,
          email: true,
          phone: true,
        }
      });

      if (!agent) continue;

      // Send reminder email
      if (agent.email) {
        await emailService.sendEmail({
          to: agent.email,
          subject: '🔔 Reminder: Property Marking Job Still Available',
          template: 'marking-job-broadcast',
          data: {
            agentName: agent.name || 'Agent',
            propertyAddress: markingJob.property.address,
            propertyCity: markingJob.property.city,
            propertyState: markingJob.property.state,
            compensation: markingJob.markingFee.toNumber().toLocaleString(),
            markingJobId,
            acceptJobUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${markingJobId}/accept`,
            isReminder: true
          }
        });
      }
    }
  } catch (error) {
    console.error('Error sending proximity reminder:', error);
    throw error;
  }
}

export const proximityNotificationService = {
  findAgentsInProximity,
  broadcastMarkingJob,
  notifyNextAgentInQueue,
  sendProximityReminder
};