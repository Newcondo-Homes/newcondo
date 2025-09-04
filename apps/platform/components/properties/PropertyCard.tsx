'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Square, Share2, CheckSquare } from 'lucide-react';
import { Button } from '@newcondo/ui/components/ui/button';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { cn } from '@newcondo/ui/lib/utils';
import PropertyAvailabilityBadge from './PropertyAvailabilityBadge';
import PropertyShare from './PropertyShare';
import { Property } from '@/types/api';
import { usePropertyStore } from '@/store/propertyStore';

interface PropertyCardProps {
  property: Property;
  showComparison?: boolean;
  isSelected?: boolean;
  onToggleComparison?: () => void;
  className?: string;
  priority?: boolean; // For above-the-fold images
}

const PropertyCard = memo(function PropertyCard({
  property,
  showComparison = false,
  isSelected = false,
  onToggleComparison,
  className,
  priority = false
}: PropertyCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { toggleFavorite, favorites } = usePropertyStore();
  
  const isFavorited = favorites.includes(property.id);
  const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];
  const imageUrl = primaryImage?.url || '/images/placeholders/property-placeholder.jpg';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleComparisonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleComparison?.();
  };

  const formatPrice = (price: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatLocation = (address: string, city: string, state: string) => {
    return `${address}, ${city}, ${state}`;
  };

  return (
    <>
      <div className={cn(
        "group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300",
        isSelected && "ring-2 ring-primary ring-offset-2",
        className
      )}>
        <Link href={`/properties/${property.id}`} className="block">
          {/* Image Section */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
            {!isImageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            
            <Image
              src={imageUrl}
              alt={property.title}
              fill
              className={cn(
                "object-cover transition-all duration-300 group-hover:scale-105",
                !isImageLoaded && "opacity-0"
              )}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16.67vw"
              priority={priority}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setIsImageLoaded(true);
              }}
            />

            {/* Availability Badge */}
            <div className="absolute top-2 left-2">
              <PropertyAvailabilityBadge
                isAvailable={property.isAvailable}
                status={property.status}
                availableFrom={property.availableFrom}
              />
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={handleFavoriteClick}
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
                  )}
                />
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={handleShareClick}
              >
                <Share2 className="h-4 w-4 text-gray-600" />
              </Button>

              {showComparison && (
                <Button
                  size="sm"
                  variant="secondary"
                  className={cn(
                    "h-8 w-8 p-0 transition-colors",
                    isSelected 
                      ? "bg-primary text-white hover:bg-primary/90" 
                      : "bg-white/90 hover:bg-white"
                  )}
                  onClick={handleComparisonClick}
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Property Type Badge */}
            {property.propertyType && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  {property.propertyType.replace('_', ' ')}
                </Badge>
              </div>
            )}

            {/* Image Count */}
            {property.images && property.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {property.images.length} photos
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-3">
            {/* Price */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-gray-900">
                {property.price ? (
                  <>
                    {formatPrice(Number(property.price), property.currency)}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </>
                ) : (
                  <span className="text-gray-500">Contact for price</span>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">
                {formatLocation(property.address, property.city, property.state)}
              </span>
            </div>

            {/* Property Details */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {property.bedrooms && (
                <div className="flex items-center">
                  <Bed className="h-3 w-3 mr-1" />
                  {property.bedrooms}
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center">
                  <Bath className="h-3 w-3 mr-1" />
                  {property.bathrooms}
                </div>
              )}
              {property.area && (
                <div className="flex items-center">
                  <Square className="h-3 w-3 mr-1" />
                  {property.area}
                </div>
              )}
            </div>

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {property.features.slice(0, 2).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {property.features.length > 2 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{property.features.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <PropertyShare
          property={property}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;