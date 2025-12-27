// scripts/referral-report-generator.ts

import { PrismaClient } from '@newcondo/db';
import { referralAnalyticsService } from '../backend/analytics-service/src/services/referralAnalyticsService';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Referral Report Generator Script
 * Generates comprehensive reports for referral program performance
 */

interface ReportOptions {
  period: 'weekly' | 'monthly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  format: 'csv' | 'json' | 'txt';
}

interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  overview: any;
  topReferrers: any[];
  conversionFunnel: any;
  revenueAttribution: any;
  typeBreakdown: any[];
  timeline: any[];
  roi: any;
  viralCoefficient: any;
}

/**
 * Generate comprehensive referral report
 */
async function generateReport(options: ReportOptions): Promise<PerformanceReport> {
  console.log('🚀 Generating referral performance report...\n');

  const { startDate, endDate } = getDateRange(options);

  console.log(`📅 Period: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

  // Gather all analytics data
  console.log('📊 Collecting analytics data...');

  const [overview, topReferrers, funnel, breakdown, timeline, roi, viral] =
    await Promise.all([
      referralAnalyticsService.getOverview({ startDate, endDate }),
      referralAnalyticsService.getTopReferrers({
        metric: 'conversions',
        limit: 10,
        period: '30d',
      }),
      referralAnalyticsService.getConversionFunnel({ startDate, endDate }),
      referralAnalyticsService.getReferralTypeBreakdown({ startDate, endDate }),
      referralAnalyticsService.getReferralTimeline({
        startDate,
        endDate,
        granularity: options.period === 'weekly' ? 'daily' : 'weekly',
      }),
      referralAnalyticsService.getROIAnalysis({ startDate, endDate }),
      referralAnalyticsService.getViralCoefficient({ startDate, endDate }),
    ]);

  console.log('   ✅ Data collected\n');

  // Calculate revenue attribution
  const revenueAttribution = await calculateRevenueAttribution(startDate, endDate);

  const report: PerformanceReport = {
    period: {
      start: startDate,
      end: endDate,
      label: options.period === 'weekly' ? 'Weekly' : 'Monthly',
    },
    overview,
    topReferrers,
    conversionFunnel: funnel,
    revenueAttribution,
    typeBreakdown: breakdown,
    timeline,
    roi,
    viralCoefficient: viral,
  };

  return report;
}

/**
 * Calculate revenue attribution
 */
async function calculateRevenueAttribution(startDate: Date, endDate: Date) {
  const conversions = await prisma.$queryRaw<
    Array<{ referrer_id: string; total_revenue: number; conversion_count: number }>
  >`
    SELECT 
      r."referrerId" as referrer_id,
      COUNT(DISTINCT rc.id) as conversion_count,
      COALESCE(SUM(p.amount), 0) as total_revenue
    FROM "Referral" r
    INNER JOIN "ReferralConversion" rc ON r.id = rc."referralId"
    INNER JOIN "Payment" p ON rc."paymentId" = p.id
    WHERE r."createdAt" >= ${startDate}
      AND r."createdAt" <= ${endDate}
      AND p.status = 'SUCCESS'
    GROUP BY r."referrerId"
    ORDER BY total_revenue DESC
    LIMIT 20
  `;

  return {
    totalRevenue: conversions.reduce((sum, c) => sum + Number(c.total_revenue), 0),
    totalConversions: conversions.reduce((sum, c) => sum + Number(c.conversion_count), 0),
    topContributors: conversions,
  };
}

/**
 * Get date range based on options
 */
function getDateRange(options: ReportOptions): { startDate: Date; endDate: Date } {
  const endDate = options.endDate || new Date();
  let startDate = options.startDate || new Date();

  if (!options.startDate) {
    if (options.period === 'weekly') {
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (options.period === 'monthly') {
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
    }
  }

  return { startDate, endDate };
}

/**
 * Export report to CSV
 */
async function exportToCSV(report: PerformanceReport): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `referral-report-${timestamp}.csv`;
  const reportsDir = path.join(process.cwd(), 'reports');
  const filePath = path.join(reportsDir, filename);

  // Create directory if doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Create CSV writer for top referrers
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'userId', title: 'User ID' },
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'role', title: 'Role' },
      { id: 'totalReferrals', title: 'Total Referrals' },
      { id: 'totalConversions', title: 'Conversions' },
    ],
  });

  await csvWriter.writeRecords(report.topReferrers);

  console.log(`📄 CSV exported to: ${filePath}\n`);

  return filePath;
}

/**
 * Export report to JSON
 */
async function exportToJSON(report: PerformanceReport): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `referral-report-${timestamp}.json`;
  const reportsDir = path.join(process.cwd(), 'reports');
  const filePath = path.join(reportsDir, filename);

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

  console.log(`📄 JSON exported to: ${filePath}\n`);

  return filePath;
}

/**
 * Generate text report
 */
function generateTextReport(report: PerformanceReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('NEWCONDO REFERRAL PROGRAM PERFORMANCE REPORT');
  lines.push('='.repeat(80));
  lines.push(`Period: ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Overview
  lines.push('OVERVIEW');
  lines.push('-'.repeat(80));
  lines.push(`Total Referrals:          ${report.overview.totalReferrals}`);
  lines.push(`Active Referrals:         ${report.overview.activeReferrals}`);
  lines.push(`Qualified Referrals:      ${report.overview.qualifiedReferrals}`);
  lines.push(`Total Rewards:            ₦${Number(report.overview.totalRewards).toLocaleString()}`);
  lines.push(`Paid Rewards:             ₦${Number(report.overview.paidRewards).toLocaleString()}`);
  lines.push(`Pending Rewards:          ₦${Number(report.overview.pendingRewards).toLocaleString()}`);
  lines.push(`Total Revenue:            ₦${Number(report.overview.totalRevenue).toLocaleString()}`);
  lines.push(`Conversion Rate:          ${report.overview.conversionRate.toFixed(2)}%`);
  lines.push(`ROI:                      ${report.overview.roi.toFixed(2)}%`);
  lines.push('');

  // Conversion Funnel
  lines.push('CONVERSION FUNNEL');
  lines.push('-'.repeat(80));
  lines.push(`Clicks:                   ${report.conversionFunnel.clicks}`);
  lines.push(`Signups:                  ${report.conversionFunnel.signups}`);
  lines.push(`Qualified:                ${report.conversionFunnel.qualified}`);
  lines.push(`Rewarded:                 ${report.conversionFunnel.rewarded}`);
  lines.push(`Click → Signup:           ${report.conversionFunnel.clickToSignup.toFixed(2)}%`);
  lines.push(`Signup → Qualified:       ${report.conversionFunnel.signupToQualified.toFixed(2)}%`);
  lines.push(`Qualified → Rewarded:     ${report.conversionFunnel.qualifiedToRewarded.toFixed(2)}%`);
  lines.push('');

  // Top Referrers
  lines.push('TOP 10 REFERRERS');
  lines.push('-'.repeat(80));
  report.topReferrers.forEach((referrer, index) => {
    lines.push(
      `${index + 1}. ${referrer.name || referrer.email} (${referrer.role})`
    );
    lines.push(
      `   Conversions: ${referrer.totalConversions || referrer.totalReferrals}`
    );
  });
  lines.push('');

  // Revenue Attribution
  lines.push('REVENUE ATTRIBUTION');
  lines.push('-'.repeat(80));
  lines.push(`Total Revenue:            ₦${report.revenueAttribution.totalRevenue.toLocaleString()}`);
  lines.push(`Total Conversions:        ${report.revenueAttribution.totalConversions}`);
  lines.push('');

  // Type Breakdown
  lines.push('REFERRAL TYPE BREAKDOWN');
  lines.push('-'.repeat(80));
  report.typeBreakdown.forEach((type) => {
    lines.push(`${type.type}:`);
    lines.push(`   Count: ${type.count}`);
    lines.push(`   Total Rewards: ₦${Number(type.totalRewards).toLocaleString()}`);
  });
  lines.push('');

  // ROI Analysis
  lines.push('ROI ANALYSIS');
  lines.push('-'.repeat(80));
  lines.push(`Total Reward Cost:        ₦${Number(report.roi.totalRewardCost).toLocaleString()}`);
  lines.push(`Total Revenue:            ₦${Number(report.roi.totalRevenue).toLocaleString()}`);
  lines.push(`Net Profit:               ₦${Number(report.roi.netProfit).toLocaleString()}`);
  lines.push(`ROI:                      ${report.roi.roi.toFixed(2)}%`);
  lines.push('');

  // Viral Coefficient
  lines.push('VIRAL GROWTH METRICS');
  lines.push('-'.repeat(80));
  lines.push(`K-Factor:                 ${report.viralCoefficient.kFactor.toFixed(2)}`);
  lines.push(`Invites Per User:         ${report.viralCoefficient.invitesPerUser.toFixed(2)}`);
  lines.push(`Conversion Rate:          ${(report.viralCoefficient.conversionRate * 100).toFixed(2)}%`);
  lines.push(`Status:                   ${report.viralCoefficient.viralityStatus}`);
  lines.push('');

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Save text report to file
 */
async function exportToText(report: PerformanceReport): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `referral-report-${timestamp}.txt`;
  const reportsDir = path.join(process.cwd(), 'reports');
  const filePath = path.join(reportsDir, filename);

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportText = generateTextReport(report);
  fs.writeFileSync(filePath, reportText);

  console.log(`📄 Text report exported to: ${filePath}\n`);

  return filePath;
}

/**
 * Print summary to console
 */
function printSummary(report: PerformanceReport): void {
  console.log(generateTextReport(report));
}

/**
 * CLI options handler
 */
async function main() {
  const args = process.argv.slice(2);

  const period = (args.find((a) => a.startsWith('--period='))?.split('=')[1] ||
    'monthly') as 'weekly' | 'monthly' | 'custom';
  const format = (args.find((a) => a.startsWith('--format='))?.split('=')[1] ||
    'txt') as 'csv' | 'json' | 'txt';

  console.log('🎯 NewCondo Referral Report Generator\n');

  const options: ReportOptions = {
    period,
    format,
  };

  // Generate report
  const report = await generateReport(options);

  // Print to console
  printSummary(report);

  // Export based on format
  if (format === 'csv') {
    await exportToCSV(report);
  } else if (format === 'json') {
    await exportToJSON(report);
  } else {
    await exportToText(report);
  }

  // Disconnect
  await prisma.$disconnect();
}

// Run script
main()
  .then(() => {
    console.log('✅ Report generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Report generation failed:', error);
    process.exit(1);
  });