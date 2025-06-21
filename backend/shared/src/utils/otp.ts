// backend/shared/src/utils/otp.ts
import crypto from 'crypto';
import { prisma } from '@newcondo/db';

export const generateOTP = (length: number = 6): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

export const generateSecureCode = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const createOTP = async (
  identifier: string,
  type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN',
  expiresInMinutes: number = 10
) => {
  const code = generateOTP(6);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Delete any existing OTP for this identifier and type
  await prisma.oTPCode.deleteMany({
    where: {
      identifier,
      type,
    }
  });

  // Create new OTP
  const otpRecord = await prisma.oTPCode.create({
    data: {
      identifier,
      code,
      type,
      expiresAt,
      maxAttempts: 3,
      attempts: 0,
      verified: false
    }
  });

  return {
    code,
    expiresAt,
    id: otpRecord.id
  };
};

export const verifyOTP = async (
  identifier: string,
  code: string,
  type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN'
) => {
  const otpRecord = await prisma.oTPCode.findFirst({
    where: {
      identifier,
      type,
      verified: false,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!otpRecord) {
    return { success: false, message: 'Invalid or expired OTP' };
  }

  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    return { success: false, message: 'Maximum attempts exceeded' };
  }

  if (otpRecord.code !== code) {
    // Increment attempts
    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 }
    });
    
    return { 
      success: false, 
      message: 'Invalid OTP',
      attemptsLeft: otpRecord.maxAttempts - (otpRecord.attempts + 1)
    };
  }

  // Mark as verified
  await prisma.oTPCode.update({
    where: { id: otpRecord.id },
    data: { verified: true }
  });

  return { success: true, message: 'OTP verified successfully' };
};

export const cleanupExpiredOTPs = async () => {
  const result = await prisma.oTPCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return result.count;
};