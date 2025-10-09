// backend/marking-service/src/services/imageUploadService.ts

import { PrismaClient } from '@prisma/client';
import { UTApi } from 'uploadthing/server';

const prisma = new PrismaClient();
const utapi = new UTApi();

interface UploadedImage {
  url: string;
  key: string;
  name: string;
  size: number;
}

interface MarkingImageMetadata {
  markingJobId: string;
  agentId: string;
  capturedAt: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  imageType: 'EXTERIOR' | 'INTERIOR' | 'BOUNDARY' | 'ROOM' | 'FEATURE';
  description?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class ImageUploadService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private readonly MIN_IMAGES_REQUIRED = 5;
  private readonly MAX_IMAGES_PER_JOB = 20;

  /**
   * Validate image file before upload
   */
  private validateImageFile(
    file: File | Buffer,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): ValidationResult {
    const errors: string[] = [];

    // Check file size
    if (fileSize > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      errors.push(`Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Check file name
    if (!fileName || fileName.length === 0) {
      errors.push('File name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Upload marking completion images
   */
  async uploadMarkingImages(
    files: File[],
    metadata: MarkingImageMetadata
  ): Promise<UploadedImage[]> {
    try {
      const { markingJobId, agentId } = metadata;

      // Validate marking job exists and is assigned to agent
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: { property: true }
      });

      if (!markingJob) {
        throw new Error('Marking job not found');
      }

      if (markingJob.assignedAgentId !== agentId) {
        throw new Error('Unauthorized: Agent not assigned to this marking job');
      }

      if (markingJob.status === 'COMPLETED' || markingJob.status === 'CANCELLED') {
        throw new Error(`Cannot upload images for ${markingJob.status.toLowerCase()} job`);
      }

      // Validate number of images
      if (files.length < this.MIN_IMAGES_REQUIRED) {
        throw new Error(`Minimum ${this.MIN_IMAGES_REQUIRED} images required`);
      }

      if (files.length > this.MAX_IMAGES_PER_JOB) {
        throw new Error(`Maximum ${this.MAX_IMAGES_PER_JOB} images allowed per job`);
      }

      // Validate each file
      const validationErrors: string[] = [];
      files.forEach((file, index) => {
        const validation = this.validateImageFile(
          file,
          file.name,
          file.size,
          file.type
        );
        if (!validation.isValid) {
          validationErrors.push(`File ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join('; ')}`);
      }

      // Upload files to UploadThing
      const uploadedFiles = await utapi.uploadFiles(files);

      // Process upload results
      const uploadedImages: UploadedImage[] = [];
      const failedUploads: string[] = [];

      uploadedFiles.forEach((result, index) => {
        if (result.data) {
          uploadedImages.push({
            url: result.data.url,
            key: result.data.key,
            name: result.data.name,
            size: result.data.size
          });
        } else {
          failedUploads.push(`File ${index + 1}: ${result.error?.message || 'Upload failed'}`);
        }
      });

      if (failedUploads.length > 0) {
        throw new Error(`Some uploads failed: ${failedUploads.join('; ')}`);
      }

      // Store image URLs in marking job
      const imageUrls = uploadedImages.map(img => img.url);
      
      await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          completionImages: {
            push: imageUrls
          }
        }
      });

      // Log upload event
      await prisma.eventLog.create({
        data: {
          userId: agentId,
          type: 'MARKING_IMAGES_UPLOADED',
          metadata: {
            markingJobId,
            imageCount: uploadedImages.length,
            totalSize: uploadedImages.reduce((sum, img) => sum + img.size, 0),
            imageType: metadata.imageType
          }
        }
      });

      return uploadedImages;
    } catch (error: any) {
      console.error('Error uploading marking images:', error);
      throw new Error(`Failed to upload marking images: ${error.message}`);
    }
  }

  /**
   * Upload property reference images (provided by property owner)
   */
  async uploadPropertyReferenceImages(
    files: File[],
    propertyId: string,
    userId: string
  ): Promise<UploadedImage[]> {
    try {
      // Validate property ownership
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      if (property.ownerId !== userId) {
        throw new Error('Unauthorized: Not the property owner');
      }

      // Validate files
      const validationErrors: string[] = [];
      files.forEach((file, index) => {
        const validation = this.validateImageFile(
          file,
          file.name,
          file.size,
          file.type
        );
        if (!validation.isValid) {
          validationErrors.push(`File ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join('; ')}`);
      }

      // Upload to UploadThing
      const uploadedFiles = await utapi.uploadFiles(files);

      // Process results
      const uploadedImages: UploadedImage[] = [];
      uploadedFiles.forEach(result => {
        if (result.data) {
          uploadedImages.push({
            url: result.data.url,
            key: result.data.key,
            name: result.data.name,
            size: result.data.size
          });
        }
      });

      // Save to property images
      const imageCreations = uploadedImages.map((img, index) =>
        prisma.propertyImage.create({
          data: {
            propertyId,
            url: img.url,
            altText: `Reference image ${index + 1}`,
            isPrimary: index === 0,
            order: index
          }
        })
      );

      await prisma.$transaction(imageCreations);

      // Log event
      await prisma.eventLog.create({
        data: {
          userId,
          type: 'PROPERTY_REFERENCE_IMAGES_UPLOADED',
          metadata: {
            propertyId,
            imageCount: uploadedImages.length
          }
        }
      });

      return uploadedImages;
    } catch (error: any) {
      console.error('Error uploading reference images:', error);
      throw new Error(`Failed to upload reference images: ${error.message}`);
    }
  }

  /**
   * Delete marking images
   */
  async deleteMarkingImages(
    imageKeys: string[],
    markingJobId: string,
    userId: string
  ): Promise<void> {
    try {
      // Verify ownership
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId }
      });

      if (!markingJob) {
        throw new Error('Marking job not found');
      }

      // Allow deletion by assigned agent or property owner
      if (markingJob.assignedAgentId !== userId && markingJob.requestedBy !== userId) {
        throw new Error('Unauthorized to delete these images');
      }

      // Delete from UploadThing
      await utapi.deleteFiles(imageKeys);

      // Remove URLs from database
      const currentImages = markingJob.completionImages;
      const updatedImages = currentImages.filter(url => {
        const key = url.split('/').pop();
        return !imageKeys.includes(key || '');
      });

      await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          completionImages: updatedImages
        }
      });

      // Log event
      await prisma.eventLog.create({
        data: {
          userId,
          type: 'MARKING_IMAGES_DELETED',
          metadata: {
            markingJobId,
            deletedCount: imageKeys.length
          }
        }
      });
    } catch (error: any) {
      console.error('Error deleting marking images:', error);
      throw new Error(`Failed to delete marking images: ${error.message}`);
    }
  }

  /**
   * Get marking job images
   */
  async getMarkingJobImages(markingJobId: string) {
    try {
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        select: {
          completionImages: true,
          status: true
        }
      });

      if (!markingJob) {
        throw new Error('Marking job not found');
      }

      return {
        images: markingJob.completionImages,
        count: markingJob.completionImages.length,
        status: markingJob.status
      };
    } catch (error: any) {
      console.error('Error fetching marking images:', error);
      throw new Error(`Failed to fetch marking images: ${error.message}`);
    }
  }

  /**
   * Validate minimum images requirement
   */
  async validateMinimumImages(markingJobId: string): Promise<boolean> {
    try {
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        select: { completionImages: true }
      });

      if (!markingJob) {
        return false;
      }

      return markingJob.completionImages.length >= this.MIN_IMAGES_REQUIRED;
    } catch (error: any) {
      console.error('Error validating images:', error);
      return false;
    }
  }

  /**
   * Get image upload statistics for an agent
   */
  async getAgentImageStats(agentId: string) {
    try {
      const completedJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          assignedAgentId: agentId,
          status: 'COMPLETED'
        },
        select: {
          completionImages: true
        }
      });

      const totalImages = completedJobs.reduce(
        (sum, job) => sum + job.completionImages.length,
        0
      );

      return {
        totalJobs: completedJobs.length,
        totalImages,
        averageImagesPerJob: completedJobs.length > 0 
          ? Math.round(totalImages / completedJobs.length) 
          : 0
      };
    } catch (error: any) {
      console.error('Error fetching agent image stats:', error);
      throw new Error(`Failed to fetch agent image stats: ${error.message}`);
    }
  }
}

export default new ImageUploadService();