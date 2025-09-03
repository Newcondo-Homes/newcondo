import { Request, Response } from 'express';
import { assignmentService } from '../services/assignmentService';
import { notificationService } from '../services/notificationService';
import { timeSlotService } from '../services/timeSlotService';
import { ApiResponse } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/utils/logger';

export const assignmentController = {
  // Accept a marking job assignment
  async acceptAssignment(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;

      const assignment = await assignmentService.acceptAssignment(jobId, agentId);

      // Create time slot for the agent
      await timeSlotService.createTimeSlot(jobId, agentId);

      // Notify property owner
      await notificationService.notifyJobAssigned(assignment);

      return ApiResponse.success(res, assignment, 'Assignment accepted successfully');
    } catch (error: any) {
      logger.error('Error accepting assignment:', error);
      return ApiResponse.error(res, error.message || 'Failed to accept assignment', 400);
    }
  },

  // Decline a marking job assignment
  async declineAssignment(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { reason } = req.body;

      const result = await assignmentService.declineAssignment(jobId, agentId, reason);

      return ApiResponse.success(res, result, 'Assignment declined');
    } catch (error: any) {
      logger.error('Error declining assignment:', error);
      return ApiResponse.error(res, error.message || 'Failed to decline assignment', 400);
    }
  },

  // Start working on the assigned job
  async startJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;

      const job = await assignmentService.startJob(jobId, agentId);

      // Notify property owner that agent is en route
      await notificationService.notifyJobStarted(job);

      return ApiResponse.success(res, job, 'Job started successfully');
    } catch (error: any) {
      logger.error('Error starting job:', error);
      return ApiResponse.error(res, error.message || 'Failed to start job', 400);
    }
  },

  // Update job progress
  async updateProgress(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { status, notes, location } = req.body;

      const progress = await assignmentService.updateProgress(jobId, agentId, {
        status,
        notes,
        location
      });

      return ApiResponse.success(res, progress, 'Progress updated');
    } catch (error: any) {
      logger.error('Error updating progress:', error);
      return ApiResponse.error(res, error.message || 'Failed to update progress', 400);
    }
  },

  // Get agent's active assignments
  async getActiveAssignments(req: Request, res: Response) {
    try {
      const agentId = req.user.id;

      const assignments = await assignmentService.getActiveAssignments(agentId);

      return ApiResponse.success(res, assignments, 'Active assignments retrieved');
    } catch (error: any) {
      logger.error('Error getting active assignments:', error);
      return ApiResponse.error(res, 'Failed to get active assignments', 500);
    }
  },

  // Get agent's assignment history
  async getAssignmentHistory(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      const { limit = 20, offset = 0, status } = req.query;

      const history = await assignmentService.getAssignmentHistory(agentId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        status: status as string
      });

      return ApiResponse.success(res, history, 'Assignment history retrieved');
    } catch (error: any) {
      logger.error('Error getting assignment history:', error);
      return ApiResponse.error(res, 'Failed to get assignment history', 500);
    }
  },

  // Get time slot information for a job
  async getTimeSlot(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;

      const timeSlot = await timeSlotService.getJobTimeSlot(jobId, agentId);

      return ApiResponse.success(res, timeSlot, 'Time slot information retrieved');
    } catch (error: any) {
      logger.error('Error getting time slot:', error);
      return ApiResponse.error(res, 'Failed to get time slot', 500);
    }
  },

  // Request time extension for job
  async requestTimeExtension(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { reason, additionalHours } = req.body;

      const extension = await timeSlotService.requestTimeExtension(jobId, agentId, {
        reason,
        additionalHours
      });

      return ApiResponse.success(res, extension, 'Time extension requested');
    } catch (error: any) {
      logger.error('Error requesting time extension:', error);
      return ApiResponse.error(res, error.message || 'Failed to request time extension', 400);
    }
  },

  // Contact property owner
  async contactPropertyOwner(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { message, contactMethod } = req.body;

      const contact = await assignmentService.contactPropertyOwner(jobId, agentId, {
        message,
        contactMethod
      });

      return ApiResponse.success(res, contact, 'Owner contacted successfully');
    } catch (error: any) {
      logger.error('Error contacting owner:', error);
      return ApiResponse.error(res, error.message || 'Failed to contact owner', 400);
    }
  },

  // Get contact details for property owner
  async getContactDetails(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;

      const contactDetails = await assignmentService.getContactDetails(jobId, agentId);

      return ApiResponse.success(res, contactDetails, 'Contact details retrieved');
    } catch (error: any) {
      logger.error('Error getting contact details:', error);
      return ApiResponse.error(res, error.message || 'Failed to get contact details', 400);
    }
  },

  // Verify agent's location at property
  async verifyAgentLocation(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { latitude, longitude, accuracy } = req.body;

      const verification = await assignmentService.verifyAgentLocation(jobId, agentId, {
        latitude,
        longitude,
        accuracy
      });

      return ApiResponse.success(res, verification, 'Location verified');
    } catch (error: any) {
      logger.error('Error verifying location:', error);
      return ApiResponse.error(res, error.message || 'Failed to verify location', 400);
    }
  },

  // Upload progress photos during job
  async uploadProgressPhotos(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { photos, description } = req.body;

      const upload = await assignmentService.uploadProgressPhotos(jobId, agentId, {
        photos,
        description
      });

      return ApiResponse.success(res, upload, 'Progress photos uploaded');
    } catch (error: any) {
      logger.error('Error uploading progress photos:', error);
      return ApiResponse.error(res, 'Failed to upload photos', 500);
    }
  },

  // Report an issue during job execution
  async reportIssue(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { issueType, description, severity } = req.body;

      const issue = await assignmentService.reportIssue(jobId, agentId, {
        issueType,
        description,
        severity
      });

      // Notify admin for urgent issues
      if (severity === 'URGENT') {
        await notificationService.notifyAdminIssue(issue);
      }

      return ApiResponse.success(res, issue, 'Issue reported');
    } catch (error: any) {
      logger.error('Error reporting issue:', error);
      return ApiResponse.error(res, 'Failed to report issue', 500);
    }
  },

  // Request support during job
  async requestSupport(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { message, priority } = req.body;

      const supportRequest = await assignmentService.requestSupport(jobId, agentId, {
        message,
        priority
      });

      return ApiResponse.success(res, supportRequest, 'Support requested successfully');
    } catch (error: any) {
      logger.error('Error requesting support:', error);
      return ApiResponse.error(res, 'Failed to request support', 500);
    }
  },

  // Complete a marking job
  async completeJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { finalNotes, finalPhotos } = req.body;

      const completedJob = await assignmentService.completeJob(jobId, agentId, {
        finalNotes,
        finalPhotos
      });

      await notificationService.notifyJobCompleted(completedJob);

      return ApiResponse.success(res, completedJob, 'Job completed successfully');
    } catch (error: any) {
      logger.error('Error completing job:', error);
      return ApiResponse.error(res, error.message || 'Failed to complete job', 400);
    }
  },

  // Cancel a marking job
  async cancelJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;
      const { reason } = req.body;

      const cancellation = await assignmentService.cancelJob(jobId, agentId, reason);

      await notificationService.notifyJobCancelled(cancellation);

      return ApiResponse.success(res, cancellation, 'Job cancelled successfully');
    } catch (error: any) {
      logger.error('Error cancelling job:', error);
      return ApiResponse.error(res, error.message || 'Failed to cancel job', 400);
    }
  },

  // Get details for a specific assignment
  async getAssignmentDetails(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const agentId = req.user.id;

      const assignmentDetails = await assignmentService.getAssignmentDetails(jobId, agentId);

      if (!assignmentDetails) {
        return ApiResponse.error(res, 'Assignment not found or not accessible', 404);
      }

      return ApiResponse.success(res, assignmentDetails, 'Assignment details retrieved');
    } catch (error: any) {
      logger.error('Error getting assignment details:', error);
      return ApiResponse.error(res, 'Failed to get assignment details', 500);
    }
  }
};
