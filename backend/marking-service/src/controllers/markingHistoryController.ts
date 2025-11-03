// backend/marking-service/src/controllers/markingHistoryController.ts

import { Request, Response } from 'express';
import { markingHistoryService } from '../services/markingHistoryService';
import { standardResponse } from '../../../shared/src/utils/response';

export class MarkingHistoryController {
  /**
   * Get marking history for property owner or agent
   */
  async getMarkingHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { role, page = 1, limit = 10, status, dateFrom, dateTo } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const filters = {
        page: Number(page),
        limit: Number(limit),
        status: status as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const history = await markingHistoryService.getMarkingHistory(
        userId,
        role as 'owner' | 'agent',
        filters
      );

      res.status(200).json(standardResponse.success(history, 'Marking history retrieved successfully'));
    } catch (error) {
      console.error('Get marking history error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve marking history'));
    }
  }

  /**
   * Get marking job details
   */
  async getMarkingJobDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { jobId } = req.params;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const jobDetails = await markingHistoryService.getMarkingJobDetails(jobId, userId);

      if (!jobDetails) {
        res.status(404).json(standardResponse.error('Marking job not found', 404));
        return;
      }

      res.status(200).json(standardResponse.success(jobDetails, 'Marking job details retrieved successfully'));
    } catch (error) {
      console.error('Get marking job details error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve marking job details'));
    }
  }

  /**
   * Get marking statistics for user
   */
  async getMarkingStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { role } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const statistics = await markingHistoryService.getMarkingStatistics(
        userId,
        role as 'owner' | 'agent'
      );

      res.status(200).json(standardResponse.success(statistics, 'Marking statistics retrieved successfully'));
    } catch (error) {
      console.error('Get marking statistics error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve marking statistics'));
    }
  }

  /**
   * Get active marking jobs for agent
   */
  async getActiveMarkingJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const activeJobs = await markingHistoryService.getActiveMarkingJobs(userId);

      res.status(200).json(standardResponse.success(activeJobs, 'Active marking jobs retrieved successfully'));
    } catch (error) {
      console.error('Get active marking jobs error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve active marking jobs'));
    }
  }

  /**
   * Get marking job timeline
   */
  async getMarkingJobTimeline(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { jobId } = req.params;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const timeline = await markingHistoryService.getMarkingJobTimeline(jobId, userId);

      if (!timeline) {
        res.status(404).json(standardResponse.error('Marking job not found', 404));
        return;
      }

      res.status(200).json(standardResponse.success(timeline, 'Marking job timeline retrieved successfully'));
    } catch (error) {
      console.error('Get marking job timeline error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve marking job timeline'));
    }
  }

  /**
   * Get completed marking jobs for agent
   */
  async getCompletedMarkingJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, dateFrom, dateTo } = req.query;

      if (!userId) {
        res.status(401).json(standardResponse.error('Unauthorized', 401));
        return;
      }

      const filters = {
        page: Number(page),
        limit: Number(limit),
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const completedJobs = await markingHistoryService.getCompletedMarkingJobs(userId, filters);

      res.status(200).json(standardResponse.success(completedJobs, 'Completed marking jobs retrieved successfully'));
    } catch (error) {
      console.error('Get completed marking jobs error:', error);
      res.status(500).json(standardResponse.error('Failed to retrieve completed marking jobs'));
    }
  }
}

export const markingHistoryController = new MarkingHistoryController();