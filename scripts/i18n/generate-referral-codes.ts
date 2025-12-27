// scripts/generate-referral-codes.ts

import { PrismaClient } from '@newcondo/db';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Bulk Generate Referral Codes Script
 * Generates unique referral codes for existing users without codes
 */

interface GenerationResult {
  totalUsers: number;
  usersWithCodes: number;
  usersWithoutCodes: number;
  codesGenerated: number;
  failures: number;
  csvPath?: string;
}

interface UserCodeRecord {
  userId: string;
  name: string;
  email: string;
  role: string;
  referralCode: string;
  generatedAt: string;
}

/**
 * Main function to generate referral codes
 */
async function generateReferralCodes(): Promise<GenerationResult> {
  console.log('🚀 Starting referral code generation...\n');

  try {
    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
      },
    });

    const totalUsers = allUsers.length;
    const usersWithCodes = allUsers.filter((u) => u.referralCode).length;
    const usersWithoutCodes = allUsers.filter((u) => !u.referralCode);

    console.log(`📊 Statistics:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with codes: ${usersWithCodes}`);
    console.log(`   Users without codes: ${usersWithoutCodes.length}\n`);

    if (usersWithoutCodes.length === 0) {
      console.log('✅ All users already have referral codes!');
      return {
        totalUsers,
        usersWithCodes,
        usersWithoutCodes: 0,
        codesGenerated: 0,
        failures: 0,
      };
    }

    // Generate codes for users without codes
    const generatedRecords: UserCodeRecord[] = [];
    let codesGenerated = 0;
    let failures = 0;

    for (const user of usersWithoutCodes) {
      try {
        // Generate unique code
        const referralCode = await generateUniqueCode();

        // Update user with referral code
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCode },
        });

        // Add to records
        generatedRecords.push({
          userId: user.id,
          name: user.name || 'N/A',
          email: user.email,
          role: user.role,
          referralCode,
          generatedAt: new Date().toISOString(),
        });

        codesGenerated++;

        // Log progress
        if (codesGenerated % 10 === 0) {
          console.log(`   Generated ${codesGenerated}/${usersWithoutCodes.length} codes...`);
        }
      } catch (error) {
        console.error(`   ❌ Failed for user ${user.email}:`, error);
        failures++;
      }
    }

    console.log(`\n✅ Code generation complete!`);
    console.log(`   Codes generated: ${codesGenerated}`);
    console.log(`   Failures: ${failures}\n`);

    // Export to CSV
    const csvPath = await exportToCSV(generatedRecords);

    return {
      totalUsers,
      usersWithCodes,
      usersWithoutCodes: usersWithoutCodes.length,
      codesGenerated,
      failures,
      csvPath,
    };
  } catch (error) {
    console.error('❌ Error generating referral codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generate a unique referral code
 */
async function generateUniqueCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate code using cuid (same as Prisma default)
    const code = generateCodeString();

    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique referral code after maximum attempts');
}

/**
 * Generate code string
 */
function generateCodeString(): string {
  // Generate a readable code (8 characters, alphanumeric)
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Export generated codes to CSV
 */
async function exportToCSV(records: UserCodeRecord[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `referral-codes-${timestamp}.csv`;
  const csvPath = path.join(process.cwd(), 'exports', filename);

  // Create CSV writer
  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'userId', title: 'User ID' },
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'role', title: 'Role' },
      { id: 'referralCode', title: 'Referral Code' },
      { id: 'generatedAt', title: 'Generated At' },
    ],
  });

  // Write records
  await csvWriter.writeRecords(records);

  console.log(`📄 CSV exported to: ${csvPath}\n`);

  return csvPath;
}

/**
 * Validate generated codes
 */
async function validateGeneratedCodes(): Promise<boolean> {
  console.log('🔍 Validating generated codes...\n');

  // Check for duplicates
  const codes = await prisma.user.findMany({
    select: { referralCode: true },
    where: {
      referralCode: { not: null },
    },
  });

  const codeSet = new Set<string>();
  let duplicates = 0;

  for (const { referralCode } of codes) {
    if (referralCode) {
      if (codeSet.has(referralCode)) {
        console.error(`   ❌ Duplicate code found: ${referralCode}`);
        duplicates++;
      }
      codeSet.add(referralCode);
    }
  }

  if (duplicates > 0) {
    console.log(`   ⚠️  Found ${duplicates} duplicate codes!\n`);
    return false;
  }

  console.log(`   ✅ All codes are unique!\n`);
  return true;
}

/**
 * Generate summary report
 */
function generateReport(result: GenerationResult): void {
  console.log('📋 GENERATION REPORT');
  console.log('='.repeat(50));
  console.log(`Total Users:             ${result.totalUsers}`);
  console.log(`Users With Codes:        ${result.usersWithCodes}`);
  console.log(`Users Without Codes:     ${result.usersWithoutCodes}`);
  console.log(`Codes Generated:         ${result.codesGenerated}`);
  console.log(`Failures:                ${result.failures}`);
  if (result.csvPath) {
    console.log(`CSV Export:              ${result.csvPath}`);
  }
  console.log('='.repeat(50));
  console.log('');

  // Success rate
  if (result.usersWithoutCodes > 0) {
    const successRate = (result.codesGenerated / result.usersWithoutCodes) * 100;
    console.log(`✅ Success Rate: ${successRate.toFixed(2)}%\n`);
  }
}

/**
 * CLI options handler
 */
async function main() {
  const args = process.argv.slice(2);
  const validateOnly = args.includes('--validate');
  const dryRun = args.includes('--dry-run');

  console.log('🎯 NewCondo Referral Code Generator\n');

  if (validateOnly) {
    console.log('Running in validation mode...\n');
    const isValid = await validateGeneratedCodes();
    process.exit(isValid ? 0 : 1);
  }

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    const users = await prisma.user.findMany({
      where: { referralCode: null },
      select: { id: true, email: true, role: true },
      take: 10,
    });

    console.log(`📊 Would generate codes for ${users.length} users:`);
    users.forEach((u) => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    console.log('');
    return;
  }

  // Generate codes
  const result = await generateReferralCodes();

  // Generate report
  generateReport(result);

  // Validate after generation
  await validateGeneratedCodes();
}

// Run script
main()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });