"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredOTPs = exports.verifyOTP = exports.createOTP = exports.generateSecureCode = exports.generateOTP = void 0;
// backend/shared/src/utils/otp.ts
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("@newcondo/db");
const generateOTP = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
};
exports.generateOTP = generateOTP;
const generateSecureCode = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateSecureCode = generateSecureCode;
const createOTP = async (identifier, type, expiresInMinutes = 10) => {
    const code = (0, exports.generateOTP)(6);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    // Delete any existing OTP for this identifier and type
    await db_1.prisma.oTPCode.deleteMany({
        where: {
            identifier,
            type,
        }
    });
    // Create new OTP
    const otpRecord = await db_1.prisma.oTPCode.create({
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
exports.createOTP = createOTP;
const verifyOTP = async (identifier, code, type) => {
    const otpRecord = await db_1.prisma.oTPCode.findFirst({
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
        await db_1.prisma.oTPCode.update({
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
    await db_1.prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true }
    });
    return { success: true, message: 'OTP verified successfully' };
};
exports.verifyOTP = verifyOTP;
const cleanupExpiredOTPs = async () => {
    const result = await db_1.prisma.oTPCode.deleteMany({
        where: {
            expiresAt: {
                lt: new Date()
            }
        }
    });
    return result.count;
};
exports.cleanupExpiredOTPs = cleanupExpiredOTPs;
//# sourceMappingURL=otp.js.map