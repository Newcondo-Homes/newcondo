'use client';
// apps/platform/app/(dashboard)/properties/my-properties/[id]/edit/_components/EditPropertyContent.tsx

import { notFound, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PropertyEditForm } from '@/components/properties/PropertyEditForm';
import { propertyApi, UpdatePropertyPayload } from '@/lib/api/properties';
import { PropertyType } from '@newcondo/db';
import { Card, CardContent } from '@newcondo/ui/components/card';
import { Skeleton } from '@newcondo/ui/components/skeleton';

type PropertyFormData = {
  title: string;
  description: string;
  propertyType: PropertyType;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  address: string;
  city: string;
  state: string;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
};

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

export default function EditPropertyContent({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyApi.getById(propertyId),
    staleTime: 5 * 60 * 1000,
  });

  const { mutateAsync: updateProperty } = useMutation({
    mutationFn: (data: PropertyFormData) => {
      const payload: UpdatePropertyPayload = { id: propertyId, ...data };
      return propertyApi.update(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] });
    },
  });

  const handleSave = async (data: PropertyFormData) => {
    await updateProperty(data);
    router.push(`/dashboard/properties/my-properties/${propertyId}`);
  };

  const handleCancel = () => router.back();

  if (isLoading) return <EditPropertyLoading />;

  if (isError || !property) {
    notFound();
  }

  const formProperty: PropertyFormData & { id: string } = {
    id: property.id,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
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