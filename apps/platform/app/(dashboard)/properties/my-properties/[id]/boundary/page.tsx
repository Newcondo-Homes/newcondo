import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsLoading from "../loading";
import BoundaryManagement from "@/components/properties/BoundaryManagement";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Property Boundary Management | NewCondo",
  description: "View and update property boundary markers and masks",
};

export default async function BoundaryManagementPage({ params }: Props) {
  const { id } = await params

  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<PropertyDetailsLoading />}>
        <BoundaryManagement propertyId={id} />
      </Suspense>
    </div>
  );
}