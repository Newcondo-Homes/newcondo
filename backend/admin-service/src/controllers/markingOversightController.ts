// backend/admin-service/src/controllers/markingOversightController.ts

import { Request, Response } from 'express';
import { markingOversightService } from '../services/markingOversightService';
import { StandardResponse } from '../../shared/utils/response';
import { ApiError } from '../../shared/utils/response';

/**
 * Admin controller for overseeing marking jobs
 * Handles monitoring, statistics, and quality assurance of property marking jobs
 */

export const markingOversightController = {
  /**
   * Get overview/dashboard statistics for marking jobs
   */
  async getMarkingOverview(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      const overview = await markingOversightService.getMarkingJobsOverview(adminId);

      return res.status(200).json(
        StandardResponse.success(
          overview,
          'Marking jobs overview retrieved successfully'
        )
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching marking overview:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch marking overview'));
    }
  },

  /**
   * Get list of marking jobs with filters and pagination
   */
  async getMarkingJobs(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { status, page = 1, limit = 20, sortBy = 'createdAt' } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      const jobs = await markingOversightService.getMarkingJobsWithFilters({
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
      });

      return res.status(200).json(
        StandardResponse.success(jobs, 'Marking jobs retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching marking jobs:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch marking jobs'));
    }
  },

  /**
   * Get detailed information about a specific marking job
   */
  async getMarkingJobDetail(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { jobId } = req.params;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!jobId) {
        throw new ApiError('Marking job ID is required', 400);
      }

      const jobDetail = await markingOversightService.getMarkingJobDetail(jobId);

      return res.status(200).json(
        StandardResponse.success(jobDetail, 'Marking job detail retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching marking job detail:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch marking job detail'));
    }
  },

  /**
   * Get agent performance metrics and reliability scores
   */
  async getAgentPerformance(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { agentId, timeRange = '30days' } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!agentId) {
        throw new ApiError('Agent ID is required', 400);
      }

      const performance = await markingOversightService.getAgentPerformanceMetrics(
        agentId as string,
        timeRange as string
      );

      return res.status(200).json(
        StandardResponse.success(performance, 'Agent performance metrics retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching agent performance:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch agent performance'));
    }
  },

  /**
   * Get incomplete or suspicious marking jobs for review
   */
  async getFlaggedJobs(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { reason, page = 1, limit = 20 } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      const flaggedJobs = await markingOversightService.getFlaggedMarkingJobs({
        reason: reason as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      return res.status(200).json(
        StandardResponse.success(flaggedJobs, 'Flagged marking jobs retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching flagged jobs:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch flagged jobs'));
    }
  },

  /**
   * Review and approve a completed marking job
   */
  async approveMarkingJob(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { jobId } = req.params;
      const { notes } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!jobId) {
        throw new ApiError('Marking job ID is required', 400);
      }

      const approved = await markingOversightService.approveMarkingJob(jobId, adminId, notes);

      return res.status(200).json(
        StandardResponse.success(approved, 'Marking job approved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error approving marking job:', error);
      return res.status(500).json(StandardResponse.error('Failed to approve marking job'));
    }
  },

  /**
   * Reject a marking job and request re-marking
   */
  async rejectMarkingJob(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { jobId } = req.params;
      const { reason, notes } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!jobId) {
        throw new ApiError('Marking job ID is required', 400);
      }

      if (!reason) {
        throw new ApiError('Rejection reason is required', 400);
      }

      const rejected = await markingOversightService.rejectMarkingJob(
        jobId,
        adminId,
        reason,
        notes
      );

      return res.status(200).json(
        StandardResponse.success(rejected, 'Marking job rejected successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error rejecting marking job:', error);
      return res.status(500).json(StandardResponse.error('Failed to reject marking job'));
    }
  },

  /**
   * Get quality assurance report for marking jobs
   */
  async getQualityAssuranceReport(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { timeRange = '30days', agentId } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      const report = await markingOversightService.getQualityAssuranceReport(
        timeRange as string,
        agentId as string | undefined
      );

      return res.status(200).json(
        StandardResponse.success(report, 'Quality assurance report retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching QA report:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch QA report'));
    }
  },

  /**
   * Get marking job analytics and trends
   */
  async getMarkingAnalytics(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { timeRange = '30days', metric } = req.query;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      const analytics = await markingOversightService.getMarkingAnalytics(
        timeRange as string,
        metric as string | undefined
      );

      return res.status(200).json(
        StandardResponse.success(analytics, 'Marking analytics retrieved successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error fetching marking analytics:', error);
      return res.status(500).json(StandardResponse.error('Failed to fetch marking analytics'));
    }
  },

  /**
   * Manually assign a marking job to an agent (admin override)
   */
  async manuallyAssignJob(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { jobId } = req.params;
      const { agentId, reason } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!jobId || !agentId) {
        throw new ApiError('Job ID and Agent ID are required', 400);
      }

      const assigned = await markingOversightService.manuallyAssignJob(
        jobId,
        agentId,
        adminId,
        reason
      );

      return res.status(200).json(
        StandardResponse.success(assigned, 'Marking job assigned successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error assigning marking job:', error);
      return res.status(500).json(StandardResponse.error('Failed to assign marking job'));
    }
  },

  /**
   * Cancel a marking job and refund the property owner
   */
  async cancelMarkingJob(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { jobId } = req.params;
      const { reason, notes, refund = true } = req.body;

      if (!adminId) {
        throw new ApiError('Unauthorized', 401);
      }

      if (!jobId) {
        throw new ApiError('Marking job ID is required', 400);
      }

      const cancelled = await markingOversightService.cancelMarkingJob(
        jobId,
        adminId,
        reason,
        notes,
        refund
      );

      return res.status(200).json(
        StandardResponse.success(cancelled, 'Marking job cancelled successfully')
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(StandardResponse.error(error.message));
      }
      console.error('Error cancelling marking job:', error);
      return res.status(500).json(StandardResponse.error('Failed to cancel marking job'));
    }
  },
};

export default markingOversightController;