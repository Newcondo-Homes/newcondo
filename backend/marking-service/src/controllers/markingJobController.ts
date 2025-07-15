// backend/marking-service/src/controllers/markingJobController.ts

import { Request, Response } from 'express';
import { MarkingJobService } from '../services/markingJobService';
import { QueueService } from '../services/queueService';
import { AssignmentService } from '../services/assignmentService';
import { NotificationService } from '../services/notificationService';

const markingJobService = new MarkingJobService();
const queueService = new QueueService();
const assignmentService = new AssignmentService();
const notificationService = new NotificationService();

export class MarkingJobController {
  async createMarkingJob(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const markingJobData = {
        ...req.body,
        requestedBy: userId,
      };

      const job = await markingJobService.createMarkingJob(markingJobData);
      
      // Add to queue
      await queueService.addToQueue(job.id);
      
      // Try to assign to available agent
      await assignmentService.tryAutoAssign(job.id);

      res.status(201).json({
        success: true,
        data: job,
        message: 'Marking job created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create marking job',
        error: error.message,
      });
    }
  }

  async getMarkingJobs(req: Request, res: Response) {
    try {
      const { status, agentId } = req.query;
      let jobs;

      if (agentId) {
        jobs = await markingJobService.getJobsForAgent(agentId as string);
      } else if (status) {
        jobs = await markingJobService.getJobsByStatus(status as any);
      } else {
        jobs = await markingJobService.getJobsByUser(req.user.id);
      }

      res.json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch marking jobs',
        error: error.message,
      });
    }
  }

  async assignAgent(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { agentId } = req.body;

      const job = await markingJobService.assignAgentToJob(jobId, agentId);
      
      // Send notification to agent
      await notificationService.notifyAgentAssignment(job);

      res.json({
        success: true,
        data: job,
        message: 'Agent assigned successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to assign agent',
        error: error.message,
      });
    }
  }

  async startJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await markingJobService.startJob(jobId);

      res.json({
        success: true,
        data: job,
        message: 'Job started successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to start job',
        error: error.message,
      });
    }
  }

  async completeJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const completionData = req.body;

      const job = await markingJobService.completeJob(jobId, completionData);
      
      // Send completion notification
      await notificationService.notifyJobCompletion(job);

      res.json({
        success: true,
        data: job,
        message: 'Job completed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete job',
        error: error.message,
      });
    }
  }

  async cancelJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await markingJobService.cancelJob(jobId);

      res.json({
        success: true,
        data: job,
        message: 'Job cancelled successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to cancel job',
        error: error.message,
      });
    }
  }

  async getAvailableAgents(req: Request, res: Response) {
    try {
      const { serviceArea } = req.query;
      const agents = await markingJobService.getAvailableAgents(serviceArea as string);

      res.json({
        success: true,
        data: agents,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available agents',
        error: error.message,
      });
    }
  }
}
