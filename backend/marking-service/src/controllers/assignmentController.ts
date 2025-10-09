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




// // backend/marking-service/src/controllers/assignmentController.ts

// import { Request, Response } from 'express';
// import { assignmentService } from '../services/assignmentService';
// import { queueService } from '../services/queueService';
// import { notificationService } from '../services/notificationService';
// import { ApiResponse } from '../../../shared/src/utils/response';

// /**
//  * Assignment Controller
//  * Handles job assignment logic for property marking service
//  */
// class AssignmentController {
//   /**
//    * Assign marking job to specific agent (direct assignment)
//    * POST /api/marking/assignments/direct
//    */
//   async assignDirectly(req: Request, res: Response): Promise<void> {
//     try {
//       const { markingJobId, agentId } = req.body;
//       const userId = req.user?.id;

//       if (!userId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       // Assign job directly to agent
//       const assignment = await assignmentService.assignJobDirectly(
//         markingJobId,
//         agentId,
//         userId
//       );

//       // Send notification to assigned agent
//       await notificationService.notifyAgentOfAssignment(
//         agentId,
//         assignment.markingJob
//       );

//       res.status(200).json(
//         ApiResponse.success(assignment, 'Job assigned successfully')
//       );
//     } catch (error: any) {
//       console.error('Error in assignDirectly:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to assign job', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Broadcast marking job to nearby agents
//    * POST /api/marking/assignments/broadcast
//    */
//   async broadcastToAgents(req: Request, res: Response): Promise<void> {
//     try {
//       const { markingJobId } = req.body;
//       const userId = req.user?.id;

//       if (!userId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       // Broadcast job to nearby agents
//       const broadcastResult = await assignmentService.broadcastJob(
//         markingJobId,
//         userId
//       );

//       // Send notifications to all nearby agents
//       await notificationService.notifyNearbyAgents(
//         broadcastResult.notifiedAgents,
//         broadcastResult.markingJob
//       );

//       res.status(200).json(
//         ApiResponse.success(
//           {
//             markingJob: broadcastResult.markingJob,
//             notifiedAgentsCount: broadcastResult.notifiedAgents.length,
//             proximityRadius: broadcastResult.proximityRadius
//           },
//           'Job broadcasted to nearby agents'
//         )
//       );
//     } catch (error: any) {
//       console.error('Error in broadcastToAgents:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to broadcast job', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Agent accepts a marking job from queue
//    * POST /api/marking/assignments/accept
//    */
//   async acceptJob(req: Request, res: Response): Promise<void> {
//     try {
//       const { markingJobId } = req.body;
//       const agentId = req.user?.id;

//       if (!agentId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       // Check if agent is eligible
//       const eligibility = await assignmentService.checkAgentEligibility(
//         agentId,
//         markingJobId
//       );

//       if (!eligibility.isEligible) {
//         res.status(400).json(
//           ApiResponse.error(eligibility.reason || 'Agent not eligible', 400)
//         );
//         return;
//       }

//       // Add agent to queue
//       const queueEntry = await queueService.addToQueue(markingJobId, agentId);

//       // If agent is first in queue, assign immediately
//       if (queueEntry.position === 1) {
//         const assignment = await assignmentService.assignToFirstInQueue(markingJobId);
        
//         // Notify agent of assignment
//         await notificationService.notifyAgentOfAssignment(
//           agentId,
//           assignment.markingJob
//         );

//         res.status(200).json(
//           ApiResponse.success(
//             {
//               assignment,
//               queuePosition: 1,
//               timeSlotExpiry: assignment.timeSlotExpiry
//             },
//             'Job assigned successfully'
//           )
//         );
//       } else {
//         // Agent added to queue
//         res.status(200).json(
//           ApiResponse.success(
//             {
//               queueEntry,
//               estimatedWaitTime: queueEntry.estimatedWaitTime
//             },
//             'Added to queue successfully'
//           )
//         );
//       }
//     } catch (error: any) {
//       console.error('Error in acceptJob:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to accept job', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Reassign job to next agent in queue (when current agent fails/expires)
//    * POST /api/marking/assignments/:jobId/reassign
//    */
//   async reassignToNext(req: Request, res: Response): Promise<void> {
//     try {
//       const { jobId } = req.params;
//       const { reason } = req.body;

