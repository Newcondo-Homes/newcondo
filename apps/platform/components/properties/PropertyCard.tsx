'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Square, Share2, CheckSquare } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { cn } from '@newcondo/ui/lib/utils';
import PropertyAvailabilityBadge from './PropertyAvailabilityBadge';
import PropertyShare from './PropertyShare';
import type { PropertyResponse } from '@/lib/api/properties';
import { usePropertyStore } from '@/store/propertyStore';

function toNumber(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (typeof val === 'object' && 'toNumber' in (val as any)) return (val as any).toNumber();
  return Number(val) || 0;
}

export interface PropertyCardData {
  id: string;
  title: string;
  description?: string | null;
  price?:  number | string | { toNumber(): number; toString(): string } | null;
  currency: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  structure?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: string | null;
  features: string[];
  images: Array<{
    id: string;
    url: string;
    altText?: string | null;
    isPrimary: boolean;
    order?: number;
  }>;
  totalUnits?: number | null;
  availableUnits?: number | null;
  isAvailable: boolean;
  isPaymentLocked?: boolean | null;
  status?: string | null;
  availableFrom?: string | Date | null;
  viewCount?: number;
  favoriteCount?: number;
}

interface PropertyCardProps {
  property: PropertyCardData;
  showComparison?: boolean;
  isSelected?: boolean;
  onToggleComparison?: () => void;
  className?: string;
  priority?: boolean; // For above-the-fold images
  onClick?: () => void;
  showFavoriteButton?: boolean;
  isFavorited?: boolean;
}

const PropertyCard = memo(function PropertyCard({
  property,
  showComparison = false,
  isSelected = false,
  onToggleComparison,
  className,
  priority = false,
  onClick,
}: PropertyCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toggleFavorite, favorites = [] } = usePropertyStore();
  
  const isFavorited = favorites.includes(property.id);
  const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];
  const imageUrl = primaryImage?.url || '/images/placeholders/property-placeholder.jpg';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite?.(property.id);
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

  const getAvailabilityStatus = (): 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED' | 'RENTED' | 'UNAVAILABLE' | 'PAYMENT_LOCKED' => {
  if (property.isPaymentLocked) return 'PAYMENT_LOCKED';
  if (property.status === 'RENTED') return 'RENTED';
  if (property.status === 'UNAVAILABLE') return 'UNAVAILABLE';
  if (!property.isAvailable) return 'UNAVAILABLE';
  return 'AVAILABLE';
  };

  return (
    <>
      <div className={cn(
        "group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300",
        isSelected && "ring-2 ring-primary ring-offset-2",
        className
      )}>
        <Link href={`/properties/${property.id}`} className="block" onClick={onClick}>
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
                // isAvailable={property.isAvailable}
                status={getAvailabilityStatus()}
                availableFrom={property.availableFrom ? new Date(property.availableFrom).toISOString() : undefined}
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
                // onClick={handleShareClick}
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
      
        <PropertyShare
          propertyId={property.id}
          propertyTitle={property.title}
          propertyPrice={property.price ? `₦${Number(property.price).toLocaleString()}/month` : 'Contact for price'}
          propertyImage={property.images?.find(img => img.isPrimary)?.url ?? property.images?.[0]?.url}
        />
    
    </>
  );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;

















// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import {
//   MoreVertical,
//   Edit,
//   Eye,
//   Share2,
//   MapPin,
//   Bed,
//   Bath,
//   Ruler,
//   TrendingUp,
// } from "lucide-react";
// import { Card, CardContent, CardFooter } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { formatCurrency } from "@/lib/utils/format";
// import { toast } from "sonner";

// interface Property {
//   id: string;
//   title: string;
//   description: string;
//   price: number;
//   currency: string;
//   address: string;
//   city: string;
//   state: string;
//   propertyType: string;
//   bedrooms?: number;
//   bathrooms?: number;
//   area?: string;
//   status: string;
//   adminApprovalStatus: string;
//   isAvailable: boolean;
//   viewCount: number;
//   images: Array<{ url: string; isPrimary: boolean }>;
//   structure: string;
//   totalUnits?: number;
//   availableUnits?: number;
// }

