// backend/referral-service/src/utils/codeGenerator.ts

import { randomBytes } from 'crypto';
import { REFERRAL_LINK_CONFIG } from '../config/rewards';

/**
 * Generate a unique referral code
 * Format: NC-XXXXXXXX (8 alphanumeric characters)
 */
export function generateReferralCode(): string {
  const { CODE_LENGTH, CODE_PREFIX } = REFERRAL_LINK_CONFIG;
  
  // Generate random alphanumeric string (uppercase)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  const randomBytesBuffer = randomBytes(CODE_LENGTH);
  
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[randomBytesBuffer[i] % chars.length];
  }
  
  return `${CODE_PREFIX}${code}`;
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  const { CODE_LENGTH, CODE_PREFIX } = REFERRAL_LINK_CONFIG;
  const pattern = new RegExp(`^${CODE_PREFIX}[A-Z0-9]{${CODE_LENGTH}}$`);
  return pattern.test(code);
}

/**
 * Generate multiple unique codes
 */
export function generateUniqueReferralCodes(count: number, existingCodes: Set<string>): string[] {
  const codes: string[] = [];
  
  while (codes.length < count) {
    const code = generateReferralCode();
    if (!existingCodes.has(code) && !codes.includes(code)) {
      codes.push(code);
    }
  }
  
  return codes;
}

/**
 * Generate a short code for SMS sharing (6 characters)
 */
export function generateShortReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  const randomBytesBuffer = randomBytes(6);
  
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytesBuffer[i] % chars.length];
  }
  
  return code;
}

/**
 * Obfuscate referral code for public display
 */
export function obfuscateReferralCode(code: string): string {
  if (code.length <= 4) return code;
  
  const visibleChars = 4;
  const visible = code.slice(0, visibleChars);
  const hidden = '*'.repeat(code.length - visibleChars);
  
  return visible + hidden;
}