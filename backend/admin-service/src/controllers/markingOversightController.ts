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









// // backend/admin-service/src/controllers/markingOversightController.ts

// import { Request, Response } from 'express';
// import { markingOversightService } from '../services/markingOversightService';
// import { markingAnalyticsService } from '../services/markingAnalyticsService';

// /**
//  * Get all marking jobs with filters
//  */
// export const getAllMarkingJobs = async (req: Request, res: Response) => {
//   try {
//     const {
//       status,
//       urgencyLevel,
//       assignedAgentId,
//       requestedBy,
//       startDate,
//       endDate,
//       page = '1',
//       limit = '20',
//       sortBy = 'createdAt',
//       sortOrder = 'desc'
//     } = req.query;

//     const filters = {
//       status: status as string,
//       urgencyLevel: urgencyLevel as string,
//       assignedAgentId: assignedAgentId as string,
//       requestedBy: requestedBy as string,
//       startDate: startDate ? new Date(startDate as string) : undefined,
//       endDate: endDate ? new Date(endDate as string) : undefined
//     };

//     const pagination = {
//       page: parseInt(page as string),
//       limit: parseInt(limit as string),
//       sortBy: sortBy as string,
//       sortOrder: sortOrder as 'asc' | 'desc'
//     };

//     const result = await markingOversightService.getAllMarkingJobs(filters, pagination);

//     res.status(200).json({
//       success: true,
//       data: result.jobs,
//       pagination: {
//         total: result.total,
//         page: pagination.page,
//         limit: pagination.limit,
//         totalPages: Math.ceil(result.total / pagination.limit)
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching marking jobs:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch marking jobs',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Get marking job details by ID
//  */
// export const getMarkingJobById = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;

//     const job = await markingOversightService.getMarkingJobById(jobId);

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: 'Marking job not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: job
//     });
//   } catch (error) {
//     console.error('Error fetching marking job:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch marking job',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Manually assign marking job to an agent
//  */
// export const assignMarkingJob = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const { agentId, notes } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     const result = await markingOversightService.manuallyAssignJob(
//       jobId,
//       agentId,
//       adminId,
//       notes
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Marking job assigned successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error assigning marking job:', error);
//     res.status(400).json({
//       success: false,
//       message: 'Failed to assign marking job',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Reassign marking job to another agent
//  */
// export const reassignMarkingJob = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const { newAgentId, reason } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     const result = await markingOversightService.reassignJob(
//       jobId,
//       newAgentId,
//       adminId,
//       reason
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Marking job reassigned successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error reassigning marking job:', error);
//     res.status(400).json({
//       success: false,
//       message: 'Failed to reassign marking job',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Cancel a marking job
//  */
// export const cancelMarkingJob = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const { reason } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     const result = await markingOversightService.cancelJob(jobId, adminId, reason);

//     res.status(200).json({
//       success: true,
//       message: 'Marking job cancelled successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error cancelling marking job:', error);
//     res.status(400).json({
//       success: false,
//       message: 'Failed to cancel marking job',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Review and approve/reject marking completion
//  */
// export const reviewMarkingCompletion = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const { approved, notes } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (typeof approved !== 'boolean') {
//       return res.status(400).json({
//         success: false,
//         message: 'Approval status is required'
//       });
//     }

//     const result = await markingOversightService.reviewCompletion(
//       jobId,
//       approved,
//       adminId,
//       notes
//     );

//     res.status(200).json({
//       success: true,
//       message: approved ? 'Marking approved successfully' : 'Marking rejected',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error reviewing marking completion:', error);
//     res.status(400).json({
//       success: false,
//       message: 'Failed to review marking completion',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Handle marking disputes
//  */
// export const handleMarkingDispute = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const { resolution, compensateAgent, refundOwner, notes } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     const result = await markingOversightService.handleDispute(jobId, {
//       resolution,
//       compensateAgent: compensateAgent || false,
//       refundOwner: refundOwner || false,
//       adminId,
//       notes
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Dispute resolved successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error handling marking dispute:', error);
//     res.status(400).json({
//       success: false,
//       message: 'Failed to handle marking dispute',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Get agent performance metrics
//  */
// export const getAgentPerformance = async (req: Request, res: Response) => {
//   try {
//     const { agentId } = req.params;
//     const { startDate, endDate } = req.query;

