// backend/admin-service/src/controllers/markingDisputeController.ts

import { Request, Response } from 'express';
import { markingDisputeService } from '../services/markingDisputeService';
import { StandardResponse } from '@newcondo/backend-shared/';
import { ApiError } from '@newcondo/backend-shared/';

/**
 * Admin controller for handling marking job disputes
 * Handles disputes between property owners and marking agents
 */

export const markingDisputeController = {
  /**
   * Create a new dispute for a marking job
   */
  async createDispute(req: Request, res: Response) {
    try {
      const { jobId, type, description, evidence } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!jobId || !type || !description) {
        throw new ApiError('Job ID, dispute type, and description are required', 400);
      }

      const dispute = await markingDisputeService.createDispute({
        jobId,
        reportedBy: userId,
        type,
        description,
        evidence: evidence || [],
      });

      return res.status(201).json(
        StandardResponse.success(dispute, 'Dispute created successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error creating dispute:', error);
      return res.status(500).json(StandardResponse.error('Failed to create dispute'));
    }
  },

  /**
   * Get list of all marking disputes with filters
   */
  async getDisputes(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { status, type, page = 1, limit = 20, sortBy = 'createdAt' } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      const disputes = await markingDisputeService.getDisputes({
        status: status as string,
        type: type as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
      });

      return res.status(200).json(
        StandardResponse.success(disputes, 'Disputes retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching disputes:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch disputes'));
    }
  },

  /**
   * Get details of a specific dispute
   */
  async getDisputeDetail(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!disputeId) {
        throw new ApiError('Dispute ID is required', 400);
      }

      const dispute = await markingDisputeService.getDisputeDetail(disputeId);

      return res.status(200).json(
        StandardResponse.success(dispute, 'Dispute detail retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching dispute detail:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch dispute detail'));
    }
  },

  /**
   * Add notes or evidence to an existing dispute
   */
  async addDisputeNote(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { note, evidence } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!disputeId || !note) {
        throw new ApiError('Dispute ID and note are required', 400);
      }

      const updated = await markingDisputeService.addDisputeNote(
        disputeId,
        adminId,
        note,
        evidence || []
      );

      return res.status(200).json(
        StandardResponse.success(updated, 'Note added successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error adding dispute note:', error);
      return res.status(500).json(StandardResponse.error('Failed to add note'));
    }
  },

  /**
   * Resolve a dispute in favor of the property owner
   */
  async resolveInFavorOfOwner(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { resolution, refundAmount, notes } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!disputeId) {
        throw new ApiError('Dispute ID is required', 400);
      }

      const resolved = await markingDisputeService.resolveDisputeInFavorOfOwner(
        disputeId,
        adminId,
        resolution,
        refundAmount,
        notes
      );

      return res.status(200).json(
        StandardResponse.success(resolved, 'Dispute resolved in favor of owner')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error resolving dispute:', error);
      return res.status(500).json(StandardResponse.error('Failed to resolve dispute'));
    }
  },

  /**
   * Resolve a dispute in favor of the marking agent
   */
  async resolveInFavorOfAgent(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { resolution, notes } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!disputeId) {
        throw new ApiError('Dispute ID is required', 400);
      }

      const resolved = await markingDisputeService.resolveDisputeInFavorOfAgent(
        disputeId,
        adminId,
        resolution,
        notes
      );

      return res.status(200).json(
        StandardResponse.success(resolved, 'Dispute resolved in favor of agent')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error resolving dispute:', error);
      return res.status(500).json(StandardResponse.error('Failed to resolve dispute'));
    }
  },

  /**
   * Resolve a dispute with custom resolution
   */
  async resolveDisputeCustom(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { resolution, ownerCompensation, agentCompensation, notes } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!disputeId || !resolution) {
        throw new ApiError('Dispute ID and resolution are required', 400);
      }

      const resolved = await markingDisputeService.resolveDisputeCustom(
        disputeId,
        adminId,
        resolution,
        ownerCompensation,
        agentCompensation,
        notes
      );

      return res.status(200).json(
        StandardResponse.success(resolved, 'Dispute resolved with custom resolution')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error resolving dispute:', error);
      return res.status(500).json(StandardResponse.error('Failed to resolve dispute'));
    }
  },

  /**
   * Escalate a dispute to senior admin review
   */
  async escalateDispute(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { reason, notes } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!disputeId) {
        throw new ApiError('Dispute ID is required', 400);
      }

      const escalated = await markingDisputeService.escalateDispute(
        disputeId,
        adminId,
        reason,
        notes
      );

      return res.status(200).json(
        StandardResponse.success(escalated, 'Dispute escalated successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error escalating dispute:', error);
      return res.status(500).json(StandardResponse.error('Failed to escalate dispute'));
    }
  },

  /**
   * Get dispute statistics and trends
   */
  async getDisputeStatistics(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { timeRange = '30days', type } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      const stats = await markingDisputeService.getDisputeStatistics(
        timeRange as string,
        type as string | undefined
      );

      return res.status(200).json(
        StandardResponse.success(stats, 'Dispute statistics retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching dispute statistics:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch dispute statistics'));
    }
  },

  /**
   * Get disputes for a specific agent (admin view)
   */
  async getAgentDisputes(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { agentId, page = 1, limit = 20 } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!agentId) {
        throw new ApiError('Agent ID is required', 400);
      }

      const disputes = await markingDisputeService.getAgentDisputes(
        agentId as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json(
        StandardResponse.success(disputes, 'Agent disputes retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching agent disputes:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch agent disputes'));
    }
  },

  /**
   * Get disputes for a specific property owner (admin view)
   */
  async getOwnerDisputes(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { ownerId, page = 1, limit = 20 } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!ownerId) {
        throw new ApiError('Owner ID is required', 400);
      }

      const disputes = await markingDisputeService.getOwnerDisputes(
        ownerId as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json(
        StandardResponse.success(disputes, 'Owner disputes retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching owner disputes:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch owner disputes'));
    }
  },

  /**
   * Close a dispute after resolution
   */
  async closeDispute(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { notes } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!disputeId) {
        throw new ApiError('Dispute ID is required', 400);
      }

      const closed = await markingDisputeService.closeDispute(disputeId, adminId, notes);

      return res.status(200).json(
        StandardResponse.success(closed, 'Dispute closed successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error closing dispute:', error);
      return res.status(500).json(StandardResponse.error('Failed to close dispute'));
    }
  },
};

