import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsLoading from "../loading";
import PropertyEditForm from "@/components/properties/PropertyEditForm";

type Props = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Edit Property | NewCondo",
  description: "Edit your property listing details",
};

export default function EditPropertyPage({ params }: Props) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<PropertyDetailsLoading />}>
        <PropertyEditForm propertyId={params.id} />
      </Suspense>
    </div>
  );
}