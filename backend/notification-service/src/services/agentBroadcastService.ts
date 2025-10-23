// backend/notification-service/src/services/agentBroadcastService.ts

import { prisma } from '@newcondo/db';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';
import { templateService } from './templateService';

interface BroadcastJobData {
  markingJobId: string;
  propertyDetails: {
    title: string;
    address: string;
    city: string;
    state: string;
    lga?: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  fee: number;
}

interface EligibleAgent {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  distance?: number;
}

class AgentBroadcastService {
  private readonly MAX_BROADCAST_RADIUS_KM = 50; // Maximum radius for agent search
  private readonly PREFERRED_RADIUS_KM = 20; // Preferred radius

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find eligible agents within proximity of the property
   */
  private async findEligibleAgents(
    propertyLocation: { latitude: number; longitude: number },
    propertyCity: string,
    propertyState: string
  ): Promise<EligibleAgent[]> {
    try {
      // Get all agents who are available for marking
      const availableAgents = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'AGENT', isAvailableForMarking: true },
            { role: 'RENTER', isPremium: true, isAvailableForMarking: true },
          ],
          verificationStatus: 'VERIFIED',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          agentServiceAreas: true,
          city: true,
          state: true,
        },
      });

      const eligibleAgents: EligibleAgent[] = [];

      for (const agent of availableAgents) {
        // Check if agent services this area
        const servicesArea =
          agent.agentServiceAreas.length === 0 || // No restrictions
          agent.agentServiceAreas.includes(propertyCity) ||
          agent.agentServiceAreas.includes(propertyState) ||
          agent.agentServiceAreas.some((area) =>
            area.toLowerCase().includes(propertyCity.toLowerCase())
          );

        if (servicesArea) {
          // For now, add all agents who service the area
          // In production, you'd calculate actual distance using agent's coordinates
          eligibleAgents.push({
            id: agent.id,
            name: agent.name,
            email: agent.email,
            phone: agent.phone,
          });
        }
      }

      return eligibleAgents;
    } catch (error) {
      console.error('Error finding eligible agents:', error);
      throw error;
    }
  }

  /**
   * Broadcast new marking job to eligible agents
   */
  async broadcastNewMarkingJob(data: BroadcastJobData) {
    try {
      console.log(`Broadcasting marking job ${data.markingJobId}...`);

      // Find eligible agents
      const eligibleAgents = await this.findEligibleAgents(
        data.location,
        data.propertyDetails.city,
        data.propertyDetails.state
      );

      if (eligibleAgents.length === 0) {
        console.log('No eligible agents found for broadcast');
        return {
          success: true,
          agentsNotified: 0,
          message: 'No eligible agents found in the service area',
        };
      }

      console.log(`Found ${eligibleAgents.length} eligible agents`);

      // Send notifications to all eligible agents
      const notificationPromises = eligibleAgents.map(async (agent) => {
        try {
          // Render email template
          const emailHtml = await templateService.renderTemplate('marking-job-broadcast', {
            agentName: agent.name || 'Agent',
            propertyTitle: data.propertyDetails.title,
            propertyAddress: data.propertyDetails.address,
            propertyCity: data.propertyDetails.city,
            propertyState: data.propertyDetails.state,
            fee: data.fee.toLocaleString('en-NG', {
              style: 'currency',
              currency: 'NGN',
            }),
            markingJobId: data.markingJobId,
            acceptJobUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${data.markingJobId}/accept`,
            distance: agent.distance ? `${agent.distance.toFixed(1)} km away` : 'In your service area',
          });

          // Send email
          await emailService.send({
            to: agent.email,
            subject: '🏠 New Property Marking Job Available',
            html: emailHtml,
          });

          // Send SMS if phone available
          if (agent.phone) {
            await smsService.send({
              to: agent.phone,
              message: `New marking job available in ${data.propertyDetails.city}! Earn ₦${data.fee.toLocaleString()}. Check your dashboard to accept.`,
            });
          }

          // Send push notification
          await pushService.send({
            userId: agent.id,
            title: 'New Marking Job Available',
            body: `${data.propertyDetails.city} - Earn ₦${data.fee.toLocaleString()}`,
            data: {
              type: 'NEW_MARKING_JOB',
              markingJobId: data.markingJobId,
              fee: data.fee,
            },
          });

          return { agentId: agent.id, success: true };
        } catch (error) {
          console.error(`Failed to notify agent ${agent.id}:`, error);
          return { agentId: agent.id, success: false, error };
        }
      });

      const results = await Promise.allSettled(notificationPromises);
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;

      console.log(
        `Broadcast complete: ${successCount}/${eligibleAgents.length} agents notified`
      );

      return {
        success: true,
        agentsNotified: successCount,
        totalEligibleAgents: eligibleAgents.length,
        message: `Successfully notified ${successCount} agents`,
      };
    } catch (error) {
      console.error('Error broadcasting marking job:', error);
      throw error;
    }
  }

  /**
   * Send targeted notification to specific agents (e.g., after queue progression)
   */
  async notifyNextAgentInQueue(
    agentId: string,
    markingJobId: string,
    propertyDetails: any,
    timeSlotExpiry: Date
  ) {
    try {
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          name: true,
          email: true,
          phone: true,
        },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const timeSlotHours = Math.ceil(
        (timeSlotExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60)
      );

      // Render email template
      const emailHtml = await templateService.renderTemplate('marking-queue-assigned', {
        agentName: agent.name || 'Agent',
        propertyTitle: propertyDetails.title,
        propertyAddress: propertyDetails.address,
        timeSlotHours,
        timeSlotExpiry: timeSlotExpiry.toLocaleString('en-NG'),
        markingJobId,
        jobUrl: `${process.env.PLATFORM_URL}/dashboard/marking-jobs/${markingJobId}`,
      });

      // Send email
      await emailService.send({
        to: agent.email,
        subject: "🎯 It's Your Turn - Complete Marking Job Now",
        html: emailHtml,
      });

      // Send SMS
      if (agent.phone) {
        await smsService.send({
          to: agent.phone,
          message: `Your turn! Complete the marking job for ${propertyDetails.title} within ${timeSlotHours} hours. Check your dashboard now.`,
        });
      }

      // Send push notification
      await pushService.send({
        userId: agentId,
        title: "It's Your Turn!",
        body: `Complete marking for ${propertyDetails.title} within ${timeSlotHours} hours`,
        data: {
          type: 'MARKING_QUEUE_YOUR_TURN',
          markingJobId,
        },
      });

      console.log(`Next agent notification sent to ${agentId}`);
    } catch (error) {
      console.error('Error notifying next agent in queue:', error);
      throw error;
    }
  }

  /**
   * Notify all agents in queue when job is completed/cancelled
   */
  async notifyQueueJobClosed(
    markingJobId: string,
    reason: 'COMPLETED' | 'CANCELLED'
  ) {
    try {
      // Get all agents in queue for this job (would need a queue tracking table)
      // For now, we'll log this
      console.log(`Job ${markingJobId} closed: ${reason}`);

      // In production, you'd query a queue table and notify all waiting agents
      // Example:
      // const queuedAgents = await prisma.markingJobQueue.findMany({
      //   where: { markingJobId, status: 'WAITING' }
      // });
      
      // Then send notifications to each agent that the job is no longer available
    } catch (error) {
      console.error('Error notifying queue of job closure:', error);
      throw error;
    }
  }

  /**
   * Send reminder to agents who haven't responded to a broadcast
   */
  async sendBroadcastReminder(
    markingJobId: string,
    propertyDetails: any,
    fee: number,
    hoursRemaining: number
  ) {
    try {
      // Get agents who were notified but haven't joined the queue
      // This would require tracking who was notified
      
      console.log(`Sending broadcast reminder for job ${markingJobId}`);

      // In production, you'd track initial broadcast recipients and send reminders
      // to those who haven't responded within a certain timeframe
    } catch (error) {
      console.error('Error sending broadcast reminder:', error);
      throw error;
    }
  }
}

export const agentBroadcastService = new AgentBroadcastService();