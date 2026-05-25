"use strict";
// backend/shared/src/utils/imageOptimization.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageOptimizationHelpers = exports.ImageUrlGenerator = exports.ImageProcessor = exports.ImageConfig = void 0;
const sharp_1 = __importDefault(require("sharp"));
// Image processing configuration
exports.ImageConfig = {
    // Quality settings
    JPEG_QUALITY: 85,
    WEBP_QUALITY: 85,
    PNG_QUALITY: 90,
    // Size presets for property images
    SIZES: {
        THUMBNAIL: { width: 300, height: 200 },
        SMALL: { width: 600, height: 400 },
        MEDIUM: { width: 900, height: 600 },
        LARGE: { width: 1200, height: 800 },
        EXTRA_LARGE: { width: 1800, height: 1200 },
        // Gallery specific sizes
        GALLERY_THUMB: { width: 150, height: 100 },
        GALLERY_PREVIEW: { width: 800, height: 533 },
        // Card display sizes
        CARD_IMAGE: { width: 400, height: 267 },
        HERO_IMAGE: { width: 1920, height: 1080 },
    },
    // Supported formats
    SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    // File size limits (in bytes)
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_DIMENSION: 4000, // Max width or height
    // Watermark settings (for future use)
    WATERMARK: {
        opacity: 0.3,
        position: 'bottom-right',
    }
};
// Image processing class
class ImageProcessor {
    /**
     * Process a single image and create multiple size variants
     */
    static async processPropertyImage(imageBuffer, originalName, options = {}) {
        const { generateWebP = true, sizes = ['THUMBNAIL', 'SMALL', 'MEDIUM', 'LARGE'], quality = exports.ImageConfig.JPEG_QUALITY } = options;
        try {
            // Get original image metadata
            const sharpImage = (0, sharp_1.default)(imageBuffer);
            const originalMetadata = await sharpImage.metadata();
            if (!originalMetadata.width || !originalMetadata.height) {
                throw new Error('Unable to determine image dimensions');
            }
            // Validate image
            this.validateImage(originalMetadata, imageBuffer.length, originalName);
            const metadata = {
                originalName,
                size: imageBuffer.length,
                width: originalMetadata.width,
                height: originalMetadata.height,
                format: originalMetadata.format || 'jpeg',
                aspectRatio: originalMetadata.width / originalMetadata.height
            };
            // Create variants
            const variants = [];
            for (const sizeKey of sizes) {
                const sizeConfig = exports.ImageConfig.SIZES[sizeKey];
                // Create JPEG/PNG variant
                const processedVariant = await this.createImageVariant(sharpImage, sizeConfig, 'jpeg', quality);
                variants.push({
                    size: sizeKey.toLowerCase(),
                    ...processedVariant
                });
                // Create WebP variant if requested
                if (generateWebP) {
                    const webpVariant = await this.createImageVariant(sharpImage, sizeConfig, 'webp', exports.ImageConfig.WEBP_QUALITY);
                    variants.push({
                        size: `${sizeKey.toLowerCase()}_webp`,
                        ...webpVariant
                    });
                }
            }
            return {
                buffer: imageBuffer,
                metadata,
                variants
            };
        }
        catch (error) {
            console.error('Image processing error:', error);
            throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a specific image variant
     */
    static async createImageVariant(sharpImage, sizeConfig, format, quality) {
        let processedImage = sharpImage
            .clone()
            .resize(sizeConfig.width, sizeConfig.height, {
            fit: 'cover',
            position: 'center'
        });
        // Apply format-specific settings
        switch (format) {
            case 'jpeg':
                processedImage = processedImage.jpeg({
                    quality,
                    progressive: true,
                    mozjpeg: true
                });
                break;
            case 'webp':
                processedImage = processedImage.webp({
                    quality,
                    effort: 6
                });
                break;
            case 'png':
                processedImage = processedImage.png({
                    quality,
                    compressionLevel: 8
                });
                break;
        }
        const buffer = await processedImage.toBuffer();
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        return {
            buffer,
            width: metadata.width,
            height: metadata.height,
            format,
            quality,
            fileSize: buffer.length
        };
    }
    /**
     * Validate image before processing
     */
    static validateImage(metadata, fileSize, fileName) {
        // Check file size
        if (fileSize > exports.ImageConfig.MAX_FILE_SIZE) {
            throw new Error(`File size too large. Maximum allowed: ${exports.ImageConfig.MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }
        // Check dimensions
        if (!metadata.width || !metadata.height) {
            throw new Error('Invalid image: Unable to determine dimensions');
        }
        if (metadata.width > exports.ImageConfig.MAX_DIMENSION || metadata.height > exports.ImageConfig.MAX_DIMENSION) {
            throw new Error(`Image dimensions too large. Maximum: ${exports.ImageConfig.MAX_DIMENSION}px`);
        }
        // Check format
        if (metadata.format && !exports.ImageConfig.SUPPORTED_FORMATS.includes(metadata.format)) {
            throw new Error(`Unsupported image format: ${metadata.format}`);
        }
        // Check aspect ratio (prevent extremely wide/tall images)
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio > 3 || aspectRatio < 0.33) {
            throw new Error('Invalid aspect ratio. Images should be between 1:3 and 3:1 ratio');
        }
    }
    /**
     * Generate optimized image for property cards (Airbnb-style)
     */
    static async optimizeForPropertyCard(imageBuffer, originalName) {
        const variants = [];
        const sharpImage = (0, sharp_1.default)(imageBuffer);
        // Card image (main display)
        const cardVariant = await this.createImageVariant(sharpImage, exports.ImageConfig.SIZES.CARD_IMAGE, 'webp', exports.ImageConfig.WEBP_QUALITY);
        variants.push({
            size: 'card',
            ...cardVariant
        });
        // Thumbnail for lazy loading placeholder
        const thumbnailVariant = await this.createImageVariant(sharpImage, exports.ImageConfig.SIZES.THUMBNAIL, 'webp', 60 // Lower quality for thumbnails
        );
        variants.push({
            size: 'thumbnail',
            ...thumbnailVariant
        });
        return variants;
    }
    /**
     * Create blur placeholder for lazy loading
     */
    static async createBlurPlaceholder(imageBuffer) {
        try {
            const placeholder = await (0, sharp_1.default)(imageBuffer)
                .resize(20, 13, { fit: 'cover' })
                .blur(2)
                .jpeg({ quality: 20 })
                .toBuffer();
            return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
        }
        catch (error) {
            console.error('Error creating blur placeholder:', error);
            // Return a default placeholder
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTMiIHZpZXdCb3g9IjAgMCAyMCAxMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTMiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=';
        }
    }
    /**
     * Extract dominant colors from image (for UI theming)
     */
    static async extractDominantColors(imageBuffer) {
        try {
            // const {  } = await sharp(imageBuffer)
            //   .resize(100, 100, { fit: 'cover' })
            //   .raw()
            //   .toBuffer({ resolveWithObject: true });
            // Simple color extraction (you might want to use a more sophisticated library like node-vibrant)
            const colors = [];
            // This is a simplified implementation
            // In production, you'd want to use a proper color quantization algorithm
            const r = Math.round(Math.random() * 255);
            const g = Math.round(Math.random() * 255);
            const b = Math.round(Math.random() * 255);
            colors.push(`rgb(${r}, ${g}, ${b})`);
            return colors;
        }
        catch (error) {
            console.error('Error extracting colors:', error);
            return ['#f3f4f6']; // Default gray
        }
    }
}
exports.ImageProcessor = ImageProcessor;
// Image URL generation helpers
class ImageUrlGenerator {
    /**
     * Generate responsive image URLs for different screen sizes
     */
    static generateResponsiveUrls(baseUrl, imagePath) {
        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return {
            thumbnail: `${baseUrl}/images/thumbnail/${cleanPath}`,
            small: `${baseUrl}/images/small/${cleanPath}`,
            medium: `${baseUrl}/images/medium/${cleanPath}`,
            large: `${baseUrl}/images/large/${cleanPath}`,
            webp: {
                thumbnail: `${baseUrl}/images/thumbnail_webp/${cleanPath}`,
                small: `${baseUrl}/images/small_webp/${cleanPath}`,
                medium: `${baseUrl}/images/medium_webp/${cleanPath}`,
                large: `${baseUrl}/images/large_webp/${cleanPath}`,
            }
        };
    }
    /**
     * Generate srcset for responsive images
     */
    static generateSrcSet(urls) {
        return [
            `${urls.small} 600w`,
            `${urls.medium} 900w`,
            `${urls.large} 1200w`,
        ].join(', ');
    }
    /**
     * Generate WebP srcset
     */
    static generateWebPSrcSet(urls) {
        return [
            `${urls.webp.small} 600w`,
            `${urls.webp.medium} 900w`,
            `${urls.webp.large} 1200w`,
        ].join(', ');
    }
}
exports.ImageUrlGenerator = ImageUrlGenerator;
// Image optimization middleware helpers
exports.ImageOptimizationHelpers = {
    /**
     * Get optimal image size based on viewport
     */
    getOptimalImageSize(viewportWidth) {
        if (viewportWidth <= 480)
            return 'SMALL';
        if (viewportWidth <= 768)
            return 'MEDIUM';
        if (viewportWidth <= 1200)
            return 'LARGE';
        return 'EXTRA_LARGE';
    },
    /**
     * Generate image alt text based on property data
     */
    generateAltText(propertyData, imageIndex = 0) {
        const { title, propertyType, city, state, bedrooms, bathrooms } = propertyData;
        let altText = '';
        if (title) {
            altText = `${title}`;
        }
        else {
            altText = `${propertyType || 'Property'}`;
            if (bedrooms)
                altText += ` with ${bedrooms} bedroom${bedrooms > 1 ? 's' : ''}`;
            if (bathrooms)
                altText += ` and ${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}`;
        }
        if (city && state) {
            altText += ` in ${city}, ${state}`;
        }
        if (imageIndex > 0) {
            altText += ` - Image ${imageIndex + 1}`;
        }
        return altText;
    },
    /**
     * Calculate image loading priority
     */
    getImageLoadingPriority(index, isAboveFold = false) {
        if (isAboveFold && index === 0)
            return 'high';
        if (index < 6)
            return 'auto'; // First 6 images (first row in grid)
        return 'low';
    },
    /**
     * Determine if image should be lazy loaded
     */
    shouldLazyLoad(index, isAboveFold = false) {
        if (isAboveFold && index < 6)
            return false; // Don't lazy load first row
        return index >= 6; // Lazy load everything after first row
    }
};
exports.default = ImageProcessor;
//# sourceMappingURL=imageOptimization.js.map