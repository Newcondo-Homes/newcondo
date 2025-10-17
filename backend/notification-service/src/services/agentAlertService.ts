import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';
import { templateService } from './templateService';
import { db } from '../../../shared/src/config/database';

interface NewJobAlertParams {
  markingJobId: string;
  propertyId: string;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  fee: number;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  agentIds: string[];
}

class AgentAlertService {
  /**
   * Notify available agents of new marking job opportunity
   */
  async notifyAvailableAgents(params: NewJobAlertParams): Promise<{
    success: number;
    failed: number;
    totalAgents: number;
  }> {
    try {
      const agents = await db.user.findMany({
        where: {
          id: { in: params.agentIds },
          isAvailableForMarking: true,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
        },
      });

      if (agents.length === 0) {
        console.warn('No available agents found for job alert');
        return { success: 0, failed: 0, totalAgents: 0 };
      }

      const urgencyEmoji = {
        LOW: '📋',
        NORMAL: '🏠',
        HIGH: '⚡',
        URGENT: '🔥',
      };

      const results = await Promise.allSettled(
        agents.map(async (agent) => {
          const templateData = {
            agentName: agent.name || 'Agent',
            propertyAddress: params.location.address,
            city: params.location.city,
            state: params.location.state,
            fee: params.fee.toLocaleString('en-NG', {
              style: 'currency',
              currency: 'NGN',
            }),
            urgencyLevel: params.urgencyLevel,
            urgencyEmoji: urgencyEmoji[params.urgencyLevel],
            markingJobId: params.markingJobId,
            propertyId: params.propertyId,
          };

          // Send email notification
          const emailHtml = await templateService.renderTemplate(
            'agent-job-alert',
            templateData
          );

          await emailService.sendEmail({
            to: agent.email,
            subject: `${urgencyEmoji[params.urgencyLevel]} New Marking Job Available - Earn ${templateData.fee}`,
            html: emailHtml,
            priority: params.urgencyLevel === 'URGENT' ? 'high' : 'normal',
          });

          // Send SMS for urgent jobs or high priority
          if (
            agent.phone &&
            (params.urgencyLevel === 'URGENT' || params.urgencyLevel === 'HIGH')
          ) {
            const smsMessage = `${urgencyEmoji[params.urgencyLevel]} NEW JOB ALERT! Mark property in ${params.location.city} for ${templateData.fee}. First-come-first-served. Claim now on Newcondo!`;
            await smsService.sendSMS({
              to: agent.phone,
              message: smsMessage,
            });
          }

          // Send push notification
          await pushService.sendPush({
            userId: agent.id,
            title: `${urgencyEmoji[params.urgencyLevel]} New Marking Job`,
            body: `Earn ${templateData.fee} in ${params.location.city}`,
            data: {
              type: 'NEW_MARKING_JOB',
              markingJobId: params.markingJobId,
              propertyId: params.propertyId,
              urgency: params.urgencyLevel,
            },
            priority: params.urgencyLevel === 'URGENT' ? 'high' : 'normal',
          });

          return { agentId: agent.id, success: true };
        })
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      console.log(
        `New job alerts sent: ${successful} successful, ${failed} failed out of ${agents.length} agents`
      );

      return {
        success: successful,
        failed,
        totalAgents: agents.length,
      };
    } catch (error) {
      console.error('Error notifying available agents:', error);
      throw error;
    }
  }

  /**
   * Send targeted alert to specific agents based on proximity and performance
   */
  async sendTargetedAlerts(params: {
    markingJobId: string;
    propertyId: string;
    location: { lat: number; lng: number; city: string; state: string };
    fee: number;
    maxRadius: number; // in kilometers
    minReliabilityScore?: number;
  }): Promise<void> {
    try {
      // This would integrate with a geolocation service to find nearby agents
      // For now, we'll use a simplified approach

      const agents = await db.user.findMany({
        where: {
          isAvailableForMarking: true,
          agentReliabilityScore: {
            gte: params.minReliabilityScore || 0,
          },
          // Filter by service areas (simplified - in production, use proper geospatial queries)
          agentServiceAreas: {
            has: params.location.city,
          },
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          agentReliabilityScore: true,
        },
        orderBy: {
          agentReliabilityScore: 'desc', // Prioritize high-performing agents
        },
        take: 20, // Limit to top 20 agents
      });

      if (agents.length === 0) {
        console.warn('No agents found within the specified criteria');
        return;
      }

      await this.notifyAvailableAgents({
        markingJobId: params.markingJobId,
        propertyId: params.propertyId,
        location: {
          address: '',
          city: params.location.city,
          state: params.location.state,
          coordinates: { lat: params.location.lat, lng: params.location.lng },
        },
        fee: params.fee,
        urgencyLevel: 'NORMAL',
        agentIds: agents.map((agent) => agent.id),
      });

      console.log(
        `Targeted alerts sent to ${agents.length} agents near ${params.location.city}`
      );
    } catch (error) {
      console.error('Error sending targeted alerts:', error);
      throw error;
    }
  }

  /**
   * Send reminder to agents who haven't claimed the job
   */
  async sendJobReminderAlert(params: {
    markingJobId: string;
    agentIds: string[];
    timeRemaining: string;
  }): Promise<void> {
    try {
      const agents = await db.user.findMany({
        where: {
          id: { in: params.agentIds },
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
        },
      });

      const job = await db.propertyMarkingJob.findUnique({
        where: { id: params.markingJobId },
        include: {
          property: {
            select: { address: true, city: true, state: true },
          },
        },
      });

      if (!job) {
        throw new Error('Marking job not found');
      }

      await Promise.allSettled(
        agents.map(async (agent) => {
          // Send push notification
          await pushService.sendPush({
            userId: agent.id,
            title: '⏰ Job Still Available',
            body: `Marking job in ${job.property.city} still unclaimed. ${params.timeRemaining} left!`,
            data: {
              type: 'JOB_REMINDER',
              markingJobId: params.markingJobId,
            },
          });

          // Send SMS for high-value reminders
          if (agent.phone && job.markingFee.toNumber() >= 15000) {
            const smsMessage = `Reminder: High-value marking job (₦${job.markingFee.toNumber()}) in ${job.property.city} still available. ${params.timeRemaining} to claim. Act fast!`;
            await smsService.sendSMS({
              to: agent.phone,
              message: smsMessage,
            });
          }
        })
      );

      console.log(
        `Job reminder sent to ${agents.length} agents for job ${params.markingJobId}`
      );
    } catch (error) {
      console.error('Error sending job reminder:', error);
      throw error;
    }
  }

  /**
   * Notify agents of queue movement (when someone ahead drops out)
   */
  async notifyQueueMovement(params: {
    agentIds: string[];
    markingJobId: string;
    newPositions: { [agentId: string]: number };
  }): Promise<void> {
    try {
      const agents = await db.user.findMany({
        where: {
          id: { in: params.agentIds },
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
        },
      });

      await Promise.allSettled(
        agents.map(async (agent) => {
          const newPosition = params.newPositions[agent.id];
          if (!newPosition) return;

          // Send push notification
          await pushService.sendPush({
            userId: agent.id,
            title: '📈 You Moved Up in Queue',
            body: `You're now #${newPosition} in line for the marking job`,
            data: {
              type: 'QUEUE_MOVEMENT',
              markingJobId: params.markingJobId,
              queuePosition: newPosition,
            },
          });

          // If they're now #1, send additional SMS alert
          if (newPosition === 1 && agent.phone) {
            const smsMessage = `You're now #1 in queue! This marking job is yours next. Be ready to claim it soon.`;
            await smsService.sendSMS({
              to: agent.phone,
              message: smsMessage,
            });
          }
        })
      );

      console.log(
        `Queue movement notifications sent to ${agents.length} agents`
      );
    } catch (error) {
      console.error('Error notifying queue movement:', error);
      throw error;
    }
  }

  /**
   * Send performance summary to agents (weekly/monthly digest)
   */
  async sendPerformanceSummary(params: {
    agentId: string;
    period: 'weekly' | 'monthly';
    stats: {
      jobsCompleted: number;
      totalEarnings: number;
      averageRating: number;
      rankInCity: number;
    };
  }): Promise<void> {
    try {
      const agent = await db.user.findUnique({
        where: { id: params.agentId },
        select: {
          email: true,
          phone: true,
          name: true,
        },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const templateData = {
        agentName: agent.name || 'Agent',
        period: params.period,
        jobsCompleted: params.stats.jobsCompleted,
        totalEarnings: params.stats.totalEarnings.toLocaleString('en-NG', {
          style: 'currency',
          currency: 'NGN',
        }),
        averageRating: params.stats.averageRating.toFixed(2),
        rankInCity: params.stats.rankInCity,
      };

      // Send email with detailed performance report
      await emailService.sendEmail({
        to: agent.email,
        subject: `Your ${params.period.charAt(0).toUpperCase() + params.period.slice(1)} Performance Report`,
        html: `
          <h2>Hello ${templateData.agentName}!</h2>
          <p>Here's your ${templateData.period} performance summary:</p>
          <ul>
            <li>Jobs Completed: ${templateData.jobsCompleted}</li>
            <li>Total Earnings: ${templateData.totalEarnings}</li>
            <li>Average Rating: ${templateData.averageRating}/5.0</li>
            <li>Rank in Your City: #${templateData.rankInCity}</li>
          </ul>
          <p>Keep up the great work!</p>
        `,
      });

      console.log(
        `Performance summary sent to agent ${params.agentId} for ${params.period} period`
      );
    } catch (error) {
      console.error('Error sending performance summary:', error);
      throw error;
    }
  }

  /**
   * Send emergency broadcast to all available agents
   */
  async sendEmergencyBroadcast(params: {
    title: string;
    message: string;
    urgencyLevel: 'HIGH' | 'URGENT';
    city?: string;
    state?: string;
  }): Promise<void> {
    try {
      const whereClause: any = {
        isAvailableForMarking: true,
      };

      if (params.city) {
        whereClause.agentServiceAreas = {
          has: params.city,
        };
      }

      const agents = await db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
        },
      });

      await Promise.allSettled(
        agents.map(async (agent) => {
          // Send push notification
          await pushService.sendPush({
            userId: agent.id,
            title: params.title,
            body: params.message,
            data: {
              type: 'EMERGENCY_BROADCAST',
              urgency: params.urgencyLevel,
            },
            priority: 'high',
          });

          // Send SMS for urgent broadcasts
          if (agent.phone && params.urgencyLevel === 'URGENT') {
            await smsService.sendSMS({
              to: agent.phone,
              message: `URGENT: ${params.message}`,
            });
          }
        })
      );

      console.log(`Emergency broadcast sent to ${agents.length} agents`);
    } catch (error) {
      console.error('Error sending emergency broadcast:', error);
      throw error;
    }
  }
}

export const agentAlertService = new AgentAlertService();