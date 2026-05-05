import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsLoading from "./loading";
import PropertyManagementContent from "@/components/properties/PropertyManagementContent";

type Props = {
  params: { id: string };
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Property Details | NewCondo`,
    description: "View and manage property details",
  };
}

export default function PropertyDetailsPage({ params }: Props) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<PropertyDetailsLoading />}>
        <PropertyManagementContent propertyId={params.id} />
      </Suspense>
    </div>
  );
}