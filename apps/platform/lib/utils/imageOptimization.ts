// apps/platform/lib/utils/imageOptimization.ts

/**
 * Image optimization utilities for property images
 * Handles responsive images, lazy loading, and caching strategies
 */

export interface ImageDimensions {
  width: number
  height: number
}

export interface OptimizedImageConfig {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  quality?: number
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
}

/**
 * Standard image sizes for property listings
 */
export const IMAGE_SIZES = {
  // Thumbnail sizes
  thumbnail: { width: 150, height: 100 },
  smallThumbnail: { width: 100, height: 67 },
  
  // Card sizes (property grid)
  cardSmall: { width: 300, height: 200 },
  cardMedium: { width: 400, height: 267 },
  cardLarge: { width: 600, height: 400 },
  
  // Detail page sizes
  detailSmall: { width: 800, height: 533 },
  detailMedium: { width: 1200, height: 800 },
  detailLarge: { width: 1600, height: 1067 },
  
  // Hero/banner sizes
  heroSmall: { width: 1024, height: 400 },
  heroMedium: { width: 1440, height: 600 },
  heroLarge: { width: 1920, height: 800 },
} as const

/**
 * Generate responsive image sizes string
 */
export function generateImageSizes(breakpoints: {
  mobile?: string
  tablet?: string
  desktop?: string
  wide?: string
}): string {
  const sizes: string[] = []
  
  if (breakpoints.wide) {
    sizes.push(`(min-width: 1536px) ${breakpoints.wide}`)
  }
  if (breakpoints.desktop) {
    sizes.push(`(min-width: 1024px) ${breakpoints.desktop}`)
  }
  if (breakpoints.tablet) {
    sizes.push(`(min-width: 768px) ${breakpoints.tablet}`)
  }
  if (breakpoints.mobile) {
    sizes.push(breakpoints.mobile)
  }
  
  return sizes.join(', ')
}

/**
 * Standard responsive sizes for different contexts
 */
export const RESPONSIVE_SIZES = {
  // Property card in grid
  propertyCard: generateImageSizes({
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
    wide: '25vw'
  }),
  
  // Property detail hero
  propertyHero: generateImageSizes({
    mobile: '100vw',
    tablet: '100vw',
    desktop: '100vw'
  }),
  
  // Property detail gallery
  propertyGallery: generateImageSizes({
    mobile: '100vw',
    tablet: '80vw',
    desktop: '60vw'
  }),
  
  // Thumbnail in list view
  thumbnail: generateImageSizes({
    mobile: '150px',
    tablet: '200px',
    desktop: '250px'
  })
} as const

/**
 * Generate optimized image URL with transformations
 * Assumes using a service like Cloudinary or similar
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
    crop?: 'fill' | 'fit' | 'scale' | 'crop'
    gravity?: 'auto' | 'center' | 'faces'
  } = {}
): string {
  try {
    const url = new URL(originalUrl)
    
    // Default options
    const {
      width,
      height,
      quality = 85,
      format = 'auto',
      crop = 'fill',
      gravity = 'auto'
    } = options
    
    // If using UploadThing or similar service, construct optimization parameters
    const params = new URLSearchParams()
    
    if (width) params.append('w', width.toString())
    if (height) params.append('h', height.toString())
    params.append('q', quality.toString())
    params.append('f', format)
    params.append('c', crop)
    if (gravity !== 'auto') params.append('g', gravity)
    
    // Add transformation parameters
    url.search = params.toString()
    
    return url.toString()
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn('Failed to optimize image URL:', error)
    return originalUrl
  }
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  originalUrl: string,
  widths: number[] = [400, 800, 1200, 1600, 2000]
): string {
  return widths
    .map(width => `${getOptimizedImageUrl(originalUrl, { width })} ${width}w`)
    .join(', ')
}

/**
 * Generate blur placeholder for images
 */
export function generateBlurDataURL(
  originalUrl: string,
  width = 10,
  height = 6
): string {
  // Generate a very small, low-quality version for blur placeholder
  const blurUrl = getOptimizedImageUrl(originalUrl, {
    width,
    height,
    quality: 10
  })
  
  // Convert to base64 data URL (this would need actual implementation)
  // For now, return the small image URL
  return blurUrl
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, sizes?: string): void {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  if (sizes) link.setAttribute('imagesizes', sizes)
  
  document.head.appendChild(link)
}

/**
 * Lazy load images with Intersection Observer
 */
