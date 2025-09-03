// backend/property-service/src/controllers/imageController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@newcondo/db';
import { ImageService } from '../services/imageService';
import {
  ImageUploadRequest,
  ImageUpdateRequest,
  ImageDeleteRequest,
  ImageReorderRequest
} from '../types/image';

const prisma = new PrismaClient();
const imageService = new ImageService();

export class ImageController {
  /**
   * Upload property images
   */
  static async uploadPropertyImages(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const uploadData = req.body as ImageUploadRequest;

      // Validate upload data
      if (!uploadData.images || uploadData.images.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images provided'
        });
      }

      const uploadedImages = await imageService.uploadPropertyImages(
        propertyId,
        uploadData.images,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Images uploaded successfully',
        data: {
          images: uploadedImages
        }
      });

    } catch (error: any) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload images'
      });
    }
  }

  /**
   * Upload property unit images
   */
  static async uploadUnitImages(req: Request, res: Response) {
    try {
      const { unitId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const uploadData = req.body as ImageUploadRequest;

      if (!uploadData.images || uploadData.images.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images provided'
        });
      }

      const uploadedImages = await imageService.uploadUnitImages(
        unitId,
        uploadData.images,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Unit images uploaded successfully',
        data: {
          images: uploadedImages
        }
      });

    } catch (error: any) {
      console.error('Unit image upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload unit images'
      });
    }
  }

  /**
   * Upload boundary images for a property
   */
  static async uploadBoundaryImages(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const uploadData = req.body as ImageUploadRequest;

      if (!uploadData.images || uploadData.images.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images provided'
        });
      }

      const uploadedUrls = await imageService.uploadBoundaryImages(
        propertyId,
        uploadData.images,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Boundary images uploaded successfully',
        data: {
          urls: uploadedUrls
        }
      });

    } catch (error: any) {
      console.error('Boundary image upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload boundary images'
      });
    }
  }

  /**
   * Get property images
   */
  static async getPropertyImages(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const images = await imageService.getPropertyImages(propertyId);

      res.json({
        success: true,
        data: {
          images
        }
      });

    } catch (error: any) {
      console.error('Get property images error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get property images'
      });
    }
  }

  /**
   * Get unit images
   */
  static async getUnitImages(req: Request, res: Response) {
    try {
      const { unitId } = req.params;
      const images = await imageService.getUnitImages(unitId);

      res.json({
        success: true,
        data: {
          images
        }
      });

    } catch (error: any) {
      console.error('Get unit images error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get unit images'
      });
    }
  }

  /**
   * Update property image
   */
  static async updatePropertyImage(req: Request, res: Response) {
    try {
      const { imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const updateData = req.body as ImageUpdateRequest;

      // Note: This assumes an update method exists in ImageService
      // and passes userId for ownership validation within the service.
      // const updatedImage = await imageService.updatePropertyImage(imageId, updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Image updated successfully (mocked)', // Mocked response as service method is not implemented
        data: {
          image: { id: imageId, ...updateData }
        }
      });

    } catch (error: any) {
      console.error('Update property image error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update image'
      });
    }
  }

  /**
   * Update unit image
   */
  static async updateUnitImage(req: Request, res: Response) {
    try {
      const { imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const updateData = req.body as ImageUpdateRequest;

      // Note: This assumes an update method exists in ImageService
      // and passes userId for ownership validation within the service.
      // const updatedImage = await imageService.updateUnitImage(imageId, updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Unit image updated successfully (mocked)', // Mocked response as service method is not implemented
        data: {
          image: { id: imageId, ...updateData }
        }
      });

    } catch (error: any) {
      console.error('Update unit image error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update unit image'
      });
    }
  }

  /**
   * Delete property image
   */
  static async deletePropertyImage(req: Request, res: Response) {
    try {
      const { imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      await imageService.deletePropertyImage(imageId, userId);

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });

    } catch (error: any) {
      console.error('Delete property image error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete image'
      });
    }
  }

  /**
   * Delete unit image
   */
  static async deleteUnitImage(req: Request, res: Response) {
    try {
      const { imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      await imageService.deleteUnitImage(imageId, userId);

      res.json({
        success: true,
        message: 'Unit image deleted successfully'
      });

    } catch (error: any) {
      console.error('Delete unit image error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete unit image'
      });
    }
  }

  /**
   * Reorder property images
   */
  static async reorderPropertyImages(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { imageOrders } = req.body as ImageReorderRequest;

      await imageService.reorderPropertyImages(propertyId, imageOrders, userId);

      res.json({
        success: true,
        message: 'Images reordered successfully'
      });

    } catch (error: any) {
      console.error('Reorder property images error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reorder images'
      });
    }
  }

  /**
   * Set primary property image
   */
  static async setPrimaryPropertyImage(req: Request, res: Response) {
    try {
      const { imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      await imageService.setPrimaryImage(imageId, userId);

      res.json({
        success: true,
        message: 'Primary image set successfully'
      });

    } catch (error: any) {
      console.error('Set primary image error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set primary image'
      });
    }
  }

  /**
   * Set primary unit image
   */
  static async setPrimaryUnitImage(req: Request, res: Response) {
    try {
      const { imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // This assumes a setPrimaryUnitImage method exists in the service
      await imageService.setPrimaryImage(imageId, userId);

      res.json({
        success: true,
        message: 'Primary unit image set successfully'
      });

    } catch (error: any) {
      console.error('Set primary unit image error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set primary unit image'
      });
    }
  }
}
