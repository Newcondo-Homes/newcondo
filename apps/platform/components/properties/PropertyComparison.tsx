'use client';

import { useState, useEffect } from 'react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Separator } from '@newcondo/ui/components/separator';
import { ScrollArea, ScrollBar } from '@newcondo/ui/components/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@newcondo/ui/components/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@newcondo/ui/components/sheet';
import { 
  GitCompare, 
  X, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Wifi, 
  Shield, 
  Zap, 
  Eye,
  Heart,
  // Share2,
  ChevronLeft,
  ChevronRight,
  Home,
  Building,
  Square
} from 'lucide-react';
import Image from 'next/image';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  structure: string;
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
  totalUnits?: number;
  availableUnits?: number;
  isAvailable: boolean;
  viewCount: number;
  favoriteCount: number;
  ownerId: string;
  agentId?: string;
  createdAt: string;
}

interface PropertyComparisonProps {
  compareList: Property[];
  onRemoveFromCompare: (propertyId: string) => void;
  onClearCompare: () => void;
  maxCompare?: number;
}

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Parking': Car,
  'Generator': Zap,
  'Security': Shield,
  'Internet': Wifi,
  'Elevator': Building,
  'Swimming Pool': Building,
  'Gym': Building,
  'Garden': Home,
  'Balcony': Home,
  'Air Conditioning': Home,
  'Furnished': Home,
  'Pet Friendly': Heart,
};

const PROPERTY_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'APARTMENT': Building,
  'HOUSE': Home,
  'DUPLEX': Building,
  'ROOM': Square,
  'SHARED_APARTMENT': Building,
  'OFFICE': Building,
  'SHOP': Building,
  'WAREHOUSE': Building,
};

export function PropertyComparison({ 
  compareList, 
  onRemoveFromCompare, 
  onClearCompare, 
  maxCompare = 4 
}: PropertyComparisonProps) {
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const formatPrice = (price: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPropertyType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const nextImage = (propertyId: string, totalImages: number) => {
    setCurrentImageIndices(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (propertyId: string, totalImages: number) => {
    setCurrentImageIndices(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const PropertyCard = ({ property }: { property: Property; index: number }) => {
    const currentImageIndex = currentImageIndices[property.id] || 0;
    const primaryImage = property.images.find(img => img.isPrimary) || property.images[0];
    const displayImage = property.images[currentImageIndex] || primaryImage;
    const PropertyTypeIcon = PROPERTY_TYPE_ICONS[property.propertyType] || Home;

    return (
      <div className="min-w-0 flex-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 min-w-0 flex-1">
                <CardTitle className="text-lg line-clamp-2">{property.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PropertyTypeIcon className="w-4 h-4" />
                  <span>{formatPropertyType(property.propertyType)}</span>
                  {property.structure === 'MULTI_FAMILY' && (
                    <Badge variant="secondary" className="text-xs">
                      Multi-Unit
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFromCompare(property.id)}
                className="flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Image Gallery */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              {displayImage ? (
                <>
                  <Image
                    src={displayImage.url}
                    alt={displayImage.altText || property.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  
                  {/* Navigation Controls */}
                  {property.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                        onClick={() => prevImage(property.id, property.images.length)}
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                        onClick={() => nextImage(property.id, property.images.length)}
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </Button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {currentImageIndex + 1} / {property.images.length}
                      </div>
                    </>
                  )}

                  {/* Availability Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge 
                      variant={property.isAvailable ? "default" : "secondary"}
                      className={property.isAvailable ? "bg-green-500" : ""}
                    >
                      {property.isAvailable ? "Available" : "Not Available"}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Home className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(property.price, property.currency)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
              {property.structure === 'MULTI_FAMILY' && property.totalUnits && (
                <div className="text-sm text-muted-foreground">
                  {property.availableUnits} of {property.totalUnits} units available
                </div>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{property.city}, {property.state}</span>
            </div>

            <Separator />

            {/* Property Details */}
            <div className="space-y-3">
              {property.bedrooms !== undefined && property.bathrooms !== undefined && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{property.bedrooms} beds</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{property.bathrooms} baths</span>
                  </div>
                </div>
              )}

              {property.area && (
                <div className="flex items-center gap-1">
                  <Square className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{property.area}</span>
                </div>
              )}

              {/* Features */}
              {property.features.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Features</div>
                  <div className="flex flex-wrap gap-1">
                    {property.features.slice(0, 6).map((feature) => {
                      const FeatureIcon = FEATURE_ICONS[feature];
                      return (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {FeatureIcon && <FeatureIcon className="w-3 h-3 mr-1" />}
                          {feature}
                        </Badge>
                      );
                    })}
                    {property.features.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{property.features.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{property.viewCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{property.favoriteCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (compareList.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <GitCompare className="w-12 h-12 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No Properties to Compare</h3>
            <p className="text-muted-foreground">
              Add properties to your comparison list to see them side by side
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const ComparisonContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compare Properties</h2>
          <p className="text-muted-foreground">
            Comparing {compareList.length} of {maxCompare} properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClearCompare}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Properties Grid */}
      <ScrollArea className="w-full">
        <div className={`flex gap-4 pb-4 ${compareList.length > 2 ? 'min-w-max' : ''}`}>
          {compareList.map((property, index) => (
            <div key={property.id} className={`${compareList.length <= 2 ? 'w-full max-w-md' : 'w-80'}`}>
              <PropertyCard property={property} index={index} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Feature</th>
                  {compareList.map(property => (
                    <th key={property.id} className="text-left py-2 px-4 font-medium min-w-[200px]">{property.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium">Price</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      {formatPrice(property.price, property.currency)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium">Bedrooms</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      {property.bedrooms ? `${property.bedrooms}` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium">Bathrooms</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      {property.bathrooms ? `${property.bathrooms}` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium">Area</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      {property.area || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium">Location</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{property.city}, {property.state}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium align-top">Features</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {property.features.length > 0 ? (
                          property.features.map(feature => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))
                        ) : (
                          <span>N/A</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium">Availability</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      <Badge variant={property.isAvailable ? "default" : "secondary"}>
                        {property.isAvailable ? "Available" : "Not Available"}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium">Views</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      {property.viewCount}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm font-medium">Favorites</td>
                  {compareList.map(property => (
                    <td key={property.id} className="py-3 px-4 text-sm">
                      {property.favoriteCount}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return isMobile ? (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 shadow-lg">
          <GitCompare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Property Comparison</SheetTitle>
          <SheetDescription>
            Comparing up to {maxCompare} properties side by side.
          </SheetDescription>
        </SheetHeader>
        <ComparisonContent />
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 shadow-lg">
          <GitCompare className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle>Property Comparison</DialogTitle>
          <DialogDescription>
            Comparing up to {maxCompare} properties side by side.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-4 -mr-4">
          <ComparisonContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
