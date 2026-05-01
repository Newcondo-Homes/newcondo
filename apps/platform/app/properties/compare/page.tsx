'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PropertyComparison } from '@/components/properties/PropertyComparison';
import { Button } from '@newcondo/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { propertyApi } from '@/lib/api/properties';


interface CompareProperty {
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

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const propertyIds = searchParams.get('ids')?.split(',') || [];

  const [compareList, setCompareList] = useState<CompareProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyIds.length === 0) return;
 
    let cancelled = false;
    setIsLoading(true);
    setError(null);
 
    Promise.all(propertyIds.map((id) => propertyApi.getById(id)))
      .then((results) => {
        if (cancelled) return;
        // Map API response to the shape PropertyComparison expects
        const mapped: CompareProperty[] = results.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: Number(p.price ?? 0),
          currency: p.currency,
          address: p.address,
          city: p.city,
          state: p.state,
          propertyType: p.propertyType as string,
          structure: p.structure as string,
          bedrooms: p.bedrooms ?? undefined,
          bathrooms: p.bathrooms ?? undefined,
          area: p.area ?? undefined,
          features: p.features ?? [],
          images: (p.images ?? []).map((img) => ({
            id: img.id,
            url: img.url,
            altText: img.altText ?? undefined,
            isPrimary: img.isPrimary,
          })),
          totalUnits: p.totalUnits ?? undefined,
          availableUnits: p.availableUnits ?? undefined,
          isAvailable: p.isAvailable,
          viewCount: p.viewCount,
          favoriteCount: p.favoriteCount,
          ownerId: p.ownerId,
          agentId: p.agentId ?? undefined,
          createdAt: new Date(p.createdAt).toISOString(),
        }));
        setCompareList(mapped);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load one or more properties.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
 
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('ids')]);

  // Sync list changes back into the URL so the page stays shareable
  const syncIdsToUrl = (list: CompareProperty[]) => {
    const ids = list.map((p) => p.id).join(',');
    const url = ids ? `/properties/compare?ids=${ids}` : '/properties/compare';
    router.replace(url, { scroll: false });
  };
 
  const handleRemove = (propertyId: string) => {
    const updated = compareList.filter((p) => p.id !== propertyId);
    setCompareList(updated);
    syncIdsToUrl(updated);
  };
 
  const handleClear = () => {
    setCompareList([]);
    router.replace('/properties/compare', { scroll: false });
  };

  if (propertyIds.length === 0 && compareList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Compare Properties</h1>
          <p className="text-gray-600 mb-6">No properties selected for comparison.</p>
          <Button asChild>
            <Link href="/properties">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Properties
            </Link>
          </Button>
        </div>
      </div>
    );
  }

   if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        <p>{error}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/properties">Back to Browse</Link>
        </Button>
      </div>
    );
  }
 
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Compare Properties</h1>
        <Button variant="outline" asChild>
          <Link href="/properties">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Link>
        </Button>
      </div>
      <PropertyComparison
        compareList={compareList}
        onRemoveFromCompare={handleRemove}
        onClearCompare={handleClear}
        maxCompare={4}
      />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}