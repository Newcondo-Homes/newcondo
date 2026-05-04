'use client';

import { useState } from 'react';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  User,
  Phone,
  Mail,
  Heart,
  Share2,
  CheckSquare,
  Building2,
  Shield,
  Zap,
  LayoutGrid,
  Pencil
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Separator } from '@newcondo/ui/components/separator';
import { cn } from '@newcondo/ui/lib/utils';
import { PropertyGallery } from './PropertyGallery';
import PropertyAvailabilityBadge from './PropertyAvailabilityBadge';
import PropertyBoundaryMap from './PropertyBoundaryMap';
import PropertyShare from './PropertyShare';
// import { Property } from '@/types/api';
// import type { PropertyWithDetails } from '@/types/property';
import { usePropertyStore } from '@/store/propertyStore';

interface PropertyImageShape {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  order: number;
  propertyId?: string | null;  // optional — not always selected
  createdAt?: Date | null;     // optional — not always selected
}
 
// ─── Fix 1 (continued): Loosened owner/agent shape ───────────────────────────
//
// PropertyResponse.owner comes back with `phone` from the API,
// but PropertyWithDetails.owner doesn't declare it.
// We also add `phone` as optional here so the contact section can use it.
 
interface PersonShape {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  verificationStatus?: string | null;
}
 