//     const dateRange = {
//       startDate: startDate ? new Date(startDate as string) : undefined,
//       endDate: endDate ? new Date(endDate as string) : undefined
//     };

//     const performance = await markingAnalyticsService.getAgentPerformance(agentId, dateRange);

//     res.status(200).json({
//       success: true,
//       data: performance
//     });
//   } catch (error) {
//     console.error('Error fetching agent performance:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch agent performance',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Get marking job queue status
//  */
// export const getQueueStatus = async (req: Request, res: Response) => {
//   try {
//     const { location } = req.query;

//     const queueStatus = await markingOversightService.getQueueStatus(location as string);

//     res.status(200).json({
//       success: true,
//       data: queueStatus
//     });
//   } catch (error) {
//     console.error('Error fetching queue status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch queue status',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Get expired marking jobs
//  */
// export const getExpiredJobs = async (req: Request, res: Response) => {
//   try {
//     const { page = '1', limit = '20' } = req.query;

//     const pagination = {
//       page: parseInt(page as string),
//       limit: parseInt(limit as string)
//     };

//     const result = await markingOversightService.getExpiredJobs(pagination);

//     res.status(200).json({
//       success: true,
//       data: result.jobs,
//       pagination: {
//         total: result.total,
//         page: pagination.page,
//         limit: pagination.limit,
//         totalPages: Math.ceil(result.total / pagination.limit)
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching expired jobs:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch expired jobs',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Get marking analytics dashboard data
//  */
// export const getMarkingAnalytics = async (req: Request, res: Response) => {
//   try {
//     const { startDate, endDate, groupBy = 'day' } = req.query;

//     const dateRange = {
//       startDate: startDate ? new Date(startDate as string) : undefined,
//       endDate: endDate ? new Date(endDate as string) : undefined
//     };

//     const analytics = await markingAnalyticsService.getMarkingAnalytics(
//       dateRange,
//       groupBy as 'day' | 'week' | 'month'
//     );

//     res.status(200).json({
//       success: true,
//       data: analytics
//     });
//   } catch (error) {
//     console.error('Error fetching marking analytics:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch marking analytics',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Update marking job urgency level
//  */
// export const updateJobUrgency = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const { urgencyLevel, reason } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     const result = await markingOversightService.updateJobUrgency(
//       jobId,
//       urgencyLevel,
//       adminId,
//       reason
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Job urgency updated successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error updating job urgency:', error);
//     res.status(400).json({
//       success: false,
//       message: 'Failed to update job urgency',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Extend marking job deadline
//  */
// export const extendJobDeadline = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const { extensionHours, reason } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     const result = await markingOversightService.extendJobDeadline(
//       jobId,
//       extensionHours,
//       adminId,
//       reason
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Job deadline extended successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error extending job deadline:', error);
//     res.status(400).json({
//       success: false,
//       message: 'Failed to extend job deadline',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Get marking job history
//  */
// export const getJobHistory = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;

//     const history = await markingOversightService.getJobHistory(jobId);

//     res.status(200).json({
//       success: true,
//       data: history
//     });
//   } catch (error) {
//     console.error('Error fetching job history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch job history',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * Bulk update marking jobs
//  */
// export const bulkUpdateJobs = async (req: Request, res: Response) => {
//   try {
//     const { jobIds, action, data } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!Array.isArray(jobIds) || jobIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Job IDs are required'
//       });
//     }

//     const result = await markingOversightService.bulkUpdateJobs(
//       jobIds,
//       action,
//       data,
//       adminId
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Jobs updated successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error bulk updating jobs:', error);
//     res.status(400).json({
//       success: false,
//       message: 'Failed to update jobs',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };
















// // backend/admin-service/src/controllers/markingOversightController.ts

// import { Request, Response } from 'express';
// import { PrismaClient, MarkingJobStatus } from '@newcondo/db';
// import { successResponse, errorResponse } from '../../../shared/src/utils/response';
// import { adminController } from './adminController';

// const prisma = new PrismaClient();

// export class MarkingOversightController {
//   // Get all marking jobs
//   async getAllMarkingJobs(req: Request, res: Response) {
//     try {
//       const {
//         page = 1,
//         limit = 20,
//         status,
//         agentId,
//         sortBy = 'createdAt',
//         order = 'desc'
//       } = req.query;

