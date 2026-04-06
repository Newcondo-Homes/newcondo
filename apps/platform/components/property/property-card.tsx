// apps/platform/src/components/property/property-card.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { Button } from '@newcondo/ui/';
import {
  MapPin,
  Eye,
  Heart,
  Share2,
  Bed,
  Bath,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Home
} from 'lucide-react';
import { PropertyWithDetails as Property, PropertyStatus, PropertyType } from '@/types/property';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@newcondo/ui';

interface PropertyCardProps {
  property: Property;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
  isDuplicate?: boolean;
  showBoundaryStatus?: boolean;
  className?: string;
}

export function PropertyCard({
  property,
  viewMode = 'grid',
  onClick,
  isDuplicate = false,
  showBoundaryStatus = false,
  className = ''
}: PropertyCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Get primary image or placeholder
  const primaryImage = property.images?.[0]?.url || '/images/placeholders/property.jpg';

  // Format property features
  const features = [
    property.bedrooms ? { icon: Bed, value: property.bedrooms, label: 'bed' } : null,
    property.bathrooms ? { icon: Bath, value: property.bathrooms, label: 'bath' } : null,
    property.area ? { icon: Square, value: property.area, label: 'area' } : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  // Get property type icon
  const getPropertyTypeIcon = (type: PropertyType) => {
    switch (type) {
      case 'HOUSE':
      case 'DUPLEX':
        return Home;
      case 'APARTMENT':
      case 'SHARED_APARTMENT':
        return Building2;
      default:
        return Building2;
    }
  };

  // Get status color
  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'RENTED':
        return 'bg-blue-100 text-blue-800';
      case 'UNAVAILABLE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get boundary status
  const getBoundaryStatus = () => {
    if (!showBoundaryStatus) return null;

    if (property.boundaryVerified) {
      return {
        icon: CheckCircle,
        label: 'Boundary Verified',
        color: 'text-green-600'
      };
    }

    return {
      icon: Clock,
      label: 'Boundary Pending',
      color: 'text-yellow-600'
    };
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    // TODO: Implement favorite API call
  };

  // Handle share
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement share functionality
  };

  const PropertyTypeIcon = getPropertyTypeIcon(property.propertyType);
  const boundaryStatus = getBoundaryStatus();

  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg',
          isDuplicate && 'border-red-200 bg-red-50',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="flex">
            {/* Image Section */}
            <div className="relative w-72 h-48 flex-shrink-0">
              <Image
                src={primaryImage}
                alt={property.title}
                fill
                className="object-cover rounded-l-lg"
                onLoad={() => setIsImageLoading(false)}
              />

              {/* Overlay badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <Badge className={getStatusColor(property.status)}>
                  {property.status.replace('_', ' ')}
                </Badge>

                {isDuplicate && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Duplicate
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleFavoriteToggle}
                  className="w-8 h-8 p-0"
                >
                  <Heart className={cn(
                    "h-4 w-4",
                    isFavorited && "fill-red-500 text-red-500"
                  )} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleShare}
                  className="w-8 h-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Image loading state */}
              {isImageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-l-lg" />
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-semibold mb-1 line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-muted-foreground text-sm mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="line-clamp-1">{property.address}, {property.city}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {property.price
                      ? formatCurrency(Number(property.price), property.currency)
                      : 'Contact for price'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {property.description}
              </p>

              {/* Features */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <PropertyTypeIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground capitalize">
                    {property.propertyType.toLowerCase().replace('_', ' ')}
                  </span>
                </div>

                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {feature.value} {feature.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom section */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{property.viewCount || 0}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{property.isOwnerListing ? 'Owner' : 'Agent'}</span>
                  </div>

                  {boundaryStatus && (
                    <div className={cn(
                      "flex items-center gap-1 text-sm",
                      boundaryStatus.color
                    )}>
                      <boundaryStatus.icon className="h-4 w-4" />
                      <span>{boundaryStatus.label}</span>
                    </div>
                  )}
                </div>

                <Button asChild>
                  <Link href={`/properties/${property.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg overflow-hidden',
        isDuplicate && 'border-red-200 bg-red-50',
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={primaryImage}
            alt={property.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            onLoad={() => setIsImageLoading(false)}
          />

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge className={getStatusColor(property.status)}>
              {property.status.replace('_', ' ')}
            </Badge>

            {isDuplicate && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Duplicate
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFavoriteToggle}
              className="w-8 h-8 p-0"
            >
              <Heart className={cn(
                "h-4 w-4",
                isFavorited && "fill-red-500 text-red-500"
              )} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleShare}
              className="w-8 h-8 p-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Image loading state */}
          {isImageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">
              {property.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="line-clamp-1">{property.address}, {property.city}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-primary">
              {property.price
                ? formatCurrency(Number(property.price), property.currency)
                : 'Contact for price'
              }
            </div>
            <div className="text-sm text-muted-foreground">per month</div>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2">
            {property.description}
          </p>

          {/* Features */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <PropertyTypeIcon className="h-4 w-4" />
              <span className="capitalize">
                {property.propertyType.toLowerCase().replace('_', ' ')}
              </span>
            </div>

            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span>{feature.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{property.viewCount || 0}</span>
            </div>

            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{property.isOwnerListing ? 'Owner' : 'Agent'}</span>
            </div>

            {boundaryStatus && (
              <div className={cn(
                "flex items-center gap-1",
                boundaryStatus.color
              )}>
                <boundaryStatus.icon className="h-4 w-4" />
              </div>
            )}
          </div>

          <Button size="sm" asChild>
            <Link href={`/properties/${property.id}`}>
              View
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}