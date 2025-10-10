/**
 * Property Marking Service Integration
 * Location: backend/property-service/src/services/propertyMarkingService.ts
 * 
 * This service handles integration between property-service and marking-service
 * for property boundary marking operations.
 */

import { PrismaClient, Property, PropertyMarkingJob, MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@newcondo/db';
import axios from 'axios';

const prisma = new PrismaClient();

// Environment configuration
const MARKING_SERVICE_URL = process.env.MARKING_SERVICE_URL || 'http://localhost:3004';
const PROPERTY_MARKING_FEE = 20000; // 20,000 Naira
const AGENT_MARKING_PERCENTAGE = 0.25; // 25% of marking fee
const NEWCONDO_MARKING_FEE = 25000; // 25,000 Naira for Newcondo admin marking

interface CreateMarkingJobRequest {
  propertyId: string;
  requestedBy: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: UrgencyLevel;
  assignmentType: 'SELF' | 'NEWCONDO_ADMIN' | 'SHAREABLE_LINK' | 'AGENT_ASSIGNMENT';
}

interface MarkingJobResponse {
  success: boolean;
  markingJob?: PropertyMarkingJob;
  shareableLink?: string;
  message: string;
  error?: string;
}

interface AssignAgentRequest {
  markingJobId: string;
  agentId: string;
  timeSlotStart: Date;
  timeSlotEnd: Date;
}

interface ConfirmMarkingRequest {
  markingJobId: string;
  propertyOwnerId: string;
  isApproved: boolean;
  rejectionReason?: string;
}

interface MarkingJobDetails {
  markingJob: PropertyMarkingJob;
  property: Property;
  agentDetails?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    reliabilityScore: number;
  };
  queuePosition?: number;
  estimatedCompletionTime?: Date;
}

class PropertyMarkingService {
  /**
   * Create a new marking job request
   */
  async createMarkingJob(data: CreateMarkingJobRequest): Promise<MarkingJobResponse> {
    try {
      // Validate property exists and belongs to user
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        include: { owner: true }
      });

      if (!property) {
        return {
          success: false,
          message: 'Property not found',
          error: 'PROPERTY_NOT_FOUND'
        };
      }

      if (property.ownerId !== data.requestedBy) {
        return {
          success: false,
          message: 'You do not have permission to create a marking job for this property',
          error: 'UNAUTHORIZED'
        };
      }

      // Check if property already has a pending/in-progress marking job
      const existingJob = await prisma.propertyMarkingJob.findFirst({
        where: {
          propertyId: data.propertyId,
          status: {
            in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
          }
        }
      });

      if (existingJob) {
        return {
          success: false,
          message: 'A marking job is already in progress for this property',
          error: 'JOB_ALREADY_EXISTS'
        };
      }

      // Determine marking fee based on assignment type
      let markingFee = PROPERTY_MARKING_FEE;
      if (data.assignmentType === 'NEWCONDO_ADMIN') {
        markingFee = NEWCONDO_MARKING_FEE;
      } else if (data.assignmentType === 'SHAREABLE_LINK') {
        markingFee = 0; // No fee for shareable link
      }

      // Calculate max completion time (3 days from now)
      const maxCompletionTime = new Date();
      maxCompletionTime.setDate(maxCompletionTime.getDate() + 3);

      // Create marking job
      const markingJob = await prisma.propertyMarkingJob.create({
        data: {
          propertyId: data.propertyId,
          requestedBy: data.requestedBy,
          contactPersonName: data.contactPersonName,
          contactPersonPhone: data.contactPersonPhone,
          accessInstructions: data.accessInstructions,
          preferredTime: data.preferredTime,
          urgencyLevel: data.urgencyLevel || UrgencyLevel.NORMAL,
          markingFee,
          paymentStatus: markingFee > 0 ? PaymentStatus.PENDING : PaymentStatus.SUCCESS,
          status: MarkingJobStatus.QUEUED,
          maxCompletionTime
        }
      });

      // Generate shareable link for SHAREABLE_LINK assignment type
      let shareableLink: string | undefined;
      if (data.assignmentType === 'SHAREABLE_LINK') {
        shareableLink = await this.generateShareableLink(markingJob.id);
      }

      // If AGENT_ASSIGNMENT, notify marking service to broadcast to agents
      if (data.assignmentType === 'AGENT_ASSIGNMENT' && markingFee > 0) {
        await this.notifyMarkingServiceForBroadcast(markingJob.id, property);
      }

