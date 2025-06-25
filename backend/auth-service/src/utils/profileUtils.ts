// utils/profileUtils.ts
import { Prisma } from '@newcondo/db';
import { UserProfile } from '../types/profile';

// Convert UserProfile with Decimal to a serializable format
export interface SerializableUserProfile extends Omit<UserProfile, 'agentReliabilityScore'> {
  agentReliabilityScore: number | null;
}

// Convert Prisma Decimal to number for API responses
export function serializeUserProfile(user: UserProfile): SerializableUserProfile {
  return {
    ...user,
    agentReliabilityScore: user.agentReliabilityScore 
      ? Number(user.agentReliabilityScore) 
      : null,
  };
}

// Convert number to Prisma Decimal for database operations
export function deserializeReliabilityScore(score: number): Prisma.Decimal {
  return new Prisma.Decimal(score);
}

// Helper function to safely convert Decimal to number
export function decimalToNumber(decimal: Prisma.Decimal | null): number | null {
  return decimal ? Number(decimal) : null;
}

// Helper function to safely convert number to Decimal
export function numberToDecimal(num: number | null): Prisma.Decimal | null {
  return num !== null ? new Prisma.Decimal(num) : null;
}