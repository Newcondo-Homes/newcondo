// backend/admin-service/src/controllers/queueOversightController.ts

import { Request, Response, NextFunction } from 'express';
import { queueOversightService } from '../services/queueOversightService';
import { queueAnalyticsService } from '../services/queueAnalyticsService';

/**
 * Get overview of all marking job queues
 */
export const getQueueOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, dateFrom, dateTo, priority } = req.query;

    const overview = await queueOversightService.getQueueOverview({
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      priority: priority as string,
    });

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed information about a specific marking job queue
 */
export const getQueueDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    const details = await queueOversightService.getQueueDetails(jobId);

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all agents in queue for a specific marking job
 */
export const getQueueAgents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    const { includeHistory } = req.query;

    const agents = await queueOversightService.getQueueAgents(
      jobId,
      includeHistory === 'true'
    );

    res.status(200).json({
      success: true,
      data: agents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually reassign a marking job to a different agent
 */
export const reassignMarkingJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    const { newAgentId, reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await queueOversightService.reassignMarkingJob(
      jobId,
      newAgentId,
      adminId,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Marking job reassigned successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a marking job from admin panel
 */
export const cancelMarkingJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await queueOversightService.cancelMarkingJob(
      jobId,
      adminId,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Marking job cancelled successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Extend time slot for an agent working on a marking job
 */
export const extendTimeSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    const { extensionHours, reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await queueOversightService.extendTimeSlot(
      jobId,
      extensionHours,
      adminId,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Time slot extended successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get queue performance metrics
 */
export const getQueueMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, dateFrom, dateTo } = req.query;

    const metrics = await queueAnalyticsService.getQueueMetrics({
      period: period as 'day' | 'week' | 'month' | 'year',
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get agent performance in queue system
 */
export const getAgentQueuePerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const performance = await queueAnalyticsService.getAgentQueuePerformance(
      agentId,
      {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      }
    );

    res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get queue bottlenecks and issues
 */
export const getQueueBottlenecks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bottlenecks = await queueAnalyticsService.identifyBottlenecks();

    res.status(200).json({
      success: true,
      data: bottlenecks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get queue waiting times analysis
 */
export const getWaitingTimesAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period } = req.query;

    const analysis = await queueAnalyticsService.analyzeWaitingTimes(
      period as 'day' | 'week' | 'month'
    );

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Force complete a marking job (admin override)
 */
export const forceCompleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    const { reason, completionData } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await queueOversightService.forceCompleteJob(
      jobId,
      adminId,
      reason,
      completionData
    );

    res.status(200).json({
      success: true,
      message: 'Marking job force completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expired time slots that need attention
 */
export const getExpiredTimeSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const expiredSlots = await queueOversightService.getExpiredTimeSlots();

    res.status(200).json({
      success: true,
      data: expiredSlots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get queue health status
 */
export const getQueueHealthStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const healthStatus = await queueAnalyticsService.getQueueHealthStatus();

    res.status(200).json({
      success: true,
      data: healthStatus,
    });
  } catch (error) {
    next(error);
  }
};