export default markingDisputeController;



// // backend/admin-service/src/controllers/markingDisputeController.ts
// import { Request, Response } from 'express';
// import { markingDisputeService } from '../services/markingDisputeService';
// import { standardResponse } from '../../shared/src/utils/response';
// import { errorHandler } from '../../shared/src/middleware/errorHandler';

// export const markingDisputeController = {
//   /**
//    * Get all marking disputes with pagination and filters
//    */
//   async getAllDisputes(req: Request, res: Response): Promise<void> {
//     try {
//       const { status, propertyId, page = 1, limit = 20, sortBy = 'createdAt' } = req.query;
//       const adminId = (req as any).userId;

//       const result = await markingDisputeService.getAllDisputes({
//         status: status as string,
//         propertyId: propertyId as string,
//         page: parseInt(page as string),
//         limit: parseInt(limit as string),
//         sortBy: sortBy as string,
//         adminId,
//       });

//       res.json(
//         standardResponse(true, 'Disputes retrieved successfully', result, 200)
//       );
//     } catch (error) {
//       errorHandler(error, req, res);
//     }
//   },

//   /**
//    * Get a specific dispute by ID
//    */
//   async getDisputeById(req: Request, res: Response): Promise<void> {
//     try {
//       const { disputeId } = req.params;
//       const adminId = (req as any).userId;