export function createImageObserver(
  callback: (entry: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }
  
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '100px', // Start loading 100px before image enters viewport
    threshold: 0.1,
    ...options
  }
  
  return new IntersectionObserver(callback, defaultOptions)
}

/**
 * Property-specific image configurations
 */
export function getPropertyImageConfig(
  imageUrl: string,
  context: 'card' | 'hero' | 'gallery' | 'thumbnail',
  isPrimary = false
): OptimizedImageConfig {
  const baseConfig: OptimizedImageConfig = {
    src: imageUrl,
    alt: 'Property image',
    quality: 85,
    placeholder: 'blur' as const,
    blurDataURL: generateBlurDataURL(imageUrl)
  }
  
  switch (context) {
    case 'card':
      return {
        ...baseConfig,
        sizes: RESPONSIVE_SIZES.propertyCard,
        priority: isPrimary,
        fill: true,
        objectFit: 'cover',
        src: getOptimizedImageUrl(imageUrl, {
          width: IMAGE_SIZES.cardMedium.width,
          height: IMAGE_SIZES.cardMedium.height,
          crop: 'fill'
        })
      }
      
    case 'hero':
      return {
        ...baseConfig,
        sizes: RESPONSIVE_SIZES.propertyHero,
        priority: true,
        fill: true,
        objectFit: 'cover',
        src: getOptimizedImageUrl(imageUrl, {
          width: IMAGE_SIZES.heroLarge.width,
          height: IMAGE_SIZES.heroLarge.height,
          crop: 'fill'
        })
      }
      
    case 'gallery':
      return {
        ...baseConfig,
        sizes: RESPONSIVE_SIZES.propertyGallery,
        priority: isPrimary,
        fill: true,
        objectFit: 'cover',
        src: getOptimizedImageUrl(imageUrl, {
          width: IMAGE_SIZES.detailMedium.width,
          height: IMAGE_SIZES.detailMedium.height,
          crop: 'fill'
        })
      }
      
    case 'thumbnail':
      return {
        ...baseConfig,
        sizes: RESPONSIVE_SIZES.thumbnail,
        priority: false,
        objectFit: 'cover',
        src: getOptimizedImageUrl(imageUrl, {
          width: IMAGE_SIZES.thumbnail.width,
          height: IMAGE_SIZES.thumbnail.height,
          crop: 'fill'
        })
      }
      
    default:
      return baseConfig
  }
}

/**
 * Cache image in browser
 */
export function cacheImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Prefetch property images for better UX
 */
export async function prefetchPropertyImages(
  imageUrls: string[],
  priority: 'high' | 'low' = 'low'
): Promise<void> {
  if (typeof window === 'undefined') return
  
  // Limit concurrent prefetch operations
  const maxConcurrent = priority === 'high' ? 4 : 2
  const chunks = []
  
  for (let i = 0; i < imageUrls.length; i += maxConcurrent) {
    chunks.push(imageUrls.slice(i, i + maxConcurrent))
  }
  
  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(url => cacheImage(getOptimizedImageUrl(url, { quality: 70 })))
    )
  }
}

/**
 * Image loading states for UI feedback
 */
export type ImageLoadingState = 'loading' | 'loaded' | 'error'

/**
 * Hook-like function to track image loading state
 */
export function createImageLoader(onStateChange: (state: ImageLoadingState) => void) {
  return {
    onLoad: () => onStateChange('loaded'),
    onError: () => onStateChange('error'),
    onLoadStart: () => onStateChange('loading')
  }
}

/**
 * Validate image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
    const pathname = urlObj.pathname.toLowerCase()
    
    return validExtensions.some(ext => pathname.endsWith(ext)) ||
           pathname.includes('/image/') ||
           urlObj.hostname.includes('cloudinary') ||
           urlObj.hostname.includes('uploadthing')
  } catch {
    return false
  }
}

/**
 * Default fallback images
 */
export const FALLBACK_IMAGES = {
  property: '/images/placeholders/property-placeholder.jpg',
  propertyHero: '/images/placeholders/property-hero-placeholder.jpg',
  propertyThumbnail: '/images/placeholders/property-thumbnail-placeholder.jpg',
  user: '/images/placeholders/user-placeholder.jpg'
} as const

/**
 * Get fallback image based on context
 */
export function getFallbackImage(context: keyof typeof FALLBACK_IMAGES): string {
  return FALLBACK_IMAGES[context]
}