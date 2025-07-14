// apps/platform/app/(dashboard)/properties/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPropertyById } from '@/lib/api/properties';
import { getCurrentUser } from '@/lib/auth';
import PropertyDetailsView from '@/components/property/property-details-view';
import { Card, CardContent } from '@newcondo/ui/';
import { Skeleton } from '@newcondo/ui/';

interface PropertyDetailsPageProps {
  params: {
    id: string;
  };
}

async function PropertyDetailsContent({ propertyId }: { propertyId: string }) {
  const [property, user] = await Promise.all([
    getPropertyById(propertyId),
    getCurrentUser(),
  ]);

  if (!property) {
    notFound();
  }

  return (
    <PropertyDetailsView 
      property={property} 
      currentUser={user}
      canEdit={user?.id === property.ownerId || user?.id === property.agentId}
    />
  );
}

function PropertyDetailsLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PropertyDetailsPage({ params }: PropertyDetailsPageProps) {
  return (
    <Suspense fallback={<PropertyDetailsLoading />}>
      <PropertyDetailsContent propertyId={params.id} />
    </Suspense>
  );
}