//       const skip = (Number(page) - 1) * Number(limit);

//       const where: any = {};

//       if (status) {
//         where.status = status;
//       }

//       if (agentId) {
//         where.assignedAgentId = agentId;
//       }

//       const [jobs, total] = await Promise.all([
//         prisma.propertyMarkingJob.findMany({
//           where,
//           skip,
//           take: Number(limit),
//           orderBy: { [sortBy as string]: order },
//           include: {
//             property: {
//               select: {
//                 id: true,
//                 title: true,
//                 address: true,
//                 city: true,
//                 state: true
//               }
//             },
//             requestingUser: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true
//               }
//             },
//             assignedAgent: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true,
//                 agentReliabilityScore: true
//               }
//             }
//           }
//         }),
//         prisma.propertyMarkingJob.count({ where })
//       ]);

//       return successResponse(res, {
//         jobs,
//         pagination: {
//           total,
//           page: Number(page),
//           limit: Number(limit),
//           pages: Math.ceil(total / Number(limit))
//         }
//       }, 'Marking jobs retrieved successfully');
//     } catch (error) {
//       console.error('Get all marking jobs error:', error);
//       return errorResponse(res, 'Failed to retrieve marking jobs', 500);
//     }
//   }

//   // Get marking job details
//   async getMarkingJobDetails(req: Request, res: Response) {
//     try {
//       const { jobId } = req.params;

//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: {
//           property: {
//             include: {
//               owner: {
//                 select: {
//                   id: true,
//                   name: true,
//                   email: true,
//                   phone: true
//                 }
//               },
//               images: true
//             }
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               role: true
//             }
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               agentReliabilityScore: true,
//               totalMarkingJobs: true,
//               completedMarkingJobs: true
//             }
//           }
//         }
//       });

//       if (!job) {
//         return errorResponse(res, 'Marking job not found', 404);
//       }

//       return successResponse(res, job, 'Marking job details retrieved successfully');
//     } catch (error) {
//       console.error('Get marking job details error:', error);
//       return errorResponse(res, 'Failed to retrieve marking job details', 500);
//     }
//   }

//   // Approve completed marking job
//   async approveMarkingJob(req: Request, res: Response) {
//     try {
//       const adminId = req.user?.id;
//       const { jobId } = req.params;
//       const { notes } = req.body;

//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: {
//           property: true,
//           assignedAgent: true
//         }
//       });

//       if (!job) {
//         return errorResponse(res, 'Marking job not found', 404);
//       }

//       if (job.status !== 'COMPLETED') {
//         return errorResponse(res, 'Only completed jobs can be approved', 400);
//       }

//       // Update property with verified boundary
//       await prisma.property.update({
//         where: { id: job.propertyId },
//         data: {
//           boundaryVerified: true,
//           boundaryMarkedBy: job.assignedAgentId,
//           boundaryMarkedAt: job.completedAt,
//           boundaryCoordinates: job.boundaryData || undefined
//         }
//       });

//       // Update agent stats
//       if (job.assignedAgent) {
//         await prisma.user.update({
//           where: { id: job.assignedAgentId! },
//           data: {
//             completedMarkingJobs: {
//               increment: 1
//             }
//           }
//         });
//       }

//       // Log admin action
//       await adminController.logAdminAction(
//         adminId!,
//         'BOUNDARY_DISPUTE_RESOLVED',
//         'PropertyMarkingJob',
//         jobId,
//         `Approved marking job for property: ${job.property.title}`,
//         { notes }
//       );

//       // TODO: Release payment to agent

//       return successResponse(res, job, 'Marking job approved successfully');
//     } catch (error) {
//       console.error('Approve marking job error:', error);
//       return errorResponse(res, 'Failed to approve marking job', 500);
//     }
//   }

//   // Reject completed marking job
//   async rejectMarkingJob(req: Request, res: Response) {
//     try {
//       const adminId = req.user?.id;
//       const { jobId } = req.params;
//       const { reason } = req.body;

//       if (!reason) {
//         return errorResponse(res, 'Rejection reason is required', 400);
//       }

//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: {
//           property: true
//         }
//       });

//       if (!job) {
//         return errorResponse(res, 'Marking job not found', 404);
//       }

