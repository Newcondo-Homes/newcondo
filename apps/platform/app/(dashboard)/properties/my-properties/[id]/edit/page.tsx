'use client';
// apps/platform/app/(dashboard)/properties/my-properties/[id]/edit/page.tsx

import { notFound, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PropertyEditForm } from '@/components/properties/PropertyEditForm';
import { propertyApi } from '@/lib/api/properties';
import { Card, CardContent } from '@newcondo/ui/components/card';
import { Skeleton } from '@newcondo/ui/components/skeleton';

type Props = {
  params: { id: string };
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function EditPropertyLoading() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-32 ml-auto" />
      </CardContent>
    </Card>
  );
}

// ─── Inner client component that fetches + renders the form ──────────────────

function EditPropertyContent({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyApi.getById(propertyId),
    staleTime: 5 * 60 * 1000,
  });

  const { mutateAsync: updateProperty } = useMutation({
    mutationFn: (data: any) => propertyApi.update({ id: propertyId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] });
    },
  });

  const handleSave = async (data: any) => {
    await updateProperty(data);
    router.push(`/dashboard/properties/my-properties/${propertyId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) return <EditPropertyLoading />;

  if (isError || !property) {
    notFound();
  }

  // Shape the fetched property into what PropertyEditForm expects
  const formProperty = {
    id: property.id,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType as string,
    price: Number(property.price ?? 0),
    bedrooms: property.bedrooms ?? undefined,
    bathrooms: property.bathrooms ?? undefined,
    area: property.area ?? undefined,
    features: property.features ?? [],
    address: property.address,
    city: property.city,
    state: property.state,
    structure: property.structure as 'SINGLE_UNIT' | 'MULTI_FAMILY',
  };

  return (
    <PropertyEditForm
      property={formProperty}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditPropertyPage({ params }: Props) {
  return (
    <div className="container mx-auto p-6">
      <EditPropertyContent propertyId={params.id} />
    </div>
  );
}