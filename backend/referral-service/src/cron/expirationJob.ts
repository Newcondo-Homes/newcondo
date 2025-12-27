// backend/referral-service/src/cron/expirationJob.ts

import cron from 'node-cron';
import { PrismaClient } from '@newcondo/db';
import { expirationService } from '../services/expirationService';

const prisma = new PrismaClient();

/**
 * Expiration Cron Job
 * Runs daily at midnight to expire old referrals and rewards
 */

interface ExpirationJobResult {
  success: boolean;
  timestamp: Date;
  results?: {
    referrals: { expired: number; referrals: string[] };
    rewards: { expired: number; rewards: any[] };
    clicks: { deleted: number };
  };
  error?: string;
}

/**
 * Execute the expiration job
 */
async function executeExpirationJob(): Promise<ExpirationJobResult> {
  const startTime = new Date();
  console.log(`[Expiration Job] Starting at ${startTime.toISOString()}`);

  try {
    // Run batch expiration
    const results = await expirationService.batchExpire();

    console.log('[Expiration Job] Results:', {
      expiredReferrals: results.referrals.expired,
      expiredRewards: results.rewards.expired,
      deletedClicks: results.clicks.deleted,
    });

    // Send notifications for expired items
    await sendExpirationNotifications(results);

    // Create admin notification
    await notifyAdminOfExpiration(results);

    // Log the job execution
    await logJobExecution({
      success: true,
      results,
      duration: Date.now() - startTime.getTime(),
    });

    console.log(
      `[Expiration Job] Completed successfully in ${Date.now() - startTime.getTime()}ms`
    );

    return {
      success: true,
      timestamp: new Date(),
      results,
    };
  } catch (error) {
    console.error('[Expiration Job] Failed:', error);

    // Log the failure
    await logJobExecution({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime.getTime(),
    });

    // Notify admin of failure
    await notifyAdminOfFailure(error);

    return {
      success: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notifications for expired items
 */
async function sendExpirationNotifications(results: {
  referrals: { expired: number; referrals: string[] };
  rewards: { expired: number; rewards: any[] };
  clicks: { deleted: number };
}) {
  try {
    // Notify users about expired rewards
    for (const reward of results.rewards.rewards) {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: reward.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) continue;

      // Create notification event
      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: 'REWARD_EXPIRED_NOTIFICATION',
          metadata: {
            rewardId: reward.id,
            amount: reward.amount.toString(),
            rewardType: reward.type,
          },
        },
      });

      // TODO: Send actual email/SMS notification via notification service
      console.log(
        `[Expiration Job] Would send notification to ${user.email} about expired reward ₦${reward.amount}`
      );
    }

    // Notify users about expired referrals
    for (const referralId of results.referrals.referrals) {
      const referral = await prisma.referral.findUnique({
        where: { id: referralId },
        include: {
          referrer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!referral) continue;

      await prisma.eventLog.create({
        data: {
          userId: referral.referrerId,
          type: 'REFERRAL_EXPIRED_NOTIFICATION',
          metadata: {
            referralId: referral.id,
            referralCode: referral.referralCode,
          },
        },
      });

      console.log(
        `[Expiration Job] Would send notification to ${referral.referrer.email} about expired referral`
      );
    }
  } catch (error) {
    console.error('[Expiration Job] Error sending notifications:', error);
  }
}

/**
 * Notify admin of expiration results
 */
async function notifyAdminOfExpiration(results: any) {
  try {
    // Create admin event log
    await prisma.eventLog.create({
      data: {
        type: 'ADMIN_EXPIRATION_REPORT',
        metadata: {
          expiredReferrals: results.referrals.expired,
          expiredRewards: results.rewards.expired,
          deletedClicks: results.clicks.deleted,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log('[Expiration Job] Admin notified of expiration results');
  } catch (error) {
    console.error('[Expiration Job] Error notifying admin:', error);
  }
}

/**
 * Notify admin of job failure
 */
async function notifyAdminOfFailure(error: any) {
  try {
    await prisma.eventLog.create({
      data: {
        type: 'ADMIN_EXPIRATION_JOB_FAILED',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // TODO: Send urgent notification to admin via email/SMS
    console.error('[Expiration Job] URGENT: Job failed, admin notified');
  } catch (logError) {
    console.error('[Expiration Job] Failed to notify admin:', logError);
  }
}

/**
 * Log job execution to database
 */
async function logJobExecution(data: {
  success: boolean;
  results?: any;
  error?: string;
  duration: number;
}) {
  try {
    await prisma.eventLog.create({
      data: {
        type: 'EXPIRATION_JOB_EXECUTED',
        metadata: {
          success: data.success,
          results: data.results,
          error: data.error,
          duration: data.duration,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('[Expiration Job] Failed to log execution:', error);
  }
}

/**
 * Schedule the expiration job
 * Runs daily at 00:00 (midnight) Nigerian time (WAT - UTC+1)
 */
export function scheduleExpirationJob() {
  // Run at midnight every day (00:00)
  // Cron format: minute hour day month weekday
  const schedule = '0 0 * * *'; // Every day at 00:00

  console.log('[Expiration Job] Scheduling daily expiration job at midnight');

  const job = cron.schedule(
    schedule,
    async () => {
      console.log('[Expiration Job] Triggered by schedule');
      await executeExpirationJob();
    },
    {
      scheduled: true,
      timezone: 'Africa/Lagos', // Nigerian timezone (WAT)
    }
  );

  // Also run immediately on startup (useful for testing/missed runs)
  if (process.env.RUN_EXPIRATION_ON_STARTUP === 'true') {
    console.log('[Expiration Job] Running initial expiration check on startup');
    executeExpirationJob();
  }

  return job;
}

/**
 * Manually trigger the expiration job (for admin use)
 */
export async function triggerExpirationJobManually(): Promise<ExpirationJobResult> {
  console.log('[Expiration Job] Manually triggered');
  return executeExpirationJob();
}

/**
 * Get job status and last run info
 */
export async function getJobStatus() {
  try {
    const lastRun = await prisma.eventLog.findFirst({
      where: {
        type: 'EXPIRATION_JOB_EXECUTED',
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
        results: metadata.results,
        error: metadata.error,
        duration: metadata.duration,
      },
      nextRun: getNextRunTime(),
    };
  } catch (error) {
    console.error('[Expiration Job] Error getting status:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate next run time (next midnight)
 */
function getNextRunTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Stop the cron job
 */
export function stopExpirationJob(job: cron.ScheduledTask) {
  job.stop();
  console.log('[Expiration Job] Stopped');
}

// Export for use in main app
export default {
  scheduleExpirationJob,
  triggerExpirationJobManually,
  getJobStatus,
  stopExpirationJob,
};