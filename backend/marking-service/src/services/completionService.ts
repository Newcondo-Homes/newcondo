// backend/marking-service/src/services/completionService.ts

import { PrismaClient } from '@newcondo/db';
import { MarkingJobStatus } from '@newcondo/db';

const prisma = new PrismaClient();

export interface CompletionData {
  jobId: string;
  agentId: string;
  boundaryData: {
    coordinates: Array<{ lat: number; lng: number }>;
    area: number; // square meters
    boundingBox: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  completionImages: string[]; // URLs to photos
  completionNotes?: string;
  verificationPhotos: string[]; // Required verification photos
  accessIssues?: string; // Any access problems encountered
}

export interface CompletionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CompletionService {
  private static readonly MIN_BOUNDARY_POINTS = 4;
  private static readonly MAX_BOUNDARY_POINTS = 50;
  private static readonly MIN_AREA_SQMETERS = 10; // 10 square meters minimum
  private static readonly MAX_AREA_SQMETERS = 10000; // 1 hectare maximum
  private static readonly MIN_PHOTOS_REQUIRED = 3;

  /**
   * Submit job completion data
   */
  static async submitCompletion(completionData: CompletionData): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Validate completion data
      const validation = await this.validateCompletion(completionData);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Check if job exists and is assigned to this agent
      const job = await prisma.propertyMarkingJob.findFirst({
        where: {
          id: completionData.jobId,
          assignedAgentId: completionData.agentId,
          status: {
            in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
          }
        },
        include: {
          property: true
        }
      });

      if (!job) {
        return {
          success: false,
          errors: ['Job not found or not assigned to this agent']
        };
      }

      // Update job with completion data
      await prisma.propertyMarkingJob.update({
        where: { id: completionData.jobId },
        data: {
          status: MarkingJobStatus.COMPLETED,
          completedAt: new Date(),
          completionNotes: completionData.completionNotes,
          completionImages: completionData.completionImages,
          boundaryData: completionData.boundaryData as any
        }
      });

      // Update property with boundary information
      await prisma.property.update({
        where: { id: job.propertyId },
        data: {
          boundaryCoordinates: completionData.boundaryData as any,
          boundaryVerified: true,
          boundaryMarkedBy: completionData.agentId,
          boundaryMarkedAt: new Date(),
          boundaryImages: completionData.completionImages,
          buildingFingerprint: this.generateBuildingFingerprint(completionData.boundaryData)
        }
      });

      // Update agent statistics
      await this.updateAgentStats(completionData.agentId, true);

      // Trigger payment release (if applicable)
      await this.triggerPaymentRelease(completionData.jobId);

