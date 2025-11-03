// backend/referral-service/src/controllers/subAgentController.ts

import { Request, Response } from 'express';
import { subAgentService } from '../services/subAgentService';
import { standardResponse } from '../../../shared/src/utils/response';

export class SubAgentController {
  /**
   * Request to promote a property (become sub-agent)
   */
  async requestPromotion(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { propertyId, message } = req.body;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      if (!propertyId) {
        res.status(400).json(standardResponse.error('Property ID is required', 400));
        return;
      }

      const result = await subAgentService.requestPromotion(userId, propertyId, message);

      if (!result.success) {
        res.status(400).json(standardResponse.error(result.message, 400));
        return;
      }

      res.status(201).json(standardResponse.success(result.data, result.message));
    } catch (error) {
      console.error('Request promotion error:', error);
      res.status(500).json(standardResponse.error('Failed to request promotion'));
    }
  }

  /**
   * Get promotion requests for property owner/listing agent
   */
  async getPromotionRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { propertyId, status, page = 1, limit = 10 } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const requests = await subAgentService.getPromotionRequests(userId, {
        propertyId: propertyId as string | undefined,
        status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined,
        page: Number(page),
        limit: Number(limit),
      });

      res.status(200).json(standardResponse.success(requests, 'Promotion requests retrieved successfully'));
    } catch (error) {
      console.error('Get promotion requests error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve promotion requests'));
    }
  }

  /**
   * Approve/reject promotion request
   */
  async handlePromotionRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;
      const { action, rejectionReason } = req.body;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      if (!action || !['approve', 'reject'].includes(action)) {
        res.status(400).json(standardResponse.error('Invalid action. Must be "approve" or "reject"', 400));
        return;
      }

      const result = await subAgentService.handlePromotionRequest(
        requestId,
        userId,
        action as 'approve' | 'reject',
        rejectionReason
      );

      if (!result.success) {
        res.status(400).json(standardResponse.error(result.message, 400));
        return;
      }

      res.status(200).json(standardResponse.success(result.data, result.message));
    } catch (error) {
      console.error('Handle promotion request error:', error);
      res.status(500).json(standardResponse.error('Failed to handle promotion request'));
    }
  }

  /**
   * Get sub-agents for a property
   */
  async getPropertySubAgents(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { propertyId } = req.params;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const subAgents = await subAgentService.getPropertySubAgents(propertyId, userId);

      if (!subAgents) {
        res.status(404).json(standardResponse.error('Property not found or access denied', 404));
        return;
      }

      res.status(200).json(standardResponse.success(subAgents, 'Sub-agents retrieved successfully'));
    } catch (error) {
      console.error('Get property sub-agents error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve sub-agents'));
    }
  }

  /**
   * Remove sub-agent from property
   */
  async removeSubAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { propertyId, subAgentId } = req.params;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const result = await subAgentService.removeSubAgent(propertyId, subAgentId, userId);

      if (!result.success) {
        res.status(400).json(standardResponse.error(result.message, 400));
        return;
      }

      res.status(200).json(standardResponse.success(null, result.message));
    } catch (error) {
      console.error('Remove sub-agent error:', error);
      res.status(500).json(standardResponse.error('Failed to remove sub-agent'));
    }
  }

  /**
   * Get properties where user is sub-agent
   */
  async getSubAgentProperties(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const properties = await subAgentService.getSubAgentProperties(userId, {
        page: Number(page),
        limit: Number(limit),
      });

      res.status(200).json(standardResponse.success(properties, 'Sub-agent properties retrieved successfully'));
    } catch (error) {
      console.error('Get sub-agent properties error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve sub-agent properties'));
    }
  }

  /**
   * Update property promotion settings
   */
  async updatePromotionSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { propertyId } = req.params;
      const { promotionType } = req.body;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const validTypes = ['PUBLIC', 'PERMISSION_BASED', 'RESTRICTED', 'REQUEST_BASED'];
      if (!promotionType || !validTypes.includes(promotionType)) {
        res.status(400).json(standardResponse.error('Invalid promotion type', 400));
        return;
      }

      const result = await subAgentService.updatePromotionSettings(propertyId, userId, promotionType);

      if (!result.success) {
        res.status(400).json(standardResponse.error(result.message, 400));
        return;
      }

      res.status(200).json(standardResponse.success(result.data, result.message));
    } catch (error) {
      console.error('Update promotion settings error:', error);
      res.status(500).json(standardResponse.error('Failed to update promotion settings'));
    }
  }
}

export const subAgentController = new SubAgentController();