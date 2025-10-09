// backend/marking-service/src/jobs/notificationDispatcher.ts

import { PrismaClient } from '@newcondo/db';
import cron from 'node-cron';
import axios from 'axios';

const prisma = new PrismaClient();

interface NotificationPayload {
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'ALL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject?: string;
  message: string;
  metadata: Record<string, any>;
}

interface BatchNotificationResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}

/**
 * Notification Dispatcher
 * 
 * Batches and dispatches notifications for marking service events:
 * - New marking job alerts to nearby agents
 * - Assignment confirmations
 * - Completion notifications
 * - Verification reminders
 * - Compensation payments
 * - Queue position updates
 */
class NotificationDispatcher {
  private readonly NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006';
  private readonly BATCH_SIZE = 50;
  private readonly DISPATCH_INTERVAL_MINUTES = 5;

  // Notification event types for marking service
  private readonly EVENT_TYPES = {
    JOB_CREATED: 'MARKING_JOB_CREATED',
    JOB_BROADCAST: 'MARKING_JOB_BROADCAST',
    JOB_ASSIGNED: 'MARKING_JOB_ASSIGNED',
    JOB_COMPLETED: 'MARKING_JOB_COMPLETED',
    VERIFICATION_REMINDER: 'MARKING_VERIFICATION_REMINDER',
    COMPENSATION_PAID: 'MARKING_COMPENSATION_PAID',
    QUEUE_POSITION_UPDATE: 'MARKING_QUEUE_UPDATE',
    TIME_SLOT_EXPIRING: 'MARKING_TIME_SLOT_EXPIRING',
    JOB_CANCELLED: 'MARKING_JOB_CANCELLED',
    FULL_PAYMENT_RELEASED: 'MARKING_PAYMENT_RELEASED',
    JOB_EXPIRED: 'MARKING_JOB_EXPIRED'
  };

  /**
   * Start the notification dispatcher
   */
  startDispatcher(): void {
    console.log('📬 Starting Notification Dispatcher...');
    
    // Run every 5 minutes
    cron.schedule(`*/${this.DISPATCH_INTERVAL_MINUTES} * * * *`, async () => {
      console.log('🔄 Dispatching pending notifications...');
      await this.dispatchPendingNotifications();
    });

    // Also run immediately on startup
    this.dispatchPendingNotifications().catch(console.error);
  }

