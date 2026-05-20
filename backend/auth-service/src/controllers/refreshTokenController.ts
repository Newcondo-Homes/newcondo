// backend/auth-service/src/controllers/refreshTokenController.ts
import { Request, Response } from "express";
// import { sessionService } from "../services/sessionService";
import { authService } from "../services/authService";
import { Role } from "@newcondo/backend-shared";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export const refreshTokenController = {
  async refreshAccessToken(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { id: userId } = req.user;

      // Get user details
      const user = await authService.getUserSession(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Generate new access token
      // you may Use sessionService for token operations
      // const tokens = await sessionService.generateTokens(user)

      const tokens = await authService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        emailVerified: !!user.emailVerified,
        phoneVerified: !!user.phoneVerified,
      });

      // // Update session with new access token
      // await sessionService.updateSession(tokens.sessionId, {
      //   expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      // });

      // Store the new refresh token
      await authService.storeRefreshToken(user.id, tokens.refreshToken)

      res.json({
        success: true,
        message: "Token refreshed successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          verificationStatus: user.verificationStatus,
          image: user.image,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 15 * 60, // 15 minutes
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  async revokeRefreshToken(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { id: userId } = req.user;

      // Revoke all user sessions (logout from all devices)
      // await sessionService.revokeUserSessions(userId);

      // Revoke all user sessions (logout from all devices)
      await authService.logoutUser(userId)

      res.json({
        success: true,
        message: "Refresh token revoked successfully",
      });
    } catch (error) {
      console.error("Revoke refresh token error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
};
