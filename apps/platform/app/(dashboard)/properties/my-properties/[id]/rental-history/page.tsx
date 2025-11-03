import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsLoading from "../loading";
import RentalHistory from "@/components/properties/RentalHistory";

type Props = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Rental History | NewCondo",
  description: "View rental history and tenant information for your property",
};

export default function RentalHistoryPage({ params }: Props) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<PropertyDetailsLoading />}>
        <RentalHistory propertyId={params.id} />
      </Suspense>
    </div>
  );
}