  /**
   * Dispatch all pending notifications in batches
   */
  private async dispatchPendingNotifications(): Promise<void> {
    try {
      // Get unprocessed event logs for marking service
      const events = await prisma.eventLog.findMany({
        where: {
          type: {
            in: Object.values(this.EVENT_TYPES)
          },
          // Add a processed flag check if available
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: {
          timestamp: 'asc'
        },
        take: this.BATCH_SIZE
      });

      if (events.length === 0) {
        console.log('📭 No pending notifications to dispatch');
        return;
      }

      console.log(`📨 Processing ${events.length} notification events...`);

      // Group events by type for batch processing
      const groupedEvents = this.groupEventsByType(events);

      const results: BatchNotificationResult[] = [];

      for (const [eventType, eventList] of Object.entries(groupedEvents)) {
        try {
          const result = await this.dispatchEventBatch(eventType, eventList);
          results.push(result);
        } catch (error) {
          console.error(`❌ Error dispatching ${eventType}:`, error);
        }
      }

      // Log summary
      const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

      console.log(`✅ Notification dispatch complete:`);
      console.log(`   - Total sent: ${totalSent}`);
      console.log(`   - Total failed: ${totalFailed}`);

    } catch (error) {
      console.error('❌ Error in notification dispatcher:', error);
      throw error;
    }
  }

  /**
   * Group events by type for batch processing
   */
  private groupEventsByType(events: any[]): Record<string, any[]> {
    return events.reduce((groups, event) => {
      const type = event.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(event);
      return groups;
    }, {} as Record<string, any[]>);
  }

  /**
   * Dispatch a batch of events of the same type
   */
  private async dispatchEventBatch(
    eventType: string,
    events: any[]
  ): Promise<BatchNotificationResult> {
    const result: BatchNotificationResult = {
      total: events.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const event of events) {
      try {
        const notification = this.buildNotification(event);
        await this.sendNotification(notification);
        result.sent++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          userId: event.userId || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`📊 ${eventType}: ${result.sent} sent, ${result.failed} failed`);
    return result;
  }

  /**
   * Build notification payload from event log
   */
  private buildNotification(event: any): NotificationPayload {
    const metadata = event.metadata || {};
    
    switch (event.type) {
      case this.EVENT_TYPES.JOB_BROADCAST:
        return {
          userId: event.userId,
          type: 'MARKING_JOB_ALERT',
          channel: 'ALL',
          priority: 'HIGH',
          subject: 'New Property Marking Job Available',
          message: `A new marking job is available near you for ₦${metadata.compensation?.toLocaleString()}. Property: ${metadata.propertyTitle}`,
          metadata: {
            jobId: metadata.jobId,
            propertyId: metadata.propertyId,
            distance: metadata.distance,
            compensation: metadata.compensation
          }
        };

      case this.EVENT_TYPES.JOB_ASSIGNED:
        return {
          userId: event.userId,
          type: 'MARKING_JOB_ASSIGNED',
          channel: 'ALL',
          priority: 'URGENT',
          subject: 'Marking Job Assigned to You',
          message: `You've been assigned a marking job. You have 3 hours to complete it. Property: ${metadata.propertyTitle}`,
          metadata: {
            jobId: metadata.jobId,
            propertyAddress: metadata.propertyAddress,
            contactPerson: metadata.contactPerson,
            contactPhone: metadata.contactPhone,
            timeSlotExpiry: metadata.timeSlotExpiry
          }
        };

      case this.EVENT_TYPES.JOB_COMPLETED:
        return {
          userId: event.userId,
          type: 'MARKING_COMPLETED',
          channel: 'ALL',
          priority: 'HIGH',
          subject: 'Property Marking Completed - Verification Required',
          message: `Your property at ${metadata.propertyAddress} has been marked by ${metadata.agentName}. Please verify within 2-3 days.`,
          metadata: {
            jobId: metadata.jobId,
            propertyId: metadata.propertyId,
            agentName: metadata.agentName,
            completionImages: metadata.completionImages,
            verificationDeadline: metadata.verificationDeadline
          }
        };

      case this.EVENT_TYPES.VERIFICATION_REMINDER:
        return {
          userId: event.userId,
          type: 'VERIFICATION_REMINDER',
          channel: 'EMAIL',
          priority: 'MEDIUM',
          subject: 'Reminder: Verify Your Property Marking',
          message: `You have ${metadata.hoursRemaining} hours left to verify the marking of your property at ${metadata.propertyAddress}.`,
          metadata: {
            jobId: metadata.jobId,
            propertyId: metadata.propertyId,
            hoursRemaining: metadata.hoursRemaining
          }
        };

      case this.EVENT_TYPES.COMPENSATION_PAID:
        return {
          userId: event.userId,
          type: 'COMPENSATION_NOTIFICATION',
          channel: 'ALL',
          priority: 'HIGH',
          subject: 'Partial Compensation Paid to Agent',
          message: metadata.message,
          metadata: {
            jobId: metadata.jobId,
            compensationPaid: metadata.compensationPaid,
            remainingFee: metadata.remainingFee,
            daysExpired: metadata.daysExpired
          }
        };

      case this.EVENT_TYPES.FULL_PAYMENT_RELEASED:
        return {
          userId: event.userId,
          type: 'PAYMENT_RELEASED',
          channel: 'ALL',
          priority: 'HIGH',
          subject: 'Marking Payment Released',
          message: `Your payment of ₦${metadata.amount?.toLocaleString()} for marking job has been released to your virtual account.`,
          metadata: {
            jobId: metadata.jobId,
            amount: metadata.amount,
            virtualAccountBalance: metadata.virtualAccountBalance
          }
        };

      case this.EVENT_TYPES.QUEUE_POSITION_UPDATE:
        return {
          userId: event.userId,
          type: 'QUEUE_UPDATE',
          channel: 'PUSH',
          priority: 'LOW',
          subject: 'Your Queue Position Updated',
          message: `You are now #${metadata.queuePosition} in line for marking job at ${metadata.propertyAddress}`,
          metadata: {
            jobId: metadata.jobId,
            queuePosition: metadata.queuePosition,
            estimatedWaitTime: metadata.estimatedWaitTime
          }
        };

      case this.EVENT_TYPES.TIME_SLOT_EXPIRING:
        return {
          userId: event.userId,
          type: 'TIME_SLOT_WARNING',
          channel: 'ALL',
          priority: 'URGENT',
          subject: 'Your Marking Time Slot is Expiring',
          message: `You have ${metadata.minutesRemaining} minutes left to complete the marking job at ${metadata.propertyAddress}`,
          metadata: {
            jobId: metadata.jobId,
            minutesRemaining: metadata.minutesRemaining
          }
        };

      case this.EVENT_TYPES.JOB_CANCELLED:
        return {
          userId: event.userId,
          type: 'JOB_CANCELLED',
          channel: 'EMAIL',
          priority: 'MEDIUM',
          subject: 'Marking Job Cancelled',
          message: `The marking job for ${metadata.propertyTitle} has been cancelled. ${metadata.reason}`,
          metadata: {
            jobId: metadata.jobId,
            reason: metadata.reason
          }
        };

      default:
        return {
          userId: event.userId,
          type: 'GENERAL_NOTIFICATION',
          channel: 'EMAIL',
          priority: 'LOW',
          message: metadata.message || 'You have a new notification',
          metadata
        };
    }
  }

  /**
   * Send notification to notification service
   */
  private async sendNotification(notification: NotificationPayload): Promise<void> {
    try {
      await axios.post(
        `${this.NOTIFICATION_SERVICE_URL}/api/notifications/send`,
        notification,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service': 'marking-service'
          }
        }
      );
    } catch (error) {
      // If notification service is unavailable, log but don't fail
      console.error(`⚠️  Failed to send notification to ${notification.userId}:`, error);
      
      // Fallback: Store in database for retry
      await this.storeFailedNotification(notification);
    }
  }

