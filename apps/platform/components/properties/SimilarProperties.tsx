'use client';
// apps/platform/components/properties/SimilarProperties.tsx

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { MapPin, BedDouble, Bath, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import { propertyApi } from '@/lib/api/properties';
import type { PropertyType } from '@newcondo/db';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimilarPropertiesProps {
  currentPropertyId: string;
  city: string;
  propertyType: string;
  priceRange?: { min: number; max: number };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SimilarProperties({
  currentPropertyId,
  city,
  propertyType,
  priceRange,
}: SimilarPropertiesProps) {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['similar-properties', currentPropertyId, city, propertyType],
    queryFn: () =>
      propertyApi.getAll({
        city,
        propertyType: propertyType as PropertyType,
        minPrice: priceRange?.min,
        maxPrice: priceRange?.max,
        isAvailable: true,
        limit: 4,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    staleTime: 10 * 60 * 1000,
    select: (data) => ({
      ...data,
      // Exclude the current property from results
      properties: data.properties.filter((p) => p.id !== currentPropertyId),
    }),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <div className="h-44 bg-gray-200" />
            <CardContent className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const similar = data?.properties ?? [];

  if (similar.length === 0) {
    return (
      <p className="text-sm text-gray-500">No similar properties found in {city} right now.</p>
    );
  }

  const formatNGN = (amount: number, currency = 'NGN') =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {similar.slice(0, 4).map((property) => {
          const primaryImage =
            property.images?.find((img) => img.isPrimary)?.url ??
            property.images?.[0]?.url ??
            null;

          const minUnitPrice =
            property.structure === 'MULTI_FAMILY' && property.units?.length
              ? Math.min(...property.units.map((u) => Number(u.price)))
              : null;

          const displayPrice = minUnitPrice ?? (property.price != null ? Number(property.price) : null);

          return (
            <Card
              key={property.id}
              className="group cursor-pointer overflow-hidden transition hover:shadow-lg"
              onClick={() => router.push(`/properties/${property.id}`)}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-gray-100">
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">
                    No image
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-white/90 text-gray-700 text-xs">
                    {property.propertyType?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-violet-700 transition-colors">
                  {property.title}
                </h4>

                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {property.city}, {property.state}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {property.bedrooms != null && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {property.bedrooms} bed
                    </span>
                  )}
                  {property.bathrooms != null && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      {property.bathrooms} bath
                    </span>
                  )}
                  {property.area && <span>{property.area}</span>}
                </div>

                {displayPrice != null && (
                  <p className="font-bold text-green-600">
                    {minUnitPrice ? 'From ' : ''}
                    {formatNGN(displayPrice, property.currency)}
                    <span className="ml-1 text-xs font-normal text-gray-500">/ mo</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View all link */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(
              `/properties?city=${encodeURIComponent(city)}&type=${encodeURIComponent(propertyType)}`
            )
          }
          className="gap-1 text-violet-600 hover:text-violet-700"
        >
          View all in {city}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}