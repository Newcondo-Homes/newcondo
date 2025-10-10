import { Request, Response, NextFunction } from 'express';
import { PropertyMarkingService } from '../services/propertyMarkingService';
import {
  CreateMarkingJobRequest,
  CompleteMarkingJobRequest,
  ConfirmMarkingRequest,
  AgentAssignmentRequest,
  MarkingJobError,
  MarkingJobErrorCode,
  ProximitySearchParams
} from '../types/propertyMarking';

export class PropertyMarkingController {
  private markingService: PropertyMarkingService;

  constructor() {
    this.markingService = new PropertyMarkingService();
  }

  /**
   * Create a new marking job
   * POST /api/property-service/marking-jobs
   */
  createMarkingJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new MarkingJobError(
          'User not authenticated',
          MarkingJobErrorCode.UNAUTHORIZED,
          401
        );
      }

      const requestData: CreateMarkingJobRequest = {
        ...req.body,
        requestedBy: userId
      };

      const markingJob = await this.markingService.createMarkingJob(requestData);

      res.status(201).json({
        success: true,
        message: 'Marking job created successfully',
        data: markingJob
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get marking job details
   * GET /api/property-service/marking-jobs/:jobId
   */
  getMarkingJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      const markingJob = await this.markingService.getMarkingJob(jobId, userId);

      res.status(200).json({
        success: true,
        data: markingJob
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all marking jobs for a user
   * GET /api/property-service/marking-jobs/user/:userId
   */
  getUserMarkingJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new MarkingJobError(
          'User not authenticated',
          MarkingJobErrorCode.UNAUTHORIZED,
          401
        );
      }

      const { status, limit, offset } = req.query;

      const markingJobs = await this.markingService.getUserMarkingJobs(
        userId,
        status as string,
        Number(limit) || 10,
        Number(offset) || 0
      );

      res.status(200).json({
        success: true,
        data: markingJobs
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get marking jobs for a property
   * GET /api/property-service/marking-jobs/property/:propertyId
   */
  getPropertyMarkingJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      const markingJobs = await this.markingService.getPropertyMarkingJobs(
        propertyId,
        userId
      );

      res.status(200).json({
        success: true,
        data: markingJobs
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Broadcast marking job to nearby agents
   * POST /api/property-service/marking-jobs/:jobId/broadcast
   */
  broadcastToAgents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      const { latitude, longitude, radius } = req.body as ProximitySearchParams;

      const broadcast = await this.markingService.broadcastJobToAgents(
        jobId,
        userId!,
        { latitude, longitude, radius }
      );

      res.status(200).json({
        success: true,
        message: `Job broadcasted to ${broadcast.notifiedAgents} agents`,
        data: broadcast
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Agent accepts marking job
   * POST /api/property-service/marking-jobs/:jobId/accept
   */
  acceptMarkingJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const agentId = req.user?.id;

      if (!agentId) {
        throw new MarkingJobError(
          'Agent not authenticated',
          MarkingJobErrorCode.UNAUTHORIZED,
          401
        );
      }

      const assignment = await this.markingService.acceptMarkingJob(jobId, agentId);

      res.status(200).json({
        success: true,
        message: 'Marking job accepted successfully',
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Complete marking job
   * POST /api/property-service/marking-jobs/:jobId/complete
   */
  completeMarkingJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const agentId = req.user?.id;

      if (!agentId) {
        throw new MarkingJobError(
          'Agent not authenticated',
          MarkingJobErrorCode.UNAUTHORIZED,
          401
        );
      }

      const completionData: CompleteMarkingJobRequest = {
        markingJobId: jobId,
        agentId,
        ...req.body
      };

      const result = await this.markingService.completeMarkingJob(completionData);

      res.status(200).json({
        success: true,
        message: 'Marking job completed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Property owner confirms marking
   * POST /api/property-service/marking-jobs/:jobId/confirm
   */
  confirmMarking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new MarkingJobError(
          'User not authenticated',
          MarkingJobErrorCode.UNAUTHORIZED,
          401
        );
      }

      const confirmationData: ConfirmMarkingRequest = {
        markingJobId: jobId,
        propertyOwnerId: userId,
        ...req.body
      };

      const result = await this.markingService.confirmMarking(confirmationData);

      res.status(200).json({
        success: true,
        message: result.confirmed 
          ? 'Marking confirmed and payment released' 
          : 'Marking rejected',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get marking job queue status
   * GET /api/property-service/marking-jobs/:jobId/queue
   */
  getQueueStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId } = req.params;

      const queueStatus = await this.markingService.getQueueStatus(jobId);

      res.status(200).json({
        success: true,
        data: queueStatus
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available agents near property
   * GET /api/property-service/marking-jobs/agents/nearby
   */
  getNearbyAgents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { latitude, longitude, radius, maxResults } = req.query;

      const proximityParams: ProximitySearchParams = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: Number(radius) || 50, // Default 50km
        maxResults: Number(maxResults) || 20
      };

      const agents = await this.markingService.getNearbyAgents(proximityParams);

      res.status(200).json({
        success: true,
        data: agents
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate shareable marking link
   * POST /api/property-service/marking-jobs/:jobId/shareable-link
   */
  generateShareableLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      const shareableLink = await this.markingService.generateShareableLink(
        jobId,
        userId!
      );

      res.status(200).json({
        success: true,
        message: 'Shareable link generated successfully',
        data: shareableLink
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Access marking job via shareable link
   * GET /api/property-service/marking-jobs/shared/:token
   */
  accessSharedMarkingJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.params;

      const markingJob = await this.markingService.accessSharedMarkingJob(token);

      res.status(200).json({
        success: true,
        data: markingJob
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel marking job
   * POST /api/property-service/marking-jobs/:jobId/cancel
   */
  cancelMarkingJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      await this.markingService.cancelMarkingJob(jobId, userId!, reason);

      res.status(200).json({
        success: true,
        message: 'Marking job cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get marking job statistics
   * GET /api/property-service/marking-jobs/stats
   */
  getMarkingStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { userType } = req.query; // 'owner' or 'agent'

      const stats = await this.markingService.getMarkingStats(
        userId!,
        userType as string
      );

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}