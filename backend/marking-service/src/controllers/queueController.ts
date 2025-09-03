import { Request, Response } from 'express';
import { queueService } from '../services/queueService';
import { ApiResponse } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/utils/logger';

export const queueController = {
  // Get available marking jobs for agents
  async getAvailableJobs(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      const { city, urgencyLevel, limit = 10, offset = 0 } = req.query;

      const jobs = await queueService.getAvailableJobs({
        agentId,
        city: city as string,
        urgencyLevel: urgencyLevel as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      return ApiResponse.success(res, jobs, 'Available marking jobs retrieved');
    } catch (error) {
      logger.error('Error getting available jobs:', error);
      return ApiResponse.error(res, 'Failed to get available jobs', 500);
    }
  },

  // Get agent's current queue
  async getAgentQueue(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      
      const queue = await queueService.getAgentQueue(agentId);

      return ApiResponse.success(res, queue, 'Agent queue retrieved');
    } catch (error) {
      logger.error('Error getting agent queue:', error);
      return ApiResponse.error(res, 'Failed to get agent queue', 500);
    }
  },

  // Update agent availability for marking jobs
  async updateAgentAvailability(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      const { isAvailable } = req.body;

      const result = await queueService.updateAgentAvailability(agentId, isAvailable);

      return ApiResponse.success(res, result, 'Agent availability updated');
    } catch (error) {
      logger.error('Error updating agent availability:', error);
      return ApiResponse.error(res, 'Failed to update availability', 500);
    }
  },

  // Update agent service areas
  async updateServiceAreas(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      const { serviceAreas } = req.body;

      const result = await queueService.updateAgentServiceAreas(agentId, serviceAreas);

      return ApiResponse.success(res, result, 'Service areas updated');
    } catch (error) {
      logger.error('Error updating service areas:', error);
      return ApiResponse.error(res, 'Failed to update service areas', 500);
    }
  },

  // Get queue statistics for agent
  async getQueueStats(req: Request, res: Response) {
    try {
      const agentId = req.user.id;

      const stats = await queueService.getAgentQueueStats(agentId);

      return ApiResponse.success(res, stats, 'Queue statistics retrieved');
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      return ApiResponse.error(res, 'Failed to get queue statistics', 500);
    }
  },

  // Get position of a specific job in queue
  async getJobQueuePosition(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const position = await queueService.getJobQueuePosition(jobId, userId);

      return ApiResponse.success(res, { position }, 'Queue position retrieved');
    } catch (error) {
      logger.error('Error getting job queue position:', error);
      return ApiResponse.error(res, 'Failed to get queue position', 500);
    }
  },

  // Admin: Get overall queue overview
  async getQueueOverview(req: Request, res: Response) {
    try {
      const overview = await queueService.getQueueOverview();

      return ApiResponse.success(res, overview, 'Queue overview retrieved');
    } catch (error) {
      logger.error('Error getting queue overview:', error);
      return ApiResponse.error(res, 'Failed to get queue overview', 500);
    }
  },

  // Admin: Prioritize a job in queue
  async prioritizeJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { urgencyLevel, reason } = req.body;
      const adminId = req.user.id;

      const result = await queueService.prioritizeJob(jobId, urgencyLevel, reason, adminId);

      return ApiResponse.success(res, result, 'Job prioritized successfully');
    } catch (error) {
      logger.error('Error prioritizing job:', error);
      return ApiResponse.error(res, 'Failed to prioritize job', 500);
    }
  },

  // Admin: Get active agents
  async getActiveAgents(req: Request, res: Response) {
    try {
      const { city } = req.query;

      const agents = await queueService.getActiveAgents(city as string);

      return ApiResponse.success(res, agents, 'Active agents retrieved');
    } catch (error) {
      logger.error('Error getting active agents:', error);
      return ApiResponse.error(res, 'Failed to get active agents', 500);
    }
  },

  // Admin: Reassign job to different agent
  async reassignJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { newAgentId, reason } = req.body;
      const adminId = req.user.id;

      const result = await queueService.reassignJob(jobId, newAgentId, reason, adminId);

      return ApiResponse.success(res, result, 'Job reassigned successfully');
    } catch (error) {
      logger.error('Error reassigning job:', error);
      return ApiResponse.error(res, 'Failed to reassign job', 500);
    }
  },

  // Admin: Get queue health metrics
  async getQueueHealth(req: Request, res: Response) {
    try {
      const health = await queueService.getQueueHealth();

      return ApiResponse.success(res, health, 'Queue health metrics retrieved');
    } catch (error) {
      logger.error('Error getting queue health:', error);
      return ApiResponse.error(res, 'Failed to get queue health', 500);
    }
  },

  // Admin: Process queue (assign jobs automatically)
  async processQueue(req: Request, res: Response) {
    try {
      const { maxAssignments = 10 } = req.body;
      
      const result = await queueService.processQueueAssignments(maxAssignments);

      return ApiResponse.success(res, result, 'Queue processed successfully');
    } catch (error) {
      logger.error('Error processing queue:', error);
      return ApiResponse.error(res, 'Failed to process queue', 500);
    }
  }
};