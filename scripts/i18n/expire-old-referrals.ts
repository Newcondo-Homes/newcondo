// scripts/expire-old-referrals.ts

import { PrismaClient } from '@newcondo/db';
import { expirationService } from '../backend/referral-service/src/services/expirationService';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Manual Expiration Script
 * Manually triggers expiration of old referrals and rewards
 * Can be run via admin or scheduled maintenance
 */

interface ExpirationReport {
  timestamp: Date;
  expiredReferrals: {
    count: number;
    ids: string[];
    details: Array<{
      id: string;
      referrerEmail: string;
      referredEmail: string;
      createdAt: Date;
      reason: string;
    }>;
  };
  expiredRewards: {
    count: number;
    ids: string[];
    totalValue: number;
    details: Array<{
      id: string;
      userEmail: string;
      amount: number;
      type: string;
      createdAt: Date;
    }>;
  };
  deletedClicks: {
    count: number;
  };
  errors: string[];
}

/**
 * Main function to expire old items
 */
async function expireOldItems(): Promise<ExpirationReport> {
  console.log('🚀 Starting manual expiration process...\n');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

  const report: ExpirationReport = {
    timestamp: new Date(),
    expiredReferrals: {
      count: 0,
      ids: [],
      details: [],
    },
    expiredRewards: {
      count: 0,
      ids: [],
      totalValue: 0,
      details: [],
    },
    deletedClicks: {
      count: 0,
    },
    errors: [],
  };

  try {
    // Step 1: Expire pending referrals
    console.log('📋 Step 1: Expiring pending referrals...');
    const referralResult = await expirePendingReferrals();
    report.expiredReferrals = referralResult;
    console.log(`   ✅ Expired ${referralResult.count} referrals\n`);

    // Step 2: Expire unredeemed rewards
    console.log('💰 Step 2: Expiring unredeemed rewards...');
    const rewardResult = await expireUnredeemedRewards();
    report.expiredRewards = rewardResult;
    console.log(`   ✅ Expired ${rewardResult.count} rewards (Total: ₦${rewardResult.totalValue})\n`);

    // Step 3: Clean up old clicks
    console.log('🗑️  Step 3: Cleaning up old click data...');
    const clickResult = await cleanupOldClicks();
    report.deletedClicks = clickResult;
    console.log(`   ✅ Deleted ${clickResult.count} old clicks\n`);

    // Step 4: Get expiration statistics
    console.log('📊 Step 4: Generating statistics...');
    const stats = await expirationService.getExpirationStats();
    console.log('   Statistics:', stats);
    console.log('');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    report.errors.push(errorMessage);
    console.error('❌ Error during expiration:', error);
  }

  return report;
}

/**
 * Expire pending referrals
 */
async function expirePendingReferrals() {
  const result = await expirationService.expirePendingReferrals();

  // Get detailed information about expired referrals
  const details = await Promise.all(
    result.referrals.map(async (id) => {
      const referral = await prisma.referral.findUnique({
        where: { id },
        include: {
          referrer: { select: { email: true } },
          referred: { select: { email: true } },
        },
      });

      return {
        id,
        referrerEmail: referral?.referrer.email || 'N/A',
        referredEmail: referral?.referred.email || 'N/A',
        createdAt: referral?.createdAt || new Date(),
        reason: 'Pending referral not qualified within 30 days',
      };
    })
  );

  return {
    count: result.expired,
    ids: result.referrals,
    details,
  };
}

/**
 * Expire unredeemed rewards
 */
async function expireUnredeemedRewards() {
  const result = await expirationService.expireUnredeemedRewards();

  // Calculate total value
  const totalValue = result.rewards.reduce(
    (sum, reward) => sum + Number(reward.amount),
    0
  );

  // Get detailed information
  const details = await Promise.all(
    result.rewards.map(async (reward) => {
      const user = await prisma.user.findUnique({
        where: { id: reward.userId },
        select: { email: true },
      });

      return {
        id: reward.id,
        userEmail: user?.email || 'N/A',
        amount: Number(reward.amount),
        type: reward.type,
        createdAt: new Date(),
      };
    })
  );

  return {
    count: result.expired,
    ids: result.rewards.map((r) => r.id),
    totalValue,
    details,
  };
}

/**
 * Clean up old click data
 */
async function cleanupOldClicks() {
  const result = await expirationService.cleanupExpiredClicks();
  return {
    count: result.deleted,
  };
}

/**
 * Send report to admin
 */