      return { success: true };
    } catch (error) {
      console.error('Error submitting completion:', error);
      return {
        success: false,
        errors: ['Failed to submit completion data']
      };
    }
  }

  /**
   * Validate completion data
   */
  static async validateCompletion(data: CompletionData): Promise<CompletionValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate boundary data
    if (!data.boundaryData || !data.boundaryData.coordinates) {
      errors.push('Boundary coordinates are required');
    } else {
      const coords = data.boundaryData.coordinates;
      
      if (coords.length < this.MIN_BOUNDARY_POINTS) {
        errors.push(`Minimum ${this.MIN_BOUNDARY_POINTS} boundary points required`);
      }
      
      if (coords.length > this.MAX_BOUNDARY_POINTS) {
        errors.push(`Maximum ${this.MAX_BOUNDARY_POINTS} boundary points allowed`);
      }
      
      // Validate area
      if (data.boundaryData.area < this.MIN_AREA_SQMETERS) {
        errors.push(`Property area too small (minimum ${this.MIN_AREA_SQMETERS} sqm)`);
      }
      
      if (data.boundaryData.area > this.MAX_AREA_SQMETERS) {
        errors.push(`Property area too large (maximum ${this.MAX_AREA_SQMETERS} sqm)`);
      }

      // Check for valid coordinates
      const invalidCoords = coords.some(coord => 
        !this.isValidCoordinate(coord.lat, coord.lng)
      );
      
      if (invalidCoords) {
        errors.push('Invalid GPS coordinates detected');
      }
    }

    // Validate completion photos
    if (!data.completionImages || data.completionImages.length < this.MIN_PHOTOS_REQUIRED) {
      errors.push(`Minimum ${this.MIN_PHOTOS_REQUIRED} completion photos required`);
    }

    // Validate verification photos
    if (!data.verificationPhotos || data.verificationPhotos.length === 0) {
      errors.push('Verification photos are required');
    }

    // Check for overlapping boundaries with existing properties
    if (data.boundaryData) {
      const overlaps = await this.checkBoundaryOverlaps(data.boundaryData);
      if (overlaps.length > 0) {
        warnings.push(`Potential boundary overlap detected with ${overlaps.length} existing properties`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check for boundary overlaps with existing properties
   */
  private static async checkBoundaryOverlaps(boundaryData: any): Promise<any[]> {
    // Get all properties within the bounding box
    const { north, south, east, west } = boundaryData.boundingBox;
    
    const nearbyProperties = await prisma.property.findMany({
      where: {
        boundaryVerified: true,
        boundaryCoordinates: {
          not: null
        }
      }
    });

    const overlaps: any[] = [];

    // Check each nearby property for overlap
    for (const property of nearbyProperties) {
      if (property.boundaryCoordinates) {
        const overlap = this.calculateBoundaryOverlap(
          boundaryData.coordinates,
          (property.boundaryCoordinates as any).coordinates
        );
        
        if (overlap > 0.1) { // 10% overlap threshold
          overlaps.push({
            propertyId: property.id,
            overlapPercentage: overlap
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * Calculate overlap percentage between two boundary polygons
   */
  private static calculateBoundaryOverlap(coords1: any[], coords2: any[]): number {
    // Simplified overlap calculation
    // In production, use a proper geometric library like turf.js
    
    // For now, check if any points from coords1 are inside coords2
    let overlapCount = 0;
    
    for (const point of coords1) {
      if (this.pointInPolygon(point, coords2)) {
        overlapCount++;
      }
    }
    
    return (overlapCount / coords1.length) * 100;
  }

  /**
   * Check if a point is inside a polygon (simple ray casting algorithm)
   */
  private static pointInPolygon(point: { lat: number; lng: number }, polygon: any[]): boolean {
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Generate building fingerprint for duplicate detection
   */
  private static generateBuildingFingerprint(boundaryData: any): string {
    const coords = boundaryData.coordinates;
    const area = boundaryData.area;
    
    // Create a unique fingerprint based on center point and area
    const centerLat = coords.reduce((sum: number, coord: any) => sum + coord.lat, 0) / coords.length;
    const centerLng = coords.reduce((sum: number, coord: any) => sum + coord.lng, 0) / coords.length;
    
    // Round to reasonable precision
    const roundedLat = Math.round(centerLat * 100000) / 100000;
    const roundedLng = Math.round(centerLng * 100000) / 100000;
    const roundedArea = Math.round(area);
    
    return `${roundedLat}_${roundedLng}_${roundedArea}`;
  }

  /**
   * Update agent completion statistics
   */
  private static async updateAgentStats(agentId: string, completed: boolean): Promise<void> {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        agentReliabilityScore: true
      }
    });

    if (!agent) return;

    const newTotalJobs = agent.totalMarkingJobs + 1;
    const newCompletedJobs = completed ? agent.completedMarkingJobs + 1 : agent.completedMarkingJobs;
    
    // Calculate new reliability score (completion rate)
    const reliabilityScore = newTotalJobs > 0 ? (newCompletedJobs / newTotalJobs) * 5 : 0;

    await prisma.user.update({
      where: { id: agentId },
      data: {
        totalMarkingJobs: newTotalJobs,
        completedMarkingJobs: newCompletedJobs,
        agentReliabilityScore: reliabilityScore
      }
    });
  }

  /**
   * Trigger payment release after successful completion
   */
  private static async triggerPaymentRelease(jobId: string): Promise<void> {
    // Find the associated payment
    const payment = await prisma.payment.findFirst({
      where: {
        markingJobId: jobId
      }
    });

    if (payment && !payment.isReleased) {
      // Release payment after 24-hour hold period
      const releaseTime = new Date(Date.now() + (24 * 60 * 60 * 1000));
      
      // In a real implementation, you'd schedule this for later
      // For now, we'll mark it ready for release
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          confirmationPeriodEnd: releaseTime
        }
      });
    }
  }

  /**
   * Validate GPS coordinates
   */
  private static isValidCoordinate(lat: number, lng: number): boolean {
    // Nigeria bounds approximately
    const NIGERIA_BOUNDS = {
      north: 13.9,
      south: 4.3,
      east: 14.7,
      west: 2.7
    };

    return (
      lat >= NIGERIA_BOUNDS.south &&
      lat <= NIGERIA_BOUNDS.north &&
      lng >= NIGERIA_BOUNDS.west &&
      lng <= NIGERIA_BOUNDS.east
    );
  }

  /**
   * Get completion details for a specific job
   */
  static async getCompletionDetails(jobId: string): Promise<any> {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            boundaryCoordinates: true,
            boundaryImages: true,
            buildingFingerprint: true
          }
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            agentReliabilityScore: true
          }
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      job,
      completionData: job.boundaryData ? {
        coordinates: (job.boundaryData as any).coordinates,
        area: (job.boundaryData as any).area,
        boundingBox: (job.boundaryData as any).boundingBox
      } : null,
      images: job.completionImages,
      notes: job.completionNotes,
      completedAt: job.completedAt,
      agent: job.assignedAgent
    };
  }

  /**
   * Mark job as failed/incomplete
   */
  static async markJobFailed(jobId: string, agentId: string, reason: string): Promise<boolean> {
    try {
      // Verify job ownership
      const job = await prisma.propertyMarkingJob.findFirst({
        where: {
          id: jobId,
          assignedAgentId: agentId
        }
      });

      if (!job) {
        return false;
      }

      // Mark as failed and return to queue
      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          status: MarkingJobStatus.QUEUED,
          assignedAgentId: null,
          assignedAt: null,
          timeSlotExpiry: null,
          completionNotes: `Failed by agent: ${reason}`
        }
      });

      // Update agent stats (failed job)
      await this.updateAgentStats(agentId, false);

      return true;
    } catch (error) {
      console.error('Error marking job as failed:', error);
      return false;
    }
  }

  /**
   * Get agent completion history
   */
  static async getAgentCompletionHistory(agentId: string, limit: number = 20): Promise<any[]> {
    const completedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        status: MarkingJobStatus.COMPLETED
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true
          }
        },
        requestingUser: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: limit
    });

    return completedJobs.map(job => ({
      id: job.id,
      property: job.property,
      requestedBy: job.requestingUser,
      completedAt: job.completedAt,
      markingFee: job.markingFee,
      hasNotes: !!job.completionNotes,
      imageCount: job.completionImages.length
    }));
  }

  /**
   * Generate completion report for property owner
   */
  static async generateCompletionReport(jobId: string): Promise<any> {
    const job = await this.getCompletionDetails(jobId);
    
    if (!job.completionData) {
      throw new Error('Job not completed yet');
    }

    return {
      propertyDetails: {
        title: job.job.property.title,
        address: job.job.property.address,
        markedArea: job.completionData.area,
        boundaryPoints: job.completionData.coordinates.length
      },
      agentDetails: {
        name: job.agent.name,
        reliabilityScore: job.agent.agentReliabilityScore,
        completedAt: job.completedAt
      },
      verification: {
        photoCount: job.images.length,
        buildingFingerprint: job.job.property.buildingFingerprint,
        verificationLevel: this.calculateVerificationLevel(job)
      },
      notes: job.notes || 'No additional notes provided'
    };
  }

  /**
   * Calculate verification level based on completion quality
   */
  private static calculateVerificationLevel(job: any): string {
    let score = 0;
    
    // Photo quality check
    if (job.images.length >= this.MIN_PHOTOS_REQUIRED) score += 1;
    if (job.images.length >= 5) score += 1;
    
    // Boundary quality check
    if (job.completionData && job.completionData.coordinates.length >= 6) score += 1;
    if (job.completionData && job.completionData.area > 50) score += 1;
    
    // Agent reliability
    if (job.agent.agentReliabilityScore >= 4.0) score += 1;
    
    // Notes provided
    if (job.notes && job.notes.length > 50) score += 1;

    if (score >= 5) return 'PREMIUM';
    if (score >= 3) return 'STANDARD';
    return 'BASIC';
  }

  /**
   * Get completion statistics for admin dashboard
   */
  static async getCompletionStats(startDate?: Date, endDate?: Date): Promise<any> {
    const whereClause = startDate && endDate ? {
      completedAt: {
        gte: startDate,
        lte: endDate
      }
    } : {};

    const stats = await prisma.propertyMarkingJob.groupBy({
      by: ['status'],
      where: {
        ...whereClause
      },
      _count: {
        _all: true
      },
      _avg: {
        markingFee: true
      }
    });

    const completedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.COMPLETED,
        ...whereClause
      },
      select: {
        completedAt: true,
        assignedAt: true,
        markingFee: true
      }
    });

    // Calculate average completion time
    const totalCompletionTime = completedJobs.reduce((sum, job) => {
      if (job.completedAt && job.assignedAt) {
        return sum + (job.completedAt.getTime() - job.assignedAt.getTime());
      }
      return sum;
    }, 0);

    const avgCompletionTimeInMinutes = completedJobs.length > 0
      ? (totalCompletionTime / completedJobs.length) / 60000
      : 0;

    // Format stats for easier consumption
    const formattedStats: any = {
      totalJobs: 0,
      completedJobs: 0,
      inProgressJobs: 0,
      queuedJobs: 0,
      avgMarkingFee: 0,
      avgCompletionTimeMinutes: Math.round(avgCompletionTimeInMinutes)
    };

    for (const stat of stats) {
      formattedStats.totalJobs += stat._count._all;
      if (stat.status === MarkingJobStatus.COMPLETED) {
        formattedStats.completedJobs = stat._count._all;
        formattedStats.avgMarkingFee = stat._avg.markingFee || 0;
      } else if (stat.status === MarkingJobStatus.IN_PROGRESS) {
        formattedStats.inProgressJobs = stat._count._all;
      } else if (stat.status === MarkingJobStatus.QUEUED) {
        formattedStats.queuedJobs = stat._count._all;
      }
    }

    return formattedStats;
  }

  /**
   * Get summary of all completed jobs
   */
  static async getCompletedJobSummary(): Promise<any[]> {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.COMPLETED
      },
      include: {
        property: {
          select: {
            title: true,
            address: true
          }
        },
        assignedAgent: {
          select: {
            name: true
          }
        },
        requestingUser: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 50 // Get the 50 most recent completed jobs
    });

    return jobs.map(job => ({
      id: job.id,
      property: job.property,
      agent: job.assignedAgent,
      owner: job.requestingUser,
      completedAt: job.completedAt,
      markingFee: job.markingFee
    }));
  }
}




