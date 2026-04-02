'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {PropertyComparison} from '@/components/properties/PropertyComparison';
import { Button } from '@newcondo/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function CompareContent() {
  const searchParams = useSearchParams();
  const propertyIds = searchParams.get('ids')?.split(',') || [];

  if (propertyIds.length === 0) {
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
      <PropertyComparison propertyIds={propertyIds} />
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