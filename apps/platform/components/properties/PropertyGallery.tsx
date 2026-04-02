'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Square, Share2, Eye } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Card, CardContent } from '@newcondo/ui/components/card';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { useInView } from 'react-intersection-observer';
import PropertyAvailabilityBadge  from './PropertyAvailabilityBadge';

export interface PropertyCardData {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  status: 'PUBLISHED' | 'RENTED' | 'UNAVAILABLE';
  isAvailable: boolean;
  viewCount: number;
  favoriteCount: number;
  shareableLink?: string;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  totalUnits?: number;
  availableUnits?: number;
  owner: {
    name?: string;
  };
  agent?: {
    name?: string;
  };
}

interface PropertyCardProps {
  property: PropertyCardData;
  onFavorite: (propertyId: string) => void;
  onShare: (property: PropertyCardData) => void;
  isFavorited?: boolean;
  className?: string;
}

const PropertyCard = React.memo(({ 
  property, 
  onFavorite, 
  onShare, 
  isFavorited = false,
  className = "" 
}: PropertyCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const primaryImage = useMemo(() => {
    return property.images?.find(img => img.isPrimary) || property.images?.[0];
  }, [property.images]);

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite(property.id);
  }, [property.id, onFavorite]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare(property);
  }, [property, onShare]);

  const handleImageNavigation = useCallback((direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (property.images && property.images.length > 1) {
      setCurrentImageIndex(prevIndex => {
        if (direction === 'next') {
          return (prevIndex + 1) % property.images.length;
        } else {
          return prevIndex === 0 ? property.images.length - 1 : prevIndex - 1;
        }
      });
    }
  }, [property.images]);

  const formatPrice = useCallback((price: number, currency: string) => {
    if (currency === 'NGN') {
      return `₦${price.toLocaleString()}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  }, []);

  const getDisplayPrice = useMemo(() => {
    if (property.structure === 'MULTI_FAMILY' && property.totalUnits) {
      // For multi-family, show unit range or "From" price
      return `From ${formatPrice(property.price || 0, property.currency)}`;
    }
    return `${formatPrice(property.price || 0, property.currency)}/month`;
  }, [property, formatPrice]);

  const currentImage = property.images?.[currentImageIndex] || primaryImage;

  return (
    <Card ref={ref} className={`group hover:shadow-lg transition-shadow duration-300 ${className}`}>
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
          {/* Image Loading State */}
          {!imageLoaded && inView && (
            <Skeleton className="w-full h-full" />
          )}
          
          {/* Main Image */}
          {currentImage && inView && (
            <Image
              src={currentImage.url}
              alt={currentImage.altText || property.title}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          )}

          {/* Image Error State */}
          {imageError && (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Square className="mx-auto h-12 w-12 mb-2" />
                <p className="text-sm">Image unavailable</p>
              </div>
            </div>
          )}

          {/* Image Navigation */}
          {property.images && property.images.length > 1 && (
            <>
              <button
                onClick={(e) => handleImageNavigation('prev', e)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => handleImageNavigation('next', e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {property.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 rounded-full p-0 bg-white/80 hover:bg-white"
              onClick={handleFavorite}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 rounded-full p-0 bg-white/80 hover:bg-white"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            <PropertyAvailabilityBadge
              status={property.status}
              isAvailable={property.isAvailable}
              structure={property.structure}
              availableUnits={property.availableUnits}
              totalUnits={property.totalUnits}
            />
          </div>
        </div>

        <CardContent className="p-4">
          {/* Price */}
          <div className="flex justify-between items-start mb-2">
            <p className="text-lg font-semibold text-gray-900">
              {getDisplayPrice}
            </p>
            {property.structure === 'MULTI_FAMILY' && property.totalUnits && (
              <Badge variant="outline" className="text-xs">
                {property.availableUnits}/{property.totalUnits} available
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-medium text-gray-900 line-clamp-1 mb-1">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{property.city}, {property.state}</span>
          </div>

          {/* Property Details */}
          {property.structure === 'SINGLE_UNIT' && (
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              {property.bedrooms && (
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center">
                  <Square className="h-4 w-4 mr-1" />
                  <span>{property.area}</span>
                </div>
              )}
            </div>
          )}

          {/* Property Type */}
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="text-xs">
              {property.propertyType.replace('_', ' ')}
            </Badge>
            <div className="flex items-center text-xs text-gray-500 space-x-3">
              <div className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                <span>{property.viewCount}</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-3 w-3 mr-1" />
                <span>{property.favoriteCount}</span>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          {property.features && property.features.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {property.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                  {feature}
                </Badge>
              ))}
              {property.features.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{property.features.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
});

PropertyCard.displayName = 'PropertyCard';

interface PropertyGalleryProps {
  properties: PropertyCardData[];
  loading?: boolean;
  onLoadMore?: () => void;
  onFavorite: (propertyId: string) => void;
  onShare: (property: PropertyCardData) => void;
  hasMore?: boolean;
  favoritedProperties?: string[];
  className?: string;
}

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({
  properties,
  loading = false,
  onLoadMore,
  onFavorite,
  onShare,
  hasMore = false,
  favoritedProperties = [],
  className = ""
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { ref: loadMoreInViewRef, inView: loadMoreInView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (loadMoreInView && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [loadMoreInView, hasMore, loading, onLoadMore]);

  // Skeleton loader for initial load
  const SkeletonCard = () => (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <div className="flex space-x-4 mb-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      {/* Properties Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onFavorite={onFavorite}
            onShare={onShare}
            isFavorited={favoritedProperties.includes(property.id)}
          />
        ))}

        {/* Loading Skeletons */}
        {loading && 
          Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={`skeleton-${index}`} />
          ))
        }
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div 
          ref={(node) => {
            loadMoreRef.current = node;
            loadMoreInViewRef(node);
          }}
          className="mt-8 flex justify-center"
        >
          {loading ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              <span>Loading more properties...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={onLoadMore}
              className="px-8"
            >
              Load More Properties
            </Button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && properties.length === 0 && (
        <div className="text-center py-12">
          <Square className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or browse all available properties.
          </p>
        </div>
      )}
    </div>
  );
};