async function sendAdminReport(report: ExpirationReport): Promise<void> {
  console.log('📧 Sending report to admin...');

  try {
    // Create admin notification
    await prisma.eventLog.create({
      data: {
        type: 'ADMIN_EXPIRATION_REPORT',
        metadata: {
          timestamp: report.timestamp.toISOString(),
          expiredReferrals: report.expiredReferrals.count,
          expiredRewards: report.expiredRewards.count,
          expiredRewardValue: report.expiredRewards.totalValue,
          deletedClicks: report.deletedClicks.count,
          errors: report.errors,
        },
      },
    });

    console.log('   ✅ Admin notification created\n');
  } catch (error) {
    console.error('   ❌ Failed to send admin report:', error);
  }
}

/**
 * Generate detailed text report
 */
function generateTextReport(report: ExpirationReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(70));
  lines.push('REFERRAL EXPIRATION REPORT');
  lines.push('='.repeat(70));
  lines.push(`Generated: ${report.timestamp.toISOString()}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('-'.repeat(70));
  lines.push(`Expired Referrals:       ${report.expiredReferrals.count}`);
  lines.push(`Expired Rewards:         ${report.expiredRewards.count}`);
  lines.push(`Expired Reward Value:    ₦${report.expiredRewards.totalValue.toLocaleString()}`);
  lines.push(`Deleted Clicks:          ${report.deletedClicks.count}`);
  lines.push(`Errors:                  ${report.errors.length}`);
  lines.push('');

  // Expired Referrals Details
  if (report.expiredReferrals.count > 0) {
    lines.push('EXPIRED REFERRALS');
    lines.push('-'.repeat(70));
    report.expiredReferrals.details.forEach((detail, index) => {
      lines.push(`${index + 1}. ${detail.referrerEmail} → ${detail.referredEmail}`);
      lines.push(`   Created: ${detail.createdAt.toISOString()}`);
      lines.push(`   Reason: ${detail.reason}`);
      lines.push('');
    });
  }

  // Expired Rewards Details
  if (report.expiredRewards.count > 0) {
    lines.push('EXPIRED REWARDS');
    lines.push('-'.repeat(70));
    report.expiredRewards.details.forEach((detail, index) => {
      lines.push(`${index + 1}. ${detail.userEmail}`);
      lines.push(`   Amount: ₦${detail.amount.toLocaleString()}`);
      lines.push(`   Type: ${detail.type}`);
      lines.push('');
    });
  }

  // Errors
  if (report.errors.length > 0) {
    lines.push('ERRORS');
    lines.push('-'.repeat(70));
    report.errors.forEach((error, index) => {
      lines.push(`${index + 1}. ${error}`);
    });
    lines.push('');
  }

  lines.push('='.repeat(70));

  return lines.join('\n');
}

/**
 * Save report to file
 */
async function saveReportToFile(report: ExpirationReport): Promise<string> {
  const timestamp = report.timestamp.toISOString().replace(/[:.]/g, '-');
  const filename = `expiration-report-${timestamp}.txt`;
  const reportsDir = path.join(process.cwd(), 'reports');
  const filePath = path.join(reportsDir, filename);

  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Generate and save report
  const reportText = generateTextReport(report);
  fs.writeFileSync(filePath, reportText);

  console.log(`📄 Report saved to: ${filePath}\n`);

  return filePath;
}

/**
 * Print summary to console
 */
function printSummary(report: ExpirationReport): void {
  console.log('📋 EXPIRATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Timestamp:               ${report.timestamp.toISOString()}`);
  console.log(`Expired Referrals:       ${report.expiredReferrals.count}`);
  console.log(`Expired Rewards:         ${report.expiredRewards.count}`);
  console.log(`Expired Reward Value:    ₦${report.expiredRewards.totalValue.toLocaleString()}`);
  console.log(`Deleted Clicks:          ${report.deletedClicks.count}`);
  console.log(`Errors:                  ${report.errors.length}`);
  console.log('='.repeat(50));
  console.log('');
}

/**
 * CLI options handler
 */
async function main() {
  const args = process.argv.slice(2);
  const skipNotification = args.includes('--skip-notification');
  const saveReport = args.includes('--save-report');

  console.log('🎯 NewCondo Referral Expiration Script\n');

  // Run expiration
  const report = await expireOldItems();

  // Print summary
  printSummary(report);

  // Save report to file
  if (saveReport) {
    await saveReportToFile(report);
  }

  // Send admin notification
  if (!skipNotification) {
    await sendAdminReport(report);
  }

  // Disconnect from database
  await prisma.$disconnect();
}

// Run script
main()
  .then(() => {
    console.log('✅ Expiration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });