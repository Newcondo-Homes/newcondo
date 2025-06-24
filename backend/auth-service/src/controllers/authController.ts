import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@newcondo/db'
import { Role } from '@newcondo/db'
import { sendResponse, ApiResponse} from '../../../shared/src/utils/response'
import { generateOTP } from '../../../shared/src/utils/otp'
import { sendEmail } from '../../../shared/src/utils/email'
import { AuthService } from '../services/authService'

export class AuthController {
  private authService = new AuthService()

  async register(req: Request, res: Response): Promise<any> {
    try {
      const { email, password, name, role, phone } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            ...(phone ? [{ phone }] : [])
          ]
        }
      })

      if (existingUser) {
        return sendResponse(res, 400, 'User already exists', null)
      }

      // Hash password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
          phone: phone || null,
          role: role as Role || Role.RENTER,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          verificationStatus: true,
          createdAt: true,
        }
      })

      // Generate and send email verification OTP
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      await prisma.oTPCode.create({
        data: {
          identifier: email,
          code: otp,
          type: 'EMAIL_VERIFICATION',
          expiresAt,
        }
      })

      // Send verification email
      await sendEmail({
        to: email,
        subject: 'Verify your NewCondo account',
        html: `
          <h2>Welcome to NewCondo!</h2>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `
      })

      // Log user registration event
      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: 'USER_REGISTERED',
          metadata: { role: user.role },
        }
      })

      return sendResponse(res, 201, 'User registered successfully. Please check your email for verification code.', {
        user,
        requiresVerification: true
      })
    } catch (error) {
      console.error('Registration error:', error)
      sendResponse(res, 500, 'Internal server error', null)
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      const MAX_ATTEMPTS = 5
      const LOCKOUT_TIME = 30 * 60 * 1000 // 30 minutes

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
          emailVerified: true,
          verificationStatus: true,
          image: true,
        }
      })

      if (!user || !user.passwordHash) {
        return sendResponse(res, 401, 'Invalid credentials', null)
      }

      // Check for account lockout (implement with Redis or database)
      const lockoutKey = `lockout:${email}`
      // In production, use Redis for this
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

      if (!isPasswordValid) {
        return sendResponse(res, 401, 'Invalid credentials', null)
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      // Log successful login
      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: 'USER_LOGIN',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        }
      })

      const { passwordHash, ...userWithoutPassword } = user

      sendResponse(res, 200, 'Login successful', {
        user: userWithoutPassword,
        token,
        expiresIn: '7d'
      })
    } catch (error) {
      console.error('Login error:', error)
      sendResponse(res, 500, 'Internal server error', null)
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        // Don't reveal if email exists
        return sendResponse(res, 200, 'If your email is registered, you will receive a password reset code.', null)
      }

      // Generate reset OTP
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      // Delete any existing password reset codes
      await prisma.oTPCode.deleteMany({
        where: {
          identifier: email,
          type: 'PASSWORD_RESET'
        }
      })

      await prisma.oTPCode.create({
        data: {
          identifier: email,
          code: otp,
          type: 'PASSWORD_RESET',
          expiresAt,
        }
      })

      // Send reset email
      await sendEmail({
        to: email,
        subject: 'Reset your NewCondo password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Your password reset code is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      })

      sendResponse(res, 200, 'If your email is registered, you will receive a password reset code.', null)
    } catch (error) {
      console.error('Forgot password error:', error)
      sendResponse(res, 500, 'Internal server error', null)
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body

      // Verify OTP
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier: email,
          code: otp,
          type: 'PASSWORD_RESET',
          verified: false,
          expiresAt: { gt: new Date() }
        }
      })

      if (!otpRecord) {
        return sendResponse(res, 400, 'Invalid or expired reset code', null)
      }

      // Hash new password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(newPassword, saltRounds)

      // Update user password
      await prisma.user.update({
        where: { email },
        data: { passwordHash }
      })

      // Mark OTP as used
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true }
      })

      // Log password reset
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        await prisma.eventLog.create({
          data: {
            userId: user.id,
            type: 'PASSWORD_RESET',
            ipAddress: req.ip,
          }
        })
      }

      sendResponse(res, 200, 'Password reset successfully', null)
    } catch (error) {
      console.error('Reset password error:', error)
      sendResponse(res, 500, 'Internal server error', null)
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return sendResponse(res, 401, 'Refresh token required', null)
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any
      
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          verificationStatus: true,
        }
      })

      if (!user) {
        return sendResponse(res, 401, 'Invalid refresh token', null)
      }

      // Generate new access token
      const newToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      sendResponse(res, 200, 'Token refreshed successfully', {
        token: newToken,
        user
      })
    } catch (error) {
      console.error('Refresh token error:', error)
      sendResponse(res, 401, 'Invalid refresh token', null)
    }
  }
}