      return {
        success: true,
        markingJob,
        shareableLink,
        message: 'Marking job created successfully'
      };
    } catch (error) {
      console.error('Error creating marking job:', error);
      return {
        success: false,
        message: 'Failed to create marking job',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Generate shareable link for marking job
   */
  private async generateShareableLink(markingJobId: string): Promise<string> {
    const token = Buffer.from(`${markingJobId}:${Date.now()}`).toString('base64url');
    const baseUrl = process.env.FRONTEND_URL || 'https://newcondo.com';
    return `${baseUrl}/marking/shared/${token}`;
  }

  /**
   * Notify marking service to broadcast job to available agents
   */
  private async notifyMarkingServiceForBroadcast(
    markingJobId: string,
    property: Property
  ): Promise<void> {
    try {
      await axios.post(`${MARKING_SERVICE_URL}/api/marking/broadcast`, {
        markingJobId,
        propertyLocation: {
          city: property.city,
          state: property.state,
          coordinates: property.gpsCoordinates
        },
        urgency: property.adminApprovalStatus
      });
    } catch (error) {
      console.error('Error notifying marking service:', error);
      // Don't throw - job is created, broadcast failure shouldn't block
    }
  }

  /**
   * Get marking job details
   */
  async getMarkingJobDetails(markingJobId: string, userId: string): Promise<MarkingJobDetails | null> {
    try {
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: {
          property: true,
          requestingUser: true,
          assignedAgent: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              agentReliabilityScore: true
            }
          }
        }
      });

      if (!markingJob) {
        return null;
      }

      // Check authorization
      if (
        markingJob.requestedBy !== userId &&
        markingJob.assignedAgentId !== userId &&
        markingJob.property.ownerId !== userId
      ) {
        throw new Error('Unauthorized access to marking job');
      }

      const details: MarkingJobDetails = {
        markingJob,
        property: markingJob.property
      };

      if (markingJob.assignedAgent) {
        details.agentDetails = {
          id: markingJob.assignedAgent.id,
          name: markingJob.assignedAgent.name || 'Unknown',
          phone: markingJob.assignedAgent.phone || '',
          email: markingJob.assignedAgent.email,
          reliabilityScore: Number(markingJob.assignedAgent.agentReliabilityScore) || 0
        };
      }

      if (markingJob.queuePosition) {
        details.queuePosition = markingJob.queuePosition;
        // Estimate 3 hours per agent in queue ahead
        const hoursToWait = (markingJob.queuePosition - 1) * 3;
        details.estimatedCompletionTime = new Date(Date.now() + hoursToWait * 60 * 60 * 1000);
      }

      return details;
    } catch (error) {
      console.error('Error getting marking job details:', error);
      throw error;
    }
  }

  /**
   * Assign agent to marking job
   */
  async assignAgent(data: AssignAgentRequest): Promise<MarkingJobResponse> {
    try {
      // Forward to marking service for queue management
      const response = await axios.post(`${MARKING_SERVICE_URL}/api/marking/assign`, {
        markingJobId: data.markingJobId,
        agentId: data.agentId,
        timeSlotStart: data.timeSlotStart,
        timeSlotEnd: data.timeSlotEnd
      });

      return {
        success: true,
        markingJob: response.data.markingJob,
        message: 'Agent assigned successfully'
      };
    } catch (error) {
      console.error('Error assigning agent:', error);
      return {
        success: false,
        message: 'Failed to assign agent',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Confirm marking job completion by property owner
   */
  async confirmMarking(data: ConfirmMarkingRequest): Promise<MarkingJobResponse> {
    try {
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: data.markingJobId },
        include: { property: true }
      });

      if (!markingJob) {
        return {
          success: false,
          message: 'Marking job not found',
          error: 'JOB_NOT_FOUND'
        };
      }

      // Verify property ownership
      if (markingJob.property.ownerId !== data.propertyOwnerId) {
        return {
          success: false,
          message: 'Unauthorized: You are not the property owner',
          error: 'UNAUTHORIZED'
        };
      }

      if (markingJob.status !== MarkingJobStatus.IN_PROGRESS) {
        return {
          success: false,
          message: 'Marking job is not in progress',
          error: 'INVALID_STATUS'
        };
      }

      if (data.isApproved) {
        // Approve marking - update job and property
        const [updatedJob, updatedProperty] = await prisma.$transaction([
          prisma.propertyMarkingJob.update({
            where: { id: data.markingJobId },
            data: {
              status: MarkingJobStatus.COMPLETED,
              completedAt: new Date()
            }
          }),
          prisma.property.update({
            where: { id: markingJob.propertyId },
            data: {
              boundaryVerified: true,
              boundaryMarkedBy: markingJob.assignedAgentId,
              boundaryMarkedAt: new Date(),
              boundaryCoordinates: markingJob.boundaryData || undefined
            }
          })
        ]);

        // Notify marking service to release payment to agent
        await this.releasePaymentToAgent(markingJob);

        return {
          success: true,
          markingJob: updatedJob,
          message: 'Marking confirmed successfully'
        };
      } else {
        // Reject marking - provide partial compensation and reset
        await prisma.propertyMarkingJob.update({
          where: { id: data.markingJobId },
          data: {
            status: MarkingJobStatus.CANCELLED,
            completionNotes: data.rejectionReason
          }
        });

        // Notify marking service for partial compensation
        await this.processPartialCompensation(markingJob);

        return {
          success: true,
          message: 'Marking rejected. Agent will receive partial compensation.'
        };
      }
    } catch (error) {
      console.error('Error confirming marking:', error);
      return {
        success: false,
        message: 'Failed to confirm marking',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Release full payment to agent after confirmation
   */
  private async releasePaymentToAgent(markingJob: PropertyMarkingJob): Promise<void> {
    try {
      const agentPayment = Number(markingJob.markingFee) * AGENT_MARKING_PERCENTAGE;
      
      await axios.post(`${MARKING_SERVICE_URL}/api/marking/release-payment`, {
        markingJobId: markingJob.id,
        agentId: markingJob.assignedAgentId,
        amount: agentPayment,
        fullRelease: true
      });
    } catch (error) {
      console.error('Error releasing payment to agent:', error);
    }
  }

  /**
   * Process partial compensation for rejected marking
   */
  private async processPartialCompensation(markingJob: PropertyMarkingJob): Promise<void> {
    try {
      const partialPayment = 1000; // 1,000 Naira partial compensation
      
      await axios.post(`${MARKING_SERVICE_URL}/api/marking/partial-compensation`, {
        markingJobId: markingJob.id,
        agentId: markingJob.assignedAgentId,
        amount: partialPayment
      });
    } catch (error) {
      console.error('Error processing partial compensation:', error);
    }
  }

  /**
   * Get all marking jobs for a property owner
   */
  async getOwnerMarkingJobs(ownerId: string, status?: MarkingJobStatus): Promise<PropertyMarkingJob[]> {
    try {
      const where: any = {
        requestedBy: ownerId
      };

      if (status) {
        where.status = status;
      }

      return await prisma.propertyMarkingJob.findMany({
        where,
        include: {
          property: true,
          assignedAgent: {
            select: {
              id: true,
              name: true,
              phone: true,
              agentReliabilityScore: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error getting owner marking jobs:', error);
      throw error;
    }
  }

  /**
   * Cancel marking job (before assignment or within grace period)
   */
  async cancelMarkingJob(markingJobId: string, userId: string): Promise<MarkingJobResponse> {
    try {
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: { property: true }
      });

      if (!markingJob) {
        return {
          success: false,
          message: 'Marking job not found',
          error: 'JOB_NOT_FOUND'
        };
      }

      if (markingJob.requestedBy !== userId) {
        return {
          success: false,
          message: 'Unauthorized',
          error: 'UNAUTHORIZED'
        };
      }

      // Can only cancel if QUEUED or ASSIGNED (not IN_PROGRESS or COMPLETED)
      if (![MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED].includes(markingJob.status)) {
        return {
          success: false,
          message: 'Cannot cancel marking job in current status',
          error: 'INVALID_STATUS'
        };
      }

      const updatedJob = await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: { status: MarkingJobStatus.CANCELLED }
      });

      // Notify marking service to update queue
      await axios.post(`${MARKING_SERVICE_URL}/api/marking/cancel`, {
        markingJobId
      });

      return {
        success: true,
        markingJob: updatedJob,
        message: 'Marking job cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling marking job:', error);
      return {
        success: false,
        message: 'Failed to cancel marking job',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Handle marking timeout (3-day confirmation window expired)
   */
  async handleMarkingTimeout(markingJobId: string): Promise<void> {
    try {
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId }
      });

      if (!markingJob || markingJob.status !== MarkingJobStatus.IN_PROGRESS) {
        return;
      }

      // Check if confirmation deadline has passed
      if (!markingJob.maxCompletionTime || new Date() < markingJob.maxCompletionTime) {
        return;
      }

      // Process partial compensation cycle
      await this.processPartialCompensation(markingJob);

      // Update job status
      await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          status: MarkingJobStatus.EXPIRED,
          completionNotes: 'Property owner did not confirm within deadline'
        }
      });
    } catch (error) {
      console.error('Error handling marking timeout:', error);
    }
  }

  /**
   * Update property boundary after marking
   */
  async updatePropertyBoundary(
    propertyId: string,
    boundaryData: any,
    markingJobId: string
  ): Promise<Property> {
    try {
      return await prisma.property.update({
        where: { id: propertyId },
        data: {
          boundaryCoordinates: boundaryData,
          boundaryVerified: true,
          boundaryMarkedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating property boundary:', error);
      throw error;
    }
  }
}

export default new PropertyMarkingService();