//       const dispute = await markingDisputeService.getDisputeById(disputeId, adminId);

//       if (!dispute) {
//         res.status(404).json(
//           standardResponse(false, 'Dispute not found', null, 404)
//         );
//         return;
//       }

//       res.json(
//         standardResponse(true, 'Dispute retrieved successfully', dispute, 200)
//       );
//     } catch (error) {
//       errorHandler(error, req, res);
//     }
//   },

//   /**
//    * Resolve a marking dispute
//    */
//   async resolveDispute(req: Request, res: Response): Promise<void> {
//     try {
//       const { disputeId } = req.params;
//       const { resolution, notes, action } = req.body;
//       const adminId = (req as any).userId;

//       const result = await markingDisputeService.resolveDispute(
//         disputeId,
//         {
//           resolution,
//           notes,
//           action,
//         },
//         adminId
//       );

//       res.json(
//         standardResponse(true, 'Dispute resolved successfully', result, 200)
//       );
//     } catch (error) {
//       errorHandler(error, req, res);
//     }
//   },

//   /**
//    * Escalate a dispute for manual review
//    */
//   async escalateDispute(req: Request, res: Response): Promise<void> {
//     try {
//       const { markingJobId } = req.params;
//       const { reason, priority } = req.body;
//       const adminId = (req as any).userId;

//       const result = await markingDisputeService.escalateDispute(
//         markingJobId,
//         {
//           reason,
//           priority,
//         },
//         adminId
//       );

//       res.json(
//         standardResponse(true, 'Dispute escalated successfully', result, 200)
//       );
//     } catch (error) {
//       errorHandler(error, req, res);
//     }
//   },

//   /**
//    * Update dispute status
//    */
//   async updateDisputeStatus(req: Request, res: Response): Promise<void> {
//     try {
//       const { disputeId } = req.params;
//       const { status, notes } = req.body;
//       const adminId = (req as any).userId;

//       const result = await markingDisputeService.updateDisputeStatus(
//         disputeId,
//         status,
//         notes,
//         adminId
//       );

//       res.json(
//         standardResponse(true, 'Dispute status updated successfully', result, 200)
//       );
//     } catch (error) {
//       errorHandler(error, req, res);
//     }
//   },

//   /**
//    * Assign a new agent to re-mark property
//    */
//   async assignNewAgent(req: Request, res: Response): Promise<void> {
//     try {
//       const { disputeId } = req.params;
//       const { agentId, deadline } = req.body;
//       const adminId = (req as any).userId;

//       const result = await markingDisputeService.assignNewAgent(
//         disputeId,
//         agentId,
//         new Date(deadline),
//         adminId
//       );

//       res.json(
//         standardResponse(true, 'New agent assigned successfully', result, 200)
//       );
//     } catch (error) {
//       errorHandler(error, req, res);
//     }
//   },

//   /**
//    * Get dispute statistics
//    */
//   async getDisputeStats(req: Request, res: Response): Promise<void> {
//     try {
//       const adminId = (req as any).userId;

//       const stats = await markingDisputeService.getDisputeStats(adminId);

//       res.json(
//         standardResponse(true, 'Dispute statistics retrieved successfully', stats, 200)
//       );
//     } catch (error) {
//       errorHandler(error, req, res);
//     }
//   },

//   /**
//    * Send notification to property owner or agent
//    */
//   async sendDisputeNotification(req: Request, res: Response): Promise<void> {
//     try {
//       const { disputeId } = req.params;
//       const { recipientId, message, type } = req.body;
//       const adminId = (req as any).userId;

//       const result = await markingDisputeService.sendDisputeNotification(
//         disputeId,
//         {
//           recipientId,
//           message,
//           type,
//         },
//         adminId
//       );

//       res.json(
//         standardResponse(true, 'Notification sent successfully', result, 200)
//       );
//     } catch (error) {
//       errorHandler(error, req, res);
//     }
//   },
// };