  /**
   * Store failed notification for retry
   */
  private async storeFailedNotification(notification: NotificationPayload): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          userId: notification.userId,
          type: 'NOTIFICATION_FAILED',
          metadata: {
            originalType: notification.type,
            notification,
            failedAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('❌ Failed to store failed notification:', error);
    }
  }

  /**
   * Send immediate notification (bypass batch processing)
   */
  async sendImmediateNotification(
    userId: string,
    type: string,
    metadata: Record<string, any>
  ): Promise<void> {
    // Create event log
    const event = await prisma.eventLog.create({
      data: {
        userId,
        type,
        metadata,
        timestamp: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Build and send notification immediately
    const notification = this.buildNotification(event);
    await this.sendNotification(notification);
    
    console.log(`📤 Sent immediate notification to ${userId}: ${type}`);
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcastNotification(
    userIds: string[],
    type: string,
    metadata: Record<string, any>
  ): Promise<void> {
    console.log(`📡 Broadcasting ${type} to ${userIds.length} users...`);

    const promises = userIds.map(userId =>
      this.sendImmediateNotification(userId, type, metadata)
    );

    await Promise.allSettled(promises);
    
    console.log(`✅ Broadcast complete for ${type}`);
  }
}

// Export singleton instance
export const notificationDispatcher = new NotificationDispatcher();

// Auto-start if running directly
if (require.main === module) {
  notificationDispatcher.startDispatcher();
  console.log('📬 Notification Dispatcher running...');
}