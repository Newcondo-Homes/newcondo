'use client';
// apps/platform/components/properties/PropertyManagementContent.tsx

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  MapPin,
  Edit,
  BarChart2,
  Map,
  Megaphone,
  History,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Building2,
  BedDouble,
  Bath,
  Ruler,
} from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { propertyApi } from '@/lib/api/properties';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyManagementContentProps {
  propertyId: string;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  RENTED: 'bg-blue-100 text-blue-800',
  UNAVAILABLE: 'bg-red-100 text-red-700',
};

function formatNGN(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Quick-action nav cards ───────────────────────────────────────────────────

interface NavCard {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertyManagementContent({
  propertyId,
}: PropertyManagementContentProps) {
  const router = useRouter();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyApi.getById(propertyId),
    staleTime: 5 * 60 * 1000,
  });

  const base = `/dashboard/properties/my-properties/${propertyId}`;

  const navCards: NavCard[] = [
    {
      label: 'Edit Details',
      description: 'Update title, price, description and features',
      icon: Edit,
      href: `${base}/edit`,
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Analytics',
      description: 'Views, inquiries and revenue performance',
      icon: BarChart2,
      href: `${base}/analytics`,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Boundary',
      description: 'Draw and verify property boundary on map',
      icon: Map,
      href: `${base}/boundary`,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Marketing',
      description: 'Shareable links and social promotion',
      icon: Megaphone,
      href: `${base}/marketing`,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Rental History',
      description: 'Past and current tenants',
      icon: History,
      href: `${base}/rental-history`,
      color: 'bg-pink-50 text-pink-600',
    },
  ];

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (isError || !property) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-red-500">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
          Failed to load property. Please try again.
        </CardContent>
      </Card>
    );
  }

  // ── Primary image ────────────────────────────────────────────────────────

  const primaryImage =
    property.images?.find((img) => img.isPrimary)?.url ??
    property.images?.[0]?.url ??
    null;

  return (
    <div className="space-y-6">
      {/* Back + heading */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Property hero card */}
      <Card className="overflow-hidden">
        {primaryImage && (
          <div className="h-52 w-full overflow-hidden sm:h-64">
            <img
              src={primaryImage}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl">{property.title}</CardTitle>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {property.address}, {property.city}, {property.state}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={statusColors[property.status] ?? 'bg-gray-100 text-gray-700'}>
                {property.status}
              </Badge>
              {property.boundaryVerified ? (
                <Badge className="bg-green-50 text-green-700 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Boundary Verified
                </Badge>
              ) : (
                <Badge className="bg-orange-50 text-orange-700 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Boundary Pending
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key stats row */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {property.structure === 'MULTI_FAMILY' ? (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4 text-gray-400" />
                {property.totalUnits ?? 0} units · {property.availableUnits ?? 0} available
              </span>
            ) : (
              <>
                {property.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-4 w-4 text-gray-400" />
                    {property.bedrooms} bed
                  </span>
                )}
                {property.bathrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-gray-400" />
                    {property.bathrooms} bath
                  </span>
                )}
                {property.area && (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-4 w-4 text-gray-400" />
                    {property.area}
                  </span>
                )}
              </>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-400" />
              Updated {new Date(property.updatedAt).toLocaleDateString('en-NG')}
            </span>
          </div>

          {/* Price */}
          {property.price != null && (
            <p className="text-2xl font-bold text-green-600">
              {formatNGN(Number(property.price), property.currency)}
              <span className="ml-1 text-sm font-normal text-gray-500">/ month</span>
            </p>
          )}

          {/* Description */}
          <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">
            {property.description}
          </p>
        </CardContent>
      </Card>

      {/* Management nav cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Manage Property
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {navCards.map(({ label, description, icon: Icon, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <div className={`rounded-lg p-2 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}