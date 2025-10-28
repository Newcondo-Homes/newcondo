// apps/admin/src/app/(dashboard)/properties/page.tsx
import { Suspense } from 'react';
import { PropertyList } from '@/components/admin/properties/PropertyList';
import { PropertyFilters } from '@/components/admin/properties/PropertyFilters';
import { PropertyStats } from '@/components/admin/properties/PropertyStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';

export const metadata = {
  title: 'Properties | Admin Dashboard',
  description: 'Manage property listings, approvals, and boundary verification',
};

export default function PropertiesPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    approvalStatus?: string;
    boundaryVerified?: string;
    structure?: string;
    propertyType?: string;
    state?: string;
    city?: string;
    search?: string;
    page?: string;
  };
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Property Management</h1>
        <p className="text-muted-foreground mt-2">
          Review, approve, and manage property listings with boundary verification
        </p>
      </div>

      {/* Stats Overview */}
      <Suspense fallback={<StatsLoading />}>
        <PropertyStats />
      </Suspense>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Properties</CardTitle>
          <CardDescription>
            Search and filter properties by status, location, type, and boundary verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyFilters />
        </CardContent>
      </Card>

      {/* Property List */}
      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>
            {searchParams.approvalStatus && `Showing ${searchParams.approvalStatus.toLowerCase()} properties`}
            {searchParams.boundaryVerified && ` • Boundary ${searchParams.boundaryVerified === 'true' ? 'verified' : 'unverified'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PropertyListLoading />}>
            <PropertyList searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PropertyListLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <div className="h-20 w-20 bg-muted animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}