//       // Reassign to next in queue
//       const reassignment = await assignmentService.reassignToNextInQueue(
//         jobId,
//         reason
//       );

//       if (!reassignment) {
//         res.status(404).json(
//           ApiResponse.error('No agents available in queue', 404)
//         );
//         return;
//       }

//       // Notify new agent
//       await notificationService.notifyAgentOfAssignment(
//         reassignment.newAgentId,
//         reassignment.markingJob
//       );

//       // Notify previous agent (if any)
//       if (reassignment.previousAgentId) {
//         await notificationService.notifyAgentOfReassignment(
//           reassignment.previousAgentId,
//           reassignment.markingJob,
//           reason
//         );
//       }

//       res.status(200).json(
//         ApiResponse.success(reassignment, 'Job reassigned successfully')
//       );
//     } catch (error: any) {
//       console.error('Error in reassignToNext:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to reassign job', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Get agent's current assignment
//    * GET /api/marking/assignments/current
//    */
//   async getCurrentAssignment(req: Request, res: Response): Promise<void> {
//     try {
//       const agentId = req.user?.id;

//       if (!agentId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       const assignment = await assignmentService.getAgentCurrentAssignment(agentId);

//       if (!assignment) {
//         res.status(200).json(
//           ApiResponse.success(null, 'No active assignment')
//         );
//         return;
//       }

//       res.status(200).json(
//         ApiResponse.success(assignment, 'Current assignment retrieved')
//       );
//     } catch (error: any) {
//       console.error('Error in getCurrentAssignment:', error);
//       res.status(500).json(
//         ApiResponse.error('Failed to get current assignment', 500)
//       );
//     }
//   }

//   /**
//    * Get assignment history for agent
//    * GET /api/marking/assignments/history
//    */
//   async getAssignmentHistory(req: Request, res: Response): Promise<void> {
//     try {
//       const agentId = req.user?.id;
//       const { page = 1, limit = 10, status } = req.query;

//       if (!agentId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       const history = await assignmentService.getAgentAssignmentHistory(
//         agentId,
//         {
//           page: Number(page),
//           limit: Number(limit),
//           status: status as string
//         }
//       );

//       res.status(200).json(
//         ApiResponse.success(history, 'Assignment history retrieved')
//       );
//     } catch (error: any) {
//       console.error('Error in getAssignmentHistory:', error);
//       res.status(500).json(
//         ApiResponse.error('Failed to get assignment history', 500)
//       );
//     }
//   }

//   /**
//    * Cancel assignment (agent declines or withdraws)
//    * DELETE /api/marking/assignments/:jobId/cancel
//    */
//   async cancelAssignment(req: Request, res: Response): Promise<void> {
//     try {
//       const { jobId } = req.params;
//       const agentId = req.user?.id;
//       const { reason } = req.body;

//       if (!agentId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       const cancellation = await assignmentService.cancelAgentAssignment(
//         jobId,
//         agentId,
//         reason
//       );

//       // Notify property owner of cancellation
//       await notificationService.notifyOwnerOfCancellation(
//         cancellation.markingJob.requestedBy,
//         cancellation.markingJob,
//         reason
//       );

//       // Reassign to next in queue if available
//       const reassignment = await assignmentService.reassignToNextInQueue(
//         jobId,
//         'Previous agent cancelled'
//       );

//       if (reassignment) {
//         await notificationService.notifyAgentOfAssignment(
//           reassignment.newAgentId,
//           reassignment.markingJob
//         );
//       }

//       res.status(200).json(
//         ApiResponse.success(
//           { cancellation, reassignment },
//           'Assignment cancelled successfully'
//         )
//       );
//     } catch (error: any) {
//       console.error('Error in cancelAssignment:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to cancel assignment', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Get assignment statistics for agent
//    * GET /api/marking/assignments/stats
//    */
//   async getAssignmentStats(req: Request, res: Response): Promise<void> {
//     try {
//       const agentId = req.user?.id;

//       if (!agentId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       const stats = await assignmentService.getAgentAssignmentStats(agentId);

//       res.status(200).json(
//         ApiResponse.success(stats, 'Assignment statistics retrieved')
//       );
//     } catch (error: any) {
//       console.error('Error in getAssignmentStats:', error);
//       res.status(500).json(
//         ApiResponse.error('Failed to get assignment statistics', 500)
//       );
//     }
//   }
// }

// export const assignmentController = new AssignmentController();