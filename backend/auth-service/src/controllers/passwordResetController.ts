// backend/auth-service/src/controllers/passwordResetController.ts
import { Request, Response } from 'express';
import { passwordResetService } from '../services/passwordResetService';
import { ApiResponse } from '@newcondo/backend-shared';

export const passwordResetController = {
  async requestReset(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      await passwordResetService.requestPasswordReset(email);
      
      // Always return success to prevent email enumeration attacks
      const response: ApiResponse = {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.',
        data: null
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Password reset request error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'An error occurred while processing your request',
        data: null
      };
      
      res.status(500).json(response);
    }
  },

  async verifyResetToken(req: Request, res: Response) {
    try {
      const { token } = req.params;
      
      const isValid = await passwordResetService.verifyResetToken(token);
      
      if (!isValid) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid or expired reset token',
          data: null
        };
        
        return res.status(400).json(response);
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Reset token is valid',
        data: { valid: true }
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Reset token verification error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'An error occurred while verifying the reset token',
        data: null
      };
      
      res.status(500).json(response);
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      
      const result = await passwordResetService.resetPassword(token, password);
      
      if (!result.success) {
        const response: ApiResponse = {
          success: false,
          message: result.message || 'Failed to reset password',
          data: null
        };
        
        return res.status(400).json(response);
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Password reset successfully',
        data: null
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Password reset error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'An error occurred while resetting your password',
        data: null
      };
      
      res.status(500).json(response);
    }
  }
};