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