// import { PrismaClient, MarkingJobStatus, PaymentStatus } from '@prisma/client';
// import { CompensationService } from './compensationService';

// const prisma = new PrismaClient();

// interface CompletionData {
//   boundaryCoordinates: any;
//   completionImages: string[];
//   completionNotes?: string;
// }

// interface ConfirmationResult {
//   isConfirmed: boolean;
//   compensationPaid: boolean;
//   remainingAmount?: number;
// }

// export class CompletionService {
//   private static readonly CONFIRMATION_WINDOW_DAYS = 3;
//   private static readonly INITIAL_COMPENSATION_AMOUNT = 1000; // NGN
//   private static readonly MAX_PARTIAL_PAYMENTS = 5;

//   /**
//    * Submit marking job completion by agent
//    */
//   static async submitCompletion(
//     markingJobId: string,
//     agentId: string,
//     completionData: CompletionData
//   ): Promise<any> {
//     try {
//       // Verify agent is assigned to this job
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: {
//           property: true,
//           requestingUser: true,
//         },
//       });

//       if (!job) {
//         throw new Error('Marking job not found');
//       }

//       if (job.assignedAgentId !== agentId) {
//         throw new Error('Agent not authorized for this job');
//       }

//       if (job.status !== MarkingJobStatus.ASSIGNED && job.status !== MarkingJobStatus.IN_PROGRESS) {
//         throw new Error('Job cannot be completed in current status');
//       }

//       // Validate completion data
//       if (!completionData.boundaryCoordinates || completionData.completionImages.length === 0) {
//         throw new Error('Boundary coordinates and images are required');
//       }

//       // Calculate confirmation deadline
//       const confirmationDeadline = new Date();
//       confirmationDeadline.setDate(confirmationDeadline.getDate() + this.CONFIRMATION_WINDOW_DAYS);

//       // Update marking job
//       const updatedJob = await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           status: MarkingJobStatus.COMPLETED,
//           completedAt: new Date(),
//           completionNotes: completionData.completionNotes,
//           completionImages: completionData.completionImages,
//           boundaryData: completionData.boundaryCoordinates,
//         },
//       });

//       // Update property with boundary data
//       await prisma.property.update({
//         where: { id: job.propertyId },
//         data: {
//           boundaryCoordinates: completionData.boundaryCoordinates,
//           boundaryMarkedBy: agentId,
//           boundaryMarkedAt: new Date(),
//           boundaryImages: completionData.completionImages,
//         },
//       });

//       // Pay initial compensation to agent
//       await CompensationService.payInitialCompensation(markingJobId, agentId);

//       console.log(`Marking job ${markingJobId} completed by agent ${agentId}`);

//       return {
//         success: true,
//         job: updatedJob,
//         confirmationDeadline,
//         message: 'Marking completed. Waiting for property owner confirmation.',
//       };
//     } catch (error) {
//       console.error('Error submitting completion:', error);
//       throw error;
//     }
//   }

//   /**
//    * Property owner confirms marking completion
//    */
//   static async confirmCompletion(
//     markingJobId: string,
//     propertyOwnerId: string,
//     isApproved: boolean,
//     rejectionReason?: string
//   ): Promise<ConfirmationResult> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: {
//           property: true,
//           assignedAgent: true,
//         },
//       });

//       if (!job) {
//         throw new Error('Marking job not found');
//       }

//       if (job.requestedBy !== propertyOwnerId) {
//         throw new Error('Only property owner can confirm completion');
//       }

//       if (job.status !== MarkingJobStatus.COMPLETED) {
//         throw new Error('Job is not in completed status');
//       }

//       if (isApproved) {
//         // Approve and pay remaining compensation
//         await prisma.propertyMarkingJob.update({
//           where: { id: markingJobId },
//           data: {
//             status: MarkingJobStatus.COMPLETED,
//           },
//         });

//         // Update property boundary verification
//         await prisma.property.update({
//           where: { id: job.propertyId },
//           data: {
//             boundaryVerified: true,
//           },
//         });

//         // Pay remaining compensation to agent
//         const remainingPaid = await CompensationService.payRemainingCompensation(
//           markingJobId,
//           job.assignedAgentId!
//         );

//         // Update agent stats
//         await prisma.user.update({
//           where: { id: job.assignedAgentId! },
//           data: {
//             completedMarkingJobs: { increment: 1 },
//             totalMarkingJobs: { increment: 1 },
//           },
//         });

//         console.log(`Marking job ${markingJobId} confirmed and compensation paid`);

//         return {
//           isConfirmed: true,
//           compensationPaid: true,
//           remainingAmount: remainingPaid,
//         };
//       } else {
//         // Rejection - no further payment
//         await prisma.propertyMarkingJob.update({
//           where: { id: markingJobId },
//           data: {
//             status: MarkingJobStatus.CANCELLED,
//             completionNotes: rejectionReason
//               ? `Rejected: ${rejectionReason}`
//               : 'Rejected by property owner',
//           },
//         });

//         console.log(`Marking job ${markingJobId} rejected by property owner`);

//         return {
//           isConfirmed: false,
//           compensationPaid: false,
//         };
//       }
//     } catch (error) {
//       console.error('Error confirming completion:', error);
//       throw error;
//     }
//   }

//   /**
//    * Handle automatic confirmation deadline expiry
//    */
//   static async handleConfirmationExpiry(markingJobId: string): Promise<void> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: {
//           assignedAgent: true,
//         },
//       });

//       if (!job || job.status !== MarkingJobStatus.COMPLETED) {
//         return;
//       }

//       if (!job.completedAt) {
//         return;
//       }

//       const deadlineDate = new Date(job.completedAt);
//       deadlineDate.setDate(deadlineDate.getDate() + this.CONFIRMATION_WINDOW_DAYS);

//       const now = new Date();
//       if (now < deadlineDate) {
//         return; // Not expired yet
//       }

//       // Count partial payments already made
//       const partialPayments = await this.getPartialPaymentCount(markingJobId);

//       if (partialPayments >= this.MAX_PARTIAL_PAYMENTS) {
//         // Max payments reached - close job
//         await prisma.propertyMarkingJob.update({
//           where: { id: markingJobId },
//           data: {
//             status: MarkingJobStatus.EXPIRED,
//           },
//         });

//         console.log(`Marking job ${markingJobId} expired after max partial payments`);
//         return;
//       }

//       // Make partial compensation payment
//       await CompensationService.payPartialCompensation(markingJobId, job.assignedAgentId!);

//       console.log(`Partial compensation paid for job ${markingJobId} (${partialPayments + 1}/${this.MAX_PARTIAL_PAYMENTS})`);
//     } catch (error) {
//       console.error('Error handling confirmation expiry:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get count of partial payments made for a job
//    */
//   private static async getPartialPaymentCount(markingJobId: string): Promise<number> {
//     try {
//       // This would typically be tracked in a separate payment tracking table
//       // For now, we'll use a simple counter in metadata
//       const payments = await prisma.payment.count({
//         where: {
//           markingJobId,
//           description: { contains: 'Partial compensation' },
//         },
//       });

//       return payments;
//     } catch (error) {
//       console.error('Error getting partial payment count:', error);
//       return 0;
//     }
//   }

//   /**
//    * Check all completed jobs for confirmation deadline expiry
//    */
//   static async processExpiringConfirmations(): Promise<number> {
//     try {
//       const expiryDate = new Date();
//       expiryDate.setDate(expiryDate.getDate() - this.CONFIRMATION_WINDOW_DAYS);

//       const expiringJobs = await prisma.propertyMarkingJob.findMany({
//         where: {
//           status: MarkingJobStatus.COMPLETED,
//           completedAt: {
//             lte: expiryDate,
//           },
//         },
//         select: {
//           id: true,
//         },
//       });

//       let processedCount = 0;
//       for (const job of expiringJobs) {
//         try {
//           await this.handleConfirmationExpiry(job.id);
//           processedCount++;
//         } catch (error) {
//           console.error(`Error processing job ${job.id}:`, error);
//         }
//       }

//       console.log(`Processed ${processedCount} expiring confirmation deadlines`);
//       return processedCount;
//     } catch (error) {
//       console.error('Error processing expiring confirmations:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get completion status for a marking job
//    */
//   static async getCompletionStatus(markingJobId: string): Promise<any> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: {
//           property: true,
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//             },
//           },
//         },
//       });

//       if (!job) {
//         throw new Error('Marking job not found');
//       }

//       let confirmationDeadline: Date | null = null;
//       let remainingTime: any = null;

//       if (job.completedAt) {
//         confirmationDeadline = new Date(job.completedAt);
//         confirmationDeadline.setDate(confirmationDeadline.getDate() + this.CONFIRMATION_WINDOW_DAYS);

//         const now = new Date();
//         const diff = confirmationDeadline.getTime() - now.getTime();

//         if (diff > 0) {
//           const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//           const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//           remainingTime = { days, hours };
//         }
//       }

//       const partialPayments = await this.getPartialPaymentCount(markingJobId);

//       return {
//         jobId: markingJobId,
//         status: job.status,
//         completedAt: job.completedAt,
//         confirmationDeadline,
//         remainingTime,
//         partialPaymentsMade: partialPayments,
//         maxPartialPayments: this.MAX_PARTIAL_PAYMENTS,
//         completionImages: job.completionImages,
//         completionNotes: job.completionNotes,
//         boundaryVerified: job.property.boundaryVerified,
//         agent: job.assignedAgent,
//       };
//     } catch (error) {
//       console.error('Error getting completion status:', error);
//       throw error;
//     }
//   }

//   /**
//    * Cancel a marking job before completion
//    */
//   static async cancelJob(
//     markingJobId: string,
//     cancelledBy: string,
//     reason?: string
//   ): Promise<void> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//       });

//       if (!job) {
//         throw new Error('Marking job not found');
//       }

//       if (job.status === MarkingJobStatus.COMPLETED || job.status === MarkingJobStatus.CANCELLED) {
//         throw new Error('Cannot cancel job in current status');
//       }

//       await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           status: MarkingJobStatus.CANCELLED,
//           completionNotes: reason ? `Cancelled: ${reason}` : 'Job cancelled',
//         },
//       });

//       // If payment was made, process refund
//       const payment = await prisma.payment.findFirst({
//         where: {
//           markingJobId,
//           status: PaymentStatus.SUCCESS,
//         },
//       });

//       if (payment) {
//         await prisma.payment.update({
//           where: { id: payment.id },
//           data: {
//             status: PaymentStatus.REFUNDED,
//           },
//         });
//       }

//       console.log(`Marking job ${markingJobId} cancelled by ${cancelledBy}`);
//     } catch (error) {
//       console.error('Error cancelling job:', error);
//       throw error;
//     }
//   }
// }

// export default CompletionService;









// // backend/marking-service/src/services/completionService.ts
// import { prisma } from '@newcondo/db';
// import { MarkingJobStatus, PaymentStatus } from '@prisma/client';
// import { logger } from '../utils/logger';

// interface CompletionResult {
//   jobId: string;
//   status: string;
//   agentCompensation: number;
//   propertyOwnerId: string;
//   notificationSent: boolean;
//   timestamp: Date;
// }

// interface VerificationResult {
//   jobId: string;
//   isVerified: boolean;
//   verifiedAt: Date;
//   agentId: string;
//   remainingBalance: number;
// }

// interface ConfirmationRequest {
//   jobId: string;
//   ownerId: string;
//   isConfirmed: boolean;
//   feedback?: string;
// }

// class CompletionService {
//   private readonly PARTIAL_COMPENSATION = 0.05; // 5% of marking fee for first attempt
//   private readonly AGENT_COMMISSION_PERCENT = 0.25; // 25% of marking fee to agent - NOTE: This isn't used in the provided logic, compensation is based on job.markingFee
//   private readonly CONFIRMATION_DEADLINE_HOURS = 72; // 3 days for owner confirmation

//   /**
//    * Mark a job as completed by agent
//    * Creates partial compensation and waits for owner verification
//    */
//   async markJobAsCompleted(
//     markingJobId: string,
//     agentId: string,
//     completionData: {
//       completionNotes: string;
//       completionImages: string[];
//       boundaryData: Record<string, any>;
//     }
//   ): Promise<CompletionResult> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId },
//         include: { property: true, requestingUser: true, assignedAgent: true },
//       });

//       if (!job) {
//         throw new Error(`Marking job ${markingJobId} not found`);
//       }

//       if (job.assignedAgentId !== agentId) {
//         throw new Error('Agent is not assigned to this job');
//       }

//       // Calculate compensation
//       const partialCompensation = Number(job.markingFee) * this.PARTIAL_COMPENSATION;

//       // Update job to COMPLETED status
//       const completedJob = await prisma.propertyMarkingJob.update({
//         where: { id: markingJobId },
//         data: {
//           status: MarkingJobStatus.COMPLETED,
//           completedAt: new Date(),
//           completionNotes: completionData.completionNotes,
//           completionImages: completionData.completionImages,
//           boundaryData: completionData.boundaryData,
//           timeSlotExpiry: null, // Clear time slot
//         },
//         include: { property: true, requestingUser: true, assignedAgent: true },
//       });

//       // Create partial payment for agent
//       const partialPayment = await prisma.payment.create({
//         data: {
//           userId: agentId,
//           markingJobId: markingJobId,
//           amount: partialCompensation,
//           paymentType: 'PROPERTY_MARKING',
//           status: PaymentStatus.HELD, // Payment held, will be released on owner confirmation
//           description: `Partial compensation for property marking job ${markingJobId}`,
//           confirmationPeriodEnd: new Date(Date.now() + this.CONFIRMATION_DEADLINE_HOURS * 60 * 60 * 1000),
//         },
//       });

//       // Add partial amount to agent's virtual account (but mark as held)
//       await prisma.virtualAccount.update({
//         where: { userId: agentId },
//         data: {
//           balance: {
//             increment: partialCompensation,
//           },
//         },
//       });

//       logger.info(`Marking job ${markingJobId} completed by agent ${agentId}`, {
//         partialCompensation,
//         propertyId: job.propertyId,
//         paymentId: partialPayment.id,
//       });

//       return {
//         jobId: markingJobId,
//         status: 'COMPLETED_AWAITING_VERIFICATION',
//         agentCompensation: partialCompensation,
//         propertyOwnerId: job.requestedBy,
//         notificationSent: true,
//         timestamp: new Date(),
//       };
//     } catch (error) {
//       logger.error('Error marking job as completed', { markingJobId, agentId, error });
//       throw error;
//     }
//   }

//   /**
//    * Owner verifies and confirms the marking job
//    * Releases full payment to agent and completes the job
//    */
//   async verifyAndConfirmMarking(request: ConfirmationRequest): Promise<VerificationResult> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: request.jobId },
//         include: {
//           property: true,
//           requestingUser: true,
//           assignedAgent: true,
//         },
//       });

//       if (!job) {
//         throw new Error(`Marking job ${request.jobId} not found`);
//       }

//       if (job.requestedBy !== request.ownerId) {
//         throw new Error('Only property owner can verify marking');
//       }

//       if (job.status !== MarkingJobStatus.COMPLETED) {
//         throw new Error('Job must be in COMPLETED status to verify');
//       }

//       // Check confirmation deadline (only check if job was completed recently)
//       const deadline = new Date(job.completedAt!.getTime() + this.CONFIRMATION_DEADLINE_HOURS * 60 * 60 * 1000);
//       if (new Date() > deadline) {
//         // Deadline passed - agent gets remaining compensation (even if owner tries to confirm late)
//         // However, since the owner is explicitly confirming/rejecting, we should proceed with their action
//         // UNLESS the job status has already been implicitly changed by a cron job checking deadlines.
//         // Assuming this method is the primary driver and cron job will call handleVerificationDeadlineExpired
//         // if the owner hasn't acted. If the owner acts after the deadline, we treat it as an implicit verification.
//         // For simplicity and to ensure the agent gets paid, we proceed with confirmation logic if it's a confirmation.
//         // If it's a rejection, we check if the job is already resolved and if not, we process the rejection.
//       }

//       if (!request.isConfirmed) {
//         // Owner rejected - job returns to queue
//         return await this.handleVerificationRejection(request.jobId, job.assignedAgentId!, request.feedback);
//       }

//       // Owner confirmed - release full payment to agent
//       const partialAmount = Number(job.markingFee) * this.PARTIAL_COMPENSATION;
//       const remainingAmount = Number(job.markingFee) - partialAmount;

//       // Get partial payment record
//       const partialPayment = await prisma.payment.findFirst({
//         where: {
//           markingJobId: request.jobId,
//           userId: job.assignedAgentId,
//           status: PaymentStatus.HELD,
//         },
//       });

//       // Release the held payment
//       if (partialPayment) {
//         await prisma.payment.update({
//           where: { id: partialPayment.id },
//           data: {
//             status: PaymentStatus.RELEASED,
//             isReleased: true,
//             releasedAt: new Date(),
//           },
//         });
//       } else {
//         // If partial payment isn't HELD (e.g., if it was already released by deadline cron, or never created)
//         // We log a warning but proceed, assuming the balance update below will correct things.
//         logger.warn(`Held payment not found for job ${request.jobId} during owner confirmation. Agent ID: ${job.assignedAgentId}`);
//       }

//       // Create payment for remaining amount
//       const remainingPayment = await prisma.payment.create({
//         data: {
//           userId: job.assignedAgentId!,
//           markingJobId: request.jobId,
//           amount: remainingAmount,
//           paymentType: 'PROPERTY_MARKING',
//           status: PaymentStatus.RELEASED,
//           isReleased: true,
//           releasedAt: new Date(),
//           description: `Final payment on owner confirmation for property marking job ${request.jobId}`,
//         },
//       });

//       // Update agent's virtual account (only increment the remaining amount, as partial was already added as HELD)
//       const updatedVirtualAccount = await prisma.virtualAccount.update({
//         where: { userId: job.assignedAgentId! },
//         data: {
//           balance: {
//             increment: remainingAmount,
//           },
//         },
//       });

//       // Update property with boundary data
//       // Note: We use the boundary data stored on the job which was provided by the agent on completion.
//       await prisma.property.update({
//         where: { id: job.propertyId },
//         data: {
//           boundaryVerified: true,
//           boundaryMarkedBy: job.assignedAgentId,
//           boundaryMarkedAt: new Date(),
//           boundaryCoordinates: job.boundaryData as any, // Cast to any to handle Prisma's JSON type
//           boundaryImages: job.completionImages,
//         },
//       });

//       // Mark job as fully completed (final status)
//       await prisma.propertyMarkingJob.update({
//         where: { id: request.jobId },
//         data: {
//           status: MarkingJobStatus.COMPLETED, // The status remains COMPLETED but the verification process is over
//           verificationConfirmedAt: new Date(),
//           ownerFeedback: request.feedback,
//         },
//       });

//       logger.info(`Marking job ${request.jobId} verified and confirmed by owner ${request.ownerId}`, {
//         agentId: job.assignedAgentId,
//         totalCompensation: Number(job.markingFee),
//         propertyId: job.propertyId,
//       });

//       return {
//         jobId: request.jobId,
//         isVerified: true,
//         verifiedAt: new Date(),
//         agentId: job.assignedAgentId!,
//         remainingBalance: Number(updatedVirtualAccount.balance),
//       };
//     } catch (error) {
//       logger.error('Error verifying and confirming marking', { jobId: request.jobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Handle owner rejection of marking - job returns to queue
//    */
//   private async handleVerificationRejection(
//     jobId: string,
//     agentId: string,
//     rejectionReason?: string
//   ): Promise<VerificationResult> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: { property: true },
//       });

//       if (!job) {
//         throw new Error(`Job ${jobId} not found`);
//       }

//       // Agent keeps the partial compensation already credited (5% penalty for failed attempt)
//       // The HELD payment should remain HELD for now, but since the balance was already incremented,
//       // it means the partial compensation is already in the virtual account.
//       // We should update the HELD payment to RELEASED to formally track that the 5% is permanent,
//       // but no further balance increment is needed.
//       const partialPayment = await prisma.payment.findFirst({
//         where: {
//           markingJobId: jobId,
//           userId: agentId,
//           status: PaymentStatus.HELD,
//         },
//       });

//       if (partialPayment) {
//         await prisma.payment.update({
//           where: { id: partialPayment.id },
//           data: {
//             status: PaymentStatus.RELEASED,
//             isReleased: true,
//             releasedAt: new Date(),
//             description: `Partial compensation retained after owner rejection for job ${jobId}`,
//           },
//         });
//       }

//       // Reset job to QUEUED status
//       await prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           status: MarkingJobStatus.QUEUED,
//           assignedAgentId: null,
//           timeSlotExpiry: null,
//           queuePosition: 1, // Re-queue at the front
//           completionNotes: `Verification rejected by owner. Reason: ${rejectionReason || 'Not provided'}`,
//           rejectionReason: rejectionReason,
//           rejectionCount: {
//             increment: 1,
//           },
//           // Clear completion data to prepare for the next attempt
//           completedAt: null,
//           completionImages: [],
//           boundaryData: null,
//         },
//       });

//       logger.info(`Marking job ${jobId} rejected by owner ${job.requestedBy}`, {
//         agentId,
//         reason: rejectionReason,
//         propertyId: job.propertyId,
//       });

//       // Get current agent's virtual account balance
//       const virtualAccount = await prisma.virtualAccount.findUnique({
//         where: { userId: agentId },
//       });

//       return {
//         jobId,
//         isVerified: false,
//         verifiedAt: new Date(),
//         agentId,
//         remainingBalance: Number(virtualAccount?.balance || 0),
//       };
//     } catch (error) {
//       logger.error('Error handling verification rejection', { jobId, agentId, error });
//       throw error;
//     }
//   }

//   /**
//    * Handle owner verification deadline expiration
//    * Agent receives remaining compensation automatically
//    */
//   private async handleVerificationDeadlineExpired(
//     jobId: string,
//     agentId: string
//   ): Promise<VerificationResult> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: { property: true },
//       });

//       if (!job) {
//         throw new Error(`Job ${jobId} not found`);
//       }

//       // Calculate remaining amount
//       const partialAmount = Number(job.markingFee) * this.PARTIAL_COMPENSATION;
//       const remainingAmount = Number(job.markingFee) - partialAmount;

//       // Release the held payment (Partial Compensation) and find any other payments
//       const payments = await prisma.payment.findMany({
//         where: {
//           markingJobId: jobId,
//           userId: agentId,
//         },
//       });

//       let heldPaymentReleased = false;
//       for (const payment of payments) {
//         if (payment.status === PaymentStatus.HELD) {
//           await prisma.payment.update({
//             where: { id: payment.id },
//             data: {
//               status: PaymentStatus.RELEASED,
//               isReleased: true,
//               releasedAt: new Date(),
//               description: `Partial compensation released on deadline expiration for job ${jobId}`,
//             },
//           });
//           heldPaymentReleased = true;
//           break; // Should only be one HELD payment
//         }
//       }
      
//       if (!heldPaymentReleased) {
//            logger.warn(`Held payment not found for job ${jobId} during deadline expiration. Agent ID: ${agentId}`);
//       }

//       // Create payment for remaining amount due to deadline expiration
//       await prisma.payment.create({
//         data: {
//           userId: agentId,
//           markingJobId: jobId,
//           amount: remainingAmount,
//           paymentType: 'PROPERTY_MARKING',
//           status: PaymentStatus.RELEASED,
//           isReleased: true,
//           releasedAt: new Date(),
//           description: `Deadline compensation (remaining) for property marking job ${jobId} - owner did not confirm within deadline`,
//         },
//       });

//       // Update virtual account (increment remaining amount)
//       const updatedVirtualAccount = await prisma.virtualAccount.update({
//         where: { userId: agentId },
//         data: {
//           balance: {
//             increment: remainingAmount,
//           },
//         },
//       });

//       // Update property with boundary data (same as confirmation)
//       await prisma.property.update({
//         where: { id: job.propertyId },
//         data: {
//           boundaryVerified: true,
//           boundaryMarkedBy: job.assignedAgentId,
//           boundaryMarkedAt: new Date(),
//           boundaryCoordinates: job.boundaryData as any,
//           boundaryImages: job.completionImages,
//         },
//       });

//       // Mark job as fully completed
//       await prisma.propertyMarkingJob.update({
//         where: { id: jobId },
//         data: {
//           status: MarkingJobStatus.COMPLETED,
//           verificationConfirmedAt: new Date(),
//           completionNotes: 'Owner did not verify marking within deadline - agent compensated automatically. Job is considered completed.',
//         },
//       });

//       logger.info(`Marking job ${jobId} deadline expired - agent compensated automatically`, {
//         agentId,
//         compensationAmount: remainingAmount,
//         propertyId: job.propertyId,
//       });

//       return {
//         jobId,
//         isVerified: true, // Job is resolved as verified due to inaction
//         verifiedAt: new Date(),
//         agentId,
//         remainingBalance: Number(updatedVirtualAccount.balance),
//       };
//     } catch (error) {
//       logger.error('Error handling verification deadline expiration', { jobId, agentId, error });
//       throw error;
//     }
//   }

//   /**
//    * Get completion status for a marking job
//    */
//   async getCompletionStatus(jobId: string): Promise<{
//     jobId: string;
//     status: MarkingJobStatus;
//     isCompleted: boolean;
//     completedAt?: Date;
//     verificationDeadline?: Date;
//     agentCompensation: number;
//     remainingCompensation: number;
//   }> {
//     try {
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: jobId },
//         include: {
//           requestingUser: true,
//         },
//       });

//       if (!job) {
//         throw new Error(`Job ${jobId} not found`);
//       }

//       const payments = await prisma.payment.findMany({
//         where: { markingJobId: jobId },
//       });

//       // Sum all HELD and RELEASED payments
//       const agentCompensation = payments
//         .filter((p) => p.status === PaymentStatus.RELEASED || p.status === PaymentStatus.HELD)
//         .reduce((sum, p) => sum + Number(p.amount), 0);

//       const remainingCompensation = Number(job.markingFee) - agentCompensation;

//       const verificationDeadline = job.completedAt
//         ? new Date(job.completedAt.getTime() + this.CONFIRMATION_DEADLINE_HOURS * 60 * 60 * 1000)
//         : undefined;

//       return {
//         jobId,
//         status: job.status,
//         isCompleted: job.status === MarkingJobStatus.COMPLETED,
//         completedAt: job.completedAt || undefined,
//         verificationDeadline,
//         agentCompensation,
//         remainingCompensation: Math.max(0, remainingCompensation),
//       };
//     } catch (error) {
//       logger.error('Error getting completion status', { jobId, error });
//       throw error;
//     }
//   }

//   /**
//    * Get all pending verifications for a property owner
//    */
//   async getPendingVerificationsForOwner(ownerId: string): Promise<any[]> {
//     try {
//       const pendingJobs = await prisma.propertyMarkingJob.findMany({
//         where: {
//           requestedBy: ownerId,
//           // A job is pending verification if it is COMPLETED but the verificationConfirmedAt is null
//           // However, for simplicity and based on the provided partial code, we assume COMPLETED means AWAITING VERIFICATION
//           // But we should filter out jobs that were completed by deadline expiration,
//           // which is tricky without an explicit status.
//           // The safest bet is: status is COMPLETED, and the completion date is within the deadline.
//           // Since the owner can confirm/reject past the deadline, we rely on the status alone.
//           status: MarkingJobStatus.COMPLETED,
//           verificationConfirmedAt: null, // Add this field to distinguish between AWAITING and RESOLVED COMPLETED jobs
//         },
//         include: {
//           property: true,
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               image: true,
//               agentReliabilityScore: true,
//             },
//           },
//         },
//         orderBy: { completedAt: 'desc' },
//       });

//       return pendingJobs.map((job) => ({
//         jobId: job.id,
//         propertyId: job.propertyId,
//         propertyTitle: job.property.title,
//         agentName: job.assignedAgent?.name,
//         agentImage: job.assignedAgent?.image,
//         completedAt: job.completedAt,
//         completionNotes: job.completionNotes,
//         completionImages: job.completionImages,
//         verificationDeadline: job.completedAt
//           ? new Date(job.completedAt.getTime() + this.CONFIRMATION_DEADLINE_HOURS * 60 * 60 * 1000)
//           : undefined,
//         // Calculate remaining time for verification if necessary
//       }));
//     } catch (error) {
//       logger.error('Error getting pending verifications for owner', { ownerId, error });
//       throw error;
//     }
//   }
// }

// export const completionService = new CompletionService();