interface PropertyUnitShape {
  id: string;
  unitNumber: string;
  floor?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: string | null;
  price: number;
  status: string;
  isAvailable: boolean;
  features: string[];
  propertyId?: string | null;
  currency?: string | null;
  isPaymentLocked?: boolean | null;
  paymentLockExpiry?: Date | null;
  availableFrom?: Date | null;
  images?: PropertyImageShape[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// A display-ready property type that accepts both the strict
// PropertyWithDetails and the leaner API PropertyResponse.
interface PropertyForDisplay {
  id: string;
  title: string;
  description: string;
  structure: string;
  price?: number | null;
  currency: string;
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates?: string | null;       // Prisma: null, types: undefined — both accepted
  boundaryCoordinates?: any;
  boundaryVerified: boolean;
  boundaryMarkedBy?: string | null;
  boundaryMarkedAt?: Date | null;
  boundaryImages: string[];
  buildingFingerprint?: string | null;
  totalUnits?: number | null;
  availableUnits?: number | null;
  buildingFeatures: string[];
  propertyType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: string | null;
  features: string[];
  ownerId: string;
  agentId?: string | null;
  isOwnerListing: boolean;
  status: string;
  adminApprovalStatus: string;
  rejectionReason?: string | null;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  isAvailable: boolean;
  availableFrom?: Date | null;
  isPaymentLocked: boolean;
  paymentLockExpiry?: Date | null;
  shareableLink?: string | null;
  viewCount: number;
  favoriteCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  images: PropertyImageShape[];
  owner?: PersonShape | null;
  agent?: PersonShape | null;
  units?: PropertyUnitShape[];
  _count?: {
    images?: number;
    units?: number;
    rentals?: number;
    duplicateReports?: number;
  };
}

interface CurrentUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  userType?: string | null;
}

interface PropertyDetailsProps {
  property: PropertyForDisplay;
  className?: string;
  currentUser?: CurrentUser | null;  
  canEdit?: boolean;
}

export default function PropertyDetails({ property, className, currentUser, canEdit = false, }: PropertyDetailsProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'location'>('overview');

  const {
    toggleFavorite,
    favorites,
    selectedForComparison,
    toggleComparison
  } = usePropertyStore();

  const isFavorited = favorites.includes(property.id);
  const isInComparison = selectedForComparison.includes(property.id);

  const formatPrice = (price: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getFeatureIcon = (feature: string) => {
    const iconMap: Record<string, any> = {
      'parking': '🅿️',
      'generator': '⚡',
      'security': '🔐',
      'elevator': '🛗',
      'swimming pool': '🏊',
      'gym': '💪',
      'garden': '🌳',
      'balcony': '🏡',
      'furnished': '🛋️',
      'air conditioning': '❄️',
      'wifi': '📶',
      'laundry': '👕'
    };

    return iconMap[feature.toLowerCase()] || '✨';
  };

  const getAvailabilityStatus = (): 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED' | 'RENTED' | 'UNAVAILABLE' | 'PAYMENT_LOCKED' => {
    if (property.isPaymentLocked) return 'PAYMENT_LOCKED';
    if (property.status === 'RENTED') return 'RENTED';
    if (property.status === 'UNAVAILABLE') return 'UNAVAILABLE';
    if (!property.isAvailable) return 'UNAVAILABLE';
    return 'AVAILABLE';
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'location', label: 'Location' }
  ] as const;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Property Image Gallery */}
      {/* <PropertyGallery images={property.images} /> */}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {property.images?.map((image, index) => (
          <div key={image.id} className="relative aspect-video">
            <Image
              src={image.url}
              alt={image.altText || property.title}
              fill
              className="object-cover rounded-lg"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="mb-4">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {property.title}
              </h1>
              {/* Edit button — only visible to owners/agents with edit rights */}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="shrink-0 gap-1"
                >
                  <a href={`/properties/my-listings/${property.id}`}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </a>
                </Button>
              )}
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>
                {property.address}, {property.city}, {property.state}
              </span>
            </div>
          </div>

          {/* Quick Details */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {property.bedrooms && (
              <div className="flex items-center gap-1 text-gray-700">
                <Bed className="h-4 w-4" />
                <span className="font-medium">{property.bedrooms}</span>
                <span className="text-sm">bed{property.bedrooms > 1 ? 's' : ''}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1 text-gray-700">
                <Bath className="h-4 w-4" />
                <span className="font-medium">{property.bathrooms}</span>
                <span className="text-sm">bath{property.bathrooms > 1 ? 's' : ''}</span>
              </div>
            )}
            {property.area && (
              <div className="flex items-center gap-1 text-gray-700">
                <Square className="h-4 w-4" />
                <span className="font-medium">{property.area}</span>
              </div>
            )}
            {property.propertyType && (
              <Badge variant="secondary" className="capitalize">
                {property.propertyType.replace('_', ' ')}
              </Badge>
            )}
          </div>

          {/* Availability Status */}
          <div className="mb-4">
            <PropertyAvailabilityBadge
              status={getAvailabilityStatus()}
              availableFrom={property.availableFrom?.toString()}
              size="lg"
            />
          </div>
        </div>

        {/* Price and Actions */}
        <div className="lg:text-right">
          <div className="mb-4">
            {property.price ? (
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {formatPrice(Number(property.price), property.currency)}
                </div>
                <div className="text-gray-600">per month</div>
              </div>
            ) : (
              <div className="text-xl font-semibold text-gray-600">
                Contact for price
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleFavorite(property.id)}
              className={cn("rounded-full p-2 hover:bg-red-100", isFavorited ? 'text-red-500' : 'text-gray-500')}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleComparison(property.id)}
              className={cn("rounded-full p-2 hover:bg-blue-100", isInComparison ? 'text-blue-500' : 'text-gray-500')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tabs for Property Information */}
      <div className="w-full">
        <div className="flex items-center gap-4 overflow-x-auto border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-3 px-4 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'overview' && (
            <div className="prose max-w-none text-gray-700">
              <p>{property.description}</p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Listed on {formatDate(property.createdAt)}</span>
              </div>
            </div>
          )}

          {activeTab === 'amenities' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {property.features?.length > 0 ? (
                property.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <span className="text-xl">{getFeatureIcon(feature)}</span>
                    <span className="capitalize">{feature}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No specific amenities listed.</p>
              )}
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-900">
                Property Location & Boundary
              </div>
              <PropertyBoundaryMap
                propertyId={property.id}
                gpsCoordinates={property.gpsCoordinates as string | undefined}
                boundaryCoordinates={property.boundaryCoordinates}
                boundaryVerified={property.boundaryVerified}
                boundaryImages={property.boundaryImages}
              />
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{property.address}, {property.city}, {property.state}</span>
              </div>
              {property.boundaryVerified && (
                <div className="flex items-center text-green-600 font-medium">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  <span>Verified Boundary</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Contact Agent Section */}
      <Card className="p-4 md:p-6">
        <CardHeader>
          <CardTitle className="text-xl">Contact Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <User className="h-12 w-12 text-gray-500 rounded-full" />
            <div>
              <p className="text-lg font-semibold">John Doe</p>
              <p className="text-sm text-gray-600">NewCondo Verified Agent</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-gray-700">
              <Phone className="h-4 w-4 mr-2" />
              <span>+234 801 234 5678</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Mail className="h-4 w-4 mr-2" />
              <span>john.doe@newcondo.homes</span>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button className="w-full sm:w-auto">
              Send Message
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              Call Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Modal */}
      <PropertyShare
        propertyId={property.id}
        propertyTitle={property.title}
        propertyPrice={property.price ? `₦${Number(property.price).toLocaleString()}/month` : 'Contact for price'}
        propertyImage={property.images?.find(img => img.isPrimary)?.url ?? property.images?.[0]?.url}
      />
    </div>
  )
}
