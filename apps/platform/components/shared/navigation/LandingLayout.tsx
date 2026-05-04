'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'
import { Heart, MapPin, Bed, Bath, Square, Share2, Eye } from 'lucide-react'
import { Button } from '@newcondo/ui'
import { cn } from '@/lib/utils'

// Import components (these will be created later)
import Navbar from '../navigation/Navbar'
import SearchBox from '../navigation/SearchBox'
import Footer from '../navigation/Footer'
import {LoadingSpinner} from '../feedback/LoadingSpinner'
import {EmptyState} from '../feedback/EmptyState'

// Types
interface PropertyImage {
  id: string
  url: string
  altText?: string
  isPrimary: boolean
}

interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: string
  address: string
  city: string
  state: string
  propertyType: string
  bedrooms?: number
  bathrooms?: number
  area?: string
  features: string[]
  images: PropertyImage[]
  isAvailable: boolean
  viewCount: number
  favoriteCount: number
  boundaryVerified: boolean
}

interface SearchFilters {
  query?: string
  city?: string
  state?: string
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
}

// Property Card Component with optimized image loading
const PropertyCard: React.FC<{ 
  property: Property
  onFavorite: (propertyId: string) => void
  isFavorited: boolean
  priority?: boolean
}> = ({ property, onFavorite, isFavorited, priority = false }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const router = useRouter()

  const primaryImage = property.images.find(img => img.isPrimary) || property.images[0]

  const handlePropertyClick = () => {
    router.push(`/properties/${property.id}`)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavorite(property.id)
  }

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title}`,
          url: `${window.location.origin}/properties/${property.id}`,
        })
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${window.location.origin}/properties/${property.id}`)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/properties/${property.id}`)
    }
  }

  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
      onClick={handlePropertyClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}
        
        {primaryImage && !imageError ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText || property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className={cn(
              "object-cover group-hover:scale-105 transition-transform duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            priority={priority}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <Square className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Status Badge */}
        {!property.isAvailable && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
            Unavailable
          </div>
        )}

        {property.boundaryVerified && (
          <div className="absolute top-3 right-14 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
            Verified
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="bg-white/90 hover:bg-white h-8 w-8 p-0"
            onClick={handleShareClick}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0",
              isFavorited 
                ? "bg-red-50 hover:bg-red-100 text-red-500" 
                : "bg-white/90 hover:bg-white"
            )}
            onClick={handleFavoriteClick}
          >
            <Heart 
              className={cn(
                "w-4 h-4",
                isFavorited && "fill-current"
              )} 
            />
          </Button>
        </div>

        {/* Image Count */}
        {property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs">
            1/{property.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-1 text-gray-600 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm truncate">{property.city}, {property.state}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-5">
          {property.title}
        </h3>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span>{property.area}</span>
            </div>
          )}
        </div>

        {/* Price & Stats */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ₦{property.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-600 ml-1">
              /{property.propertyType === 'ROOM' ? 'month' : 'year'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Eye className="w-3 h-3" />
            <span>{property.viewCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Property Skeleton Component
const PropertyCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
    <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="flex gap-4 mb-3">
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="flex justify-between">
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  </div>
)

// Main Landing Layout Component
const LandingLayout: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<SearchFilters>({})
  
  const searchParams = useSearchParams()

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Load properties function with caching
  const loadProperties = useCallback(async (pageNum: number = 1, searchFilters: SearchFilters = {}) => {
    try {
      setLoading(true)
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      queryParams.append('page', pageNum.toString())
      queryParams.append('limit', '48') // 6 columns × 8 rows
      
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      // Check cache first (implement your caching strategy)
      const cacheKey = `properties_${queryParams.toString()}`
      const cachedData = sessionStorage.getItem(cacheKey)
      
      if (cachedData && pageNum === 1) {
        const parsed = JSON.parse(cachedData)
        setProperties(parsed.properties)
        setHasMore(parsed.hasMore)
        setLoading(false)
        return
      }

      const response = await fetch(`/api/properties?${queryParams}`)
      const data = await response.json()

      if (pageNum === 1) {
        setProperties(data.properties)
        // Cache first page results
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
      } else {
        setProperties(prev => [...prev, ...data.properties])
      }
      
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load more properties for infinite scroll
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    
    const nextPage = page + 1
    setPage(nextPage)
    await loadProperties(nextPage, filters)
  }, [hasMore, loading, page, filters, loadProperties])

  // Handle search/filter changes
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
    setPage(1)
    setProperties([])
    loadProperties(1, newFilters)
    
    // Update URL without page reload
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/'
    window.history.pushState({}, '', newUrl)
  }, [loadProperties])

  // Toggle favorite
  const handleFavorite = useCallback((propertyId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId)
      } else {
        newFavorites.add(propertyId)
      }
      // Persist to localStorage
      localStorage.setItem('favorites', JSON.stringify([...newFavorites]))
      return newFavorites
    })
  }, [])

  // Load initial data and favorites
  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }

    // Parse initial filters from URL
    const initialFilters: SearchFilters = {}
    searchParams.forEach((value, key) => {
      if (['minPrice', 'maxPrice', 'bedrooms', 'bathrooms'].includes(key)) {
        const numericKey = key as 'minPrice' | 'maxPrice' | 'bedrooms' | 'bathrooms';
        initialFilters[numericKey] = parseInt(value)
      } else {
        const stringKey = key as 'query' | 'city' | 'state' | 'propertyType';
        initialFilters[stringKey] = value 
      }
    })

    setFilters(initialFilters)
    loadProperties(1, initialFilters)
  }, [searchParams, loadProperties])

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasMore && !loading && properties.length > 0) {
      loadMore()
    }
  }, [inView, hasMore, loading, properties.length, loadMore])

  // Memoized property grid
  const propertyGrid = useMemo(() => {
    return properties.map((property, index) => (
      <PropertyCard
        key={property.id}
        property={property}
        onFavorite={handleFavorite}
        isFavorited={favorites.has(property.id)}
        priority={index < 12} // First 12 images get priority loading
      />
    ))
  }, [properties, favorites, handleFavorite])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />
      
      {/* Search Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <SearchBox 
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && properties.length === 0 ? (
          // Initial loading state
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
            {Array.from({ length: 48 }).map((_, index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          // Empty state
          <EmptyState 
            title="No properties found"
            description="Try adjusting your search filters to find more properties."
          />
        ) : (
          <>
            {/* Properties Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {properties.length} properties found
              </p>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
              {propertyGrid}
            </div>

            {/* Load More Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center mt-8">
                {loading && <LoadingSpinner />}
              </div>
            )}

            {/* End Message */}
            {!hasMore && properties.length > 0 && (
              <div className="text-center mt-12 py-8 border-t border-gray-200">
                <p className="text-gray-500">
                  You&apos;ve reached the end of our property listings
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default LandingLayout