// apps/platform/app/properties/page.tsx

import { Metadata } from 'next';
import Navbar from '@/components/shared/navigation/Navbar';
import PropertiesPageClient from './_components/PropertiesPageClient';

export const metadata: Metadata = {
  title: 'Browse Properties | NewCondo',
  description:
    'Discover amazing rental properties across Nigeria. Filter by location, price, and amenities.',
};

interface PropertiesPageProps {
  searchParams: {
    search?: string;
    city?: string;
    state?: string;
    propertyType?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    features?: string;
    sortBy?: string;
    page?: string;
  };
}

export default function PropertiesPage({ searchParams }: PropertiesPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <section className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Browse Properties
            </h1>
            <p className="text-gray-600">
              Find your perfect home from thousands of verified listings
            </p>
          </div>

          {/*
           * PropertiesPageClient is a single 'use client' boundary that owns
           * ALL state for the search bar, sidebar filters, and property grid.
           * It receives the initial URL params as plain serialisable props so
           * the server component doesn't need to import any client hooks.
           */}
          <PropertiesPageClient initialSearchParams={searchParams} />
        </div>
      </section>
    </div>
  );
}