// backend/referral-service/src/cron/reminderJob.ts

import cron from 'node-cron';
import { PrismaClient } from '@newcondo/db';
import { expirationService } from '../services/expirationService';

const prisma = new PrismaClient();

/**
 * Reminder Cron Job
 * Sends reminder notifications for pending referrals and expiring rewards
 * Runs twice daily at 9:00 AM and 6:00 PM
 */

interface ReminderJobResult {
  success: boolean;
  timestamp: Date;
  remindersSent: {
    expiringRewards: number;
    incompleteReferrals: number;
    milestones: number;
  };
  error?: string;
}

/**
 * Execute the reminder job
 */
async function executeReminderJob(): Promise<ReminderJobResult> {
  const startTime = new Date();
  console.log(`[Reminder Job] Starting at ${startTime.toISOString()}`);

  try {
    const results = {
      expiringRewards: 0,
      incompleteReferrals: 0,
      milestones: 0,
    };

    // 1. Send reminders for expiring rewards
    results.expiringRewards = await sendExpiringRewardReminders();

    // 2. Send reminders for incomplete referrals
    results.incompleteReferrals = await sendIncompleteReferralReminders();

    // 3. Check and notify milestone achievements
    results.milestones = await notifyMilestoneAchievements();

    console.log('[Reminder Job] Results:', results);

    // Log job execution
    await logReminderJobExecution({
      success: true,
      remindersSent: results,
      duration: Date.now() - startTime.getTime(),
    });

    console.log(
      `[Reminder Job] Completed successfully in ${Date.now() - startTime.getTime()}ms`
    );

    return {
      success: true,
      timestamp: new Date(),
      remindersSent: results,
    };
  } catch (error) {
    console.error('[Reminder Job] Failed:', error);

    await logReminderJobExecution({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime.getTime(),
    });

    return {
      success: false,
      timestamp: new Date(),
      remindersSent: { expiringRewards: 0, incompleteReferrals: 0, milestones: 0 },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send reminders for rewards expiring soon
 */
async function sendExpiringRewardReminders(): Promise<number> {
  try {
    // Get rewards expiring in 7, 3, and 1 day(s)
    const expiringIn7Days = await expirationService.findExpiringRewards(7);
    const expiringIn3Days = await expirationService.findExpiringRewards(3);
    const expiringIn1Day = await expirationService.findExpiringRewards(1);

    let remindersSent = 0;

    // Process 7-day reminders
    for (const reward of expiringIn7Days) {
      const sent = await sendRewardExpiryReminder(reward, 7);
      if (sent) remindersSent++;
    }

    // Process 3-day reminders
    for (const reward of expiringIn3Days) {
      const sent = await sendRewardExpiryReminder(reward, 3);
      if (sent) remindersSent++;
    }

    // Process 1-day reminders (urgent)
    for (const reward of expiringIn1Day) {
      const sent = await sendRewardExpiryReminder(reward, 1);
      if (sent) remindersSent++;
    }

    console.log(`[Reminder Job] Sent ${remindersSent} expiring reward reminders`);
    return remindersSent;
  } catch (error) {
    console.error('[Reminder Job] Error sending expiring reward reminders:', error);
    return 0;
  }
}

/**
 * Send reminder for a specific expiring reward
 */
async function sendRewardExpiryReminder(
  reward: any,
  daysRemaining: number
): Promise<boolean> {
  try {
    // Check if reminder was already sent for this timeframe
    const existingReminder = await prisma.eventLog.findFirst({
      where: {
        userId: reward.userId,
        type: 'REWARD_EXPIRY_REMINDER_SENT',
        metadata: {
          path: ['rewardId'],
          equals: reward.id,
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (existingReminder) {
      return false; // Already sent reminder recently
    }

    // Log the reminder
    await prisma.eventLog.create({
      data: {
        userId: reward.userId,
        type: 'REWARD_EXPIRY_REMINDER_SENT',
        metadata: {
          rewardId: reward.id,
          amount: reward.amount.toString(),
          rewardType: reward.rewardType,
          daysRemaining,
          expiresAt: reward.expiresAt?.toISOString(),
        },
      },
    });

    // TODO: Send actual email/SMS via notification service
    console.log(
      `[Reminder Job] Reminder sent to ${reward.user.email}: ₦${reward.amount} expires in ${daysRemaining} day(s)`
    );

    return true;
  } catch (error) {
    console.error('[Reminder Job] Error sending reward reminder:', error);
    return false;
  }
}

/**
 * Send reminders for incomplete referrals
 */
async function sendIncompleteReferralReminders(): Promise<number> {
  try {
    // Find referrals that are pending and not yet qualified
    // Send reminder to referred users to complete their first action
    const incompleteReferrals = await prisma.referral.findMany({
      where: {
        status: 'PENDING',
        qualificationMet: false,
        createdAt: {
          // Created 3-7 days ago
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        referrer: {
          select: { id: true, name: true, email: true, role: true },
        },
        referred: {
          select: { id: true, name: true, email: true },
        },
      },
      take: 100, // Limit to prevent overwhelming the system
    });

    let remindersSent = 0;

    for (const referral of incompleteReferrals) {
      // Check if reminder already sent
      const existingReminder = await prisma.eventLog.findFirst({
        where: {
          userId: referral.referredId,
          type: 'INCOMPLETE_REFERRAL_REMINDER_SENT',
          metadata: {
            path: ['referralId'],
            equals: referral.id,
          },
          timestamp: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // Last 48 hours
          },
        },
      });

      if (existingReminder) continue;

      // Log reminder
      await prisma.eventLog.create({
        data: {
          userId: referral.referredId,
          type: 'INCOMPLETE_REFERRAL_REMINDER_SENT',
          metadata: {
            referralId: referral.id,
            referrerId: referral.referrerId,
            referralCode: referral.referralCode,
            referrerName: referral.referrer.name,
            referrerReward: referral.referrerReward?.toString(),
            referredReward: referral.referredReward?.toString(),
          },
        },
      });

      // TODO: Send actual email/SMS
      console.log(
        `[Reminder Job] Incomplete referral reminder sent to ${referral.referred.email}`
      );

      remindersSent++;
    }

    console.log(`[Reminder Job] Sent ${remindersSent} incomplete referral reminders`);
    return remindersSent;
  } catch (error) {
    console.error('[Reminder Job] Error sending incomplete referral reminders:', error);
    return 0;
  }
}

/**
 * Check and notify milestone achievements
 */
async function notifyMilestoneAchievements(): Promise<number> {
  try {
    const milestones = [5, 10, 25, 50, 100];
    let notificationsSent = 0;

    // Get users who recently hit milestones
    const userReferralCounts = await prisma.referral.groupBy({
      by: ['referrerId'],
      where: {
        qualificationMet: true,
      },
      _count: {
        id: true,
      },
    });

    for (const userCount of userReferralCounts) {
      const count = userCount._count.id;

      // Check if user hit a milestone
      if (!milestones.includes(count)) continue;

      // Check if we already notified for this milestone
      const existingNotification = await prisma.eventLog.findFirst({
        where: {
          userId: userCount.referrerId,
          type: 'REFERRAL_MILESTONE_ACHIEVED',
          metadata: {
            path: ['milestone'],
            equals: count,
          },
        },
      });

      if (existingNotification) continue;

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userCount.referrerId },
        select: { id: true, name: true, email: true },
      });

      if (!user) continue;

      // Calculate bonus reward (example: 10% of milestone)
      const bonusAmount = count * 1000; // ₦1,000 per referral in milestone

      // Create bonus reward
      const bonusReward = await prisma.referralReward.create({
        data: {
          userId: user.id,
          rewardType: 'SERVICE_CREDIT',
          amount: bonusAmount,
          description: `Milestone bonus for ${count} qualified referrals!`,
          status: 'APPROVED',
          isRedeemed: false,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });

      // Log milestone achievement
      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: 'REFERRAL_MILESTONE_ACHIEVED',
          metadata: {
            milestone: count,
            bonusAmount: bonusAmount.toString(),
            rewardId: bonusReward.id,
          },
        },
      });

      // TODO: Send celebration email/SMS
      console.log(
        `[Reminder Job] Milestone notification sent to ${user.email}: ${count} referrals, bonus ₦${bonusAmount}`
      );

      notificationsSent++;
    }

    console.log(`[Reminder Job] Sent ${notificationsSent} milestone notifications`);
    return notificationsSent;
  } catch (error) {
    console.error('[Reminder Job] Error notifying milestone achievements:', error);
    return 0;
  }
}

/**
 * Log reminder job execution
 */
async function logReminderJobExecution(data: {
  success: boolean;
  remindersSent?: any;
  error?: string;
  duration: number;
}) {
  try {
    await prisma.eventLog.create({
      data: {
        type: 'REMINDER_JOB_EXECUTED',
        metadata: {
          success: data.success,
          remindersSent: data.remindersSent,
          error: data.error,
          duration: data.duration,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('[Reminder Job] Failed to log execution:', error);
  }
}

/**
 * Schedule the reminder job
 * Runs twice daily: 9:00 AM and 6:00 PM Nigerian time (WAT)
 */
export function scheduleReminderJob() {
  // Run at 9:00 AM
  const morningSchedule = '0 9 * * *';
  // Run at 6:00 PM
  const eveningSchedule = '0 18 * * *';

  console.log('[Reminder Job] Scheduling twice-daily reminder job (9 AM & 6 PM)');

  const morningJob = cron.schedule(
    morningSchedule,
    async () => {
      console.log('[Reminder Job] Morning job triggered');
      await executeReminderJob();
    },
    {
      scheduled: true,
      timezone: 'Africa/Lagos',
    }
  );

  const eveningJob = cron.schedule(
    eveningSchedule,
    async () => {
      console.log('[Reminder Job] Evening job triggered');
      await executeReminderJob();
    },
    {
      scheduled: true,
      timezone: 'Africa/Lagos',
    }
  );

  return { morningJob, eveningJob };
}

/**
 * Manually trigger the reminder job
 */
export async function triggerReminderJobManually(): Promise<ReminderJobResult> {
  console.log('[Reminder Job] Manually triggered');
  return executeReminderJob();
}

/**
 * Get job status
 */
export async function getReminderJobStatus() {
  try {
    const lastRun = await prisma.eventLog.findFirst({
      where: {
        type: 'REMINDER_JOB_EXECUTED',
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (!lastRun) {
      return {
        status: 'never_run',
        lastRun: null,
      };
    }

    const metadata = lastRun.metadata as any;

    return {
      status: metadata.success ? 'success' : 'failed',
      lastRun: {
        timestamp: lastRun.timestamp,
        success: metadata.success,
        remindersSent: metadata.remindersSent,
        error: metadata.error,
        duration: metadata.duration,
      },
      nextRuns: {
        morning: getNextMorningRun(),
        evening: getNextEveningRun(),
      },
    };
  } catch (error) {
    console.error('[Reminder Job] Error getting status:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function getNextMorningRun(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function getNextEveningRun(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(18, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// Export for use in main app
export default {
  scheduleReminderJob,
  triggerReminderJobManually,
  getReminderJobStatus,
};