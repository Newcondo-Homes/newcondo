import { PrismaClient } from '@newcondo/db';
import { uploadToCloudinary, deleteFromCloudinary, optimizeImageUrl } from '../../../shared/src/utils/upload';

const prisma = new PrismaClient();

export interface ImageUploadData {
  file: Buffer;
  filename: string;
  mimetype: string;
  size: number;
}

export interface ImageMetadata {
  url: string;
  altText?: string;
  isPrimary?: boolean;
  order?: number;
}

export class ImageService {
  // Property image management
  async uploadPropertyImages(
    propertyId: string,
    images: ImageUploadData[],
    userId: string
  ): Promise<any[]> {
    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { agentId: userId }
        ]
      }
    });

    if (!property) {
      throw new Error('Property not found or access denied');
    }

    // Check image limits
    const existingImagesCount = await prisma.propertyImage.count({
      where: { propertyId }
    });

    const MAX_IMAGES = 20;
    if (existingImagesCount + images.length > MAX_IMAGES) {
      throw new Error(`Maximum ${MAX_IMAGES} images allowed per property`);
    }

    const uploadPromises = images.map(async (imageData, index) => {
      // Upload to cloud storage
      const uploadResult = await uploadToCloudinary(imageData.file, {
        folder: `properties/${propertyId}`,
        public_id: `${propertyId}_${Date.now()}_${index}`,
        transformation: [
          { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      // Save to database
      const propertyImage = await prisma.propertyImage.create({
        data: {
          propertyId,
          url: uploadResult.secure_url,
          altText: imageData.filename,
          isPrimary: existingImagesCount === 0 && index === 0, // First image of empty property is primary
          order: existingImagesCount + index
        }
      });

      return {
        id: propertyImage.id,
        url: propertyImage.url,
        altText: propertyImage.altText,
        isPrimary: propertyImage.isPrimary,
        order: propertyImage.order,
        createdAt: propertyImage.createdAt
      };
    });

    return Promise.all(uploadPromises);
  }

  async deletePropertyImage(imageId: string, userId: string): Promise<boolean> {
    // Get image with property info
    const image = await prisma.propertyImage.findFirst({
      where: { id: imageId },
      include: {
        property: {
          select: { ownerId: true, agentId: true }
        }
      }
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Verify ownership
    if (image.property.ownerId !== userId && image.property.agentId !== userId) {
      throw new Error('Access denied');
    }

    // Delete from cloud storage
    const publicId = this.extractPublicIdFromUrl(image.url);
    await deleteFromCloudinary(publicId);

    // Delete from database
    await prisma.propertyImage.delete({
      where: { id: imageId }
    });

    // If this was primary image, set another as primary
    if (image.isPrimary) {
      const nextImage = await prisma.propertyImage.findFirst({
        where: {
          propertyId: image.propertyId,
          id: { not: imageId }
        },
        orderBy: { order: 'asc' }
      });

      if (nextImage) {
        await prisma.propertyImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true }
        });
      }
    }

    return true;
  }

  async reorderPropertyImages(
    propertyId: string,
    imageOrders: { imageId: string; order: number }[],
    userId: string
  ): Promise<boolean> {
    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { agentId: userId }
        ]
      }
    });

    if (!property) {
      throw new Error('Property not found or access denied');
    }

    // Update image orders in transaction
    await prisma.$transaction(
      imageOrders.map(({ imageId, order }) =>
        prisma.propertyImage.update({
          where: { id: imageId },
          data: { order }
        })
      )
    );

    return true;
  }

  async setPrimaryImage(imageId: string, userId: string): Promise<boolean> {
    // Get image with property info
    const image = await prisma.propertyImage.findFirst({
      where: { id: imageId },
      include: {
        property: {
          select: { ownerId: true, agentId: true, id: true }
        }
      }
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Verify ownership
    if (image.property.ownerId !== userId && image.property.agentId !== userId) {
      throw new Error('Access denied');
    }

    // Update primary images in transaction
    await prisma.$transaction([
      // Remove primary from all other images
      prisma.propertyImage.updateMany({
        where: {
          propertyId: image.property.id,
          id: { not: imageId }
        },
        data: { isPrimary: false }
      }),
      // Set new primary
      prisma.propertyImage.update({
        where: { id: imageId },
        data: { isPrimary: true }
      })
    ]);

    return true;
  }

  async getPropertyImages(propertyId: string): Promise<any[]> {
    const images = await prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: [
        { isPrimary: 'desc' },
        { order: 'asc' }
      ],
      select: {
        id: true,
        url: true,
        altText: true,
        isPrimary: true,
        order: true,
        createdAt: true
      }
    });

    return images.map(image => ({
      ...image,
      optimizedUrl: optimizeImageUrl(image.url, { width: 400, height: 300 }),
      fullSizeUrl: image.url
    }));
  }

  // Unit image management (for multi-family properties)
  async uploadUnitImages(
    unitId: string,
    images: ImageUploadData[],
    userId: string
  ): Promise<any[]> {
    // Verify unit access through property ownership
    const unit = await prisma.propertyUnit.findFirst({
      where: { id: unitId },
      include: {
        property: {
          select: { ownerId: true, agentId: true, id: true }
        }
      }
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    if (unit.property.ownerId !== userId && unit.property.agentId !== userId) {
      throw new Error('Access denied');
    }

    const existingImagesCount = await prisma.propertyUnitImage.count({
      where: { unitId }
    });

    const MAX_UNIT_IMAGES = 10;
    if (existingImagesCount + images.length > MAX_UNIT_IMAGES) {
      throw new Error(`Maximum ${MAX_UNIT_IMAGES} images allowed per unit`);
    }

    const uploadPromises = images.map(async (imageData, index) => {
      const uploadResult = await uploadToCloudinary(imageData.file, {
        folder: `properties/${unit.property.id}/units/${unitId}`,
        public_id: `${unitId}_${Date.now()}_${index}`,
        transformation: [
          { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      const unitImage = await prisma.propertyUnitImage.create({
        data: {
          unitId,
          url: uploadResult.secure_url,
          altText: imageData.filename,
          isPrimary: existingImagesCount === 0 && index === 0,
          order: existingImagesCount + index
        }
      });

      return {
        id: unitImage.id,
        url: unitImage.url,
        altText: unitImage.altText,
        isPrimary: unitImage.isPrimary,
        order: unitImage.order,
        createdAt: unitImage.createdAt
      };
    });

    return Promise.all(uploadPromises);
  }

  async deleteUnitImage(imageId: string, userId: string): Promise<boolean> {
    const image = await prisma.propertyUnitImage.findFirst({
      where: { id: imageId },
      include: {
        unit: {
          select: {
            property: {
              select: { ownerId: true, agentId: true, id: true }
            }
          }
        }
      }
    });

    if (!image) {
      throw new Error('Unit image not found');
    }

    if (image.unit.property.ownerId !== userId && image.unit.property.agentId !== userId) {
      throw new Error('Access denied');
    }

    const publicId = this.extractPublicIdFromUrl(image.url);
    await deleteFromCloudinary(publicId);

    await prisma.propertyUnitImage.delete({
      where: { id: imageId }
    });

    return true;
  }

  async getUnitImages(unitId: string): Promise<any[]> {
    const images = await prisma.propertyUnitImage.findMany({
      where: { unitId },
      orderBy: [
        { isPrimary: 'desc' },
        { order: 'asc' }
      ],
      select: {
        id: true,
        url: true,
        altText: true,
        isPrimary: true,
        order: true,
        createdAt: true
      }
    });

    return images.map(image => ({
      ...image,
      optimizedUrl: optimizeImageUrl(image.url, { width: 400, height: 300 }),
      fullSizeUrl: image.url
    }));
  }

  // Boundary images for property verification
  async uploadBoundaryImages(
    propertyId: string,
    images: ImageUploadData[],
    userId: string
  ): Promise<string[]> {
    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { agentId: userId }
        ]
      }
    });

    if (!property) {
      throw new Error('Property not found or access denied');
    }

    const uploadPromises = images.map(async (imageData, index) => {
      const uploadResult = await uploadToCloudinary(imageData.file, {
        folder: `properties/${propertyId}/boundary`,
        public_id: `boundary_${propertyId}_${Date.now()}_${index}`,
        transformation: [
          { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      // Save the boundary image URL to the database
      await prisma.propertyBoundaryImage.create({
        data: {
          propertyId,
          url: uploadResult.secure_url,
          order: index,
        }
      });
      return uploadResult.secure_url;
    });

    return Promise.all(uploadPromises);
  }

  // Private helper to extract the public ID from a Cloudinary URL
  private extractPublicIdFromUrl(url: string): string {
    const parts = url.split('/');
    const publicIdWithExtension = parts.pop();
    if (!publicIdWithExtension) {
      throw new Error('Invalid Cloudinary URL');
    }
    const publicId = publicIdWithExtension.split('.')[0];
    const folderPath = parts.slice(parts.indexOf('upload') + 2).join('/');
    return `${folderPath}/${publicId}`;
  }
}
