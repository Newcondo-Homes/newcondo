import { Request, Response } from 'express'
import { prisma } from '@newcondo/db'
import { sendResponse } from '../../../shared/src/utils/response'
import { generateOTP } from '../../../shared/src/utils/otp'
import { sendEmail } from '../../../shared/src/utils/email'

export class OTPController {
  async sendOTP(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body // identifier can be email
      
      // Generate OTP
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Delete any existing OTP for this identifier and type
      await prisma.oTPCode.deleteMany({
        where: {
          identifier,
          type
        }
      })

      // Create new OTP
      await prisma.oTPCode.create({
        data: {
          identifier,
          code: otp,
          type,
          expiresAt,
        }
      })

      // Send OTP based on type
      if (type === 'EMAIL_VERIFICATION' || type === 'LOGIN') {
        await sendEmail({
          to: identifier,
          subject: 'Your NewCondo verification code',
          html: `
            <h2>Verification Code</h2>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
          `
        })
      }

      sendResponse(res, 200, 'OTP sent successfully', { 
        message: 'Please check your email for the verification code',
        expiresIn: 600 // 10 minutes in seconds
      })
    } catch (error) {
      console.error('Send OTP error:', error)
      sendResponse(res, 500, 'Failed to send OTP', null)
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      const { identifier, code, type } = req.body

      // Find and verify OTP
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          code,
          type,
          verified: false,
          expiresAt: { gt: new Date() },
          attempts: { lt: 3 } // Max 3 attempts
        }
      })

      if (!otpRecord) {
        // Increment attempts if record exists
        await prisma.oTPCode.updateMany({
          where: {
            identifier,
            type,
            verified: false
          },
          data: {
            attempts: { increment: 1 }
          }
        })

        return sendResponse(res, 400, 'Invalid or expired OTP', null)
      }

      // Mark OTP as verified
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true }
      })

      // Update user verification status based on OTP type
      if (type === 'EMAIL_VERIFICATION') {
        await prisma.user.update({
          where: { email: identifier },
          data: { 
            emailVerified: new Date() 
          }
        })
      }

      // Log verification event
      const user = await prisma.user.findUnique({
        where: { email: identifier }
      })

      if (user) {
        await prisma.eventLog.create({
          data: {
            userId: user.id,
            type: 'OTP_VERIFIED',
            metadata: { otpType: type }
          }
        })
      }

      sendResponse(res, 200, 'OTP verified successfully', {
        verified: true,
        type
      })
    } catch (error) {
      console.error('Verify OTP error:', error)
      sendResponse(res, 500, 'Failed to verify OTP', null)
    }
  }

  async resendOTP(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body

      // Check if we can resend (not too frequent)
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          type,
          createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) } // 2 minutes ago
        }
      })

      if (recentOTP) {
        return sendResponse(res, 429, 'Please wait before requesting another code', null)
      }

      // Generate new OTP
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Delete existing OTPs
      await prisma.oTPCode.deleteMany({
        where: {
          identifier,
          type
        }
      })

      // Create new OTP
      await prisma.oTPCode.create({
        data: {
          identifier,
          code: otp,
          type,
          expiresAt,
        }
      })

      // Send new OTP
      if (type === 'EMAIL_VERIFICATION' || type === 'LOGIN') {
        await sendEmail({
          to: identifier,
          subject: 'Your NewCondo verification code (Resent)',
          html: `
            <h2>Verification Code</h2>
            <p>Your new verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
          `
        })
      }

      sendResponse(res, 200, 'New OTP sent successfully', {
        message: 'Please check your email for the new verification code'
      })
    } catch (error) {
      console.error('Resend OTP error:', error)
      sendResponse(res, 500, 'Failed to resend OTP', null)
    }
  }
}

export {OTPController as otpController}