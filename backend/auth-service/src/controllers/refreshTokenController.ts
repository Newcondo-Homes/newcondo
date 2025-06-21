// backend/auth-service/src/controllers/refreshTokenController.ts
import { Request, Response } from 'express'
import { sessionService } from '../services/sessionService'
import { authService } from '../services/authService'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const refreshTokenController = {
  async refreshAccessToken(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
      }

      const { id: userId } = req.user

      // Get user details
      const user = await authService.getUserById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Generate new access token
      const tokens = await sessionService.generateTokens(user)
      
      // Update session with new access token
      await sessionService.updateSession(tokens.sessionId, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          verificationStatus: user.verificationStatus,
          image: user.image
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 15 * 60 // 15 minutes
        }
      })
    } catch (error) {
      console.error('Refresh token error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  },

  async revokeRefreshToken(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
      }

      const { id: userId } = req.user

      // Revoke all user sessions (logout from all devices)
      await sessionService.revokeUserSessions(userId)

      res.json({
        success: true,
        message: 'Refresh token revoked successfully'
      })
    } catch (error) {
      console.error('Revoke refresh token error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}