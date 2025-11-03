import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsLoading from "../loading";
import PropertyMarketing from "@/components/properties/PropertyMarketing";

type Props = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Property Marketing | NewCondo",
  description: "Manage property promotion, sharing, and marketing tools",
};

export default function PropertyMarketingPage({ params }: Props) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<PropertyDetailsLoading />}>
        <PropertyMarketing propertyId={params.id} />
      </Suspense>
    </div>
  );
}