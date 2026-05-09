import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsLoading from "./loading";
import PropertyManagementContent from "@/components/properties/PropertyManagementContent";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Property Details | NewCondo`,
    description: "View and manage property details",
  };
}

export default async function PropertyDetailsPage({ params }: Props) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<PropertyDetailsLoading />}>
        <PropertyManagementContent propertyId={id} />
      </Suspense>
    </div>
  );
}