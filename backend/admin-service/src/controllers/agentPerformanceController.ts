import { Request, Response } from 'express';
import { agentPerformanceService } from '../services/agentPerformanceService';
import { successResponse, errorResponse } from '@newcondo/backend-shared/';

export class AgentPerformanceController {
  /**
   * Get agent performance overview
   */
  async getAgentOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const overview = await agentPerformanceService.getAgentOverview({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return successResponse(res, overview, 'Agent overview retrieved successfully');
    } catch (error) {
      console.error('Error fetching agent overview:', error);
      return errorResponse(res, 'Failed to fetch agent overview', 500);
    }
  }

  /**
   * Get individual agent performance
   */
  async getAgentPerformance(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;

      const performance = await agentPerformanceService.getAgentPerformance({
        agentId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return successResponse(res, performance, 'Agent performance retrieved successfully');
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      return errorResponse(res, 'Failed to fetch agent performance', 500);
    }
  }

  /**
   * Get top performing agents
   */
  async getTopAgents(req: Request, res: Response) {
    try {
      const { limit = '10', metric = 'revenue', startDate, endDate } = req.query;

      const topAgents = await agentPerformanceService.getTopAgents({
        limit: parseInt(limit as string),
        metric: metric as 'revenue' | 'listings' | 'rentals' | 'markings',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return successResponse(res, topAgents, 'Top agents retrieved successfully');
    } catch (error) {
      console.error('Error fetching top agents:', error);
      return errorResponse(res, 'Failed to fetch top agents', 500);
    }
  }

  /**
   * Get agent listing statistics
   */
  async getAgentListingStats(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;

      const stats = await agentPerformanceService.getAgentListingStats({
        agentId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return successResponse(res, stats, 'Agent listing stats retrieved successfully');
    } catch (error) {
      console.error('Error fetching agent listing stats:', error);
      return errorResponse(res, 'Failed to fetch agent listing stats', 500);
    }
  }

  /**
   * Get agent marking job performance
   */
  async getAgentMarkingPerformance(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;

      const performance = await agentPerformanceService.getAgentMarkingPerformance({
        agentId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return successResponse(res, performance, 'Agent marking performance retrieved successfully');
    } catch (error) {
      console.error('Error fetching agent marking performance:', error);
      return errorResponse(res, 'Failed to fetch agent marking performance', 500);
    }
  }

  /**
   * Get agent commission earnings
   */
  async getAgentCommissions(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const { startDate, endDate, status } = req.query;

      const commissions = await agentPerformanceService.getAgentCommissions({
        agentId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string,
      });

      return successResponse(res, commissions, 'Agent commissions retrieved successfully');
    } catch (error) {
      console.error('Error fetching agent commissions:', error);
      return errorResponse(res, 'Failed to fetch agent commissions', 500);
    }
  }

  /**
   * Get agent reliability score breakdown
   */
  async getAgentReliabilityScore(req: Request, res: Response) {
    try {
      const { agentId } = req.params;

      const score = await agentPerformanceService.getAgentReliabilityScore(agentId);

      return successResponse(res, score, 'Agent reliability score retrieved successfully');
    } catch (error) {
      console.error('Error fetching agent reliability score:', error);
      return errorResponse(res, 'Failed to fetch agent reliability score', 500);
    }
  }

  /**
   * Get agent referral performance
   */
  async getAgentReferralPerformance(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;

      const performance = await agentPerformanceService.getAgentReferralPerformance({
        agentId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return successResponse(res, performance, 'Agent referral performance retrieved successfully');
    } catch (error) {
      console.error('Error fetching agent referral performance:', error);
      return errorResponse(res, 'Failed to fetch agent referral performance', 500);
    }
  }

  /**
   * Compare agents performance
   */
  async compareAgents(req: Request, res: Response) {
    try {
      const { agentIds, startDate, endDate } = req.body;

      const comparison = await agentPerformanceService.compareAgents({
        agentIds,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return successResponse(res, comparison, 'Agent comparison retrieved successfully');
    } catch (error) {
      console.error('Error comparing agents:', error);
      return errorResponse(res, 'Failed to compare agents', 500);
    }
  }
}

export const agentPerformanceController = new AgentPerformanceController();