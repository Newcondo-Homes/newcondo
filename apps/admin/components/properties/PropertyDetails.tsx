'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface PropertyDetailsProps {
  property: {
    id: string;
    title: string;
    description: string;
    price?: number;
    currency: string;
    address: string;
    city: string;
    state: string;
    country: string;
    propertyType: string;
    structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
    bedrooms?: number;
    bathrooms?: number;
    area?: string;
    features: string[];
    totalUnits?: number;
    availableUnits?: number;
    buildingFeatures?: string[];
    status: string;
    adminApprovalStatus: string;
    isAvailable: boolean;
    boundaryVerified: boolean;
    boundaryMarkedAt?: string;
    isOwnerListing: boolean;
    owner: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      verificationStatus: string;
      role: string;
    };
    agent?: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    approvedAt?: string;
    approvedBy?: string;
    rejectionReason?: string;
  };
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
      PUBLISHED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      RENTED: { color: 'bg-purple-100 text-purple-800', icon: Home },
      UNAVAILABLE: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
          <CardDescription>Core details about this property listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title & Status */}
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">{property.title}</h2>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(property.adminApprovalStatus)}
              {getStatusBadge(property.status)}
              {property.boundaryVerified && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Boundary Verified
                </Badge>
              )}
              {property.isOwnerListing ? (
                <Badge variant="outline">Owner Listing</Badge>
              ) : (
                <Badge variant="outline">Agent Listing</Badge>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {property.rejectionReason && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Rejection Reason</p>
                  <p className="mt-1 text-sm text-red-800">{property.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
            <p className="whitespace-pre-wrap text-gray-600">{property.description}</p>
          </div>

          {/* Property Structure */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <Building className="h-5 w-5" />
                <span className="text-sm font-medium">Structure Type</span>
              </div>
              <p className="text-lg font-semibold">
                {property.structure === 'SINGLE_UNIT' ? 'Single Unit' : 'Multi-Family Building'}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">Property Type</span>
              </div>
              <p className="text-lg font-semibold">{property.propertyType}</p>
            </div>
          </div>

          {/* Price & Units */}
          <div className="grid gap-4 sm:grid-cols-2">
            {property.structure === 'SINGLE_UNIT' && property.price && (
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm font-medium">Monthly Rent</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(property.price, property.currency)}
                </p>
              </div>
            )}

            {property.structure === 'MULTI_FAMILY' && (
              <>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-gray-500">
                    <Building className="h-5 w-5" />
                    <span className="text-sm font-medium">Total Units</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{property.totalUnits}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-gray-500">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Available Units</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{property.availableUnits}</p>
                </div>
              </>
            )}
          </div>

          {/* Single Unit Details */}
          {property.structure === 'SINGLE_UNIT' && (
            <div className="grid gap-4 sm:grid-cols-3">
              {property.bedrooms && (
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                </div>
              )}
              {property.bathrooms && (
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                </div>
              )}
              {property.area && (
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{property.area}</p>
                  <p className="text-sm text-gray-500">Area</p>
                </div>
              )}
            </div>
          )}

          {/* Features */}
          {property.features.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">
                {property.structure === 'SINGLE_UNIT' ? 'Property Features' : 'Unit Features'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature, index) => (
                  <Badge key={index} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Building Features (Multi-Family) */}
          {property.structure === 'MULTI_FAMILY' && property.buildingFeatures && property.buildingFeatures.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Building Features</h3>
              <div className="flex flex-wrap gap-2">
                {property.buildingFeatures.map((feature, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <h3 className="mb-3 font-semibold text-gray-900">Location</h3>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <MapPin className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{property.address}</p>
                <p className="text-sm text-gray-600">
                  {property.city}, {property.state}, {property.country}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner Information */}
      <Card>
        <CardHeader>
          <CardTitle>Owner & Agent Information</CardTitle>
          <CardDescription>Details about the property owner and listing agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Owner */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Property Owner</h3>
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{property.owner.name || 'Unnamed User'}</span>
                <Badge variant="outline" className="text-xs">
                  {property.owner.role}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Email: {property.owner.email}</p>
              {property.owner.phone && (
                <p className="text-sm text-gray-600">Phone: {property.owner.phone}</p>
              )}
            </div>
          </div>

          {/* Agent */}
          {property.agent && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Listing Agent</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{property.agent.name || 'Unnamed Agent'}</span>
                </div>
                <p className="text-sm text-gray-600">Email: {property.agent.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Property Timeline</CardTitle>
          <CardDescription>Important dates and events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <span className="text-sm text-gray-600">
              {format(new Date(property.createdAt), 'PPpp')}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Last Updated</span>
            </div>
            <span className="text-sm text-gray-600">
              {format(new Date(property.updatedAt), 'PPpp')}
            </span>
          </div>

          {property.boundaryMarkedAt && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Boundary Marked</span>
              </div>
              <span className="text-sm text-gray-600">
                {format(new Date(property.boundaryMarkedAt), 'PPpp')}
              </span>
            </div>
          )}

          {property.approvedAt && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Approved</span>
              </div>
              <span className="text-sm text-gray-600">
                {format(new Date(property.approvedAt), 'PPpp')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}