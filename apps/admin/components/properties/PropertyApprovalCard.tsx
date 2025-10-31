'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Home,
  User,
  Clock,
  DollarSign,
  Image as ImageIcon,
  FileText,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface PropertyApprovalCardProps {
  property: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    address: string;
    city: string;
    state: string;
    propertyType: string;
    structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
    bedrooms?: number;
    bathrooms?: number;
    totalUnits?: number;
    availableUnits?: number;
    status: string;
    adminApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    images: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
    }>;
    owner: {
      id: string;
      name: string | null;
      email: string;
      verificationStatus: string;
    };
    agent?: {
      id: string;
      name: string | null;
    } | null;
    boundaryVerified: boolean;
    isOwnerListing: boolean;
    createdAt: string;
    documentsCount?: number;
  };
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onViewDetails?: (propertyId: string) => void;
}

export function PropertyApprovalCard({
  property,
  onApprove,
  onReject,
  onViewDetails,
}: PropertyApprovalCardProps) {
  const primaryImage = property.images.find((img) => img.isPrimary) || property.images[0];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative">
        {/* Property Image */}
        <div className="relative h-48 w-full bg-gray-200">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={property.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute right-3 top-3">
          <Badge className={getStatusColor(property.adminApprovalStatus)}>
            {property.adminApprovalStatus}
          </Badge>
        </div>

        {/* Image Count */}
        {property.images.length > 0 && (
          <div className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-xs text-white">
            <ImageIcon className="mr-1 inline h-3 w-3" />
            {property.images.length}
          </div>
        )}
      </div>

      <CardContent className="space-y-4 p-4">
        {/* Property Title & Type */}
        <div>
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-semibold text-gray-900">{property.title}</h3>
            {property.boundaryVerified && (
              <CheckCircle className="h-5 w-5 shrink-0 text-green-600" title="Boundary Verified" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{property.propertyType}</Badge>
            {property.structure === 'MULTI_FAMILY' && (
              <Badge variant="outline" className="bg-blue-50">
                Multi-Family ({property.totalUnits} units)
              </Badge>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gray-400" />
          <span className="text-xl font-bold text-gray-900">
            {property.structure === 'SINGLE_UNIT' && property.price
              ? formatPrice(property.price, property.currency)
              : property.structure === 'MULTI_FAMILY'
              ? `${property.availableUnits}/${property.totalUnits} available`
              : 'Price not set'}
          </span>
          {property.structure === 'SINGLE_UNIT' && <span className="text-sm text-gray-500">/month</span>}
        </div>

        {/* Property Details */}
        {property.structure === 'SINGLE_UNIT' && (property.bedrooms || property.bathrooms) && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {property.bedrooms && (
              <span>
                <Home className="mr-1 inline h-4 w-4" />
                {property.bedrooms} Bed
              </span>
            )}
            {property.bathrooms && <span>{property.bathrooms} Bath</span>}
          </div>
        )}

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="line-clamp-2">
            {property.address}, {property.city}, {property.state}
          </span>
        </div>

        {/* Owner Info */}
        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">
                {property.isOwnerListing ? 'Owner' : 'Agent'} Listing
              </span>
            </div>
            <Badge
              variant="outline"
              className={
                property.owner.verificationStatus === 'VERIFIED'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-yellow-50 text-yellow-700'
              }
            >
              {property.owner.verificationStatus}
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{property.owner.name || 'Unnamed User'}</p>
            <p className="text-xs text-gray-500">{property.owner.email}</p>
          </div>
          {property.agent && (
            <div className="border-t pt-2 text-xs text-gray-500">
              Agent: {property.agent.name}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(property.createdAt), { addSuffix: true })}
          </div>
          {property.documentsCount !== undefined && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {property.documentsCount} docs
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {property.adminApprovalStatus === 'PENDING' ? (
          <div className="flex gap-2 border-t pt-4">
            <Button
              onClick={() => onViewDetails?.(property.id)}
              variant="outline"
              className="flex-1"
              asChild
            >
              <Link href={`/properties/${property.id}`}>View Details</Link>
            </Button>
            <Button
              onClick={() => onApprove?.(property.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => onViewDetails?.(property.id)}
            variant="outline"
            className="w-full"
            asChild
          >
            <Link href={`/properties/${property.id}`}>View Details</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}