//       if (job.status !== 'COMPLETED') {
//         return errorResponse(res, 'Only completed jobs can be rejected', 400);
//       }

//       // Update job to require rework
//       const updatedJob = await prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           status: 'IN_PROGRESS',
//           completionNotes: `Admin rejection: ${reason}`
//         }
//       });

//       // Log admin action
//       await adminController.logAdminAction(
//         adminId!,
//         'BOUNDARY_DISPUTE_RESOLVED',
//         'PropertyMarkingJob',
//         jobId,
//         `Rejected marking job for property: ${job.property.title}`,
//         { reason }
//       );

//       // TODO: Notify agent to redo the job

//       return successResponse(res, updatedJob, 'Marking job rejected - rework required');
//     } catch (error) {
//       console.error('Reject marking job error:', error);
//       return errorResponse(res, 'Failed to reject marking job', 500);
//     }
//   }

//   // Reassign marking job
//   async reassignMarkingJob(req: Request, res: Response) {
//     try {
//       const adminId = req.user?.id;
//       const { jobId } = req.params;
//       const { newAgentId, reason } = req.body;

//       if (!newAgentId) {
//         return errorResponse(res, 'New agent ID is required', 400);
//       }

//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: {
//           property: true,
//           assignedAgent: true
//         }
//       });

//       if (!job) {
//         return errorResponse(res, 'Marking job not found', 404);
//       }

//       // Check if new agent exists
//       const newAgent = await prisma.user.findUnique({
//         where: { id: newAgentId }
//       });

//       if (!newAgent || !newAgent.isAvailableForMarking) {
//         return errorResponse(res, 'Invalid agent or agent not available for marking', 400);
//       }

//       // Reassign job
//       const updatedJob = await prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           assignedAgentId: newAgentId,
//           status: 'ASSIGNED',
//           assignedAt: new Date(),
//           timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
//           completionNotes: reason
//         }
//       });

//       // Log admin action
//       await adminController.logAdminAction(
//         adminId!,
//         'BOUNDARY_DISPUTE_RESOLVED',
//         'PropertyMarkingJob',
//         jobId,
//         `Reassigned marking job from ${job.assignedAgent?.name} to ${newAgent.name}`,
//         { oldAgentId: job.assignedAgentId, newAgentId, reason }
//       );

//       // TODO: Notify both agents

//       return successResponse(res, updatedJob, 'Marking job reassigned successfully');
//     } catch (error) {
//       console.error('Reassign marking job error:', error);
//       return errorResponse(res, 'Failed to reassign marking job', 500);
//     }
//   }

//   // Cancel marking job
//   async cancelMarkingJob(req: Request, res: Response) {
//     try {
//       const adminId = req.user?.id;
//       const { jobId } = req.params;
//       const { reason } = req.body;

//       if (!reason) {
//         return errorResponse(res, 'Cancellation reason is required', 400);
//       }

//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: {
//           property: true
//         }
//       });

//       if (!job) {
//         return errorResponse(res, 'Marking job not found', 404);
//       }

//       if (job.status === 'COMPLETED') {
//         return errorResponse(res, 'Cannot cancel completed jobs', 400);
//       }

//       // Cancel job
//       const updatedJob = await prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           status: 'CANCELLED',
//           completionNotes: `Admin cancellation: ${reason}`
//         }
//       });

//       // Log admin action
//       await adminController.logAdminAction(
//         adminId!,
//         'BOUNDARY_DISPUTE_RESOLVED',
//         'PropertyMarkingJob',
//         jobId,
//         `Cancelled marking job for property: ${job.property.title}`,
//         { reason }
//       );

//       // TODO: Process refund if payment was made

//       return successResponse(res, updatedJob, 'Marking job cancelled successfully');
//     } catch (error) {
//       console.error('Cancel marking job error:', error);
//       return errorResponse(res, 'Failed to cancel marking job', 500);
//     }
//   }

//   // Get marking job statistics
//   async getMarkingJobStatistics(req: Request, res: Response) {
//     try {
//       const { period = '30d' } = req.query;

//       const endDate = new Date();
//       const startDate = new Date();
      
//       switch (period) {
//         case '7d':
//           startDate.setDate(endDate.getDate() - 7);
//           break;
//         case '30d':
//           startDate.setDate(endDate.getDate() - 30);
//           break;
//         case '90d':
//           startDate.setDate(endDate.getDate() - 90);
//           break;
//         default:
//           startDate.setDate(endDate.getDate() - 30);
//       }

