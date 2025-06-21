// backend/auth-service/src/middleware/sessionMiddleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { sessionService } from '../services/sessionService'
import { lockoutService } from '../services/lockoutService'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Check if session is still valid
    const session = await sessionService.getSession(decoded.sessionId)
    if (!session || session.expires < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      })
    }

    // Check if user account is locked
    const isLocked = await lockoutService.isAccountLocked(decoded.userId)
    if (isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked'
      })
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }

    next()
  } catch (error) {
    console.error('Token verification error:', error)
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

export const refreshTokenMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.headers.authorization?.split(' ')[1]

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any
    
    // Check if refresh token session exists
    const session = await sessionService.getSession(decoded.sessionId)
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }

    next()
  } catch (error) {
    console.error('Refresh token verification error:', error)
    return res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    })
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>()

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip
    const now = Date.now()

    let userRecord = userRequestCounts.get(userId)
    
    if (!userRecord || now > userRecord.resetTime) {
      userRecord = {
        count: 1,
        resetTime: now + windowMs
      }
      userRequestCounts.set(userId, userRecord)
      return next()
    }

    if (userRecord.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRecord.resetTime - now) / 1000)
      })
    }

    userRecord.count++
    next()
  }
}