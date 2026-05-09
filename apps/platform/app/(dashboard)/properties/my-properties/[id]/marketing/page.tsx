import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsLoading from "../loading";
import PropertyMarketing from "@/components/properties/PropertyMarketing";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Property Marketing | NewCondo",
  description: "Manage property promotion, sharing, and marketing tools",
};

export default async function PropertyMarketingPage({ params }: Props) {
  const { id } = await params

  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<PropertyDetailsLoading />}>
        <PropertyMarketing propertyId={id} />
      </Suspense>
    </div>
  );
}