//       const [
//         statusBreakdown,
//         completionRate,
//         averageCompletionTime,
//         topAgents,
//         jobsByUrgency
//       ] = await Promise.all([
//         prisma.propertyMarkingJob.groupBy({
//           by: ['status'],
//           _count: { status: true },
//           where: {
//             createdAt: {
//               gte: startDate,
//               lte: endDate
//             }
//           }
//         }),
//         prisma.propertyMarkingJob.count({
//           where: {
//             status: 'COMPLETED',
//             createdAt: {
//               gte: startDate,
//               lte: endDate
//             }
//           }
//         }).then(completed =>
//           prisma.propertyMarkingJob.count({
//             where: {
//               createdAt: {
//                 gte: startDate,
//                 lte: endDate
//               }
//             }
//           }).then(total => ({
//             completed,
//             total,
//             rate: total > 0 ? (completed / total) * 100 : 0
//           }))
//         ),
//         prisma.propertyMarkingJob.findMany({
//           where: {
//             status: 'COMPLETED',
//             completedAt: { not: null },
//             assignedAt: { not: null },
//             createdAt: {
//               gte: startDate,
//               lte: endDate
//             }
//           },
//           select: {
//             assignedAt: true,
//             completedAt: true
//           }
//         }).then(jobs => {
//           if (jobs.length === 0) return 0;
//           const totalTime = jobs.reduce((sum, job) => {
//             const time = job.completedAt!.getTime() - job.assignedAt!.getTime();
//             return sum + time;
//           }, 0);
//           return totalTime / jobs.length / (1000 * 60 * 60); // Hours
//         }),
//         prisma.user.findMany({
//           where: {
//             completedMarkingJobs: { gt: 0 },
//             isAvailableForMarking: true
//           },
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             completedMarkingJobs: true,
//             totalMarkingJobs: true,
//             agentReliabilityScore: true
//           },
//           orderBy: {
//             completedMarkingJobs: 'desc'
//           },
//           take: 10
//         }),
//         prisma.propertyMarkingJob.groupBy({
//           by: ['urgencyLevel'],
//           _count: { urgencyLevel: true },
//           where: {
//             createdAt: {
//               gte: startDate,
//               lte: endDate
//             }
//           }
//         })
//       ]);

//       return successResponse(res, {
//         period,
//         dateRange: { startDate, endDate },
//         statistics: {
//           statusBreakdown,
//           completionRate,
//           averageCompletionTime,
//           topAgents,
//           jobsByUrgency
//         }
//       }, 'Marking job statistics retrieved successfully');
//     } catch (error) {
//       console.error('Get marking job statistics error:', error);
//       return errorResponse(res, 'Failed to retrieve marking job statistics', 500);
//     }
//   }

//   // Update agent reliability score
//   async updateAgentReliability(req: Request, res: Response) {
//     try {
//       const adminId = req.user?.id;
//       const { agentId } = req.params;
//       const { score, reason } = req.body;

//       if (score < 0 || score > 5) {
//         return errorResponse(res, 'Score must be between 0 and 5', 400);
//       }

//       const agent = await prisma.user.findUnique({
//         where: { id: agentId }
//       });

//       if (!agent) {
//         return errorResponse(res, 'Agent not found', 404);
//       }

//       if (!agent.isAvailableForMarking) {
//         return errorResponse(res, 'User is not a marking agent', 400);
//       }

//       // Update agent reliability score
//       const updatedAgent = await prisma.user.update({
//         where: { id: agentId },
//         data: {
//           agentReliabilityScore: score
//         }
//       });

//       // Log admin action
//       await adminController.logAdminAction(
//         adminId!,
//         'AGENT_SUSPENDED',
//         'User',
//         agentId,
//         `Updated reliability score for agent: ${agent.name}`,
//         { oldScore: agent.agentReliabilityScore, newScore: score, reason }
//       );

//       return successResponse(res, updatedAgent, 'Agent reliability score updated successfully');
//     } catch (error) {
//       console.error('Update agent reliability error:', error);
//       return errorResponse(res, 'Failed to update agent reliability score', 500);
//     }
//   }
// }

// export const markingOversightController = new MarkingOversightController();