// interface PropertyCardProps {
//   property: Property;
//   viewMode: "grid" | "list";
//   onClick: () => void;
//   onRefetch: () => void;
// }

// export default function PropertyCard({
//   property,
//   viewMode,
//   onClick,
//   onRefetch,
// }: PropertyCardProps) {
//   const router = useRouter();
//   const [isSharing, setIsSharing] = useState(false);

//   const primaryImage =
//     property.images.find((img) => img.isPrimary)?.url ||
//     property.images[0]?.url ||
//     "/images/placeholders/property.jpg";

//   const getStatusColor = (status: string) => {
//     switch (status.toUpperCase()) {
//       case "PUBLISHED":
//         return "bg-green-500/10 text-green-700 border-green-500/20";
//       case "DRAFT":
//         return "bg-gray-500/10 text-gray-700 border-gray-500/20";
//       case "RENTED":
//         return "bg-purple-500/10 text-purple-700 border-purple-500/20";
//       case "PENDING":
//         return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
//       case "UNAVAILABLE":
//         return "bg-red-500/10 text-red-700 border-red-500/20";
//       default:
//         return "bg-gray-500/10 text-gray-700 border-gray-500/20";
//     }
//   };

//   const getApprovalBadge = () => {
//     if (property.adminApprovalStatus === "APPROVED") {
//       return (
//         <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
//           Approved
//         </Badge>
//       );
//     }
//     if (property.adminApprovalStatus === "REJECTED") {
//       return (
//         <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
//           Rejected
//         </Badge>
//       );
//     }
//     return (
//       <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
//         Pending Review
//       </Badge>
//     );
//   };

//   const handleEdit = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     router.push(`/dashboard/properties/my-properties/${property.id}/edit`);
//   };

//   const handleViewAnalytics = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     router.push(`/dashboard/properties/my-properties/${property.id}/analytics`);
//   };

//   const handleShare = async (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setIsSharing(true);

//     try {
//       const shareUrl = `${window.location.origin}/properties/${property.id}`;
      
//       if (navigator.share) {
//         await navigator.share({
//           title: property.title,
//           text: property.description,
//           url: shareUrl,
//         });
//         toast.success("Shared successfully");
//       } else {
//         await navigator.clipboard.writeText(shareUrl);
//         toast.success("Link copied to clipboard");
//       }
//     } catch (error) {
//       if (error instanceof Error && error.name !== "AbortError") {
//         toast.error("Failed to share property");
//       }
//     } finally {
//       setIsSharing(false);
//     }
//   };

//   const renderPropertyDetails = () => (
//     <>
//       {property.structure === "MULTI_FAMILY" ? (
//         <div className="flex items-center gap-4 text-sm text-muted-foreground">
//           <span className="flex items-center gap-1">
//             <Building2 className="h-4 w-4" />
//             {property.totalUnits} units
//           </span>
//           <span className="flex items-center gap-1">
//             <CheckCircle className="h-4 w-4" />
//             {property.availableUnits} available
//           </span>
//         </div>
//       ) : (
//         <div className="flex items-center gap-4 text-sm text-muted-foreground">
//           {property.bedrooms && (
//             <span className="flex items-center gap-1">
//               <Bed className="h-4 w-4" />
//               {property.bedrooms}
//             </span>
//           )}
//           {property.bathrooms && (
//             <span className="flex items-center gap-1">
//               <Bath className="h-4 w-4" />
//               {property.bathrooms}
//             </span>
//           )}
//           {property.area && (
//             <span className="flex items-center gap-1">
//               <Ruler className="h-4 w-4" />
//               {property.area}
//             </span>
//           )}
//         </div>
//       )}
//     </>
//   );

