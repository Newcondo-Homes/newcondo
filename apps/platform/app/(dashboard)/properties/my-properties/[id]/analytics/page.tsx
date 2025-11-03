import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsLoading from "../loading";
import PropertyAnalytics from "@/components/properties/PropertyAnalytics";

type Props = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Property Analytics | NewCondo",
  description: "View detailed analytics and performance metrics for your property",
};

export default function PropertyAnalyticsPage({ params }: Props) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<PropertyDetailsLoading />}>
        <PropertyAnalytics propertyId={params.id} />
      </Suspense>
    </div>
  );
}