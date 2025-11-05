// backend/property-service/src/controllers/propertyMarketingController.ts

import { Request, Response } from 'express';
import propertyMarketingService from '../services/propertyMarketingService';

export class PropertyMarketingController {
  /**
   * Get or generate shareable link for property
   * GET /api/property-marketing/properties/:propertyId/shareable-link
   */
  async getShareableLink(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const shareableLink = await propertyMarketingService.getShareableLink(propertyId, userId);

      return res.status(200).json({
        success: true,
        data: {
          shareableLink,
        },
      });
    } catch (error: any) {
      console.error('Get shareable link error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to get shareable link',
      });
    }
  }

  /**
   * Generate agent promotion link
   * POST /api/property-marketing/properties/:propertyId/promotion-link
   */
  async generateAgentPromotionLink(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const promotionLink = await propertyMarketingService.generateAgentPromotionLink(
        propertyId,
        userId
      );

      return res.status(200).json({
        success: true,
        data: {
          promotionLink,
        },
        message: 'Promotion link generated successfully',
      });
    } catch (error: any) {
      console.error('Generate agent promotion link error:', error);
      return res.status(error.message.includes('not authorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to generate promotion link',
      });
    }
  }

  /**
   * Get property marketing data
   * GET /api/property-marketing/properties/:propertyId
   */
  async getPropertyMarketingData(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const marketingData = await propertyMarketingService.getPropertyMarketingData(
        propertyId,
        userId
      );

      return res.status(200).json({
        success: true,
        data: marketingData,
      });
    } catch (error: any) {
      console.error('Get property marketing data error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch property marketing data',
      });
    }
  }

  /**
   * Update property promotion settings
   * PUT /api/property-marketing/properties/:propertyId/promotion-settings
   */
  async updatePromotionSettings(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;
      const { promotionStatus, allowedAgents } = req.body;

      if (!promotionStatus) {
        return res.status(400).json({
          success: false,
          message: 'Promotion status is required',
        });
      }

      const validStatuses = ['PUBLIC', 'PERMISSION_BASED', 'RESTRICTED', 'REQUEST_BASED'];
      if (!validStatuses.includes(promotionStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid promotion status',
        });
      }

      await propertyMarketingService.updatePromotionSettings(propertyId, userId, {
        promotionStatus,
        allowedAgents,
      });

      return res.status(200).json({
        success: true,
        message: 'Promotion settings updated successfully',
      });
    } catch (error: any) {
      console.error('Update promotion settings error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to update promotion settings',
      });
    }
  }

  /**
   * Request permission to promote property
   * POST /api/property-marketing/properties/:propertyId/request-promotion
   */
  async requestPromotionPermission(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      await propertyMarketingService.requestPromotionPermission(propertyId, userId);

      return res.status(200).json({
        success: true,
        message: 'Promotion request submitted successfully',
      });
    } catch (error: any) {
      console.error('Request promotion permission error:', error);
      return res.status(error.message.includes('already exists') ? 409 : 500).json({
        success: false,
        message: error.message || 'Failed to request promotion permission',
      });
    }
  }

  /**
   * Handle promotion request (approve/reject)
   * POST /api/property-marketing/properties/:propertyId/handle-promotion-request
   */
  async handlePromotionRequest(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;
      const { agentId, action } = req.body;

      if (!agentId || !action) {
        return res.status(400).json({
          success: false,
          message: 'Agent ID and action are required',
        });
      }

      if (!['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be either APPROVE or REJECT',
        });
      }

      await propertyMarketingService.handlePromotionRequest(
        propertyId,
        agentId,
        userId,
        action
      );

      return res.status(200).json({
        success: true,
        message: `Promotion request ${action.toLowerCase()}d successfully`,
      });
    } catch (error: any) {
      console.error('Handle promotion request error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to handle promotion request',
      });
    }
  }

  /**
   * Track property share event
   * POST /api/property-marketing/properties/:propertyId/track-share
   */
  async trackPropertyShare(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user?.id; // Optional for tracking
      const { platform, trackingId } = req.body;

      if (!platform) {
        return res.status(400).json({
          success: false,
          message: 'Platform is required',
        });
      }

      await propertyMarketingService.trackPropertyShare(
        propertyId,
        userId,
        platform,
        trackingId
      );

      return res.status(200).json({
        success: true,
        message: 'Share event tracked successfully',
      });
    } catch (error: any) {
      console.error('Track property share error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to track share event',
      });
    }
  }

  /**
   * Track referral conversion
   * POST /api/property-marketing/properties/:propertyId/track-conversion
   */
  async trackReferralConversion(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { referralAgentId, rentalId } = req.body;

      if (!referralAgentId || !rentalId) {
        return res.status(400).json({
          success: false,
          message: 'Referral agent ID and rental ID are required',
        });
      }

      await propertyMarketingService.trackReferralConversion(
        propertyId,
        referralAgentId,
        rentalId
      );

      return res.status(200).json({
        success: true,
        message: 'Referral conversion tracked successfully',
      });
    } catch (error: any) {
      console.error('Track referral conversion error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to track referral conversion',
      });
    }
  }

  /**
   * Get sub-agent performance for a property
   * GET /api/property-marketing/properties/:propertyId/sub-agents
   */
  async getSubAgentPerformance(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const marketingData = await propertyMarketingService.getPropertyMarketingData(
        propertyId,
        userId
      );

      return res.status(200).json({
        success: true,
        data: {
          subAgents: marketingData.subAgents || [],
        },
      });
    } catch (error: any) {
      console.error('Get sub-agent performance error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch sub-agent performance',
      });
    }
  }

  /**
   * Generate QR code for property
   * GET /api/property-marketing/properties/:propertyId/qr-code
   */
  async generatePropertyQRCode(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const shareableLink = await propertyMarketingService.getShareableLink(propertyId, userId);

      // In production, generate actual QR code image
      // For now, return the link that should be encoded
      return res.status(200).json({
        success: true,
        data: {
          qrCodeData: shareableLink,
          qrCodeUrl: `${process.env.FRONTEND_URL}/api/qr-code/generate?data=${encodeURIComponent(shareableLink)}`,
        },
        message: 'QR code data generated. Use a QR code library to generate the image.',
      });
    } catch (error: any) {
      console.error('Generate QR code error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate QR code',
      });
    }
  }

  /**
   * Get marketing analytics summary
   * GET /api/property-marketing/properties/:propertyId/analytics-summary
   */
  async getMarketingAnalyticsSummary(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const marketingData = await propertyMarketingService.getPropertyMarketingData(
        propertyId,
        userId
      );

      const summary = {
        totalShares: marketingData.totalShares,
        sharesByPlatform: marketingData.sharesByPlatform,
        totalSubAgents: marketingData.subAgents?.length || 0,
        totalViewsFromSubAgents: marketingData.subAgents?.reduce(
          (sum, agent) => sum + agent.viewsGenerated,
          0
        ) || 0,
        totalConversionsFromSubAgents: marketingData.subAgents?.reduce(
          (sum, agent) => sum + agent.conversions,
          0
        ) || 0,
      };

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Get marketing analytics summary error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch marketing analytics summary',
      });
    }
  }

  /**
   * Copy promotion link to clipboard (helper endpoint)
   * POST /api/property-marketing/properties/:propertyId/copy-link
   */
  async copyPromotionLink(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const promotionLink = await propertyMarketingService.generateAgentPromotionLink(
        propertyId,
        userId
      );

      // Log the copy action
      await propertyMarketingService.trackPropertyShare(
        propertyId,
        userId,
        'Copy Link',
        undefined
      );

      return res.status(200).json({
        success: true,
        data: {
          promotionLink,
        },
        message: 'Link copied successfully (tracking recorded)',
      });
    } catch (error: any) {
      console.error('Copy promotion link error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to copy promotion link',
      });
    }
  }
}

export default new PropertyMarketingController();