//   if (viewMode === "list") {
//     return (
//       <Card
//         className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
//         onClick={onClick}
//       >
//         <div className="flex flex-col sm:flex-row">
//           <div className="relative w-full sm:w-64 h-48 sm:h-auto">
//             <Image
//               src={primaryImage}
//               alt={property.title}
//               fill
//               className="object-cover"
//             />
//             <div className="absolute top-2 right-2 flex gap-2">
//               <Badge className={getStatusColor(property.status)}>
//                 {property.status}
//               </Badge>
//             </div>
//           </div>

//           <div className="flex-1 p-4">
//             <div className="flex justify-between items-start mb-2">
//               <div className="flex-1">
//                 <h3 className="text-xl font-semibold line-clamp-1">
//                   {property.title}
//                 </h3>
//                 <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
//                   <MapPin className="h-3 w-3" />
//                   {property.city}, {property.state}
//                 </p>
//               </div>
//               {getApprovalBadge()}
//             </div>

//             <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
//               {property.description}
//             </p>

//             {renderPropertyDetails()}

//             <div className="flex items-center justify-between mt-4 pt-4 border-t">
//               <div>
//                 <p className="text-2xl font-bold">
//                   {formatCurrency(property.price, property.currency)}
//                 </p>
//                 <p className="text-xs text-muted-foreground flex items-center gap-1">
//                   <Eye className="h-3 w-3" />
//                   {property.viewCount} views
//                 </p>
//               </div>

//               <div className="flex gap-2">
//                 <Button variant="outline" size="sm" onClick={handleEdit}>
//                   <Edit className="h-4 w-4 mr-1" />
//                   Edit
//                 </Button>
//                 <Button variant="outline" size="sm" onClick={handleViewAnalytics}>
//                   <TrendingUp className="h-4 w-4 mr-1" />
//                   Analytics
//                 </Button>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
//                     <Button variant="outline" size="sm">
//                       <MoreVertical className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     <DropdownMenuItem onClick={handleShare}>
//                       <Share2 className="h-4 w-4 mr-2" />
//                       Share
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <Card
//       className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
//       onClick={onClick}
//     >
//       <div className="relative h-48">
//         <Image
//           src={primaryImage}
//           alt={property.title}
//           fill
//           className="object-cover"
//         />
//         <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
//           <Badge className={getStatusColor(property.status)}>
//             {property.status}
//           </Badge>
//           {getApprovalBadge()}
//         </div>
//       </div>

//       <CardContent className="p-4">
//         <h3 className="text-lg font-semibold line-clamp-1 mb-1">
//           {property.title}
//         </h3>
//         <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
//           <MapPin className="h-3 w-3" />
//           {property.city}, {property.state}
//         </p>

//         <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
//           {property.description}
//         </p>

//         {renderPropertyDetails()}

//         <div className="flex justify-between items-center pt-3 mt-3 border-t">
//           <div>
//             <p className="text-xl font-bold">
//               {formatCurrency(property.price, property.currency)}
//             </p>
//             <p className="text-xs text-muted-foreground flex items-center gap-1">
//               <Eye className="h-3 w-3" />
//               {property.viewCount} views
//             </p>
//           </div>
//         </div>
//       </CardContent>

//       <CardFooter className="p-4 pt-0 flex gap-2">
//         <Button
//           variant="outline"
//           size="sm"
//           className="flex-1"
//           onClick={handleEdit}
//         >
//           <Edit className="h-4 w-4 mr-1" />
//           Edit
//         </Button>
//         <Button
//           variant="outline"
//           size="sm"
//           className="flex-1"
//           onClick={handleViewAnalytics}
//         >
//           <TrendingUp className="h-4 w-4 mr-1" />
//           Analytics
//         </Button>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
//             <Button variant="outline" size="sm">
//               <MoreVertical className="h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem onClick={handleShare}>
//               <Share2 className="h-4 w-4 mr-2" />
//               Share
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </CardFooter>
//     </Card>
//   );
// }