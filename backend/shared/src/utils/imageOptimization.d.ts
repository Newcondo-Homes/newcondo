export declare const ImageConfig: {
    JPEG_QUALITY: number;
    WEBP_QUALITY: number;
    PNG_QUALITY: number;
    SIZES: {
        THUMBNAIL: {
            width: number;
            height: number;
        };
        SMALL: {
            width: number;
            height: number;
        };
        MEDIUM: {
            width: number;
            height: number;
        };
        LARGE: {
            width: number;
            height: number;
        };
        EXTRA_LARGE: {
            width: number;
            height: number;
        };
        GALLERY_THUMB: {
            width: number;
            height: number;
        };
        GALLERY_PREVIEW: {
            width: number;
            height: number;
        };
        CARD_IMAGE: {
            width: number;
            height: number;
        };
        HERO_IMAGE: {
            width: number;
            height: number;
        };
    };
    SUPPORTED_FORMATS: string[];
    MAX_FILE_SIZE: number;
    MAX_DIMENSION: number;
    WATERMARK: {
        opacity: number;
        position: "bottom-right";
    };
};
export interface ImageMetadata {
    originalName: string;
    size: number;
    width: number;
    height: number;
    format: string;
    aspectRatio: number;
}
export interface ProcessedImage {
    buffer: Buffer;
    metadata: ImageMetadata;
    variants: ProcessedImageVariant[];
}
export interface ProcessedImageVariant {
    size: string;
    buffer: Buffer;
    width: number;
    height: number;
    format: string;
    quality: number;
    fileSize: number;
}
export declare class ImageProcessor {
    /**
     * Process a single image and create multiple size variants
     */
    static processPropertyImage(imageBuffer: Buffer, originalName: string, options?: {
        generateWebP?: boolean;
        sizes?: (keyof typeof ImageConfig.SIZES)[];
        quality?: number;
    }): Promise<ProcessedImage>;
    /**
     * Create a specific image variant
     */
    private static createImageVariant;
    /**
     * Validate image before processing
     */
    private static validateImage;
    /**
     * Generate optimized image for property cards (Airbnb-style)
     */
    static optimizeForPropertyCard(imageBuffer: Buffer, originalName: string): Promise<ProcessedImageVariant[]>;
    /**
     * Create blur placeholder for lazy loading
     */
    static createBlurPlaceholder(imageBuffer: Buffer): Promise<string>;
    /**
     * Extract dominant colors from image (for UI theming)
     */
    static extractDominantColors(imageBuffer: Buffer): Promise<string[]>;
}
export declare class ImageUrlGenerator {
    /**
     * Generate responsive image URLs for different screen sizes
     */
    static generateResponsiveUrls(baseUrl: string, imagePath: string): {
        thumbnail: string;
        small: string;
        medium: string;
        large: string;
        webp: {
            thumbnail: string;
            small: string;
            medium: string;
            large: string;
        };
    };
    /**
     * Generate srcset for responsive images
     */
    static generateSrcSet(urls: ReturnType<typeof ImageUrlGenerator.generateResponsiveUrls>): string;
    /**
     * Generate WebP srcset
     */
    static generateWebPSrcSet(urls: ReturnType<typeof ImageUrlGenerator.generateResponsiveUrls>): string;
}
export declare const ImageOptimizationHelpers: {
    /**
     * Get optimal image size based on viewport
     */
    getOptimalImageSize(viewportWidth: number): keyof typeof ImageConfig.SIZES;
    /**
     * Generate image alt text based on property data
     */
    generateAltText(propertyData: {
        title?: string;
        propertyType?: string;
        city?: string;
        state?: string;
        bedrooms?: number;
        bathrooms?: number;
    }, imageIndex?: number): string;
    /**
     * Calculate image loading priority
     */
    getImageLoadingPriority(index: number, isAboveFold?: boolean): "high" | "low" | "auto";
    /**
     * Determine if image should be lazy loaded
     */
    shouldLazyLoad(index: number, isAboveFold?: boolean): boolean;
};
export default ImageProcessor;
//# sourceMappingURL=imageOptimization.d.ts.map